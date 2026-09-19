import { supabaseVendor } from "../lib/supabaseClient";

export const STOCK_STATUS = {
  IN_STOCK: "IN_STOCK",
  LOW_STOCK: "LOW_STOCK",
  OUT_OF_STOCK: "OUT_OF_STOCK",
};

export const ADJUSTMENT_REASONS = {
  RESTOCK: "RESTOCK",
  ORDER_FULFILLED: "ORDER_FULFILLED",
  DAMAGE: "DAMAGE",
  LOSS: "LOSS",
  CORRECTION: "CORRECTION",
  RETURN: "RETURN",
  OTHER: "OTHER",
};

const DEFAULT_LOW_STOCK_THRESHOLD = 5;

/**
 * Resolve the vendor_profiles.id belonging to the currently
 * authenticated vendor user.
 */
async function resolveVendorProfileId() {
  const { data: authData, error: authError } =
    await supabaseVendor.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  const userId = authData?.user?.id;

  if (!userId) {
    throw new Error("Vendor authentication session not found.");
  }

  const { data, error } = await supabaseVendor.rpc(
    "get_vendor_id_for_auth_user",
  );

  if (error) {
    throw new Error(error.message || "Unable to resolve vendor profile.");
  }

  if (!data) {
    throw new Error(
      "Vendor profile could not be found for the current account.",
    );
  }

  return data;
}

function calculateInventoryStatus(
  onHandStock,
  reservedStock,
  lowStockThreshold,
) {
  const onHand = Number(onHandStock) || 0;
  const reserved = Number(reservedStock) || 0;
  const threshold =
    Number(lowStockThreshold) >= 0
      ? Number(lowStockThreshold)
      : DEFAULT_LOW_STOCK_THRESHOLD;

  const available = Math.max(0, onHand - reserved);

  if (available <= 0) {
    return {
      status: STOCK_STATUS.OUT_OF_STOCK,
      isLowStock: false,
      isOutOfStock: true,
      availableStock: 0,
    };
  }

  if (available <= threshold) {
    return {
      status: STOCK_STATUS.LOW_STOCK,
      isLowStock: true,
      isOutOfStock: false,
      availableStock: available,
    };
  }

  return {
    status: STOCK_STATUS.IN_STOCK,
    isLowStock: false,
    isOutOfStock: false,
    availableStock: available,
  };
}

function mapInventoryItem(item) {
  const product = item?.vendor_products || {};

  const onHandStock = Number(item?.on_hand_stock) || 0;
  const reservedStock = Number(item?.reserved_stock) || 0;

  const lowStockThreshold =
    Number(item?.low_stock_threshold) >= 0
      ? Number(item.low_stock_threshold)
      : DEFAULT_LOW_STOCK_THRESHOLD;

  const statusData = calculateInventoryStatus(
    onHandStock,
    reservedStock,
    lowStockThreshold,
  );

  const imageUrls = Array.isArray(product?.image_urls)
    ? product.image_urls
    : [];

  const image = product?.cover_image_url || imageUrls[0] || "";

  return {
    id: item?.product_id,

    productId: item?.product_id,

    vendorId: item?.vendor_id,

    productName: product?.name || "Unnamed Product",

    brand: product?.brand || "",

    sku: product?.sku || "",

    category: product?.category_slug || "",

    categorySlug: product?.category_slug || "",

    unit: product?.unit || "",

    moq: Number(product?.moq) || 1,

    img: image,

    image,

    imageUrls,

    onHandStock,

    reservedStock,

    availableStock: statusData.availableStock,

    lowStockThreshold,

    status: statusData.status,

    isLowStock: statusData.isLowStock,

    isOutOfStock: statusData.isOutOfStock,

    lastUpdated: item?.updated_at || item?.created_at || null,

    productStatus: product?.status || null,

    isExpress30MinAvailable: product?.is_express_30min_available === true,

    originalRow: item,
  };
}

export const vendorInventoryService = {
  /**
   * Get all inventory belonging to the currently authenticated vendor.
   */
  async getInventory() {
    try {
      const vendorId = await resolveVendorProfileId();

      const { data, error } = await supabaseVendor
        .from("vendor_inventory")
        .select(
          `
            *,
            vendor_products (
              id,
              name,
              brand,
              sku,
              category_slug,
              unit,
              moq,
              cover_image_url,
              image_urls,
              status,
              is_express_30min_available
            )
          `,
        )
        .eq("vendor_id", vendorId)
        .order("updated_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return (data || []).map(mapInventoryItem);
    } catch (error) {
      console.error("[vendorInventoryService.getInventory]", error);

      throw error;
    }
  },

  /**
   * Adjust the physical on-hand quantity for a product.
   *
   * newOnHandStock is the absolute physical stock quantity,
   * not a delta.
   */
  async adjustStock({ productId, newOnHandStock, reason, batchNumber = "" }) {
    try {
      if (!productId) {
        throw new Error("Product ID is required.");
      }

      if (!reason) {
        throw new Error("Please select an adjustment reason.");
      }

      if (
        newOnHandStock === "" ||
        newOnHandStock === null ||
        newOnHandStock === undefined
      ) {
        throw new Error("Please enter the new on-hand quantity.");
      }

      const targetStock = Number(newOnHandStock);

      if (!Number.isFinite(targetStock)) {
        throw new Error("Stock quantity must be a valid number.");
      }

      if (targetStock < 0) {
        throw new Error("Stock quantity cannot be negative.");
      }

      if (!Number.isInteger(targetStock)) {
        throw new Error("Stock quantity must be a whole number.");
      }

      const vendorId = await resolveVendorProfileId();

      /*
       * Fetch the existing inventory row.
       *
       * product_id is the primary key of vendor_inventory,
       * therefore we do not use a vendor_id/product_id
       * composite upsert conflict target.
       */
      const { data: existingInventory, error: inventoryError } =
        await supabaseVendor
          .from("vendor_inventory")
          .select(
            `
              *,
              vendor_products (
                id,
                name,
                brand,
                sku,
                category_slug,
                unit,
                moq,
                cover_image_url,
                image_urls,
                status,
                is_express_30min_available
              )
            `,
          )
          .eq("product_id", productId)
          .eq("vendor_id", vendorId)
          .maybeSingle();

      if (inventoryError) {
        throw new Error(inventoryError.message);
      }

      /*
       * If inventory doesn't exist yet, verify that the product
       * belongs to this vendor before creating its inventory row.
       */
      let inventoryRow = existingInventory;

      if (!inventoryRow) {
        const { data: product, error: productError } = await supabaseVendor
          .from("vendor_products")
          .select(
            `
                id,
                vendor_id,
                name,
                brand,
                sku,
                category_slug,
                unit,
                moq,
                cover_image_url,
                image_urls,
                status,
                is_express_30min_available
              `,
          )
          .eq("id", productId)
          .eq("vendor_id", vendorId)
          .maybeSingle();

        if (productError) {
          throw new Error(productError.message);
        }

        if (!product) {
          throw new Error(
            "The selected product does not belong to this vendor.",
          );
        }

        const { data: insertedInventory, error: insertError } =
          await supabaseVendor
            .from("vendor_inventory")
            .insert({
              product_id: productId,
              vendor_id: vendorId,
              on_hand_stock: targetStock,
              reserved_stock: 0,
              low_stock_threshold: DEFAULT_LOW_STOCK_THRESHOLD,
            })
            .select(
              `
                *,
                vendor_products (
                  id,
                  name,
                  brand,
                  sku,
                  category_slug,
                  unit,
                  moq,
                  cover_image_url,
                  image_urls,
                  status,
                  is_express_30min_available
                )
              `,
            )
            .single();

        if (insertError) {
          throw new Error(insertError.message);
        }

        inventoryRow = insertedInventory;
      } else {
        const previousStock = Number(inventoryRow.on_hand_stock) || 0;

        /*
         * Update only the authoritative inventory column.
         *
         * vendor_products does NOT contain a stock column.
         */
        const { data: updatedInventory, error: updateError } =
          await supabaseVendor
            .from("vendor_inventory")
            .update({
              on_hand_stock: targetStock,
              updated_at: new Date().toISOString(),
            })
            .eq("product_id", productId)
            .eq("vendor_id", vendorId)
            .select(
              `
                *,
                vendor_products (
                  id,
                  name,
                  brand,
                  sku,
                  category_slug,
                  unit,
                  moq,
                  cover_image_url,
                  image_urls,
                  status,
                  is_express_30min_available
                )
              `,
            )
            .single();

        if (updateError) {
          throw new Error(updateError.message);
        }

        inventoryRow = updatedInventory;

        /*
         * Write an audit record for the stock adjustment.
         *
         * These fields correspond to the audit-history fields
         * already consumed by the inventory history UI/service.
         */
        const adjustmentQty = targetStock - previousStock;

        const { error: auditError } = await supabaseVendor
          .from("vendor_inventory_audit_log")
          .insert({
            vendor_id: vendorId,
            product_id: productId,
            adjustment_type: reason,
            previous_stock: previousStock,
            adjustment_qty: adjustmentQty,
            new_stock: targetStock,
            batch_ref: batchNumber?.trim() || null,
          });

        if (auditError) {
          /*
           * Roll the stock update back if the audit entry could
           * not be created, so inventory and history don't become
           * inconsistent.
           */
          await supabaseVendor
            .from("vendor_inventory")
            .update({
              on_hand_stock: previousStock,
              updated_at: new Date().toISOString(),
            })
            .eq("product_id", productId)
            .eq("vendor_id", vendorId);

          throw new Error(
            `Inventory was not updated because the audit log could not be saved: ${auditError.message}`,
          );
        }
      }

      /*
       * If this was a newly-created inventory row, there was no
       * previous row to audit above. Create its initial adjustment
       * record now.
       */
      if (!existingInventory) {
        const { error: initialAuditError } = await supabaseVendor
          .from("vendor_inventory_audit_log")
          .insert({
            vendor_id: vendorId,
            product_id: productId,
            adjustment_type: reason,
            previous_stock: 0,
            adjustment_qty: targetStock,
            new_stock: targetStock,
            batch_ref: batchNumber?.trim() || null,
          });

        if (initialAuditError) {
          /*
           * Roll back the newly created inventory row if the audit
           * record cannot be stored.
           */
          await supabaseVendor
            .from("vendor_inventory")
            .delete()
            .eq("product_id", productId)
            .eq("vendor_id", vendorId);

          throw new Error(
            `Inventory was not created because the audit log could not be saved: ${initialAuditError.message}`,
          );
        }
      }

      return {
        success: true,
        updatedItem: mapInventoryItem(inventoryRow),
      };
    } catch (error) {
      console.error("[vendorInventoryService.adjustStock]", error);

      throw error;
    }
  },

  /**
   * Fetch vendor inventory audit history.
   */
  async getInventoryHistory({ limit = 200 } = {}) {
    try {
      const vendorId = await resolveVendorProfileId();

      const { data, error } = await supabaseVendor
        .from("vendor_inventory_audit_log")
        .select(
          `
            *,
            vendor_products (
              name,
              unit,
              sku,
              brand
            )
          `,
        )
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(error.message);
      }

      return (data || []).map((historyItem) => ({
        id: historyItem.id,

        timestamp: historyItem.created_at || historyItem.updated_at || null,

        productId: historyItem.product_id,

        productName: historyItem?.vendor_products?.name || "Unknown Product",

        brand: historyItem?.vendor_products?.brand || "",

        sku: historyItem?.vendor_products?.sku || "",

        unit: historyItem?.vendor_products?.unit || "",

        reason: historyItem.adjustment_type || historyItem.reason || "OTHER",

        previousStock: Number(historyItem.previous_stock) || 0,

        changeQty: Number(
          historyItem.adjustment_qty ?? historyItem.change_qty ?? 0,
        ),

        newStock: Number(historyItem.new_stock) || 0,

        batchNumber: historyItem.batch_ref || historyItem.batch_number || "",

        adjustedBy: historyItem.adjusted_by || historyItem.user_id || "",

        originalRow: historyItem,
      }));
    } catch (error) {
      console.error("[vendorInventoryService.getInventoryHistory]", error);

      throw error;
    }
  },

  /**
   * Resolve the current vendor profile ID.
   */
  async getVendorId() {
    return resolveVendorProfileId();
  },
};
