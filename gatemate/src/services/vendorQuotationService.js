/**
 * Ferrado Vendor Quotation Management & Wholesale Order Conversion
 *
 * Quotation Lifecycle:
 *
 * SUBMITTED
 *    ↓
 * UNDER_REVIEW
 *    ↓
 * ACCEPTED / REJECTED / EXPIRED / WITHDRAWN
 *    ↓
 * CONVERTED_TO_ORDER
 *
 * This service uses the actual Supabase
 * vendor_quotations and vendor_orders schema.
 *
 * Important:
 * - Customer quotation decisions use SECURITY DEFINER RPCs.
 * - Wholesale order conversion uses the
 *   SECURITY DEFINER RPC:
 *   convert_accepted_b2b_quotation_to_order
 */

import { supabase } from "../lib/supabaseClient";

/* -------------------------------------------------------------------------- */
/* Quotation Status                                                            */
/* -------------------------------------------------------------------------- */

export const QUOTATION_STATUS = {
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
  WITHDRAWN: "WITHDRAWN",
  CONVERTED_TO_ORDER: "CONVERTED_TO_ORDER",
};

/* -------------------------------------------------------------------------- */
/* Quotation Status UI Configuration                                           */
/* -------------------------------------------------------------------------- */

export const QUOTATION_STATUS_CONFIG = {
  [QUOTATION_STATUS.SUBMITTED]: {
    key: QUOTATION_STATUS.SUBMITTED,
    label: "Quotation Submitted",
    badgeClass:
      "bg-[#E4EEF3] text-[#173885] border border-[#9AAED4]/40 font-bold",
    description: "Quotation submitted by vendor and awaiting customer review.",
  },

  [QUOTATION_STATUS.UNDER_REVIEW]: {
    key: QUOTATION_STATUS.UNDER_REVIEW,
    label: "Under Customer Review",
    badgeClass:
      "bg-[#E3EBFA] text-[#2E4D94] border border-[#2E4D94]/30 font-bold",
    description: "Customer is reviewing the commercial quotation.",
  },

  [QUOTATION_STATUS.ACCEPTED]: {
    key: QUOTATION_STATUS.ACCEPTED,
    label: "Quotation Accepted",
    badgeClass:
      "bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30 font-black",
    description:
      "Customer accepted the quotation and it is ready for wholesale order conversion.",
  },

  [QUOTATION_STATUS.REJECTED]: {
    key: QUOTATION_STATUS.REJECTED,
    label: "Quotation Declined",
    badgeClass:
      "bg-[#FBE3DE] text-[#B43D20] border border-[#B43D20]/30 font-bold",
    description: "Customer declined this quotation.",
  },

  [QUOTATION_STATUS.EXPIRED]: {
    key: QUOTATION_STATUS.EXPIRED,
    label: "Validity Expired",
    badgeClass: "bg-[#F4F6FA] text-[#606460] border border-[#D9E2EA]",
    description: "The quotation validity period has elapsed.",
  },

  [QUOTATION_STATUS.WITHDRAWN]: {
    key: QUOTATION_STATUS.WITHDRAWN,
    label: "Withdrawn by Vendor",
    badgeClass: "bg-[#F4F6FA] text-[#606460] border border-[#D9E2EA]",
    description: "Vendor withdrew the quotation before customer acceptance.",
  },

  [QUOTATION_STATUS.CONVERTED_TO_ORDER]: {
    key: QUOTATION_STATUS.CONVERTED_TO_ORDER,
    label: "Converted to Wholesale Order",
    badgeClass:
      "bg-[#E1F2D9] text-[#173885] border border-[#173885]/40 font-black",
    description:
      "The accepted quotation has been converted into an active wholesale order.",
  },
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const normalizeItems = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item, index) => ({
    id:
      item?.id ||
      item?.productId ||
      item?.product_id ||
      `quotation-item-${index}`,

    productId: item?.productId || item?.product_id || null,

    productName:
      item?.productName || item?.product_name || item?.name || "Product",

    quantity: Number(
      item?.quantity ??
        item?.requestedQuantity ??
        item?.requested_quantity ??
        0,
    ),

    unit: item?.unit || item?.productUnit || item?.product_unit || "unit",

    sku: item?.sku || item?.productSku || item?.product_sku || null,

    unitRate: Number(
      item?.unitRate ?? item?.unit_price ?? item?.unitPrice ?? item?.rate ?? 0,
    ),

    total:
      Number(item?.total ?? item?.lineTotal ?? item?.line_total ?? 0) ||
      Number(
        item?.quantity ??
          item?.requestedQuantity ??
          item?.requested_quantity ??
          0,
      ) *
        Number(
          item?.unitRate ??
            item?.unit_price ??
            item?.unitPrice ??
            item?.rate ??
            0,
        ),
  }));
};

const normalizeQuotation = (quotation) => {
  if (!quotation) {
    return null;
  }

  const items = normalizeItems(quotation.items);

  return {
    ...quotation,

    projectName: quotation.project_name || quotation.projectName || "",

    buyerId: quotation.buyer_id || quotation.buyerId || null,

    buyerName: quotation.buyer_name || quotation.buyerName || "",

    buyerPhone: quotation.buyer_phone || quotation.buyerPhone || "",

    buyerGstin: quotation.buyer_gstin || quotation.buyerGstin || "",

    siteAddress: quotation.site_address || quotation.siteAddress || "",

    items,

    totalProductSubtotal: Number(
      quotation.total_product_subtotal ?? quotation.totalProductSubtotal ?? 0,
    ),

    deliveryCharge: Number(
      quotation.delivery_charge ?? quotation.deliveryCharge ?? 0,
    ),

    unloadingCharge: Number(
      quotation.unloading_charge ?? quotation.unloadingCharge ?? 0,
    ),

    grandTotal: Number(quotation.grand_total ?? quotation.grandTotal ?? 0),

    moqConditions: quotation.moq_conditions ?? quotation.moqConditions ?? "",

    estimatedDeliverySchedule:
      quotation.estimated_delivery_schedule ??
      quotation.estimatedDeliverySchedule ??
      "",

    validUntil: quotation.valid_until ?? quotation.validUntil ?? null,

    convertedOrderId:
      quotation.converted_order_id ?? quotation.convertedOrderId ?? null,
  };
};

const ensureQuotationId = (quotationId) => {
  if (!quotationId) {
    throw new Error("Quotation ID is required.");
  }

  return String(quotationId);
};

/* -------------------------------------------------------------------------- */
/* Service                                                                     */
/* -------------------------------------------------------------------------- */

export const vendorQuotationService = {
  /* ------------------------------------------------------------------------ */
  /* Vendor                                                                    */
  /* ------------------------------------------------------------------------ */

  /**
   * Resolve the authenticated vendor profile.
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
   * Fetch all quotations belonging to the authenticated vendor.
   */
  async getVendorQuotations() {
    const vendorId = await this._resolveVendorId();

    const { data, error } = await supabase
      .from("vendor_quotations")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw new Error(`Unable to load quotations: ${error.message}`);
    }

    return (data || []).map(normalizeQuotation);
  },

  /**
   * Fetch a single quotation belonging to the authenticated vendor.
   */
  async getQuotationById(quotationId) {
    const id = ensureQuotationId(quotationId);

    const vendorId = await this._resolveVendorId();

    const { data, error } = await supabase
      .from("vendor_quotations")
      .select("*")
      .eq("id", id)
      .eq("vendor_id", vendorId)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to load quotation: ${error.message}`);
    }

    return normalizeQuotation(data);
  },

  /**
   * Withdraw a quotation before customer acceptance.
   *
   * The current DB does not contain a withdrawal_reason column,
   * so only the quotation status is updated here.
   */
  async withdrawQuotation(quotationId) {
    const id = ensureQuotationId(quotationId);

    const quote = await this.getQuotationById(id);

    if (!quote) {
      throw new Error("Quotation not found.");
    }

    if (quote.status === QUOTATION_STATUS.CONVERTED_TO_ORDER) {
      throw new Error(
        "Cannot withdraw a quotation that has already been converted into an order.",
      );
    }

    if (
      quote.status === QUOTATION_STATUS.REJECTED ||
      quote.status === QUOTATION_STATUS.EXPIRED ||
      quote.status === QUOTATION_STATUS.WITHDRAWN
    ) {
      throw new Error(
        `Cannot withdraw a quotation with status ${quote.status}.`,
      );
    }

    if (quote.status === QUOTATION_STATUS.ACCEPTED) {
      throw new Error("Cannot withdraw a quotation after customer acceptance.");
    }

    const { data, error } = await supabase
      .from("vendor_quotations")
      .update({
        status: QUOTATION_STATUS.WITHDRAWN,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("vendor_id", quote.vendor_id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to withdraw quotation: ${error.message}`);
    }

    return normalizeQuotation(data);
  },

  /* ------------------------------------------------------------------------ */
  /* Customer                                                                  */
  /* ------------------------------------------------------------------------ */

  /**
   * Customer marks a quotation as UNDER_REVIEW.
   *
   * Uses SECURITY DEFINER RPC.
   */
  async markQuotationUnderReview(quotationId) {
    const id = ensureQuotationId(quotationId);

    const { data, error } = await supabase.rpc(
      "customer_review_b2b_quotation",
      {
        p_quotation_id: id,
      },
    );

    if (error) {
      throw new Error(
        `Failed to update quotation review status: ${error.message}`,
      );
    }

    return data;
  },

  /**
   * Customer accepts a quotation.
   *
   * Uses SECURITY DEFINER RPC.
   */
  async acceptQuotationByCustomer(quotationId) {
    const id = ensureQuotationId(quotationId);

    const { data, error } = await supabase.rpc(
      "customer_accept_b2b_quotation",
      {
        p_quotation_id: id,
      },
    );

    if (error) {
      throw new Error(`Failed to accept quotation: ${error.message}`);
    }

    return data;
  },

  /**
   * Customer rejects a quotation.
   *
   * Uses SECURITY DEFINER RPC.
   */
  async rejectQuotationByCustomer(quotationId) {
    const id = ensureQuotationId(quotationId);

    const { data, error } = await supabase.rpc(
      "customer_reject_b2b_quotation",
      {
        p_quotation_id: id,
      },
    );

    if (error) {
      throw new Error(`Failed to reject quotation: ${error.message}`);
    }

    return data;
  },

  /* ------------------------------------------------------------------------ */
  /* Wholesale Order Conversion                                                */
  /* ------------------------------------------------------------------------ */

  /**
   * Convert an ACCEPTED quotation into a real vendor_orders record.
   *
   * IMPORTANT:
   * The actual conversion is performed by the
   * SECURITY DEFINER RPC:
   *
   * convert_accepted_b2b_quotation_to_order
   *
   * This keeps order creation and quotation conversion
   * protected on the database side.
   *
   * The RPC creates:
   *
   * 1. vendor_orders row
   * 2. vendor_order_items rows
   * 3. vendor_order_timeline NEW entry
   * 4. quotation CONVERTED_TO_ORDER status
   * 5. quotation converted_order_id
   * 6. RFQ CONVERTED_TO_ORDER status
   * 7. RFQ converted_order_id
   * 8. RFQ accepted_quotation_id
   */
  async convertAcceptedQuotationToOrder(quotationId) {
    const id = ensureQuotationId(quotationId);

    const { data, error } = await supabase.rpc(
      "convert_accepted_b2b_quotation_to_order",
      {
        p_quotation_id: id,
      },
    );

    if (error) {
      throw new Error(
        `Failed to convert quotation into wholesale order: ${error.message}`,
      );
    }

    /*
     * The RPC returns JSONB similar to:
     *
     * {
     *   success: true,
     *   order_id: "...",
     *   item_count: 1,
     *   grand_total: 50000
     * }
     */

    if (!data) {
      throw new Error(
        "Quotation conversion completed but no conversion result was returned.",
      );
    }

    if (data.success === false) {
      throw new Error(
        data.message ||
          "The quotation could not be converted into a wholesale order.",
      );
    }

    return {
      success: data.success !== false,

      orderId: data.order_id || data.orderId || null,

      itemCount: Number(data.item_count ?? data.itemCount ?? 0),

      grandTotal: Number(data.grand_total ?? data.grandTotal ?? 0),

      alreadyConverted:
        data.already_converted ?? data.alreadyConverted ?? false,

      raw: data,
    };
  },
};

export default vendorQuotationService;
