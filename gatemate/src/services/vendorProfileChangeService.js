import { supabase } from "../lib/supabaseClient";

export const vendorProfileChangeService = {
  /**
   * Fetches the vendor's profile and active change request history
   */
  async getVendorProfileWithRequests(vendorId) {
    const [profileRes, requestsRes] = await Promise.all([
      supabase.from("vendor_profiles").select("*").eq("id", vendorId).single(),
      supabase
        .from("vendor_profile_change_requests")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false }),
    ]);

    if (profileRes.error) throw profileRes.error;

    return {
      profile: profileRes.data,
      changeRequests: requestsRes.data || [],
    };
  },

  /**
   * Submits a new profile change request for Admin review
   */
  async submitChangeRequest({
    vendorId,
    requestedField,
    currentValue,
    requestedValue,
    reason,
    supportingDocumentPath = null,
  }) {
    const { data, error } = await supabase
      .from("vendor_profile_change_requests")
      .insert({
        vendor_id: vendorId,
        requested_field: requestedField,
        current_value:
          typeof currentValue === "object"
            ? currentValue
            : { value: currentValue },
        requested_value:
          typeof requestedValue === "object"
            ? requestedValue
            : { value: requestedValue },
        reason: reason.trim(),
        supporting_document: supportingDocumentPath,
        status: "SUBMITTED",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
