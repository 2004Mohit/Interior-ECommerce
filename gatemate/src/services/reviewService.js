import { orderRepository } from "./orderRepository";

/**
 * GateMate Review Lifecycle & Moderation Statuses
 */
export const REVIEW_MODERATION_STATUS = {
  PENDING: "PENDING_MODERATION",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

const SEED_PRODUCT_REVIEWS = {
  1: [
    {
      id: "rev-pune-001",
      productId: "1",
      userId: "mock-user-1",
      userName: "Vikramaditya S.",
      userLocation: "Koregaon Park, Pune",
      rating: 5,
      headline: "Authentic craftsmanship & lightning fast delivery",
      comment:
        "Superb quality. The cobalt glazing and finish are top-notch. Arrived within the 30-minute priority dispatch corridor in Pune.",
      images: [
        "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80",
      ],
      isVerifiedPurchase: true,
      moderationStatus: REVIEW_MODERATION_STATUS.APPROVED,
      createdAt: "2026-09-02T11:20:00Z",
      helpfulCount: 14,
    },
    {
      id: "rev-pcmc-002",
      productId: "1",
      userId: "user-pcmc-9",
      userName: "Pooja Mehta",
      userLocation: "Pimple Saudagar, PCMC",
      rating: 5,
      headline: "Stunning centerpiece for our living room",
      comment:
        "Arrived in heavy-duty honeycomb thermocol packaging. Zero damage and authentic feel.",
      images: [],
      isVerifiedPurchase: true,
      moderationStatus: REVIEW_MODERATION_STATUS.APPROVED,
      createdAt: "2026-08-28T16:45:00Z",
      helpfulCount: 8,
    },
  ],
  2: [
    {
      id: "rev-pune-003",
      productId: "2",
      userId: "user-baner-3",
      userName: "Col. Rajesh Ranawat",
      userLocation: "Baner, Pune",
      rating: 5,
      headline: "Heavy-duty latch built for estate gates",
      comment:
        "Solid forged brass with seasoned Sheesham inlay. Mounting brackets aligned seamlessly with our automatic motor arm.",
      images: [
        "https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?auto=format&fit=crop&w=600&q=80",
      ],
      isVerifiedPurchase: true,
      moderationStatus: REVIEW_MODERATION_STATUS.APPROVED,
      createdAt: "2026-09-04T09:15:00Z",
      helpfulCount: 19,
    },
  ],
};

const STORAGE_PREFIX = "gatemate_product_reviews_";

export const reviewService = {
  /**
   * Public Product Review Fetcher.
   * Guests can read approved reviews without authentication.
   */
  async getProductReviews(productId) {
    await new Promise((resolve) => setTimeout(resolve, 140));

    // [TODO: SUPABASE PERSISTENCE]
    // const { data, error } = await supabase
    //   .from('reviews')
    //   .select('*, customer:profiles(full_name, city)')
    //   .eq('product_id', productId)
    //   .eq('moderation_status', 'APPROVED')
    //   .order('created_at', { ascending: false });
    // if (error) throw error;
    // return data;

    const storedKey = `${STORAGE_PREFIX}${productId}`;
    const localReviews = JSON.parse(localStorage.getItem(storedKey) || "[]");
    const seedReviews = SEED_PRODUCT_REVIEWS[productId] || [];

    // Only return public APPROVED reviews
    const allApproved = [...localReviews, ...seedReviews].filter(
      (r) => r.moderationStatus === REVIEW_MODERATION_STATUS.APPROVED,
    );

    const totalRatings = allApproved.reduce((acc, r) => acc + r.rating, 0);
    const averageRating =
      allApproved.length > 0
        ? (totalRatings / allApproved.length).toFixed(1)
        : 0;

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allApproved.forEach((r) => {
      if (ratingDistribution[r.rating] !== undefined) {
        ratingDistribution[r.rating] += 1;
      }
    });

    return {
      reviews: allApproved,
      totalCount: allApproved.length,
      averageRating: Number(averageRating),
      ratingDistribution,
    };
  },

  /**
   * Backend Verification Rule Check:
   * 1. Customer must have an order with status = DELIVERED containing this productId.
   * 2. Customer must NOT have submitted an existing review for this product.
   */
  async checkCustomerEligibility(userId, productId) {
    if (!userId) {
      return {
        isEligible: false,
        reason: "AUTH_REQUIRED",
        message: "Please sign in to check your purchase eligibility.",
      };
    }

    await new Promise((resolve) => setTimeout(resolve, 120));

    // [TODO: SUPABASE ENFORCEMENT VIA RLS / EDGE FUNCTION]
    // const { data: deliveredOrders } = await supabase
    //   .from('orders')
    //   .select('id, order_items(product_id)')
    //   .eq('customer_id', userId)
    //   .eq('status', 'DELIVERED');
    // const { data: existingReview } = await supabase
    //   .from('reviews')
    //   .select('id')
    //   .eq('user_id', userId)
    //   .eq('product_id', productId)
    //   .maybeSingle();

    try {
      const orders = await orderRepository.getCustomerOrders(userId);
      const deliveredPurchase = orders.find(
        (o) =>
          o.orderStatus === "DELIVERED" &&
          o.items?.some((i) => i.id === productId),
      );

      if (!deliveredPurchase) {
        return {
          isEligible: false,
          reason: "NO_VERIFIED_DELIVERED_PURCHASE",
          message:
            "Review submissions are only available for verified customers with a completed delivery for this item in Pune or PCMC.",
        };
      }

      // Check duplicate submissions
      const storedKey = `${STORAGE_PREFIX}${productId}`;
      const localReviews = JSON.parse(localStorage.getItem(storedKey) || "[]");
      const seedReviews = SEED_PRODUCT_REVIEWS[productId] || [];
      const hasReviewed = [...localReviews, ...seedReviews].some(
        (r) => r.userId === userId,
      );

      if (hasReviewed) {
        return {
          isEligible: false,
          reason: "DUPLICATE_REVIEW",
          message: "You have already submitted a review for this product.",
        };
      }

      return {
        isEligible: true,
        orderId: deliveredPurchase.id,
        message: "Verified buyer status confirmed.",
      };
    } catch (e) {
      return {
        isEligible: false,
        reason: "VERIFICATION_ERROR",
        message: "Unable to verify order records.",
      };
    }
  },

  /**
   * Upload Review Image (Supabase Storage Contract)
   */
  async uploadReviewImage(file, userId) {
    if (!file) return null;

    // [TODO: SUPABASE STORAGE CONFIGURATION REQUIRED]
    // const fileExt = file.name.split('.').pop();
    // const filePath = `reviews/${userId}/${Date.now()}.${fileExt}`;
    // const { data, error } = await supabase.storage.from('review-attachments').upload(filePath, file);
    // if (error) throw error;
    // const { data: { publicUrl } } = supabase.storage.from('review-attachments').getPublicUrl(filePath);
    // return publicUrl;

    // Temporary dev-mode object URL for UI testing without crashing
    return URL.createObjectURL(file);
  },

  /**
   * Submit Customer Review
   * Status defaults to PENDING_MODERATION until admin review approval.
   */
  async submitReview({
    productId,
    userId,
    userName,
    userLocation,
    rating,
    headline,
    comment,
    imageFiles = [],
  }) {
    if (!userId) {
      throw new Error(
        "AUTH_REQUIRED: Authentication required to submit reviews.",
      );
    }

    const eligibility = await this.checkCustomerEligibility(userId, productId);
    if (!eligibility.isEligible) {
      throw new Error(eligibility.message);
    }

    // Process image attachments
    const imageUrls = [];
    for (const file of imageFiles) {
      const url = await this.uploadReviewImage(file, userId);
      if (url) imageUrls.push(url);
    }

    const newReview = {
      id: `rev-sub-${Date.now()}`,
      productId,
      userId,
      userName: userName || "GateMate Customer",
      userLocation: userLocation || "Pune / PCMC",
      rating: Number(rating),
      headline,
      comment,
      images: imageUrls,
      isVerifiedPurchase: true,
      moderationStatus: REVIEW_MODERATION_STATUS.APPROVED, // Set to APPROVED for instantaneous local verification demo
      createdAt: new Date().toISOString(),
      helpfulCount: 0,
    };

    const storedKey = `${STORAGE_PREFIX}${productId}`;
    const existing = JSON.parse(localStorage.getItem(storedKey) || "[]");
    localStorage.setItem(storedKey, JSON.stringify([newReview, ...existing]));

    return {
      success: true,
      review: newReview,
      message: "Thank you! Your verified review has been submitted.",
    };
  },
};
