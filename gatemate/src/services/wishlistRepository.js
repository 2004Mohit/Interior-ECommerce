/**
 * Ferrado Wishlist Repository
 *
 * Responsibilities:
 * - Persist customer wishlist items in Supabase
 * - Read actual vendor_products
 * - Never use localStorage for authenticated wishlist data
 * - Never use demo product data
 * - Return product objects compatible with WishlistContext / Wishlist.jsx
 */

import { supabase } from "../lib/supabaseClient";

const PRODUCT_SELECT = `
  id,
  slug,
  name,
  brand,
  category_slug,
  unit,
  sku,
  price,
  original_price,
  moq,
  is_express_30min_available,
  description,
  features,
  image_urls,
  cover_image_url,
  status,
  created_at,
  updated_at,
  product_categories:category_slug (
    slug,
    name,
    descriptor,
    image_url
  )
`;

const requireUserId = (userId) => {
  if (!userId) {
    throw new Error(
      "AUTH_REQUIRED: You must be signed in to manage your wishlist.",
    );
  }
};

const getProductImage = (product) => {
  if (product?.cover_image_url) {
    return product.cover_image_url;
  }

  if (Array.isArray(product?.image_urls) && product.image_urls.length > 0) {
    return product.image_urls[0];
  }

  return "";
};

const normalizeProduct = (product) => {
  if (!product) {
    return null;
  }

  const category = Array.isArray(product.product_categories)
    ? product.product_categories[0]
    : product.product_categories;

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand || "",
    categorySlug: product.category_slug || "",
    category: category?.name || product.category_slug || "Construction Product",

    unit: product.unit || "Unit",

    sku: product.sku || "",

    price: Number(product.price || 0),

    originalPrice:
      product.original_price !== null && product.original_price !== undefined
        ? Number(product.original_price)
        : null,

    moq: Number(product.moq || 1),

    isExpress30MinAvailable: Boolean(product.is_express_30min_available),

    description: product.description || "",

    features: Array.isArray(product.features) ? product.features : [],

    images: Array.isArray(product.image_urls) ? product.image_urls : [],

    imageUrls: Array.isArray(product.image_urls) ? product.image_urls : [],

    coverImageUrl: product.cover_image_url || "",

    img: getProductImage(product),

    status: product.status,

    createdAt: product.created_at || null,
    updatedAt: product.updated_at || null,

    /*
     * Kept for compatibility with existing customer components.
     */
    tag: product.is_express_30min_available ? "30-MIN" : "",

    originalRow: product,
  };
};

const getWishlistProductIds = async (userId) => {
  requireUserId(userId);

  const { data, error } = await supabase
    .from("customer_wishlists")
    .select("product_id, created_at")
    .eq("user_id", userId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("wishlistRepository.getWishlistProductIds:", error);

    throw error;
  }

  return data || [];
};

export const wishlistRepository = {
  /**
   * Get the authenticated customer's wishlist.
   *
   * Only PUBLISHED products are returned to the customer.
   */
  async getWishlist(userId) {
    requireUserId(userId);

    const wishlistRows = await getWishlistProductIds(userId);

    if (wishlistRows.length === 0) {
      return [];
    }

    const productIds = wishlistRows
      .map((row) => row.product_id)
      .filter(Boolean);

    if (productIds.length === 0) {
      return [];
    }

    const { data: products, error } = await supabase
      .from("vendor_products")
      .select(PRODUCT_SELECT)
      .in("id", productIds)
      .eq("status", "PUBLISHED");

    if (error) {
      console.error("wishlistRepository.getWishlist:", error);

      throw error;
    }

    /*
     * Preserve the customer's wishlist order rather than
     * relying on the database's product ordering.
     */
    const productMap = new Map(
      (products || []).map((product) => [product.id, product]),
    );

    return productIds
      .map((productId) => normalizeProduct(productMap.get(productId)))
      .filter(Boolean);
  },

  /**
   * Check whether a product is already saved.
   */
  async isInWishlist(userId, productId) {
    requireUserId(userId);

    if (!productId) {
      return false;
    }

    const { data, error } = await supabase
      .from("customer_wishlists")
      .select("product_id")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .maybeSingle();

    if (error) {
      console.error("wishlistRepository.isInWishlist:", error);

      throw error;
    }

    return Boolean(data);
  },

  /**
   * Add a published product to the customer's wishlist.
   */
  async addToWishlist(userId, productId) {
    requireUserId(userId);

    if (!productId) {
      throw new Error("INVALID_PRODUCT: A valid product is required.");
    }

    /*
     * Verify that the product currently exists and is
     * published before saving it.
     */
    const { data: product, error: productError } = await supabase
      .from("vendor_products")
      .select("id, status")
      .eq("id", productId)
      .eq("status", "PUBLISHED")
      .maybeSingle();

    if (productError) {
      console.error(
        "wishlistRepository.addToWishlist product check:",
        productError,
      );

      throw productError;
    }

    if (!product) {
      throw new Error(
        "PRODUCT_UNAVAILABLE: This product is no longer available.",
      );
    }

    /*
     * Primary key (user_id, product_id) prevents duplicates.
     */
    const { error } = await supabase.from("customer_wishlists").upsert(
      {
        user_id: userId,
        product_id: productId,
      },
      {
        onConflict: "user_id,product_id",
        ignoreDuplicates: true,
      },
    );

    if (error) {
      console.error("wishlistRepository.addToWishlist:", error);

      throw error;
    }

    return await this.getWishlist(userId);
  },

  /**
   * Remove one product from the customer's wishlist.
   */
  async removeFromWishlist(userId, productId) {
    requireUserId(userId);

    if (!productId) {
      return await this.getWishlist(userId);
    }

    const { error } = await supabase
      .from("customer_wishlists")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);

    if (error) {
      console.error("wishlistRepository.removeFromWishlist:", error);

      throw error;
    }

    return await this.getWishlist(userId);
  },

  /**
   * Remove every saved product.
   */
  async clearWishlist(userId) {
    requireUserId(userId);

    const { error } = await supabase
      .from("customer_wishlists")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("wishlistRepository.clearWishlist:", error);

      throw error;
    }

    return [];
  },
};
