import { supabase } from "../lib/supabaseClient";
import { fileOptimizer } from "../utils/fileOptimizer";

export const uploadService = {
  /**
   * Uploads an optimized product image to the 'product-images' public bucket.
   * Path format: product-images/{productId}/{uniqueId}.webp
   */
  async uploadProductImage(productId, file, onStatusChange) {
    try {
      // 1. Optimize image (resizes to max 1600x1600, WebP conversion, ~200-500KB)
      const optimizedFile = await fileOptimizer.optimizeProductImage(
        file,
        onStatusChange,
      );

      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const safeProductId = productId || "temp-product";
      const filePath = `product-images/${safeProductId}/${uniqueId}.webp`;

      if (onStatusChange) onStatusChange("Uploading to storage...");

      // 2. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, optimizedFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: "image/webp",
        });

      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      if (onStatusChange) onStatusChange("Upload complete.");

      return {
        path: filePath,
        url: publicUrlData.publicUrl,
        size: optimizedFile.size,
      };
    } catch (err) {
      throw new Error(err.message || "Product image upload failed.");
    }
  },

  /**
   * Uploads a vendor verification document to the 'vendor-verification-docs' private bucket.
   * Path format: vendor-verification-docs/{vendorId}/{documentType}/{uniqueId}.{ext}
   */
  async uploadVendorDocument(vendorId, documentType, file, onStatusChange) {
    try {
      // 1. Validate document size and readability limits
      await fileOptimizer.validateVerificationDocument(file);

      if (onStatusChange) onStatusChange("Validating document...");

      const fileExt = file.name.split(".").pop() || "pdf";
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const safeVendorId = vendorId || "temp-vendor";
      const filePath = `${safeVendorId}/${documentType}/${uniqueId}.${fileExt}`;

      if (onStatusChange) onStatusChange("Uploading secure document...");

      // 2. Upload to private Supabase Storage bucket
      const { error: uploadError } = await supabase.storage
        .from("vendor-verification-docs")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      if (onStatusChange) onStatusChange("Document uploaded securely.");

      return {
        path: filePath,
        size: file.size,
        type: file.type,
      };
    } catch (err) {
      throw new Error(err.message || "Document upload failed.");
    }
  },

  /**
   * Safely deletes an orphaned or replaced file from Supabase Storage.
   */
  async removeFile(bucket, filePath) {
    if (!filePath) return;
    try {
      // Extract path relative to bucket if full URL was provided
      let cleanPath = filePath;
      if (filePath.includes(`/storage/v1/object/public/${bucket}/`)) {
        cleanPath = filePath.split(`/storage/v1/object/public/${bucket}/`)[1];
      } else if (filePath.includes(`/storage/v1/object/sign/${bucket}/`)) {
        cleanPath = filePath.split(`/storage/v1/object/sign/${bucket}/`)[1];
      }

      await supabase.storage.from(bucket).remove([cleanPath]);
    } catch (err) {
      console.warn("Failed to clean up orphaned storage file:", err);
    }
  },
};
