import { supabase } from "../lib/supabaseClient";

const REVIEW_STATUSES = new Set(["PUBLISHED", "PENDING_REVIEW", "FLAGGED"]);

const COMPLAINT_STATUSES = new Set([
  "OPEN",
  "UNDER_REVIEW",
  "WAITING_FOR_INFORMATION",
  "RESOLVED",
  "REJECTED",
  "ESCALATED",
]);

const COMPLAINT_CATEGORIES = new Set([
  "DELIVERY_DELAY",
  "DAMAGED_MATERIAL",
  "WRONG_ITEM",
  "QUALITY_DISPUTE",
  "BILLING",
  "OTHER",
]);

const normalizeRelation = (value) => {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
};

const normalizeLimit = (value, fallback = 50, maximum = 100) => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, 1), maximum);
};

const normalizeOffset = (value) => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(parsed, 0);
};

export const adminSupportService = {
  /**
   * Fetch Customer Product Reviews with linked
   * product and vendor details.
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

    const safeLimit = normalizeLimit(limit);
    const safeOffset = normalizeOffset(offset);

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
        rating: Number(review.rating || 0),
        comment: review.comment || "",
        headline: review.headline || "",
        moderation_status: review.moderation_status || "PENDING_REVIEW",
        product,
        vendor,
      };
    });

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
   * Moderate a Customer Product Review.
   *
   * Authorization and database mutation are performed
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
   * Fetch customer Help & Inquiry tickets.
   *
   * Current customer_complaints schema:
   *
   * OPEN
   * UNDER_REVIEW
   * WAITING_FOR_INFORMATION
   * RESOLVED
   * REJECTED
   * ESCALATED
   */
  async getComplaints({
    status = "ALL",
    category = "ALL",
    search = "",
    limit = 50,
    offset = 0,
  } = {}) {
    const { data, error } = await supabase.rpc(
      "get_admin_customer_complaints",
      {
        p_status: status || "ALL",
        p_category: category || "ALL",
        p_search: search?.trim() || "",
        p_limit: limit,
        p_offset: offset,
      },
    );

    if (error) {
      throw error;
    }

    const complaints = Array.isArray(data?.complaints)
      ? data.complaints.map((complaint) => ({
          ...complaint,

          // Keep the shape expected by AdminComplaintsView.
          vendor: complaint.vendor || null,
          product: complaint.product || null,

          vendor_name:
            complaint.vendor?.business_name || complaint.vendor_name || null,

          product_name:
            complaint.product?.name || complaint.product_name || null,

          // Customer contact number.
          customer_phone:
            complaint.customer_phone ||
            complaint.phone ||
            complaint.customer?.phone ||
            null,
        }))
      : [];

    return {
      complaints,
      totalCount: Number(data?.totalCount || 0),
    };
  },

  /**
   * Process a customer complaint.
   *
   * Admin workflow:
   *
   * 1. Admin contacts the customer manually.
   * 2. Admin investigates the complaint.
   * 3. Admin updates the complaint status.
   * 4. Admin records internal notes.
   *
   * There is NO customer-facing message field.
   *
   * Authorization, validation and database mutation
   * are performed by the admin RPC.
   */
  async processComplaintUpdate({
    complaintId,
    status,
    internalNotes,
    vendorId = null,
    productId = null,
    orderId = null,
    escalatedTo = null,
  }) {
    if (!complaintId) {
      throw new Error("Complaint ID is required.");
    }

    const normalizedStatus = String(status || "")
      .trim()
      .toUpperCase();

    if (!COMPLAINT_STATUSES.has(normalizedStatus)) {
      throw new Error(`Invalid complaint status: ${normalizedStatus}`);
    }

    const cleanInternalNotes = String(internalNotes || "").trim();

    const cleanEscalatedTo = String(escalatedTo || "").trim();

    if (normalizedStatus === "ESCALATED" && !cleanEscalatedTo) {
      throw new Error("Escalation destination is required.");
    }

    const { data, error } = await supabase.rpc(
      "admin_process_complaint_update",
      {
        p_complaint_id: complaintId,
        p_status: normalizedStatus,
        p_internal_notes: cleanInternalNotes || "Internal investigation update",
        p_vendor_id: vendorId || null,
        p_product_id: productId || null,
        p_order_id: orderId || null,
        p_escalated_to: cleanEscalatedTo || null,
      },
    );

    if (error) {
      throw error;
    }

    return data;
  },
};

export default adminSupportService;
