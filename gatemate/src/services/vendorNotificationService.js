/**
 * GateMate Vendor Notifications Service
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

const STORAGE_KEY = "gatemate_vendor_notifications_";

const SEED_VENDOR_NOTIFICATIONS = [
  {
    id: "v-notif-001",
    vendorId: "vnd-pune-001",
    category: VENDOR_NOTIFICATION_CATEGORIES.ORDERS,
    title: "New 30-Minute Priority Site Order Received",
    message:
      "Order GM-ORD-20260911-0418 for 10 bags of UltraTech PPC Cement is ready for staging to Koregaon Park.",
    link: "/vendor/orders/GM-ORD-20260911-0418",
    isRead: false,
    createdAt: "2026-09-11T13:10:00Z",
  },
  {
    id: "v-notif-002",
    vendorId: "vnd-pune-001",
    category: VENDOR_NOTIFICATION_CATEGORIES.RFQS_QUOTATIONS,
    title: "New Commercial Project RFQ: Balewadi Tower Phase 2",
    message:
      "Kapadia Structural Engineering requested a quotation for 40 tons of Tata Tiscon 550D TMT Rebar.",
    link: "/vendor/rfqs/RFQ-PN-2026-0091",
    isRead: false,
    createdAt: "2026-09-11T10:30:00Z",
  },
  {
    id: "v-notif-003",
    vendorId: "vnd-pune-001",
    category: VENDOR_NOTIFICATION_CATEGORIES.PRODUCT_MODERATION,
    title: "Product Revision Requested: M-Sand Concreting",
    message:
      "Admin reviewer requested sieve gradation report (IS 383 Zone II certificate) for Washed M-Sand.",
    link: "/vendor/products/vp-004",
    isRead: false,
    createdAt: "2026-09-09T16:00:00Z",
  },
  {
    id: "v-notif-004",
    vendorId: "vnd-pune-001",
    category: VENDOR_NOTIFICATION_CATEGORIES.SETTLEMENTS,
    title: "Bank Settlement Disbursed: ₹5,244.00 (UTR: HDFCR5202609100091)",
    message:
      "Direct NEFT payout processed for Order GM-ORD-20260910-0210. 5% GateMate commission deducted on Product subtotal.",
    link: "/vendor/settlements",
    isRead: true,
    createdAt: "2026-09-10T18:00:00Z",
  },
  {
    id: "v-notif-005",
    vendorId: "vnd-pune-001",
    category: VENDOR_NOTIFICATION_CATEGORIES.RFQS_QUOTATIONS,
    title: "Quotation Accepted by Kolte Infrastructure EPC",
    message:
      "Quotation QT-PN-2026-0062 for 1,200 bags of UltraTech Cement has been accepted and converted to Order GM-ORD-20260824-0011.",
    link: "/vendor/quotations",
    isRead: true,
    createdAt: "2026-09-03T11:00:00Z",
  },
  {
    id: "v-notif-006",
    vendorId: "vnd-pune-001",
    category: VENDOR_NOTIFICATION_CATEGORIES.VERIFICATION,
    title: "Depot Partner GST Verification Approved",
    message:
      "Your Maharashtra GSTIN (27AAAAA0000A1Z5) and Hadapsar depot yard verification have been approved for active seller status.",
    link: "/vendor/verification",
    isRead: true,
    createdAt: "2026-08-01T10:00:00Z",
  },
  {
    id: "v-notif-007",
    vendorId: "vnd-pune-001",
    category: VENDOR_NOTIFICATION_CATEGORIES.PLATFORM_NOTICES,
    title: "Pune & PCMC Monsoon Heavy Vehicle Transport Advisory",
    message:
      "Heavy 40-ton trailer entry timings in PCMC industrial corridors updated for safe transit during monsoon rain.",
    link: "/vendor/guidelines",
    isRead: true,
    createdAt: "2026-08-15T09:00:00Z",
  },
];

export const vendorNotificationService = {
  async getNotifications(vendorId = "vnd-pune-001") {
    await new Promise((resolve) => setTimeout(resolve, 80));

    try {
      const { data, error } = await supabase
        .from("vendor_notifications")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false });

      if (data && !error && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn("Supabase query fallback for vendor notifications", e);
    }

    const localRaw = localStorage.getItem(`${STORAGE_KEY}${vendorId}`);
    if (localRaw) {
      try {
        return JSON.parse(localRaw);
      } catch (err) {
        console.error("Error reading vendor notifications cache", err);
      }
    }

    localStorage.setItem(
      `${STORAGE_KEY}${vendorId}`,
      JSON.stringify(SEED_VENDOR_NOTIFICATIONS),
    );
    return SEED_VENDOR_NOTIFICATIONS;
  },

  async markAsRead(vendorId = "vnd-pune-001", notificationId) {
    const list = await this.getNotifications(vendorId);
    const updated = list.map((n) =>
      n.id === notificationId ? { ...n, isRead: true } : n,
    );
    localStorage.setItem(`${STORAGE_KEY}${vendorId}`, JSON.stringify(updated));

    try {
      await supabase
        .from("vendor_notifications")
        .update({ is_read: true })
        .eq("id", notificationId);
    } catch (e) {
      console.warn("Updated notification locally", e);
    }

    return updated;
  },

  async markAllAsRead(vendorId = "vnd-pune-001") {
    const list = await this.getNotifications(vendorId);
    const updated = list.map((n) => ({ ...n, isRead: true }));
    localStorage.setItem(`${STORAGE_KEY}${vendorId}`, JSON.stringify(updated));

    try {
      await supabase
        .from("vendor_notifications")
        .update({ is_read: true })
        .eq("vendor_id", vendorId);
    } catch (e) {
      console.warn("Updated all notifications locally", e);
    }

    return updated;
  },
};
