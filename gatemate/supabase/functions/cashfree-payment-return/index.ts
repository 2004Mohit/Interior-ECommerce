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
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    } catch (error) {
      console.error(`${label}: network error on attempt ${attempt}:`, error);

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
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
        vendor_id,
        grand_total,
        payment_status,
        payment_method,
        payment_gateway,
        payment_gateway_order_id,
        payment_gateway_reference,
        payment_completed_at,
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
     * AUTHORITATIVE AMOUNT
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
     * VERIFY CASHFREE ORDER STATUS
     * ============================================================
     */

    const cashfreeOrderUrl =
      `${cashfreeBaseUrl}/orders/` + `${encodeURIComponent(orderId)}`;

    console.log("Checking Cashfree order:", cashfreeOrderUrl);

    const cashfreeOrderResponse = await cashfreeFetchWithRetry(
      cashfreeOrderUrl,
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
      "Cashfree order verification",
      3,
    );

    const cashfreeOrderText = await cashfreeOrderResponse.text();

    let cashfreeOrderData: Record<string, unknown> = {};

    try {
      cashfreeOrderData = cashfreeOrderText
        ? JSON.parse(cashfreeOrderText)
        : {};
    } catch {
      cashfreeOrderData = {};
    }

    console.log("Cashfree order verification result:", {
      status: cashfreeOrderResponse.status,
      ok: cashfreeOrderResponse.ok,
    });

    if (!cashfreeOrderResponse.ok) {
      const cashfreeError = getCashfreeErrorMessage(
        cashfreeOrderData,
        "Cashfree order status could not be verified.",
      );

      console.error("Cashfree order verification failed:", {
        orderId,
        httpStatus: cashfreeOrderResponse.status,
        error: cashfreeError,
      });

      return redirectToFrontend(
        frontendUrl,
        orderId,
        "verification_error",
        `Cashfree API ${cashfreeOrderResponse.status}: ${cashfreeError}`,
      );
    }

    const cashfreeOrderStatus = cleanText(
      cashfreeOrderData.order_status,
    ).toUpperCase();

    const cashfreeOrderId = cleanText(cashfreeOrderData.order_id) || orderId;

    const cashfreeCfOrderId = cleanText(cashfreeOrderData.cf_order_id);

    console.log("Cashfree order status:", {
      orderId,
      status: cashfreeOrderStatus,
      cashfreeOrderId,
      cfOrderId: cashfreeCfOrderId,
    });

    /*
     * ============================================================
     * STEP 2:
     * GET CASHFREE PAYMENTS
     * ============================================================
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

      if (cashfreeOrderStatus === "PAID") {
        return redirectToFrontend(
          frontendUrl,
          orderId,
          "verification_error",
          "Cashfree order is PAID but no payment transaction was returned.",
        );
      }

      return redirectToFrontend(
        frontendUrl,
        orderId,
        "pending",
        "Cashfree has not returned a payment transaction yet.",
      );
    }

    /*
     * ============================================================
     * NORMALIZE PAYMENTS
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

        bankReference: cleanText(paymentObject.bank_reference),

        paymentGroup: cleanText(paymentObject.payment_group),

        paymentTime: cleanText(paymentObject.payment_time),

        paymentCompletionTime: cleanText(paymentObject.payment_completion_time),

        raw: paymentObject,
      };
    });

    console.log("Normalized Cashfree payments:", normalizedPayments);

    /*
     * ============================================================
     * FIND SUCCESSFUL PAYMENT
     * ============================================================
     */

    const successfulPayment = normalizedPayments.find(
      (payment) => payment.paymentStatus === "SUCCESS",
    );

    const paidPayment =
      successfulPayment ||
      normalizedPayments.find((payment) => payment.paymentStatus === "PAID");

    /*
     * ============================================================
     * VERIFY PAYMENT AMOUNT
     * ============================================================
     */

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
     */

    if (successfulPayment || cashfreeOrderStatus === "PAID") {
      const paymentForFinalization = successfulPayment || paidPayment;

      /*
       * ==========================================================
       * CASHFREE PAYMENT REFERENCES
       * ==========================================================
       */

      const gatewayReference =
        paymentForFinalization?.cfPaymentId ||
        cleanText(gateMateOrder.payment_gateway_reference) ||
        `CASHFREE-${orderId}`;

      const gatewayOrderId =
        cashfreeCfOrderId ||
        cashfreeOrderId ||
        cleanText(gateMateOrder.payment_gateway_order_id) ||
        orderId;

      const gatewayCompletionTime =
        paymentForFinalization?.paymentCompletionTime ||
        paymentForFinalization?.paymentTime ||
        null;

      console.log("Cashfree payment SUCCESS:", {
        orderId,
        gatewayOrderId,
        gatewayReference,
        expectedAmount,
        gatewayCompletionTime,
      });

      /*
       * ==========================================================
       * RECORD PAYMENT + COMMISSION
       * ==========================================================
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

      /*
       * ==========================================================
       * AUTHORITATIVE GATEWAY METADATA UPDATE
       * ==========================================================
       */

      const gatewayUpdatePayload: Record<string, unknown> = {
        payment_gateway: "CASHFREE",

        payment_gateway_order_id: gatewayOrderId,

        payment_gateway_reference: gatewayReference,

        payment_completed_at: gatewayCompletionTime
          ? new Date(gatewayCompletionTime).toISOString()
          : new Date().toISOString(),

        payment_status: "SUCCESS",

        payment_method: "CASHFREE_ONLINE",

        updated_at: new Date().toISOString(),
      };

      const { data: updatedOrder, error: gatewayUpdateError } = await supabase
        .from("vendor_orders")
        .update(gatewayUpdatePayload)
        .eq("id", orderId)
        .select(
          `
          id,
          payment_status,
          payment_method,
          payment_gateway,
          payment_gateway_order_id,
          payment_gateway_reference,
          payment_completed_at,
          updated_at
          `,
        )
        .maybeSingle();

      if (gatewayUpdateError) {
        console.error(
          "Failed to persist Cashfree gateway metadata:",
          gatewayUpdateError,
        );

        return redirectToFrontend(
          frontendUrl,
          orderId,
          "verification_error",
          "Payment succeeded but Cashfree transaction metadata could not be saved.",
        );
      }

      console.log("Cashfree gateway metadata persisted:", updatedOrder);

      /*
       * ==========================================================
       * SYNCHRONIZE PAYMENT TRANSACTION LEDGER
       * ==========================================================
       */

      const {
        data: paymentTransactions,
        error: paymentTransactionLookupError,
      } = await supabase
        .from("payment_transactions")
        .select(
          `
          id,
          order_id,
          payment_status,
          gateway_order_id,
          gateway_payment_id,
          payment_gateway,
          payment_method
          `,
        )
        .eq("order_id", orderId)
        .eq("payment_status", "SUCCESS")
        .order("created_at", {
          ascending: false,
        })
        .limit(1);

      if (paymentTransactionLookupError) {
        console.warn(
          "Unable to inspect payment transaction ledger:",
          paymentTransactionLookupError,
        );
      } else if (paymentTransactions && paymentTransactions.length > 0) {
        const paymentTransaction = paymentTransactions[0];

        const { error: paymentTransactionUpdateError } = await supabase
          .from("payment_transactions")
          .update({
            payment_gateway: "CASHFREE",

            gateway_order_id: gatewayOrderId,

            gateway_payment_id: gatewayReference,

            payment_status: "SUCCESS",

            updated_at: new Date().toISOString(),
          })
          .eq("id", paymentTransaction.id);

        if (paymentTransactionUpdateError) {
          console.warn(
            "Failed to synchronize payment transaction gateway metadata:",
            paymentTransactionUpdateError,
          );
        } else {
          console.log("Payment transaction gateway metadata synchronized:", {
            transactionId: paymentTransaction.id,
            gatewayOrderId,
            gatewayReference,
          });
        }
      } else {
        console.warn(
          "No SUCCESS payment transaction was found for order:",
          orderId,
        );
      }

      /*
       * ==========================================================
       * PHASE 5
       * CREATE / VERIFY CUSTOMER INVOICE
       * ==========================================================
       *
       * create_order_invoice() is already idempotent.
       *
       * If an invoice exists for this order:
       *   -> it returns the existing invoice.
       *
       * If no invoice exists:
       *   -> it creates the invoice.
       *   -> it copies vendor_order_items into invoice_items.
       *
       * Therefore repeated Cashfree returns/callbacks cannot
       * create multiple invoices for the same order.
       */

      const { data: invoiceRecord, error: invoiceError } = await supabase.rpc(
        "create_order_invoice",
        {
          p_order_id: orderId,
        },
      );

      if (invoiceError) {
        console.error("create_order_invoice failed:", invoiceError);

        return redirectToFrontend(
          frontendUrl,
          orderId,
          "verification_error",
          "Payment succeeded but the customer invoice could not be created.",
        );
      }

      console.log("Invoice creation/finalization result:", invoiceRecord);

      if (!invoiceRecord || invoiceRecord.success !== true) {
        console.error(
          "Invoice function returned unsuccessful response:",
          invoiceRecord,
        );

        return redirectToFrontend(
          frontendUrl,
          orderId,
          "verification_error",
          "Payment succeeded but invoice generation could not be completed.",
        );
      }

      /*
       * ==========================================================
       * FINAL SUCCESS LOG
       * ==========================================================
       */

      console.log("GateMate payment + invoice successfully finalized:", {
        orderId,

        gatewayOrderId,

        gatewayReference,

        paymentRecord,

        invoiceId: invoiceRecord.invoiceId || null,

        invoiceNumber: invoiceRecord.invoiceNumber || null,

        invoiceIdempotent: invoiceRecord.idempotent === true,
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

    if (hasPendingPayment || cashfreeOrderStatus === "ACTIVE") {
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

    const latestStatus =
      latestPayment?.paymentStatus || cashfreeOrderStatus || "UNKNOWN";

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
