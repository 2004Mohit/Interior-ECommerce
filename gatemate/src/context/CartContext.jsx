import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

const LOCAL_CART_KEY = "gatemate_cart";

/* -------------------------------------------------------------------------- */
/* LOCAL CART                                                                 */
/* -------------------------------------------------------------------------- */

const getLocalCart = () => {
  try {
    const saved = localStorage.getItem(LOCAL_CART_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Ferrado Cart: failed to read local cart:", error);

    return [];
  }
};

/* -------------------------------------------------------------------------- */
/* PRODUCT MAPPING                                                            */
/* -------------------------------------------------------------------------- */

const mapProductToCartItem = (product, quantity) => {
  const image =
    product.cover_image_url ||
    (Array.isArray(product.image_urls) && product.image_urls.length > 0
      ? product.image_urls[0]
      : "");

  return {
    ...product,

    id: product.id,

    name: product.name,
    brand: product.brand || "",

    category: product.category_slug || "",
    categorySlug: product.category_slug || "",

    unit: product.unit || "",
    sku: product.sku || "",

    price: Number(product.price || 0),

    originalPrice:
      product.original_price !== null && product.original_price !== undefined
        ? Number(product.original_price)
        : null,

    moq: Number(product.moq || 1),

    description: product.description || "",

    image_urls: Array.isArray(product.image_urls) ? product.image_urls : [],

    cover_image_url: product.cover_image_url || null,

    img: image,

    isExpress30MinAvailable: Boolean(product.is_express_30min_available),

    quantity: Number(quantity || 1),
  };
};

/* -------------------------------------------------------------------------- */
/* DATABASE CART -> FRONTEND CART                                             */
/* -------------------------------------------------------------------------- */

const buildCartFromDatabase = (cartRows, products) => {
  const productMap = new Map(products.map((product) => [product.id, product]));

  return cartRows
    .map((row) => {
      const product = productMap.get(row.product_id);

      if (!product) {
        return null;
      }

      return mapProductToCartItem(product, Number(row.quantity || 0));
    })
    .filter((item) => item && Number(item.quantity) > 0);
};

/* -------------------------------------------------------------------------- */
/* CART PROVIDER                                                              */
/* -------------------------------------------------------------------------- */

export const CartProvider = ({ children }) => {
  const { user } = useAuth();

  const [cart, setCart] = useState(() => getLocalCart());

  const cartRef = useRef(cart);

  const previousUserIdRef = useRef(null);

  const hydrationInProgressRef = useRef(false);

  /*
   * Keep latest cart available synchronously.
   */
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  /* ------------------------------------------------------------------------ */
  /* AUTHENTICATED CART HYDRATION                                             */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let cancelled = false;

    const hydrateAuthenticatedCart = async () => {
      const userId = user?.id || null;

      /*
       * ------------------------------------------------------------------
       * LOGGED OUT
       * ------------------------------------------------------------------
       */

      if (!userId) {
        previousUserIdRef.current = null;

        if (!cancelled) {
          const localCart = getLocalCart();

          cartRef.current = localCart;

          setCart(localCart);
        }

        return;
      }

      /*
       * Avoid repeatedly loading the same customer's cart.
       */

      if (
        previousUserIdRef.current === userId &&
        !hydrationInProgressRef.current
      ) {
        return;
      }

      previousUserIdRef.current = userId;

      hydrationInProgressRef.current = true;

      try {
        /*
         * Load authoritative database cart.
         */

        const { data: databaseRows, error: cartError } = await supabase
          .from("customer_carts")
          .select("id,user_id,product_id,quantity")
          .eq("user_id", userId);

        if (cartError) {
          throw new Error(`Unable to load customer cart: ${cartError.message}`);
        }

        const dbRows = Array.isArray(databaseRows) ? databaseRows : [];

        /*
         * Load local guest cart.
         */

        const localCart = getLocalCart();

        /*
         * Merge local cart into database
         * cart when logging in.
         */

        const quantityMap = new Map();

        dbRows.forEach((row) => {
          const quantity = Number(row.quantity || 0);

          if (quantity > 0) {
            quantityMap.set(row.product_id, quantity);
          }
        });

        localCart.forEach((item) => {
          if (!item?.id) {
            return;
          }

          const quantity = Number(item.quantity || 0);

          if (quantity <= 0) {
            return;
          }

          const current = quantityMap.get(item.id) || 0;

          quantityMap.set(item.id, current + quantity);
        });

        /*
         * Synchronize merged quantities
         * to database.
         */

        for (const [productId, quantity] of quantityMap.entries()) {
          const existing = dbRows.find((row) => row.product_id === productId);

          if (existing) {
            const { error } = await supabase
              .from("customer_carts")
              .update({
                quantity,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existing.id)
              .eq("user_id", userId);

            if (error) {
              throw new Error(
                `Unable to synchronize cart item: ${error.message}`,
              );
            }
          } else {
            const { error } = await supabase.from("customer_carts").insert({
              user_id: userId,
              product_id: productId,
              quantity,
            });

            if (error) {
              throw new Error(`Unable to add cart item: ${error.message}`);
            }
          }
        }

        /*
         * Reload authoritative cart after
         * synchronization.
         */

        const { data: finalRows, error: finalError } = await supabase
          .from("customer_carts")
          .select("id,user_id,product_id,quantity")
          .eq("user_id", userId);

        if (finalError) {
          throw new Error(
            `Unable to reload customer cart: ${finalError.message}`,
          );
        }

        const authoritativeRows = Array.isArray(finalRows) ? finalRows : [];

        /*
         * Load products.
         */

        const productIds = [
          ...new Set(
            authoritativeRows.map((row) => row.product_id).filter(Boolean),
          ),
        ];

        let products = [];

        if (productIds.length > 0) {
          const { data: productRows, error: productError } = await supabase
            .from("vendor_products")
            .select(
              `
                  id,
                  name,
                  brand,
                  category_slug,
                  unit,
                  sku,
                  price,
                  original_price,
                  moq,
                  description,
                  image_urls,
                  cover_image_url,
                  is_express_30min_available,
                  status
                `,
            )
            .in("id", productIds)
            .eq("status", "PUBLISHED");

          if (productError) {
            throw new Error(
              `Unable to load cart products: ${productError.message}`,
            );
          }

          products = Array.isArray(productRows) ? productRows : [];
        }

        if (cancelled) {
          return;
        }

        const hydratedCart = buildCartFromDatabase(authoritativeRows, products);

        cartRef.current = hydratedCart;

        setCart(hydratedCart);

        /*
         * Local cart has now been
         * migrated.
         */

        localStorage.removeItem(LOCAL_CART_KEY);
      } catch (error) {
        console.error(
          "Ferrado Cart: failed to hydrate authenticated cart:",
          error,
        );

        /*
         * Never destroy the user's local
         * cart if DB hydration fails.
         */

        if (!cancelled) {
          const localCart = getLocalCart();

          cartRef.current = localCart;

          setCart(localCart);
        }
      } finally {
        hydrationInProgressRef.current = false;
      }
    };

    hydrateAuthenticatedCart();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  /* ------------------------------------------------------------------------ */
  /* LOCAL STORAGE FOR GUEST USERS                                            */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (user?.id) {
      return;
    }

    try {
      localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error("Ferrado Cart: failed to save local cart:", error);
    }
  }, [cart, user?.id]);

  /* ------------------------------------------------------------------------ */
  /* ADD TO CART                                                              */
  /* ------------------------------------------------------------------------ */

  /**
   * quantity is optional.
   *
   * Examples:
   *
   * addToCart(product)
   * addToCart(product, 10)
   *
   * For products with MOQ 10, ProductDetails
   * can pass quantity = 10 directly.
   */
  const addToCart = async (product, quantity = 1) => {
    if (!product?.id) {
      console.error("Ferrado Cart: cannot add product without an id.");

      return false;
    }

    const requestedQuantity = Math.max(1, Number(quantity || 1));

    const minimumOrderQuantity = Math.max(1, Number(product.moq || 1));

    /*
     * Never allow adding below MOQ.
     */

    const quantityToAdd = Math.max(requestedQuantity, minimumOrderQuantity);

    const previousCart = cartRef.current;

    const existingItem = previousCart.find((item) => item.id === product.id);

    const existingQuantity = existingItem
      ? Number(existingItem.quantity || 0)
      : 0;

    /*
     * If product already exists:
     *
     * 10 existing + 10 requested = 20
     *
     * If product does not exist:
     *
     * 0 + 10 = 10
     */

    const newQuantity = existingQuantity + quantityToAdd;

    const nextCart = existingItem
      ? previousCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: newQuantity,
              }
            : item,
        )
      : [
          ...previousCart,
          {
            ...product,
            quantity: quantityToAdd,
          },
        ];

    /*
     * Update UI immediately.
     */

    cartRef.current = nextCart;

    setCart(nextCart);

    /*
     * Guest cart.
     */

    if (!user?.id) {
      return true;
    }

    try {
      /*
       * IMPORTANT:
       *
       * Use UPSERT instead of:
       *
       * SELECT -> INSERT
       *
       * because SELECT -> INSERT is vulnerable
       * to simultaneous requests creating the
       * same unique cart row.
       *
       * uq_customer_cart_item prevents duplicates.
       */

      const { error } = await supabase.from("customer_carts").upsert(
        {
          user_id: user.id,
          product_id: product.id,
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,product_id",
        },
      );

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error(
        "Ferrado Cart: failed to synchronize added product:",
        error,
      );

      /*
       * Roll back UI if DB operation fails.
       */

      cartRef.current = previousCart;

      setCart(previousCart);

      return false;
    }
  };

  /* ------------------------------------------------------------------------ */
  /* REMOVE FROM CART                                                         */
  /* ------------------------------------------------------------------------ */

  const removeFromCart = async (id) => {
    if (!id) {
      return false;
    }

    const previousCart = cartRef.current;

    const nextCart = previousCart.filter((item) => item.id !== id);

    cartRef.current = nextCart;

    setCart(nextCart);

    if (!user?.id) {
      return true;
    }

    try {
      const { error } = await supabase
        .from("customer_carts")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error(
        "Ferrado Cart: failed to remove database cart item:",
        error,
      );

      cartRef.current = previousCart;

      setCart(previousCart);

      return false;
    }
  };

  /* ------------------------------------------------------------------------ */
  /* UPDATE QUANTITY                                                          */
  /* ------------------------------------------------------------------------ */

  const updateQuantity = async (id, delta) => {
    if (!id || !Number.isFinite(Number(delta))) {
      return false;
    }

    const previousCart = cartRef.current;

    const existingItem = previousCart.find((item) => item.id === id);

    if (!existingItem) {
      return false;
    }

    const currentQuantity = Number(existingItem.quantity || 0);

    const minimumOrderQuantity = Math.max(1, Number(existingItem.moq || 1));

    const requestedQuantity = currentQuantity + Number(delta);

    /*
     * Respect MOQ.
     *
     * Example:
     * MOQ = 10
     * Current = 10
     * Decrease -> remains 10
     */

    const newQuantity = Math.max(minimumOrderQuantity, requestedQuantity);

    /*
     * If somehow quantity is already invalid,
     * don't create an invalid database value.
     */

    if (newQuantity <= 0) {
      return removeFromCart(id);
    }

    const nextCart = previousCart.map((item) =>
      item.id === id
        ? {
            ...item,
            quantity: newQuantity,
          }
        : item,
    );

    cartRef.current = nextCart;

    setCart(nextCart);

    if (!user?.id) {
      return true;
    }

    try {
      const { error } = await supabase
        .from("customer_carts")
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("product_id", id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error(
        "Ferrado Cart: failed to update database cart quantity:",
        error,
      );

      cartRef.current = previousCart;

      setCart(previousCart);

      return false;
    }
  };

  /* ------------------------------------------------------------------------ */
  /* CLEAR CART                                                               */
  /* ------------------------------------------------------------------------ */

  const clearCart = async () => {
    const previousCart = cartRef.current;

    cartRef.current = [];

    setCart([]);

    if (!user?.id) {
      localStorage.removeItem(LOCAL_CART_KEY);

      return true;
    }

    try {
      const { error } = await supabase
        .from("customer_carts")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      localStorage.removeItem(LOCAL_CART_KEY);

      return true;
    } catch (error) {
      console.error("Ferrado Cart: failed to clear database cart:", error);

      cartRef.current = previousCart;

      setCart(previousCart);

      return false;
    }
  };

  /* ------------------------------------------------------------------------ */
  /* SUBTOTAL                                                                 */
  /* ------------------------------------------------------------------------ */

  const subtotal = cart.reduce(
    (acc, item) => acc + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  );

  /* ------------------------------------------------------------------------ */
  /* PROVIDER                                                                 */
  /* ------------------------------------------------------------------------ */

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
