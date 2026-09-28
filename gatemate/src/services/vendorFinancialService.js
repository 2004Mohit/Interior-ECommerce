/**
 * Ferrado Vendor Financials, Transactions & Settlements Service
 *
 * Commission Policy:
 * - Fixed standard rate: 5% of Product Subtotal.
 * - Commission is EXCLUSIVELY calculated on Product Subtotal.
 * - Delivery, packaging, COD handling fees and GST are excluded.
 */

import { supabase } from "../lib/supabaseClient";

export const PLATFORM_COMMISSION_RATE = 0.05;

export const SETTLEMENT_STATUS = {
  PENDING: "PENDING",
  PROCESSED: "PROCESSED",
  SETTLED: "SETTLED",
  HOLD: "HOLD",
};

export const vendorFinancialService = {
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

  async getTransactions(limit = 200) {
    const vendorId = await this._resolveVendorId();

    const { data, error } = await supabase
      .from("vendor_transactions")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data || [];
  },

  async getFinancialSummary() {
    const transactions = await this.getTransactions();

    const grossVolume = transactions.reduce(
      (sum, transaction) => sum + Number(transaction.product_subtotal || 0),
      0,
    );

    const totalCommission = transactions.reduce(
      (sum, transaction) => sum + Number(transaction.commission_amount || 0),
      0,
    );

    const pendingSettlement = transactions
      .filter(
        (transaction) =>
          transaction.settlement_status === SETTLEMENT_STATUS.PENDING,
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.vendor_payable_amount || 0),
        0,
      );

    const settledAmount = transactions
      .filter(
        (transaction) =>
          transaction.settlement_status === SETTLEMENT_STATUS.SETTLED,
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.vendor_payable_amount || 0),
        0,
      );

    return {
      grossVolume,
      totalCommission,
      pendingSettlement,
      settledAmount,
      totalOrders: transactions.length,
    };
  },

  /**
   * Vendor's own settlement batches.
   */
  async getSettlementBatches(limit = 50) {
    const vendorId = await this._resolveVendorId();

    const { data, error } = await supabase
      .from("vendor_settlements")
      .select("*")
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

      batchDate: settlement.settled_at || settlement.created_at || null,

      orderCount: Number(settlement.order_count || 0),

      grossProductSubtotal: Number(settlement.gross_product_subtotal || 0),

      totalCommissionDeducted: Number(
        settlement.total_commission_deducted || 0,
      ),

      totalAmount: Number(settlement.net_disbursed_amount || 0),

      netDisbursedAmount: Number(settlement.net_disbursed_amount || 0),

      utrNumber: settlement.utr_number || null,

      status: settlement.status || SETTLEMENT_STATUS.PROCESSED,

      processedAt: settlement.settled_at || settlement.processed_at || null,

      createdAt: settlement.created_at || null,

      notes: settlement.notes || "",

      bankDetails: settlement.bank_details || null,
    }));
  },

  // Backward compatibility.
  async getSettlements(limit = 50) {
    return this.getSettlementBatches(limit);
  },
};
