/**
 * GateMate Media & Supabase Storage Service Abstraction
 *
 * Bucket Architecture & Access Control Policies:
 * 1. 'product-images'           -> PUBLIC (Cached at Cloudflare Edge, WebP/AVIF transforms)
 * 2. 'review-images'            -> PUBLIC (Approved review attachments)
 * 3. 'seller-submission-media'  -> PRIVATE (Draft product images pending admin approval)
 * 4. 'verification-documents'   -> PRIVATE (Seller GST/Aadhaar/PAN KYC documents - RLS strictly enforced)[cite: 1]
 * 5. 'customer-avatars'         -> PUBLIC / RESTRICTED (Customer profile images)[cite: 1]
 *
 * SECURITY RULES:
 * - Service-role keys MUST NEVER be present on the frontend client[cite: 1].
 * - Sensitive buckets ('verification-documents', 'seller-submission-media') require time-limited signed URLs[cite: 1].
 */

import { supabase } from "../lib/supabaseClient";

export const STORAGE_BUCKETS = {
  PRODUCT_IMAGES: "product-images",
  REVIEW_IMAGES: "review-images",
  SELLER_SUBMISSION_MEDIA: "seller-submission-media",
  VERIFICATION_DOCUMENTS: "verification-documents",
  CUSTOMER_AVATARS: "customer-avatars",
};

// Default fallback placeholder svg
export const DEFAULT_PRODUCT_FALLBACK =
  "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22600%22%20height%3D%22600%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20600%20600%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%2364748b%3Bfont-weight%3Abold%3Bfont-family%3Asystem-ui%2C%20sans-serif%3Bfont-size%3A24pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%22600%22%20height%3D%22600%22%20fill%3D%22%230a1424%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22180%22%20y%3D%22310%22%3EGateMate%20Item%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E";

export const mediaService = {
  /**
   * Resolves public image URLs with optional Supabase/Cloudflare CDN transformation parameters
   */
  getOptimizedImageUrl(
    pathOrUrl,
    { width = 800, height = null, quality = 80, format = "origin" } = {},
  ) {
    if (!pathOrUrl) return DEFAULT_PRODUCT_FALLBACK;

    // Handle existing external/development URLs (e.g., Unsplash fallbacks)
    if (
      pathOrUrl.startsWith("http://") ||
      pathOrUrl.startsWith("https://") ||
      pathOrUrl.startsWith("data:")
    ) {
      return pathOrUrl;
    }

    // // SUPABASE STORAGE SETUP REQUIRED:
    // When Supabase Storage bucket 'product-images' is active with Cloudflare CDN transforms:
    /*
    const { data } = supabase.storage
      .from(STORAGE_BUCKETS.PRODUCT_IMAGES)
      .getPublicUrl(pathOrUrl, {
        transform: {
          width,
          height: height || undefined,
          quality,
          format: format === 'origin' ? undefined : format
        }
      });
    return data.publicUrl;
    */

    return pathOrUrl;
  },

  /**
   * Generates time-limited signed URLs for sensitive private documents (Verification KYC / Draft submissions)
   */
  async getSecureDocumentUrl(bucket, filePath, expiresInSeconds = 300) {
    if (!bucket || !filePath) return null;

    // Strict client-side check: Only private buckets are processed here
    if (
      bucket !== STORAGE_BUCKETS.VERIFICATION_DOCUMENTS &&
      bucket !== STORAGE_BUCKETS.SELLER_SUBMISSION_MEDIA
    ) {
      throw new Error(
        "SECURITY_VIOLATION: Attempted to generate signed URL on non-private bucket.",
      );
    }

    // // SUPABASE STORAGE SETUP REQUIRED:
    // Generates authorized short-lived signed URL for admin/vendor KYC inspection:
    /*
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresInSeconds);
    if (error) throw error;
    return data.signedUrl;
    */

    return null;
  },
};
