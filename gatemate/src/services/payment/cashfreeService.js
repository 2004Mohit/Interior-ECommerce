/**
 * GateMate Cashfree Integration Service
 *
 * IMPORTANT ARCHITECTURE SECURITY RULES:
 * 1. CASHFREE_SECRET_KEY MUST NEVER BE EXPOSED TO THE FRONTEND.
 * 2. Client-side SDK callbacks MUST NOT mark an order as PAID.
 * 3. Final payment state is strictly authoritative and verified via server-side webhook/Edge Function.
 */

const CASHFREE_MODE = import.meta.env.VITE_CASHFREE_MODE || "sandbox";
const CASHFREE_APP_ID = import.meta.env.VITE_CASHFREE_APP_ID || "";

export const cashfreeService = {
  /**
   * Evaluates if merchant keys and client config are active.
   */
  isConfigured() {
    return Boolean(CASHFREE_APP_ID && CASHFREE_APP_ID.trim().length > 0);
  },

  /**
   * Step 1: Request Payment Session from Backend Supabase Edge Function
   *
   * Expected Server-Side Contract:
   * Endpoint: POST /functions/v1/create-cashfree-order
   * Headers: Authorization: Bearer <supabase_anon_or_jwt>
   * Request Body: { orderId, orderAmount, customerId, customerPhone, customerEmail }
   * Response: { payment_session_id, order_id, cf_order_id }
   */
  async createPaymentOrder({
    orderId,
    amount,
    customerPhone,
    customerEmail,
    customerId,
  }) {
    if (!this.isConfigured()) {
      return {
        success: false,
        isConfigured: false,
        message:
          "Online payments are not configured yet. Cashfree merchant credentials required in backend Edge Functions.",
      };
    }

    // CASHFREE SETUP REQUIRED:
    // When Cashfree merchant account is active, invoke Supabase Edge Function:
    /*
    const { data, error } = await supabase.functions.invoke('create-cashfree-order', {
      body: {
        orderId,
        orderAmount: amount,
        customerId,
        customerPhone,
        customerEmail
      }
    });
    if (error) throw error;
    return { success: true, paymentSessionId: data.payment_session_id, orderId: data.order_id };
    */

    return {
      success: false,
      isConfigured: true,
      message:
        "CASHFREE SETUP REQUIRED: Connect Supabase Edge Function create-cashfree-order.",
    };
  },

  /**
   * Step 2: Initialize Cashfree JavaScript SDK and trigger modal/dropin
   */
  async startPayment({ paymentSessionId, returnUrl }) {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: "Online payments are not configured yet.",
      };
    }

    // CASHFREE SETUP REQUIRED:
    // Load official @cashfreepayments/cashfree-js SDK and invoke checkout:
    /*
    const cashfree = await loadCashfreeSDK({ mode: CASHFREE_MODE });
    return cashfree.checkout({
      paymentSessionId,
      redirectTarget: '_modal',
      returnUrl
    });
    */

    return {
      success: false,
      message:
        "CASHFREE SETUP REQUIRED: Cashfree SDK checkout is pending merchant initialization.",
    };
  },

  /**
   * Step 3: Verification request to Backend
   * The browser NEVER determines final payment success directly.
   */
  async verifyPayment({ orderId }) {
    // CASHFREE SETUP REQUIRED:
    // Inquire payment status via backend function:
    /*
    const { data, error } = await supabase.functions.invoke('verify-cashfree-payment', {
      body: { orderId }
    });
    return data; // { order_status: 'PAID' | 'FAILED' | 'USER_DROPPED' }
    */

    return {
      orderId,
      status: "AWAITING_SERVER_VERIFICATION",
      message: "Payment verification requires backend Edge Function inquiry.",
    };
  },

  /**
   * Step 4: Future Supabase Webhook Contract Documentation
   *
   * Backend Webhook Target: POST /functions/v1/cashfree-webhook
   * Signature Verification Header: x-webhook-signature
   * Authoritative Database Action:
   *   UPDATE orders
   *   SET payment_status = 'PAID', status = 'PROCESSING'
   *   WHERE id = payload.data.order.order_id;
   */
  getWebhookContractDocumentation() {
    return {
      endpoint: "/functions/v1/cashfree-webhook",
      status: "PENDING_DEPLOYMENT",
      requiredSecret: "CASHFREE_WEBHOOK_SECRET (Set in Supabase Vault)",
    };
  },
};
