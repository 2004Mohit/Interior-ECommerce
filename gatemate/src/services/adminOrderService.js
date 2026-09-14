import { supabase } from "../lib/supabaseClient";

export const adminOrderService = {
  /**
   * Fetches paginated orders with customer, vendor, and delivery metrics
   */
  async getOrders({
    search = "",
    status = "ALL",
    isExpressOnly = false,
    isDelayedOnly = false,
    limit = 50,
    offset = 0,
  } = {}) {
    let query = supabase
      .from("vendor_orders")
      .select(
        `
        *,
        vendor_profiles:vendor_id (
          id,
          business_name,
          phone,
          locality,
          city
        )
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "ALL") {
      query = query.eq("status", status);
    }
    if (isExpressOnly) {
      query = query.eq("is_express_30min", true);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    const now = new Date();

    let processed = (data || []).map((o) => {
      const createdDate = new Date(o.created_at);
      const elapsedMinutes = Math.floor((now - createdDate) / (1000 * 60));

      // 30-min express SLA delay check
      const isBreached =
        o.is_express_30min &&
        !["DELIVERED", "CANCELLED", "REJECTED"].includes(o.status) &&
        elapsedMinutes > 30;
      // Standard order delay check (> 4 hours without dispatch)
      const isStandardDelayed =
        !o.is_express_30min &&
        ["NEW", "ACCEPTED", "PREPARING"].includes(o.status) &&
        elapsedMinutes > 240;

      return {
        ...o,
        vendor: Array.isArray(o.vendor_profiles)
          ? o.vendor_profiles[0]
          : o.vendor_profiles,
        elapsedMinutes,
        isSlaBreached: o.is_delayed || isBreached || isStandardDelayed,
      };
    });

    if (isDelayedOnly) {
      processed = processed.filter((o) => o.isSlaBreached);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      processed = processed.filter((o) => {
        const orderId = String(o.id || "").toLowerCase();
        const vName = String(o.vendor?.business_name || "").toLowerCase();
        const cPhone = String(o.shipping_address?.phone || "").toLowerCase();
        const cName = String(o.shipping_address?.fullName || "").toLowerCase();
        return (
          orderId.includes(q) ||
          vName.includes(q) ||
          cPhone.includes(q) ||
          cName.includes(q)
        );
      });
    }

    return {
      orders: processed,
      totalCount: count || processed.length,
    };
  },

  /**
   * Fetches single detailed order including order items and status history timeline
   */
  async getOrderDetail(orderId) {
    const [orderRes, itemsRes, timelineRes] = await Promise.all([
      supabase
        .from("vendor_orders")
        .select(
          `
          *,
          vendor_profiles:vendor_id (
            id,
            business_name,
            phone,
            email,
            yard_address_line1,
            locality,
            city,
            pincode
          )
        `,
        )
        .eq("id", orderId)
        .single(),
      supabase.from("vendor_order_items").select("*").eq("order_id", orderId),
      supabase
        .from("vendor_order_timeline")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true }),
    ]);

    if (orderRes.error) throw orderRes.error;

    return {
      order: {
        ...orderRes.data,
        vendor: Array.isArray(orderRes.data.vendor_profiles)
          ? orderRes.data.vendor_profiles[0]
          : orderRes.data.vendor_profiles,
      },
      items: itemsRes.data || [],
      timeline: timelineRes.data || [],
    };
  },

  /**
   * Administrative intervention to update status, register delay, or cancel order
   */
  async updateOrderStatus({
    orderId,
    newStatus,
    adminNotes,
    isDelayed = false,
    delayReason = null,
    deliveryExceptionType = null,
  }) {
    const { data, error } = await supabase.rpc("admin_update_order_status", {
      p_order_id: orderId,
      p_new_status: newStatus,
      p_admin_notes: adminNotes.trim(),
      p_is_delayed: isDelayed,
      p_delay_reason: delayReason?.trim() || null,
      p_delivery_exception_type: deliveryExceptionType || null,
    });

    if (error) throw error;
    return data;
  },
};
