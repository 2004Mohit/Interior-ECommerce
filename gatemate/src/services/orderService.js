import { addressService } from "./addressService";

// Payment method identifiers
export const PAYMENT_METHODS = {
  UPI_COLLECT: "upi_collect",
  UPI_QR: "upi_qr",
  CARD: "card",
  NET_BANKING: "net_banking",
  PAY_ON_DELIVERY: "pay_on_delivery",
};

// Delivery method configurations
export const DELIVERY_OPTIONS = [
  {
    id: "express_30min",
    name: "⚡ 30-Minute Priority Express",
    description: "Direct courier dispatch within Pune, PCMC & Jodhpur zones",
    sla: "Within 30 Minutes",
    baseFee: 0, // Currently promotional free dispatch
    cutoffTime: "Available 08:00 AM – 10:00 PM",
    requiresEligibleZone: true,
  },
  {
    id: "standard_scheduled",
    name: "Standard Doorstep Delivery",
    description:
      "Safe scheduled ground courier delivery with tamper-proof packaging",
    sla: "Within 24–48 Hours",
    baseFee: 0,
    cutoffTime: "All day",
    requiresEligibleZone: false,
  },
];

export const orderService = {
  /**
   * Authoritative calculation layer (Simulates backend Edge Function response)
   * The frontend MUST NOT calculate final taxes/totals authoritatively.
   */
  async calculateCheckoutTotals({
    items = [],
    address,
    deliveryOptionId,
    paymentMethod,
  }) {
    await new Promise((resolve) => setTimeout(resolve, 120));

    const itemSubtotal = items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );

    // Evaluate delivery method eligibility
    const zoneAssessment = address
      ? addressService.evaluateDeliveryEligibility(address.pincode)
      : null;
    const selectedDelivery =
      DELIVERY_OPTIONS.find((d) => d.id === deliveryOptionId) ||
      DELIVERY_OPTIONS[1];

    let deliveryFee = selectedDelivery.baseFee;
    let expressServiceable = zoneAssessment?.isExpress30Min || false;

    // Platform and packaging fee
    const packagingFee = itemSubtotal > 0 ? 29 : 0;

    // Pay on Delivery convenience handling fee
    const codConvenienceFee =
      paymentMethod === PAYMENT_METHODS.PAY_ON_DELIVERY ? 49 : 0;

    // Authoritative Total
    const grandTotal =
      itemSubtotal + deliveryFee + packagingFee + codConvenienceFee;

    return {
      itemSubtotal,
      deliveryFee,
      packagingFee,
      codConvenienceFee,
      grandTotal,
      isZoneServiceable: zoneAssessment?.isServiceable ?? false,
      isExpressEligible: expressServiceable,
      zoneName:
        zoneAssessment?.area || zoneAssessment?.city || "Selected Region",
    };
  },

  /**
   * Order Placement & Payment Gateway Dispatcher
   */
  async placeOrder({
    items,
    address,
    deliveryOptionId,
    paymentMethod,
    totals,
    user,
  }) {
    const isPod = paymentMethod === PAYMENT_METHODS.PAY_ON_DELIVERY;

    // 1. Structural separation: Cashfree PG flow vs Pay on Delivery flow
    if (!isPod) {
      /* =========================================================================
       * [TODO: CASHFREE SETUP REQUIRED]
       * Step 1: Call backend Supabase Edge Function `create-cashfree-order`
       *         POST /functions/v1/create-cashfree-order
       *         Body: { orderAmount: totals.grandTotal, customerId: user.id, customerPhone: address.phone }
       * Step 2: Receive `payment_session_id` and `order_id` from Edge Function response
       * Step 3: Initialize Cashfree Web SDK:
       *         const cashfree = await load({ mode: 'sandbox' | 'production' });
       *         cashfree.checkout({ paymentSessionId: data.payment_session_id, redirectTarget: '_modal' });
       * Step 4: Await Cashfree webhook / return_url confirmation.
       * ========================================================================= */

      return {
        success: false,
        requiresCashfreeConfig: true,
        orderId: null,
        paymentStatus: "AWAITING_CASHFREE_CREDENTIALS",
        message:
          'Cashfree Gateway integration is pending merchant credentials setup. Please select "Pay on Delivery" to complete this test order.',
      };
    }

    // 2. Pay on Delivery Backend Order Creation Flow
    await new Promise((resolve) => setTimeout(resolve, 300));
    const generatedOrderId = `GM-POD-${Date.now().toString().slice(-6)}`;

    const orderRecord = {
      id: generatedOrderId,
      createdAt: new Date().toISOString().split("T")[0],
      items,
      address,
      deliveryOptionId,
      paymentMethod: "Pay on Delivery (Cash / UPI on Arrival)",
      paymentStatus: "PENDING_ON_DELIVERY",
      orderStatus: "CONFIRMED_DISPATCHING",
      totals,
    };

    // Save to local persistence store until Supabase order table migration
    const userOrdersKey = `gatemate_orders_${user?.id || "guest"}`;
    const existing = JSON.parse(localStorage.getItem(userOrdersKey) || "[]");
    localStorage.setItem(
      userOrdersKey,
      JSON.stringify([orderRecord, ...existing]),
    );

    return {
      success: true,
      requiresCashfreeConfig: false,
      orderId: generatedOrderId,
      paymentStatus: "PENDING_ON_DELIVERY",
      orderStatus: "CONFIRMED_DISPATCHING",
      record: orderRecord,
    };
  },
};
