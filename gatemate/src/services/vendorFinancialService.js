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
   * Fetches transactions for the authenticated vendor profile.
   */
  async getTransactions(limit = 50) {
    const vendorId = await this._resolveVendorId();

    const { data, error } = await supabase
      .from("vendor_transactions")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Fetches financial ledger summary metrics.
   */
  async getFinancialSummary() {
    const transactions = await this.getTransactions(200);

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
  async getSettlements(limit = 50) {
    const vendorId = await this._resolveVendorId();

    const { data, error } = await supabase
      .from("vendor_settlements")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },
};
