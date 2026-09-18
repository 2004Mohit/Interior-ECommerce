import { supabase } from "../lib/supabaseClient";

export const vendorProfileChangeService = {
  /**
   * Fetch vendor profile and change request history.
   *
   * IMPORTANT:
   * vendorUserId = auth.users.id
   * vendor_profiles.user_id = auth.users.id
   * vendor_profiles.id = vendor profile ID
   */
  async getVendorProfileWithRequests(vendorUserId) {
    if (!vendorUserId) {
      throw new Error("Vendor user ID is required.");
    }

    // First resolve the vendor profile using the Auth user ID.
    const { data: profile, error: profileError } = await supabase
      .from("vendor_profiles")
      .select("*")
      .eq("user_id", vendorUserId)
      .maybeSingle();

    if (profileError) {
      console.error("Failed to fetch vendor profile:", profileError);
      throw profileError;
    }

    if (!profile) {
      throw new Error(
        "Vendor profile was not found for the authenticated account.",
      );
    }

    // vendor_profile_change_requests.vendor_id references
    // vendor_profiles.id, NOT auth.users.id.
    const { data: changeRequests, error: requestsError } = await supabase
      .from("vendor_profile_change_requests")
      .select("*")
      .eq("vendor_id", profile.id)
      .order("created_at", { ascending: false });

    if (requestsError) {
      console.error(
        "Failed to fetch vendor profile change requests:",
        requestsError,
      );
      throw requestsError;
    }

    return {
      profile,
      changeRequests: changeRequests || [],
    };
  },

  /**
   * Submit a vendor profile change request.
   *
   * Accepts auth.users.id and internally resolves vendor_profiles.id.
   */
  async submitChangeRequest({
    vendorUserId,
    requestedField,
    currentValue,
    requestedValue,
    reason,
    supportingDocumentPath = null,
  }) {
    if (!vendorUserId) {
      throw new Error("Vendor user ID is required.");
    }

    if (!requestedField) {
      throw new Error("Requested field is required.");
    }

    if (!reason?.trim()) {
      throw new Error("Reason is required.");
    }

    // Resolve vendor_profiles.id from auth.users.id.
    const { data: profile, error: profileError } = await supabase
      .from("vendor_profiles")
      .select("id")
      .eq("user_id", vendorUserId)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (!profile) {
      throw new Error(
        "Vendor profile was not found for the authenticated account.",
      );
    }

    const { data, error } = await supabase
      .from("vendor_profile_change_requests")
      .insert({
        vendor_id: profile.id,
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
      .maybeSingle();

    if (error) {
      console.error("Failed to submit vendor profile change request:", error);
      throw error;
    }

    return data;
  },
};
