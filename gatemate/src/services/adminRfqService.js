import { supabase } from "../lib/supabaseClient";

export const adminRfqService = {
  /**
   * Fetches paginated commercial RFQs with associated vendor profiles
   */
  async getRfqs({ search = "", status = "ALL", limit = 50, offset = 0 } = {}) {
    let query = supabase
      .from("vendor_rfqs")
      .select(
        `
        *,
        vendor_profiles:vendor_id (
          id,
          business_name,
          locality,
          city,
          phone
        ),
        vendor_quotations (
          id,
          status,
          total_quoted_amount,
          created_at
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

    let filtered = (data || []).map((rfq) => ({
      ...rfq,
      vendor: Array.isArray(rfq.vendor_profiles)
        ? rfq.vendor_profiles[0]
        : rfq.vendor_profiles,
      quotations: rfq.vendor_quotations || [],
    }));

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((r) => {
        const id = String(r.id || "").toLowerCase();
        const pName = String(r.project_name || "").toLowerCase();
        const vName = String(r.vendor?.business_name || "").toLowerCase();
        const contact = String(r.contact_name || "").toLowerCase();
        const phone = String(r.contact_phone || "").toLowerCase();
        return (
          id.includes(q) ||
          pName.includes(q) ||
          vName.includes(q) ||
          contact.includes(q) ||
          phone.includes(q)
        );
      });
    }

    return {
      rfqs: filtered,
      totalCount: count || filtered.length,
    };
  },

  /**
   * Fetches comprehensive details for a single RFQ, all vendor quotations, and converted order if applicable
   */
  async getRfqDetail(rfqId) {
    const [rfqRes, quotRes] = await Promise.all([
      supabase
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
          )
        `,
        )
        .eq("id", rfqId)
        .single(),
      supabase
        .from("vendor_quotations")
        .select(
          `
          *,
          vendor_profiles:vendor_id (
            id,
            business_name,
            phone,
            email
          )
        `,
        )
        .eq("rfq_id", rfqId)
        .order("created_at", { ascending: false }),
    ]);

    if (rfqRes.error) throw rfqRes.error;

    return {
      rfq: {
        ...rfqRes.data,
        vendor: Array.isArray(rfqRes.data.vendor_profiles)
          ? rfqRes.data.vendor_profiles[0]
          : rfqRes.data.vendor_profiles,
      },
      quotations: (quotRes.data || []).map((q) => ({
        ...q,
        vendor: Array.isArray(q.vendor_profiles)
          ? q.vendor_profiles[0]
          : q.vendor_profiles,
      })),
    };
  },

  /**
   * Fetches all quotations across commercial RFQs for platform ledger tracking
   */
  async getAllQuotations({
    status = "ALL",
    search = "",
    limit = 50,
    offset = 0,
  } = {}) {
    let query = supabase
      .from("vendor_quotations")
      .select(
        `
        *,
        vendor_rfqs:rfq_id (
          id,
          project_name,
          delivery_location,
          required_delivery_date
        ),
        vendor_profiles:vendor_id (
          id,
          business_name,
          phone,
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

    let processed = (data || []).map((q) => ({
      ...q,
      rfq: Array.isArray(q.vendor_rfqs) ? q.vendor_rfqs[0] : q.vendor_rfqs,
      vendor: Array.isArray(q.vendor_profiles)
        ? q.vendor_profiles[0]
        : q.vendor_profiles,
    }));

    if (search.trim()) {
      const s = search.trim().toLowerCase();
      processed = processed.filter((q) => {
        const id = String(q.id || "").toLowerCase();
        const pName = String(q.rfq?.project_name || "").toLowerCase();
        const vName = String(q.vendor?.business_name || "").toLowerCase();
        return id.includes(s) || pName.includes(s) || vName.includes(s);
      });
    }

    return {
      quotations: processed,
      totalCount: count || processed.length,
    };
  },

  /**
   * Overrides RFQ lifecycle status via database RPC
   */
  async updateRfqStatus(rfqId, newStatus, adminNotes) {
    const { data, error } = await supabase.rpc("admin_update_rfq_status", {
      p_rfq_id: rfqId,
      p_new_status: newStatus,
      p_admin_notes: adminNotes.trim(),
    });

    if (error) throw error;
    return data;
  },
};
