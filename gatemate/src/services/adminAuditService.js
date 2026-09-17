import { supabase } from "../lib/supabaseClient";

export const AUDIT_ACTIONS = {
  // Vendor Lifecycle
  VENDOR_APPROVED: "VENDOR_APPROVED",
  VENDOR_REJECTED: "VENDOR_REJECTED",
  VENDOR_CHANGES_REQUESTED: "VENDOR_CHANGES_REQUESTED",
  VENDOR_PROFILE_CHANGE_APPROVED: "VENDOR_PROFILE_CHANGE_APPROVED",
  VENDOR_PROFILE_CHANGE_REJECTED: "VENDOR_PROFILE_CHANGE_REJECTED",
  VENDOR_SUSPENDED: "VENDOR_SUSPENDED",
  VENDOR_ACTIVATED: "VENDOR_ACTIVATED",

  // Products & Catalogue
  PRODUCT_APPROVED: "PRODUCT_APPROVED",
  PRODUCT_REJECTED: "PRODUCT_REJECTED",
  PRODUCT_CHANGES_REQUESTED: "PRODUCT_CHANGES_REQUESTED",
  PRODUCT_MODIFIED: "PRODUCT_MODIFIED",
  PRODUCT_DELETED: "PRODUCT_DELETED",
  CATEGORY_CREATED: "CATEGORY_CREATED",
  CATEGORY_UPDATED: "CATEGORY_UPDATED",
  CATEGORY_DELETED: "CATEGORY_DELETED",
  ATTRIBUTE_APPROVED: "ATTRIBUTE_APPROVED",
  ATTRIBUTE_REJECTED: "ATTRIBUTE_REJECTED",
  ATTRIBUTE_MERGED: "ATTRIBUTE_MERGED",

  // Inventory & Orders
  INVENTORY_ADJUSTED: "INVENTORY_ADJUSTED",
  ORDER_STATUS_OVERRIDDEN: "ORDER_STATUS_OVERRIDDEN",
  ORDER_CANCELLED_BY_ADMIN: "ORDER_CANCELLED_BY_ADMIN",

  // Commercial RFQs & Quotations
  RFQ_STATUS_UPDATED: "RFQ_STATUS_UPDATED",
  QUOTATION_REVIEWED: "QUOTATION_REVIEWED",

  // Finance & Commissions
  COMMISSION_RATE_OVERRIDDEN: "COMMISSION_RATE_OVERRIDDEN",
  PAYMENT_REFUNDED: "PAYMENT_REFUNDED",
  SETTLEMENT_BATCH_PROCESSED: "SETTLEMENT_BATCH_PROCESSED",
  SETTLEMENT_HELD: "SETTLEMENT_HELD",

  // Customer & Moderation
  CUSTOMER_STATUS_UPDATED: "CUSTOMER_STATUS_UPDATED",
  REVIEW_MODERATED: "REVIEW_MODERATED",
  REVIEW_DELETED: "REVIEW_DELETED",
  COMPLAINT_RESOLVED: "COMPLAINT_RESOLVED",
  COMPLAINT_REJECTED: "COMPLAINT_REJECTED",

  // Marketing & CMS Content
  CONTENT_PAGE_UPDATED: "CONTENT_PAGE_UPDATED",
};

export const AUDIT_ENTITIES = {
  VENDOR: "VENDOR",
  VENDOR_APPLICATION: "VENDOR_APPLICATION",
  PRODUCT: "PRODUCT",
  CATEGORY: "CATEGORY",
  ATTRIBUTE: "ATTRIBUTE",
  INVENTORY: "INVENTORY",
  ORDER: "ORDER",
  RFQ: "RFQ",
  QUOTATION: "QUOTATION",
  TRANSACTION: "TRANSACTION",
  SETTLEMENT: "SETTLEMENT",
  CUSTOMER: "CUSTOMER",
  REVIEW: "REVIEW",
  COMPLAINT: "COMPLAINT",
  CONTENT: "CONTENT",
};

export const adminAuditService = {
  /**
   * Records an administrative action via Postgres RPC function
   */
  async recordLog({
    action,
    entityType,
    entityId,
    previousValue = null,
    newValue = null,
    reason = null,
  }) {
    try {
      const { data, error } = await supabase.rpc("log_admin_action", {
        p_action: action,
        p_entity_type: entityType,
        p_entity_id: String(entityId),
        p_previous_value: previousValue
          ? JSON.parse(JSON.stringify(previousValue))
          : null,
        p_new_value: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
        p_reason: reason,
        p_ip_address: null,
        p_user_agent:
          typeof navigator !== "undefined" ? navigator.userAgent : null,
      });

      if (error) {
        console.warn("Audit log RPC failed:", error.message);
      }
      return data;
    } catch (err) {
      console.warn("Admin audit logging failed:", err);
      return null;
    }
  },

  /**
   * Fetches paginated audit logs with optional filtering
   */
  async getAuditLogs({
    entityType = null,
    action = null,
    adminUserId = null,
    limit = 50,
    offset = 0,
  } = {}) {
    let query = supabase
      .from("admin_audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (entityType && entityType !== "ALL") {
      query = query.eq("entity_type", entityType);
    }
    if (action && action !== "ALL") {
      query = query.eq("action", action);
    }
    if (adminUserId) {
      query = query.eq("admin_user_id", adminUserId);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      logs: data || [],
      totalCount: count || 0,
    };
  },
};
