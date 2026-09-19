import { supabaseVendor } from "../lib/supabaseClient";

export const STOCK_STATUS = {
  IN_STOCK: "IN_STOCK",
  LOW_STOCK: "LOW_STOCK",
  OUT_OF_STOCK: "OUT_OF_STOCK",
};

/**
 * These values MUST match the database CHECK constraint:
 *
 * RESTOCK
 * CORRECTION
 * DAMAGE
 * ORDER_RESERVED
 * ORDER_FULFILLED
 * ORDER_RELEASED
 */
export const ADJUSTMENT_REASONS = {
  RESTOCK: "RESTOCK",
  CORRECTION: "CORRECTION",
  DAMAGE: "DAMAGE",
  ORDER_RESERVED: "ORDER_RESERVED",
  ORDER_FULFILLED: "ORDER_FULFILLED",
  ORDER_RELEASED: "ORDER_RELEASED",
};

/**
 * vendor_inventory.low_stock_threshold has a database default of 10.
 *
 * Keep the frontend/service fallback aligned with the database.
 */
const DEFAULT_LOW_STOCK_THRESHOLD = 10;

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

/**
 * Validate that the adjustment type is one of the values
 * explicitly permitted by the database constraint.
 */
function validateAdjustmentReason(reason) {
  const allowedReasons = Object.values(ADJUSTMENT_REASONS);

  if (!allowedReasons.includes(reason)) {
    throw new Error(
      `Invalid inventory adjustment type. Allowed types: ${allowedReasons.join(
        ", ",
      )}.`,
    );
  }
}

/**
 * Calculate inventory status from physical stock.
 *
 * Available stock is:
 *     on_hand_stock - reserved_stock
 *
 * The database guarantees:
 *     reserved_stock <= on_hand_stock
 */
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

/**
 * Convert a vendor_inventory database row into the
 * frontend inventory model.
 */
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
   * Get all inventory belonging to the currently
   * authenticated vendor.
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
   * IMPORTANT:
   * newOnHandStock is the ABSOLUTE physical stock quantity,
   * not a delta.
   *
   * Example:
   *
   * Current stock = 100
   * Enter new stock = 150
   *
   * Result:
   * previous_stock = 100
   * new_stock      = 150
   * change_quantity = +50
   */
  async adjustStock({ productId, newOnHandStock, reason, batchNumber = "" }) {
    try {
      if (!productId) {
        throw new Error("Product ID is required.");
      }

      if (!reason) {
        throw new Error("Please select an adjustment reason.");
      }

      validateAdjustmentReason(reason);

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
       * product_id is the PRIMARY KEY of vendor_inventory.
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
       * If inventory does not exist yet, verify that the
       * product belongs to the current vendor before creating it.
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

        /*
         * There cannot be any reserved stock when creating
         * a previously missing inventory row.
         */
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

        /*
         * Initial inventory creation must also be recorded
         * in the audit history.
         */
        const initialChangeQuantity = targetStock;

        const { error: initialAuditError } = await supabaseVendor
          .from("vendor_inventory_audit_log")
          .insert({
            vendor_id: vendorId,
            product_id: productId,
            adjustment_type: reason,
            previous_stock: 0,
            change_quantity: initialChangeQuantity,
            new_stock: targetStock,
            batch_number: batchNumber?.trim() || null,
            reason:
              batchNumber?.trim() || `Initial inventory adjustment: ${reason}`,
          });

        if (initialAuditError) {
          /*
           * Remove the inventory row if the audit record could
           * not be created.
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
      } else {
        const previousStock = Number(inventoryRow.on_hand_stock) || 0;

        const reservedStock = Number(inventoryRow.reserved_stock) || 0;

        /*
         * HARD BUSINESS RULE:
         *
         * On Hand can NEVER be lower than Reserved.
         *
         * Example:
         * On Hand = 100
         * Reserved = 30
         *
         * Minimum valid new On Hand = 30.
         */
        if (targetStock < reservedStock) {
          throw new Error(
            `Cannot reduce on-hand stock to ${targetStock}. ${reservedStock} units are currently reserved. The minimum on-hand stock is ${reservedStock}.`,
          );
        }

        /*
         * No actual stock change.
         *
         * Avoid creating meaningless audit records.
         */
        if (targetStock === previousStock) {
          return {
            success: true,
            updatedItem: mapInventoryItem(inventoryRow),
            unchanged: true,
          };
        }

        /*
         * Update ONLY vendor_inventory.
         *
         * vendor_products does not contain physical stock.
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
          /*
           * Supabase may reject this because of the database
           * constraint chk_reserved_not_exceed_on_hand.
           */
          if (
            String(updateError.message || "")
              .toLowerCase()
              .includes("reserved")
          ) {
            throw new Error(
              `Stock update rejected because on-hand stock cannot be lower than reserved stock (${reservedStock}).`,
            );
          }

          throw new Error(updateError.message);
        }

        inventoryRow = updatedInventory;

        /*
         * Calculate the actual physical change.
         */
        const changeQuantity = targetStock - previousStock;

        /*
         * Write the audit record using the ACTUAL database
         * column names:
         *
         * change_quantity
         * batch_number
         */
        const { error: auditError } = await supabaseVendor
          .from("vendor_inventory_audit_log")
          .insert({
            vendor_id: vendorId,
            product_id: productId,
            adjustment_type: reason,
            previous_stock: previousStock,
            change_quantity: changeQuantity,
            new_stock: targetStock,
            batch_number: batchNumber?.trim() || null,
            reason: batchNumber?.trim() || `Inventory adjustment: ${reason}`,
          });

        if (auditError) {
          /*
           * Attempt to restore the previous stock if the
           * audit record fails.
           *
           * NOTE:
           * A dedicated database RPC can later make this
           * operation fully atomic.
           */
          const { error: rollbackError } = await supabaseVendor
            .from("vendor_inventory")
            .update({
              on_hand_stock: previousStock,
              updated_at: new Date().toISOString(),
            })
            .eq("product_id", productId)
            .eq("vendor_id", vendorId);

          if (rollbackError) {
            console.error(
              "[vendorInventoryService.adjustStock] Rollback failed",
              rollbackError,
            );

            throw new Error(
              `Inventory changed but the audit log failed, and automatic rollback also failed. Please verify inventory for this product immediately. Audit error: ${auditError.message}`,
            );
          }

          throw new Error(
            `Inventory was not updated because the audit log could not be saved: ${auditError.message}`,
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

      const safeLimit = Math.min(Math.max(Number(limit) || 200, 1), 500);

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
        .limit(safeLimit);

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

        /*
         * adjustment_type is the authoritative reason/type
         * column in the database.
         */
        reason: historyItem.adjustment_type || "CORRECTION",

        adjustmentType: historyItem.adjustment_type || "CORRECTION",

        previousStock: Number(historyItem.previous_stock) || 0,

        /*
         * Correct database column:
         * change_quantity
         */
        changeQty: Number(historyItem.change_quantity) || 0,

        newStock: Number(historyItem.new_stock) || 0,

        /*
         * Correct database column:
         * batch_number
         */
        batchNumber: historyItem.batch_number || "",

        adjustedBy: historyItem.adjusted_by || "Operations",

        /*
         * reason is a separate NOT NULL database field.
         */
        adjustmentReason: historyItem.reason || "",

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
