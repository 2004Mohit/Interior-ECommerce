import { supabase } from "../lib/supabaseClient";

export const adminInventoryService = {
  /**
   * Fetches platform-wide inventory records across all vendors
   */
  async getInventoryOversight({
    search = "",
    stockFilter = "ALL", // 'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCREPANCY'
    limit = 100,
    offset = 0,
  } = {}) {
    let query = supabase
      .from("vendor_inventory")
      .select(
        `
        *,
        vendor_products:product_id (
          id,
          name,
          brand,
          sku,
          unit,
          category_slug,
          cover_image_url,
          image_urls
        ),
        vendor_profiles:vendor_id (
          id,
          business_name,
          locality,
          city
        )
      `,
        { count: "exact" },
      )
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    let filtered = (data || []).map((item) => {
      const onHand = Number(item.on_hand_stock || 0);
      const reserved = Number(item.reserved_stock || 0);
      const threshold = Number(item.low_stock_threshold || 10);
      const available = onHand - reserved;

      let status = "NORMAL";
      if (reserved > onHand) {
        status = "DISCREPANCY";
      } else if (available <= 0) {
        status = "OUT_OF_STOCK";
      } else if (available <= threshold) {
        status = "LOW_STOCK";
      }

      return {
        ...item,
        availableStock: available,
        stockStatus: status,
        vendor: Array.isArray(item.vendor_profiles)
          ? item.vendor_profiles[0]
          : item.vendor_profiles,
        product: Array.isArray(item.vendor_products)
          ? item.vendor_products[0]
          : item.vendor_products,
      };
    });

    if (stockFilter && stockFilter !== "ALL") {
      filtered = filtered.filter((item) => item.stockStatus === stockFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((item) => {
        const pName = String(item.product?.name || "").toLowerCase();
        const brand = String(item.product?.brand || "").toLowerCase();
        const sku = String(item.product?.sku || "").toLowerCase();
        const vName = String(item.vendor?.business_name || "").toLowerCase();
        return (
          pName.includes(q) ||
          brand.includes(q) ||
          sku.includes(q) ||
          vName.includes(q)
        );
      });
    }

    return {
      inventory: filtered,
      totalCount: count || filtered.length,
    };
  },

  /**
   * Fetches audit history ledger for a specific product inventory record
   */
  async getInventoryAuditHistory(productId) {
    const { data, error } = await supabase
      .from("vendor_inventory_audit_log")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) throw error;
    return data || [];
  },

  /**
   * Performs an administrative inventory adjustment
   */
  async adjustInventory({ inventoryId, newOnHandStock, reason }) {
    const { data, error } = await supabase.rpc("admin_adjust_inventory", {
      p_inventory_id: inventoryId,
      p_new_on_hand_stock: Number(newOnHandStock),
      p_reason: reason.trim(),
    });

    if (error) throw error;
    return data;
  },
};
