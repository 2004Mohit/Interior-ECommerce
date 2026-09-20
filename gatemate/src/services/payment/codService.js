import { supabase } from "../../lib/supabaseClient";

/**
 * GateMate Pay on Delivery (POD / COD) Service
 *
 * Creates real customer orders through the Supabase
 * place_customer_order() RPC.
 *
 * Authentication:
 * - The Supabase client automatically sends the current
 *   authenticated user's session.
 * - The database RPC uses auth.uid() to identify the customer.
 *
 * Important:
 * - No order is stored in localStorage.
 * - No payment is collected here.
 * - Payment remains PENDING until collected at delivery.
 */

export const codService = {
  /**
   * Creates a Pay on Delivery order through Supabase.
   *
   * @param {Object} params
   * @param {Array} params.items
   * @param {Object} params.address
   * @param {string} params.deliveryOptionId
   * @param {Object} params.totals
   * @param {Object} params.user
   * @returns {Promise<Object>}
   */
  async processPayOnDeliveryOrder({
    items,
    address,
    deliveryOptionId,
    totals,
    user,
  }) {
    try {
      // ------------------------------------------------------------
      // 1. Validate authenticated user
      // ------------------------------------------------------------

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error(
          "GateMate COD: Failed to get authentication session:",
          sessionError,
        );

        return {
          success: false,
          message:
            "Unable to verify your login session. Please sign in again and try.",
          error: sessionError,
        };
      }

      const authenticatedUser = session?.user;

      if (!authenticatedUser) {
        return {
          success: false,
          message: "Please sign in before placing an order.",
          error: new Error("Authentication required"),
        };
      }

      // ------------------------------------------------------------
      // 2. Optional consistency check
      // ------------------------------------------------------------

      if (user?.id && user.id !== authenticatedUser.id) {
        console.warn(
          "GateMate COD: Provided user does not match authenticated user.",
          {
            providedUserId: user.id,
            authenticatedUserId: authenticatedUser.id,
          },
        );
      }

      // ------------------------------------------------------------
      // 3. Validate checkout data
      // ------------------------------------------------------------

      if (!Array.isArray(items) || items.length === 0) {
        return {
          success: false,
          message: "Your cart is empty. Please add products before checkout.",
          error: new Error("Checkout items are required"),
        };
      }

      if (!address || typeof address !== "object") {
        return {
          success: false,
          message: "Please select a valid delivery address.",
          error: new Error("Delivery address is required"),
        };
      }

      if (!deliveryOptionId) {
        return {
          success: false,
          message: "Please select a delivery option.",
          error: new Error("Delivery option is required"),
        };
      }

      if (!totals || typeof totals !== "object") {
        return {
          success: false,
          message: "Unable to calculate your order total. Please try again.",
          error: new Error("Checkout totals are required"),
        };
      }

      // ------------------------------------------------------------
      // 4. Generate checkout reference
      // ------------------------------------------------------------
      //
      // This reference is used for database idempotency.
      // ------------------------------------------------------------

      const checkoutReference = `GM-CHK-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase()}`;

      // ------------------------------------------------------------
      // 5. Prepare shipping address
      // ------------------------------------------------------------

      const shippingAddress = {
        ...address,

        name:
          address.name ||
          address.fullName ||
          authenticatedUser.user_metadata?.full_name ||
          authenticatedUser.user_metadata?.fullName ||
          "",

        phone: address.phone || address.mobile || authenticatedUser.phone || "",
      };

      // ------------------------------------------------------------
      // 6. Prepare totals
      // ------------------------------------------------------------

      const rpcTotals = {
        itemSubtotal: Number(totals.itemSubtotal || 0),
        deliveryFee: Number(totals.deliveryFee || 0),
        packagingFee: Number(totals.packagingFee || 0),
        taxAmount: Number(totals.taxAmount || 0),
        grandTotal: Number(totals.grandTotal || 0),
        codConvenienceFee: Number(totals.codConvenienceFee || 0),
      };

      // ------------------------------------------------------------
      // 7. Call Supabase RPC
      // ------------------------------------------------------------

      const { data, error } = await supabase.rpc("place_customer_order", {
        p_checkout_reference: checkoutReference,
        p_shipping_address: shippingAddress,
        p_delivery_option_id: deliveryOptionId,
        p_payment_method: "PAY_ON_DELIVERY",
        p_totals: rpcTotals,
      });

      // ------------------------------------------------------------
      // 8. Handle Supabase/database error
      // ------------------------------------------------------------

      if (error) {
        console.error("GateMate COD: place_customer_order failed:", error);

        let message =
          "We could not place your order. Please review your cart and try again.";

        const errorMessage = error.message?.toLowerCase() || "";

        if (errorMessage.includes("authentication required")) {
          message = "Your login session has expired. Please sign in again.";
        } else if (
          errorMessage.includes("insufficient stock") ||
          errorMessage.includes("insufficient inventory")
        ) {
          message =
            "One or more products do not have enough available stock for your requested quantity.";
        } else if (errorMessage.includes("stock")) {
          message =
            "The requested product quantity is no longer available. Please review your cart.";
        } else if (errorMessage.includes("checkout amount changed")) {
          message =
            "Your checkout total has changed. Please return to checkout and review the updated total.";
        } else if (errorMessage.includes("minimum order")) {
          message =
            "One or more products do not meet the minimum order quantity.";
        } else if (error.message) {
          message = error.message;
        }

        return {
          success: false,
          message,
          error,
        };
      }

      // ------------------------------------------------------------
      // 9. Validate RPC response
      // ------------------------------------------------------------

      if (!data) {
        console.error("GateMate COD: RPC returned an empty response.");

        return {
          success: false,
          message:
            "The order could not be confirmed because the server returned an empty response.",
          error: new Error("Empty order response"),
        };
      }

      if (data.success === false) {
        console.error(
          "GateMate COD: RPC returned unsuccessful response:",
          data,
        );

        return {
          success: false,
          message:
            typeof data.message === "string"
              ? data.message
              : "The order could not be placed. Please try again.",
          error: new Error(
            typeof data.message === "string"
              ? data.message
              : "Order placement failed",
          ),
          data,
        };
      }

      // ------------------------------------------------------------
      // 10. Normalize order IDs
      // ------------------------------------------------------------
      //
      // The RPC returns orderIds as objects:
      //
      // [
      //   {
      //     orderId: "GM-...",
      //     vendorId: "..."
      //   }
      // ]
      //
      // The frontend expects:
      //
      // [
      //   "GM-..."
      // ]
      //
      // Normalize both normal and idempotent responses here so
      // CheckoutDrawer never receives an object as orderId.
      // ------------------------------------------------------------

      const rawOrderIds = Array.isArray(data.orderIds)
        ? data.orderIds
        : data.orderId
          ? [data.orderId]
          : [];

      const orderIds = rawOrderIds
        .map((entry) => {
          if (typeof entry === "string") {
            return entry;
          }

          if (
            entry &&
            typeof entry === "object" &&
            typeof entry.orderId === "string"
          ) {
            return entry.orderId;
          }

          return null;
        })
        .filter(Boolean);

      // ------------------------------------------------------------
      // 11. Determine primary order ID
      // ------------------------------------------------------------

      const primaryOrderId = orderIds.length > 0 ? orderIds[0] : null;

      if (!primaryOrderId) {
        console.error(
          "GateMate COD: RPC succeeded but no valid order ID was returned.",
          data,
        );

        return {
          success: false,
          message:
            "The order was processed but no order reference was returned. Please contact support before retrying.",
          error: new Error("Missing order ID"),
          data,
        };
      }

      // ------------------------------------------------------------
      // 12. Create frontend-compatible order record
      // ------------------------------------------------------------
      //
      // The authoritative order exists in Supabase.
      // This object is only the frontend response model.
      // ------------------------------------------------------------

      const orderRecord = {
        id: primaryOrderId,

        orderId: primaryOrderId,

        orderIds,

        checkoutReference: data.checkoutReference || checkoutReference,

        createdAt: new Date().toISOString(),

        items,

        address: shippingAddress,

        deliveryOptionId,

        paymentMethod: "Pay on Delivery (Cash / Doorstep UPI)",

        paymentStatus: data.paymentStatus || "PENDING",

        orderStatus: data.orderStatus || "NEW",

        orderCount: Number(data.orderCount) || orderIds.length,

        totals: {
          itemSubtotal: rpcTotals.itemSubtotal,
          deliveryFee: rpcTotals.deliveryFee,
          packagingFee: rpcTotals.packagingFee,
          taxAmount: rpcTotals.taxAmount,
          codConvenienceFee: rpcTotals.codConvenienceFee,
          grandTotal: rpcTotals.grandTotal,
        },

        idempotent: data.idempotent === true,
      };

      // ------------------------------------------------------------
      // 13. Return successful result
      // ------------------------------------------------------------

      return {
        success: true,

        orderId: primaryOrderId,

        orderIds,

        checkoutReference: data.checkoutReference || checkoutReference,

        paymentStatus: data.paymentStatus || "PENDING",

        orderStatus: data.orderStatus || "NEW",

        record: orderRecord,

        data,

        message:
          data.idempotent === true
            ? "Your order was already confirmed successfully."
            : "Order confirmed successfully. Collect payment upon doorstep delivery.",
      };
    } catch (error) {
      // ------------------------------------------------------------
      // 14. Unexpected error protection
      // ------------------------------------------------------------

      console.error("GateMate COD: Unexpected order placement error:", error);

      return {
        success: false,
        message:
          error?.message ||
          "Something went wrong while placing your order. Please try again.",
        error,
      };
    }
  },
};
