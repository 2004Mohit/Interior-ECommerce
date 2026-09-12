/**
 * GateMate Vendor Bulk Orders & RFQ (Request for Quotation) Management Service
 *
 * Supported RFQ Lifecycle:
 * - NEW: Incoming bulk buyer BOQ request awaiting vendor review
 * - RESPONDED / QUOTATION_SENT: Vendor submitted formal quote
 * - NEGOTIATION: Clarifications on freight, staged delivery, or rate adjustments
 * - ACCEPTED: Buyer accepted quotation and terms
 * - REJECTED: Buyer or vendor declined
 * - EXPIRED: Quote validity window lapsed
 * - CONVERTED_TO_ORDER: Finalized into wholesale project purchase order
 * - COMPLETED: Dispatched, delivered, and reconciled
 */

import { supabase } from "../lib/supabaseClient";

export const RFQ_STATUS = {
  NEW: "NEW",
  RESPONDED: "RESPONDED",
  QUOTATION_SENT: "QUOTATION_SENT",
  NEGOTIATION: "NEGOTIATION",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
  CONVERTED_TO_ORDER: "CONVERTED_TO_ORDER",
  COMPLETED: "COMPLETED",
};

export const RFQ_STATUS_CONFIG = {
  [RFQ_STATUS.NEW]: {
    key: RFQ_STATUS.NEW,
    label: "New RFQ",
    badgeClass:
      "bg-[#E4EEF3] text-[#173885] border border-[#9AAED4]/40 font-black",
    description: "New bulk request awaiting your commercial quote bid.",
  },
  [RFQ_STATUS.RESPONDED]: {
    key: RFQ_STATUS.RESPONDED,
    label: "Responded",
    badgeClass:
      "bg-[#E3EBFA] text-[#2E4D94] border border-[#2E4D94]/30 font-bold",
    description: "Preliminary response or clarification sent.",
  },
  [RFQ_STATUS.QUOTATION_SENT]: {
    key: RFQ_STATUS.QUOTATION_SENT,
    label: "Quotation Sent",
    badgeClass:
      "bg-[#E3EBFA] text-[#173885] border border-[#3C7DDA]/40 font-bold",
    description:
      "Formal commercial quotation submitted. Awaiting buyer review.",
  },
  [RFQ_STATUS.NEGOTIATION]: {
    key: RFQ_STATUS.NEGOTIATION,
    label: "Negotiation / Clarification",
    badgeClass:
      "bg-[#FFF0D5] text-[#A66A08] border border-[#A66A08]/30 font-bold",
    description: "Buyer requested quantity or staging adjustment.",
  },
  [RFQ_STATUS.ACCEPTED]: {
    key: RFQ_STATUS.ACCEPTED,
    label: "Quotation Accepted",
    badgeClass:
      "bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30 font-bold",
    description:
      "Buyer accepted quotation. Ready for project order conversion.",
  },
  [RFQ_STATUS.REJECTED]: {
    key: RFQ_STATUS.REJECTED,
    label: "Rejected / Declined",
    badgeClass:
      "bg-[#FBE3DE] text-[#B43D20] border border-[#B43D20]/30 font-bold",
    description: "Quotation was declined or unfulfilled.",
  },
  [RFQ_STATUS.EXPIRED]: {
    key: RFQ_STATUS.EXPIRED,
    label: "Expired",
    badgeClass: "bg-[#F4F6FA] text-[#606460] border border-[#D9E2EA]",
    description: "Quotation validity period expired.",
  },
  [RFQ_STATUS.CONVERTED_TO_ORDER]: {
    key: RFQ_STATUS.CONVERTED_TO_ORDER,
    label: "Converted to Order",
    badgeClass:
      "bg-[#E1F2D9] text-[#173885] border border-[#173885]/30 font-bold",
    description: "Converted into active commercial wholesale order.",
  },
  [RFQ_STATUS.COMPLETED]: {
    key: RFQ_STATUS.COMPLETED,
    label: "Completed & Delivered",
    badgeClass:
      "bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30 font-bold",
    description: "All project consignments delivered to site.",
  },
};

const VENDOR_RFQS_STORAGE_KEY = "gatemate_vendor_rfq_records_";

const SEED_VENDOR_RFQS = [
  {
    id: "RFQ-PN-2026-0091",
    vendorId: "vnd-pune-001",
    projectName: "Balewadi High Street Commercial Tower (Phase 2)",
    buyerName: "Kapadia Structural Engineering Consultants",
    buyerPhone: "+91 98230 55441",
    buyerGstin: "27AABCK1234F1Z9",
    status: RFQ_STATUS.NEW,
    createdAt: "2026-09-11T10:30:00Z",
    expiryDate: "2026-09-18T18:00:00Z",
    requestedDeliverySchedule: {
      startDate: "2026-09-22",
      stagedDelivery: true,
      trailerAccessConfirmed: true,
      siteAddress: "Survey No. 44/2, Balewadi High Street, Near Orchid Hotel",
      locality: "Balewadi",
      city: "Pune",
      pincode: "411045",
    },
    requestedProducts: [
      {
        id: "rp-01",
        name: "Tata Tiscon 550D High Ductility Earthquake Resistant TMT Rebar (16mm)",
        category: "Steel & TMT",
        brand: "Tata Tiscon",
        quantity: 25,
        unit: "ton",
        specifications:
          "Fe 550D Primary Virgin Billet, IS:1786 Certified with test certificates",
        buyerNotes: "Full truckload flatbed offloading required.",
      },
      {
        id: "rp-02",
        name: "Tata Tiscon 550D High Ductility Earthquake Resistant TMT Rebar (12mm)",
        category: "Steel & TMT",
        brand: "Tata Tiscon",
        quantity: 15,
        unit: "ton",
        specifications:
          "Fe 550D Primary Virgin Billet, 12m standard bar length",
        buyerNotes: "Staggered drops: 8 tons on Day 1, 7 tons on Day 5.",
      },
    ],
    buyerProjectNotes:
      "Payment via 100% advance RTGS upon mill certificate verification. Need delivery by multi-axle trailer.",
    quotation: null,
    history: [
      {
        status: RFQ_STATUS.NEW,
        label: "RFQ Received from Contractor",
        timestamp: "2026-09-11T10:30:00Z",
        notes: "40 tons bulk rebar request.",
      },
    ],
  },
  {
    id: "RFQ-PN-2026-0084",
    vendorId: "vnd-pune-001",
    projectName: "Hinjawadi Tech Park Phase 3 Boundary Masonry",
    buyerName: "Gera Megastructure Projects Ltd",
    buyerPhone: "+91 97654 32100",
    buyerGstin: "27AABCG8899A1Z1",
    status: RFQ_STATUS.QUOTATION_SENT,
    createdAt: "2026-09-08T11:00:00Z",
    expiryDate: "2026-09-15T18:00:00Z",
    requestedDeliverySchedule: {
      startDate: "2026-09-16",
      stagedDelivery: true,
      trailerAccessConfirmed: true,
      siteAddress: "Plot 12, Phase 3 IT Park, Rajiv Gandhi Infotech Park",
      locality: "Hinjawadi",
      city: "Pimpri-Chinchwad",
      pincode: "411057",
    },
    requestedProducts: [
      {
        id: "rp-03",
        name: "Siporex Lightweight Autoclaved Aerated Concrete AAC Block (600x200x150mm)",
        category: "Bricks & Blocks",
        brand: "Siporex",
        quantity: 3500,
        unit: "piece",
        specifications: "600x200x150mm (6-inch), dry density 550-650 kg/m³",
        buyerNotes: "Palletized packing required to minimize transit breakage.",
      },
    ],
    buyerProjectNotes: "Require 2-day delivery window with batch test reports.",
    quotation: {
      quotedAt: "2026-09-08T15:30:00Z",
      validUntil: "2026-09-15T18:00:00Z",
      quoteReference: "QT-PN-VND-084",
      itemQuotes: [
        {
          productId: "rp-03",
          unitRate: 68.5, // Discounted volume rate
          quantity: 3500,
          unit: "piece",
          subtotal: 239750,
        },
      ],
      freightCharges: 4500,
      unloadingCharges: 0,
      taxBreakdown: {
        gstRate: 18,
        gstAmount: 43965,
      },
      estimatedGrandTotal: 288215,
      promisedTurnaroundDays:
        "Staggered delivery across 2 business days starting Sep 16",
      vendorRemarks:
        "Direct plant dispatch from Siporex yard. Transit insurance and factory mill certificates included.",
    },
    history: [
      {
        status: RFQ_STATUS.NEW,
        label: "RFQ Received",
        timestamp: "2026-09-08T11:00:00Z",
      },
      {
        status: RFQ_STATUS.QUOTATION_SENT,
        label: "Quotation Submitted to Developer",
        timestamp: "2026-09-08T15:30:00Z",
        notes: "Rate: ₹68.50/piece + freight.",
      },
    ],
  },
  {
    id: "RFQ-PN-2026-0062",
    vendorId: "vnd-pune-001",
    projectName: "Kharadi Residential High-Rise Podium Slabs",
    buyerName: "Kolte Infrastructure EPC",
    buyerPhone: "+91 98900 11223",
    buyerGstin: "27AABCK9911D1Z4",
    status: RFQ_STATUS.CONVERTED_TO_ORDER,
    createdAt: "2026-09-01T09:00:00Z",
    expiryDate: "2026-09-10T18:00:00Z",
    requestedDeliverySchedule: {
      startDate: "2026-09-05",
      stagedDelivery: true,
      trailerAccessConfirmed: true,
      siteAddress: "Riverside Tower 4, Kharadi EON Free Zone Road",
      locality: "Kharadi",
      city: "Pune",
      pincode: "411014",
    },
    requestedProducts: [
      {
        id: "rp-04",
        name: "UltraTech Super Weather-Shield PPC Cement (50 kg Bag)",
        category: "Cement",
        brand: "UltraTech",
        quantity: 1200,
        unit: "bag",
        specifications: "IS 1489 Part 1 Certified, tamper-proof packaging",
        buyerNotes: "400 bags per batch every 3 days.",
      },
    ],
    buyerProjectNotes: "E-Way bill generation required on contractor GSTIN.",
    quotation: {
      quotedAt: "2026-09-01T14:00:00Z",
      validUntil: "2026-09-08T18:00:00Z",
      quoteReference: "QT-PN-VND-062",
      itemQuotes: [
        {
          productId: "rp-04",
          unitRate: 360,
          quantity: 1200,
          unit: "bag",
          subtotal: 432000,
        },
      ],
      freightCharges: 6000,
      unloadingCharges: 2400,
      taxBreakdown: {
        gstRate: 28,
        gstAmount: 123312,
      },
      estimatedGrandTotal: 563712,
      promisedTurnaroundDays:
        "400 bags staged every 72 hours per site engineer schedule",
      vendorRemarks:
        "Direct factory rake point loading. Quality test certificates dispatched per lot.",
    },
    history: [
      {
        status: RFQ_STATUS.NEW,
        label: "RFQ Received",
        timestamp: "2026-09-01T09:00:00Z",
      },
      {
        status: RFQ_STATUS.QUOTATION_SENT,
        label: "Quotation Submitted",
        timestamp: "2026-09-01T14:00:00Z",
      },
      {
        status: RFQ_STATUS.ACCEPTED,
        label: "Quotation Accepted by Buyer",
        timestamp: "2026-09-03T11:00:00Z",
      },
      {
        status: RFQ_STATUS.CONVERTED_TO_ORDER,
        label: "Converted to Commercial Purchase Order PO-KLT-902",
        timestamp: "2026-09-04T10:00:00Z",
      },
    ],
  },
];

export const vendorRfqService = {
  /**
   * Fetches only RFQs assigned / broadcast to the authenticated vendor.
   */
  async getVendorRfqs(vendorId = "vnd-pune-001") {
    await new Promise((resolve) => setTimeout(resolve, 80));

    try {
      const { data, error } = await supabase
        .from("vendor_rfqs")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false });

      if (data && !error && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn("Supabase query fallback for vendor RFQs", e);
    }

    const localRaw = localStorage.getItem(
      `${VENDOR_RFQS_STORAGE_KEY}${vendorId}`,
    );
    if (localRaw) {
      try {
        return JSON.parse(localRaw);
      } catch (err) {
        console.error("Error reading vendor RFQ cache", err);
      }
    }

    localStorage.setItem(
      `${VENDOR_RFQS_STORAGE_KEY}${vendorId}`,
      JSON.stringify(SEED_VENDOR_RFQS),
    );
    return SEED_VENDOR_RFQS;
  },

  /**
   * Fetches a specific RFQ ensuring it belongs to the vendor.
   */
  async getRfqById(vendorId, rfqId) {
    const rfqs = await this.getVendorRfqs(vendorId);
    return rfqs.find((r) => r.id === rfqId) || null;
  },

  /**
   * Submits or modifies a commercial quotation for an RFQ.
   */
  async submitOrUpdateQuotation({
    vendorId = "vnd-pune-001",
    rfqId,
    itemQuotes, // [{ productId, unitRate }]
    freightCharges = 0,
    unloadingCharges = 0,
    promisedTurnaroundDays,
    validityDays = 7,
    vendorRemarks = "",
  }) {
    const rfqs = await this.getVendorRfqs(vendorId);
    const rfq = rfqs.find((r) => r.id === rfqId);
    if (!rfq) throw new Error("RFQ not found or access restricted.");

    if (
      rfq.status === RFQ_STATUS.CONVERTED_TO_ORDER ||
      rfq.status === RFQ_STATUS.COMPLETED
    ) {
      throw new Error(
        "Cannot modify a quotation that has already been converted or completed.",
      );
    }

    // Calculate subtotal & GST estimate
    let subtotal = 0;
    const computedItemQuotes = rfq.requestedProducts.map((prod) => {
      const matchingQuote = itemQuotes.find((q) => q.productId === prod.id) || {
        unitRate: 0,
      };
      const rate = Math.max(0, Number(matchingQuote.unitRate) || 0);
      const lineSubtotal = rate * prod.quantity;
      subtotal += lineSubtotal;

      return {
        productId: prod.id,
        name: prod.name,
        unitRate: rate,
        quantity: prod.quantity,
        unit: prod.unit,
        subtotal: lineSubtotal,
      };
    });

    const freight = Math.max(0, Number(freightCharges) || 0);
    const unloading = Math.max(0, Number(unloadingCharges) || 0);
    const taxableTotal = subtotal + freight + unloading;
    const gstRate = 18; // Standard construction supply GST estimate
    const gstAmount = Math.round(taxableTotal * (gstRate / 100) * 100) / 100;
    const estimatedGrandTotal =
      Math.round((taxableTotal + gstAmount) * 100) / 100;

    const timestamp = new Date().toISOString();
    const validUntilDate = new Date(
      Date.now() + validityDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    const quotationData = {
      quotedAt: timestamp,
      validUntil: validUntilDate,
      quoteReference: `QT-${rfq.id.replace("RFQ-", "")}-${Math.floor(100 + Math.random() * 900)}`,
      itemQuotes: computedItemQuotes,
      freightCharges: freight,
      unloadingCharges: unloading,
      taxBreakdown: {
        gstRate,
        gstAmount,
      },
      estimatedGrandTotal,
      promisedTurnaroundDays:
        promisedTurnaroundDays || "Staged delivery per site schedule",
      vendorRemarks,
    };

    const isUpdate = Boolean(rfq.quotation);
    const newStatus =
      isUpdate && rfq.status === RFQ_STATUS.NEGOTIATION
        ? RFQ_STATUS.QUOTATION_SENT
        : RFQ_STATUS.QUOTATION_SENT;

    const timelineEntry = {
      status: newStatus,
      label: isUpdate
        ? "Quotation Revised by Vendor"
        : "Formal Quotation Submitted",
      timestamp,
      notes: `Total: ₹${estimatedGrandTotal.toLocaleString("en-IN")} (Freight: ₹${freight}).`,
    };

    const updatedRfqs = rfqs.map((r) => {
      if (r.id === rfqId) {
        return {
          ...r,
          status: newStatus,
          quotation: quotationData,
          history: [...(r.history || []), timelineEntry],
          updatedAt: timestamp,
        };
      }
      return r;
    });

    localStorage.setItem(
      `${VENDOR_RFQS_STORAGE_KEY}${vendorId}`,
      JSON.stringify(updatedRfqs),
    );

    try {
      await supabase
        .from("vendor_rfqs")
        .update({
          status: newStatus,
          quotation: quotationData,
          updated_at: timestamp,
        })
        .eq("id", rfqId);
    } catch (e) {
      console.warn("Persisted RFQ quote locally", e);
    }

    return updatedRfqs.find((r) => r.id === rfqId);
  },

  /**
   * Withdraws a previously submitted quotation before acceptance.
   */
  async withdrawQuotation(vendorId, rfqId, reason = "") {
    const rfqs = await this.getVendorRfqs(vendorId);
    const rfq = rfqs.find((r) => r.id === rfqId);
    if (!rfq) throw new Error("RFQ not found.");

    if (
      rfq.status === RFQ_STATUS.CONVERTED_TO_ORDER ||
      rfq.status === RFQ_STATUS.COMPLETED
    ) {
      throw new Error("Cannot withdraw a quotation after conversion to order.");
    }

    const timestamp = new Date().toISOString();
    const updatedRfqs = rfqs.map((r) => {
      if (r.id === rfqId) {
        return {
          ...r,
          status: RFQ_STATUS.REJECTED,
          quotation: null,
          history: [
            ...(r.history || []),
            {
              status: RFQ_STATUS.REJECTED,
              label: "Quotation Withdrawn by Vendor",
              timestamp,
              notes: reason || "Vendor withdrew active bid.",
            },
          ],
          updatedAt: timestamp,
        };
      }
      return r;
    });

    localStorage.setItem(
      `${VENDOR_RFQS_STORAGE_KEY}${vendorId}`,
      JSON.stringify(updatedRfqs),
    );
    return updatedRfqs.find((r) => r.id === rfqId);
  },
};
