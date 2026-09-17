import { supabase } from "../lib/supabaseClient";

/**
 * GateMate Notification System & Provider Abstraction
 *
 * Channels:
 * 1. IN_APP - Persistent in-app alert inbox
 * 2. EMAIL  - Transactional order/security receipts
 * 3. SMS    - Server-side transactional notifications
 *
 * IMPORTANT SECURITY RULES:
 * 1. Twilio credentials must NEVER be stored in client code.
 * 2. SMS delivery must be executed server-side through
 *    a Supabase Edge Function.
 */

export const NOTIFICATION_CHANNELS = {
  IN_APP: "IN_APP",
  EMAIL: "EMAIL",
  SMS: "SMS",
};

export const NOTIFICATION_TYPES = {
  ORDER_UPDATE: "ORDER_UPDATE",
  PAYMENT_UPDATE: "PAYMENT_UPDATE",
  DELIVERY_DISPATCH: "DELIVERY_DISPATCH",
  SECURITY_ACCOUNT: "SECURITY_ACCOUNT",
  MARKETPLACE_ANNOUNCEMENT: "MARKETPLACE_ANNOUNCEMENT",
};

/**
 * Converts the database notification structure into the
 * structure expected by the existing customer UI.
 *
 * Database:
 * - id
 * - user_id
 * - title
 * - message
 * - order_id
 * - is_read
 * - created_at
 *
 * UI:
 * - id
 * - title
 * - message
 * - orderId
 * - isRead
 * - createdAt
 * - link
 * - channel
 */
function mapDatabaseNotification(notification) {
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    orderId: notification.order_id || null,
    isRead: Boolean(notification.is_read),
    createdAt: notification.created_at,
    link: notification.order_id
      ? `/account/orders/${notification.order_id}`
      : null,
    channel: NOTIFICATION_CHANNELS.IN_APP,
  };
}

export const notificationService = {
  /**
   * Retrieves all in-app notifications for the authenticated user.
   *
   * Data source:
   * public.customer_notifications
   */
  async getNotifications(userId) {
    if (!userId) {
      throw new Error(
        "AUTH_REQUIRED: You must be logged in to view notifications.",
      );
    }

    const { data, error } = await supabase
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
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch customer notifications:", error);
      throw error;
    }

    return (data || []).map(mapDatabaseNotification);
  },

  /**
   * Marks a single notification as read.
   */
  async markAsRead(userId, notificationId) {
    if (!userId) {
      throw new Error("AUTH_REQUIRED");
    }

    if (!notificationId) {
      throw new Error("NOTIFICATION_ID_REQUIRED");
    }

    const { error } = await supabase
      .from("customer_notifications")
      .update({
        is_read: true,
      })
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to mark notification as read:", error);
      throw error;
    }

    return this.getNotifications(userId);
  },

  /**
   * Marks all notifications belonging to the authenticated
   * customer as read.
   */
  async markAllAsRead(userId) {
    if (!userId) {
      throw new Error("AUTH_REQUIRED");
    }

    const { error } = await supabase
      .from("customer_notifications")
      .update({
        is_read: true,
      })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("Failed to mark all notifications as read:", error);
      throw error;
    }

    return this.getNotifications(userId);
  },

  /**
   * Dispatches SMS notifications.
   *
   * SMS credentials and provider calls must remain server-side.
   * This client-side method is intentionally left as a contract
   * until the Supabase Edge Function is configured.
   */
  async dispatchSmsNotification({ toPhone, messageBody, templateType }) {
    return {
      status: "TWILIO_SETUP_REQUIRED",
      channel: NOTIFICATION_CHANNELS.SMS,
      delivered: false,
      message:
        "Twilio SMS service is pending server-side Edge Function credentials.",
    };
  },
};
