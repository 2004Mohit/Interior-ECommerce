/**
 * GateMate Vendor Customer Product Reviews Service
 *
 * Rules:
 * - GateMate strictly supports CUSTOMER PRODUCT RATINGS/REVIEWS ONLY.
 * - ZERO vendor-performance ratings, seller ratings, or delivery-partner ratings.
 * - Customer reviews are read-only for vendors.
 */

import { supabase } from "../lib/supabaseClient";

export const REVIEW_MODERATION_STATUS = {
  PUBLISHED: "PUBLISHED",
  PENDING_REVIEW: "PENDING_REVIEW",
  FLAGGED: "FLAGGED",
};

export const vendorReviewService = {
  async _resolveVendorId() {
    const { data: vendorId, error } = await supabase.rpc(
      "get_vendor_id_for_auth_user",
    );
    if (error) {
      throw new Error(`Unable to resolve vendor profile: ${error.message}`);
    }
    if (!vendorId) {
      throw new Error(
        "Vendor profile not found. The vendor may not be approved yet.",
      );
    }
    return vendorId;
  },

  /**
   * Retrieves all verified customer reviews for products owned by this vendor.
   */
  async getVendorProductReviews() {
    const vendorId = await this._resolveVendorId();

    const { data, error } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Unable to load product reviews: ${error.message}`);
    }

    return (data || []).map((r) => ({
      id: r.id,
      productId: r.product_id,
      productName: r.product_name,
      productSlug: r.product_slug,
      productCategory: r.product_category,
      productImg: r.product_img,
      vendorId: r.vendor_id,
      customerName: r.user_name || "Verified Customer",
      customerLocation: r.user_location || "Pune & PCMC",
      rating: Number(r.rating) || 5,
      headline: r.headline || "",
      comment: r.comment,
      reviewDate: r.created_at,
      isVerifiedPurchase: Boolean(r.is_verified_purchase),
      moderationStatus:
        r.moderation_status || REVIEW_MODERATION_STATUS.PUBLISHED,
      images: r.images || [],
    }));
  },

  /**
   * Computes product ratings metrics across all vendor products.
   */
  async getProductReviewMetrics() {
    const reviews = await this.getVendorProductReviews();

    if (reviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        verifiedPurchaseCount: 0,
      };
    }

    let totalScore = 0;
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let verifiedCount = 0;

    reviews.forEach((r) => {
      totalScore += r.rating;
      if (breakdown[r.rating] !== undefined) {
        breakdown[r.rating] += 1;
      }
      if (r.isVerifiedPurchase) verifiedCount += 1;
    });

    const averageRating = Math.round((totalScore / reviews.length) * 10) / 10;

    return {
      totalReviews: reviews.length,
      averageRating,
      ratingBreakdown: breakdown,
      verifiedPurchaseCount: verifiedCount,
    };
  },
};
