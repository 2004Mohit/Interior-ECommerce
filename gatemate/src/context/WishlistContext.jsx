import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { wishlistRepository } from "../services/wishlistRepository";

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [pendingWishlistProduct, setPendingWishlistProduct] = useState(null);

  const [authModalRequired, setAuthModalRequired] = useState(false);

  /**
   * Load the authenticated customer's wishlist.
   */
  const fetchWishlist = useCallback(async () => {
    if (!user?.id) {
      setWishlist([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const items = await wishlistRepository.getWishlist(user.id);

      setWishlist(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("WishlistContext.fetchWishlist:", err);

      setWishlist([]);
      setError(err?.message || "Unable to load your saved products.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Load wishlist whenever authentication state is ready
   * or the authenticated user changes.
   */
  useEffect(() => {
    if (!authLoading) {
      fetchWishlist();
    }
  }, [authLoading, fetchWishlist]);

  /**
   * Handle a wishlist action that was requested before
   * authentication.
   *
   * Example:
   * Guest clicks heart -> login -> automatically save
   * the product after authentication succeeds.
   */
  useEffect(() => {
    if (!user?.id || !pendingWishlistProduct) {
      return;
    }

    const productToSave = pendingWishlistProduct;

    setPendingWishlistProduct(null);
    setAuthModalRequired(false);

    const alreadySaved = wishlist.some((item) => item.id === productToSave.id);

    if (alreadySaved) {
      return;
    }

    let cancelled = false;

    const savePendingProduct = async () => {
      try {
        setError(null);

        const updated = await wishlistRepository.addToWishlist(
          user.id,
          productToSave.id,
        );

        if (!cancelled) {
          setWishlist(Array.isArray(updated) ? updated : []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("WishlistContext.pendingWishlistProduct:", err);

          setError(err?.message || "Unable to save this product.");
        }
      }
    };

    savePendingProduct();

    return () => {
      cancelled = true;
    };
  }, [user?.id, pendingWishlistProduct, wishlist]);

  /**
   * Add/remove a product from wishlist.
   *
   * Guests are asked to authenticate first.
   */
  const toggleWishlist = async (product) => {
    if (!product?.id) {
      setError("A valid product is required.");
      return;
    }

    if (!user?.id) {
      setPendingWishlistProduct(product);
      setAuthModalRequired(true);
      return;
    }

    const isExisting = wishlist.some((item) => item.id === product.id);

    try {
      setError(null);

      if (isExisting) {
        const updated = await wishlistRepository.removeFromWishlist(
          user.id,
          product.id,
        );

        setWishlist(Array.isArray(updated) ? updated : []);
      } else {
        const updated = await wishlistRepository.addToWishlist(
          user.id,
          product.id,
        );

        setWishlist(Array.isArray(updated) ? updated : []);
      }
    } catch (err) {
      console.error("WishlistContext.toggleWishlist:", err);

      setError(err?.message || "Unable to update your saved products.");
    }
  };

  /**
   * Remove one product from wishlist.
   */
  const removeFromWishlist = async (productId) => {
    if (!user?.id || !productId) {
      return;
    }

    try {
      setError(null);

      const updated = await wishlistRepository.removeFromWishlist(
        user.id,
        productId,
      );

      setWishlist(Array.isArray(updated) ? updated : []);
    } catch (err) {
      console.error("WishlistContext.removeFromWishlist:", err);

      setError(err?.message || "Unable to remove this product.");
    }
  };

  /**
   * Remove all saved products.
   */
  const clearWishlist = async () => {
    if (!user?.id) {
      return;
    }

    try {
      setError(null);

      const updated = await wishlistRepository.clearWishlist(user.id);

      setWishlist(Array.isArray(updated) ? updated : []);
    } catch (err) {
      console.error("WishlistContext.clearWishlist:", err);

      setError(err?.message || "Unable to clear your saved products.");
    }
  };

  /**
   * Check whether a product is currently saved.
   */
  const isInWishlist = useCallback(
    (productId) => {
      if (!productId) {
        return false;
      }

      return wishlist.some((item) => item.id === productId);
    },
    [wishlist],
  );

  /**
   * Close authentication prompt without performing
   * the pending wishlist action.
   */
  const closeAuthModal = () => {
    setAuthModalRequired(false);
    setPendingWishlistProduct(null);
  };

  /**
   * Clear only the current error.
   */
  const clearError = () => {
    setError(null);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,

        loading,
        error,

        toggleWishlist,
        removeFromWishlist,
        clearWishlist,

        isInWishlist,

        authModalRequired,
        closeAuthModal,

        fetchWishlist,
        clearError,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used inside a WishlistProvider.");
  }

  return context;
};
