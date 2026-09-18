/**
 * GateMate Vendor Normal Orders Lifecycle & Transition Service
 *
 * Order Lifecycle:
 * NEW -> ACCEPTED -> PREPARING -> READY_FOR_DISPATCH -> OUT_FOR_DELIVERY -> DELIVERED
 *
 * Enforces authoritative transition guard rules through vendorOrderStateMachine.
 */

import { supabase } from "../lib/supabaseClient";
import {
  VENDOR_ORDER_STATUS,
  vendorOrderStateMachine,
} from "./vendorOrderStateMachine";

export const vendorOrderService = {
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

  async getVendorOrderById(orderId) {
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
   * Executes authoritative state machine transition with validation.
   */
  async advanceOrderStatus(orderId, nextStatus, notes = "") {
    const vendorId = await this._resolveVendorId();
    const order = await this.getVendorOrderById(orderId);

    if (!order) {
      throw new Error(
        `Order ${orderId} not found or does not belong to vendor profile.`,
      );
    }

    // Enforce state transition rules
    vendorOrderStateMachine.validateTransition(order.status, nextStatus);

    const timestamp = new Date().toISOString();
    const config = vendorOrderStateMachine.getStatusConfig(nextStatus);

    const newTimelineEntry = {
      status: nextStatus,
      label: config.label,
      timestamp,
      notes: notes.trim() || undefined,
    };

    const updatedTimeline = [...(order.timeline || []), newTimelineEntry];

    const { data, error } = await supabase
      .from("vendor_orders")
      .update({
        status: nextStatus,
        timeline: updatedTimeline,
        delivered_at:
          nextStatus === VENDOR_ORDER_STATUS.DELIVERED
            ? timestamp
            : order.delivered_at,
        updated_at: timestamp,
      })
      .eq("id", orderId)
      .eq("vendor_id", vendorId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to advance order status: ${error.message}`);
    }

    return data;
  },
};
