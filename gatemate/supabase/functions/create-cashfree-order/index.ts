import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CASHFREE_API_VERSION = "2025-01-01";

const CASHFREE_BASE_URL =
  Deno.env.get("CASHFREE_MODE") === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
};

const cleanText = (value: unknown) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

const normalizeAmount = (value: unknown) => {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Number(amount.toFixed(2));
};

const isValidPhone = (value: string) => {
  const digits = value.replace(/\D/g, "");

  return digits.length >= 10 && digits.length <= 15;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
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
     * CASHFREE CREDENTIALS
     * ============================================================
     */

    const cashfreeAppId = cleanText(Deno.env.get("CASHFREE_APP_ID"));

    const cashfreeSecretKey = cleanText(Deno.env.get("CASHFREE_SECRET_KEY"));

    const cashfreeMode = cleanText(Deno.env.get("CASHFREE_MODE")) || "sandbox";

    if (!cashfreeAppId || !cashfreeSecretKey) {
      return jsonResponse(
        {
          success: false,
          isConfigured: false,
          message: "Cashfree backend credentials are not configured yet.",
        },
        503,
      );
    }

    /*
     * ============================================================
     * AUTHENTICATION
     * ============================================================
     */

    const authorization = req.headers.get("Authorization") || "";

    if (!authorization.startsWith("Bearer ")) {
      return jsonResponse(
        {
          success: false,
          message: "Authentication required.",
        },
        401,
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";

    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse(
        {
          success: false,
          message: "Supabase function environment is incomplete.",
        },
        500,
      );
    }

    /*
     * ============================================================
     * USER-SCOPED SUPABASE CLIENT
     * ============================================================
     */

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    });

    /*
     * ============================================================
     * VERIFY USER
     * ============================================================
     */

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonResponse(
        {
          success: false,
          message: "Authenticated customer could not be verified.",
        },
        401,
      );
    }

    /*
     * ============================================================
     * REQUEST BODY
     * ============================================================
     */

    const body = await req.json();

    const orderId = cleanText(body.orderId);

    if (!orderId) {
      return jsonResponse(
        {
          success: false,
          message: "orderId is required.",
        },
        400,
      );
    }

    /*
     * ============================================================
     * LOAD GATEMATE ORDER
     * ============================================================
     *
     * IMPORTANT:
     * The amount is ALWAYS taken from the database.
     */

    const { data: order, error: orderError } = await supabase
      .from("vendor_orders")
      .select(
        `
          id,
          customer_id,
          customer_name,
          customer_phone,
          grand_total,
          payment_status,
          payment_method,
          status
        `,
      )
      .eq("id", orderId)
      .eq("customer_id", user.id)
      .maybeSingle();

    if (orderError) {
      console.error("Unable to load GateMate order:", orderError);

      return jsonResponse(
        {
          success: false,
          message: "Unable to verify GateMate order.",
        },
        500,
      );
    }

    if (!order) {
      return jsonResponse(
        {
          success: false,
          message:
            "Order not found or does not belong to the authenticated customer.",
        },
        404,
      );
    }

    /*
     * ============================================================
     * PAYMENT STATUS VALIDATION
     * ============================================================
     */

    const existingPaymentStatus = cleanText(order.payment_status).toUpperCase();

    if (existingPaymentStatus === "SUCCESS") {
      return jsonResponse(
        {
          success: false,
          message: "This order has already been paid.",
        },
        409,
      );
    }

    /*
     * ============================================================
     * AUTHORITATIVE AMOUNT
     * ============================================================
     */

    const orderAmount = normalizeAmount(order.grand_total);

    if (!orderAmount) {
      return jsonResponse(
        {
          success: false,
          message: "GateMate order does not contain a valid payment amount.",
        },
        400,
      );
    }

    /*
     * ============================================================
     * CUSTOMER DETAILS
     * ============================================================
     */

    const customerPhone = cleanText(order.customer_phone);

    const customerEmail = cleanText(user.email);

    if (!customerPhone || !isValidPhone(customerPhone)) {
      return jsonResponse(
        {
          success: false,
          message: "A valid customer phone number is required for payment.",
        },
        400,
      );
    }

    if (!customerEmail) {
      return jsonResponse(
        {
          success: false,
          message: "Customer email is required for payment.",
        },
        400,
      );
    }

    /*
     * ============================================================
     * CASHFREE RETURN URL
     * ============================================================
     *
     * This function MUST exist:
     *
     * /functions/v1/cashfree-payment-return
     */

    const returnUrl =
      `${supabaseUrl.replace(/\/$/, "")}` +
      `/functions/v1/cashfree-payment-return` +
      `?order_id=${encodeURIComponent(orderId)}`;

    /*
     * ============================================================
     * CASHFREE ORDER PAYLOAD
     * ============================================================
     */

    const cashfreePayload = {
      order_id: orderId,
      order_amount: orderAmount,
      order_currency: "INR",

      customer_details: {
        customer_id: user.id,
        customer_phone: customerPhone,
        customer_email: customerEmail,
      },

      order_meta: {
        return_url: returnUrl,
      },

      order_note: `GateMate order ${orderId}`,
    };

    /*
     * ============================================================
     * CREATE CASHFREE ORDER
     * ============================================================
     */

    const cashfreeResponse = await fetch(`${CASHFREE_BASE_URL}/orders`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "x-client-id": cashfreeAppId,
        "x-client-secret": cashfreeSecretKey,
        "x-api-version": CASHFREE_API_VERSION,
        "x-request-id": crypto.randomUUID(),
      },

      body: JSON.stringify(cashfreePayload),
    });

    const responseText = await cashfreeResponse.text();

    let cashfreeData: Record<string, unknown> = {};

    try {
      cashfreeData = responseText ? JSON.parse(responseText) : {};
    } catch {
      cashfreeData = {
        raw: responseText,
      };
    }

    /*
     * ============================================================
     * CASHFREE ERROR
     * ============================================================
     */

    if (!cashfreeResponse.ok) {
      console.error(
        "Cashfree order creation failed:",
        cashfreeResponse.status,
        cashfreeData,
      );

      return jsonResponse(
        {
          success: false,
          message: "Cashfree payment order could not be created.",
          gatewayStatus: cashfreeResponse.status,
          gatewayResponse: cashfreeData,
        },
        502,
      );
    }

    /*
     * ============================================================
     * CASHFREE SUCCESS
     * ============================================================
     */

    const paymentSessionId = cleanText(cashfreeData.payment_session_id);

    const cashfreeOrderId = cleanText(cashfreeData.order_id);

    const cfOrderId = cleanText(cashfreeData.cf_order_id);

    if (!paymentSessionId) {
      console.error(
        "Cashfree response did not contain payment_session_id:",
        cashfreeData,
      );

      return jsonResponse(
        {
          success: false,
          message: "Cashfree did not return a payment session.",
        },
        502,
      );
    }

    /*
     * ============================================================
     * RESPONSE
     * ============================================================
     */

    return jsonResponse({
      success: true,
      mode: cashfreeMode,

      payment_session_id: paymentSessionId,

      order_id: cashfreeOrderId || orderId,

      cf_order_id: cfOrderId || null,

      amount: orderAmount,

      return_url: returnUrl,
    });
  } catch (error) {
    console.error("create-cashfree-order error:", error);

    return jsonResponse(
      {
        success: false,
        message: "Unable to initialize Cashfree payment.",
      },
      500,
    );
  }
});
