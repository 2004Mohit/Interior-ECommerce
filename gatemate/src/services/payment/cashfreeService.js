import { load } from "@cashfreepayments/cashfree-js";
import { supabase } from "../../lib/supabaseClient";

/*
 * ============================================================
 * GATEMATE / FERRADO CASHFREE PAYMENT SERVICE
 * ============================================================
 *
 * SECURITY:
 * - Cashfree App ID is NOT required in VITE_ frontend variables.
 * - Cashfree Secret Key is NEVER exposed to the frontend.
 * - Cashfree merchant credentials remain inside Supabase Edge Functions.
 * - The frontend only receives a payment_session_id.
 * - The browser NEVER marks an order as PAID.
 * - Final payment verification is handled server-side.
 */

const CASHFREE_MODE =
  import.meta.env.VITE_CASHFREE_MODE === "production"
    ? "production"
    : "sandbox";

const SUPABASE_FUNCTION_NAME = "create-cashfree-order";

let cashfreeInstance = null;

/*
 * ============================================================
 * CONFIGURATION
 * ============================================================
 *
 * Your frontend .env contains:
 *
 * VITE_SUPABASE_URL
 * VITE_SUPABASE_ANON_KEY
 * VITE_SITE_URL
 *
 * That is enough.
 *
 * Cashfree credentials are intentionally NOT checked here.
 */
const isConfigured = () => {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
  );
};

/*
 * ============================================================
 * LOAD CASHFREE JS SDK
 * ============================================================
 *
 * Load the SDK only once.
 */
const getCashfreeInstance = async () => {
  if (cashfreeInstance) {
    return cashfreeInstance;
  }

  try {
    console.log("Loading Cashfree JS SDK in mode:", CASHFREE_MODE);

    cashfreeInstance = await load({
      mode: CASHFREE_MODE,
    });

    if (!cashfreeInstance) {
      throw new Error("Cashfree JS SDK returned an empty instance.");
    }

    console.log("Cashfree JS SDK loaded successfully.");

    return cashfreeInstance;
  } catch (error) {
    console.error("Failed to load Cashfree JS SDK:", error);

    cashfreeInstance = null;

    throw new Error(
      "Unable to load Cashfree payment gateway. Please refresh the page and try again.",
    );
  }
};

/*
 * ============================================================
 * NORMALIZE ERROR
 * ============================================================
 */
const getErrorMessage = (error) => {
  if (!error) {
    return "Unknown payment error.";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error?.message) {
    return String(error.message);
  }

  if (error?.error?.message) {
    return String(error.error.message);
  }

  if (error?.data?.message) {
    return String(error.data.message);
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unexpected payment error.";
  }
};

/*
 * ============================================================
 * EXPORT SERVICE
 * ============================================================
 */
export const cashfreeService = {
  /*
   * ==========================================================
   * CHECK CONFIGURATION
   * ==========================================================
   */
  isConfigured() {
    return isConfigured();
  },

  /*
   * ==========================================================
   * CREATE CASHFREE ORDER
   * ==========================================================
   *
   * Browser
   *    ↓
   * Supabase Edge Function
   *    ↓
   * Cashfree API
   *
   * The Cashfree secret remains on Supabase.
   */
  async createPaymentOrder({
    orderId,
    amount,
    customerPhone,
    customerEmail,
    customerId,
  }) {
    if (!isConfigured()) {
      return {
        success: false,
        isConfigured: false,
        requiresCashfreeSetup: true,
        message: "Supabase frontend configuration is missing.",
      };
    }

    if (!orderId) {
      return {
        success: false,
        message: "GateMate order ID is missing.",
      };
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return {
        success: false,
        message: "Invalid payment amount.",
      };
    }

    if (!customerPhone) {
      return {
        success: false,
        message: "Customer phone number is required.",
      };
    }

    if (!customerEmail) {
      return {
        success: false,
        message: "Customer email is required.",
      };
    }

    if (!customerId) {
      return {
        success: false,
        message: "Customer ID is required.",
      };
    }

    try {
      console.log("Creating Cashfree payment order:", {
        orderId,
        amount: numericAmount,
        customerId,
      });

      /*
       * create-cashfree-order has:
       *
       * verify_jwt = true
       *
       * Supabase functions.invoke() automatically
       * sends the current authenticated session.
       */
      const { data, error } = await supabase.functions.invoke(
        SUPABASE_FUNCTION_NAME,
        {
          body: {
            orderId,
            orderAmount: Number(numericAmount.toFixed(2)),
            customerId,
            customerPhone: String(customerPhone).trim(),
            customerEmail: String(customerEmail).trim(),
          },
        },
      );

      /*
       * Supabase Edge Function returned an HTTP error.
       */
      if (error) {
        console.error("create-cashfree-order Edge Function error:", error);

        let detailedMessage =
          error?.message || "Unable to create Cashfree payment.";

        /*
         * FunctionsHttpError may contain the
         * actual JSON response.
         */
        try {
          if (error?.context && typeof error.context.json === "function") {
            const errorBody = await error.context.json();

            if (errorBody?.message) {
              detailedMessage = errorBody.message;
            }

            if (errorBody?.error && typeof errorBody.error === "string") {
              detailedMessage = errorBody.error;
            }
          }
        } catch (parseError) {
          console.warn(
            "Could not parse Cashfree Edge Function error response:",
            parseError,
          );
        }

        return {
          success: false,
          isConfigured: true,
          requiresCashfreeSetup: false,
          message: detailedMessage,
        };
      }

      console.log("create-cashfree-order response:", data);

      /*
       * Backend itself reported failure.
       */
      if (!data?.success) {
        return {
          success: false,
          isConfigured: true,
          requiresCashfreeSetup: false,
          orderId: data?.order_id || orderId,
          message:
            data?.message || "Cashfree payment order could not be created.",
        };
      }

      const paymentSessionId = data?.payment_session_id;

      /*
       * Cashfree payment session is mandatory.
       */
      if (!paymentSessionId) {
        console.error("Cashfree response missing payment_session_id:", data);

        return {
          success: false,
          isConfigured: true,
          message: "Cashfree did not return a payment session.",
        };
      }

      return {
        success: true,
        isConfigured: true,
        requiresCashfreeSetup: false,

        orderId: data?.order_id || orderId,

        cfOrderId: data?.cf_order_id || null,

        paymentSessionId,

        amount: data?.amount ?? numericAmount,

        paymentStatus: "INITIATED",
      };
    } catch (error) {
      console.error("Unexpected Cashfree order creation error:", error);

      return {
        success: false,
        isConfigured: true,
        message:
          getErrorMessage(error) ||
          "Unexpected error while creating Cashfree payment.",
      };
    }
  },

  /*
   * ==========================================================
   * START CASHFREE CHECKOUT
   * ==========================================================
   *
   * This opens Cashfree's official checkout using
   * the payment_session_id generated by the backend.
   *
   * IMPORTANT:
   * This function does NOT mark the order as paid.
   */
  async startPayment({ paymentSessionId, returnUrl }) {
    if (!isConfigured()) {
      return {
        success: false,
        message: "Supabase frontend configuration is missing.",
      };
    }

    if (!paymentSessionId) {
      return {
        success: false,
        message: "Cashfree payment session is missing.",
      };
    }

    try {
      console.log("Opening Cashfree checkout...");

      console.log("Cashfree payment session ID:", paymentSessionId);

      const cashfree = await getCashfreeInstance();

      /*
       * Cashfree checkout configuration.
       *
       * We intentionally use the payment session
       * returned by our backend.
       */
      const checkoutOptions = {
        paymentSessionId: paymentSessionId,
      };

      /*
       * Normally the return URL is already configured
       * while creating the Cashfree order.
       *
       * Only override it when the caller explicitly
       * supplies one.
       */
      if (returnUrl) {
        checkoutOptions.returnUrl = returnUrl;
      }

      console.log("Cashfree checkout options:", {
        paymentSessionId: paymentSessionId
          ? `${String(paymentSessionId).slice(0, 12)}...`
          : null,
        hasReturnUrl: Boolean(returnUrl),
      });

      /*
       * Open Cashfree checkout.
       */
      const result = await cashfree.checkout(checkoutOptions);

      console.log("Cashfree checkout result:", result);

      /*
       * Cashfree returned an explicit error.
       */
      if (result?.error) {
        console.error("Cashfree checkout error:", result.error);

        return {
          success: false,
          error: result.error,
          message:
            getErrorMessage(result.error) ||
            "Cashfree checkout could not be opened.",
        };
      }

      /*
       * Redirect flow.
       *
       * Cashfree may navigate the browser away
       * from the current page.
       */
      if (result?.redirect) {
        return {
          success: true,
          paymentStatus: "REDIRECTING",
          result,
        };
      }

      /*
       * Payment details returned by Cashfree.
       *
       * IMPORTANT:
       * This does NOT mean the GateMate order
       * should be marked PAID by the browser.
       */
      if (result?.paymentDetails) {
        return {
          success: true,
          paymentStatus: "PROCESSING",
          paymentDetails: result.paymentDetails,
          result,
        };
      }

      /*
       * Some Cashfree checkout flows return an
       * empty object after successfully opening
       * the checkout UI.
       */
      return {
        success: true,
        paymentStatus: "INITIATED",
        result,
      };
    } catch (error) {
      console.error("Cashfree checkout failed:", error);

      return {
        success: false,
        message:
          getErrorMessage(error) ||
          "Unable to open Cashfree checkout. Please try again.",
      };
    }
  },

  /*
   * ==========================================================
   * SERVER-SIDE VERIFICATION STATUS
   * ==========================================================
   *
   * The browser does NOT verify payment directly.
   *
   * Your deployed:
   *
   * cashfree-payment-return
   *
   * function is responsible for server-side verification.
   */
  async verifyPayment({ orderId }) {
    if (!orderId) {
      return {
        success: false,
        status: "INVALID_ORDER",
        message: "Order ID is required for payment verification.",
      };
    }

    console.log(
      "Payment verification is handled by:",
      "cashfree-payment-return",
      {
        orderId,
      },
    );

    return {
      success: true,
      orderId,
      status: "AWAITING_SERVER_VERIFICATION",
      message:
        "Payment verification is handled by the Cashfree return function.",
    };
  },

  /*
   * ==========================================================
   * WEBHOOK DOCUMENTATION
   * ==========================================================
   */
  getWebhookContractDocumentation() {
    return {
      endpoint: "/functions/v1/cashfree-webhook",

      status: "NOT_REQUIRED_FOR_CURRENT_RETURN_FLOW",

      note: "Final payment state is verified server-side by cashfree-payment-return.",
    };
  },
};
