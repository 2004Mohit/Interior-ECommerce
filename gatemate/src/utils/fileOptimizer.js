/**
 * Ferrado File Optimization & Validation Utility
 * Handles browser-native image resizing, WebP conversion, and strict validation.
 */

const MAX_ORIGINAL_SIZE_MB = 5;
const MAX_FINAL_IMAGE_SIZE_MB = 1;
const MAX_DOCUMENT_SIZE_MB = 1;
const TARGET_MAX_DIMENSION = 1600;
const TARGET_WEBP_QUALITY = 0.78;

export const fileOptimizer = {
  /**
   * Validates and optimizes product images (converts to WebP, resizes to max 1600x1600, target 200-500KB)
   */
  async optimizeProductImage(file, onStatusChange) {
    if (!file) throw new Error("No file provided.");

    // 1. Validate MIME type
    const validImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    if (!validImageTypes.includes(file.type.toLowerCase())) {
      throw new Error(
        "Unsupported format. Please select a JPG, PNG, or WebP image.",
      );
    }

    // 2. Validate original size (Max 5 MB)
    if (file.size > MAX_ORIGINAL_SIZE_MB * 1024 * 1024) {
      throw new Error(
        `File is too large. Please select an image smaller than ${MAX_ORIGINAL_SIZE_MB} MB.`,
      );
    }

    if (onStatusChange) onStatusChange("Optimizing image...");

    try {
      // 3. Read image dimensions & create bitmap
      const bitmap = await createImageBitmap(file);
      let { width, height } = bitmap;

      // 4. Resize while preserving aspect ratio (Max 1600x1600)
      if (width > TARGET_MAX_DIMENSION || height > TARGET_MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * TARGET_MAX_DIMENSION) / width);
          width = TARGET_MAX_DIMENSION;
        } else {
          width = Math.round((width * TARGET_MAX_DIMENSION) / height);
          height = TARGET_MAX_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bitmap, 0, 0, width, height);

      // 5. Compress & convert to WebP Blob
      let quality = TARGET_WEBP_QUALITY;
      let blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/webp", quality),
      );

      // 6. Check final size constraints (< 1 MB hard limit)
      if (blob.size > MAX_FINAL_IMAGE_SIZE_MB * 1024 * 1024) {
        quality = 0.65; // Additional compression pass
        blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/webp", quality),
        );
      }

      if (blob.size > MAX_FINAL_IMAGE_SIZE_MB * 1024 * 1024) {
        throw new Error(
          "This image could not be optimized below 1 MB. Please choose a smaller image.",
        );
      }

      if (onStatusChange) onStatusChange("Image optimized — ready to upload.");

      // Return as optimized File object
      const optimizedFileName = `${file.name.substring(0, file.name.lastIndexOf(".")) || "image"}.webp`;
      return new File([blob], optimizedFileName, {
        type: "image/webp",
        lastModified: Date.now(),
      });
    } catch (err) {
      if (err.message.includes("smaller than")) throw err;
      throw new Error(
        "Image optimization failed. Please try a different image.",
      );
    }
  },

  /**
   * Validates vendor verification documents (PDF, JPG, PNG) enforcing size and readability limits
   */
  async validateVerificationDocument(file) {
    if (!file) throw new Error("No document provided.");

    const validTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    if (!validTypes.includes(file.type.toLowerCase())) {
      throw new Error(
        "Invalid document format. Please upload a PDF, JPG, or PNG file.",
      );
    }

    if (file.size > MAX_ORIGINAL_SIZE_MB * 1024 * 1024) {
      throw new Error(
        `Document is too large. Please select a file smaller than ${MAX_ORIGINAL_SIZE_MB} MB.`,
      );
    }

    if (file.size > MAX_DOCUMENT_SIZE_MB * 1024 * 1024) {
      throw new Error(
        `Optimized document exceeds the hard final limit of 1 MB. Please compress or select a clearer, smaller file while preserving text readability.`,
      );
    }

    return file;
  },
};
