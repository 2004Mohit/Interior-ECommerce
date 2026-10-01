/**
 * GateMate Vendor Financials, Transactions & Settlements Service
 *
 * Vendor-facing financial service.
 *
 * IMPORTANT:
 * - vendor_transactions does NOT contain customer_ref.
 * - Customer/order identification is therefore based on order_id.
 * - Detailed gateway payment history is stored separately in
 *   payment_transactions.
 * - Settlement information comes from vendor_transactions and
 *   vendor_settlements.
 */

import { supabase } from "../lib/supabaseClient";

export const SETTLEMENT_STATUS = {
  PENDING: "PENDING",
  PROCESSED: "PROCESSED",
  SETTLED: "SETTLED",
  HOLD: "HOLD",
};

export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  USER_DROPPED: "USER_DROPPED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
};

const formatAmount = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const vendorFinancialService = {
  /**
   * Resolve the vendor profile belonging to the currently
   * authenticated vendor user.
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
   * Get vendor transaction ledger.
   *
   * IMPORTANT:
   * vendor_transactions schema contains:
   * id
   * order_id
   * vendor_id
   * product_subtotal
   * commission_rate
   * commission_amount
   * vendor_payable_amount
   * delivery_fee
   * packaging_fee
   * tax_amount
   * payment_method
   * payment_status
   * settlement_status
   * settlement_batch_id
   * utr_number
   * created_at
   *
   * There is NO customer_ref column.
   */
  async getTransactions(limit = 200) {
    const vendorId = await this._resolveVendorId();

    const { data, error } = await supabase
      .from("vendor_transactions")
      .select(
        [
          "id",
          "order_id",
          "vendor_id",
          "product_subtotal",
          "commission_rate",
          "commission_amount",
          "vendor_payable_amount",
          "delivery_fee",
          "packaging_fee",
          "tax_amount",
          "payment_method",
          "payment_status",
          "settlement_status",
          "settlement_batch_id",
          "utr_number",
          "created_at",
        ].join(","),
      )
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (data || []).map((transaction) => ({
      id: transaction.id,
      orderId: transaction.order_id,

      /*
       * vendor_transactions has no customer_ref.
       *
       * Use order_id as the stable customer/order reference
       * available in this ledger.
       */
      customerRef: transaction.order_id || "Customer",

      productSubtotal: formatAmount(transaction.product_subtotal),

      commissionRate: Number(transaction.commission_rate || 0),

      commissionAmount: formatAmount(transaction.commission_amount),

      vendorPayableAmount: formatAmount(transaction.vendor_payable_amount),

      deliveryFee: formatAmount(transaction.delivery_fee),

      packagingFee: formatAmount(transaction.packaging_fee),

      taxAmount: formatAmount(transaction.tax_amount),

      paymentMethod: transaction.payment_method || "—",

      paymentStatus: transaction.payment_status || PAYMENT_STATUS.PENDING,

      settlementStatus:
        transaction.settlement_status || SETTLEMENT_STATUS.PENDING,

      settlementBatchId: transaction.settlement_batch_id || null,

      utrNumber: transaction.utr_number || null,

      createdAt: transaction.created_at || null,
    }));
  },

  /**
   * Get the raw financial rows used for vendor financial summaries.
   */
  async _getFinancialRows(limit = 200) {
    const vendorId = await this._resolveVendorId();

    const { data, error } = await supabase
      .from("vendor_transactions")
      .select(
        [
          "product_subtotal",
          "commission_amount",
          "vendor_payable_amount",
          "payment_status",
          "settlement_status",
          "created_at",
        ].join(","),
      )
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data || [];
  },

  /**
   * Financial summary for the vendor dashboard.
   */
  async getFinancialSummary() {
    const transactions = await this._getFinancialRows();

    const grossProductSubtotal = transactions.reduce(
      (sum, transaction) => sum + Number(transaction.product_subtotal || 0),
      0,
    );

    const totalVendorEarnings = transactions.reduce(
      (sum, transaction) =>
        sum + Number(transaction.vendor_payable_amount || 0),
      0,
    );

    const pendingSettlementAmount = transactions
      .filter(
        (transaction) =>
          transaction.settlement_status === SETTLEMENT_STATUS.PENDING,
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.vendor_payable_amount || 0),
        0,
      );

    const settledDisbursedAmount = transactions
      .filter(
        (transaction) =>
          transaction.settlement_status === SETTLEMENT_STATUS.SETTLED ||
          transaction.settlement_status === SETTLEMENT_STATUS.PROCESSED,
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.vendor_payable_amount || 0),
        0,
      );

    const successfulPaymentAmount = transactions
      .filter(
        (transaction) => transaction.payment_status === PAYMENT_STATUS.SUCCESS,
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.vendor_payable_amount || 0),
        0,
      );

    return {
      grossProductSubtotal,
      totalVendorEarnings,
      pendingSettlementAmount,
      settledDisbursedAmount,
      successfulPaymentAmount,
      transactionCount: transactions.length,
    };
  },

  /**
   * Get vendor settlement batches.
   */
  async getSettlementBatches(limit = 50) {
    const vendorId = await this._resolveVendorId();

    const { data, error } = await supabase
      .from("vendor_settlements")
      .select(
        [
          "id",
          "batch_reference_id",
          "vendor_id",
          "settled_at",
          "created_at",
          "order_count",
          "gross_product_subtotal",
          "net_disbursed_amount",
          "utr_number",
          "status",
          "processed_at",
          "notes",
          "bank_details",
        ].join(","),
      )
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (data || []).map((settlement) => ({
      id: settlement.batch_reference_id || settlement.id,

      settlementId: settlement.id,

      vendorId: settlement.vendor_id,

      batchReferenceId: settlement.batch_reference_id || settlement.id,

      batchDate:
        settlement.settled_at ||
        settlement.processed_at ||
        settlement.created_at ||
        null,

      orderCount: Number(settlement.order_count || 0),

      grossProductSubtotal: Number(settlement.gross_product_subtotal || 0),

      totalAmount: Number(settlement.net_disbursed_amount || 0),

      utrNumber: settlement.utr_number || null,

      status: settlement.status || SETTLEMENT_STATUS.PENDING,

      processedAt: settlement.processed_at || null,

      settledAt: settlement.settled_at || null,

      notes: settlement.notes || null,

      bankDetails: settlement.bank_details || null,
    }));
  },

  /**
   * Get detailed payment gateway history for the vendor.
   *
   * This uses payment_transactions rather than vendor_transactions.
   *
   * vendor_transactions = vendor earnings / settlement ledger
   * payment_transactions = customer payment gateway ledger
   */
  async getPaymentHistory(limit = 200) {
    const vendorId = await this._resolveVendorId();

    const { data, error } = await supabase
      .from("payment_transactions")
      .select(
        [
          "id",
          "order_id",
          "customer_id",
          "vendor_id",
          "payment_gateway",
          "gateway_order_id",
          "gateway_payment_id",
          "payment_method",
          "payment_status",
          "amount",
          "currency",
          "payment_message",
          "bank_reference",
          "payment_group",
          "gateway_payment_time",
          "gateway_completion_time",
          "created_at",
          "updated_at",
        ].join(","),
      )
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (data || []).map((payment) => ({
      id: payment.id,

      orderId: payment.order_id,

      customerId: payment.customer_id || null,

      paymentGateway: payment.payment_gateway || null,

      gatewayOrderId: payment.gateway_order_id || null,

      gatewayPaymentId: payment.gateway_payment_id || null,

      paymentMethod: payment.payment_method || "—",

      paymentStatus: payment.payment_status || PAYMENT_STATUS.PENDING,

      amount: Number(payment.amount || 0),

      formattedAmount: formatAmount(payment.amount),

      currency: payment.currency || "INR",

      paymentMessage: payment.payment_message || null,

      bankReference: payment.bank_reference || null,

      paymentGroup: payment.payment_group || null,

      gatewayPaymentTime: payment.gateway_payment_time || null,

      gatewayCompletionTime: payment.gateway_completion_time || null,

      createdAt: payment.created_at || null,

      updatedAt: payment.updated_at || null,
    }));
  },

  /**
   * Get invoices belonging to the current vendor.
   *
   * The invoices table is already protected by vendor RLS.
   */
  async getInvoices(limit = 100) {
    const vendorId = await this._resolveVendorId();

    const { data, error } = await supabase
      .from("invoices")
      .select(
        [
          "id",
          "invoice_number",
          "order_id",
          "customer_id",
          "vendor_id",
          "invoice_type",
          "status",
          "currency",
          "item_subtotal",
          "delivery_fee",
          "packaging_fee",
          "tax_amount",
          "grand_total",
          "payment_status",
          "payment_method",
          "payment_gateway",
          "payment_gateway_reference",
          "billing_address",
          "shipping_address",
          "issued_at",
          "paid_at",
          "created_at",
          "updated_at",
        ].join(","),
      )
      .eq("vendor_id", vendorId)
      .order("issued_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (data || []).map((invoice) => ({
      id: invoice.id,

      invoiceNumber: invoice.invoice_number,

      orderId: invoice.order_id,

      customerId: invoice.customer_id || null,

      vendorId: invoice.vendor_id || null,

      invoiceType: invoice.invoice_type || null,

      status: invoice.status || null,

      currency: invoice.currency || "INR",

      itemSubtotal: Number(invoice.item_subtotal || 0),

      deliveryFee: Number(invoice.delivery_fee || 0),

      packagingFee: Number(invoice.packaging_fee || 0),

      taxAmount: Number(invoice.tax_amount || 0),

      grandTotal: Number(invoice.grand_total || 0),

      paymentStatus: invoice.payment_status || PAYMENT_STATUS.PENDING,

      paymentMethod: invoice.payment_method || null,

      paymentGateway: invoice.payment_gateway || null,

      paymentGatewayReference: invoice.payment_gateway_reference || null,

      billingAddress: invoice.billing_address || null,

      shippingAddress: invoice.shipping_address || null,

      issuedAt: invoice.issued_at || null,

      paidAt: invoice.paid_at || null,

      createdAt: invoice.created_at || null,

      updatedAt: invoice.updated_at || null,
    }));
  },

  /**
   * Get a single invoice by invoice number.
   */
  async getInvoiceByNumber(invoiceNumber) {
    const vendorId = await this._resolveVendorId();

    if (!invoiceNumber) {
      throw new Error("Invoice number is required.");
    }

    const { data, error } = await supabase
      .from("invoices")
      .select(
        [
          "id",
          "invoice_number",
          "order_id",
          "customer_id",
          "vendor_id",
          "invoice_type",
          "status",
          "currency",
          "item_subtotal",
          "delivery_fee",
          "packaging_fee",
          "tax_amount",
          "grand_total",
          "payment_status",
          "payment_method",
          "payment_gateway",
          "payment_gateway_reference",
          "billing_address",
          "shipping_address",
          "issued_at",
          "paid_at",
          "created_at",
          "updated_at",
        ].join(","),
      )
      .eq("vendor_id", vendorId)
      .eq("invoice_number", invoiceNumber)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      invoiceNumber: data.invoice_number,
      orderId: data.order_id,
      customerId: data.customer_id || null,
      vendorId: data.vendor_id || null,
      invoiceType: data.invoice_type || null,
      status: data.status || null,
      currency: data.currency || "INR",
      itemSubtotal: Number(data.item_subtotal || 0),
      deliveryFee: Number(data.delivery_fee || 0),
      packagingFee: Number(data.packaging_fee || 0),
      taxAmount: Number(data.tax_amount || 0),
      grandTotal: Number(data.grand_total || 0),
      paymentStatus: data.payment_status || PAYMENT_STATUS.PENDING,
      paymentMethod: data.payment_method || null,
      paymentGateway: data.payment_gateway || null,
      paymentGatewayReference: data.payment_gateway_reference || null,
      billingAddress: data.billing_address || null,
      shippingAddress: data.shipping_address || null,
      issuedAt: data.issued_at || null,
      paidAt: data.paid_at || null,
      createdAt: data.created_at || null,
      updatedAt: data.updated_at || null,
    };
  },

  /**
   * Get invoice by order ID.
   */
  async getInvoiceByOrderId(orderId) {
    const vendorId = await this._resolveVendorId();

    if (!orderId) {
      throw new Error("Order ID is required.");
    }

    const { data, error } = await supabase
      .from("invoices")
      .select(
        [
          "id",
          "invoice_number",
          "order_id",
          "customer_id",
          "vendor_id",
          "invoice_type",
          "status",
          "currency",
          "item_subtotal",
          "delivery_fee",
          "packaging_fee",
          "tax_amount",
          "grand_total",
          "payment_status",
          "payment_method",
          "payment_gateway",
          "payment_gateway_reference",
          "billing_address",
          "shipping_address",
          "issued_at",
          "paid_at",
          "created_at",
          "updated_at",
        ].join(","),
      )
      .eq("vendor_id", vendorId)
      .eq("order_id", orderId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      invoiceNumber: data.invoice_number,
      orderId: data.order_id,
      customerId: data.customer_id || null,
      vendorId: data.vendor_id || null,
      invoiceType: data.invoice_type || null,
      status: data.status || null,
      currency: data.currency || "INR",
      itemSubtotal: Number(data.item_subtotal || 0),
      deliveryFee: Number(data.delivery_fee || 0),
      packagingFee: Number(data.packaging_fee || 0),
      taxAmount: Number(data.tax_amount || 0),
      grandTotal: Number(data.grand_total || 0),
      paymentStatus: data.payment_status || PAYMENT_STATUS.PENDING,
      paymentMethod: data.payment_method || null,
      paymentGateway: data.payment_gateway || null,
      paymentGatewayReference: data.payment_gateway_reference || null,
      billingAddress: data.billing_address || null,
      shippingAddress: data.shipping_address || null,
      issuedAt: data.issued_at || null,
      paidAt: data.paid_at || null,
      createdAt: data.created_at || null,
      updatedAt: data.updated_at || null,
    };
  },
};
