/**
 * GateMate Vendor RFQ Management Service
 *
 * Uses the actual Supabase schema:
 * - vendor_rfqs
 * - vendor_quotations
 * - vendor_profiles
 *
 * RFQ and quotation are stored as separate records.
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
    description: "New bulk request awaiting your commercial quote.",
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
    description: "Buyer requested quantity or commercial adjustment.",
  },

  [RFQ_STATUS.ACCEPTED]: {
    key: RFQ_STATUS.ACCEPTED,
    label: "Quotation Accepted",
    badgeClass:
      "bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30 font-bold",
    description: "Buyer accepted the quotation. Ready for order conversion.",
  },

  [RFQ_STATUS.REJECTED]: {
    key: RFQ_STATUS.REJECTED,
    label: "Rejected / Declined",
    badgeClass:
      "bg-[#FBE3DE] text-[#B43D20] border border-[#B43D20]/30 font-bold",
    description: "RFQ or quotation was declined.",
  },

  [RFQ_STATUS.EXPIRED]: {
    key: RFQ_STATUS.EXPIRED,
    label: "Expired",
    badgeClass: "bg-[#F4F6FA] text-[#606460] border border-[#D9E2EA] font-bold",
    description: "Quotation validity period expired.",
  },

  [RFQ_STATUS.CONVERTED_TO_ORDER]: {
    key: RFQ_STATUS.CONVERTED_TO_ORDER,
    label: "Converted to Order",
    badgeClass:
      "bg-[#E1F2D9] text-[#173885] border border-[#173885]/30 font-bold",
    description: "Converted into a wholesale B2B order.",
  },

  [RFQ_STATUS.COMPLETED]: {
    key: RFQ_STATUS.COMPLETED,
    label: "Completed & Delivered",
    badgeClass:
      "bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30 font-bold",
    description: "All project consignments have been delivered.",
  },
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const toNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};

const normalizeSiteAddress = (siteAddress) => {
  if (!siteAddress) {
    return {
      address: "",
      locality: "",
      city: "",
      pincode: "",
      state: "",
      landmark: "",
    };
  }

  if (typeof siteAddress === "string") {
    try {
      const parsed = JSON.parse(siteAddress);

      if (parsed && typeof parsed === "object") {
        return {
          address: parsed.address || "",
          locality: parsed.locality || "",
          city: parsed.city || "",
          pincode: parsed.pincode || "",
          state: parsed.state || "",
          landmark: parsed.landmark || "",
          ...parsed,
        };
      }
    } catch {
      return {
        address: siteAddress,
        locality: "",
        city: "",
        pincode: "",
        state: "",
        landmark: "",
      };
    }
  }

  if (typeof siteAddress === "object") {
    return {
      address: siteAddress.address || "",
      locality: siteAddress.locality || "",
      city: siteAddress.city || "",
      pincode: siteAddress.pincode || "",
      state: siteAddress.state || "",
      landmark: siteAddress.landmark || "",
      ...siteAddress,
    };
  }

  return {
    address: "",
    locality: "",
    city: "",
    pincode: "",
    state: "",
    landmark: "",
  };
};

const normalizeRequestedProducts = (products) => {
  if (!Array.isArray(products)) {
    return [];
  }

  return products.map((product, index) => ({
    id:
      product?.id ||
      product?.product_id ||
      product?.productId ||
      `rfq-product-${index}`,

    productId: product?.productId || product?.product_id || product?.id || null,

    name:
      product?.name ||
      product?.product_name ||
      product?.productName ||
      "Product",

    quantity: toNumber(
      product?.quantity ?? product?.qty ?? product?.requested_quantity,
      0,
    ),

    unit: product?.unit || product?.uom || "piece",

    notes: product?.notes || product?.description || "",
  }));
};

const normalizeQuotationItems = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item, index) => ({
    id: item?.id || `quotation-item-${index}`,

    productId: item?.productId || item?.product_id || item?.id || null,

    name: item?.name || item?.product_name || item?.productName || "Product",

    quantity: toNumber(item?.quantity ?? item?.qty, 0),

    unit: item?.unit || item?.uom || "piece",

    unitRate: toNumber(
      item?.unitRate ?? item?.unit_rate ?? item?.rate ?? item?.price,
      0,
    ),

    subtotal: toNumber(item?.subtotal ?? item?.line_total ?? item?.total, 0),

    notes: item?.notes || "",
  }));
};

const normalizeQuotation = (quotation) => {
  if (!quotation) {
    return null;
  }

  const taxes =
    quotation.taxes && typeof quotation.taxes === "object"
      ? quotation.taxes
      : {};

  return {
    ...quotation,

    id: quotation.id,

    rfqId: quotation.rfq_id || quotation.rfqId || null,

    vendorId: quotation.vendor_id || quotation.vendorId || null,

    buyerName: quotation.buyer_name || quotation.buyerName || "",

    buyerPhone: quotation.buyer_phone || quotation.buyerPhone || "",

    buyerGstin: quotation.buyer_gstin || quotation.buyerGstin || "",

    projectName: quotation.project_name || quotation.projectName || "",

    siteAddress: normalizeSiteAddress(quotation.site_address),

    items: normalizeQuotationItems(quotation.items),

    totalProductSubtotal: toNumber(quotation.total_product_subtotal, 0),

    deliveryCharge: toNumber(quotation.delivery_charge, 0),

    unloadingCharge: toNumber(quotation.unloading_charge, 0),

    taxes,

    gstRate: toNumber(taxes.gstRate ?? taxes.gst_rate, 0),

    gstAmount: toNumber(taxes.gstAmount ?? taxes.gst_amount, 0),

    grandTotal: toNumber(quotation.grand_total, 0),

    moqConditions: quotation.moq_conditions || "",

    estimatedDeliverySchedule: quotation.estimated_delivery_schedule || "",

    validUntil: quotation.valid_until || null,

    notes: quotation.notes || "",

    status: quotation.status || "SUBMITTED",

    convertedOrderId: quotation.converted_order_id || null,

    createdAt: quotation.created_at || null,

    updatedAt: quotation.updated_at || null,
  };
};

const normalizeRfq = (rfq, quotation = null, vendor = null) => {
  if (!rfq) {
    return null;
  }

  const siteAddress = normalizeSiteAddress(rfq.site_address);

  const requestedProducts = normalizeRequestedProducts(rfq.requested_products);

  return {
    ...rfq,

    id: rfq.id,

    vendorId: rfq.vendor_id || null,

    buyerId: rfq.buyer_id || null,

    buyerName: rfq.buyer_name || "",

    buyerPhone: rfq.buyer_phone || "",

    buyerGstin: rfq.buyer_gstin || "",

    projectName: rfq.project_name || "",

    siteAddress,

    requestedProducts,

    buyerProjectNotes: rfq.buyer_project_notes || "",

    status: rfq.status || RFQ_STATUS.NEW,

    expiryDate: rfq.expiry_date || null,

    convertedOrderId: rfq.converted_order_id || null,

    acceptedQuotationId: rfq.accepted_quotation_id || null,

    adminNotes: rfq.admin_notes || "",

    createdAt: rfq.created_at || null,

    updatedAt: rfq.updated_at || null,

    vendor: vendor
      ? {
          id: vendor.id,
          businessName: vendor.business_name || "",
          contactPerson: vendor.contact_person || "",
          email: vendor.email || "",
          phone: vendor.phone || "",
        }
      : null,

    quotation: normalizeQuotation(quotation),
  };
};

/* -------------------------------------------------------------------------- */
/* Service                                                                    */
/* -------------------------------------------------------------------------- */

export const vendorRfqService = {
  /**
   * Resolve the vendor profile belonging to the authenticated user.
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
   * Fetch RFQs assigned to the authenticated vendor.
   *
   * Also loads:
   * - vendor profile
   * - vendor quotations
   */
  async getVendorRfqs() {
    const vendorId = await this._resolveVendorId();

    const { data, error } = await supabase
      .from("vendor_rfqs")
      .select(
        `
          *,
          vendor_profiles (
            id,
            business_name,
            contact_person,
            email,
            phone
          ),
          vendor_quotations (
            id,
            rfq_id,
            vendor_id,
            buyer_name,
            buyer_phone,
            buyer_gstin,
            project_name,
            site_address,
            items,
            total_product_subtotal,
            delivery_charge,
            unloading_charge,
            taxes,
            grand_total,
            moq_conditions,
            estimated_delivery_schedule,
            valid_until,
            notes,
            status,
            converted_order_id,
            created_at,
            updated_at
          )
        `,
      )
      .eq("vendor_id", vendorId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw new Error(`Unable to load project RFQs: ${error.message}`);
    }

    return (data || []).map((rfq) => {
      const quotations = Array.isArray(rfq.vendor_quotations)
        ? rfq.vendor_quotations
        : [];

      const latestQuotation =
        quotations.length > 0
          ? [...quotations].sort(
              (a, b) =>
                new Date(b.created_at || 0) - new Date(a.created_at || 0),
            )[0]
          : null;

      return normalizeRfq(rfq, latestQuotation, rfq.vendor_profiles);
    });
  },

  /**
   * Fetch one RFQ belonging to the authenticated vendor.
   */
  async getRfqById(rfqId) {
    if (!rfqId) {
      throw new Error("RFQ ID is required.");
    }

    const vendorId = await this._resolveVendorId();

    const { data, error } = await supabase
      .from("vendor_rfqs")
      .select(
        `
          *,
          vendor_profiles (
            id,
            business_name,
            contact_person,
            email,
            phone
          ),
          vendor_quotations (
            id,
            rfq_id,
            vendor_id,
            buyer_name,
            buyer_phone,
            buyer_gstin,
            project_name,
            site_address,
            items,
            total_product_subtotal,
            delivery_charge,
            unloading_charge,
            taxes,
            grand_total,
            moq_conditions,
            estimated_delivery_schedule,
            valid_until,
            notes,
            status,
            converted_order_id,
            created_at,
            updated_at
          )
        `,
      )
      .eq("id", rfqId)
      .eq("vendor_id", vendorId)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to load RFQ record: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    const quotations = Array.isArray(data.vendor_quotations)
      ? data.vendor_quotations
      : [];

    const latestQuotation =
      quotations.length > 0
        ? [...quotations].sort(
            (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
          )[0]
        : null;

    return normalizeRfq(data, latestQuotation, data.vendor_profiles);
  },

  /**
   * Submit a new quotation or revise an existing quotation.
   *
   * IMPORTANT:
   * This inserts into vendor_quotations.
   * It does NOT try to update nonexistent quotation/history
   * columns on vendor_rfqs.
   */
  async submitOrUpdateQuotation({
    rfqId,
    itemQuotes = [],
    freightCharges = 0,
    unloadingCharges = 0,
    promisedTurnaroundDays = "",
    validityDays = 7,
    vendorRemarks = "",
  }) {
    if (!rfqId) {
      throw new Error("RFQ ID is required.");
    }

    const vendorId = await this._resolveVendorId();

    const rfq = await this.getRfqById(rfqId);

    if (!rfq) {
      throw new Error("RFQ not found or access restricted.");
    }

    if (
      rfq.status === RFQ_STATUS.CONVERTED_TO_ORDER ||
      rfq.status === RFQ_STATUS.COMPLETED
    ) {
      throw new Error(
        "Cannot modify a quotation after the RFQ has been converted or completed.",
      );
    }

    if (
      rfq.status === RFQ_STATUS.REJECTED ||
      rfq.status === RFQ_STATUS.EXPIRED
    ) {
      throw new Error("This RFQ is no longer available for quotation.");
    }

    const requestedProducts = Array.isArray(rfq.requestedProducts)
      ? rfq.requestedProducts
      : [];

    if (requestedProducts.length === 0) {
      throw new Error("This RFQ does not contain any requested products.");
    }

    const safeItemQuotes = Array.isArray(itemQuotes) ? itemQuotes : [];

    let productSubtotal = 0;

    const quotationItems = requestedProducts.map((product, index) => {
      const productId = product.productId || product.id || null;

      const matchingQuote =
        safeItemQuotes.find(
          (quote) =>
            String(quote?.productId ?? quote?.product_id ?? quote?.id ?? "") ===
            String(productId ?? ""),
        ) ||
        safeItemQuotes[index] ||
        {};

      const quantity = toNumber(product.quantity, 0);

      const unitRate = Math.max(
        0,
        toNumber(
          matchingQuote?.unitRate ??
            matchingQuote?.unit_rate ??
            matchingQuote?.rate ??
            matchingQuote?.price,
          0,
        ),
      );

      const subtotal = Math.round(quantity * unitRate * 100) / 100;

      productSubtotal += subtotal;

      return {
        productId,
        name: product.name || "Product",
        quantity,
        unit: product.unit || "piece",
        unitRate,
        subtotal,
        notes: matchingQuote?.notes || "",
      };
    });

    const deliveryCharge = Math.max(0, toNumber(freightCharges, 0));

    const unloadingCharge = Math.max(0, toNumber(unloadingCharges, 0));

    const taxableAmount = productSubtotal + deliveryCharge + unloadingCharge;

    const gstRate = 18;

    const gstAmount = Math.round(taxableAmount * (gstRate / 100) * 100) / 100;

    const grandTotal = Math.round((taxableAmount + gstAmount) * 100) / 100;

    const safeValidityDays = Math.max(
      1,
      Math.min(365, toNumber(validityDays, 7)),
    );

    const validUntil = new Date(
      Date.now() + safeValidityDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    const quotationPayload = {
      rfq_id: rfq.id,
      vendor_id: vendorId,

      buyer_name: rfq.buyerName || "",

      buyer_phone: rfq.buyerPhone || "",

      buyer_gstin: rfq.buyerGstin || null,

      project_name: rfq.projectName || "",

      site_address: JSON.stringify(rfq.siteAddress || {}),

      items: quotationItems,

      total_product_subtotal: productSubtotal,

      delivery_charge: deliveryCharge,

      unloading_charge: unloadingCharge,

      taxes: {
        gstRate,
        gstAmount,
      },

      grand_total: grandTotal,

      moq_conditions: "",

      estimated_delivery_schedule:
        promisedTurnaroundDays || "Staged delivery per project schedule",

      valid_until: validUntil,

      notes: vendorRemarks || "",

      status: "SUBMITTED",
    };

    /*
     * If an existing quotation exists, update it.
     * Otherwise create a new quotation.
     */
    let quotationId = rfq.quotation?.id || null;

    let quotationData = null;

    if (quotationId) {
      const { data, error } = await supabase
        .from("vendor_quotations")
        .update(quotationPayload)
        .eq("id", quotationId)
        .eq("rfq_id", rfq.id)
        .eq("vendor_id", vendorId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update quotation: ${error.message}`);
      }

      quotationData = data;
    } else {
      quotationId = `QT-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase()}`;

      const { data, error } = await supabase
        .from("vendor_quotations")
        .insert({
          id: quotationId,
          ...quotationPayload,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create quotation: ${error.message}`);
      }

      quotationData = data;
    }

    /*
     * Move RFQ to QUOTATION_SENT after the quotation
     * has been successfully created/updated.
     */
    const { data: updatedRfq, error: rfqUpdateError } = await supabase
      .from("vendor_rfqs")
      .update({
        status: RFQ_STATUS.QUOTATION_SENT,
        updated_at: new Date().toISOString(),
      })
      .eq("id", rfq.id)
      .eq("vendor_id", vendorId)
      .select()
      .single();

    if (rfqUpdateError) {
      throw new Error(
        `Quotation saved but RFQ status could not be updated: ${rfqUpdateError.message}`,
      );
    }

    return {
      rfq: normalizeRfq(updatedRfq, quotationData, rfq.vendor),

      quotation: normalizeQuotation(quotationData),
    };
  },

  /**
   * Withdraw the vendor quotation.
   *
   * The actual quotation row is marked WITHDRAWN.
   * The RFQ itself is not incorrectly changed to REJECTED.
   */
  async withdrawQuotation(rfqId, reason = "") {
    if (!rfqId) {
      throw new Error("RFQ ID is required.");
    }

    const vendorId = await this._resolveVendorId();

    const rfq = await this.getRfqById(rfqId);

    if (!rfq) {
      throw new Error("RFQ not found or access restricted.");
    }

    if (
      rfq.status === RFQ_STATUS.CONVERTED_TO_ORDER ||
      rfq.status === RFQ_STATUS.COMPLETED
    ) {
      throw new Error("Cannot withdraw a quotation after order conversion.");
    }

    if (!rfq.quotation?.id) {
      throw new Error("No quotation exists for this RFQ.");
    }

    const timestamp = new Date().toISOString();

    const notes = reason?.trim()
      ? reason.trim()
      : "Vendor withdrew the quotation.";

    const { data: quotation, error: quotationError } = await supabase
      .from("vendor_quotations")
      .update({
        status: "WITHDRAWN",
        notes,
        updated_at: timestamp,
      })
      .eq("id", rfq.quotation.id)
      .eq("rfq_id", rfq.id)
      .eq("vendor_id", vendorId)
      .select()
      .single();

    if (quotationError) {
      throw new Error(
        `Failed to withdraw quotation: ${quotationError.message}`,
      );
    }

    /*
     * The RFQ remains available as an RFQ.
     * If necessary, a new quotation can later be submitted.
     */
    const { data: updatedRfq, error: rfqError } = await supabase
      .from("vendor_rfqs")
      .update({
        status: RFQ_STATUS.NEW,
        updated_at: timestamp,
      })
      .eq("id", rfq.id)
      .eq("vendor_id", vendorId)
      .select()
      .single();

    if (rfqError) {
      throw new Error(
        `Quotation withdrawn but RFQ status could not be updated: ${rfqError.message}`,
      );
    }

    return {
      rfq: normalizeRfq(updatedRfq, quotation, rfq.vendor),

      quotation: normalizeQuotation(quotation),
    };
  },
};
