/**
 * GateMate Vendor Dashboard Aggregation Service
 *
 * Aggregates operational metrics across:
 * - vendorOrderService (Today's orders, pending dispatches, completed orders)
 * - vendorFinancialService (Gross sales, net revenue after 5% commission, pending payouts)
 * - vendorInventoryService (Low-stock warnings, out-of-stock items)
 * - vendorRfqService (New commercial RFQ inquiries awaiting bids)
 * - vendorProductService (Products pending admin review or changes requested)
 */

import { supabase } from "../lib/supabaseClient";
import { vendorOrderService } from "./vendorOrderService";
import { VENDOR_ORDER_STATUS } from "./vendorOrderStateMachine";
import { vendorFinancialService } from "./vendorFinancialService";
import { vendorInventoryService } from "./vendorInventoryService";
import { vendorRfqService, RFQ_STATUS } from "./vendorRfqService";
import {
  vendorProductService,
  PRODUCT_APPROVAL_STATUS,
} from "./vendorProductService";

export const vendorDashboardService = {
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

  async getDashboardOverview() {
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const vendorId = await this._resolveVendorId();

      const [orders, financials, inventory, rfqs, products] = await Promise.all(
        [
          vendorOrderService.getVendorOrders(),
          vendorFinancialService.getFinancialSummary(),
          vendorInventoryService.getInventory(),
          vendorRfqService.getVendorRfqs(),
          vendorProductService.getVendorProducts(),
        ],
      );

      const now = new Date();
      const isToday = (dateString) => {
        if (!dateString) return false;
        const d = new Date(dateString);
        return (
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      };

      // 1. Order Metrics
      const todayOrders = orders.filter((o) => isToday(o.createdAt));
      const pendingOrders = orders.filter(
        (o) =>
          o.status === VENDOR_ORDER_STATUS.NEW ||
          o.status === VENDOR_ORDER_STATUS.ACCEPTED ||
          o.status === VENDOR_ORDER_STATUS.PREPARING ||
          o.status === VENDOR_ORDER_STATUS.READY_FOR_DISPATCH ||
          o.status === VENDOR_ORDER_STATUS.OUT_FOR_DELIVERY,
      );
      const completedOrders = orders.filter(
        (o) => o.status === VENDOR_ORDER_STATUS.DELIVERED,
      );

      // 2. Inventory Alerts
      const lowStockItems = inventory.filter(
        (i) => i.isLowStock || i.isOutOfStock,
      );

      // 3. RFQs & Product Moderation
      const newRfqs = rfqs.filter((r) => r.status === RFQ_STATUS.NEW);
      const actionRequiredProducts = products.filter(
        (p) =>
          p.status === PRODUCT_APPROVAL_STATUS.CHANGES_REQUESTED ||
          p.status === PRODUCT_APPROVAL_STATUS.UNDER_REVIEW ||
          p.status === PRODUCT_APPROVAL_STATUS.SUBMITTED,
      );

      return {
        metrics: {
          todayOrdersCount: todayOrders.length,
          todayOrdersAmount: todayOrders.reduce(
            (sum, o) => sum + (o.totals?.grandTotal || 0),
            0,
          ),
          pendingOrdersCount: pendingOrders.length,
          completedOrdersCount: completedOrders.length,
          grossSales: financials.grossProductSubtotal,
          netRevenue: financials.totalVendorEarnings,
          pendingSettlements: financials.pendingSettlementAmount,
          settledRevenue: financials.settledDisbursedAmount,
          inventoryAlertsCount: lowStockItems.length,
          newRfqsCount: newRfqs.length,
          actionRequiredProductsCount: actionRequiredProducts.length,
        },
        actionQueues: {
          urgentOrders: pendingOrders.slice(0, 4),
          urgentRfqs: newRfqs.slice(0, 3),
          lowStockAlerts: lowStockItems.slice(0, 4),
          moderationProducts: actionRequiredProducts.slice(0, 3),
        },
      };
    } catch (e) {
      console.error("Failed to load vendor dashboard summary", e);
      throw new Error(
        e.message ||
          "Unable to aggregate vendor terminal metrics. Please retry.",
      );
    }
  },
};
