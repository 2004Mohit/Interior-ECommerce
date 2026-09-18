/**
 * GateMate Product Media Service
 *
 * Canonical product-image uploader.
 *
 * Storage path:
 * product-images/{productId}/{uniqueId}.webp
 *
 * This service intentionally does NOT return a local
 * object URL when Supabase upload fails.
 *
 * Object URLs are only for temporary browser previews.
 */

import { uploadService } from "./uploadService";

export const productMediaService = {
  /**
   * Upload a product image to Supabase Storage.
   *
   * @param {string} productId
   * @param {File} file
   * @param {Function} onStatusChange
   */
  async uploadProductImage(productId, file, onStatusChange) {
    if (!productId) {
      throw new Error("Product ID is required for image upload.");
    }

    if (!file) {
      throw new Error("No image file provided.");
    }

    return uploadService.uploadProductImage(productId, file, onStatusChange);
  },

  /**
   * Remove a product image from Supabase Storage.
   *
   * @param {string} storagePath
   */
  async removeProductImage(storagePath) {
    if (!storagePath) {
      return;
    }

    return uploadService.removeFile("product-images", storagePath);
  },
};
