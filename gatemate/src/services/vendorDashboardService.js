/**
 * GateMate Vendor Dashboard Aggregation Service
 *
 * Resolves the authenticated user's vendor profile and
 * aggregates operational metrics for that vendor.
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
  /**
   * Resolve vendor_profiles.id from the currently
   * authenticated auth.users.id.
   *
   * IMPORTANT:
   *
   * auth.users.id != vendor_profiles.id
   *
   * Never use a hardcoded vendor ID here.
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
   * Get complete vendor dashboard overview.
   */
  async getDashboardOverview() {
    try {
      const vendorId = await this._resolveVendorId();

      /*
       * The vendor ID has now been resolved.
       *
       * The individual vendor services should use the
       * currently authenticated vendor identity and/or
       * vendor_profiles.id internally.
       */
      const [orders, financials, inventory, rfqs, products] = await Promise.all(
        [
          vendorOrderService.getVendorOrders(),
          vendorFinancialService.getFinancialSummary(),
          vendorInventoryService.getInventory(),
          vendorRfqService.getVendorRfqs(),
          vendorProductService.getVendorProducts(vendorId),
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

      /*
       * ORDER METRICS
       */
      const todayOrders = orders.filter((order) => isToday(order.createdAt));

      const pendingOrders = orders.filter(
        (order) =>
          order.status === VENDOR_ORDER_STATUS.NEW ||
          order.status === VENDOR_ORDER_STATUS.ACCEPTED ||
          order.status === VENDOR_ORDER_STATUS.PREPARING ||
          order.status === VENDOR_ORDER_STATUS.READY_FOR_DISPATCH ||
          order.status === VENDOR_ORDER_STATUS.OUT_FOR_DELIVERY,
      );

      const completedOrders = orders.filter(
        (order) => order.status === VENDOR_ORDER_STATUS.DELIVERED,
      );

      /*
       * INVENTORY ALERTS
       */
      const lowStockItems = inventory.filter(
        (item) => item.isLowStock || item.isOutOfStock,
      );

      /*
       * RFQ METRICS
       */
      const newRfqs = rfqs.filter((rfq) => rfq.status === RFQ_STATUS.NEW);

      /*
       * PRODUCT MODERATION
       */
      const actionRequiredProducts = products.filter(
        (product) =>
          product.status === PRODUCT_APPROVAL_STATUS.CHANGES_REQUESTED ||
          product.status === PRODUCT_APPROVAL_STATUS.UNDER_REVIEW ||
          product.status === PRODUCT_APPROVAL_STATUS.SUBMITTED,
      );

      return {
        vendorId,

        metrics: {
          todayOrdersCount: todayOrders.length,

          todayOrdersAmount: todayOrders.reduce(
            (sum, order) => sum + Number(order.totals?.grandTotal || 0),
            0,
          ),

          pendingOrdersCount: pendingOrders.length,

          completedOrdersCount: completedOrders.length,

          /*
           * Keep the existing dashboard property names
           * used by VendorDashboard.jsx.
           */
          grossVolume: Number(financials?.grossProductSubtotal || 0),

          netRevenue: Number(financials?.totalVendorEarnings || 0),

          pendingSettlements: Number(financials?.pendingSettlementAmount || 0),

          settledRevenue: Number(financials?.settledDisbursedAmount || 0),

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
    } catch (error) {
      /*
       * Missing vendor profile is an expected state for
       * a newly registered vendor.
       *
       * Do not label it as a system failure here.
       */
      const message = error?.message || "";

      if (!message.toLowerCase().includes("vendor profile not found")) {
        console.error("Failed to load vendor dashboard summary:", error);
      }

      throw error;
    }
  },
};

export default vendorDashboardService;
