import { supabase } from "../lib/supabaseClient";

export const adminContentService = {
  /**
   * Dispatches operational broadcast notifications.
   *
   * Supported recipient types should be handled by the
   * Supabase RPC:
   * - ALL_VENDORS
   * - ALL_CUSTOMERS
   * - VENDOR
   * - CUSTOMER
   *
   * The RPC is responsible for authorization, recipient validation,
   * and inserting into the appropriate notification table.
   */
  async broadcastNotification({
    recipientType,
    recipientId = null,
    category = "PLATFORM_NOTICES",
    title,
    message,
    link = null,
  }) {
    if (!recipientType) {
      throw new Error("Recipient type is required.");
    }

    if (!title?.trim()) {
      throw new Error("Notification title is required.");
    }

    if (!message?.trim()) {
      throw new Error("Notification message is required.");
    }

    const validVendorCategories = [
      "ALL",
      "VERIFICATION",
      "PRODUCT_MODERATION",
      "ORDERS",
      "RFQS_QUOTATIONS",
      "SETTLEMENTS",
      "PLATFORM_NOTICES",
    ];

    if (!validVendorCategories.includes(category)) {
      throw new Error(`Invalid notification category: ${category}.`);
    }

    const { data, error } = await supabase.rpc(
      "admin_broadcast_operational_notification",
      {
        p_recipient_type: recipientType,
        p_recipient_id: recipientId || null,
        p_category: category,
        p_title: title.trim(),
        p_message: message.trim(),
        p_link: link?.trim() || null,
      },
    );

    if (error) {
      console.error("Failed to broadcast operational notification:", error);
      throw error;
    }

    return data;
  },

  /**
   * Fetches operational notification history from both
   * vendor_notifications and customer_notifications.
   *
   * IMPORTANT:
   * customer_notifications uses:
   * - user_id
   * - title
   * - message
   * - order_id
   * - is_read
   * - created_at
   *
   * It does NOT use customer_id or link.
   */
  async getOperationalNotificationsLedger() {
    const [vendorResult, customerResult] = await Promise.all([
      supabase
        .from("vendor_notifications")
        .select(
          `
          id,
          vendor_id,
          category,
          title,
          message,
          link,
          is_read,
          created_at,
          vendor_profiles:vendor_id (
            business_name,
            locality
          )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(50),

      supabase
        .from("customer_notifications")
        .select(
          `
          id,
          user_id,
          title,
          message,
          order_id,
          is_read,
          created_at
        `,
        )
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (vendorResult.error) {
      console.error(
        "Failed to fetch vendor notification ledger:",
        vendorResult.error,
      );
      throw vendorResult.error;
    }

    if (customerResult.error) {
      console.error(
        "Failed to fetch customer notification ledger:",
        customerResult.error,
      );
      throw customerResult.error;
    }

    const vendorNotifications = (vendorResult.data || []).map(
      (notification) => ({
        ...notification,
        targetType: "VENDOR",
        targetLabel:
          notification.vendor_profiles?.business_name || "Vendor Depot",
      }),
    );

    const customerNotifications = (customerResult.data || []).map(
      (notification) => ({
        ...notification,
        targetType: "CUSTOMER",
        targetLabel: notification.user_id
          ? `Customer #${notification.user_id.slice(0, 8)}`
          : "Customer",
      }),
    );

    return [...vendorNotifications, ...customerNotifications].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  },
};
