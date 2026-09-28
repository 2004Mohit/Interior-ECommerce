/**
 * Ferrado Vendor Notifications Service
 *
 * Notification Categories:
 * - VERIFICATION: Vendor onboarding verification approvals, changes requested
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

const normalizeNotification = (notification) => {
  if (!notification) return null;

  return {
    id: notification.id,
    vendorId: notification.vendor_id ?? notification.vendorId ?? null,
    category: notification.category ?? "PLATFORM_NOTICES",
    title: notification.title ?? "",
    message: notification.message ?? "",
    link: notification.link ?? null,

    // Database -> React naming
    isRead: notification.is_read ?? notification.isRead ?? false,

    createdAt:
      notification.created_at ??
      notification.createdAt ??
      new Date().toISOString(),

    updatedAt: notification.updated_at ?? notification.updatedAt ?? null,

    // Keep any additional database fields available
    ...notification,
  };
};

export const vendorNotificationService = {
  /**
   * Resolve the vendor profile ID belonging to the
   * currently authenticated vendor user.
   */
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

  /**
   * Get all notifications for the current vendor.
   *
   * Returns normalized camelCase objects for React.
   */
  async getNotifications() {
    const vendorId = await this._resolveVendorId();

    const { data, error } = await supabase
      .from("vendor_notifications")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw new Error(`Unable to load notifications: ${error.message}`);
    }

    return (data || []).map(normalizeNotification).filter(Boolean);
  },

  /**
   * Get unread notification count.
   */
  async getUnreadCount() {
    const vendorId = await this._resolveVendorId();

    const { count, error } = await supabase
      .from("vendor_notifications")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("vendor_id", vendorId)
      .eq("is_read", false);

    if (error) {
      throw new Error(
        `Unable to load unread notification count: ${error.message}`,
      );
    }

    return count || 0;
  },

  /**
   * Mark one notification as read.
   */
  async markAsRead(notificationId) {
    if (!notificationId) {
      throw new Error("Notification ID is required.");
    }

    const vendorId = await this._resolveVendorId();

    const { error } = await supabase
      .from("vendor_notifications")
      .update({
        is_read: true,
      })
      .eq("id", notificationId)
      .eq("vendor_id", vendorId);

    if (error) {
      throw new Error(`Unable to update notification: ${error.message}`);
    }

    return this.getNotifications();
  },

  /**
   * Mark all vendor notifications as read.
   */
  async markAllAsRead() {
    const vendorId = await this._resolveVendorId();

    const { error } = await supabase
      .from("vendor_notifications")
      .update({
        is_read: true,
      })
      .eq("vendor_id", vendorId)
      .eq("is_read", false);

    if (error) {
      throw new Error(`Unable to update notifications: ${error.message}`);
    }

    return this.getNotifications();
  },

  /**
   * Subscribe to realtime notification changes for the current vendor.
   *
   * Callback receives:
   *
   * {
   *   event: "INSERT" | "UPDATE" | "DELETE",
   *   notification: normalizedNotification | null
   * }
   *
   * Returns an unsubscribe function.
   */
  async subscribeToNotifications(callback) {
    if (typeof callback !== "function") {
      throw new Error(
        "A callback function is required for notification subscription.",
      );
    }

    const vendorId = await this._resolveVendorId();

    const channelName = `vendor-notifications-${vendorId}-${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "vendor_notifications",
          filter: `vendor_id=eq.${vendorId}`,
        },
        (payload) => {
          try {
            const eventType = payload.eventType;

            let notification = null;

            if (eventType === "INSERT" || eventType === "UPDATE") {
              notification = normalizeNotification(payload.new);
            } else if (eventType === "DELETE") {
              notification = normalizeNotification(payload.old);
            }

            callback({
              event: eventType,
              notification,
              payload,
            });
          } catch (error) {
            console.error(
              "Error processing vendor notification realtime event:",
              error,
            );
          }
        },
      )
      .subscribe((status, error) => {
        if (status === "SUBSCRIBED") {
          console.log("Vendor notification realtime subscription active.");
        }

        if (status === "CHANNEL_ERROR") {
          console.error("Vendor notification realtime channel error:", error);
        }

        if (status === "TIMED_OUT") {
          console.error("Vendor notification realtime subscription timed out.");
        }

        if (status === "CLOSED") {
          console.log("Vendor notification realtime subscription closed.");
        }
      });

    /**
     * Cleanup function.
     */
    return async () => {
      try {
        await supabase.removeChannel(channel);
      } catch (error) {
        console.error(
          "Unable to remove vendor notification realtime channel:",
          error,
        );
      }
    };
  },
};
