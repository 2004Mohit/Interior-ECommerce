/**
 * Ferrado Vendor Financials, Transactions & Settlements Service
 *
 * Vendor-facing financial service.
 *
 * IMPORTANT:
 * - Database uses snake_case column names.
 * - Vendor React components use camelCase names.
 * - This service normalizes the database records before returning them.
 *
 * Commission information is intentionally NOT exposed to the vendor UI.
 */

import { supabase } from "../lib/supabaseClient";

export const SETTLEMENT_STATUS = {
  PENDING: "PENDING",
  PROCESSED: "PROCESSED",
  SETTLED: "SETTLED",
  HOLD: "HOLD",
};

export const vendorFinancialService = {
  /**
   * Resolve the authenticated user's vendor profile ID.
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
   * Get vendor transaction records.
   *
   * Database:
   * vendor_transactions
   *
   * Related:
   * vendor_orders
   *
   * The raw snake_case database fields are normalized
   * into camelCase fields expected by VendorPayments.jsx.
   */
  async getTransactions(limit = 200) {
    const vendorId = await this._resolveVendorId();

    /*
     * ---------------------------------------------------------
     * 1. Load vendor transactions
     * ---------------------------------------------------------
     */
    const { data: transactionRows, error: transactionError } = await supabase
      .from("vendor_transactions")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (transactionError) {
      throw transactionError;
    }

    const transactions = Array.isArray(transactionRows) ? transactionRows : [];

    /*
     * No transactions.
     */
    if (transactions.length === 0) {
      return [];
    }

    /*
     * ---------------------------------------------------------
     * 2. Collect order IDs
     * ---------------------------------------------------------
     */
    const orderIds = [
      ...new Set(
        transactions
          .map((transaction) => transaction?.order_id)
          .filter(Boolean)
          .map(String),
      ),
    ];

    /*
     * ---------------------------------------------------------
     * 3. Load related vendor orders
     *
     * We need this because customer_ref/customer_name
     * are stored in vendor_orders, not vendor_transactions.
     * ---------------------------------------------------------
     */
    let orderMap = new Map();

    if (orderIds.length > 0) {
      const { data: orderRows, error: orderError } = await supabase
        .from("vendor_orders")
        .select(
          `
            id,
            customer_name,
            customer_ref,
            payment_method,
            payment_status
          `,
        )
        .in("id", orderIds);

      if (orderError) {
        /*
         * Do not fail the entire transaction page if the
         * optional order lookup fails.
         *
         * The transaction itself can still be displayed.
         */
        console.warn(
          "Unable to load related vendor order information:",
          orderError,
        );
      } else {
        orderMap = new Map(
          (orderRows || []).map((order) => [String(order.id), order]),
        );
      }
    }

    /*
     * ---------------------------------------------------------
     * 4. Normalize transaction records
     * ---------------------------------------------------------
     */
    return transactions.map((transaction) => {
      const orderId = String(transaction.order_id || "");

      const relatedOrder = orderMap.get(orderId);

      const productSubtotal = Number(transaction.product_subtotal || 0);

      /*
       * vendor_payable_amount is the amount already recorded
       * by the financial/settlement system for the vendor.
       *
       * We keep this value as the vendor earnings amount.
       *
       * Commission fields are intentionally not returned.
       */
      const vendorPayableAmount = Number(
        transaction.vendor_payable_amount ?? transaction.product_subtotal ?? 0,
      );

      return {
        /*
         * Transaction identity
         */
        id: String(transaction.id || ""),

        /*
         * Order identity
         */
        orderId,

        /*
         * Customer information comes from vendor_orders.
         *
         * Prefer customer name for the UI.
         * Fall back to customer reference.
         */
        customerRef:
          relatedOrder?.customer_name || relatedOrder?.customer_ref || "—",

        /*
         * Financial values
         */
        productSubtotal,

        vendorPayableAmount,

        /*
         * Payment information
         */
        paymentMethod:
          transaction.payment_method || relatedOrder?.payment_method || "—",

        paymentStatus:
          transaction.payment_status ||
          relatedOrder?.payment_status ||
          "PENDING",

        /*
         * Settlement information
         */
        settlementStatus:
          transaction.settlement_status || SETTLEMENT_STATUS.PENDING,

        utrNumber: transaction.utr_number || null,

        /*
         * Dates
         */
        createdAt: transaction.created_at || null,

        /*
         * Useful optional fields
         */
        deliveryFee: Number(transaction.delivery_fee || 0),

        packagingFee: Number(transaction.packaging_fee || 0),

        taxAmount: Number(transaction.tax_amount || 0),

        settlementBatchId: transaction.settlement_batch_id || null,
      };
    });
  },

  /**
   * Get vendor financial summary.
   *
   * Commission information is NOT exposed.
   */
  async getFinancialSummary() {
    const transactions = await this.getTransactions();

    /*
     * Total product sales.
     */
    const grossProductSubtotal = transactions.reduce(
      (sum, transaction) => sum + Number(transaction.productSubtotal || 0),
      0,
    );

    /*
     * Vendor earnings recorded against transactions.
     */
    const totalVendorEarnings = transactions.reduce(
      (sum, transaction) => sum + Number(transaction.vendorPayableAmount || 0),
      0,
    );

    /*
     * Pending settlement amount.
     */
    const pendingSettlementAmount = transactions
      .filter(
        (transaction) =>
          transaction.settlementStatus === SETTLEMENT_STATUS.PENDING,
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.vendorPayableAmount || 0),
        0,
      );

    /*
     * Settled / processed amount.
     *
     * The database currently uses PROCESSED for completed
     * settlement records, while SETTLED is retained for
     * backward compatibility.
     */
    const settledDisbursedAmount = transactions
      .filter(
        (transaction) =>
          transaction.settlementStatus === SETTLEMENT_STATUS.PROCESSED ||
          transaction.settlementStatus === SETTLEMENT_STATUS.SETTLED,
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.vendorPayableAmount || 0),
        0,
      );

    return {
      /*
       * Current vendor-facing fields
       */
      grossProductSubtotal,

      totalVendorEarnings,

      pendingSettlementAmount,

      settledDisbursedAmount,

      transactionCount: transactions.length,

      /*
       * Dashboard compatibility aliases.
       *
       * These do NOT expose commission information.
       */
      grossVolume: grossProductSubtotal,

      netRevenue: totalVendorEarnings,

      pendingSettlement: pendingSettlementAmount,

      settledAmount: settledDisbursedAmount,

      totalOrders: transactions.length,
    };
  },

  /**
   * Get vendor settlement batches.
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

  /**
   * Backward compatibility.
   */
  async getSettlements(limit = 50) {
    return this.getSettlementBatches(limit);
  },
};
