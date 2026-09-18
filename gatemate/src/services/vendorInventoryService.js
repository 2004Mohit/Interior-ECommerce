import { supabase } from "../lib/supabaseClient";

export const STOCK_STATUS = {
  IN_STOCK: "IN_STOCK",
  LOW_STOCK: "LOW_STOCK",
  OUT_OF_STOCK: "OUT_OF_STOCK",
};

export const ADJUSTMENT_REASONS = {
  RESTOCK: "Restock / New Inward",
  ORDER_FULFILLED: "Order Fulfilled",
  DAMAGE: "Damaged / Broken",
  LOSS: "Loss / Missing",
  CORRECTION: "Physical Count Correction",
  RETURN: "Customer Return",
  OTHER: "Other",
};

export const vendorInventoryService = {
  /**
   * Helper to resolve the authenticated vendor's internal profile UUID.
   */
  async _resolveVendorProfileId() {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("No authenticated user found.");
    }

    const { data: vendorProfileId, error: rpcError } = await supabase.rpc(
      "get_vendor_id_for_auth_user",
    );

    if (rpcError) {
      console.error("Failed to resolve vendor profile ID via RPC:", rpcError);
      throw new Error(`Unable to resolve vendor profile: ${rpcError.message}`);
    }

    if (!vendorProfileId) {
      throw new Error(
        "Vendor profile not found. The vendor may not be approved yet.",
      );
    }

    return vendorProfileId;
  },

  /**
   * Fetch live inventory for the authenticated vendor.
   */
  async getInventory() {
    const vendorId = await this._resolveVendorProfileId();

    const { data, error } = await supabase
      .from("vendor_inventory")
      .select("*, vendor_products(*)")
      .eq("vendor_id", vendorId);

    if (error) {
      console.error("Failed to fetch vendor inventory:", error);
      throw new Error(`Unable to fetch inventory: ${error.message}`);
    }

    return (data || []).map((item) => {
      const prod = item.vendor_products || {};
      const onHand = item.on_hand_stock ?? item.stock ?? 0;
      const reserved = item.reserved_stock ?? 0;
      const available = Math.max(0, onHand - reserved);
      const lowStockThreshold = item.low_stock_threshold ?? 5;

      let status = STOCK_STATUS.IN_STOCK;
      if (onHand <= 0) {
        status = STOCK_STATUS.OUT_OF_STOCK;
      } else if (available <= lowStockThreshold) {
        status = STOCK_STATUS.LOW_STOCK;
      }

      return {
        productId: prod.id || item.product_id,
        productName: prod.name || item.product_name,
        brand: prod.brand || "",
        sku: prod.sku || "",
        category: prod.category_slug || "",
        unit: prod.unit || "bag",
        img: prod.cover_image_url || prod.image_urls?.[0] || "",
        onHandStock: onHand,
        reservedStock: reserved,
        availableStock: available,
        status,
        isLowStock: status === STOCK_STATUS.LOW_STOCK,
        isOutOfStock: status === STOCK_STATUS.OUT_OF_STOCK,
        lastUpdated: item.updated_at || item.created_at,
      };
    });
  },

  /**
   * Adjust stock for a product belonging to the authenticated vendor.
   */
  async adjustStock({ productId, adjustmentQty, adjustmentType, notes }) {
    const vendorId = await this._resolveVendorProfileId();

    // Fetch current inventory record
    const { data: current, error: fetchError } = await supabase
      .from("vendor_inventory")
      .select("*")
      .eq("vendor_id", vendorId)
      .eq("product_id", productId)
      .maybeSingle();

    if (fetchError) {
      console.error(
        "Failed to fetch current inventory for adjustment:",
        fetchError,
      );
      throw new Error(`Unable to adjust stock: ${fetchError.message}`);
    }

    const previousStock = current?.on_hand_stock ?? current?.stock ?? 0;
    const newStock = Math.max(0, previousStock + Number(adjustmentQty));

    const payload = {
      vendor_id: vendorId,
      product_id: productId,
      on_hand_stock: newStock,
      stock: newStock,
      updated_at: new Date().toISOString(),
    };

    const { data, error: upsertError } = await supabase
      .from("vendor_inventory")
      .upsert(payload, { onConflict: "vendor_id,product_id" })
      .select()
      .single();

    if (upsertError) {
      console.error("Failed to update inventory stock:", upsertError);
      throw new Error(`Unable to update stock: ${upsertError.message}`);
    }

    return data;
  },

  /**
   * Fetch inventory history audit trail for the authenticated vendor.
   */
  async getInventoryHistory() {
    const vendorId = await this._resolveVendorProfileId();

    const { data, error } = await supabase
      .from("vendor_inventory_audit_log")
      .select("*, vendor_products(name, unit)")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    if (error) {
      // If table doesn't exist or returns error in custom environments, log and return empty array or throw based on production strictness
      console.error("Failed to fetch inventory history:", error);
      throw new Error(`Unable to fetch inventory history: ${error.message}`);
    }

    return (data || []).map((h) => ({
      id: h.id,
      timestamp: h.created_at,
      productName: h.vendor_products?.name || h.product_name || "Product SKU",
      unit: h.vendor_products?.unit || "bag",
      reason: h.adjustment_type || h.reason || "MANUAL_ADJUSTMENT",
      previousStock: h.previous_stock ?? 0,
      changeQty: h.adjustment_qty ?? h.change_qty ?? 0,
      newStock: h.new_stock ?? 0,
      batchNumber: h.batch_ref || h.batch_number || "BATCH-01",
      adjustedBy: h.adjusted_by || "Depot Manager",
    }));
  },
};
