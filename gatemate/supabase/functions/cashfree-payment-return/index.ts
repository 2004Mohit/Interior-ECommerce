import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CASHFREE_API_VERSION = "2025-01-01";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
};

const cleanText = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

const normalizeAmount = (value: unknown): number | null => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return Number(amount.toFixed(2));
};

const getCashfreeBaseUrl = (mode: string): string => {
  return mode === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
};

const redirectToFrontend = (
  frontendUrl: string,
  orderId: string,
  status: string,
  message?: string,
) => {
  const url = new URL(frontendUrl);

  url.searchParams.set("payment", status);
  url.searchParams.set("order_id", orderId);

  if (message) {
    url.searchParams.set("message", message);
  }

  return Response.redirect(url.toString(), 303);
};

const getCashfreeErrorMessage = (
  data: Record<string, unknown>,
  fallback: string,
): string => {
  const message =
    cleanText(data.message) ||
    cleanText(data.message_text) ||
    cleanText(data.error_message) ||
    cleanText(data.error);

  const code = cleanText(data.code) || cleanText(data.error_code);

  if (code && message) {
    return `${code}: ${message}`;
  }

  if (message) {
    return message;
  }

  if (code) {
    return code;
  }

  return fallback;
};

/*
 * ============================================================
 * CASHFREE REQUEST WITH RETRY
 * ============================================================
 *
 * Cashfree can occasionally return temporary 502/503/504
 * gateway errors. We retry only those transient statuses.
 *
 * We NEVER retry authentication/validation errors such as
 * 400, 401, 403 or 404.
 */
const cashfreeFetchWithRetry = async (
  url: string,
  options: RequestInit,
  label: string,
  maxAttempts = 3,
): Promise<Response> => {
  let lastResponse: Response | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`${label}: attempt ${attempt}/${maxAttempts}`);

      const response = await fetch(url, options);

      lastResponse = response;

      if (
        response.status !== 502 &&
        response.status !== 503 &&
        response.status !== 504
      ) {
        return response;
      }

      console.warn(`${label}: transient Cashfree status ${response.status}`);

      if (attempt < maxAttempts) {
        const delayMs = attempt * 1000;

        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`${label}: network error on attempt ${attempt}:`, error);

      if (attempt < maxAttempts) {
        const delayMs = attempt * 1000;

        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw new Error(`${label}: Cashfree request failed.`);
};

Deno.serve(async (req) => {
  /*
   * ============================================================
   * OPTIONS
   * ============================================================
   */

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  /*
   * Cashfree return URL uses GET.
   */

  if (req.method !== "GET") {
    return jsonResponse(
      {
        success: false,
        message:
          "Method not allowed. Cashfree payment return endpoint requires GET.",
      },
      405,
    );
  }

  try {
    /*
     * ============================================================
     * ENVIRONMENT
     * ============================================================
     */

    const supabaseUrl = cleanText(Deno.env.get("SUPABASE_URL"));

    const serviceRoleKey = cleanText(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));

    const cashfreeAppId = cleanText(Deno.env.get("CASHFREE_APP_ID"));

    const cashfreeSecretKey = cleanText(Deno.env.get("CASHFREE_SECRET_KEY"));

    const cashfreeMode = cleanText(Deno.env.get("CASHFREE_MODE")) || "sandbox";

    const frontendUrl =
      cleanText(Deno.env.get("FRONTEND_URL")) || "http://localhost:5173";

    if (
      !supabaseUrl ||
      !serviceRoleKey ||
      !cashfreeAppId ||
      !cashfreeSecretKey
    ) {
      console.error("Cashfree return function environment is incomplete.");

      return jsonResponse(
        {
          success: false,
          message: "Cashfree return function environment is incomplete.",
        },
        500,
      );
    }

    /*
     * ============================================================
     * ORDER ID
     * ============================================================
     */

    const requestUrl = new URL(req.url);

    const orderId = cleanText(requestUrl.searchParams.get("order_id"));

    if (!orderId) {
      return jsonResponse(
        {
          success: false,
          message: "order_id query parameter is required.",
        },
        400,
      );
    }

    console.log("Cashfree payment return received:", orderId);

    console.log("Cashfree mode:", cashfreeMode);

    /*
     * ============================================================
     * SUPABASE SERVICE ROLE CLIENT
     * ============================================================
     *
     * Server-side only.
     */

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    /*
     * ============================================================
     * LOAD GATEMATE ORDER
     * ============================================================
     */

    const { data: gateMateOrder, error: gateMateOrderError } = await supabase
      .from("vendor_orders")
      .select(
        `
        id,
        customer_id,
        grand_total,
        payment_status,
        payment_method,
        status
        `,
      )
      .eq("id", orderId)
      .maybeSingle();

    if (gateMateOrderError) {
      console.error("Unable to load GateMate order:", gateMateOrderError);

      return redirectToFrontend(
        frontendUrl,
        orderId,
        "error",
        "Unable to load GateMate order.",
      );
    }

    if (!gateMateOrder) {
      console.error("GateMate order not found:", orderId);

      return redirectToFrontend(
        frontendUrl,
        orderId,
        "error",
        "GateMate order was not found.",
      );
    }

    /*
     * ============================================================
     * IDEMPOTENCY
     * ============================================================
     */

    const currentPaymentStatus = cleanText(
      gateMateOrder.payment_status,
    ).toUpperCase();

    if (currentPaymentStatus === "PAID" || currentPaymentStatus === "SUCCESS") {
      console.log("GateMate order already marked paid:", orderId);

      return redirectToFrontend(frontendUrl, orderId, "success");
    }

    /*
     * ============================================================
     * VERIFY AMOUNT FROM GATEMATE DATABASE
     * ============================================================
     */

    const expectedAmount = normalizeAmount(gateMateOrder.grand_total);

    if (expectedAmount === null) {
      console.error("GateMate order has invalid grand_total:", {
        orderId,
        grandTotal: gateMateOrder.grand_total,
      });

      return redirectToFrontend(
        frontendUrl,
        orderId,
        "verification_error",
        "Unable to verify the GateMate order amount.",
      );
    }

    /*
     * ============================================================
     * CASHFREE BASE URL
     * ============================================================
     */

    const cashfreeBaseUrl = getCashfreeBaseUrl(cashfreeMode);

    /*
     * ============================================================
     * STEP 1:
     * GET CASHFREE PAYMENTS FOR THIS ORDER
     * ============================================================
     *
     * This is the important change.
     *
     * Cashfree's current integration documentation uses:
     *
     * GET /pg/orders/{order_id}/payments
     *
     * to determine the final transaction state.
     */

    const paymentsUrl =
      `${cashfreeBaseUrl}/orders/` + `${encodeURIComponent(orderId)}/payments`;

    console.log("Checking Cashfree payments:", paymentsUrl);

    const paymentsResponse = await cashfreeFetchWithRetry(
      paymentsUrl,
      {
        method: "GET",

        headers: {
          Accept: "application/json",

          "x-client-id": cashfreeAppId,

          "x-client-secret": cashfreeSecretKey,

          "x-api-version": CASHFREE_API_VERSION,

          "x-request-id": crypto.randomUUID(),
        },
      },
      "Cashfree payment status",
      3,
    );

    const paymentsText = await paymentsResponse.text();

    let paymentsData: unknown = [];

    try {
      paymentsData = paymentsText ? JSON.parse(paymentsText) : [];
    } catch {
      paymentsData = [];
    }

    console.log("Cashfree payments response:", {
      status: paymentsResponse.status,
      ok: paymentsResponse.ok,
      data: paymentsData,
    });

    /*
     * ============================================================
     * CASHFREE PAYMENT API ERROR
     * ============================================================
     */

    if (!paymentsResponse.ok) {
      const cashfreeError =
        paymentsData &&
        typeof paymentsData === "object" &&
        !Array.isArray(paymentsData)
          ? getCashfreeErrorMessage(
              paymentsData as Record<string, unknown>,
              "Cashfree payment status could not be verified.",
            )
          : "Cashfree payment status could not be verified.";

      console.error("Cashfree payment status request failed:", {
        orderId,
        httpStatus: paymentsResponse.status,
        error: cashfreeError,
      });

      return redirectToFrontend(
        frontendUrl,
        orderId,
        "verification_error",
        `Cashfree API ${paymentsResponse.status}: ${cashfreeError}`,
      );
    }

    /*
     * ============================================================
     * NORMALIZE PAYMENT LIST
     * ============================================================
     */

    const paymentList = Array.isArray(paymentsData) ? paymentsData : [];

    if (paymentList.length === 0) {
      console.warn("Cashfree returned no payment transactions yet:", orderId);

      return redirectToFrontend(
        frontendUrl,
        orderId,
        "pending",
        "Cashfree has not returned a payment transaction yet.",
      );
    }

    /*
     * ============================================================
     * FIND PAYMENT STATES
     * ============================================================
     */

    const normalizedPayments = paymentList.map((payment) => {
      const paymentObject =
        payment && typeof payment === "object"
          ? (payment as Record<string, unknown>)
          : {};

      return {
        paymentStatus: cleanText(paymentObject.payment_status).toUpperCase(),

        cfPaymentId: cleanText(paymentObject.cf_payment_id),

        paymentAmount: normalizeAmount(paymentObject.payment_amount),

        paymentCurrency: cleanText(
          paymentObject.payment_currency,
        ).toUpperCase(),

        paymentMessage: cleanText(paymentObject.payment_message),
      };
    });

    console.log("Normalized Cashfree payments:", normalizedPayments);

    /*
     * ============================================================
     * VERIFY PAYMENT AMOUNT
     * ============================================================
     *
     * If Cashfree provides payment_amount, verify it.
     */

    const successfulPayment = normalizedPayments.find(
      (payment) => payment.paymentStatus === "SUCCESS",
    );

    const paidPayment =
      successfulPayment ||
      normalizedPayments.find((payment) => payment.paymentStatus === "PAID");

    if (
      paidPayment?.paymentAmount !== null &&
      paidPayment?.paymentAmount !== undefined
    ) {
      if (paidPayment.paymentAmount !== expectedAmount) {
        console.error("Payment amount mismatch:", {
          orderId,
          expectedAmount,
          cashfreePaymentAmount: paidPayment.paymentAmount,
        });

        return redirectToFrontend(
          frontendUrl,
          orderId,
          "verification_error",
          "Payment amount verification failed.",
        );
      }
    }

    /*
     * ============================================================
     * SUCCESS
     * ============================================================
     *
     * Cashfree documentation identifies SUCCESS as the
     * successful transaction state.
     */

    if (successfulPayment) {
      const gatewayReference =
        successfulPayment.cfPaymentId || `CASHFREE-${orderId}`;

      console.log("Cashfree payment SUCCESS:", {
        orderId,
        gatewayReference,
        expectedAmount,
      });

      /*
       * ==========================================================
       * RECORD PAYMENT + COMMISSION
       * ==========================================================
       *
       * Existing GateMate RPC.
       */

      const { data: paymentRecord, error: paymentRecordError } =
        await supabase.rpc("record_order_payment_and_commission", {
          p_order_id: orderId,

          p_payment_gateway_ref: gatewayReference,

          p_payment_method: "CASHFREE_ONLINE",

          p_idempotency_key: `CASHFREE-${orderId}`,
        });

      if (paymentRecordError) {
        console.error(
          "record_order_payment_and_commission failed:",
          paymentRecordError,
        );

        return redirectToFrontend(
          frontendUrl,
          orderId,
          "verification_error",
          "Payment succeeded at Cashfree but GateMate could not finalize the order.",
        );
      }

      console.log("Payment finalization result:", paymentRecord);

      if (!paymentRecord || paymentRecord.success !== true) {
        console.error(
          "Payment record function returned unsuccessful response:",
          paymentRecord,
        );

        return redirectToFrontend(
          frontendUrl,
          orderId,
          "verification_error",
          "Payment succeeded but GateMate order finalization failed.",
        );
      }

      console.log("GateMate payment successfully finalized:", {
        orderId,
        gatewayReference,
        paymentRecord,
      });

      return redirectToFrontend(frontendUrl, orderId, "success");
    }

    /*
     * ============================================================
     * PENDING
     * ============================================================
     */

    const hasPendingPayment = normalizedPayments.some(
      (payment) => payment.paymentStatus === "PENDING",
    );

    if (hasPendingPayment) {
      console.log("Cashfree payment is pending:", orderId);

      return redirectToFrontend(
        frontendUrl,
        orderId,
        "pending",
        "Payment is still being processed.",
      );
    }

    /*
     * ============================================================
     * USER DROPPED / FAILED / OTHER
     * ============================================================
     */

    const latestPayment = normalizedPayments[0];

    const latestStatus = latestPayment?.paymentStatus || "UNKNOWN";

    console.log("Cashfree payment was not successful:", {
      orderId,
      latestStatus,
    });

    return redirectToFrontend(
      frontendUrl,
      orderId,
      "failed",
      `Payment status: ${latestStatus}`,
    );
  } catch (error) {
    /*
     * ============================================================
     * UNEXPECTED ERROR
     * ============================================================
     */

    console.error("cashfree-payment-return unexpected error:", error);

    const requestUrl = new URL(req.url);

    const orderId = cleanText(requestUrl.searchParams.get("order_id"));

    if (orderId) {
      const frontendUrl =
        cleanText(Deno.env.get("FRONTEND_URL")) || "http://localhost:5173";

      return redirectToFrontend(
        frontendUrl,
        orderId,
        "error",
        "Unexpected error while verifying payment.",
      );
    }

    return jsonResponse(
      {
        success: false,
        message: "Unexpected error while verifying payment.",
      },
      500,
    );
  }
});
