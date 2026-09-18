import { orderRepository } from "./orderRepository";

export const REVIEW_MODERATION_STATUS = {
  PENDING: "PENDING_MODERATION",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

const SEED_PRODUCT_REVIEWS = {
  "prod-cem-001": [
    {
      id: "rev-pune-001",
      productId: "prod-cem-001",
      userId: null,
      userName: "Vikramaditya S. (Civil Contractor)",
      userLocation: "Koregaon Park, Pune",
      rating: 5,
      headline: "Fresh test batch cement & quick site delivery",
      comment:
        "Superb quality. Bags were fresh with no lumps. Arrived at our construction site in Koregaon Park in under 45 minutes.",
      images: [
        "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=600&q=80",
      ],
      isVerifiedPurchase: true,
      moderationStatus: REVIEW_MODERATION_STATUS.APPROVED,
      createdAt: "2026-09-02T11:20:00Z",
      helpfulCount: 14,
    },
    {
      id: "rev-pcmc-002",
      productId: "prod-cem-001",
      userId: "user-pcmc-9",
      userName: "Pooja Mehta (Site Engineer)",
      userLocation: "Pimple Saudagar, PCMC",
      rating: 5,
      headline: "Consistent setting time for slab casting",
      comment:
        "Excellent compressive strength achieved on 7-day cube testing. Laminated bag packaging kept moisture out.",
      images: [],
      isVerifiedPurchase: true,
      moderationStatus: REVIEW_MODERATION_STATUS.APPROVED,
      createdAt: "2026-08-28T16:45:00Z",
      helpfulCount: 8,
    },
  ],
  "prod-tmt-001": [
    {
      id: "rev-pune-003",
      productId: "prod-tmt-001",
      userId: "user-baner-3",
      userName: "Col. Rajesh Ranawat (Developer)",
      userLocation: "Baner, Pune",
      rating: 5,
      headline: "Genuine Tata Tiscon Fe 550D with test certificate",
      comment:
        "Authentic Tata Tiscon rebars with prominent ribbing and test batch verification. Direct unloading at site.",
      images: [
        "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80",
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
  async getProductReviews(productId) {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const storedKey = `${STORAGE_PREFIX}${productId}`;
    const localReviews = JSON.parse(localStorage.getItem(storedKey) || "[]");
    const seedReviews = SEED_PRODUCT_REVIEWS[productId] || [];

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

  async checkCustomerEligibility(userId, productId) {
    if (!userId) {
      return {
        isEligible: false,
        reason: "AUTH_REQUIRED",
        message: "Please sign in to check your purchase eligibility.",
      };
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

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

  async uploadReviewImage(file, userId) {
    if (!file) return null;
    return URL.createObjectURL(file);
  },

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

    const imageUrls = [];
    for (const file of imageFiles) {
      const url = await this.uploadReviewImage(file, userId);
      if (url) imageUrls.push(url);
    }

    const newReview = {
      id: `rev-sub-${Date.now()}`,
      productId,
      userId,
      userName: userName || "Site Engineer",
      userLocation: userLocation || "Pune / PCMC Region",
      rating: Number(rating),
      headline,
      comment,
      images: imageUrls,
      isVerifiedPurchase: true,
      moderationStatus: REVIEW_MODERATION_STATUS.APPROVED,
      createdAt: new Date().toISOString(),
      helpfulCount: 0,
    };

    const storedKey = `${STORAGE_PREFIX}${productId}`;
    const existing = JSON.parse(localStorage.getItem(storedKey) || "[]");
    localStorage.setItem(storedKey, JSON.stringify([newReview, ...existing]));

    return {
      success: true,
      review: newReview,
      message:
        "Thank you! Your verified construction review has been submitted.",
    };
  },
};
