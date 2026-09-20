/**
 * GateMate Vendor Normal Orders Lifecycle & Transition Service
 *
 * Order Lifecycle:
 *
 * NEW
 *   -> ACCEPTED
 *   -> PREPARING
 *   -> READY_FOR_DISPATCH
 *   -> OUT_FOR_DELIVERY
 *   -> DELIVERED
 *
 * Alternative terminal paths:
 * NEW -> REJECTED
 * ACCEPTED -> CANCELLED
 * PREPARING -> CANCELLED
 * READY_FOR_DISPATCH -> CANCELLED
 *
 * IMPORTANT:
 * Order status changes are performed by the authoritative
 * Supabase RPC:
 *
 * public.vendor_update_order_status(...)
 *
 * The RPC is responsible for:
 * - authorization
 * - transition validation
 * - order update
 * - timeline insertion
 * - reservation release
 * - inventory fulfillment
 * - inventory audit logging
 *
 * This service must NOT directly update vendor_orders.status.
 */

import { supabase } from "../lib/supabaseClient";

import {
  VENDOR_ORDER_STATUS,
  vendorOrderStateMachine,
} from "./vendorOrderStateMachine";

export const vendorOrderService = {
  /**
   * Resolve the vendor_profiles.id for the authenticated vendor.
   */
  async _resolveVendorId() {
    const { data: vendorId, error } = await supabase.rpc(
      "get_vendor_id_for_auth_user",
    );

    if (error) {
      throw new Error(`Unable to resolve vendor profile: ${error.message}`);
    }

    if (!vendorId) {
      throw new Error(
        "Vendor profile not found. The vendor may not be approved yet.",
      );
    }

    return vendorId;
  },

  /**
   * Fetch all normal orders belonging to the authenticated vendor.
   */
  async getVendorOrders() {
    const vendorId = await this._resolveVendorId();

    const { data, error } = await supabase
      .from("vendor_orders")
      .select("*")
      .eq("vendor_id", vendorId)
      .eq("order_type", "NORMAL_ORDER")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Unable to load vendor orders: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Fetch a single vendor order.
   */
  async getVendorOrderById(orderId) {
    if (!orderId) {
      throw new Error("Order ID is required.");
    }

    const vendorId = await this._resolveVendorId();

    const { data, error } = await supabase
      .from("vendor_orders")
      .select("*")
      .eq("id", orderId)
      .eq("vendor_id", vendorId)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to load order detail: ${error.message}`);
    }

    return data || null;
  },

  /**
   * Fetch timeline entries for a vendor order.
   *
   * Timeline is stored in vendor_order_timeline,
   * NOT inside vendor_orders.
   */
  async getVendorOrderTimeline(orderId) {
    if (!orderId) {
      throw new Error("Order ID is required.");
    }

    const vendorId = await this._resolveVendorId();

    /*
     * First verify that this order belongs to the vendor.
     */
    const { data: order, error: orderError } = await supabase
      .from("vendor_orders")
      .select("id")
      .eq("id", orderId)
      .eq("vendor_id", vendorId)
      .maybeSingle();

    if (orderError) {
      throw new Error(
        `Unable to verify order ownership: ${orderError.message}`,
      );
    }

    if (!order) {
      throw new Error("Order not found or does not belong to this vendor.");
    }

    const { data, error } = await supabase
      .from("vendor_order_timeline")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Unable to load order timeline: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Get the next actions available for an order.
   *
   * This is useful for the Vendor Orders UI.
   */
  getAvailableStatusActions(currentStatus) {
    return vendorOrderStateMachine.getNextAvailableActions(currentStatus);
  },

  /**
   * Advance an order through the authoritative backend RPC.
   *
   * IMPORTANT:
   * No direct vendor_orders UPDATE is performed here.
   *
   * The RPC atomically handles:
   * - status transition
   * - timeline
   * - inventory reservation release
   * - inventory fulfillment
   * - inventory audit
   */
  async advanceOrderStatus(orderId, nextStatus, notes = "") {
    if (!orderId) {
      throw new Error("Order ID is required.");
    }

    if (!nextStatus) {
      throw new Error("Next order status is required.");
    }

    /*
     * Normalize the status so accidental whitespace/case
     * does not reach the database.
     */
    const normalizedStatus = String(nextStatus).trim().toUpperCase();

    /*
     * Fetch the current order first.
     *
     * This gives the frontend an immediate, readable error
     * before making the RPC call if the requested transition
     * is obviously invalid.
     */
    const order = await this.getVendorOrderById(orderId);

    if (!order) {
      throw new Error(
        `Order ${orderId} not found or does not belong to this vendor.`,
      );
    }

    /*
     * Client-side validation improves UX.
     *
     * The database RPC performs the authoritative validation
     * again, so this is NOT a security boundary.
     */
    vendorOrderStateMachine.validateTransition(order.status, normalizedStatus);

    const cleanNotes = typeof notes === "string" ? notes.trim() : "";

    /*
     * Authoritative backend transition.
     */
    const { data, error } = await supabase.rpc("vendor_update_order_status", {
      p_order_id: orderId,
      p_new_status: normalizedStatus,
      p_notes: cleanNotes || null,
    });

    if (error) {
      throw new Error(`Failed to advance order status: ${error.message}`);
    }

    if (!data?.success) {
      throw new Error("Order status update did not complete successfully.");
    }

    /*
     * Return a predictable service response.
     *
     * Keep the original order object available because some
     * existing UI components may use it after the transition.
     */
    return {
      ...data,
      orderId,
      previousStatus: data.previousStatus || order.status,
      newStatus: data.newStatus || normalizedStatus,
    };
  },

  /**
   * Convenience method for accepting an order.
   */
  async acceptOrder(orderId, notes = "") {
    return this.advanceOrderStatus(
      orderId,
      VENDOR_ORDER_STATUS.ACCEPTED,
      notes,
    );
  },

  /**
   * Convenience method for rejecting a NEW order.
   *
   * WARNING:
   * This releases the inventory reservation.
   */
  async rejectOrder(orderId, notes = "") {
    return this.advanceOrderStatus(
      orderId,
      VENDOR_ORDER_STATUS.REJECTED,
      notes,
    );
  },

  /**
   * Move ACCEPTED -> PREPARING.
   */
  async startPreparing(orderId, notes = "") {
    return this.advanceOrderStatus(
      orderId,
      VENDOR_ORDER_STATUS.PREPARING,
      notes,
    );
  },

  /**
   * Move PREPARING -> READY_FOR_DISPATCH.
   */
  async markReadyForDispatch(orderId, notes = "") {
    return this.advanceOrderStatus(
      orderId,
      VENDOR_ORDER_STATUS.READY_FOR_DISPATCH,
      notes,
    );
  },

  /**
   * Move READY_FOR_DISPATCH -> OUT_FOR_DELIVERY.
   */
  async markOutForDelivery(orderId, notes = "") {
    return this.advanceOrderStatus(
      orderId,
      VENDOR_ORDER_STATUS.OUT_FOR_DELIVERY,
      notes,
    );
  },

  /**
   * Move OUT_FOR_DELIVERY -> DELIVERED.
   *
   * The backend RPC consumes the reserved inventory here.
   */
  async markDelivered(orderId, notes = "") {
    return this.advanceOrderStatus(
      orderId,
      VENDOR_ORDER_STATUS.DELIVERED,
      notes,
    );
  },

  /**
   * Cancel an order from an allowed pre-delivery state.
   *
   * The backend RPC releases the reserved inventory.
   */
  async cancelOrder(orderId, notes = "") {
    return this.advanceOrderStatus(
      orderId,
      VENDOR_ORDER_STATUS.CANCELLED,
      notes,
    );
  },
};
