import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CASHFREE_API_VERSION = "2025-01-01";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

const cleanText = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const normalizeAmount = (value: unknown): number | null => {
  const amount = Number(value);
  return Number.isFinite(amount) ? Number(amount.toFixed(2)) : null;
};

const getCashfreeBaseUrl = (mode: string) =>
  mode === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

const redirectToFrontend = (
  frontendUrl: string,
  orderId: string,
  status: string,
  message?: string,
) => {
  const url = new URL(frontendUrl);
  url.searchParams.set("payment", status);
  url.searchParams.set("order_id", orderId);
  if (message) url.searchParams.set("message", message);
  return Response.redirect(url.toString(), 303);
};

const getCashfreeErrorMessage = (
  data: Record<string, unknown>,
  fallback: string,
) => {
  const message =
    cleanText(data.message) ||
    cleanText(data.message_text) ||
    cleanText(data.error_message) ||
    cleanText(data.error);
  const code = cleanText(data.code) || cleanText(data.error_code);

  if (code && message) return `${code}: ${message}`;
  return message || code || fallback;
};

const cashfreeFetchWithRetry = async (
  url: string,
  options: RequestInit,
  label: string,
  maxAttempts = 3,
): Promise<Response> => {
  let lastResponse: Response | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, options);
      lastResponse = response;

      if (![502, 503, 504].includes(response.status)) return response;

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    } catch (error) {
      console.error(`${label}: network error on attempt ${attempt}`, error);
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
  }

  if (lastResponse) return lastResponse;
  throw new Error(`${label}: Cashfree request failed.`);
};

const getAuthenticatedUserId = async (
  req: Request,
  supabaseUrl: string,
  supabaseAnonKey: string,
) => {
  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return null;

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const {
    data: { user },
  } = await client.auth.getUser();

  return user?.id || null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse(
      { success: false, message: "Method not allowed." },
      405,
    );
  }

  try {
    const supabaseUrl = cleanText(Deno.env.get("SUPABASE_URL"));
    const supabaseAnonKey = cleanText(Deno.env.get("SUPABASE_ANON_KEY"));
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
      return jsonResponse(
        {
          success: false,
          status: "VERIFICATION_ERROR",
          message: "Cashfree verification function environment is incomplete.",
        },
        500,
      );
    }

    const requestUrl = new URL(req.url);
    let orderId = cleanText(requestUrl.searchParams.get("order_id"));
    let authenticatedUserId: string | null = null;

    /*
     * POST is the authenticated browser verification path used by the
     * React checkout after the Cashfree modal closes.
     */
    if (req.method === "POST") {
      if (!supabaseAnonKey) {
        return jsonResponse(
          {
            success: false,
            status: "VERIFICATION_ERROR",
            message: "Supabase anonymous key is not configured.",
          },
          500,
        );
      }

      try {
        const body = await req.json();
        orderId = orderId || cleanText(body?.orderId);
      } catch {
        // Query parameter fallback remains supported.
      }

      if (!orderId) {
        return jsonResponse(
          {
            success: false,
            status: "INVALID_ORDER",
            message: "orderId is required.",
          },
          400,
        );
      }

      authenticatedUserId = await getAuthenticatedUserId(
        req,
        supabaseUrl,
        supabaseAnonKey,
      );

      if (!authenticatedUserId) {
        return jsonResponse(
          {
            success: false,
            status: "AUTH_REQUIRED",
            message: "Authenticated customer verification is required.",
          },
          401,
        );
      }
    }

    if (!orderId) {
      return jsonResponse(
        {
          success: false,
          status: "INVALID_ORDER",
          message: "order_id is required.",
        },
        400,
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: gateMateOrder, error: orderError } = await supabase
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

    if (orderError) {
      console.error("Unable to load GateMate order:", orderError);
      return req.method === "GET"
        ? redirectToFrontend(
            frontendUrl,
            orderId,
            "error",
            "Unable to load GateMate order.",
          )
        : jsonResponse(
            {
              success: false,
              status: "VERIFICATION_ERROR",
              message: "Unable to load GateMate order.",
            },
            500,
          );
    }

    if (!gateMateOrder) {
      return req.method === "GET"
        ? redirectToFrontend(
            frontendUrl,
            orderId,
            "error",
            "GateMate order was not found.",
          )
        : jsonResponse(
            {
              success: false,
              status: "ORDER_NOT_FOUND",
              message: "GateMate order was not found.",
            },
            404,
          );
    }

    /* Never allow the browser to verify/finalize another customer's order. */
    if (
      req.method === "POST" &&
      authenticatedUserId !== cleanText(gateMateOrder.customer_id)
    ) {
      return jsonResponse(
        {
          success: false,
          status: "FORBIDDEN",
          message: "This order does not belong to the authenticated customer.",
        },
        403,
      );
    }

    const currentPaymentStatus = cleanText(
      gateMateOrder.payment_status,
    ).toUpperCase();

    if (currentPaymentStatus === "PAID" || currentPaymentStatus === "SUCCESS") {
      const response = {
        success: true,
        status: "SUCCESS",
        orderId,
        paymentStatus: "SUCCESS",
        orderStatus: cleanText(gateMateOrder.status) || "NEW",
        message: "Payment is already confirmed.",
      };

      return req.method === "GET"
        ? redirectToFrontend(frontendUrl, orderId, "success")
        : jsonResponse(response);
    }

    const expectedAmount = normalizeAmount(gateMateOrder.grand_total);

    if (expectedAmount === null) {
      const message = "Unable to verify the GateMate order amount.";
      return req.method === "GET"
        ? redirectToFrontend(
            frontendUrl,
            orderId,
            "verification_error",
            message,
          )
        : jsonResponse(
            { success: false, status: "VERIFICATION_ERROR", message },
            400,
          );
    }

    const cashfreeBaseUrl = getCashfreeBaseUrl(cashfreeMode);
    const paymentsUrl = `${cashfreeBaseUrl}/orders/${encodeURIComponent(orderId)}/payments`;

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

      return req.method === "GET"
        ? redirectToFrontend(
            frontendUrl,
            orderId,
            "verification_error",
            `Cashfree API ${paymentsResponse.status}: ${cashfreeError}`,
          )
        : jsonResponse(
            {
              success: false,
              status: "VERIFICATION_ERROR",
              message: `Cashfree API ${paymentsResponse.status}: ${cashfreeError}`,
            },
            502,
          );
    }

    const paymentList = Array.isArray(paymentsData) ? paymentsData : [];

    if (paymentList.length === 0) {
      const message = "Cashfree has not returned a payment transaction yet.";
      return req.method === "GET"
        ? redirectToFrontend(frontendUrl, orderId, "pending", message)
        : jsonResponse({
            success: false,
            status: "PENDING",
            orderId,
            paymentStatus: "PENDING",
            message,
          });
    }

    const normalizedPayments = paymentList.map((payment) => {
      const item =
        payment && typeof payment === "object"
          ? (payment as Record<string, unknown>)
          : {};

      return {
        paymentStatus: cleanText(item.payment_status).toUpperCase(),
        cfPaymentId: cleanText(item.cf_payment_id),
        paymentAmount: normalizeAmount(item.payment_amount),
        paymentMessage: cleanText(item.payment_message),
      };
    });

    const successfulPayment = normalizedPayments.find(
      (payment) => payment.paymentStatus === "SUCCESS",
    );

    const paidPayment =
      successfulPayment ||
      normalizedPayments.find((payment) => payment.paymentStatus === "PAID");

    if (
      paidPayment?.paymentAmount !== null &&
      paidPayment?.paymentAmount !== undefined &&
      paidPayment.paymentAmount !== expectedAmount
    ) {
      const message = "Payment amount verification failed.";
      return req.method === "GET"
        ? redirectToFrontend(
            frontendUrl,
            orderId,
            "verification_error",
            message,
          )
        : jsonResponse(
            { success: false, status: "VERIFICATION_ERROR", message },
            400,
          );
    }

    if (successfulPayment) {
      const gatewayReference =
        successfulPayment.cfPaymentId || `CASHFREE-${orderId}`;

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

        const message =
          "Payment succeeded at Cashfree but GateMate could not finalize the order yet.";

        return req.method === "GET"
          ? redirectToFrontend(
              frontendUrl,
              orderId,
              "verification_error",
              message,
            )
          : jsonResponse(
              {
                success: false,
                status: "VERIFICATION_ERROR",
                message,
              },
              500,
            );
      }

      if (!paymentRecord || paymentRecord.success !== true) {
        const message =
          "Payment succeeded but GateMate order finalization failed.";

        return req.method === "GET"
          ? redirectToFrontend(
              frontendUrl,
              orderId,
              "verification_error",
              message,
            )
          : jsonResponse(
              {
                success: false,
                status: "VERIFICATION_ERROR",
                message,
              },
              500,
            );
      }

      const response = {
        success: true,
        status: "SUCCESS",
        orderId,
        paymentStatus: "SUCCESS",
        gatewayReference,
        orderStatus:
          cleanText(paymentRecord?.orderStatus) ||
          cleanText(gateMateOrder.status) ||
          "NEW",
        record: paymentRecord,
        message: "Payment verified and order finalized successfully.",
      };

      return req.method === "GET"
        ? redirectToFrontend(frontendUrl, orderId, "success")
        : jsonResponse(response);
    }

    const pendingPayment = normalizedPayments.find(
      (payment) => payment.paymentStatus === "PENDING",
    );

    if (pendingPayment) {
      const response = {
        success: false,
        status: "PENDING",
        orderId,
        paymentStatus: "PENDING",
        paymentMessage: pendingPayment.paymentMessage || null,
        message: "Payment is still being processed.",
      };

      return req.method === "GET"
        ? redirectToFrontend(frontendUrl, orderId, "pending", response.message)
        : jsonResponse(response);
    }

    const latestPayment = normalizedPayments[0];
    const latestStatus = latestPayment?.paymentStatus || "UNKNOWN";
    const message = `Payment status: ${latestStatus}`;

    return req.method === "GET"
      ? redirectToFrontend(frontendUrl, orderId, "failed", message)
      : jsonResponse({
          success: false,
          status: "FAILED",
          orderId,
          paymentStatus: latestStatus,
          paymentMessage: latestPayment?.paymentMessage || null,
          message,
        });
  } catch (error) {
    console.error("cashfree-payment-return unexpected error:", error);

    const requestUrl = new URL(req.url);
    const orderId = cleanText(requestUrl.searchParams.get("order_id"));
    const frontendUrl =
      cleanText(Deno.env.get("FRONTEND_URL")) || "http://localhost:5173";

    if (req.method === "GET" && orderId) {
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
        status: "VERIFICATION_ERROR",
        message: "Unexpected error while verifying payment.",
      },
      500,
    );
  }
});
