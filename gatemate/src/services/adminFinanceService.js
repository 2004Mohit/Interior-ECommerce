import { supabase } from "../lib/supabaseClient";

export const adminFinanceService = {
  /**
   * Fetches payment transactions (Cashfree & Pay on Delivery)
   */
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
      processed = processed.filter((t) => {
        const oId = String(t.id || "").toLowerCase();
        const vName = String(t.vendor?.business_name || "").toLowerCase();
        return oId.includes(q) || vName.includes(q);
      });
    }

    return {
      transactions: processed,
      totalCount: count || processed.length,
    };
  },

  /**
   * Fetches the 5% platform commission ledger
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
    if (error) throw error;

    let processed = (data || []).map((c) => ({
      ...c,
      vendor: Array.isArray(c.vendor_profiles)
        ? c.vendor_profiles[0]
        : c.vendor_profiles,
    }));

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      processed = processed.filter((c) => {
        const oId = String(c.order_id || "").toLowerCase();
        const vName = String(c.vendor?.business_name || "").toLowerCase();
        return oId.includes(q) || vName.includes(q);
      });
    }

    return {
      commissions: processed,
      totalCount: count || processed.length,
    };
  },

  /**
   * Fetches vendor settlement summaries and past disbursals
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

    if (pendingTxRes.error) throw pendingTxRes.error;
    if (pastSettlementsRes.error) throw pastSettlementsRes.error;

    const vendorMap = {};
    (vendorsRes.data || []).forEach((v) => {
      vendorMap[v.id] = {
        vendorId: v.id,
        businessName: v.business_name,
        bankDetails: v.bank_details || {},
        pendingAmount: 0,
        pendingOrdersCount: 0,
      };
    });

    (pendingTxRes.data || []).forEach((tx) => {
      if (vendorMap[tx.vendor_id]) {
        vendorMap[tx.vendor_id].pendingAmount += Number(
          tx.vendor_payable_amount || 0,
        );
        vendorMap[tx.vendor_id].pendingOrdersCount += 1;
      }
    });

    const pendingBatches = Object.values(vendorMap).filter(
      (b) => b.pendingOrdersCount > 0,
    );

    return {
      pendingBatches,
      pastSettlements: (pastSettlementsRes.data || []).map((s) => ({
        ...s,
        batch_reference_id: s.id,
        bank_reference_utr: s.utr_number,
        vendor: Array.isArray(s.vendor_profiles)
          ? s.vendor_profiles[0]
          : s.vendor_profiles,
      })),
    };
  },

  /**
   * Processes vendor settlement with UTR verification
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

    if (error) throw error;
    return data;
  },
};
