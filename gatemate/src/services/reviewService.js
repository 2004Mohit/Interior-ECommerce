import { supabase } from "../lib/supabaseClient";

export const REVIEW_MODERATION_STATUS = {
  PUBLISHED: "PUBLISHED",
  PENDING_REVIEW: "PENDING_REVIEW",
  FLAGGED: "FLAGGED",
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const normalizeReview = (review) => {
  if (!review) return null;

  return {
    id: review.id,
    productId: review.product_id,
    vendorId: review.vendor_id,
    userId: review.user_id,
    orderId: review.order_id,

    userName: review.user_name || "Verified Customer",
    userLocation: review.user_location || "Pune",

    rating: Number(review.rating || 0),
    headline: review.headline || "",
    comment: review.comment || "",

    isVerifiedPurchase: Boolean(review.is_verified_purchase),

    moderationStatus:
      review.moderation_status || REVIEW_MODERATION_STATUS.PUBLISHED,

    createdAt: review.created_at,
    updatedAt: review.updated_at,

    // Kept for compatibility with the existing UI.
    // Product review images are not currently stored in product_reviews.
    images: [],
    helpfulCount: 0,
  };
};

const calculateReviewStats = (reviews) => {
  const ratingDistribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  let ratingTotal = 0;
  let validRatingCount = 0;

  (reviews || []).forEach((review) => {
    const rating = Number(review.rating);

    if (rating >= 1 && rating <= 5) {
      ratingTotal += rating;
      validRatingCount += 1;

      if (ratingDistribution[rating] !== undefined) {
        ratingDistribution[rating] += 1;
      }
    }
  });

  return {
    totalCount: validRatingCount,
    averageRating:
      validRatingCount > 0
        ? Number((ratingTotal / validRatingCount).toFixed(1))
        : 0,
    ratingDistribution,
  };
};

/* -------------------------------------------------------------------------- */
/* Review Service                                                             */
/* -------------------------------------------------------------------------- */

export const reviewService = {
  /**
   * Fetch published reviews for a product.
   *
   * Only PUBLISHED reviews are visible publicly.
   */
  async getProductReviews(productId) {
    if (!productId) {
      return {
        reviews: [],
        totalCount: 0,
        averageRating: 0,
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      };
    }

    const { data, error } = await supabase
      .from("product_reviews")
      .select(
        `
          id,
          product_id,
          vendor_id,
          user_id,
          order_id,
          user_name,
          user_location,
          rating,
          headline,
          comment,
          is_verified_purchase,
          moderation_status,
          created_at,
          updated_at
        `,
      )
      .eq("product_id", productId)
      .eq("moderation_status", REVIEW_MODERATION_STATUS.PUBLISHED)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load product reviews:", error);
      throw new Error("Unable to load Customer Reviews for this Product.");
    }

    const reviews = (data || []).map(normalizeReview).filter(Boolean);

    const stats = calculateReviewStats(reviews);

    return {
      reviews,
      totalCount: stats.totalCount,
      averageRating: stats.averageRating,
      ratingDistribution: stats.ratingDistribution,
    };
  },

  /**
   * Check whether the authenticated customer:
   *
   * 1. Has purchased the product.
   * 2. Has received the product.
   * 3. Has not already reviewed the product.
   *
   * A review is eligible only after DELIVERED.
   */
  async checkCustomerEligibility(userId, productId) {
    if (!userId) {
      return {
        isEligible: false,
        reason: "AUTH_REQUIRED",
        message: "Please sign in to check your purchase eligibility.",
      };
    }

    if (!productId) {
      return {
        isEligible: false,
        reason: "INVALID_PRODUCT",
        message: "Unable to identify this Product.",
      };
    }

    try {
      /* -------------------------------------------------------------------- */
      /* 1. Find delivered orders belonging to this customer                  */
      /* -------------------------------------------------------------------- */

      const { data: orders, error: ordersError } = await supabase
        .from("vendor_orders")
        .select(
          `
            id,
            vendor_id,
            status,
            created_at
          `,
        )
        .eq("customer_id", userId)
        .eq("order_type", "NORMAL_ORDER")
        .eq("status", "DELIVERED")
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error(
          "Failed to check customer delivered orders:",
          ordersError,
        );

        return {
          isEligible: false,
          reason: "VERIFICATION_ERROR",
          message: "Unable to verify your delivered orders.",
        };
      }

      if (!orders || orders.length === 0) {
        return {
          isEligible: false,
          reason: "NO_VERIFIED_DELIVERED_PURCHASE",
          message:
            "You can write a Customer Review only after this Product has been delivered to you.",
        };
      }

      const orderIds = orders.map((order) => order.id).filter(Boolean);

      /* -------------------------------------------------------------------- */
      /* 2. Find the requested product inside those delivered orders          */
      /* -------------------------------------------------------------------- */

      const { data: orderItems, error: itemsError } = await supabase
        .from("vendor_order_items")
        .select(
          `
            id,
            order_id,
            product_id,
            product_name,
            quantity
          `,
        )
        .in("order_id", orderIds)
        .eq("product_id", productId);

      if (itemsError) {
        console.error(
          "Failed to verify delivered product purchase:",
          itemsError,
        );

        return {
          isEligible: false,
          reason: "VERIFICATION_ERROR",
          message: "Unable to verify your Product purchase.",
        };
      }

      if (!orderItems || orderItems.length === 0) {
        return {
          isEligible: false,
          reason: "NO_VERIFIED_DELIVERED_PURCHASE",
          message:
            "Review submissions are available only for Products you have purchased and received.",
        };
      }

      const deliveredOrder = orders.find((order) =>
        orderItems.some((item) => item.order_id === order.id),
      );

      if (!deliveredOrder) {
        return {
          isEligible: false,
          reason: "NO_VERIFIED_DELIVERED_PURCHASE",
          message:
            "Review submissions are available only after a completed delivery.",
        };
      }

      /* -------------------------------------------------------------------- */
      /* 3. Check whether this customer already reviewed this Product         */
      /* -------------------------------------------------------------------- */

      const { data: existingReview, error: existingReviewError } =
        await supabase
          .from("product_reviews")
          .select(
            `
              id,
              product_id,
              user_id,
              moderation_status
            `,
          )
          .eq("user_id", userId)
          .eq("product_id", productId)
          .maybeSingle();

      if (existingReviewError) {
        console.error(
          "Failed to check existing Customer Review:",
          existingReviewError,
        );

        return {
          isEligible: false,
          reason: "VERIFICATION_ERROR",
          message:
            "Unable to verify whether you already reviewed this Product.",
        };
      }

      if (existingReview) {
        return {
          isEligible: false,
          reason: "DUPLICATE_REVIEW",
          message: "You have already submitted a review for this Product.",
          reviewId: existingReview.id,
          moderationStatus: existingReview.moderation_status,
        };
      }

      /* -------------------------------------------------------------------- */
      /* 4. Eligible                                                           */
      /* -------------------------------------------------------------------- */

      return {
        isEligible: true,
        orderId: deliveredOrder.id,
        vendorId: deliveredOrder.vendor_id,
        message: "Verified buyer status confirmed.",
      };
    } catch (error) {
      console.error("Customer review eligibility check failed:", error);

      return {
        isEligible: false,
        reason: "VERIFICATION_ERROR",
        message: "Unable to verify your review eligibility.",
      };
    }
  },

  /**
   * Review image upload placeholder.
   *
   * The current product_reviews table does not have an image column.
   * Therefore images are not persisted yet.
   *
   * This method remains for compatibility with ReviewFormModal.
   */
  async uploadReviewImage(file, userId) {
    if (!file) {
      return null;
    }

    console.info(
      "Review image selected but not persisted because product_reviews currently has no image field.",
      {
        fileName: file.name,
        userId,
      },
    );

    return null;
  },

  /**
   * Submit a Customer Product Review.
   *
   * The review is initially stored as PENDING_REVIEW.
   * It becomes visible publicly only after moderation changes it
   * to PUBLISHED.
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

    if (!productId) {
      throw new Error("INVALID_PRODUCT: Product information is missing.");
    }

    const normalizedRating = Number(rating);

    if (
      !Number.isInteger(normalizedRating) ||
      normalizedRating < 1 ||
      normalizedRating > 5
    ) {
      throw new Error("Customer Rating must be between 1 and 5.");
    }

    const normalizedComment = String(comment || "").trim();

    if (!normalizedComment) {
      throw new Error("Customer Review comment is required.");
    }

    if (normalizedComment.length < 10) {
      throw new Error("Customer Review must contain at least 10 characters.");
    }

    const normalizedHeadline = String(headline || "").trim();

    /* ---------------------------------------------------------------------- */
    /* Verify purchase eligibility                                             */
    /* ---------------------------------------------------------------------- */

    const eligibility = await this.checkCustomerEligibility(userId, productId);

    if (!eligibility.isEligible) {
      throw new Error(eligibility.message);
    }

    /* ---------------------------------------------------------------------- */
    /* Resolve customer information                                            */
    /* ---------------------------------------------------------------------- */

    let resolvedUserName = String(userName || "").trim();
    let resolvedUserLocation = String(userLocation || "").trim();

    if (!resolvedUserName || !resolvedUserLocation) {
      const { data: profile, error: profileError } = await supabase
        .from("customer_profiles")
        .select("full_name, default_pincode")
        .eq("id", userId)
        .maybeSingle();

      if (!profileError && profile) {
        if (!resolvedUserName) {
          resolvedUserName =
            String(profile.full_name || "").trim() || "Verified Customer";
        }

        if (!resolvedUserLocation) {
          resolvedUserLocation =
            String(profile.default_pincode || "").trim() || "Pune";
        }
      }
    }

    if (!resolvedUserName) {
      resolvedUserName = "Verified Customer";
    }

    if (!resolvedUserLocation) {
      resolvedUserLocation = "Pune";
    }

    /* ---------------------------------------------------------------------- */
    /* Review images                                                           */
    /* ---------------------------------------------------------------------- */

    if (Array.isArray(imageFiles) && imageFiles.length > 0) {
      for (const file of imageFiles.slice(0, 3)) {
        await this.uploadReviewImage(file, userId);
      }
    }

    /* ---------------------------------------------------------------------- */
    /* Insert review                                                           */
    /* ---------------------------------------------------------------------- */

    const reviewPayload = {
      product_id: productId,
      vendor_id: eligibility.vendorId,
      user_id: userId,
      order_id: eligibility.orderId,
      user_name: resolvedUserName,
      user_location: resolvedUserLocation,
      rating: normalizedRating,
      headline: normalizedHeadline || null,
      comment: normalizedComment,
      is_verified_purchase: true,
      moderation_status: REVIEW_MODERATION_STATUS.PENDING_REVIEW,
    };

    const { data, error } = await supabase
      .from("product_reviews")
      .insert(reviewPayload)
      .select(
        `
          id,
          product_id,
          vendor_id,
          user_id,
          order_id,
          user_name,
          user_location,
          rating,
          headline,
          comment,
          is_verified_purchase,
          moderation_status,
          created_at,
          updated_at
        `,
      )
      .single();

    if (error) {
      console.error("Failed to submit Customer Review:", error);

      if (error.code === "23505") {
        throw new Error(
          "You have already submitted a review for this Product.",
        );
      }

      throw new Error(error.message || "Unable to submit Customer Review.");
    }

    const review = normalizeReview(data);

    return {
      success: true,
      review,
      message:
        "Your verified Customer Review has been submitted and is awaiting moderation.",
    };
  },
};
