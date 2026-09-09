import { cashfreeService } from "./cashfreeService";
import { codService } from "./codService";

export const PAYMENT_MODES = {
  PAY_ON_DELIVERY: "pay_on_delivery",
  UPI_COLLECT: "upi_collect",
  UPI_QR: "upi_qr",
  CARD: "card",
  NET_BANKING: "net_banking",
};

export const paymentService = {
  /**
   * Checks whether the selected payment mode is ready for execution
   */
  isPaymentModeReady(mode) {
    if (mode === PAYMENT_MODES.PAY_ON_DELIVERY) {
      return { ready: true };
    }
    const configured = cashfreeService.isConfigured();
    return {
      ready: configured,
      message: configured
        ? "Cashfree gateway is ready."
        : "Online payments are not configured yet.",
    };
  },

  /**
   * Unified dispatcher for processing all order checkout flows
   */
  async processOrderCheckout({
    mode,
    items,
    address,
    deliveryOptionId,
    totals,
    user,
  }) {
    // 1. Pay on Delivery path
    if (mode === PAYMENT_MODES.PAY_ON_DELIVERY) {
      return await codService.processPayOnDeliveryOrder({
        items,
        address,
        deliveryOptionId,
        totals,
        user,
      });
    }

    // 2. Digital Gateway path (Cashfree)
    const availability = this.isPaymentModeReady(mode);
    if (!availability.ready) {
      return {
        success: false,
        isConfigured: false,
        requiresCashfreeSetup: true,
        orderId: null,
        paymentStatus: "UNCONFIGURED_GATEWAY",
        message:
          'Online payments are not configured yet. Please select "Pay on Delivery" to proceed with this test order.',
      };
    }

    // CASHFREE SETUP REQUIRED:
    // Generate temporary order identifier for backend transaction
    const tempOrderId = `GM-CF-${Date.now().toString().slice(-6)}`;
    const sessionResponse = await cashfreeService.createPaymentOrder({
      orderId: tempOrderId,
      amount: totals.grandTotal,
      customerPhone: address?.phone,
      customerEmail: user?.email || "customer@gatemate.in",
      customerId: user?.id || "guest_customer",
    });

    if (!sessionResponse.success) {
      return {
        success: false,
        isConfigured: sessionResponse.isConfigured,
        requiresCashfreeSetup: true,
        orderId: null,
        paymentStatus: "GATEWAY_ERROR",
        message: sessionResponse.message,
      };
    }

    return {
      success: true,
      orderId: tempOrderId,
      paymentSessionId: sessionResponse.paymentSessionId,
      paymentStatus: "INITIATED",
    };
  },
};
