/**
 * GateMate Notification System & Provider Abstraction
 *
 * Channels:
 * 1. IN_APP (Persistent in-app alert inbox)
 * 2. EMAIL (Transactional order/security receipts)
 * 3. SMS (Twilio Verify / Transactional Delivery Dispatch alerts)
 *
 * IMPORTANT SECURITY RULES:
 * 1. TWILIO AUTH TOKENS AND API SECRETS MUST NEVER BE STORED IN CLIENT CODE.
 * 2. Twilio SMS dispatches are strictly executed server-side via Supabase Edge Functions.
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

const SEED_IN_APP_NOTIFICATIONS = [
  {
    id: "notif-pn-001",
    type: NOTIFICATION_TYPES.DELIVERY_DISPATCH,
    title: "⚡ 30-Minute Priority Dispatch Active",
    message:
      "Your order GM-ORD-20260908-0192 is out for priority delivery in Koregaon Park, Pune.",
    createdAt: "2026-09-08T10:33:00Z",
    isRead: false,
    link: "/account/orders/GM-ORD-20260908-0192",
    channel: NOTIFICATION_CHANNELS.IN_APP,
  },
  {
    id: "notif-pn-002",
    type: NOTIFICATION_TYPES.PAYMENT_UPDATE,
    title: "Payment Reconciliation Update",
    message:
      "Order GM-ORD-20260901-0844 payment of ₹3,028 reconciled via Cashfree UPI.",
    createdAt: "2026-09-01T14:32:00Z",
    isRead: true,
    link: "/account/orders/GM-ORD-20260901-0844",
    channel: NOTIFICATION_CHANNELS.IN_APP,
  },
  {
    id: "notif-pn-003",
    type: NOTIFICATION_TYPES.SECURITY_ACCOUNT,
    title: "Security Alert: New Sign-in",
    message: "Your GateMate account was logged in from Pune, Maharashtra.",
    createdAt: "2026-08-30T09:12:00Z",
    isRead: true,
    link: "/account",
    channel: NOTIFICATION_CHANNELS.IN_APP,
  },
  {
    id: "notif-pn-004",
    type: NOTIFICATION_TYPES.MARKETPLACE_ANNOUNCEMENT,
    title: "Pune & PCMC Service Zone Expansion",
    message:
      "Direct 30-minute priority dispatch has expanded to Pimple Saudagar and Wakad corridors.",
    createdAt: "2026-08-25T12:00:00Z",
    isRead: true,
    link: "/products",
    channel: NOTIFICATION_CHANNELS.IN_APP,
  },
];

const NOTIF_STORAGE_PREFIX = "gatemate_customer_notifications_";

export const notificationService = {
  /**
   * Retrieves all in-app notifications for the authenticated user
   */
  async getNotifications(userId) {
    if (!userId) {
      throw new Error(
        "AUTH_REQUIRED: You must be logged in to view notifications.",
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 140));

    // [TODO: SUPABASE PERSISTENCE]
    // const { data, error } = await supabase
    //   .from('notifications')
    //   .select('*')
    //   .eq('user_id', userId)
    //   .order('created_at', { ascending: false });
    // if (error) throw error;
    // return data;

    const storedKey = `${NOTIF_STORAGE_PREFIX}${userId}`;
    const stored = localStorage.getItem(storedKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Error parsing notifications", e);
      }
    }

    return SEED_IN_APP_NOTIFICATIONS;
  },

  /**
   * Marks a single notification as read
   */
  async markAsRead(userId, notificationId) {
    if (!userId) throw new Error("AUTH_REQUIRED");

    await new Promise((resolve) => setTimeout(resolve, 80));

    const notifications = await this.getNotifications(userId);
    const updated = notifications.map((n) =>
      n.id === notificationId ? { ...n, isRead: true } : n,
    );

    localStorage.setItem(
      `${NOTIF_STORAGE_PREFIX}${userId}`,
      JSON.stringify(updated),
    );
    return updated;
  },

  /**
   * Marks all notifications as read
   */
  async markAllAsRead(userId) {
    if (!userId) throw new Error("AUTH_REQUIRED");

    await new Promise((resolve) => setTimeout(resolve, 100));

    const notifications = await this.getNotifications(userId);
    const updated = notifications.map((n) => ({ ...n, isRead: true }));

    localStorage.setItem(
      `${NOTIF_STORAGE_PREFIX}${userId}`,
      JSON.stringify(updated),
    );
    return updated;
  },

  /**
   * Dispatches SMS Notifications (Twilio SMS / Verify Abstraction Contract)
   *
   * Server-Side Architecture Blueprint:
   * Endpoint: POST /functions/v1/send-sms-notification
   * Secrets: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
   */
  async dispatchSmsNotification({ toPhone, messageBody, templateType }) {
    // // TWILIO SETUP REQUIRED
    // This section requires server-side Edge Function deployment once Twilio credentials are created.
    // Client code MUST NEVER initiate direct Twilio API calls.

    return {
      status: "TWILIO_SETUP_REQUIRED",
      channel: NOTIFICATION_CHANNELS.SMS,
      delivered: false,
      message:
        "Twilio SMS service is pending server-side Edge Function credentials.",
    };
  },
};
