import { supabase } from "../lib/supabaseClient";

/**
 * Ferrado Notification System
 *
 * Current customer notification channels:
 * - IN_APP: Persistent notification inbox
 * - EMAIL: Reserved for transactional email workflows
 * - SMS: Reserved for future server-side implementation
 *
 * IMPORTANT:
 * - No Twilio credentials belong in client-side code.
 * - SMS delivery must be handled server-side through a Supabase Edge Function.
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
 * Converts the database notification structure into
 * the structure expected by the customer UI.
 *
 * Database:
 * - id
 * - user_id
 * - title
 * - message
 * - notification_type
 * - order_id
 * - is_read
 * - created_at
 *
 * UI:
 * - id
 * - userId
 * - title
 * - message
 * - type
 * - orderId
 * - isRead
 * - createdAt
 * - link
 * - channel
 */
function mapDatabaseNotification(notification) {
  const notificationType =
    notification.notification_type || NOTIFICATION_TYPES.ORDER_UPDATE;

  return {
    id: notification.id,
    userId: notification.user_id,
    title: notification.title,
    message: notification.message,
    type: notificationType,
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
   * Retrieves all in-app notifications for the authenticated customer.
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
          notification_type,
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
      throw new Error(
        "AUTH_REQUIRED: You must be logged in to update notifications.",
      );
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
   * Marks all unread notifications belonging to the
   * authenticated customer as read.
   */
  async markAllAsRead(userId) {
    if (!userId) {
      throw new Error(
        "AUTH_REQUIRED: You must be logged in to update notifications.",
      );
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
   * Marks a notification as unread.
   *
   * Useful if we later add a "Mark as unread" action.
   */
  async markAsUnread(userId, notificationId) {
    if (!userId) {
      throw new Error(
        "AUTH_REQUIRED: You must be logged in to update notifications.",
      );
    }

    if (!notificationId) {
      throw new Error("NOTIFICATION_ID_REQUIRED");
    }

    const { error } = await supabase
      .from("customer_notifications")
      .update({
        is_read: false,
      })
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to mark notification as unread:", error);

      throw error;
    }

    return this.getNotifications(userId);
  },

  /**
   * Creates an in-app notification for a customer.
   *
   * This method is intended for trusted application flows.
   * RLS still applies to the underlying INSERT.
   */
  async createNotification({
    userId,
    title,
    message,
    notificationType = NOTIFICATION_TYPES.ORDER_UPDATE,
    orderId = null,
  }) {
    if (!userId) {
      throw new Error("USER_ID_REQUIRED");
    }

    if (!title?.trim()) {
      throw new Error("NOTIFICATION_TITLE_REQUIRED");
    }

    if (!message?.trim()) {
      throw new Error("NOTIFICATION_MESSAGE_REQUIRED");
    }

    const allowedTypes = Object.values(NOTIFICATION_TYPES);

    if (!allowedTypes.includes(notificationType)) {
      throw new Error(`INVALID_NOTIFICATION_TYPE: ${notificationType}`);
    }

    const { data, error } = await supabase
      .from("customer_notifications")
      .insert({
        user_id: userId,
        title: title.trim(),
        message: message.trim(),
        notification_type: notificationType,
        order_id: orderId || null,
        is_read: false,
      })
      .select(
        `
          id,
          user_id,
          title,
          message,
          notification_type,
          order_id,
          is_read,
          created_at
        `,
      )
      .single();

    if (error) {
      console.error("Failed to create customer notification:", error);

      throw error;
    }

    return mapDatabaseNotification(data);
  },

  /**
   * Deletes a single notification belonging to the
   * authenticated customer.
   */
  async deleteNotification(userId, notificationId) {
    if (!userId) {
      throw new Error("AUTH_REQUIRED");
    }

    if (!notificationId) {
      throw new Error("NOTIFICATION_ID_REQUIRED");
    }

    const { error } = await supabase
      .from("customer_notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to delete customer notification:", error);

      throw error;
    }

    return this.getNotifications(userId);
  },

  /**
   * Dispatches SMS notifications.
   *
   * SMS is NOT active yet.
   *
   * Credentials and provider calls must remain server-side.
   * This method intentionally remains a contract until the
   * Supabase Edge Function and provider credentials are configured.
   */
  async dispatchSmsNotification({ toPhone, messageBody, templateType }) {
    return {
      status: "SMS_NOT_CONFIGURED",
      channel: NOTIFICATION_CHANNELS.SMS,
      delivered: false,
      toPhone: toPhone || null,
      templateType: templateType || null,
      message:
        "SMS notifications are not configured yet. They will be enabled through a server-side notification service.",
    };
  },
};
