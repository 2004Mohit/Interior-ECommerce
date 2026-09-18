/**
 * GateMate Order Lifecycle & Repository Architecture
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
    desc: "Received & logged at GateMate Logistics Hub",
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

const SEED_CUSTOMER_ORDERS = [
  {
    id: "GM-ORD-20260908-0192",
    userId: null,
    createdAt: "2026-09-08T10:15:00Z",
    orderStatus: ORDER_LIFECYCLE_STATUS.OUT_FOR_DELIVERY,
    paymentStatus: PAYMENT_STATUS.PENDING,
    paymentMethod: "Pay on Delivery (Cash / Doorstep UPI)",
    isExpress30Min: true,
    estimatedDeliveryTime: "Within 30 Minutes",
    timeline: [
      {
        status: ORDER_LIFECYCLE_STATUS.PLACED,
        timestamp: "2026-09-08 10:15 AM",
        completed: true,
      },
      {
        status: ORDER_LIFECYCLE_STATUS.CONFIRMED,
        timestamp: "2026-09-08 10:18 AM",
        completed: true,
      },
      {
        status: ORDER_LIFECYCLE_STATUS.PROCESSING,
        timestamp: "2026-09-08 10:22 AM",
        completed: true,
      },
      {
        status: ORDER_LIFECYCLE_STATUS.READY_FOR_DELIVERY,
        timestamp: "2026-09-08 10:28 AM",
        completed: true,
      },
      {
        status: ORDER_LIFECYCLE_STATUS.OUT_FOR_DELIVERY,
        timestamp: "2026-09-08 10:33 AM",
        completed: true,
      },
      {
        status: ORDER_LIFECYCLE_STATUS.DELIVERED,
        timestamp: "Pending",
        completed: false,
      },
    ],
    items: [
      {
        id: "prod-cem-001",
        name: "UltraTech Super Weather-Shield PPC Cement (50 kg Bag)",
        price: 385,
        quantity: 10,
        img: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=600&q=80",
        sku: "ULT-PPC-50KG",
        brand: "UltraTech",
      },
    ],
    shippingAddress: {
      fullName: "Aditya Rathore",
      phone: "9829012345",
      line1: "Site 402, Royal Palms, Lane 7",
      locality: "Koregaon Park",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411006",
    },
    totals: {
      itemSubtotal: 3850,
      deliveryFee: 0,
      packagingFee: 49,
      codConvenienceFee: 49,
      grandTotal: 3948,
    },
    cancellationEligible: false,
  },
  {
    id: "GM-ORD-20260901-0844",
    userId: null,
    createdAt: "2026-09-01T14:30:00Z",
    orderStatus: ORDER_LIFECYCLE_STATUS.DELIVERED,
    paymentStatus: PAYMENT_STATUS.SUCCESS,
    paymentMethod: "Cashfree Online UPI (Verified)",
    isExpress30Min: true,
    estimatedDeliveryTime: "Delivered on Sep 01, 2026",
    timeline: [
      {
        status: ORDER_LIFECYCLE_STATUS.PLACED,
        timestamp: "2026-09-01 02:30 PM",
        completed: true,
      },
      {
        status: ORDER_LIFECYCLE_STATUS.CONFIRMED,
        timestamp: "2026-09-01 02:33 PM",
        completed: true,
      },
      {
        status: ORDER_LIFECYCLE_STATUS.PROCESSING,
        timestamp: "2026-09-01 02:40 PM",
        completed: true,
      },
      {
        status: ORDER_LIFECYCLE_STATUS.READY_FOR_DELIVERY,
        timestamp: "2026-09-01 02:45 PM",
        completed: true,
      },
      {
        status: ORDER_LIFECYCLE_STATUS.OUT_FOR_DELIVERY,
        timestamp: "2026-09-01 02:50 PM",
        completed: true,
      },
      {
        status: ORDER_LIFECYCLE_STATUS.DELIVERED,
        timestamp: "2026-09-01 03:02 PM",
        completed: true,
      },
    ],
    items: [
      {
        id: "prod-elec-001",
        name: "Polycab 1.5 sq mm FR Flame Retardant Copper House Wire (90m Red)",
        price: 1840,
        quantity: 2,
        img: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
        sku: "POL-FR-15-RED",
        brand: "Polycab",
      },
    ],
    shippingAddress: {
      fullName: "Aditya Rathore",
      phone: "9829012345",
      line1: "Commercial Wing 18, Rose Valley Infrastructure",
      locality: "Pimple Saudagar",
      city: "Pimpri-Chinchwad",
      state: "Maharashtra",
      pincode: "411061",
    },
    totals: {
      itemSubtotal: 3680,
      deliveryFee: 0,
      packagingFee: 29,
      codConvenienceFee: 0,
      grandTotal: 3709,
    },
    cancellationEligible: false,
    refundStatus: null,
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
