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
      // 2. Check admin_users table directly
      const { data: adminMatch } = await supabase
        .from("admin_users")
        .select("id, is_active")
        .eq("id", user.id)
        .maybeSingle();

      if (adminMatch && adminMatch.is_active !== false) {
        return USER_ROLES.ADMIN;
      }

      // 3. Fallback email check
      if (user.email === "admin@gatemate.in") {
        return USER_ROLES.ADMIN;
      }

      // 4. Check vendor entities
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
      // Fallback
    }

    return USER_ROLES.CUSTOMER;
  },
};
