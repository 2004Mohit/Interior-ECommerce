import { supabase } from "../lib/supabaseClient";

export const ADMIN_PERMISSIONS = {
  VIEW_DASHBOARD: "VIEW_DASHBOARD",
  MANAGE_VENDORS: "MANAGE_VENDORS",
  REVIEW_VENDOR_APPLICATIONS: "REVIEW_VENDOR_APPLICATIONS",
  REVIEW_VENDOR_PROFILE_CHANGES: "REVIEW_VENDOR_PROFILE_CHANGES",
  MANAGE_PRODUCTS: "MANAGE_PRODUCTS",
  REVIEW_PRODUCTS: "REVIEW_PRODUCTS",
  MANAGE_CATEGORIES: "MANAGE_CATEGORIES",
  MANAGE_ATTRIBUTES: "MANAGE_ATTRIBUTES",
  MANAGE_INVENTORY: "MANAGE_INVENTORY",
  MANAGE_ORDERS: "MANAGE_ORDERS",
  MANAGE_DELIVERY: "MANAGE_DELIVERY",
  MANAGE_RFQ: "MANAGE_RFQ",
  MANAGE_PAYMENTS: "MANAGE_PAYMENTS",
  MANAGE_COMMISSIONS: "MANAGE_COMMISSIONS",
  MANAGE_SETTLEMENTS: "MANAGE_SETTLEMENTS",
  MANAGE_CUSTOMERS: "MANAGE_CUSTOMERS",
  MODERATE_REVIEWS: "MODERATE_REVIEWS",
  MANAGE_COMPLAINTS: "MANAGE_COMPLAINTS",
  MANAGE_NOTIFICATIONS: "MANAGE_NOTIFICATIONS",
  MANAGE_BANNERS: "MANAGE_BANNERS",
  MANAGE_PROMOTIONS: "MANAGE_PROMOTIONS",
  MANAGE_CONTENT: "MANAGE_CONTENT",
  VIEW_AUDIT_LOGS: "VIEW_AUDIT_LOGS",
};

export const adminPermissionService = {
  /**
   * Loads all active permissions for the currently authenticated admin
   */
  async getMyPermissions() {
    try {
      const { data, error } = await supabase.rpc("get_my_admin_permissions");
      if (error) throw error;

      if (Array.isArray(data)) {
        return data
          .map((item) =>
            typeof item === "string"
              ? item
              : item?.permission_code || item?.code,
          )
          .filter(Boolean);
      }
      return Object.values(ADMIN_PERMISSIONS);
    } catch {
      // Fallback: If active Admin in auth context, grant platform permissions
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (
        user?.app_metadata?.role === "ADMIN" ||
        user?.user_metadata?.role === "ADMIN"
      ) {
        return Object.values(ADMIN_PERMISSIONS);
      }
      return [];
    }
  },
};
