import { supabase } from "../lib/supabaseClient";

export const adminProfileChangeService = {
  /**
   * Fetches paginated vendor change requests with vendor metadata
   */
  async getChangeRequests({
    status = "ALL",
    search = "",
    limit = 50,
    offset = 0,
  } = {}) {
    let query = supabase
      .from("vendor_profile_change_requests")
      .select(
        `
        *,
        vendor_profiles:vendor_id (
          id,
          business_name,
          trade_name,
          email,
          phone,
          gstin
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

    let filtered = data || [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((r) => {
        const bName = String(
          r.vendor_profiles?.business_name || "",
        ).toLowerCase();
        const email = String(r.vendor_profiles?.email || "").toLowerCase();
        const field = String(r.requested_field || "").toLowerCase();
        const reqId = String(r.id || "").toLowerCase();
        return (
          bName.includes(q) ||
          email.includes(q) ||
          field.includes(q) ||
          reqId.includes(q)
        );
      });
    }

    return {
      requests: filtered,
      totalCount: count || filtered.length,
    };
  },

  /**
   * Generates a signed URL to view private supporting documents securely
   */
  async getSignedDocumentUrl(filePath) {
    if (!filePath) return null;
    try {
      const { data, error } = await supabase.storage
        .from("vendor-verification-docs")
        .createSignedUrl(filePath, 300);

      if (error) return null;
      return data?.signedUrl;
    } catch {
      return null;
    }
  },

  /**
   * Executes Approve, Reject, or Request Changes via Postgres RPC
   */
  async processDecision({
    requestId,
    decision,
    reviewerNotes = "",
    rejectionReason = "",
  }) {
    const { data, error } = await supabase.rpc(
      "process_vendor_profile_change_decision",
      {
        p_request_id: requestId,
        p_decision: decision,
        p_reviewer_notes: reviewerNotes.trim(),
        p_rejection_reason: rejectionReason.trim() || null,
      },
    );

    if (error) throw error;
    return data;
  },
};
