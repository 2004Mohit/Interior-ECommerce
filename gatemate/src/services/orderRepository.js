/**
 * Ferrado Order Lifecycle & Repository Architecture
 * Clean construction supply order records.
 */

export const ORDER_LIFECYCLE_STATUS = {
  PLACED: "PLACED",
  CONFIRMED: "CONFIRMED",
  PROCESSING: "PROCESSING",
  READY_FOR_DELIVERY: "READY_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
};

export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
};

export const ORDER_STATUS_TIMELINE_STEPS = [
  {
    key: ORDER_LIFECYCLE_STATUS.PLACED,
    label: "Order Placed",
    desc: "Received & logged at Ferrado Logistics Hub",
  },
  {
    key: ORDER_LIFECYCLE_STATUS.CONFIRMED,
    label: "Confirmed",
    desc: "Stockist / Depot accepted batch order",
  },
  {
    key: ORDER_LIFECYCLE_STATUS.PROCESSING,
    label: "Processing",
    desc: "Loaded on flatbed dispatch vehicle",
  },
  {
    key: ORDER_LIFECYCLE_STATUS.READY_FOR_DELIVERY,
    label: "Ready for Delivery",
    desc: "Departed from regional construction depot",
  },
  {
    key: ORDER_LIFECYCLE_STATUS.OUT_FOR_DELIVERY,
    label: "Out for Delivery",
    desc: "Driver en route with priority site dispatch",
  },
  {
    key: ORDER_LIFECYCLE_STATUS.DELIVERED,
    label: "Delivered",
    desc: "Site unloading & delivery challan handover complete",
  },
];

export const orderRepository = {
  async getCustomerOrders(userId) {
    if (!userId) {
      throw new Error(
        "AUTH_REQUIRED: You must be logged in to view your orders.",
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 150));
    const storedKey = `gatemate_customer_orders_${userId}`;
    const userLocalOrders = JSON.parse(localStorage.getItem(storedKey) || "[]");
    return [...userLocalOrders, ...SEED_CUSTOMER_ORDERS];
  },

  async getOrderById(userId, orderId) {
    if (!userId) {
      throw new Error(
        "AUTH_REQUIRED: You must be logged in to view order details.",
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 120));
    const all = await this.getCustomerOrders(userId);
    const match = all.find((o) => o.id === orderId);
    if (!match) {
      throw new Error(
        "ORDER_NOT_FOUND: The requested order does not exist or does not belong to your account.",
      );
    }
    return match;
  },

  async requestCancellation(userId, orderId, reason) {
    if (!userId) throw new Error("AUTH_REQUIRED");
    await new Promise((resolve) => setTimeout(resolve, 150));
    return {
      success: false,
      message:
        "Cancellation requires server-side review for dispatch status validation.",
    };
  },
};
