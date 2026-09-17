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
  MANAGE_CONTENT: "MANAGE_CONTENT",
  VIEW_AUDIT_LOGS: "VIEW_AUDIT_LOGS",
};

export const adminPermissionService = {
  async getMyPermissions() {
    try {
      const { data, error } = await supabase.rpc("get_my_admin_permissions");

      if (error) {
        console.error("Failed to load admin permissions:", error.message);

        return [];
      }

      if (!Array.isArray(data)) {
        return [];
      }

      return data
        .map((item) =>
          typeof item === "string" ? item : item?.permission_code || item?.code,
        )
        .filter(Boolean);
    } catch (error) {
      console.error("Unexpected error loading admin permissions:", error);

      return [];
    }
  },
};
