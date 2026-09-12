/**
 * GateMate Vendor Customer Product Reviews Service
 *
 * Rules:
 * - GateMate strictly supports CUSTOMER PRODUCT RATINGS/REVIEWS ONLY.
 * - ZERO vendor-performance ratings, seller ratings, or delivery-partner ratings.
 * - Customer reviews are read-only for vendors (vendors cannot edit or delete buyer reviews).
 * - Displays Product, Customer Rating (1-5 stars), Written Customer Review, Review Date, and Moderation State.
 */

import { supabase } from "../lib/supabaseClient";

export const REVIEW_MODERATION_STATUS = {
  PUBLISHED: "PUBLISHED",
  PENDING_REVIEW: "PENDING_REVIEW",
  FLAGGED: "FLAGGED",
};

const VENDOR_REVIEWS_STORAGE_KEY = "gatemate_vendor_customer_reviews_";

const SEED_VENDOR_REVIEWS = [
  {
    id: "rev-c-001",
    productId: "vp-001",
    productName: "UltraTech Super Weather-Shield PPC Cement (50 kg Bag)",
    productSlug: "ultratech-super-cement-50kg-ppc",
    productCategory: "Cement",
    productImg:
      "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80",
    vendorId: "vnd-pune-001",
    customerName: "Vikramaditya S. (Civil Contractor)",
    customerLocation: "Koregaon Park, Pune",
    rating: 5,
    headline:
      "Fresh test batch cement, delivered quickly to our Koregaon Park site in 35 mins",
    comment:
      "Consistent fineness and high early compressive strength. Perfect for slab casting. Bags were completely dry and intact with zero setting lumps.",
    reviewDate: "2026-09-08T14:15:00Z",
    isVerifiedPurchase: true,
    moderationStatus: REVIEW_MODERATION_STATUS.PUBLISHED,
    images: [],
  },
  {
    id: "rev-c-002",
    productId: "vp-002",
    productName:
      "Tata Tiscon 550D High Ductility Earthquake Resistant TMT Rebar (12mm)",
    productSlug: "tata-tiscon-550d-tmt-rebar-12mm",
    productCategory: "Steel & TMT",
    productImg:
      "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80",
    vendorId: "vnd-pune-001",
    customerName: "Rahul Shinde (Structural Engineer)",
    customerLocation: "Pimple Saudagar, PCMC",
    rating: 5,
    headline: "Certified primary steel with authentic mill test certificate",
    comment:
      "The prominent rib pattern provides superior concrete bonding. Tested bendability on-site with zero surface micro-cracks. Authentic Tata Tiscon lot.",
    reviewDate: "2026-09-05T10:30:00Z",
    isVerifiedPurchase: true,
    moderationStatus: REVIEW_MODERATION_STATUS.PUBLISHED,
    images: [],
  },
  {
    id: "rev-c-003",
    productId: "vp-003",
    productName:
      "Siporex Lightweight Autoclaved Aerated Concrete AAC Block (600x200x150mm)",
    productSlug: "siporex-aac-lightweight-block-600x200x150mm",
    productCategory: "Bricks & Blocks",
    productImg:
      "https://images.unsplash.com/photo-1584463623578-301147571343?auto=format&fit=crop&w=800&q=80",
    vendorId: "vnd-pune-001",
    customerName: "Kailash Deshmukh",
    customerLocation: "Kharadi, Pune",
    rating: 4,
    headline: "Clean edges and minimal transit breakage",
    comment:
      "Dimensional tolerance was accurate across the entire truckload drop. Mortar joint thickness stayed under 3mm. Good thermal insulation.",
    reviewDate: "2026-09-02T16:45:00Z",
    isVerifiedPurchase: true,
    moderationStatus: REVIEW_MODERATION_STATUS.PUBLISHED,
    images: [],
  },
  {
    id: "rev-c-004",
    productId: "vp-004",
    productName:
      "Washed Manufactured Sand (M-Sand) for RCC Concreting (1 Brass / 100 Cu Ft)",
    productSlug: "washed-manufactured-m-sand-for-concreting-1-brass",
    productCategory: "Sand & Aggregates",
    productImg:
      "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=800&q=80",
    vendorId: "vnd-pune-001",
    customerName: "Pravin Gaikwad (Builder)",
    customerLocation: "Hadapsar, Pune",
    rating: 5,
    headline: "Clean Zone II gradation with low silt content",
    comment:
      "Washed thoroughly with no clay lumps. The concrete mix workability and cube test results at 7 days exceeded our design target.",
    reviewDate: "2026-08-28T11:00:00Z",
    isVerifiedPurchase: true,
    moderationStatus: REVIEW_MODERATION_STATUS.PUBLISHED,
    images: [],
  },
];

export const vendorReviewService = {
  /**
   * Retrieves all verified customer reviews for products owned by this vendor.
   */
  async getVendorProductReviews(vendorId = "vnd-pune-001") {
    await new Promise((resolve) => setTimeout(resolve, 80));

    try {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false });

      if (data && !error && data.length > 0) {
        return data.map((r) => ({
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
      }
    } catch (e) {
      console.warn("Supabase query fallback for vendor customer reviews", e);
    }

    const localRaw = localStorage.getItem(
      `${VENDOR_REVIEWS_STORAGE_KEY}${vendorId}`,
    );
    if (localRaw) {
      try {
        return JSON.parse(localRaw);
      } catch (err) {
        console.error("Error reading vendor customer reviews cache", err);
      }
    }

    localStorage.setItem(
      `${VENDOR_REVIEWS_STORAGE_KEY}${vendorId}`,
      JSON.stringify(SEED_VENDOR_REVIEWS),
    );
    return SEED_VENDOR_REVIEWS;
  },

  /**
   * Computes product ratings metrics across all vendor products.
   */
  async getProductReviewMetrics(vendorId = "vnd-pune-001") {
    const reviews = await this.getVendorProductReviews(vendorId);

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
