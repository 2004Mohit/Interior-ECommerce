import React, { useState, useEffect } from "react";
import {
  Boxes,
  Search,
  Filter,
  RotateCcw,
  AlertTriangle,
  Building2,
  History,
  Package,
  Edit3,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { adminInventoryService } from "../../services/adminInventoryService";
import { AdminPermissionGuard } from "./AdminPermissionGuard";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";
import { SeoHead } from "../common/SeoHead";

const STOCK_FILTERS = [
  { label: "All Inventory", value: "ALL" },
  { label: "Low Stock", value: "LOW_STOCK" },
  { label: "Out of Stock", value: "OUT_OF_STOCK" },
  { label: "Discrepancies (Over-Reserved)", value: "DISCREPANCY" },
];

export const AdminInventoryView = () => {
  const [inventory, setInventory] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Adjustment Modal State
  const [adjustingItem, setAdjustingItem] = useState(null);
  const [newStock, setNewStock] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // History Drawer State
  const [historyItem, setHistoryItem] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminInventoryService.getInventoryOversight({
        search,
        stockFilter,
        limit: 100,
      });
      setInventory(res.inventory);
      setTotalCount(res.totalCount);
    } catch (err) {
      setError(err.message || "Failed to load platform inventory data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [stockFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenAdjustModal = (item) => {
    setAdjustingItem(item);
    setNewStock(String(item.on_hand_stock || 0));
    setAdjustReason("");
    setError(null);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustReason.trim()) {
      setError("An adjustment reason is strictly required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await adminInventoryService.adjustInventory({
        inventoryId: adjustingItem.id,
        newOnHandStock: newStock,
        reason: adjustReason,
      });

      setActionSuccess(
        `Stock for "${adjustingItem.product?.name}" adjusted to ${newStock} units.`,
      );
      setAdjustingItem(null);
      loadData();
    } catch (err) {
      setError(err.message || "Failed to apply inventory adjustment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenHistory = async (item) => {
    setHistoryItem(item);
    setLoadingHistory(true);
    try {
      const logs = await adminInventoryService.getInventoryAuditHistory(
        item.product_id,
      );
      setAuditLogs(logs);
    } catch (err) {
      console.warn("Audit history lookup failed:", err);
      setAuditLogs([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "DISCREPANCY":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FBE3DE] text-[#B43D20] border border-[#B43D20]/30 animate-pulse">
            DISCREPANCY
          </span>
        );
      case "OUT_OF_STOCK":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FBE3DE] text-[#B43D20] border border-[#B43D20]/30">
            OUT OF STOCK
          </span>
        );
      case "LOW_STOCK":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FFF0D5] text-[#A66A08] border border-[#A66A08]/30">
            LOW STOCK
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30">
            HEALTHY
          </span>
        );
    }
  };

  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.MANAGE_INVENTORY}>
      <div className="space-y-6 pb-20 font-sans">
        <SeoHead
          title="Platform Inventory Oversight | GateMate Admin"
          description="Platform-wide visibility into vendor product inventory, reserved stock, out-of-stock states, and administrative adjustments."
          canonicalUrl="/admin/inventory"
          noIndex={true}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
          <div>
            <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Stock & Supply Telemetry
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
              Platform Inventory Oversight
            </h1>
            <p className="text-xs text-[#606460]">
              Audit vendor product availability, reserved delivery allocations,
              low-stock thresholds, and investigation history.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RotateCcw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Toolbar */}
        <div className="gm-panel p-4 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-2xs">
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1 max-w-md"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92]" />
            <input
              type="text"
              placeholder="Search product name, brand, SKU, or vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full gm-input pl-10 pr-20 py-2 rounded-xl text-xs"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 btn-gm-primary px-3 py-1 rounded-lg text-xs font-bold"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <Filter className="w-3.5 h-3.5 text-[#6F8A92] shrink-0 mr-1" />
            {STOCK_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setStockFilter(f.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                  stockFilter === f.value
                    ? "bg-[#173885] text-[#FEFEFE] shadow-xs"
                    : "bg-[#F4F6FA] text-[#606460] hover:bg-[#E4EEF3] hover:text-[#173885]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Inventory Master Table */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-[#FEFEFE] rounded-2xl border border-[#D9E2EA]"
              />
            ))}
          </div>
        ) : inventory.length === 0 ? (
          <div className="gm-panel p-12 rounded-3xl border border-[#D9E2EA] text-center space-y-2 bg-[#FEFEFE]">
            <Boxes className="w-10 h-10 text-[#6F8A92] mx-auto" />
            <h2 className="text-base font-bold text-[#173885]">
              No Inventory Records Found
            </h2>
            <p className="text-xs text-[#606460]">
              No items match the selected stock status filter.
            </p>
          </div>
        ) : (
          <div className="gm-panel rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F6FA] border-b border-[#D9E2EA] text-[10px] font-bold uppercase text-[#6F8A92]">
                  <tr>
                    <th className="p-4">Product Details</th>
                    <th className="p-4">Vendor</th>
                    <th className="p-4">On-Hand Stock</th>
                    <th className="p-4">Reserved Allocation</th>
                    <th className="p-4">Net Available</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Last Update</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9E2EA]">
                  {inventory.map((item) => {
                    const unit = item.product?.unit || "Unit";
                    const coverImg =
                      item.product?.cover_image_url ||
                      (Array.isArray(item.product?.image_urls)
                        ? item.product.image_urls[0]
                        : null);

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-[#F4F6FA]/50 transition"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#F4F6FA] border border-[#D9E2EA] overflow-hidden shrink-0 flex items-center justify-center">
                              {coverImg ? (
                                <img
                                  src={coverImg}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-4 h-4 text-[#6F8A92]" />
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-[#173885] block">
                                {item.product?.name || "Unnamed Product"}
                              </span>
                              <span className="text-[11px] text-[#606460]">
                                Brand: {item.product?.brand || "Generic"}{" "}
                                {item.product?.sku
                                  ? `• SKU: ${item.product.sku}`
                                  : ""}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="font-semibold text-[#282926] block">
                            {item.vendor?.business_name || "Vendor Partner"}
                          </span>
                          <span className="text-[10px] text-[#6F8A92]">
                            {item.vendor?.locality || "Pune"},{" "}
                            {item.vendor?.city || "MH"}
                          </span>
                        </td>

                        <td className="p-4 font-mono font-bold text-[#282926]">
                          {item.on_hand_stock} {unit}
                        </td>

                        <td className="p-4 font-mono font-bold text-[#A66A08]">
                          {item.reserved_stock} {unit}
                        </td>

                        <td className="p-4 font-mono">
                          <span
                            className={`font-bold ${
                              item.availableStock <= 0
                                ? "text-[#B43D20]"
                                : item.availableStock <=
                                    item.low_stock_threshold
                                  ? "text-[#A66A08]"
                                  : "text-[#3F7D20]"
                            }`}
                          >
                            {item.availableStock} {unit}
                          </span>
                        </td>

                        <td className="p-4">
                          {getStatusBadge(item.stockStatus)}
                        </td>

                        <td className="p-4 font-mono text-[11px] text-[#6F8A92]">
                          {new Date(
                            item.updated_at || item.created_at,
                          ).toLocaleString("en-IN")}
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenAdjustModal(item)}
                              className="p-1.5 rounded-lg border border-[#3C7DDA]/30 text-[#3C7DDA] hover:bg-[#E4EEF3] transition"
                              title="Investigate & Adjust Stock"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenHistory(item)}
                              className="p-1.5 rounded-lg border border-[#D9E2EA] text-[#606460] hover:text-[#173885] hover:bg-[#E4EEF3] transition"
                              title="View Stock Audit History"
                            >
                              <History className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Adjust Stock Modal */}
        {adjustingItem && (
          <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-md p-6 sm:p-8 rounded-3xl relative shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-[#D9E2EA] pb-3">
                <div>
                  <h3 className="text-lg font-black text-[#173885]">
                    Admin Stock Adjustment
                  </h3>
                  <span className="text-xs text-[#606460]">
                    {adjustingItem.product?.name}
                  </span>
                </div>
                <button
                  onClick={() => setAdjustingItem(null)}
                  className="text-[#606460] hover:text-[#282926]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F4F6FA] text-xs space-y-1">
                <div>
                  <strong className="text-[#282926]">Vendor:</strong>{" "}
                  {adjustingItem.vendor?.business_name}
                </div>
                <div>
                  <strong className="text-[#282926]">Current On-Hand:</strong>{" "}
                  <span className="font-mono font-bold text-[#173885]">
                    {adjustingItem.on_hand_stock} {adjustingItem.product?.unit}
                  </span>
                </div>
                <div>
                  <strong className="text-[#282926]">
                    Active Reservations:
                  </strong>{" "}
                  <span className="font-mono text-[#A66A08]">
                    {adjustingItem.reserved_stock} {adjustingItem.product?.unit}
                  </span>
                </div>
              </div>

              <form onSubmit={handleAdjustSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    New Total On-Hand Stock *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Investigation / Adjustment Reason *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide official reason (e.g., Physical depot count discrepancy verification)..."
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full gm-input p-3 rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAdjustingItem(null)}
                    disabled={submitting}
                    className="btn-gm-secondary px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-gm-primary px-5 py-2 rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
                  >
                    <span>
                      {submitting ? "Applying..." : "Apply Stock Correction"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* History Audit Drawer / Modal */}
        {historyItem && (
          <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-2xl p-6 sm:p-8 rounded-3xl relative shadow-2xl max-h-[85vh] overflow-y-auto space-y-4">
              <div className="flex justify-between items-center border-b border-[#D9E2EA] pb-3">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-[#3C7DDA]" />
                  <div>
                    <h3 className="text-lg font-black text-[#173885]">
                      Stock Audit Ledger
                    </h3>
                    <span className="text-xs text-[#606460]">
                      {historyItem.product?.name}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setHistoryItem(null)}
                  className="text-[#606460] hover:text-[#282926]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingHistory ? (
                <div className="p-8 text-center text-xs font-bold text-[#173885] animate-pulse">
                  Loading stock audit history...
                </div>
              ) : auditLogs.length === 0 ? (
                <p className="text-xs text-[#606460] py-8 text-center">
                  No stock adjustment entries recorded for this product.
                </p>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-2xl border border-[#D9E2EA] bg-[#F4F6FA] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#173885]">
                            {log.change_type}
                          </span>
                          <span className="text-[10px] font-mono text-[#6F8A92]">
                            {new Date(log.created_at).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <p className="text-[#606460]">
                          <strong>Reason:</strong> {log.reason || "N/A"}
                        </p>
                      </div>

                      <div className="font-mono text-right shrink-0">
                        <span className="text-[10px] text-[#6F8A92] block">
                          Previous: {log.previous_stock} → New: {log.new_stock}
                        </span>
                        <span
                          className={`font-bold ${log.quantity_delta >= 0 ? "text-[#3F7D20]" : "text-[#B43D20]"}`}
                        >
                          {log.quantity_delta >= 0
                            ? `+${log.quantity_delta}`
                            : log.quantity_delta}{" "}
                          Units
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminPermissionGuard>
  );
};
