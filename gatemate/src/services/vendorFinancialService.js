/**
 * GateMate Vendor Financials, Transactions & Settlements Service
 *
 * Commission Policy:
 * - Fixed standard rate: 5% of Product Subtotal (COMMISSION_RATE = 0.05).
 * - Commission is EXCLUSIVELY calculated on Product Subtotal.
 * - Commission is NEVER calculated on Delivery Charges, Platform Packaging Fees, COD handling fees, or GST taxes.
 * - Cancelled or refunded orders are excluded from commission deductions.
 * - Historical records store the immutable applied commission rate and amount.
 */

import { supabase } from "../lib/supabaseClient";

export const PLATFORM_COMMISSION_RATE = 0.05; // 5% Standard

export const SETTLEMENT_STATUS = {
  PENDING: "PENDING",
  PROCESSED: "PROCESSED",
  HOLD: "HOLD",
};

const VENDOR_FINANCIALS_KEY = "gatemate_vendor_financial_ledger_";
const VENDOR_SETTLEMENTS_KEY = "gatemate_vendor_settlements_list_";

const SEED_TRANSACTIONS = [
  {
    id: "TXN-GM-20260910-001",
    orderId: "GM-ORD-20260910-0210",
    vendorId: "vnd-pune-001",
    orderDate: "2026-09-10T11:00:00Z",
    deliveredDate: "2026-09-10T14:30:00Z",
    customerRef: "CUST-PN-1102 (Shree Developers)",
    productSubtotal: 5520,
    deliveryFee: 0,
    packagingFee: 29,
    taxAmount: 0,
    orderGrandTotal: 5549,
    commissionRate: 0.05,
    commissionAmount: 276, // 5% of 5,520
    vendorPayableAmount: 5244, // 5,520 - 276
    paymentMethod: "Net Banking IMPS (Cashfree)",
    paymentStatus: "SUCCESS",
    settlementStatus: SETTLEMENT_STATUS.PROCESSED,
    settlementBatchId: "SET-PN-20260910-01",
    utrNumber: "HDFCR5202609100091",
  },
  {
    id: "TXN-GM-20260908-002",
    orderId: "GM-ORD-20260908-0192",
    vendorId: "vnd-pune-001",
    orderDate: "2026-09-08T10:15:00Z",
    deliveredDate: "2026-09-08T11:45:00Z",
    customerRef: "CUST-PN-8812 (Aditya Rathore)",
    productSubtotal: 3850,
    deliveryFee: 0,
    packagingFee: 49,
    taxAmount: 0,
    orderGrandTotal: 3948,
    commissionRate: 0.05,
    commissionAmount: 192.5, // 5% of 3,850
    vendorPayableAmount: 3657.5, // 3,850 - 192.5
    paymentMethod: "Pay on Delivery (Doorstep Cash/UPI)",
    paymentStatus: "SUCCESS",
    settlementStatus: SETTLEMENT_STATUS.PROCESSED,
    settlementBatchId: "SET-PN-20260909-01",
    utrNumber: "HDFCR5202609090044",
  },
  {
    id: "TXN-GM-20260911-003",
    orderId: "GM-ORD-20260911-0391",
    vendorId: "vnd-pune-001",
    orderDate: "2026-09-11T12:45:00Z",
    deliveredDate: null,
    customerRef: "CUST-PN-4901 (Kailash Deshmukh)",
    productSubtotal: 5040,
    deliveryFee: 0,
    packagingFee: 29,
    taxAmount: 0,
    orderGrandTotal: 5069,
    commissionRate: 0.05,
    commissionAmount: 252, // 5% of 5,040
    vendorPayableAmount: 4788, // 5,040 - 252
    paymentMethod: "UPI Collect (Cashfree)",
    paymentStatus: "SUCCESS",
    settlementStatus: SETTLEMENT_STATUS.PENDING,
    settlementBatchId: null,
    utrNumber: null,
  },
  {
    id: "TXN-GM-20260911-004",
    orderId: "GM-ORD-20260911-0418",
    vendorId: "vnd-pune-001",
    orderDate: "2026-09-11T13:10:00Z",
    deliveredDate: null,
    customerRef: "CUST-PN-8812 (Aditya Rathore)",
    productSubtotal: 3850,
    deliveryFee: 0,
    packagingFee: 49,
    taxAmount: 0,
    orderGrandTotal: 3948,
    commissionRate: 0.05,
    commissionAmount: 192.5,
    vendorPayableAmount: 3657.5,
    paymentMethod: "Pay on Delivery",
    paymentStatus: "PENDING",
    settlementStatus: SETTLEMENT_STATUS.PENDING,
    settlementBatchId: null,
    utrNumber: null,
  },
];

const SEED_SETTLEMENT_BATCHES = [
  {
    id: "SET-PN-20260910-01",
    vendorId: "vnd-pune-001",
    batchDate: "2026-09-10",
    grossProductSubtotal: 5520,
    totalCommissionDeducted: 276,
    netDisbursedAmount: 5244,
    orderCount: 1,
    status: SETTLEMENT_STATUS.PROCESSED,
    bankDetails: {
      accountName: "Pune Mega Infrastructure Depot Pvt Ltd",
      accountNumber: "•••• •••• 5678",
      bankName: "HDFC Bank, Hadapsar Branch",
      ifscCode: "HDFC0001234",
    },
    utrNumber: "HDFCR5202609100091",
    processedAt: "2026-09-10T18:00:00Z",
  },
  {
    id: "SET-PN-20260909-01",
    vendorId: "vnd-pune-001",
    batchDate: "2026-09-09",
    grossProductSubtotal: 3850,
    totalCommissionDeducted: 192.5,
    netDisbursedAmount: 3657.5,
    orderCount: 1,
    status: SETTLEMENT_STATUS.PROCESSED,
    bankDetails: {
      accountName: "Pune Mega Infrastructure Depot Pvt Ltd",
      accountNumber: "•••• •••• 5678",
      bankName: "HDFC Bank, Hadapsar Branch",
      ifscCode: "HDFC0001234",
    },
    utrNumber: "HDFCR5202609090044",
    processedAt: "2026-09-09T18:00:00Z",
  },
];

export const vendorFinancialService = {
  /**
   * Pure calculation contract:
   * 5% of Product Subtotal (Excludes delivery charges, packaging, taxes, and discounts).
   */
  calculateTransactionSplit(
    productSubtotal,
    customRate = PLATFORM_COMMISSION_RATE,
  ) {
    const subtotal = Math.max(0, Number(productSubtotal) || 0);
    const rate = Number(customRate) || PLATFORM_COMMISSION_RATE;
    const commissionAmount = Math.round(subtotal * rate * 100) / 100;
    const vendorPayableAmount = Math.max(0, subtotal - commissionAmount);

    return {
      productSubtotal: subtotal,
      commissionRate: rate,
      commissionPercentageText: `${rate * 100}%`,
      commissionAmount,
      vendorPayableAmount,
    };
  },

  /**
   * Fetches transactions for a specific vendor or all vendors if no vendorId is provided.
   */
  async getTransactions(vendorId = null, limit = 50) {
    let query = supabase
      .from("vendor_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    // Only apply vendor_id filter if a valid non-mock UUID is provided
    if (vendorId && vendorId !== "vnd-pune-001" && vendorId.length === 36) {
      query = query.eq("vendor_id", vendorId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Fetches financial ledger summary metrics.
   */
  async getFinancialSummary(vendorId = null) {
    const transactions = await this.getTransactions(vendorId, 200);

    const grossVolume = transactions.reduce(
      (sum, t) => sum + Number(t.product_subtotal || 0),
      0,
    );
    const totalCommission = transactions.reduce(
      (sum, t) => sum + Number(t.commission_amount || 0),
      0,
    );
    const pendingSettlement = transactions
      .filter((t) => t.settlement_status === "PENDING")
      .reduce((sum, t) => sum + Number(t.vendor_payable_amount || 0), 0);
    const settledAmount = transactions
      .filter((t) => t.settlement_status === "SETTLED")
      .reduce((sum, t) => sum + Number(t.vendor_payable_amount || 0), 0);

    return {
      grossVolume,
      totalCommission,
      pendingSettlement,
      settledAmount,
      totalOrders: transactions.length,
    };
  },

  /**
   * Fetches settlement batches.
   */
  async getSettlements(vendorId = null, limit = 50) {
    let query = supabase
      .from("vendor_settlements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (vendorId && vendorId !== "vnd-pune-001" && vendorId.length === 36) {
      query = query.eq("vendor_id", vendorId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
};
