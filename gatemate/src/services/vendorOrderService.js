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

const VENDOR_ORDERS_STORAGE_KEY = "gatemate_vendor_normal_orders_";

const SEED_VENDOR_ORDERS = [
  {
    id: "GM-ORD-20260911-0418",
    vendorId: "vnd-pune-001",
    customerRef: "CUST-PN-8812",
    customerName: "Aditya Rathore (Civil Contractor)",
    customerPhone: "+91 98290 12345",
    orderType: "NORMAL_ORDER",
    isExpress30Min: true,
    status: VENDOR_ORDER_STATUS.NEW,
    paymentStatus: "PENDING",
    paymentMethod: "Pay on Delivery",
    createdAt: "2026-09-11T13:10:00Z",
    estimatedDispatchMinutes: 30,
    deliveryAddress: {
      fullName: "Aditya Rathore",
      phone: "+91 98290 12345",
      line1: "Site Plot #402, Royal Palms, Lane 7",
      locality: "Koregaon Park",
      city: "Pune",
      pincode: "411006",
      notes: "Direct ground floor delivery near concrete mixer.",
    },
    items: [
      {
        id: "prod-cem-001",
        name: "UltraTech Super Weather-Shield PPC Cement (50 kg Bag)",
        brand: "UltraTech",
        category: "Cement",
        unit: "bag",
        sku: "ULT-PPC-50KG",
        price: 385,
        quantity: 10,
        subtotal: 3850,
        img: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80",
      },
    ],
    totals: {
      itemSubtotal: 3850,
      deliveryFee: 0,
      packagingFee: 49,
      codConvenienceFee: 49,
      grandTotal: 3948,
    },
    timeline: [
      {
        status: VENDOR_ORDER_STATUS.NEW,
        label: "Order Placed by Customer",
        timestamp: "2026-09-11T13:10:00Z",
        notes: "30-minute priority delivery requested on eligible products.",
      },
    ],
  },
  {
    id: "GM-ORD-20260911-0391",
    vendorId: "vnd-pune-001",
    customerRef: "CUST-PN-4901",
    customerName: "Kailash Deshmukh",
    customerPhone: "+91 97654 32100",
    orderType: "NORMAL_ORDER",
    isExpress30Min: true,
    status: VENDOR_ORDER_STATUS.PREPARING,
    paymentStatus: "SUCCESS",
    paymentMethod: "UPI Instant Bank Transfer",
    createdAt: "2026-09-11T12:45:00Z",
    estimatedDispatchMinutes: 30,
    deliveryAddress: {
      fullName: "Kailash Deshmukh",
      phone: "+91 97654 32100",
      line1: "Tower B, Ganga Platino Project",
      locality: "Kharadi",
      city: "Pune",
      pincode: "411014",
    },
    items: [
      {
        id: "prod-tmt-001",
        name: "Tata Tiscon 550D High Ductility Earthquake Resistant TMT Rebar (12mm)",
        brand: "Tata Tiscon",
        category: "Steel & TMT",
        unit: "piece",
        sku: "TAT-TMT-12MM-550D",
        price: 840,
        quantity: 6,
        subtotal: 5040,
        img: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80",
      },
    ],
    totals: {
      itemSubtotal: 5040,
      deliveryFee: 0,
      packagingFee: 29,
      codConvenienceFee: 0,
      grandTotal: 5069,
    },
    timeline: [
      {
        status: VENDOR_ORDER_STATUS.NEW,
        label: "Order Placed",
        timestamp: "2026-09-11T12:45:00Z",
      },
      {
        status: VENDOR_ORDER_STATUS.ACCEPTED,
        label: "Order Accepted by Vendor",
        timestamp: "2026-09-11T12:48:00Z",
      },
      {
        status: VENDOR_ORDER_STATUS.PREPARING,
        label: "Bundling & Flatbed Staging in Progress",
        timestamp: "2026-09-11T12:52:00Z",
      },
    ],
  },
  {
    id: "GM-ORD-20260910-0210",
    vendorId: "vnd-pune-001",
    customerRef: "CUST-PN-1102",
    customerName: "Shree Developers Site 1",
    customerPhone: "+91 98900 44332",
    orderType: "NORMAL_ORDER",
    isExpress30Min: false,
    status: VENDOR_ORDER_STATUS.DELIVERED,
    paymentStatus: "SUCCESS",
    paymentMethod: "Net Banking IMPS",
    createdAt: "2026-09-10T11:00:00Z",
    deliveredAt: "2026-09-10T14:30:00Z",
    deliveryAddress: {
      fullName: "Shree Developers",
      phone: "+91 98900 44332",
      line1: "Commercial Wing 18, Rose Valley Infrastructure",
      locality: "Pimple Saudagar",
      city: "Pimpri-Chinchwad",
      pincode: "411061",
    },
    items: [
      {
        id: "prod-elec-001",
        name: "Polycab 1.5 sq mm FR Flame Retardant Copper House Wire (90m Red)",
        brand: "Polycab",
        category: "Electrical",
        unit: "meter",
        sku: "POL-FR-15-RED",
        price: 1840,
        quantity: 3,
        subtotal: 5520,
        img: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
      },
    ],
    totals: {
      itemSubtotal: 5520,
      deliveryFee: 0,
      packagingFee: 29,
      codConvenienceFee: 0,
      grandTotal: 5549,
    },
    timeline: [
      {
        status: VENDOR_ORDER_STATUS.NEW,
        label: "Order Placed",
        timestamp: "2026-09-10T11:00:00Z",
      },
      {
        status: VENDOR_ORDER_STATUS.ACCEPTED,
        label: "Accepted by Depot",
        timestamp: "2026-09-10T11:05:00Z",
      },
      {
        status: VENDOR_ORDER_STATUS.READY_FOR_DISPATCH,
        label: "Loaded on Courier",
        timestamp: "2026-09-10T12:00:00Z",
      },
      {
        status: VENDOR_ORDER_STATUS.OUT_FOR_DELIVERY,
        label: "En Route to Site",
        timestamp: "2026-09-10T13:15:00Z",
      },
      {
        status: VENDOR_ORDER_STATUS.DELIVERED,
        label: "Delivered & Handed Over",
        timestamp: "2026-09-10T14:30:00Z",
      },
    ],
  },
];

export const vendorOrderService = {
  async getVendorOrders(vendorId = "vnd-pune-001") {
    await new Promise((resolve) => setTimeout(resolve, 80));

    try {
      const { data, error } = await supabase
        .from("vendor_orders")
        .select("*")
        .eq("vendor_id", vendorId)
        .eq("order_type", "NORMAL_ORDER")
        .order("created_at", { ascending: false });

      if (data && !error && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn("Supabase query fallback to local cache", e);
    }

    const localRaw = localStorage.getItem(
      `${VENDOR_ORDERS_STORAGE_KEY}${vendorId}`,
    );
    if (localRaw) {
      try {
        return JSON.parse(localRaw);
      } catch (err) {
        console.error("Error reading vendor orders cache", err);
      }
    }

    localStorage.setItem(
      `${VENDOR_ORDERS_STORAGE_KEY}${vendorId}`,
      JSON.stringify(SEED_VENDOR_ORDERS),
    );
    return SEED_VENDOR_ORDERS;
  },

  async getVendorOrderById(vendorId, orderId) {
    const orders = await this.getVendorOrders(vendorId);
    return orders.find((o) => o.id === orderId) || null;
  },

  /**
   * Executes authoritative state machine transition with validation.
   */
  async advanceOrderStatus(vendorId, orderId, nextStatus, notes = "") {
    const orders = await this.getVendorOrders(vendorId);
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      throw new Error(
        `Order ${orderId} not found or does not belong to vendor ${vendorId}.`,
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

    const updatedOrders = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: nextStatus,
          timeline: [...(o.timeline || []), newTimelineEntry],
          deliveredAt:
            nextStatus === VENDOR_ORDER_STATUS.DELIVERED
              ? timestamp
              : o.deliveredAt,
          updatedAt: timestamp,
        };
      }
      return o;
    });

    localStorage.setItem(
      `${VENDOR_ORDERS_STORAGE_KEY}${vendorId}`,
      JSON.stringify(updatedOrders),
    );

    try {
      await supabase
        .from("vendor_orders")
        .update({
          status: nextStatus,
          updated_at: timestamp,
        })
        .eq("id", orderId);
    } catch (e) {
      console.warn("Updated order status locally", e);
    }

    return updatedOrders.find((o) => o.id === orderId);
  },
};
