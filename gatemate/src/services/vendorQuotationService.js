/**
 * GateMate Vendor Quotation Management & Order Conversion Engine
 *
 * Quotation Lifecycle:
 * SUBMITTED -> UNDER_REVIEW -> (ACCEPTED / REJECTED / EXPIRED / WITHDRAWN) -> CONVERTED_TO_ORDER
 *
 * Order Conversion Bridge:
 * RFQ -> Accepted Quotation -> Order -> Payment -> Fulfillment -> Delivery -> Completed
 */

import { supabase } from "../lib/supabaseClient";
import { vendorOrderService } from "./vendorOrderService";
import { VENDOR_ORDER_STATUS } from "./vendorOrderStateMachine";

export const QUOTATION_STATUS = {
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
  WITHDRAWN: "WITHDRAWN",
  CONVERTED_TO_ORDER: "CONVERTED_TO_ORDER",
};

export const QUOTATION_STATUS_CONFIG = {
  [QUOTATION_STATUS.SUBMITTED]: {
    key: QUOTATION_STATUS.SUBMITTED,
    label: "Quotation Submitted",
    badgeClass:
      "bg-[#E4EEF3] text-[#173885] border border-[#9AAED4]/40 font-bold",
    description: "Quotation submitted by depot. Awaiting customer review.",
  },
  [QUOTATION_STATUS.UNDER_REVIEW]: {
    key: QUOTATION_STATUS.UNDER_REVIEW,
    label: "Under Customer Review",
    badgeClass:
      "bg-[#E3EBFA] text-[#2E4D94] border border-[#2E4D94]/30 font-bold",
    description:
      "Customer is comparing commercial rates and delivery timelines.",
  },
  [QUOTATION_STATUS.ACCEPTED]: {
    key: QUOTATION_STATUS.ACCEPTED,
    label: "Quotation Accepted",
    badgeClass:
      "bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30 font-black",
    description:
      "Customer accepted the quotation! Ready for wholesale order conversion.",
  },
  [QUOTATION_STATUS.REJECTED]: {
    key: QUOTATION_STATUS.REJECTED,
    label: "Quotation Declined",
    badgeClass:
      "bg-[#FBE3DE] text-[#B43D20] border border-[#B43D20]/30 font-bold",
    description:
      "Customer chose an alternative bid or declined quotation terms.",
  },
  [QUOTATION_STATUS.EXPIRED]: {
    key: QUOTATION_STATUS.EXPIRED,
    label: "Validity Expired",
    badgeClass: "bg-[#F4F6FA] text-[#606460] border border-[#D9E2EA]",
    description: "Quotation validity period has elapsed.",
  },
  [QUOTATION_STATUS.WITHDRAWN]: {
    key: QUOTATION_STATUS.WITHDRAWN,
    label: "Withdrawn by Vendor",
    badgeClass: "bg-[#F4F6FA] text-[#606460] border border-[#D9E2EA]",
    description: "Vendor retracted the quotation before customer acceptance.",
  },
  [QUOTATION_STATUS.CONVERTED_TO_ORDER]: {
    key: QUOTATION_STATUS.CONVERTED_TO_ORDER,
    label: "Converted to Wholesale Order",
    badgeClass:
      "bg-[#E1F2D9] text-[#173885] border border-[#173885]/40 font-black",
    description:
      "Converted into an active wholesale order in the fulfillment queue.",
  },
};

const VENDOR_QUOTATIONS_STORAGE_KEY = "gatemate_vendor_quotations_list_";

const SEED_QUOTATIONS = [
  {
    id: "QT-PN-2026-0084",
    rfqId: "RFQ-PN-2026-0084",
    vendorId: "vnd-pune-001",
    projectName: "Hinjawadi Tech Park Phase 3 Boundary Masonry",
    buyerName: "Gera Megastructure Projects Ltd",
    buyerPhone: "+91 97654 32100",
    buyerGstin: "27AABCG8899A1Z1",
    status: QUOTATION_STATUS.SUBMITTED,
    createdAt: "2026-09-08T15:30:00Z",
    validUntil: "2026-09-15T18:00:00Z",
    moqConditions: "Minimum order requirement: 3,000 blocks per staged drop.",
    estimatedDeliverySchedule:
      "Staggered delivery across 2 business days starting Sep 16 via multi-axle trailer",
    siteAddress:
      "Plot 12, Phase 3 IT Park, Rajiv Gandhi Infotech Park, Hinjawadi, PCMC 411057",
    items: [
      {
        id: "rp-03",
        productName:
          "Siporex Lightweight Autoclaved Aerated Concrete AAC Block (600x200x150mm)",
        brand: "Siporex",
        category: "Bricks & Blocks",
        quantity: 3500,
        unit: "piece",
        unitPrice: 68.5,
        totalItemPrice: 239750,
      },
    ],
    deliveryCharge: 4500,
    unloadingCharge: 0,
    taxes: {
      gstRate: 18,
      gstAmount: 43965,
    },
    totalProductSubtotal: 239750,
    grandTotal: 288215,
    notes:
      "Direct plant dispatch from Siporex yard. Transit insurance and factory test certificates included.",
    convertedOrderId: null,
  },
  {
    id: "QT-PN-2026-0062",
    rfqId: "RFQ-PN-2026-0062",
    vendorId: "vnd-pune-001",
    projectName: "Kharadi Residential High-Rise Podium Slabs",
    buyerName: "Kolte Infrastructure EPC",
    buyerPhone: "+91 98900 11223",
    buyerGstin: "27AABCK9911D1Z4",
    status: QUOTATION_STATUS.ACCEPTED,
    createdAt: "2026-09-01T14:00:00Z",
    validUntil: "2026-09-08T18:00:00Z",
    moqConditions: "400 bags per scheduled batch delivery.",
    estimatedDeliverySchedule:
      "400 bags staged every 72 hours per site engineer schedule",
    siteAddress: "Riverside Tower 4, Kharadi EON Free Zone Road, Pune 411014",
    items: [
      {
        id: "rp-04",
        productName: "UltraTech Super Weather-Shield PPC Cement (50 kg Bag)",
        brand: "UltraTech",
        category: "Cement",
        quantity: 1200,
        unit: "bag",
        unitPrice: 360,
        totalItemPrice: 432000,
      },
    ],
    deliveryCharge: 6000,
    unloadingCharge: 2400,
    taxes: {
      gstRate: 28,
      gstAmount: 123312,
    },
    totalProductSubtotal: 432000,
    grandTotal: 563712,
    notes:
      "Direct factory rake point loading. Quality test certificates dispatched per lot.",
    convertedOrderId: null,
  },
  {
    id: "QT-PN-2026-0033",
    rfqId: "RFQ-PN-2026-0033",
    vendorId: "vnd-pune-001",
    projectName: "Baner Commercial Tower Foundation",
    buyerName: "VTP Realty Infrastructure Desk",
    buyerPhone: "+91 98220 99887",
    buyerGstin: "27AABCV8811K1Z3",
    status: QUOTATION_STATUS.CONVERTED_TO_ORDER,
    createdAt: "2026-08-20T10:00:00Z",
    validUntil: "2026-08-27T18:00:00Z",
    moqConditions: "20 tons full truckload dispatch.",
    estimatedDeliverySchedule: "Single consignment flatbed delivery on Aug 28",
    siteAddress: "Survey No 18, Baner-Pashan Link Road, Pune 411045",
    items: [
      {
        id: "rp-05",
        productName:
          "Tata Tiscon 550D High Ductility Earthquake Resistant TMT Rebar (16mm)",
        brand: "Tata Tiscon",
        category: "Steel & TMT",
        quantity: 20,
        unit: "ton",
        unitPrice: 58500,
        totalItemPrice: 1170000,
      },
    ],
    deliveryCharge: 8500,
    unloadingCharge: 0,
    taxes: {
      gstRate: 18,
      gstAmount: 212130,
    },
    totalProductSubtotal: 1170000,
    grandTotal: 1390630,
    notes: "Direct primary mill test certificate lot #550D-PN-882.",
    convertedOrderId: "GM-ORD-20260824-0011",
  },
];

export const vendorQuotationService = {
  /**
   * Fetches all quotations created by the authenticated vendor.
   */
  async getVendorQuotations(vendorId = "vnd-pune-001") {
    await new Promise((resolve) => setTimeout(resolve, 80));

    try {
      const { data, error } = await supabase
        .from("vendor_quotations")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false });

      if (data && !error && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn("Supabase query fallback for vendor quotations", e);
    }

    const localRaw = localStorage.getItem(
      `${VENDOR_QUOTATIONS_STORAGE_KEY}${vendorId}`,
    );
    if (localRaw) {
      try {
        return JSON.parse(localRaw);
      } catch (err) {
        console.error("Error reading quotations cache", err);
      }
    }

    localStorage.setItem(
      `${VENDOR_QUOTATIONS_STORAGE_KEY}${vendorId}`,
      JSON.stringify(SEED_QUOTATIONS),
    );
    return SEED_QUOTATIONS;
  },

  /**
   * Fetches a specific quotation by ID ensuring it belongs to the vendor.
   */
  async getQuotationById(vendorId, quotationId) {
    const list = await this.getVendorQuotations(vendorId);
    return list.find((q) => q.id === quotationId) || null;
  },

  /**
   * Withdraws a quotation before acceptance by customer.
   */
  async withdrawQuotation(vendorId, quotationId, reason = "") {
    const list = await this.getVendorQuotations(vendorId);
    const quote = list.find((q) => q.id === quotationId);
    if (!quote) throw new Error("Quotation not found.");

    if (quote.status === QUOTATION_STATUS.CONVERTED_TO_ORDER) {
      throw new Error(
        "Cannot withdraw a quotation that has already been converted to an active order.",
      );
    }

    const timestamp = new Date().toISOString();
    const updatedList = list.map((q) => {
      if (q.id === quotationId) {
        return {
          ...q,
          status: QUOTATION_STATUS.WITHDRAWN,
          withdrawalReason: reason || "Withdrawn by vendor depot",
          updatedAt: timestamp,
        };
      }
      return q;
    });

    localStorage.setItem(
      `${VENDOR_QUOTATIONS_STORAGE_KEY}${vendorId}`,
      JSON.stringify(updatedList),
    );

    try {
      await supabase
        .from("vendor_quotations")
        .update({
          status: QUOTATION_STATUS.WITHDRAWN,
          updated_at: timestamp,
        })
        .eq("id", quotationId);
    } catch (e) {
      console.warn("Persisted quotation withdrawal locally", e);
    }

    return updatedList.find((q) => q.id === quotationId);
  },

  /**
   * Converts an ACCEPTED quotation into an active Wholesale Order in the vendorOrderService pipeline.
   * Note: This does NOT impose the 30-minute retail SLA; it uses the scheduled/planned delivery terms.
   */
  async convertAcceptedQuotationToOrder(vendorId, quotationId) {
    const list = await this.getVendorQuotations(vendorId);
    const quote = list.find((q) => q.id === quotationId);
    if (!quote) throw new Error("Quotation not found.");

    if (quote.status !== QUOTATION_STATUS.ACCEPTED) {
      throw new Error(
        `Only ACCEPTED quotations can be converted into orders. Current status: ${quote.status}.`,
      );
    }

    const timestamp = new Date().toISOString();
    const generatedOrderId = `GM-ORD-B2B-${Date.now().toString().slice(-6)}`;

    // Build standard Order object compatible with the existing vendorOrderService model
    const convertedOrder = {
      id: generatedOrderId,
      vendorId: quote.vendorId,
      customerRef: quote.buyerGstin
        ? `${quote.buyerName} (GST: ${quote.buyerGstin})`
        : quote.buyerName,
      customerName: quote.buyerName,
      customerPhone: quote.buyerPhone,
      orderType: "WHOLESALE_B2B_ORDER",
      isExpress30Min: false, // Wholesale RFQ orders NEVER forced into 30-min SLA
      status: VENDOR_ORDER_STATUS.ACCEPTED,
      paymentStatus: "PENDING",
      paymentMethod: "B2B Commercial Invoice / RTGS Milestone",
      createdAt: timestamp,
      estimatedDeliverySchedule: quote.estimatedDeliverySchedule,
      deliveryAddress: {
        fullName: quote.buyerName,
        phone: quote.buyerPhone,
        line1: quote.siteAddress,
        locality: "Project Construction Site",
        city: "Pune",
        pincode: "411001",
        notes: `Converted from Quotation ${quote.id}. ${quote.moqConditions || ""}`,
      },
      items: quote.items.map((it) => ({
        id: it.id,
        name: it.productName,
        brand: it.brand || "Primary Certified",
        category: it.category || "Bulk Supply",
        unit: it.unit,
        sku: `B2B-${it.id}`,
        price: it.unitPrice,
        quantity: it.quantity,
        subtotal: it.totalItemPrice,
        img: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80",
      })),
      totals: {
        itemSubtotal: quote.totalProductSubtotal,
        deliveryFee: quote.deliveryCharge || 0,
        packagingFee: quote.unloadingCharge || 0,
        codConvenienceFee: 0,
        taxAmount: quote.taxes?.gstAmount || 0,
        grandTotal: quote.grandTotal,
      },
      timeline: [
        {
          status: VENDOR_ORDER_STATUS.NEW,
          label: `RFQ Quotation ${quote.id} Accepted by Customer`,
          timestamp,
        },
        {
          status: VENDOR_ORDER_STATUS.ACCEPTED,
          label: "Converted to Wholesale Purchase Order",
          timestamp,
          notes: `Schedule: ${quote.estimatedDeliverySchedule}`,
        },
      ],
    };

    // Insert order into standard vendor orders queue
    const existingOrders = await vendorOrderService.getVendorOrders(vendorId);
    localStorage.setItem(
      `gatemate_vendor_normal_orders_${vendorId}`,
      JSON.stringify([convertedOrder, ...existingOrders]),
    );

    // Update quotation status to CONVERTED_TO_ORDER
    const updatedQuotes = list.map((q) => {
      if (q.id === quotationId) {
        return {
          ...q,
          status: QUOTATION_STATUS.CONVERTED_TO_ORDER,
          convertedOrderId: generatedOrderId,
          updatedAt: timestamp,
        };
      }
      return q;
    });

    localStorage.setItem(
      `${VENDOR_QUOTATIONS_STORAGE_KEY}${vendorId}`,
      JSON.stringify(updatedQuotes),
    );

    try {
      await supabase
        .from("vendor_quotations")
        .update({
          status: QUOTATION_STATUS.CONVERTED_TO_ORDER,
          converted_order_id: generatedOrderId,
          updated_at: timestamp,
        })
        .eq("id", quotationId);
    } catch (e) {
      console.warn("Persisted order conversion locally", e);
    }

    return {
      updatedQuotation: updatedQuotes.find((q) => q.id === quotationId),
      createdOrder: convertedOrder,
    };
  },
};
