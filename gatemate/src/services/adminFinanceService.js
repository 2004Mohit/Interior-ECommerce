import { supabase } from "../lib/supabaseClient";

export const adminFinanceService = {
  /**
   * Fetch the authoritative payment transaction ledger.
   *
   * payment_transactions is the detailed payment ledger.
   * One GateMate order may have multiple payment attempts.
   */
  async getPaymentTransactions({
    search = "",
    paymentStatus = "ALL",
    method = "ALL",
    limit = 50,
    offset = 0,
  } = {}) {
    let query = supabase
      .from("payment_transactions")
      .select(
        `
        id,
        order_id,
        customer_id,
        vendor_id,
        payment_gateway,
        gateway_order_id,
        gateway_payment_id,
        payment_method,
        payment_status,
        amount,
        currency,
        payment_message,
        bank_reference,
        payment_group,
        gateway_payment_time,
        gateway_completion_time,
        idempotency_key,
        created_at,
        updated_at,
        vendor_profiles:vendor_id (
          id,
          business_name,
          locality,
          city
        )
        `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    /*
     * Payment status filter
     *
     * Database values:
     * PENDING
     * SUCCESS
     * FAILED
     * USER_DROPPED
     * CANCELLED
     * REFUNDED
     */
    if (paymentStatus && paymentStatus !== "ALL") {
      const normalizedStatus =
        paymentStatus === "PAID" ? "SUCCESS" : paymentStatus;

      query = query.eq("payment_status", normalizedStatus);
    }

    /*
     * Method filter
     *
     * UI sends:
     * ONLINE
     * POD
     *
     * Actual order/payment methods may be:
     * CASHFREE_ONLINE
     * PAY_ON_DELIVERY
     */
    if (method && method !== "ALL") {
      if (method === "ONLINE") {
        query = query.eq("payment_method", "CASHFREE_ONLINE");
      } else if (method === "POD") {
        query = query.eq("payment_method", "PAY_ON_DELIVERY");
      } else {
        query = query.eq("payment_method", method);
      }
    }

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    let processed = (data || []).map((tx) => ({
      ...tx,

      /*
       * Keep the vendor object shape expected by
       * AdminPaymentsView.jsx.
       */
      vendor: Array.isArray(tx.vendor_profiles)
        ? tx.vendor_profiles[0]
        : tx.vendor_profiles,

      /*
       * Compatibility aliases for the existing UI.
       *
       * DO NOT query vendor_orders.payment_reference.
       */
      payment_reference:
        tx.gateway_payment_id ||
        tx.bank_reference ||
        tx.gateway_order_id ||
        null,

      /*
       * The payment ledger amount is the authoritative
       * transaction amount.
       */
      grand_total: tx.amount,

      /*
       * Existing UI displays item subtotal separately.
       * For a payment-ledger row there is no item_subtotal
       * column, so keep it null rather than inventing a value.
       */
      item_subtotal: null,

      /*
       * Preserve a common created timestamp for the UI.
       */
      created_at: tx.created_at,
    }));

    /*
     * Search is intentionally performed after fetching the
     * paginated ledger rows.
     *
     * Searchable:
     * - GateMate order ID
     * - Cashfree payment ID
     * - Cashfree gateway order ID
     * - bank reference
     * - vendor name
     */
    if (search.trim()) {
      const q = search.trim().toLowerCase();

      processed = processed.filter((tx) => {
        const orderId = String(tx.order_id || "").toLowerCase();

        const paymentId = String(tx.gateway_payment_id || "").toLowerCase();

        const gatewayOrderId = String(tx.gateway_order_id || "").toLowerCase();

        const bankReference = String(tx.bank_reference || "").toLowerCase();

        const vendorName = String(tx.vendor?.business_name || "").toLowerCase();

        return (
          orderId.includes(q) ||
          paymentId.includes(q) ||
          gatewayOrderId.includes(q) ||
          bankReference.includes(q) ||
          vendorName.includes(q)
        );
      });
    }

    return {
      transactions: processed,
      totalCount: count || processed.length,
    };
  },

  /**
   * Fetch the platform commission ledger.
   */
  async getCommissionLedger({
    search = "",
    status = "ALL",
    limit = 50,
    offset = 0,
  } = {}) {
    let query = supabase
      .from("platform_commissions")
      .select(
        `
        *,
        vendor_profiles:vendor_id (
          id,
          business_name,
          city
        )
        `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "ALL") {
      query = query.eq("status", status);
    }

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    let processed = (data || []).map((commission) => ({
      ...commission,
      vendor: Array.isArray(commission.vendor_profiles)
        ? commission.vendor_profiles[0]
        : commission.vendor_profiles,
    }));

    if (search.trim()) {
      const q = search.trim().toLowerCase();

      processed = processed.filter((commission) => {
        const orderId = String(commission.order_id || "").toLowerCase();

        const vendorName = String(
          commission.vendor?.business_name || "",
        ).toLowerCase();

        return orderId.includes(q) || vendorName.includes(q);
      });
    }

    return {
      commissions: processed,
      totalCount: count || processed.length,
    };
  },

  /**
   * Fetch vendor settlement summaries and completed settlements.
   */
  async getSettlementOverview() {
    const [pendingTxRes, pastSettlementsRes, vendorsRes] = await Promise.all([
      supabase
        .from("vendor_transactions")
        .select(
          `
          *,
          vendor_profiles:vendor_id (
            id,
            business_name,
            bank_details
          )
          `,
        )
        .eq("settlement_status", "PENDING"),

      supabase
        .from("vendor_settlements")
        .select(
          `
          *,
          vendor_profiles:vendor_id (
            id,
            business_name
          )
          `,
        )
        .order("created_at", { ascending: false })
        .limit(50),

      supabase
        .from("vendor_profiles")
        .select("id, business_name, bank_details")
        .eq("verification_status", "APPROVED"),
    ]);

    if (pendingTxRes.error) {
      throw pendingTxRes.error;
    }

    if (pastSettlementsRes.error) {
      throw pastSettlementsRes.error;
    }

    if (vendorsRes.error) {
      throw vendorsRes.error;
    }

    const vendorMap = {};

    (vendorsRes.data || []).forEach((vendor) => {
      vendorMap[vendor.id] = {
        vendorId: vendor.id,
        businessName: vendor.business_name,
        bankDetails: vendor.bank_details || {},
        pendingAmount: 0,
        pendingOrdersCount: 0,
      };
    });

    (pendingTxRes.data || []).forEach((transaction) => {
      if (vendorMap[transaction.vendor_id]) {
        vendorMap[transaction.vendor_id].pendingAmount += Number(
          transaction.vendor_payable_amount || 0,
        );

        vendorMap[transaction.vendor_id].pendingOrdersCount += 1;
      }
    });

    const pendingBatches = Object.values(vendorMap).filter(
      (batch) => batch.pendingOrdersCount > 0,
    );

    return {
      pendingBatches,

      pastSettlements: (pastSettlementsRes.data || []).map((settlement) => ({
        ...settlement,

        batch_reference_id: settlement.id,

        bank_reference_utr: settlement.utr_number,

        vendor: Array.isArray(settlement.vendor_profiles)
          ? settlement.vendor_profiles[0]
          : settlement.vendor_profiles,
      })),
    };
  },

  /**
   * Process a vendor settlement.
   */
  async processSettlement({ vendorId, bankReferenceUtr, notes = "" }) {
    const { data, error } = await supabase.rpc(
      "process_admin_vendor_settlement",
      {
        p_vendor_id: vendorId,
        p_bank_reference_utr: bankReferenceUtr.trim(),
        p_settlement_notes: notes.trim() || null,
      },
    );

    if (error) {
      throw error;
    }

    return data;
  },
};
