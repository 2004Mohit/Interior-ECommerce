import { PRODUCTS_DATA } from "../data/mockData";

const WISHLIST_STORAGE_PREFIX = "gatemate_wishlist_user_";

export const wishlistRepository = {
  /**
   * Retrieves all active wishlist items for the authenticated user.
   * Cross-references product catalog IDs to filter out deleted/retired products.
   */
  async getWishlist(userId) {
    if (!userId) {
      throw new Error(
        "AUTH_REQUIRED: You must be signed in to view your wishlist.",
      );
    }

    // Micro-delay simulating Supabase PostgreSQL query latency
    await new Promise((resolve) => setTimeout(resolve, 150));

    // [TODO: SUPABASE PERSISTENCE]
    // const { data, error } = await supabase
    //   .from('wishlists')
    //   .select('product_id, products(*)')
    //   .eq('user_id', userId);
    // if (error) throw error;
    // return data.map(item => item.products).filter(Boolean);

    const storedKey = `${WISHLIST_STORAGE_PREFIX}${userId}`;
    const rawStored = localStorage.getItem(storedKey);
    const productIds = rawStored ? JSON.parse(rawStored) : ["1", "3"]; // Initial seed for testing

    // Reconcile against catalog and omit retired/deleted items
    const reconciledProducts = productIds
      .map((id) => PRODUCTS_DATA.find((p) => p.id === id))
      .filter(Boolean);

    return reconciledProducts;
  },

  /**
   * Adds a product ID to the user's wishlist record
   */
  async addToWishlist(userId, productId) {
    if (!userId) {
      throw new Error(
        "AUTH_REQUIRED: Please sign in to save items to your wishlist.",
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    // [TODO: SUPABASE PERSISTENCE]
    // const { error } = await supabase
    //   .from('wishlists')
    //   .upsert({ user_id: userId, product_id: productId });
    // if (error) throw error;

    const storedKey = `${WISHLIST_STORAGE_PREFIX}${userId}`;
    const current = JSON.parse(localStorage.getItem(storedKey) || "[]");
    if (!current.includes(productId)) {
      const updated = [...current, productId];
      localStorage.setItem(storedKey, JSON.stringify(updated));
    }

    return await this.getWishlist(userId);
  },

  /**
   * Removes a product ID from the user's wishlist record
   */
  async removeFromWishlist(userId, productId) {
    if (!userId) {
      throw new Error("AUTH_REQUIRED");
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    // [TODO: SUPABASE PERSISTENCE]
    // const { error } = await supabase
    //   .from('wishlists')
    //   .delete()
    //   .match({ user_id: userId, product_id: productId });
    // if (error) throw error;

    const storedKey = `${WISHLIST_STORAGE_PREFIX}${userId}`;
    const current = JSON.parse(localStorage.getItem(storedKey) || "[]");
    const updated = current.filter((id) => id !== productId);
    localStorage.setItem(storedKey, JSON.stringify(updated));

    return await this.getWishlist(userId);
  },
};
