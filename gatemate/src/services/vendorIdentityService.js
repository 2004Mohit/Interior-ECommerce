import { supabase } from "../lib/supabaseClient";

/**
 * Ferrado Vendor Identity Service
 *
 * There are two different IDs in the vendor system:
 *
 * 1. auth.users.id
 *    - Supabase Auth user UUID
 *    - Used by vendor_applications.user_id
 *    - Used by vendor_profiles.user_id
 *
 * 2. vendor_profiles.id
 *    - Ferrado vendor profile UUID
 *    - Used by vendor_products.vendor_id
 *    - Used by other vendor-owned tables that reference vendor_profiles.id
 *
 * NEVER use a hardcoded vendor ID.
 */

export const vendorIdentityService = {
  /**
   * Get the currently authenticated Supabase user.
   *
   * Returns:
   * auth.users.id
   */
  async getAuthUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Failed to get authenticated user:", error);
      throw new Error(`Unable to get authenticated user: ${error.message}`);
    }

    if (!user?.id) {
      throw new Error("No authenticated user found.");
    }

    return user;
  },

  /**
   * Get the authenticated user's Supabase Auth UUID.
   *
   * This ID must be used for:
   * vendor_applications.user_id
   * vendor_profiles.user_id
   */
  async getAuthUserId() {
    const user = await this.getAuthUser();

    return user.id;
  },

  /**
   * Get the Ferrado vendor_profiles.id belonging to
   * the currently authenticated Supabase user.
   *
   * This ID must be used for vendor-owned tables such as:
   * vendor_products.vendor_id
   * vendor_inventory.vendor_id
   * vendor_orders.vendor_id
   * etc.
   *
   * Uses the existing database RPC:
   * public.get_vendor_id_for_auth_user()
   */
  async getVendorProfileId() {
    const { data, error } = await supabase.rpc("get_vendor_id_for_auth_user");

    if (error) {
      console.error("Failed to resolve vendor profile ID:", error);

      throw new Error(`Unable to resolve vendor profile: ${error.message}`);
    }

    if (!data) {
      throw new Error(
        "Vendor profile not found. The vendor may not be approved yet.",
      );
    }

    return data;
  },

  /**
   * Get both IDs together.
   *
   * Useful when a service needs both the Auth UUID
   * and the vendor profile UUID.
   */
  async getIdentity() {
    const user = await this.getAuthUser();

    const vendorProfileId = await this.getVendorProfileId();

    return {
      authUser: user,
      authUserId: user.id,
      vendorProfileId,
    };
  },

  /**
   * Check whether the currently authenticated user
   * has an approved/available vendor profile.
   */
  async hasVendorProfile() {
    try {
      const vendorProfileId = await this.getVendorProfileId();

      return Boolean(vendorProfileId);
    } catch (error) {
      return false;
    }
  },
};
