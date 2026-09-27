import { cashfreeService } from "./cashfreeService";
import { supabase } from "../../lib/supabaseClient";

export const PAYMENT_MODES = {
  PAY_ON_DELIVERY: "pay_on_delivery",
  CASHFREE_ONLINE: "CASHFREE_ONLINE",

  // Legacy values kept for compatibility.
  UPI_COLLECT: "upi_collect",
  UPI_QR: "upi_qr",
  CARD: "card",
  NET_BANKING: "net_banking",
};

const normalizeCheckoutTotalsForOnlinePayment = (totals) => {
  return {
    itemSubtotal: Number(totals?.itemSubtotal || 0),
    deliveryFee: Number(totals?.deliveryFee || 0),
    packagingFee: Number(totals?.packagingFee || 0),
    taxAmount: Number(totals?.taxAmount || 0),

    // Online payment does NOT have COD convenience fee.
    codConvenienceFee: 0,

    grandTotal: Number(totals?.grandTotal || 0),
  };
};

export const paymentService = {
  isPaymentModeReady(mode) {
    if (mode === PAYMENT_MODES.PAY_ON_DELIVERY) {
      return {
        ready: true,
        message: "Pay on Delivery is available.",
      };
    }

    if (mode !== PAYMENT_MODES.CASHFREE_ONLINE) {
      return {
        ready: false,
        message: "Unsupported payment method.",
      };
    }

    const configured = cashfreeService.isConfigured();

    return {
      ready: configured,
      message: configured
        ? "Cashfree online payment is ready."
        : "Cashfree online payment is not configured.",
    };
  },

  async processOrderCheckout({
    items,
    address,
    deliveryOptionId,
    totals,
    user,
    mode,
  }) {
    /*
     * ============================================================
     * 1. BASIC VALIDATION
     * ============================================================
     */

    if (!user?.id) {
      return {
        success: false,
        orderId: null,
        paymentStatus: "AUTH_REQUIRED",
        message: "Please sign in before placing your order.",
      };
    }

    if (!address) {
      return {
        success: false,
        orderId: null,
        paymentStatus: "ADDRESS_REQUIRED",
        message: "Please select a delivery address.",
      };
    }

    if (!totals || Number(totals.grandTotal) <= 0) {
      return {
        success: false,
        orderId: null,
        paymentStatus: "INVALID_TOTAL",
        message: "Unable to calculate the order total.",
      };
    }

    /*
     * ============================================================
     * 2. PAY ON DELIVERY
     * ============================================================
     *
     * Keep the existing COD implementation untouched.
     */

    if (mode === PAYMENT_MODES.PAY_ON_DELIVERY) {
      const { data, error } = await supabase.rpc("place_customer_order", {
        p_checkout_reference: `FER-${Date.now()}-${crypto
          .randomUUID()
          .replace(/-/g, "")
          .slice(0, 8)}`,

        p_shipping_address: address,

        p_delivery_option_id: deliveryOptionId,

        p_payment_method: "PAY_ON_DELIVERY",

        p_totals: {
          itemSubtotal: Number(totals.itemSubtotal || 0),
          deliveryFee: Number(totals.deliveryFee || 0),
          packagingFee: Number(totals.packagingFee || 0),
          taxAmount: Number(totals.taxAmount || 0),
          codConvenienceFee: Number(totals.codConvenienceFee || 0),
          grandTotal: Number(totals.grandTotal || 0),
        },
      });

      if (error) {
        console.error("Pay on Delivery order RPC failed:", error);

        return {
          success: false,
          orderId: null,
          paymentStatus: "ORDER_CREATION_FAILED",
          message:
            error.message || "Unable to create the Pay on Delivery order.",
        };
      }

      return {
        success: true,
        orderId: data?.orderIds?.[0]?.orderId || null,
        orderIds: data?.orderIds || [],
        paymentStatus: "PENDING",
        paymentMethod: PAYMENT_MODES.PAY_ON_DELIVERY,
        orderStatus: "NEW",
        record: data,
      };
    }

    /*
     * ============================================================
     * 3. CASHFREE ONLINE
     * ============================================================
     */

    if (mode !== PAYMENT_MODES.CASHFREE_ONLINE) {
      return {
        success: false,
        orderId: null,
        paymentStatus: "UNSUPPORTED_PAYMENT_METHOD",
        message: "Unsupported payment method.",
      };
    }

    const availability = this.isPaymentModeReady(PAYMENT_MODES.CASHFREE_ONLINE);

    if (!availability.ready) {
      return {
        success: false,
        isConfigured: false,
        requiresCashfreeSetup: true,
        orderId: null,
        paymentStatus: "UNCONFIGURED_GATEWAY",
        message: availability.message,
      };
    }

    /*
     * ============================================================
     * 4. CREATE UNIQUE CHECKOUT REFERENCE
     * ============================================================
     */

    const checkoutReference = `FER-${Date.now()}-${crypto
      .randomUUID()
      .replace(/-/g, "")
      .slice(0, 8)}`;

    /*
     * ============================================================
     * 5. ONLINE TOTALS
     * ============================================================
     *
     * Cashfree payment must never include COD convenience fee.
     */

    const onlineTotals = normalizeCheckoutTotalsForOnlinePayment(totals);

    /*
     * ============================================================
     * 6. CREATE GATEMATE ORDER FIRST
     * ============================================================
     *
     * The existing database function currently accepts
     * PAY_ON_DELIVERY as its order-creation method.
     *
     * We create the pending order through the existing secure
     * database function, then immediately convert its payment
     * method to CASHFREE_ONLINE before creating the gateway order.
     *
     * This is an MVP bridge until the database RPC is generalized
     * to support both payment methods directly.
     */

    const { data: orderData, error: orderError } = await supabase.rpc(
      "place_customer_order",
      {
        p_checkout_reference: checkoutReference,

        p_shipping_address: address,

        p_delivery_option_id: deliveryOptionId,

        p_payment_method: "PAY_ON_DELIVERY",

        p_totals: onlineTotals,
      },
    );

    if (orderError) {
      console.error("Cashfree GateMate order creation failed:", orderError);

      return {
        success: false,
        orderId: null,
        paymentStatus: "ORDER_CREATION_FAILED",
        message: orderError.message || "Unable to create the GateMate order.",
      };
    }

    if (!orderData?.success) {
      return {
        success: false,
        orderId: null,
        paymentStatus: "ORDER_CREATION_FAILED",
        message: orderData?.message || "GateMate order could not be created.",
      };
    }

    /*
     * ============================================================
     * 7. GET REAL DATABASE ORDER ID
     * ============================================================
     */

    const createdOrders = Array.isArray(orderData?.orderIds)
      ? orderData.orderIds
      : [];

    if (createdOrders.length === 0) {
      return {
        success: false,
        orderId: null,
        paymentStatus: "ORDER_CREATION_FAILED",
        message: "GateMate order was created but no order ID was returned.",
      };
    }

    /*
     * Cashfree currently handles one checkout payment.
     *
     * GateMate MVP should therefore use one vendor/order for
     * this online-payment flow.
     */

    if (createdOrders.length > 1) {
      console.error(
        "Multiple vendor orders returned for Cashfree checkout:",
        createdOrders,
      );

      return {
        success: false,
        orderId: null,
        paymentStatus: "MULTI_VENDOR_NOT_SUPPORTED",
        message:
          "Online payment for multiple vendor orders is not enabled yet.",
      };
    }

    const orderId = createdOrders[0]?.orderId;

    if (!orderId) {
      return {
        success: false,
        orderId: null,
        paymentStatus: "ORDER_ID_MISSING",
        message: "GateMate did not return a valid order ID.",
      };
    }

    /*
     * ============================================================
     * 8. CHANGE PAYMENT METHOD FROM COD -> CASHFREE
     * ============================================================
     */

    const { data, error } = await supabase.rpc(
      "customer_set_order_payment_method",
      {
        p_order_id: orderId,
        p_payment_method: "CASHFREE_ONLINE",
      },
    );

    if (error) {
      console.error("Failed to update payment method:", error);
      throw new Error(error.message || "Unable to set payment method.");
    }

    if (!data?.success) {
      throw new Error(data?.message || "Unable to set payment method.");
    }

    /*
     * ============================================================
     * 9. CREATE CASHFREE PAYMENT ORDER
     * ============================================================
     *
     * IMPORTANT:
     *
     * We now send the REAL vendor_orders.id.
     *
     * This fixes:
     *
     * 404
     * Order not found or does not belong to authenticated customer.
     *
     */

    const sessionResponse = await cashfreeService.createPaymentOrder({
      orderId,
      amount: onlineTotals.grandTotal,
      customerPhone: address?.phone || address?.mobile || "",
      customerEmail: user.email || "",
      customerId: user.id,
    });

    if (!sessionResponse.success) {
      return {
        success: false,
        orderId,
        paymentStatus: "GATEWAY_ERROR",
        message:
          sessionResponse.message || "Unable to initialize Cashfree payment.",
      };
    }

    /*
     * ============================================================
     * 10. SUCCESS
     * ============================================================
     */

    return {
      success: true,

      orderId,

      orderIds: createdOrders,

      checkoutReference,

      paymentSessionId: sessionResponse.paymentSessionId,

      cfOrderId: sessionResponse.cfOrderId || null,

      paymentStatus: "INITIATED",

      paymentMethod: PAYMENT_MODES.CASHFREE_ONLINE,

      orderStatus: "NEW",

      record: orderData,
    };
  },
};
