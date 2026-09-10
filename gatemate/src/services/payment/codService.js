/**
 * GateMate Pay on Delivery (POD / COD) Service
 * Operates independently from digital payment gateways.
 */

export const codService = {
  /**
   * Generates a confirmed order record with payment due at delivery
   */
  async processPayOnDeliveryOrder({
    items,
    address,
    deliveryOptionId,
    totals,
    user,
  }) {
    // Simulate brief network serialization
    await new Promise((resolve) => setTimeout(resolve, 200));

    const orderId = `GM-POD-${Date.now().toString().slice(-6)}`;

    const orderRecord = {
      id: orderId,
      createdAt: new Date().toISOString().split("T")[0],
      items,
      address,
      deliveryOptionId,
      paymentMethod: "Pay on Delivery (Cash / Doorstep UPI)",
      paymentStatus: "PAYMENT_PENDING_ON_DELIVERY",
      orderStatus: "CONFIRMED_DISPATCHING",
      totals: {
        itemSubtotal: totals.itemSubtotal,
        deliveryFee: totals.deliveryFee,
        packagingFee: totals.packagingFee,
        codConvenienceFee: totals.codConvenienceFee,
        grandTotal: totals.grandTotal,
      },
    };

    // Store in local persistence store until Supabase database tables are wired
    const userOrdersKey = `gatemate_orders_${user?.id || "guest"}`;
    const existing = JSON.parse(localStorage.getItem(userOrdersKey) || "[]");
    localStorage.setItem(
      userOrdersKey,
      JSON.stringify([orderRecord, ...existing]),
    );

    return {
      success: true,
      orderId,
      paymentStatus: "PAYMENT_PENDING_ON_DELIVERY",
      orderStatus: "CONFIRMED_DISPATCHING",
      record: orderRecord,
      message:
        "Order confirmed successfully. Collect payment upon doorstep delivery.",
    };
  },
};
