import { supabase } from "../lib/supabaseClient";

export const adminFinanceService = {
  async getPaymentTransactions({
    search = "",
    paymentStatus = "ALL",
    method = "ALL",
    limit = 50,
    offset = 0,
  } = {}) {
    let query = supabase
      .from("vendor_orders")
      .select(
        `
        id,
        grand_total,
        item_subtotal,
        tax_amount,
        delivery_fee,
        payment_status,
        payment_method,
        created_at,
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

    if (paymentStatus && paymentStatus !== "ALL") {
      query = query.eq("payment_status", paymentStatus);
    }

    if (method && method !== "ALL") {
      query = query.eq("payment_method", method);
    }

    const { data, count, error } = await query;

    if (error) throw error;

    let processed = (data || []).map((tx) => ({
      ...tx,
      vendor: Array.isArray(tx.vendor_profiles)
        ? tx.vendor_profiles[0]
        : tx.vendor_profiles,
    }));

    if (search.trim()) {
      const q = search.trim().toLowerCase();

      processed = processed.filter((tx) => {
        const orderId = String(tx.id || "").toLowerCase();

        const vendorName = String(tx.vendor?.business_name || "").toLowerCase();

        return orderId.includes(q) || vendorName.includes(q);
      });
    }

    return {
      transactions: processed,
      totalCount: count || processed.length,
    };
  },

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
      .order("created_at", {
        ascending: false,
      })
      .range(offset, offset + limit - 1);

    if (status && status !== "ALL") {
      query = query.eq("status", status);
    }

    const { data, count, error } = await query;

    if (error) throw error;

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
   * Admin settlement queue.
   *
   * Pending batches are calculated from vendor_transactions.
   * Historical batches come from vendor_settlements.
   */
  async getSettlementOverview() {
    const [pendingTxRes, pastSettlementsRes, vendorsRes] = await Promise.all([
      supabase
        .from("vendor_transactions")
        .select(
          `
          id,
          vendor_id,
          product_subtotal,
          commission_amount,
          vendor_payable_amount,
          settlement_status,
          created_at
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
        .order("created_at", {
          ascending: false,
        })
        .limit(100),

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

        businessName: vendor.business_name || "Vendor",

        bankDetails: vendor.bank_details || {},

        pendingAmount: 0,

        pendingOrdersCount: 0,

        grossProductSubtotal: 0,

        totalCommission: 0,
      };
    });

    (pendingTxRes.data || []).forEach((transaction) => {
      const vendor = vendorMap[transaction.vendor_id];

      if (!vendor) return;

      vendor.pendingAmount += Number(transaction.vendor_payable_amount || 0);

      vendor.pendingOrdersCount += 1;

      vendor.grossProductSubtotal += Number(transaction.product_subtotal || 0);

      vendor.totalCommission += Number(transaction.commission_amount || 0);
    });

    const pendingBatches = Object.values(vendorMap).filter(
      (vendor) => vendor.pendingOrdersCount > 0,
    );

    const pastSettlements = (pastSettlementsRes.data || []).map(
      (settlement) => ({
        ...settlement,

        batch_reference_id: settlement.batch_reference_id || settlement.id,

        bank_reference_utr: settlement.utr_number || null,

        utr_number: settlement.utr_number || null,

        vendor: Array.isArray(settlement.vendor_profiles)
          ? settlement.vendor_profiles[0]
          : settlement.vendor_profiles,
      }),
    );

    return {
      pendingBatches,
      pastSettlements,
    };
  },

  /**
   * Atomically processes one vendor's pending
   * transactions through the database RPC.
   */
  async processSettlement({ vendorId, bankReferenceUtr, notes = "" }) {
    const cleanUtr = String(bankReferenceUtr || "").trim();

    if (!cleanUtr) {
      throw new Error("A valid bank UTR / IMPS reference number is required.");
    }

    const { data, error } = await supabase.rpc(
      "process_admin_vendor_settlement",
      {
        p_vendor_id: vendorId,
        p_bank_reference_utr: cleanUtr,
        p_settlement_notes: String(notes || "").trim() || null,
      },
    );

    if (error) {
      throw error;
    }

    return data;
  },
};
