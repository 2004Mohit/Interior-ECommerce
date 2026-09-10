import { DEMO_PRODUCTS } from "../data/demoProducts";

const WISHLIST_STORAGE_PREFIX = "gatemate_wishlist_user_";

export const wishlistRepository = {
  async getWishlist(userId) {
    if (!userId) {
      throw new Error(
        "AUTH_REQUIRED: You must be signed in to view your wishlist.",
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    const storedKey = `${WISHLIST_STORAGE_PREFIX}${userId}`;
    const rawStored = localStorage.getItem(storedKey);
    const productIds = rawStored
      ? JSON.parse(rawStored)
      : ["prod-cem-001", "prod-tmt-001"];

    const reconciledProducts = productIds
      .map((id) => DEMO_PRODUCTS.find((p) => p.id === id))
      .filter(Boolean);

    return reconciledProducts;
  },

  async addToWishlist(userId, productId) {
    if (!userId) {
      throw new Error(
        "AUTH_REQUIRED: Please sign in to save items to your wishlist.",
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 80));

    const storedKey = `${WISHLIST_STORAGE_PREFIX}${userId}`;
    const current = JSON.parse(localStorage.getItem(storedKey) || "[]");
    if (!current.includes(productId)) {
      const updated = [...current, productId];
      localStorage.setItem(storedKey, JSON.stringify(updated));
    }

    return await this.getWishlist(userId);
  },

  async removeFromWishlist(userId, productId) {
    if (!userId) {
      throw new Error("AUTH_REQUIRED");
    }

    await new Promise((resolve) => setTimeout(resolve, 80));

    const storedKey = `${WISHLIST_STORAGE_PREFIX}${userId}`;
    const current = JSON.parse(localStorage.getItem(storedKey) || "[]");
    const updated = current.filter((id) => id !== productId);
    localStorage.setItem(storedKey, JSON.stringify(updated));

    return await this.getWishlist(userId);
  },
};
