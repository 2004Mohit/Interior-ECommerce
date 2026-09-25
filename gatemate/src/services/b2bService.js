/**
 * GateMate B2B Contractor & Project RFQ Service
 *
 * Customer RFQ lifecycle:
 *
 * Customer
 *   ↓
 * vendor_rfqs
 *   ↓
 * Vendor quotation(s)
 *   ↓
 * Customer review
 *
 * This service uses Supabase as the source of truth.
 */

import { supabase } from "../lib/supabaseClient";

export const B2B_RFQ_STATUS = {
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

const normalizeSiteAddress = (address) => {
  if (!address) {
    return {};
  }

  if (typeof address === "string") {
    return {
      address_line1: address,
    };
  }

  return {
    id: address.id || null,
    recipient_name: address.recipient_name || address.recipientName || "",
    phone: address.phone || "",
    address_line1:
      address.address_line1 || address.addressLine1 || address.address || "",
    locality: address.locality || address.area || "",
    city: address.city || "",
    state: address.state || "",
    pincode: address.pincode || address.postalCode || "",
    landmark: address.landmark || "",
    address_type: address.address_type || address.addressType || "SITE",
    is_default:
      typeof address.is_default === "boolean"
        ? address.is_default
        : Boolean(address.isDefault),
  };
};

const normalizeRequestedProducts = (products) => {
  if (!Array.isArray(products)) {
    return [];
  }

  return products.map((item, index) => ({
    id: item.id || item.productId || item.product_id || `item-${index + 1}`,

    productId: item.productId || item.product_id || item.id || null,

    name: item.name || item.productName || item.product_name || "Product",

    productName:
      item.productName || item.product_name || item.name || "Product",

    quantity: Number(item.quantity || 0),

    unit: item.unit || "piece",

    notes: item.notes || item.description || "",
  }));
};

const normalizeRfq = (row, quotations = []) => {
  if (!row) {
    return null;
  }

  return {
    ...row,

    id: row.id,

    buyerId: row.buyer_id || null,

    buyerName: row.buyer_name || "Customer",

    buyerPhone: row.buyer_phone || "",

    buyerGstin: row.buyer_gstin || "",

    projectName: row.project_name || "Commercial Project",

    siteAddress: normalizeSiteAddress(row.site_address),

    requestedProducts: normalizeRequestedProducts(row.requested_products),

    buyerProjectNotes: row.buyer_project_notes || "",

    status: row.status || B2B_RFQ_STATUS.NEW,

    expiryDate: row.expiry_date || null,

    createdAt: row.created_at || null,

    updatedAt: row.updated_at || null,

    convertedOrderId: row.converted_order_id || null,

    acceptedQuotationId: row.accepted_quotation_id || null,

    adminNotes: row.admin_notes || "",

    quotations: Array.isArray(quotations) ? quotations : [],
  };
};

const normalizeQuotation = (row) => {
  if (!row) {
    return null;
  }

  const taxes = row.taxes && typeof row.taxes === "object" ? row.taxes : {};

  return {
    ...row,

    id: row.id,

    rfqId: row.rfq_id || null,

    vendorId: row.vendor_id || null,

    buyerName: row.buyer_name || "",

    buyerPhone: row.buyer_phone || "",

    buyerGstin: row.buyer_gstin || "",

    projectName: row.project_name || "",

    siteAddress: row.site_address || "",

    items: Array.isArray(row.items) ? row.items : [],

    totalProductSubtotal: Number(row.total_product_subtotal || 0),

    deliveryCharge: Number(row.delivery_charge || 0),

    unloadingCharge: Number(row.unloading_charge || 0),

    taxes,

    gstRate: Number(taxes.gstRate || 0),

    gstAmount: Number(taxes.gstAmount || 0),

    grandTotal: Number(row.grand_total || 0),

    moqConditions: row.moq_conditions || "",

    estimatedDeliverySchedule: row.estimated_delivery_schedule || "",

    validUntil: row.valid_until || null,

    notes: row.notes || "",

    status: row.status || "SUBMITTED",

    convertedOrderId: row.converted_order_id || null,

    createdAt: row.created_at || null,

    updatedAt: row.updated_at || null,

    vendor: Array.isArray(row.vendor_profiles)
      ? row.vendor_profiles[0] || null
      : row.vendor_profiles || null,
  };
};

export const b2bService = {
  /**
   * Validate Indian GSTIN.
   */
  validateGSTIN(gstin) {
    const cleanGst = (gstin || "").trim().toUpperCase();

    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (!gstRegex.test(cleanGst)) {
      return {
        isValid: false,
        message: "Please enter a valid 15-character Indian GSTIN.",
      };
    }

    const stateCode = cleanGst.slice(0, 2);

    return {
      isValid: true,
      stateCode,
      isMaharashtra: stateCode === "27",
      formattedGst: cleanGst,
      message:
        stateCode === "27" ? "Valid Maharashtra GSTIN." : "Valid Indian GSTIN.",
    };
  },

  /**
   * Fetch all RFQs created by the authenticated customer.
   *
   * IMPORTANT:
   * vendor_rfqs is vendor-scoped in the database, so
   * customer filtering is done using buyer_id.
   */
  async getQuotations(userId) {
    if (!userId) {
      return [];
    }

    const { data, error } = await supabase
      .from("vendor_rfqs")
      .select(
        `
        *,
        vendor_profiles:vendor_id (
          id,
          business_name,
          phone,
          email,
          locality,
          city
        ),
        vendor_quotations (
          *
        )
      `,
      )
      .eq("buyer_id", userId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw new Error(`Unable to load B2B RFQs: ${error.message}`);
    }

    return (data || []).map((row) => {
      const quotations = Array.isArray(row.vendor_quotations)
        ? row.vendor_quotations.map(normalizeQuotation)
        : [];

      return normalizeRfq(row, quotations);
    });
  },

  /**
   * Fetch one customer RFQ and its quotations.
   */
  async getRfqById(userId, rfqId) {
    if (!userId) {
      throw new Error("Customer authentication is required.");
    }

    if (!rfqId) {
      throw new Error("RFQ ID is required.");
    }

    const { data, error } = await supabase
      .from("vendor_rfqs")
      .select(
        `
        *,
        vendor_profiles:vendor_id (
          id,
          business_name,
          phone,
          email,
          locality,
          city
        ),
        vendor_quotations (
          *
        )
      `,
      )
      .eq("id", rfqId)
      .eq("buyer_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to load RFQ: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    const quotations = Array.isArray(data.vendor_quotations)
      ? data.vendor_quotations.map(normalizeQuotation)
      : [];

    return normalizeRfq(data, quotations);
  },

  /**
   * Submit a new commercial RFQ.
   *
   * vendor_rfqs requires vendor_id.
   *
   * The current application architecture stores each RFQ
   * against a vendor. Therefore this method requires the
   * selected vendor ID from the customer flow.
   */
  async submitQuotation(userId, rfqData) {
    if (!userId) {
      throw new Error("Customer authentication is required.");
    }

    if (!rfqData) {
      throw new Error("RFQ information is required.");
    }

    const projectName = String(rfqData.projectName || "").trim();

    const buyerName = String(
      rfqData.buyerName || rfqData.customerName || "",
    ).trim();

    const buyerPhone = String(
      rfqData.buyerPhone || rfqData.customerPhone || "",
    ).trim();

    const vendorId = rfqData.vendorId || rfqData.vendor_id || null;

    const productName = String(rfqData.productName || "").trim();

    const quantity = Number(rfqData.quantity || 0);

    const gstin = String(rfqData.gstin || "")
      .trim()
      .toUpperCase();

    const siteAddress = normalizeSiteAddress(
      rfqData.siteAddress || rfqData.site_address || rfqData.siteLocation || "",
    );

    const notes = String(rfqData.notes || "").trim();

    if (!projectName) {
      throw new Error("Project name is required.");
    }

    if (!buyerName) {
      throw new Error("Buyer name is required.");
    }

    if (!buyerPhone) {
      throw new Error("Buyer phone number is required.");
    }

    if (!vendorId) {
      throw new Error("Please select a vendor before submitting the RFQ.");
    }

    if (!productName) {
      throw new Error("Product name is required.");
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("Product quantity must be greater than zero.");
    }

    if (gstin && !this.validateGSTIN(gstin).isValid) {
      throw new Error("Please enter a valid GSTIN or leave it blank.");
    }

    const requestedProducts = [
      {
        id: rfqData.productId || rfqData.product_id || `product-${Date.now()}`,

        productId: rfqData.productId || rfqData.product_id || null,

        name: productName,

        productName,

        quantity,

        unit: rfqData.unit || "piece",

        notes: rfqData.productNotes || "",
      },
    ];

    const expiryDate =
      rfqData.expiryDate ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const insertPayload = {
      id: rfqData.id || `RFQ-PN-${Date.now()}`,

      vendor_id: vendorId,

      buyer_id: userId,

      buyer_name: buyerName,

      buyer_phone: buyerPhone,

      buyer_gstin: gstin || null,

      project_name: projectName,

      site_address: siteAddress,

      requested_products: requestedProducts,

      buyer_project_notes: notes || null,

      status: B2B_RFQ_STATUS.NEW,

      expiry_date: expiryDate,

      admin_notes: null,
    };

    const { data, error } = await supabase
      .from("vendor_rfqs")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to submit RFQ: ${error.message}`);
    }

    return {
      success: true,

      data: normalizeRfq(data),

      message:
        "Project RFQ submitted successfully. The selected vendor can now review the project request and submit a commercial quotation.",
    };
  },

  /**
   * Accept one quotation for an RFQ.
   *
   * This only updates the quotation/RFQ relationship.
   * Actual wholesale-order conversion remains a separate
   * controlled operation.
   */
  async acceptQuotation(userId, rfqId, quotationId) {
    if (!userId) {
      throw new Error("Customer authentication is required.");
    }

    if (!rfqId || !quotationId) {
      throw new Error("RFQ ID and quotation ID are required.");
    }

    const { data: rfq, error: rfqError } = await supabase
      .from("vendor_rfqs")
      .select("id,buyer_id,status,accepted_quotation_id")
      .eq("id", rfqId)
      .eq("buyer_id", userId)
      .maybeSingle();

    if (rfqError) {
      throw new Error(`Unable to verify RFQ: ${rfqError.message}`);
    }

    if (!rfq) {
      throw new Error("RFQ not found.");
    }

    const { data: quotation, error: quotationError } = await supabase
      .from("vendor_quotations")
      .select("*")
      .eq("id", quotationId)
      .eq("rfq_id", rfqId)
      .maybeSingle();

    if (quotationError) {
      throw new Error(`Unable to verify quotation: ${quotationError.message}`);
    }

    if (!quotation) {
      throw new Error("Quotation not found for this RFQ.");
    }

    if (
      quotation.status !== "SUBMITTED" &&
      quotation.status !== "UNDER_REVIEW"
    ) {
      throw new Error(
        `This quotation cannot be accepted in its current status: ${quotation.status}.`,
      );
    }

    const { data: updatedQuotation, error: updateQuotationError } =
      await supabase
        .from("vendor_quotations")
        .update({
          status: "ACCEPTED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", quotationId)
        .eq("rfq_id", rfqId)
        .select("*")
        .single();

    if (updateQuotationError) {
      throw new Error(
        `Failed to accept quotation: ${updateQuotationError.message}`,
      );
    }

    const { data: updatedRfq, error: updateRfqError } = await supabase
      .from("vendor_rfqs")
      .update({
        status: B2B_RFQ_STATUS.ACCEPTED,
        accepted_quotation_id: quotationId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", rfqId)
      .eq("buyer_id", userId)
      .select("*")
      .single();

    if (updateRfqError) {
      throw new Error(
        `Quotation was accepted but RFQ update failed: ${updateRfqError.message}`,
      );
    }

    return {
      success: true,

      quotation: normalizeQuotation(updatedQuotation),

      rfq: normalizeRfq(updatedRfq),

      message: "Quotation accepted successfully.",
    };
  },

  /**
   * Reject a quotation belonging to the customer's RFQ.
   */
  async rejectQuotation(userId, rfqId, quotationId) {
    if (!userId) {
      throw new Error("Customer authentication is required.");
    }

    const { data: rfq, error: rfqError } = await supabase
      .from("vendor_rfqs")
      .select("id,buyer_id")
      .eq("id", rfqId)
      .eq("buyer_id", userId)
      .maybeSingle();

    if (rfqError) {
      throw new Error(`Unable to verify RFQ: ${rfqError.message}`);
    }

    if (!rfq) {
      throw new Error("RFQ not found.");
    }

    const { data, error } = await supabase
      .from("vendor_quotations")
      .update({
        status: "REJECTED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", quotationId)
      .eq("rfq_id", rfqId)
      .in("status", ["SUBMITTED", "UNDER_REVIEW"])
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to reject quotation: ${error.message}`);
    }

    return {
      success: true,

      quotation: normalizeQuotation(data),

      message: "Quotation rejected.",
    };
  },
};
