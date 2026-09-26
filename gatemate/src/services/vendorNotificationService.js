/**
 * Ferrado Vendor Notifications Service
 *
 * Notification Categories:
 * - VERIFICATION: Depot onboarding verification approvals, changes requested
 * - PRODUCT_MODERATION: Product approval, rejection, or changes requested by admin
 * - ORDERS: New site orders, 30-min priority dispatch alerts, order status updates
 * - RFQS_QUOTATIONS: New commercial BOQ RFQs, quotation acceptance by contractors
 * - SETTLEMENTS: Bank payout disbursements, UTR updates
 * - PLATFORM_NOTICES: Regional monsoon dispatch alerts, compliance reminders
 */

import { supabase } from "../lib/supabaseClient";

export const VENDOR_NOTIFICATION_CATEGORIES = {
  ALL: "ALL",
  VERIFICATION: "VERIFICATION",
  PRODUCT_MODERATION: "PRODUCT_MODERATION",
  ORDERS: "ORDERS",
  RFQS_QUOTATIONS: "RFQS_QUOTATIONS",
  SETTLEMENTS: "SETTLEMENTS",
  PLATFORM_NOTICES: "PLATFORM_NOTICES",
};

export const vendorNotificationService = {
  async _resolveVendorId() {
    const { data: vendorId, error } = await supabase.rpc(
      "get_vendor_id_for_auth_user",
    );
    if (error) {
      throw new Error(`Unable to resolve vendor profile: ${error.message}`);
    }
    if (!vendorId) {
      throw new Error(
        "Vendor profile not found. The vendor may not be approved yet.",
      );
    }
    return vendorId;
  },

  async getNotifications() {
    const vendorId = await this._resolveVendorId();

    const { data, error } = await supabase
      .from("vendor_notifications")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Unable to load notifications: ${error.message}`);
    }

    return data || [];
  },

  async markAsRead(notificationId) {
    const vendorId = await this._resolveVendorId();

    const { error } = await supabase
      .from("vendor_notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("vendor_id", vendorId);

    if (error) {
      throw new Error(`Unable to update notification: ${error.message}`);
    }

    return this.getNotifications();
  },

  async markAllAsRead() {
    const vendorId = await this._resolveVendorId();

    const { error } = await supabase
      .from("vendor_notifications")
      .update({ is_read: true })
      .eq("vendor_id", vendorId);

    if (error) {
      throw new Error(`Unable to update notifications: ${error.message}`);
    }

    return this.getNotifications();
  },
};
