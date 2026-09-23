import { supabase } from "../lib/supabaseClient";

const REVIEW_STATUSES = new Set(["PUBLISHED", "PENDING_REVIEW", "FLAGGED"]);

const normalizeRelation = (value) => {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
};

export const adminSupportService = {
  /**
   * Fetches Customer Product Reviews with linked product and vendor details.
   *
   * Current GateMate schema:
   *   public.product_reviews
   *
   * Moderation statuses:
   *   PUBLISHED
   *   PENDING_REVIEW
   *   FLAGGED
   */
  async getProductReviews({
    status = "ALL",
    search = "",
    limit = 50,
    offset = 0,
  } = {}) {
    const normalizedStatus = String(status || "ALL")
      .trim()
      .toUpperCase();

    if (normalizedStatus !== "ALL" && !REVIEW_STATUSES.has(normalizedStatus)) {
      throw new Error(`Invalid review status: ${normalizedStatus}`);
    }

    const safeLimit = Math.min(
      Math.max(Number.parseInt(limit, 10) || 50, 1),
      100,
    );

    const safeOffset = Math.max(Number.parseInt(offset, 10) || 0, 0);

    let query = supabase
      .from("product_reviews")
      .select(
        `
        *,
        vendor_products:product_id (
          id,
          name,
          brand,
          category_slug,
          cover_image_url,
          vendor_id,
          vendor_profiles:vendor_id (
            id,
            business_name,
            locality,
            city
          )
        )
        `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(safeOffset, safeOffset + safeLimit - 1);

    if (normalizedStatus !== "ALL") {
      query = query.eq("moderation_status", normalizedStatus);
    }

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    let processed = (data || []).map((review) => {
      const product = normalizeRelation(review.vendor_products);
      const vendor = normalizeRelation(product?.vendor_profiles);

      return {
        ...review,

        // Current schema names
        rating: Number(review.rating || 0),
        comment: review.comment || "",
        headline: review.headline || "",
        moderation_status: review.moderation_status || "PENDING_REVIEW",

        // UI-friendly relation names
        product,
        vendor,
      };
    });

    /*
     * Search is intentionally performed after fetching the current
     * review page because the searchable content includes related
     * product/vendor fields.
     */
    const searchTerm = String(search || "")
      .trim()
      .toLowerCase();

    if (searchTerm) {
      processed = processed.filter((review) => {
        const productName = String(review.product?.name || "").toLowerCase();

        const productBrand = String(review.product?.brand || "").toLowerCase();

        const vendorName = String(
          review.vendor?.business_name || "",
        ).toLowerCase();

        const reviewHeadline = String(review.headline || "").toLowerCase();

        const reviewComment = String(review.comment || "").toLowerCase();

        const customerName = String(review.user_name || "").toLowerCase();

        return (
          productName.includes(searchTerm) ||
          productBrand.includes(searchTerm) ||
          vendorName.includes(searchTerm) ||
          reviewHeadline.includes(searchTerm) ||
          reviewComment.includes(searchTerm) ||
          customerName.includes(searchTerm)
        );
      });
    }

    return {
      reviews: processed,
      totalCount: count ?? processed.length,
    };
  },

  /**
   * Moderates a Customer Product Review.
   *
   * Valid decisions:
   *   PUBLISHED
   *   PENDING_REVIEW
   *   FLAGGED
   *
   * The actual authorization and database update are performed
   * by the admin RPC.
   */
  async moderateProductReview({ reviewId, decision, moderationReason }) {
    if (!reviewId) {
      throw new Error("Review ID is required.");
    }

    const normalizedDecision = String(decision || "")
      .trim()
      .toUpperCase();

    if (!REVIEW_STATUSES.has(normalizedDecision)) {
      throw new Error(
        "Invalid moderation decision. Use PUBLISHED, PENDING_REVIEW, or FLAGGED.",
      );
    }

    const cleanReason = String(moderationReason || "").trim();

    if (!cleanReason) {
      throw new Error("A moderation reason is required.");
    }

    const { data, error } = await supabase.rpc(
      "admin_moderate_product_review",
      {
        p_review_id: reviewId,
        p_decision: normalizedDecision,
        p_moderation_reason: cleanReason,
      },
    );

    if (error) {
      throw error;
    }

    return data;
  },

  /**
   * Fetches customer complaints / tickets with links to orders,
   * products, and vendors.
   */
  async getComplaints({
    status = "ALL",
    category = "ALL",
    search = "",
    limit = 50,
    offset = 0,
  } = {}) {
    let query = supabase
      .from("customer_complaints")
      .select(
        `
        *,
        vendor_profiles:vendor_id (
          id,
          business_name,
          city
        ),
        vendor_products:product_id (
          id,
          name
        )
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "ALL") {
      query = query.eq("status", status);
    }

    if (category && category !== "ALL") {
      query = query.eq("category", category);
    }

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    let processed = (data || []).map((complaint) => ({
      ...complaint,
      vendor: normalizeRelation(complaint.vendor_profiles),
      product: normalizeRelation(complaint.vendor_products),
    }));

    if (search.trim()) {
      const q = search.trim().toLowerCase();

      processed = processed.filter((complaint) => {
        const subject = String(complaint.subject || "").toLowerCase();

        const description = String(complaint.description || "").toLowerCase();

        const orderId = String(complaint.order_id || "").toLowerCase();

        return (
          subject.includes(q) || description.includes(q) || orderId.includes(q)
        );
      });
    }

    return {
      complaints: processed,
      totalCount: count ?? processed.length,
    };
  },

  /**
   * Updates complaint state, internal investigation notes,
   * and resolution.
   */
  async processComplaintUpdate({
    complaintId,
    status,
    internalNotes,
    resolutionNotes = null,
    vendorId = null,
    productId = null,
    orderId = null,
    escalatedTo = null,
  }) {
    const { data, error } = await supabase.rpc(
      "admin_process_complaint_update",
      {
        p_complaint_id: complaintId,
        p_status: status,
        p_internal_notes:
          internalNotes?.trim() || "Internal investigation update",
        p_resolution_notes: resolutionNotes?.trim() || null,
        p_vendor_id: vendorId,
        p_product_id: productId,
        p_order_id: orderId,
        p_escalated_to: escalatedTo?.trim() || null,
      },
    );

    if (error) {
      throw error;
    }

    return data;
  },
};
