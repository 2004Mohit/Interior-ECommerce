import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CASHFREE_API_VERSION = "2025-01-01";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
   * OPTIONS / CORS
   * ============================================================
   */

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  /*
   * ============================================================
   * REQUEST MODE
   * ============================================================
   *
   * GET
   * ----
   * Used by Cashfree return_url.
   *
   * POST
   * ----
   * Used by Ferrado frontend after Cashfree popup closes.
   *
   * This function intentionally supports both.
   */

  const isFrontendVerification = req.method === "POST";

  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse(
      {
        success: false,
        message: "Method not allowed.",
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
     * AUTHENTICATE FRONTEND VERIFICATION REQUESTS
     * ============================================================
     *
     * Cashfree calls this function with GET and does not provide
     * a Supabase user JWT.
     *
     * Ferrado frontend calls this function with POST and MUST
     * provide the authenticated user's Supabase access token.
     *
     * This prevents an unauthenticated browser from asking the
     * function to finalize arbitrary customer orders.
     */

    let authenticatedUserId = "";

    if (isFrontendVerification) {
      const authorization = req.headers.get("Authorization") || "";

      const supabaseAnonKey = cleanText(Deno.env.get("SUPABASE_ANON_KEY"));

      if (!authorization.startsWith("Bearer ") || !supabaseAnonKey) {
        return jsonResponse(
          {
            success: false,
            status: "AUTH_REQUIRED",
            message: "Authentication required for payment verification.",
          },
          401,
        );
      }

      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      const {
        data: { user },
        error: authError,
      } = await authClient.auth.getUser();

      if (authError || !user) {
        console.error(
          "Frontend payment verification authentication failed:",
          authError,
        );

        return jsonResponse(
          {
            success: false,
            status: "AUTH_REQUIRED",
            message: "Authenticated customer could not be verified.",
          },
          401,
        );
      }

      authenticatedUserId = user.id;
    }

    /*
     * ============================================================
     * RESPONSE HELPER
     * ============================================================
     *
     * GET
     * ---
     * Cashfree request -> redirect customer back to Ferrado.
     *
     * POST
     * ----
     * Ferrado frontend -> structured JSON response.
     *
     * Payment/business verification failures intentionally return
     * HTTP 200 for POST. This allows:
     *
     * supabase.functions.invoke()
     *
     * to receive the structured result instead of converting it
     * into FunctionsHttpError.
     */

    const respondVerification = (
      orderIdForResponse: string,
      status: string,
      message?: string,
      extra: Record<string, unknown> = {},
    ) => {
      if (!isFrontendVerification) {
        return redirectToFrontend(
          frontendUrl,
          orderIdForResponse,
          status.toLowerCase(),
          message,
        );
      }

      return jsonResponse({
        success: status === "SUCCESS",
        status,
        orderId: orderIdForResponse,
        message: message || null,
        ...extra,
      });
    };

    /*
     * ============================================================
     * ORDER ID
     * ============================================================
     */

    const requestUrl = new URL(req.url);

    let orderId = cleanText(requestUrl.searchParams.get("order_id"));

    /*
     * Frontend POST:
     *
     * {
     *   orderId: "..."
     * }
     */

    if (isFrontendVerification) {
      try {
        const body = await req.json();

        orderId = cleanText(body?.orderId || body?.order_id);
      } catch {
        return jsonResponse(
          {
            success: false,
            status: "INVALID_REQUEST",
            message: "A valid orderId is required.",
          },
          400,
        );
      }
    }

    if (!orderId) {
      return jsonResponse(
        {
          success: false,
          status: "INVALID_REQUEST",
          message: "orderId is required.",
        },
        400,
      );
    }

    console.log("Cashfree payment verification received:", orderId);

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

      return respondVerification(
        orderId,
        "VERIFICATION_ERROR",
        "Unable to load GateMate order.",
      );
    }

    if (!gateMateOrder) {
      console.error("GateMate order not found:", orderId);

      return respondVerification(
        orderId,
        "VERIFICATION_ERROR",
        "GateMate order was not found.",
      );
    }

    /*
     * ============================================================
     * FRONTEND ORDER OWNERSHIP CHECK
     * ============================================================
     *
     * Only the customer who owns the order can trigger a browser
     * verification request.
     *
     * Cashfree GET requests are not subject to this check because
     * Cashfree does not have the customer's Supabase JWT.
     */

    if (
      isFrontendVerification &&
      gateMateOrder.customer_id !== authenticatedUserId
    ) {
      console.error("Frontend payment verification order ownership mismatch:", {
        orderId,
        authenticatedUserId,
        orderCustomerId: gateMateOrder.customer_id,
      });

      return jsonResponse(
        {
          success: false,
          status: "FORBIDDEN",
          message: "You are not allowed to verify this order.",
        },
        403,
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

      return respondVerification(
        orderId,
        "VERIFICATION_ERROR",
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
     * VERIFY CASHFREE ORDER
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

      return respondVerification(
        orderId,
        "VERIFICATION_ERROR",
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
     *
     * Cashfree documents this endpoint as:
     *
     * GET /pg/orders/{order_id}/payments
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

      return respondVerification(
        orderId,
        "VERIFICATION_ERROR",
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
        return respondVerification(
          orderId,
          "VERIFICATION_ERROR",
          "Cashfree order is PAID but no payment transaction was returned.",
        );
      }

      return respondVerification(
        orderId,
        "PENDING",
        "Cashfree has not returned a payment transaction yet.",
        {
          paymentStatus: "PENDING",
          orderStatus: gateMateOrder.status || "NEW",
        },
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

        return respondVerification(
          orderId,
          "VERIFICATION_ERROR",
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
       * RECORD PAYMENT TRANSACTION
       * ==========================================================
       *
       * Do NOT use the old
       * record_order_payment_and_commission RPC here.
       *
       * Cashfree has already confirmed the payment.
       * payment_transactions is the authoritative payment ledger.
       *
       * This is idempotent using:
       *   CASHFREE-${orderId}
       *
       * This also avoids the old commission RPC dependency.
       */

      const paymentIdempotencyKey = `CASHFREE-${orderId}`;

      const {
        data: existingPaymentTransaction,
        error: existingPaymentLookupError,
      } = await supabase
        .from("payment_transactions")
        .select(
          `
    id,
    order_id,
    customer_id,
    vendor_id,
    payment_gateway,
    gateway_order_id,
    gateway_payment_id,
    payment_method,
    payment_status,
    amount,
    currency,
    payment_message,
    bank_reference,
    payment_group,
    gateway_payment_time,
    gateway_completion_time,
    raw_gateway_response,
    idempotency_key
  `,
        )
        .eq("order_id", orderId)
        .eq("idempotency_key", paymentIdempotencyKey)
        .maybeSingle();

      if (existingPaymentLookupError) {
        console.error(
          "Failed to check existing payment transaction:",
          existingPaymentLookupError,
        );

        return respondVerification(
          orderId,
          "VERIFICATION_ERROR",
          "Payment succeeded but GateMate could not verify the existing payment transaction.",
        );
      }

      const paymentTransactionPayload = {
        order_id: orderId,

        customer_id: gateMateOrder.customer_id || null,

        vendor_id: gateMateOrder.vendor_id || null,

        payment_gateway: "CASHFREE",

        gateway_order_id: gatewayOrderId,

        gateway_payment_id: gatewayReference,

        payment_method: "CASHFREE_ONLINE",

        payment_status: "SUCCESS",

        amount: expectedAmount,

        currency: paymentForFinalization?.paymentCurrency || "INR",

        payment_message:
          paymentForFinalization?.paymentMessage || "Payment successful.",

        bank_reference: paymentForFinalization?.bankReference || null,

        payment_group: paymentForFinalization?.paymentGroup || null,

        gateway_payment_time: paymentForFinalization?.paymentTime
          ? new Date(paymentForFinalization.paymentTime).toISOString()
          : null,

        gateway_completion_time: gatewayCompletionTime
          ? new Date(gatewayCompletionTime).toISOString()
          : new Date().toISOString(),

        raw_gateway_response: {
          cashfree_order: cashfreeOrderData,

          cashfree_payment: paymentForFinalization?.raw || null,
        },

        idempotency_key: paymentIdempotencyKey,

        updated_at: new Date().toISOString(),
      };

      let paymentRecord: Record<string, unknown> | null = null;

      /*
       * ==========================================================
       * UPDATE EXISTING TRANSACTION
       * ==========================================================
       */

      if (existingPaymentTransaction?.id) {
        const { data: updatedPaymentTransaction, error: paymentUpdateError } =
          await supabase
            .from("payment_transactions")
            .update(paymentTransactionPayload)
            .eq("id", existingPaymentTransaction.id)
            .select(
              `
      id,
      order_id,
      customer_id,
      vendor_id,
      payment_gateway,
      gateway_order_id,
      gateway_payment_id,
      payment_method,
      payment_status,
      amount,
      currency,
      payment_message,
      bank_reference,
      payment_group,
      gateway_payment_time,
      gateway_completion_time,
      idempotency_key
    `,
            )
            .single();

        if (paymentUpdateError) {
          console.error(
            "Failed to update payment transaction:",
            paymentUpdateError,
          );

          return respondVerification(
            orderId,
            "VERIFICATION_ERROR",
            "Payment succeeded but GateMate could not update the payment transaction.",
          );
        }

        paymentRecord = updatedPaymentTransaction;

        console.log("Existing payment transaction updated:", paymentRecord);
      } else {
        /*
         * ==========================================================
         * CREATE NEW TRANSACTION
         * ==========================================================
         */

        const { data: insertedPaymentTransaction, error: paymentInsertError } =
          await supabase
            .from("payment_transactions")
            .insert(paymentTransactionPayload)
            .select(
              `
      id,
      order_id,
      customer_id,
      vendor_id,
      payment_gateway,
      gateway_order_id,
      gateway_payment_id,
      payment_method,
      payment_status,
      amount,
      currency,
      payment_message,
      bank_reference,
      payment_group,
      gateway_payment_time,
      gateway_completion_time,
      idempotency_key
    `,
            )
            .single();

        if (paymentInsertError) {
          console.error(
            "Failed to create payment transaction:",
            paymentInsertError,
          );

          /*
           * Another request may have finalized the same
           * Cashfree payment at the same time.
           *
           * Check once more before treating it as a failure.
           */

          const {
            data: concurrentPayment,
            error: concurrentPaymentLookupError,
          } = await supabase
            .from("payment_transactions")
            .select(
              `
        id,
        order_id,
        customer_id,
        vendor_id,
        payment_gateway,
        gateway_order_id,
        gateway_payment_id,
        payment_method,
        payment_status,
        amount,
        currency,
        payment_message,
        bank_reference,
        payment_group,
        gateway_payment_time,
        gateway_completion_time,
        idempotency_key
      `,
            )
            .eq("order_id", orderId)
            .eq("idempotency_key", paymentIdempotencyKey)
            .maybeSingle();

          if (concurrentPaymentLookupError || !concurrentPayment) {
            return respondVerification(
              orderId,
              "VERIFICATION_ERROR",
              "Payment succeeded but GateMate could not create the payment transaction.",
            );
          }

          paymentRecord = concurrentPayment;

          console.log(
            "Concurrent payment transaction found; using existing transaction:",
            paymentRecord,
          );
        } else {
          paymentRecord = insertedPaymentTransaction;

          console.log("New payment transaction created:", paymentRecord);
        }
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

        return respondVerification(
          orderId,
          "VERIFICATION_ERROR",
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
       * CREATE / VERIFY CUSTOMER INVOICE
       * ==========================================================
       *
       * Existing create_order_invoice() function is expected to
       * be idempotent.
       */

      const { data: invoiceRecord, error: invoiceError } = await supabase.rpc(
        "create_order_invoice",
        {
          p_order_id: orderId,
        },
      );

      if (invoiceError) {
        console.error("create_order_invoice failed:", invoiceError);

        return respondVerification(
          orderId,
          "VERIFICATION_ERROR",
          "Payment succeeded but the customer invoice could not be created.",
        );
      }

      console.log("Invoice creation/finalization result:", invoiceRecord);

      if (!invoiceRecord || invoiceRecord.success !== true) {
        console.error(
          "Invoice function returned unsuccessful response:",
          invoiceRecord,
        );

        return respondVerification(
          orderId,
          "VERIFICATION_ERROR",
          "Payment succeeded but invoice generation could not be completed.",
        );
      }

      /*
       * ==========================================================
       * FINAL SUCCESS
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

      return respondVerification(orderId, "SUCCESS", undefined, {
        paymentStatus: "SUCCESS",

        orderStatus: updatedOrder?.status || gateMateOrder.status || "NEW",

        gatewayReference,

        record: paymentRecord,
      });
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

      return respondVerification(
        orderId,
        "PENDING",
        "Payment is still being processed.",
        {
          paymentStatus: "PENDING",

          orderStatus: gateMateOrder.status || "NEW",
        },
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

    return respondVerification(
      orderId,
      "FAILED",
      `Payment status: ${latestStatus}`,
      {
        paymentStatus: latestStatus,

        orderStatus: gateMateOrder.status || "NEW",
      },
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

      /*
       * Frontend POST must receive JSON.
       */
      if (isFrontendVerification) {
        return jsonResponse({
          success: false,
          status: "VERIFICATION_ERROR",
          orderId,
          message: "Unexpected error while verifying payment.",
        });
      }

      /*
       * Cashfree GET must receive a redirect.
       */
      return redirectToFrontend(
        frontendUrl,
        orderId,
        "verification_error",
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
