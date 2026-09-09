/**
 * GateMate Order Lifecycle & Repository Architecture
 *
 * Separation of Concerns:
 * 1. Order Fulfillment Status (Logistics Lifecycle)
 * 2. Payment Transaction Status (Financial Lifecycle)
 * 3. Guest Protection (Customers can only query their own user-scoped records)
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
    desc: "Received & logged in GateMate Core",
  },
  {
    key: ORDER_LIFECYCLE_STATUS.CONFIRMED,
    label: "Confirmed",
    desc: "Artisan / Vendor accepted order",
  },
  {
    key: ORDER_LIFECYCLE_STATUS.PROCESSING,
    label: "Processing",
    desc: "Packaging in honeycomb boxes & quality check",
  },
  {
    key: ORDER_LIFECYCLE_STATUS.READY_FOR_DELIVERY,
    label: "Ready for Delivery",
    desc: "Handed to express logistics hub",
  },
  {
    key: ORDER_LIFECYCLE_STATUS.OUT_FOR_DELIVERY,
    label: "Out for Delivery",
    desc: "Rider en route with priority dispatch",
  },
  {
    key: ORDER_LIFECYCLE_STATUS.DELIVERED,
    label: "Delivered",
    desc: "Doorstep verification & handover complete",
  },
];

const SEED_CUSTOMER_ORDERS = [
  {
    id: "GM-ORD-20260908-0192",
    userId: "mock-user-1",
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
        id: "1",
        name: "Handcrafted Blue Pottery Royal Urn",
        price: 1899,
        quantity: 1,
        img: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=400&q=80",
        sku: "GM-POT-URN-001",
        brand: "Marwar Heritage Crafts",
      },
    ],
    shippingAddress: {
      fullName: "Aditya Rathore",
      phone: "9829012345",
      line1: "Flat 402, Royal Palms, Lane 7",
      locality: "Koregaon Park",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411006",
    },
    totals: {
      itemSubtotal: 1899,
      deliveryFee: 0,
      packagingFee: 29,
      codConvenienceFee: 49,
      grandTotal: 1977,
    },
    cancellationEligible: false, // In transit, cannot cancel directly
  },
  {
    id: "GM-ORD-20260901-0844",
    userId: "mock-user-1",
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
        id: "2",
        name: "Heavy Duty Sheesham Automatic Gate Latch",
        price: 2999,
        quantity: 1,
        img: "https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?auto=format&fit=crop&w=400&q=80",
        sku: "GM-HDW-LAT-002",
        brand: "GateMate Forge Works",
      },
    ],
    shippingAddress: {
      fullName: "Aditya Rathore",
      phone: "9829012345",
      line1: "Bungalow 18, Rose Valley Society",
      locality: "Pimple Saudagar",
      city: "Pimpri-Chinchwad",
      state: "Maharashtra",
      pincode: "411061",
    },
    totals: {
      itemSubtotal: 2999,
      deliveryFee: 0,
      packagingFee: 29,
      codConvenienceFee: 0,
      grandTotal: 3028,
    },
    cancellationEligible: false,
    refundStatus: null,
  },
];

export const orderRepository = {
  /**
   * Retrieves all orders scoped strictly to the authenticated user ID.
   * Guests will be rejected with an authentication requirement.
   */
  async getCustomerOrders(userId) {
    if (!userId) {
      throw new Error(
        "AUTH_REQUIRED: You must be logged in to view your orders.",
      );
    }

    // Micro delay simulating Supabase database query
    await new Promise((resolve) => setTimeout(resolve, 180));

    // [TODO: SUPABASE PERSISTENCE]
    // const { data, error } = await supabase
    //   .from('orders')
    //   .select('*, order_items(*)')
    //   .eq('customer_id', userId)
    //   .order('created_at', { ascending: false });
    // if (error) throw error;
    // return data;

    const storedKey = `gatemate_customer_orders_${userId}`;
    const userLocalOrders = JSON.parse(localStorage.getItem(storedKey) || "[]");
    return [...userLocalOrders, ...SEED_CUSTOMER_ORDERS];
  },

  /**
   * Retrieves full details for a single order, verifying user ownership.
   */
  async getOrderById(userId, orderId) {
    if (!userId) {
      throw new Error(
        "AUTH_REQUIRED: You must be logged in to view order details.",
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 150));

    // [TODO: SUPABASE PERSISTENCE]
    // const { data, error } = await supabase
    //   .from('orders')
    //   .select('*, order_items(*)')
    //   .eq('id', orderId)
    //   .eq('customer_id', userId)
    //   .single();
    // if (error) throw error;
    // return data;

    const all = await this.getCustomerOrders(userId);
    const match = all.find((o) => o.id === orderId);
    if (!match) {
      throw new Error(
        "ORDER_NOT_FOUND: The requested order does not exist or does not belong to your account.",
      );
    }
    return match;
  },

  /**
   * Request Order Cancellation (Structured placeholder for backend edge function)
   */
  async requestCancellation(userId, orderId, reason) {
    if (!userId) throw new Error("AUTH_REQUIRED");
    await new Promise((resolve) => setTimeout(resolve, 200));

    // [TODO: SUPABASE EDGE FUNCTION]
    // const { data, error } = await supabase.functions.invoke('cancel-order', {
    //   body: { orderId, reason }
    // });
    // return data;

    return {
      success: false,
      message:
        "Cancellation requires server-side review for dispatch status validation.",
    };
  },
};
