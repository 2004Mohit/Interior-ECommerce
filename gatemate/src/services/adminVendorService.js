import { supabase } from "../lib/supabaseClient";

export const adminVendorService = {
  /**
   * Fetches paginated vendor applications with multi-field search and status filters
   */
  async getVendorApplications({
    search = "",
    status = "ALL",
    limit = 50,
    offset = 0,
  } = {}) {
    let query = supabase
      .from("vendor_applications")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "ALL") {
      query = query.eq("status", status.toUpperCase());
    }

    const { data, count, error } = await query;
    if (error) throw error;

    let filtered = data || [];

    // Search by business name, email, phone, or application ID
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((app) => {
        const appId = String(app.id || "").toLowerCase();
        const bName = String(
          app.business_details?.legalBusinessName ||
            app.business_details?.tradeName ||
            "",
        ).toLowerCase();
        const email = String(app.ownerDetails?.email || "").toLowerCase();
        const phone = String(
          app.ownerDetails?.mobileNumber || "",
        ).toLowerCase();
        const gstin = String(app.business_details?.gstin || "").toLowerCase();

        return (
          appId.includes(q) ||
          bName.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          gstin.includes(q)
        );
      });
    }

    return {
      applications: filtered,
      totalCount: count || filtered.length,
    };
  },

  /**
   * Fetches a single vendor application by ID
   */
  async getVendorApplicationById(applicationId) {
    const { data, error } = await supabase
      .from("vendor_applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Generates a temporary signed URL for private verification documents
   */
  async getSignedDocumentUrl(filePath, expiresIn = 300) {
    if (!filePath) return null;
    try {
      const { data, error } = await supabase.storage
        .from("vendor-verification-docs")
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        console.warn("Signed URL generation warning:", error.message);
        return null;
      }
      return data?.signedUrl;
    } catch {
      return null;
    }
  },

  /**
   * Executes Approve, Reject, or Request Changes via Postgres RPC
   */
  async submitDecision({
    applicationId,
    decision, // 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED'
    reviewerNotes = "",
    rejectionReason = "",
    requestedChanges = [],
  }) {
    const { data, error } = await supabase.rpc(
      "process_vendor_application_decision",
      {
        p_application_id: applicationId,
        p_decision: decision,
        p_reviewer_notes: reviewerNotes.trim(),
        p_rejection_reason: rejectionReason.trim() || null,
        p_requested_changes: requestedChanges,
      },
    );

    if (error) throw error;
    return data;
  },
};
