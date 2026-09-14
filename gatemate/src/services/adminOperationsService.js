import { supabase } from "../lib/supabaseClient";

export const adminOperationsService = {
  /**
   * Fetches real-time platform-wide operations metrics
   */
  async getDashboardSummary() {
    try {
      const { data, error } = await supabase.rpc("get_admin_dashboard_metrics");
      if (error) throw error;
      if (data) return data;
    } catch (err) {
      console.warn(
        "RPC get_admin_dashboard_metrics failed, falling back to direct queries:",
        err,
      );
    }

    // Direct multi-table fallback
    const [
      vendorAppsRes,
      productsRes,
      inventoryRes,
      ordersRes,
      rfqsRes,
      settlementsRes,
      txRes,
    ] = await Promise.all([
      supabase.from("vendor_applications").select("status"),
      supabase.from("vendor_products").select("status, image_urls"),
      supabase
        .from("vendor_inventory")
        .select("on_hand_stock, reserved_stock, low_stock_threshold"),
      supabase
        .from("vendor_orders")
        .select(
          "status, is_express_30min, created_at, grand_total, item_subtotal",
        ),
      supabase.from("vendor_rfqs").select("status, expiry_date"),
      supabase
        .from("vendor_settlements")
        .select("net_disbursed_amount, status"),
      supabase
        .from("vendor_transactions")
        .select("vendor_payable_amount, settlement_status"),
    ]);

    const vendorApps = vendorAppsRes.data || [];
    const products = productsRes.data || [];
    const inventory = inventoryRes.data || [];
    const orders = ordersRes.data || [];
    const rfqs = rfqsRes.data || [];
    const settlements = settlementsRes.data || [];
    const transactions = txRes.data || [];

    const now = new Date();
    const validOrders = orders.filter(
      (o) => o.status !== "CANCELLED" && o.status !== "REJECTED",
    );
    const validSubtotal = validOrders.reduce(
      (sum, o) => sum + Number(o.item_subtotal || 0),
      0,
    );

    return {
      vendors: {
        totalVendors: vendorApps.length,
        pendingOnboarding: vendorApps.filter(
          (a) => a.status === "DRAFT" || a.status === "SUBMITTED",
        ).length,
        underReview: vendorApps.filter((a) => a.status === "UNDER_REVIEW")
          .length,
        approved: vendorApps.filter((a) => a.status === "APPROVED").length,
        rejected: vendorApps.filter((a) => a.status === "REJECTED").length,
        profileChangeRequests: vendorApps.filter(
          (a) => a.status === "CHANGES_REQUESTED",
        ).length,
      },
      products: {
        pendingModeration: products.filter(
          (p) => p.status === "SUBMITTED" || p.status === "UNDER_REVIEW",
        ).length,
        approved: products.filter((p) => p.status === "APPROVED").length,
        published: products.filter((p) => p.status === "PUBLISHED").length,
        rejected: products.filter((p) => p.status === "REJECTED").length,
        changesRequested: products.filter(
          (p) => p.status === "CHANGES_REQUESTED",
        ).length,
        unpublished: products.filter((p) => p.status === "DRAFT").length,
        mediaNeedingReview: products.filter(
          (p) =>
            ["SUBMITTED", "UNDER_REVIEW"].includes(p.status) &&
            p.image_urls?.length > 0,
        ).length,
      },
      inventory: {
        lowStockProducts: inventory.filter(
          (i) =>
            i.on_hand_stock - i.reserved_stock <= i.low_stock_threshold &&
            i.on_hand_stock - i.reserved_stock > 0,
        ).length,
        outOfStockProducts: inventory.filter(
          (i) => i.on_hand_stock - i.reserved_stock <= 0,
        ).length,
        inventoryIssues: inventory.filter(
          (i) => i.reserved_stock > i.on_hand_stock,
        ).length,
      },
      orders: {
        newOrders: orders.filter((o) => o.status === "NEW").length,
        accepted: orders.filter((o) => o.status === "ACCEPTED").length,
        preparing: orders.filter((o) => o.status === "PREPARING").length,
        readyForDispatch: orders.filter(
          (o) => o.status === "READY_FOR_DISPATCH",
        ).length,
        outForDelivery: orders.filter((o) => o.status === "OUT_FOR_DELIVERY")
          .length,
        delivered: orders.filter((o) => o.status === "DELIVERED").length,
        cancelledExceptions: orders.filter((o) =>
          ["CANCELLED", "REJECTED"].includes(o.status),
        ).length,
      },
      delivery: {
        eligible30MinOrders: validOrders.filter((o) => o.is_express_30min)
          .length,
        delayedOrders: orders.filter(
          (o) =>
            ["NEW", "ACCEPTED", "PREPARING"].includes(o.status) &&
            now - new Date(o.created_at) > 30 * 60 * 1000,
        ).length,
        slaExceptions: orders.filter(
          (o) =>
            ["READY_FOR_DISPATCH", "OUT_FOR_DELIVERY"].includes(o.status) &&
            now - new Date(o.created_at) > 45 * 60 * 1000,
        ).length,
      },
      rfqs: {
        openRfqs: rfqs.filter((r) => ["NEW", "RESPONDED"].includes(r.status))
          .length,
        awaitingVendorQuotation: rfqs.filter((r) => r.status === "NEW").length,
        quoted: rfqs.filter((r) =>
          ["QUOTATION_SENT", "NEGOTIATION"].includes(r.status),
        ).length,
        accepted: rfqs.filter((r) =>
          ["ACCEPTED", "CONVERTED_TO_ORDER", "COMPLETED"].includes(r.status),
        ).length,
        expired: rfqs.filter(
          (r) =>
            r.status === "EXPIRED" ||
            (["NEW", "RESPONDED"].includes(r.status) &&
              new Date(r.expiry_date) < now),
        ).length,
      },
      finance: {
        totalGmv: validOrders.reduce(
          (sum, o) => sum + Number(o.grand_total || 0),
          0,
        ),
        productSubtotal: validSubtotal,
        platformCommission5Percent:
          Math.round(validSubtotal * 0.05 * 100) / 100,
        pendingSettlementAmount: transactions
          .filter((t) => t.settlement_status === "PENDING")
          .reduce((sum, t) => sum + Number(t.vendor_payable_amount || 0), 0),
        completedSettlementAmount: settlements
          .filter((s) => s.status === "PROCESSED")
          .reduce((sum, s) => sum + Number(s.net_disbursed_amount || 0), 0),
      },
      generatedAt: now.toISOString(),
    };
  },
};
