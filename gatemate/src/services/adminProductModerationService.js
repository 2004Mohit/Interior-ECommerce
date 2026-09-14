import { supabase } from "../lib/supabaseClient";

export const adminProductModerationService = {
  /**
   * Fetches paginated products across all vendors with search and status filtering
   */
  async getProductsQueue({
    status = "ALL",
    search = "",
    limit = 50,
    offset = 0,
  } = {}) {
    let query = supabase
      .from("vendor_products")
      .select(
        `
        *,
        vendor_profiles:vendor_id (
          id,
          business_name,
          trade_name,
          email,
          phone,
          city,
          locality
        ),
        vendor_inventory (
          on_hand_stock,
          reserved_stock,
          low_stock_threshold
        )
      `,
        { count: "exact" },
      )
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "ALL") {
      query = query.eq("status", status);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    let filtered = data || [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        const name = String(p.name || "").toLowerCase();
        const brand = String(p.brand || "").toLowerCase();
        const vName = String(
          p.vendor_profiles?.business_name || "",
        ).toLowerCase();
        const category = String(p.category_slug || "").toLowerCase();
        const sku = String(p.sku || "").toLowerCase();
        return (
          name.includes(q) ||
          brand.includes(q) ||
          vName.includes(q) ||
          category.includes(q) ||
          sku.includes(q)
        );
      });
    }

    return {
      products: filtered,
      totalCount: count || filtered.length,
    };
  },

  /**
   * Submits moderation decision: APPROVED, PUBLISHED, CHANGES_REQUESTED, or REJECTED
   */
  async submitDecision({
    productId,
    decision,
    reviewerNotes = "",
    rejectionReason = "",
  }) {
    const { data, error } = await supabase.rpc(
      "process_product_moderation_decision",
      {
        p_product_id: productId,
        p_decision: decision,
        p_reviewer_notes: reviewerNotes.trim(),
        p_rejection_reason: rejectionReason.trim() || null,
      },
    );

    if (error) throw error;
    return data;
  },
};
