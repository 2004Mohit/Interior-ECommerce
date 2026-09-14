import { supabase } from "../lib/supabaseClient";

export const adminAttributeService = {
  /**
   * Fetches category attributes with optional category filter
   */
  async getAttributesByCategory(categorySlug = "ALL") {
    let query = supabase
      .from("category_attributes")
      .select("*")
      .order("name", { ascending: true });

    if (categorySlug && categorySlug !== "ALL") {
      query = query.eq("category_slug", categorySlug);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Fetches vendor attribute suggestions
   */
  async getAttributeSuggestions({
    status = "PENDING",
    categorySlug = "ALL",
  } = {}) {
    let query = supabase
      .from("product_attribute_suggestions")
      .select(
        `
        *,
        vendor_profiles:vendor_id (
          business_name,
          email,
          phone
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (status && status !== "ALL") {
      query = query.eq("status", status);
    }
    if (categorySlug && categorySlug !== "ALL") {
      query = query.eq("category_slug", categorySlug);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Creates or updates a category attribute
   */
  async saveAttribute(payload) {
    const { data, error } = await supabase.rpc(
      "admin_save_category_attribute",
      {
        p_id: payload.id || null,
        p_category_slug: payload.category_slug,
        p_name: payload.name.trim(),
        p_type: payload.type || "text",
        p_allowed_values: Array.isArray(payload.allowed_values)
          ? payload.allowed_values
          : [],
        p_is_required: Boolean(payload.is_required),
        p_placeholder: payload.placeholder?.trim() || null,
      },
    );

    if (error) throw error;
    return data;
  },

  /**
   * Merges duplicate attributes across products
   */
  async mergeAttributes(sourceAttributeId, targetAttributeId) {
    const { data, error } = await supabase.rpc(
      "admin_merge_category_attributes",
      {
        p_source_attribute_id: sourceAttributeId,
        p_target_attribute_id: targetAttributeId,
      },
    );

    if (error) throw error;
    return data;
  },

  /**
   * Processes a vendor suggestion (Approve, Reject, or Merge)
   */
  async processSuggestion({
    suggestionId,
    decision,
    targetAttributeName = null,
    reviewerNotes = "",
  }) {
    const { data, error } = await supabase.rpc(
      "admin_process_attribute_suggestion",
      {
        p_suggestion_id: suggestionId,
        p_decision: decision,
        p_target_attribute_name: targetAttributeName,
        p_reviewer_notes: reviewerNotes.trim(),
      },
    );

    if (error) throw error;
    return data;
  },

  /**
   * Safely deletes an attribute if unused by products
   */
  async deleteAttribute(attributeId) {
    const { data, error } = await supabase.rpc(
      "admin_delete_category_attribute",
      {
        p_attribute_id: attributeId,
      },
    );

    if (error) throw error;
    return data;
  },
};
