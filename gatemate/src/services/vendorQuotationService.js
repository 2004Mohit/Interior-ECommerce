/**
 * GateMate Vendor Quotation Management & Order Conversion Engine
 *
 * Quotation Lifecycle:
 * SUBMITTED -> UNDER_REVIEW -> (ACCEPTED / REJECTED / EXPIRED / WITHDRAWN) -> CONVERTED_TO_ORDER
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

export const vendorQuotationService = {
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
   * Fetches all quotations created by the authenticated vendor.
   */
  async getVendorQuotations() {
    const vendorId = await this._resolveVendorId();

    const { data, error } = await supabase
      .from("vendor_quotations")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Unable to load quotations: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Fetches a specific quotation by ID ensuring it belongs to the vendor.
   */
  async getQuotationById(quotationId) {
    const vendorId = await this._resolveVendorId();

    const { data, error } = await supabase
      .from("vendor_quotations")
      .select("*")
      .eq("id", quotationId)
      .eq("vendor_id", vendorId)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to load quotation: ${error.message}`);
    }

    return data || null;
  },

  /**
   * Withdraws a quotation before acceptance by customer.
   */
  async withdrawQuotation(quotationId, reason = "") {
    const quote = await this.getQuotationById(quotationId);
    if (!quote) throw new Error("Quotation not found.");

    if (quote.status === QUOTATION_STATUS.CONVERTED_TO_ORDER) {
      throw new Error(
        "Cannot withdraw a quotation that has already been converted to an active order.",
      );
    }

    const timestamp = new Date().toISOString();

    const { data, error } = await supabase
      .from("vendor_quotations")
      .update({
        status: QUOTATION_STATUS.WITHDRAWN,
        withdrawal_reason: reason || "Withdrawn by vendor depot",
        updated_at: timestamp,
      })
      .eq("id", quotationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to withdraw quotation: ${error.message}`);
    }

    return data;
  },

  /**
   * Converts an ACCEPTED quotation into an active Wholesale Order.
   */
  async convertAcceptedQuotationToOrder(quotationId) {
    const quote = await this.getQuotationById(quotationId);
    if (!quote) throw new Error("Quotation not found.");

    if (quote.status !== QUOTATION_STATUS.ACCEPTED) {
      throw new Error(
        `Only ACCEPTED quotations can be converted into orders. Current status: ${quote.status}.`,
      );
    }

    const timestamp = new Date().toISOString();
    const generatedOrderId = `GM-ORD-B2B-${Date.now().toString().slice(-6)}`;

    const { data, error } = await supabase
      .from("vendor_quotations")
      .update({
        status: QUOTATION_STATUS.CONVERTED_TO_ORDER,
        converted_order_id: generatedOrderId,
        updated_at: timestamp,
      })
      .eq("id", quotationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to convert quotation to order: ${error.message}`);
    }

    return {
      updatedQuotation: data,
      createdOrder: { id: generatedOrderId, ...quote },
    };
  },
};
