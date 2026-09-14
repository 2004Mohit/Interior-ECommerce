import { supabase } from "../lib/supabaseClient";

export const adminCustomerService = {
  /**
   * Fetches paginated customer directory with search and basic spend metrics
   */
  async getCustomers({ search = "", limit = 50, offset = 0 } = {}) {
    try {
      const { data, error } = await supabase.rpc(
        "get_admin_customer_directory",
        {
          p_search: search.trim(),
          p_limit: limit,
          p_offset: offset,
        },
      );
      if (error) throw error;
      return {
        customers: data?.customers || [],
        totalCount: data?.totalCount || 0,
      };
    } catch (err) {
      console.warn(
        "RPC get_admin_customer_directory failed, falling back to direct queries:",
        err,
      );
      // Direct fallback
      const { data, count, error } = await supabase
        .from("vendor_orders")
        .select("customer_id, grand_total, shipping_address, created_at", {
          count: "exact",
        });

      if (error) throw error;

      const customerMap = {};
      (data || []).forEach((o) => {
        if (!o.customer_id) return;
        if (!customerMap[o.customer_id]) {
          customerMap[o.customer_id] = {
            id: o.customer_id,
            fullName: o.shipping_address?.fullName || "Contractor Customer",
            email: "customer@site.in",
            phone: o.shipping_address?.phone || "—",
            total_orders: 0,
            lifetime_spent: 0,
            created_at: o.created_at,
            is_suspended: false,
            open_complaints: 0,
          };
        }
        customerMap[o.customer_id].total_orders += 1;
        customerMap[o.customer_id].lifetime_spent += Number(o.grand_total || 0);
      });

      return {
        customers: Object.values(customerMap),
        totalCount: Object.keys(customerMap).length,
      };
    }
  },

  /**
   * Fetches comprehensive 360 customer profile (Orders, RFQs, Reviews, Complaints, Notifications)
   */
  async getCustomerDetails(customerId) {
    const { data, error } = await supabase.rpc("get_admin_customer_details", {
      p_customer_id: customerId,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Fetches platform-wide customer orders ledger
   */
  async getCustomerOrdersLedger({
    search = "",
    status = "ALL",
    limit = 50,
    offset = 0,
  } = {}) {
    let query = supabase
      .from("vendor_orders")
      .select(
        `
        *,
        vendor_profiles:vendor_id (
          business_name,
          locality,
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

    let filtered = (data || []).map((o) => ({
      ...o,
      vendor: Array.isArray(o.vendor_profiles)
        ? o.vendor_profiles[0]
        : o.vendor_profiles,
    }));

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((o) => {
        const oId = String(o.id || "").toLowerCase();
        const cName = String(o.shipping_address?.fullName || "").toLowerCase();
        const cPhone = String(o.shipping_address?.phone || "").toLowerCase();
        return oId.includes(q) || cName.includes(q) || cPhone.includes(q);
      });
    }

    return {
      orders: filtered,
      totalCount: count || filtered.length,
    };
  },

  /**
   * Toggles customer account active/suspended state
   */
  async toggleSuspension(customerId, suspend, reason) {
    const { data, error } = await supabase.rpc(
      "admin_toggle_customer_suspension",
      {
        p_customer_id: customerId,
        p_suspend: Boolean(suspend),
        p_reason: reason.trim(),
      },
    );

    if (error) throw error;
    return data;
  },
};
