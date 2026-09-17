import { supabase } from "../lib/supabaseClient";

export const USER_ROLES = {
  ADMIN: "ADMIN",
  VENDOR: "VENDOR",
  CUSTOMER: "CUSTOMER",
};

export const roleService = {
  async resolveUserRole(user) {
    if (!user?.id) {
      return null;
    }

    try {
      const { data: role, error: roleError } =
        await supabase.rpc("get_auth_role");

      if (roleError) {
        console.error("Failed to resolve user role:", roleError.message);

        return null;
      }

      if (
        role === USER_ROLES.ADMIN ||
        role === USER_ROLES.VENDOR ||
        role === USER_ROLES.CUSTOMER
      ) {
        return role;
      }

      return USER_ROLES.CUSTOMER;
    } catch (error) {
      console.error("Unexpected role resolution error:", error);

      return null;
    }
  },
};
