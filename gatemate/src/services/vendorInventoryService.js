/**
 * GateMate Authoritative Vendor Inventory Management Service
 *
 * Inventory Model:
 * - onHandStock: Physical inventory in vendor yard/depot
 * - reservedStock: Committed to active customer checkout/unfulfilled dispatch orders
 * - availableStock: Authoritative sellable stock (onHandStock - reservedStock)
 * - lowStockThreshold: Dynamic trigger value for low-stock warnings
 * - Stock States: IN_STOCK | LOW_STOCK | OUT_OF_STOCK
 * - Audit Trail: Detailed history of manual adjustments and order reservations
 */

import { supabase } from "../lib/supabaseClient";

export const STOCK_STATUS = {
  IN_STOCK: "IN_STOCK",
  LOW_STOCK: "LOW_STOCK",
  OUT_OF_STOCK: "OUT_OF_STOCK",
};

export const ADJUSTMENT_REASONS = {
  RESTOCK: "Depot Batch Restock / Inward Goods",
  CORRECTION: "Physical Yard Audit / Inventory Correction",
  DAMAGE: "Damaged / Expired Batch Write-off",
  ORDER_FULFILLED: "Order Dispatched & Deducted",
  MANUAL_ADJUSTMENT: "Manual Stock Level Adjustment",
};

const INVENTORY_STORAGE_KEY = "gatemate_vendor_inventory_items_";
const INVENTORY_HISTORY_KEY = "gatemate_vendor_inventory_history_";

const SEED_INVENTORY_ITEMS = [
  {
    productId: "vp-001",
    vendorId: "vnd-pune-001",
    productName: "UltraTech Super Weather-Shield PPC Cement (50 kg Bag)",
    brand: "UltraTech",
    category: "Cement",
    unit: "bag",
    sku: "ULT-PPC-50KG",
    onHandStock: 500,
    reservedStock: 25,
    lowStockThreshold: 50,
    moq: 10,
    unitPrice: 385,
    lastUpdated: "2026-09-10T14:30:00Z",
    img: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80",
  },
  {
    productId: "vp-002",
    vendorId: "vnd-pune-001",
    productName:
      "Tata Tiscon 550D High Ductility Earthquake Resistant TMT Rebar (12mm)",
    brand: "Tata Tiscon",
    category: "Steel & TMT",
    unit: "piece",
    sku: "TAT-TMT-12MM-550D",
    onHandStock: 220,
    reservedStock: 10,
    lowStockThreshold: 30,
    moq: 5,
    unitPrice: 840,
    lastUpdated: "2026-09-08T11:00:00Z",
    img: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80",
  },
  {
    productId: "vp-003",
    vendorId: "vnd-pune-001",
    productName:
      "Siporex Lightweight Autoclaved Aerated Concrete AAC Block (600x200x150mm)",
    brand: "Siporex",
    category: "Bricks & Blocks",
    unit: "piece",
    sku: "SIP-AAC-150MM",
    onHandStock: 45,
    reservedStock: 0,
    lowStockThreshold: 100, // Trigger low stock state (45 <= 100)
    moq: 50,
    unitPrice: 72,
    lastUpdated: "2026-09-09T09:15:00Z",
    img: "https://images.unsplash.com/photo-1584463623578-301147571343?auto=format&fit=crop&w=800&q=80",
  },
  {
    productId: "vp-004",
    vendorId: "vnd-pune-001",
    productName:
      "Washed Manufactured Sand (M-Sand) for RCC Concreting (1 Brass / 100 Cu Ft)",
    brand: "Sahyadri Aggregates",
    category: "Sand & Aggregates",
    unit: "ton",
    sku: "SAH-MSAND-1BRS",
    onHandStock: 40,
    reservedStock: 5,
    lowStockThreshold: 10,
    moq: 1,
    unitPrice: 3600,
    lastUpdated: "2026-09-09T16:00:00Z",
    img: "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=800&q=80",
  },
  {
    productId: "vp-005",
    vendorId: "vnd-pune-001",
    productName:
      "Heavy Galvanized Corrugated Steel Roofing Profile Sheet (10x3.5 ft)",
    brand: "JSW Colouron",
    category: "Roofing",
    unit: "sheet",
    sku: "JSW-ROOF-10FT",
    onHandStock: 0, // Trigger out of stock state
    reservedStock: 0,
    lowStockThreshold: 15,
    moq: 10,
    unitPrice: 980,
    lastUpdated: "2026-09-10T11:00:00Z",
    img: "https://images.unsplash.com/photo-1632759145351-1d592919f522?auto=format&fit=crop&w=800&q=80",
  },
];

const SEED_INVENTORY_HISTORY = [
  {
    id: "hist-001",
    productId: "vp-001",
    productName: "UltraTech Super Weather-Shield PPC Cement (50 kg Bag)",
    vendorId: "vnd-pune-001",
    adjustmentType: "RESTOCK",
    reason: ADJUSTMENT_REASONS.RESTOCK,
    previousStock: 200,
    changeQty: 300,
    newStock: 500,
    unit: "bag",
    batchNumber: "UT-MH-2026-B84",
    adjustedBy: "Suresh Patil (Depot Manager)",
    timestamp: "2026-09-10T14:30:00Z",
  },
  {
    id: "hist-002",
    productId: "vp-003",
    productName:
      "Siporex Lightweight Autoclaved Aerated Concrete AAC Block (600x200x150mm)",
    vendorId: "vnd-pune-001",
    adjustmentType: "ORDER_FULFILLED",
    reason: ADJUSTMENT_REASONS.ORDER_FULFILLED,
    previousStock: 145,
    changeQty: -100,
    newStock: 45,
    unit: "piece",
    batchNumber: "ORD-GM-20260908",
    adjustedBy: "Automated Dispatch System",
    timestamp: "2026-09-09T09:15:00Z",
  },
];

export const vendorInventoryService = {
  /**
   * Evaluates authoritative stock state based on on-hand, reserved, and threshold parameters.
   */
  calculateStockState(onHandStock, reservedStock = 0, lowStockThreshold = 10) {
    const available = Math.max(0, onHandStock - reservedStock);
    if (available === 0) {
      return {
        status: STOCK_STATUS.OUT_OF_STOCK,
        availableStock: 0,
        isLowStock: false,
        isOutOfStock: true,
      };
    }
    if (available <= lowStockThreshold) {
      return {
        status: STOCK_STATUS.LOW_STOCK,
        availableStock: available,
        isLowStock: true,
        isOutOfStock: false,
      };
    }
    return {
      status: STOCK_STATUS.IN_STOCK,
      availableStock: available,
      isLowStock: false,
      isOutOfStock: false,
    };
  },

  /**
   * Fetches the complete vendor inventory list with authoritative calculated stock states.
   */
  async getInventory(vendorId = "vnd-pune-001") {
    await new Promise((resolve) => setTimeout(resolve, 80));

    try {
      const { data, error } = await supabase
        .from("vendor_inventory")
        .select("*")
        .eq("vendor_id", vendorId);

      if (data && !error && data.length > 0) {
        return data.map((item) => {
          const state = this.calculateStockState(
            item.on_hand_stock,
            item.reserved_stock,
            item.low_stock_threshold,
          );
          return {
            productId: item.product_id,
            vendorId: item.vendor_id,
            productName: item.product_name,
            brand: item.brand,
            category: item.category,
            unit: item.unit,
            sku: item.sku,
            onHandStock: item.on_hand_stock,
            reservedStock: item.reserved_stock || 0,
            availableStock: state.availableStock,
            lowStockThreshold: item.low_stock_threshold,
            status: state.status,
            isLowStock: state.isLowStock,
            isOutOfStock: state.isOutOfStock,
            moq: item.moq || 1,
            unitPrice: item.unit_price,
            lastUpdated: item.updated_at || item.last_updated,
            img: item.img,
          };
        });
      }
    } catch (e) {
      console.warn("Supabase inventory query fallback to local cache", e);
    }

    const localRaw = localStorage.getItem(
      `${INVENTORY_STORAGE_KEY}${vendorId}`,
    );
    const items = localRaw ? JSON.parse(localRaw) : SEED_INVENTORY_ITEMS;

    return items.map((item) => {
      const state = this.calculateStockState(
        item.onHandStock,
        item.reservedStock,
        item.lowStockThreshold,
      );
      return {
        ...item,
        availableStock: state.availableStock,
        status: state.status,
        isLowStock: state.isLowStock,
        isOutOfStock: state.isOutOfStock,
      };
    });
  },

  /**
   * Adjusts stock level for a vendor product, logs an audit history entry, and updates local/Supabase records.
   */
  async adjustStock({
    vendorId = "vnd-pune-001",
    productId,
    newOnHandStock,
    reason = ADJUSTMENT_REASONS.RESTOCK,
    batchNumber = "",
    adjustedBy = "Depot Operations",
  }) {
    if (
      newOnHandStock === undefined ||
      newOnHandStock < 0 ||
      isNaN(Number(newOnHandStock))
    ) {
      throw new Error(
        "Please enter a valid non-negative physical stock quantity.",
      );
    }

    const inventory = await this.getInventory(vendorId);
    const existing = inventory.find((i) => i.productId === productId);
    if (!existing) throw new Error("Product not found in vendor inventory.");

    const previousStock = existing.onHandStock;
    const targetStock = Number(newOnHandStock);
    const changeQty = targetStock - previousStock;
    const timestamp = new Date().toISOString();

    const updatedInventory = inventory.map((item) => {
      if (item.productId === productId) {
        const state = this.calculateStockState(
          targetStock,
          item.reservedStock,
          item.lowStockThreshold,
        );
        return {
          ...item,
          onHandStock: targetStock,
          availableStock: state.availableStock,
          status: state.status,
          isLowStock: state.isLowStock,
          isOutOfStock: state.isOutOfStock,
          lastUpdated: timestamp,
        };
      }
      return item;
    });

    localStorage.setItem(
      `${INVENTORY_STORAGE_KEY}${vendorId}`,
      JSON.stringify(updatedInventory),
    );

    // Append Audit Trail History
    const historyEntry = {
      id: `hist-${Date.now()}`,
      productId,
      productName: existing.productName,
      vendorId,
      adjustmentType: changeQty >= 0 ? "RESTOCK" : "DEDUCTION",
      reason,
      previousStock,
      changeQty,
      newStock: targetStock,
      unit: existing.unit,
      batchNumber: batchNumber.trim() || "N/A",
      adjustedBy,
      timestamp,
    };

    const history = await this.getInventoryHistory(vendorId);
    const updatedHistory = [historyEntry, ...history];
    localStorage.setItem(
      `${INVENTORY_HISTORY_KEY}${vendorId}`,
      JSON.stringify(updatedHistory),
    );

    // Optional Supabase persistence
    try {
      await supabase.from("vendor_inventory").upsert({
        product_id: productId,
        vendor_id: vendorId,
        on_hand_stock: targetStock,
        updated_at: timestamp,
      });
      await supabase.from("vendor_inventory_audit_log").insert({
        product_id: productId,
        vendor_id: vendorId,
        previous_stock: previousStock,
        new_stock: targetStock,
        change_quantity: changeQty,
        reason,
        batch_number: batchNumber,
        created_at: timestamp,
      });
    } catch (e) {
      console.warn("Persisted stock adjustment locally", e);
    }

    return {
      updatedItem: updatedInventory.find((i) => i.productId === productId),
      historyEntry,
    };
  },

  /**
   * Fetches the complete inventory change history / audit trail for a vendor.
   */
  async getInventoryHistory(vendorId = "vnd-pune-001") {
    await new Promise((resolve) => setTimeout(resolve, 60));

    try {
      const { data, error } = await supabase
        .from("vendor_inventory_audit_log")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false });

      if (data && !error && data.length > 0) {
        return data.map((d) => ({
          id: d.id,
          productId: d.product_id,
          productName: d.product_name || "Construction Product",
          vendorId: d.vendor_id,
          adjustmentType: d.change_quantity >= 0 ? "RESTOCK" : "DEDUCTION",
          reason: d.reason,
          previousStock: d.previous_stock,
          changeQty: d.change_quantity,
          newStock: d.new_stock,
          unit: d.unit || "units",
          batchNumber: d.batch_number || "N/A",
          adjustedBy: d.adjusted_by || "Operations",
          timestamp: d.created_at,
        }));
      }
    } catch (e) {
      console.warn("Audit history query fallback", e);
    }

    const localRaw = localStorage.getItem(
      `${INVENTORY_HISTORY_KEY}${vendorId}`,
    );
    return localRaw ? JSON.parse(localRaw) : SEED_INVENTORY_HISTORY;
  },
};
