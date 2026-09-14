import { supabase } from "../lib/supabaseClient";

export const adminSupportService = {
  /**
   * Fetches Customer Product Reviews with linked customer, product, and vendor details
   */
  async getProductReviews({
    status = "ALL",
    search = "",
    limit = 50,
    offset = 0,
  } = {}) {
    let query = supabase
      .from("customer_product_reviews")
      .select(
        `
        *,
        vendor_products:product_id (
          id,
          name,
          brand,
          category_slug,
          cover_image_url,
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
      .range(offset, offset + limit - 1);

    if (status && status !== "ALL") {
      query = query.eq("status", status);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    let processed = (data || []).map((rev) => {
      const prod = Array.isArray(rev.vendor_products)
        ? rev.vendor_products[0]
        : rev.vendor_products;
      const vendor = prod
        ? Array.isArray(prod.vendor_profiles)
          ? prod.vendor_profiles[0]
          : prod.vendor_profiles
        : null;
      return {
        ...rev,
        product: prod,
        vendor: vendor,
      };
    });

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      processed = processed.filter((r) => {
        const pName = String(r.product?.name || "").toLowerCase();
        const vName = String(r.vendor?.business_name || "").toLowerCase();
        const text = String(r.customer_product_review || "").toLowerCase();
        return pName.includes(q) || vName.includes(q) || text.includes(q);
      });
    }

    return {
      reviews: processed,
      totalCount: count || processed.length,
    };
  },

  /**
   * Moderates Customer Product Review visibility
   */
  async moderateProductReview({ reviewId, decision, moderationReason }) {
    const { data, error } = await supabase.rpc(
      "admin_moderate_product_review",
      {
        p_review_id: reviewId,
        p_decision: decision,
        p_moderation_reason: moderationReason.trim(),
      },
    );

    if (error) throw error;
    return data;
  },

  /**
   * Fetches customer complaints / tickets with links to orders, products, and vendors
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
    if (error) throw error;

    let processed = (data || []).map((c) => ({
      ...c,
      vendor: Array.isArray(c.vendor_profiles)
        ? c.vendor_profiles[0]
        : c.vendor_profiles,
      product: Array.isArray(c.vendor_products)
        ? c.vendor_products[0]
        : c.vendor_products,
    }));

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      processed = processed.filter((c) => {
        const s = String(c.subject || "").toLowerCase();
        const d = String(c.description || "").toLowerCase();
        const oId = String(c.order_id || "").toLowerCase();
        return s.includes(q) || d.includes(q) || oId.includes(q);
      });
    }

    return {
      complaints: processed,
      totalCount: count || processed.length,
    };
  },

  /**
   * Updates complaint state, internal investigation notes, and resolution
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

    if (error) throw error;
    return data;
  },
};
