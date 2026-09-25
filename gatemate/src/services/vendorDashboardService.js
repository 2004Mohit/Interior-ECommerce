/**
 * GateMate Vendor Dashboard Aggregation Service
 *
 * Resolves the authenticated user's vendor profile and
 * aggregates operational metrics for that vendor.
 *
 * IMPORTANT:
 * This service normalizes vendor order data before
 * returning it to VendorDashboard.jsx.
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

/**
 * Normalize shipping address coming from Supabase.
 *
 * shipping_address can be:
 *
 * - JSON object
 * - JSON string
 * - null
 * - plain text
 */
const normalizeShippingAddress = (rawAddress) => {
  if (!rawAddress) {
    return {};
  }

  /*
   * Already an object.
   */
  if (typeof rawAddress === "object") {
    return rawAddress;
  }

  /*
   * JSON string or plain-text address.
   */
  if (typeof rawAddress === "string") {
    const trimmed = rawAddress.trim();

    if (!trimmed) {
      return {};
    }

    try {
      const parsed = JSON.parse(trimmed);

      if (parsed && typeof parsed === "object") {
        return parsed;
      }

      return {
        line1: trimmed,
      };
    } catch {
      /*
       * Some older records may contain a normal
       * text address instead of JSON.
       */
      return {
        line1: trimmed,
      };
    }
  }

  return {};
};

/**
 * Normalize one raw vendor order into the structure
 * expected by VendorDashboard.jsx.
 */
const normalizeOrderForDashboard = (order) => {
  if (!order) {
    return null;
  }

  const shippingAddress = normalizeShippingAddress(order.shipping_address);

  /*
   * Normalize order items.
   *
   * Always return an array so the Dashboard
   * never receives undefined.
   */
  const items = Array.isArray(order.items)
    ? order.items.map((item) => ({
        ...item,

        id: item.id,

        productId: item.product_id ?? item.productId ?? null,

        name: item.product_name ?? item.name ?? "Product",

        quantity: Number(item.quantity ?? 0),

        unit: item.unit ?? "unit",

        price: Number(item.unit_price ?? item.price ?? 0),

        subtotal: Number(item.subtotal ?? 0),

        sku: item.sku ?? "—",

        img: item.image_url ?? item.img ?? null,
      }))
    : [];

  /*
   * Normalize totals.
   *
   * Different services/database versions may
   * use either snake_case DB fields or the
   * frontend totals object.
   */
  const totals = {
    itemSubtotal: Number(
      order.totals?.itemSubtotal ?? order.item_subtotal ?? 0,
    ),

    deliveryFee: Number(order.totals?.deliveryFee ?? order.delivery_fee ?? 0),

    packagingFee: Number(
      order.totals?.packagingFee ?? order.packaging_fee ?? 0,
    ),

    taxAmount: Number(order.totals?.taxAmount ?? order.tax_amount ?? 0),

    grandTotal: Number(order.totals?.grandTotal ?? order.grand_total ?? 0),
  };

  /*
   * Return the original order fields plus
   * the normalized dashboard fields.
   */
  return {
    ...order,

    /*
     * Customer information.
     */
    customerName:
      order.customerName ??
      order.customer_name ??
      shippingAddress.fullName ??
      shippingAddress.name ??
      "Customer",

    customerPhone:
      order.customerPhone ??
      order.customer_phone ??
      shippingAddress.phone ??
      shippingAddress.mobile ??
      "",

    customerRef: order.customerRef ?? order.customer_ref ?? "—",

    /*
     * Delivery type.
     */
    isExpress30Min: Boolean(
      order.isExpress30Min ?? order.is_express_30min ?? false,
    ),

    /*
     * Payment information.
     */
    paymentStatus: order.paymentStatus ?? order.payment_status ?? "PENDING",

    paymentMethod:
      order.paymentMethod ?? order.payment_method ?? "PAY_ON_DELIVERY",

    /*
     * Normalized financial totals.
     */
    totals,

    /*
     * THIS IS THE IMPORTANT FIX.
     *
     * VendorDashboard.jsx expects:
     *
     * order.deliveryAddress.locality
     *
     * order.deliveryAddress.city
     *
     * order.deliveryAddress.pincode
     */
    deliveryAddress: {
      fullName:
        shippingAddress.fullName ??
        shippingAddress.name ??
        order.customerName ??
        order.customer_name ??
        "",

      phone:
        shippingAddress.phone ??
        shippingAddress.mobile ??
        order.customerPhone ??
        order.customer_phone ??
        "",

      line1:
        shippingAddress.line1 ??
        shippingAddress.addressLine1 ??
        shippingAddress.address_line1 ??
        shippingAddress.address ??
        "Address not provided",

      locality:
        shippingAddress.locality ??
        shippingAddress.area ??
        shippingAddress.taluka ??
        shippingAddress.neighborhood ??
        "",

      city: shippingAddress.city ?? "",

      state: shippingAddress.state ?? "Maharashtra",

      pincode:
        shippingAddress.pincode ??
        shippingAddress.postalCode ??
        shippingAddress.postal_code ??
        "",

      landmark: shippingAddress.landmark ?? "",

      notes: shippingAddress.notes ?? shippingAddress.deliveryNotes ?? "",
    },

    /*
     * Dates.
     */
    createdAt: order.createdAt ?? order.created_at ?? null,

    updatedAt: order.updatedAt ?? order.updated_at ?? null,

    /*
     * Always provide items.
     */
    items,
  };
};

export const vendorDashboardService = {
  /**
   * Resolve vendor_profiles.id from the
   * currently authenticated auth.users.id.
   *
   * auth.users.id != vendor_profiles.id
   *
   * Never use a hardcoded vendor ID.
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
       * Fetch dashboard data.
       */
      const [rawOrders, financials, inventory, rfqs, products] =
        await Promise.all([
          vendorOrderService.getVendorOrders(),

          vendorFinancialService.getFinancialSummary(),

          vendorInventoryService.getInventory(),

          vendorRfqService.getVendorRfqs(),

          vendorProductService.getVendorProducts(vendorId),
        ]);

      /*
       * Normalize orders before they reach
       * VendorDashboard.jsx.
       *
       * This is the main fix for:
       *
       * Cannot read properties of undefined
       * (reading 'locality')
       */
      const orders = (Array.isArray(rawOrders) ? rawOrders : [])
        .map(normalizeOrderForDashboard)
        .filter(Boolean);

      const safeFinancials = financials || {};

      const safeInventory = Array.isArray(inventory) ? inventory : [];

      const safeRfqs = Array.isArray(rfqs) ? rfqs : [];

      const safeProducts = Array.isArray(products) ? products : [];

      const now = new Date();

      /**
       * Check whether a date belongs to today.
       */
      const isToday = (dateString) => {
        if (!dateString) {
          return false;
        }

        const d = new Date(dateString);

        if (Number.isNaN(d.getTime())) {
          return false;
        }

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
      const lowStockItems = safeInventory.filter(
        (item) => item?.isLowStock || item?.isOutOfStock,
      );

      /*
       * RFQ METRICS
       */
      const newRfqs = safeRfqs.filter((rfq) => rfq?.status === RFQ_STATUS.NEW);

      /*
       * PRODUCT MODERATION
       */
      const actionRequiredProducts = safeProducts.filter(
        (product) =>
          product?.status === PRODUCT_APPROVAL_STATUS.CHANGES_REQUESTED ||
          product?.status === PRODUCT_APPROVAL_STATUS.UNDER_REVIEW ||
          product?.status === PRODUCT_APPROVAL_STATUS.SUBMITTED,
      );

      /*
       * FINAL DASHBOARD RESPONSE
       */
      return {
        vendorId,

        metrics: {
          todayOrdersCount: todayOrders.length,

          todayOrdersAmount: todayOrders.reduce(
            (sum, order) => sum + Number(order?.totals?.grandTotal || 0),

            0,
          ),

          pendingOrdersCount: pendingOrders.length,

          completedOrdersCount: completedOrders.length,

          /*
           * Existing property names used
           * by VendorDashboard.jsx.
           */
          grossVolume: Number(safeFinancials?.grossProductSubtotal || 0),

          netRevenue: Number(safeFinancials?.totalVendorEarnings || 0),

          pendingSettlements: Number(
            safeFinancials?.pendingSettlementAmount || 0,
          ),

          settledRevenue: Number(safeFinancials?.settledDisbursedAmount || 0),

          inventoryAlertsCount: lowStockItems.length,

          newRfqsCount: newRfqs.length,

          actionRequiredProductsCount: actionRequiredProducts.length,
        },

        actionQueues: {
          /*
           * IMPORTANT:
           *
           * These orders now contain:
           *
           * deliveryAddress
           * totals
           * customerName
           * customerPhone
           * items
           */
          urgentOrders: pendingOrders.slice(0, 4),

          urgentRfqs: newRfqs.slice(0, 3),

          lowStockAlerts: lowStockItems.slice(0, 4),

          moderationProducts: actionRequiredProducts.slice(0, 3),
        },
      };
    } catch (error) {
      /*
       * Missing vendor profile is an expected
       * state for a newly registered vendor.
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
