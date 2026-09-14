import { supabase } from "../lib/supabaseClient";

export const USER_ROLES = {
  ADMIN: "ADMIN",
  VENDOR: "VENDOR",
  CUSTOMER: "CUSTOMER",
};

export const roleService = {
  /**
   * Resolves user role reliably from Supabase user session and DB
   */
  async resolveUserRole(user) {
    if (!user?.id) return null;

    // 1. Check JWT metadata
    const metaRole = (
      user.app_metadata?.role ||
      user.user_metadata?.role ||
      ""
    ).toUpperCase();
    if (metaRole === USER_ROLES.ADMIN) return USER_ROLES.ADMIN;
    if (metaRole === USER_ROLES.VENDOR) return USER_ROLES.VENDOR;

    try {
      // 2. Query Postgres RPC function get_auth_role() if available
      const { data: rpcRole, error: rpcErr } =
        await supabase.rpc("get_auth_role");
      if (!rpcErr && rpcRole) {
        return rpcRole.toUpperCase();
      }
    } catch {
      // Fallback to table queries below
    }

    try {
      // 3. Check admin_users table
      const { data: adminMatch } = await supabase
        .from("admin_users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (adminMatch) return USER_ROLES.ADMIN;

      // 4. Check vendor_profiles & vendor_applications
      const [vendorProfileRes, vendorAppRes] = await Promise.all([
        supabase
          .from("vendor_profiles")
          .select("id, verification_status")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("vendor_applications")
          .select("id, status")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (vendorProfileRes.data || vendorAppRes.data) {
        return USER_ROLES.VENDOR;
      }
    } catch {
      // Fallback to customer
    }

    return USER_ROLES.CUSTOMER;
  },
};
