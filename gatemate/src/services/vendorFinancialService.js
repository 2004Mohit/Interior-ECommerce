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
   * Retrieves full transaction ledger entries for a vendor.
   */
  async getTransactions(vendorId = "vnd-pune-001") {
    await new Promise((resolve) => setTimeout(resolve, 80));

    try {
      const { data, error } = await supabase
        .from("vendor_transactions")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false });

      if (data && !error && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn("Supabase query fallback for vendor transactions", e);
    }

    const localRaw = localStorage.getItem(
      `${VENDOR_FINANCIALS_KEY}${vendorId}`,
    );
    if (localRaw) {
      try {
        return JSON.parse(localRaw);
      } catch (e) {
        console.error("Error parsing local transactions", e);
      }
    }

    localStorage.setItem(
      `${VENDOR_FINANCIALS_KEY}${vendorId}`,
      JSON.stringify(SEED_TRANSACTIONS),
    );
    return SEED_TRANSACTIONS;
  },

  /**
   * Retrieves summary metrics: Net Gross, Total Commission, Settled, and Pending Clearance.
   */
  async getFinancialSummary(vendorId = "vnd-pune-001") {
    const txns = await this.getTransactions(vendorId);

    let grossProductSubtotal = 0;
    let totalPlatformCommission = 0;
    let totalVendorEarnings = 0;
    let settledDisbursedAmount = 0;
    let pendingSettlementAmount = 0;

    txns.forEach((t) => {
      grossProductSubtotal += t.productSubtotal;
      totalPlatformCommission += t.commissionAmount;
      totalVendorEarnings += t.vendorPayableAmount;

      if (t.settlementStatus === SETTLEMENT_STATUS.PROCESSED) {
        settledDisbursedAmount += t.vendorPayableAmount;
      } else {
        pendingSettlementAmount += t.vendorPayableAmount;
      }
    });

    return {
      grossProductSubtotal,
      totalPlatformCommission,
      totalVendorEarnings,
      settledDisbursedAmount,
      pendingSettlementAmount,
      transactionCount: txns.length,
      commissionRateLabel: "5% on Product Subtotal",
    };
  },

  /**
   * Retrieves settled bank batch records with UTR references.
   */
  async getSettlementBatches(vendorId = "vnd-pune-001") {
    await new Promise((resolve) => setTimeout(resolve, 80));

    try {
      const { data, error } = await supabase
        .from("vendor_settlement_batches")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false });

      if (data && !error && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn("Supabase query fallback for settlement batches", e);
    }

    const localRaw = localStorage.getItem(
      `${VENDOR_SETTLEMENTS_KEY}${vendorId}`,
    );
    if (localRaw) {
      try {
        return JSON.parse(localRaw);
      } catch (e) {
        console.error("Error parsing local settlements", e);
      }
    }

    localStorage.setItem(
      `${VENDOR_SETTLEMENTS_KEY}${vendorId}`,
      JSON.stringify(SEED_SETTLEMENT_BATCHES),
    );
    return SEED_SETTLEMENT_BATCHES;
  },
};
