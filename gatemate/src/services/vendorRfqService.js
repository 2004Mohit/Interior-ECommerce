/**
 * GateMate Vendor Bulk Orders & RFQ Management Service
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

export const vendorRfqService = {
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
   * Fetches only RFQs assigned / broadcast to the authenticated vendor.
   */
  async getVendorRfqs() {
    const vendorId = await this._resolveVendorId();

    const { data, error } = await supabase
      .from("vendor_rfqs")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Unable to load project RFQs: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Fetches a specific RFQ ensuring it belongs to the vendor.
   */
  async getRfqById(rfqId) {
    const vendorId = await this._resolveVendorId();

    const { data, error } = await supabase
      .from("vendor_rfqs")
      .select("*")
      .eq("id", rfqId)
      .eq("vendor_id", vendorId)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to load RFQ record: ${error.message}`);
    }

    return data || null;
  },

  /**
   * Submits or modifies a commercial quotation for an RFQ.
   */
  async submitOrUpdateQuotation({
    rfqId,
    itemQuotes,
    freightCharges = 0,
    unloadingCharges = 0,
    promisedTurnaroundDays,
    validityDays = 7,
    vendorRemarks = "",
  }) {
    const rfq = await this.getRfqById(rfqId);
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
    const gstRate = 18;
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
    const newStatus = RFQ_STATUS.QUOTATION_SENT;

    const timelineEntry = {
      status: newStatus,
      label: isUpdate
        ? "Quotation Revised by Vendor"
        : "Formal Quotation Submitted",
      timestamp,
      notes: `Total: ₹${estimatedGrandTotal.toLocaleString("en-IN")} (Freight: ₹${freight}).`,
    };

    const updatedTimeline = [...(rfq.history || []), timelineEntry];

    const { data, error } = await supabase
      .from("vendor_rfqs")
      .update({
        status: newStatus,
        quotation: quotationData,
        history: updatedTimeline,
        updated_at: timestamp,
      })
      .eq("id", rfqId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to submit quotation: ${error.message}`);
    }

    return data;
  },

  /**
   * Withdraws a previously submitted quotation before acceptance.
   */
  async withdrawQuotation(rfqId, reason = "") {
    const rfq = await this.getRfqById(rfqId);
    if (!rfq) throw new Error("RFQ not found.");

    if (
      rfq.status === RFQ_STATUS.CONVERTED_TO_ORDER ||
      rfq.status === RFQ_STATUS.COMPLETED
    ) {
      throw new Error("Cannot withdraw a quotation after conversion to order.");
    }

    const timestamp = new Date().toISOString();
    const timelineEntry = {
      status: RFQ_STATUS.REJECTED,
      label: "Quotation Withdrawn by Vendor",
      timestamp,
      notes: reason || "Vendor withdrew active bid.",
    };

    const updatedTimeline = [...(rfq.history || []), timelineEntry];

    const { data, error } = await supabase
      .from("vendor_rfqs")
      .update({
        status: RFQ_STATUS.REJECTED,
        quotation: null,
        history: updatedTimeline,
        updated_at: timestamp,
      })
      .eq("id", rfqId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to withdraw quotation: ${error.message}`);
    }

    return data;
  },
};
