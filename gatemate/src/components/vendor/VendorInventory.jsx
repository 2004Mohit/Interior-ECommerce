import React, { useState, useEffect } from "react";
import {
  Boxes,
  Search,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  RotateCcw,
  Filter,
  History,
  Edit2,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  FileText,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { useVendorAuth } from "../../context/VendorAuthContext";
import {
  vendorInventoryService,
  STOCK_STATUS,
} from "../../services/vendorInventoryService";
import { StockAdjustmentModal } from "./StockAdjustmentModal";
import { SeoHead } from "../common/SeoHead";

export const VendorInventory = () => {
  const { vendorUser } = useVendorAuth();
  const vendorId = vendorUser?.id || "vnd-pune-001";

  const [inventory, setInventory] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("LIVE"); // 'LIVE' | 'HISTORY'
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedProductForAdjust, setSelectedProductForAdjust] =
    useState(null);

  const loadData = async () => {
    setLoading(true);
    const [inv, hist] = await Promise.all([
      vendorInventoryService.getInventory(vendorId),
      vendorInventoryService.getInventoryHistory(vendorId),
    ]);
    setInventory(inv);
    setHistory(hist);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [vendorId]);

  const filteredInventory = inventory.filter((item) => {
    const matchSearch =
      item.productName.toLowerCase().includes(search.toLowerCase()) ||
      item.brand.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalSKUs = inventory.length;
  const lowStockCount = inventory.filter((i) => i.isLowStock).length;
  const outOfStockCount = inventory.filter((i) => i.isOutOfStock).length;
  const totalAvailableUnits = inventory.reduce(
    (acc, i) => acc + i.availableStock,
    0,
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case STOCK_STATUS.OUT_OF_STOCK:
        return (
          <span className="bg-[#FBE3DE] text-[#B43D20] border border-[#B43D20]/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit">
            <XCircle className="w-3 h-3 shrink-0" /> Out of Stock
          </span>
        );
      case STOCK_STATUS.LOW_STOCK:
        return (
          <span className="bg-[#FFF0D5] text-[#A66A08] border border-[#A66A08]/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit">
            <AlertTriangle className="w-3 h-3 shrink-0" /> Low Stock Warning
          </span>
        );
      default:
        return (
          <span className="bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3 shrink-0" /> In Stock
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-24 font-sans">
      <SeoHead
        title="Vendor Inventory Management | GateMate"
        description="Live stock adjustments, reserved quantity tracking, low-stock threshold triggers, and audit history logs."
        canonicalUrl="/vendor/inventory"
        noIndex={true}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div>
          <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Depot Stock Control
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
            Vendor Inventory Management
          </h1>
          <p className="text-xs text-[#606460]">
            Manage physical on-hand stock, inspect order reservations, and
            monitor low-stock thresholds in real time.
          </p>
        </div>

        <button
          onClick={loadData}
          className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh Inventory</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="gm-card p-5 rounded-2xl flex items-center justify-between border border-[#D9E2EA]">
          <div>
            <span className="text-[11px] font-bold text-[#6F8A92] uppercase tracking-wider">
              Total Active SKUs
            </span>
            <div className="text-2xl font-black text-[#173885] mt-1 font-mono">
              {totalSKUs}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E4EEF3] text-[#173885] flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="gm-card p-5 rounded-2xl flex items-center justify-between border border-[#D9E2EA]">
          <div>
            <span className="text-[11px] font-bold text-[#6F8A92] uppercase tracking-wider">
              Sellable Stock Volume
            </span>
            <div className="text-2xl font-black text-[#173885] mt-1 font-mono">
              {totalAvailableUnits.toLocaleString("en-IN")}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E1F2D9] text-[#3F7D20] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`gm-card p-5 rounded-2xl flex items-center justify-between border ${
            lowStockCount > 0
              ? "border-[#A66A08]/40 bg-[#FFF0D5]/30"
              : "border-[#D9E2EA]"
          }`}
        >
          <div>
            <span className="text-[11px] font-bold text-[#A66A08] uppercase tracking-wider">
              Low-Stock Warnings
            </span>
            <div className="text-2xl font-black text-[#A66A08] mt-1 font-mono">
              {lowStockCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FFF0D5] text-[#A66A08] flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`gm-card p-5 rounded-2xl flex items-center justify-between border ${
            outOfStockCount > 0
              ? "border-[#B43D20]/40 bg-[#FBE3DE]/30"
              : "border-[#D9E2EA]"
          }`}
        >
          <div>
            <span className="text-[11px] font-bold text-[#B43D20] uppercase tracking-wider">
              Out of Stock Alerts
            </span>
            <div className="text-2xl font-black text-[#B43D20] mt-1 font-mono">
              {outOfStockCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FBE3DE] text-[#B43D20] flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[#D9E2EA] pb-2">
        <button
          onClick={() => setActiveTab("LIVE")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "LIVE"
              ? "bg-[#173885] text-[#FEFEFE] shadow-xs"
              : "bg-[#FEFEFE] text-[#606460] border border-[#D9E2EA] hover:bg-[#E4EEF3]"
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Live Stock Management ({inventory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("HISTORY")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "HISTORY"
              ? "bg-[#173885] text-[#FEFEFE] shadow-xs"
              : "bg-[#FEFEFE] text-[#606460] border border-[#D9E2EA] hover:bg-[#E4EEF3]"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit History Trail ({history.length})</span>
        </button>
      </div>

      {activeTab === "LIVE" ? (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="gm-panel p-4 rounded-2xl border border-[#D9E2EA] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92] pointer-events-none" />
              <input
                type="text"
                placeholder="Search products by title, brand, or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full gm-input pl-10 pr-4 py-2 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {[
                { key: "ALL", label: "All Products" },
                { key: STOCK_STATUS.IN_STOCK, label: "In Stock" },
                { key: STOCK_STATUS.LOW_STOCK, label: "Low Stock" },
                { key: STOCK_STATUS.OUT_OF_STOCK, label: "Out of Stock" },
              ].map((pill) => (
                <button
                  key={pill.key}
                  onClick={() => setStatusFilter(pill.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    statusFilter === pill.key
                      ? "bg-[#3C7DDA] text-[#FEFEFE]"
                      : "bg-[#F4F6FA] text-[#606460] hover:bg-[#E4EEF3]"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Inventory Table */}
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="gm-panel p-5 rounded-2xl h-16 animate-pulse bg-[#E4EEF3]"
                />
              ))}
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="gm-panel p-12 text-center text-xs text-[#606460]">
              No products found matching the search and status criteria.
            </div>
          ) : (
            <div className="gm-panel rounded-2xl overflow-hidden border border-[#D9E2EA]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#E4EEF3] text-[#173885] font-bold border-b border-[#D9E2EA]">
                    <tr>
                      <th className="p-3.5">Product & SKU</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5 text-center">On-Hand Stock</th>
                      <th className="p-3.5 text-center">Reserved for Orders</th>
                      <th className="p-3.5 text-center">Available Stock</th>
                      <th className="p-3.5">Stock Status</th>
                      <th className="p-3.5">Last Updated</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9E2EA]">
                    {filteredInventory.map((item) => (
                      <tr
                        key={item.productId}
                        className="hover:bg-[#F4F6FA] transition"
                      >
                        <td className="p-3.5 flex items-center gap-3">
                          <img
                            src={item.img}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover bg-[#F4F6FA] border border-[#D9E2EA] shrink-0"
                          />
                          <div className="min-w-0 max-w-xs">
                            <div className="font-bold text-[#282926] truncate">
                              {item.productName}
                            </div>
                            <div className="text-[10px] text-[#6F8A92] font-mono">
                              {item.brand} • SKU: {item.sku}
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 font-semibold text-[#606460]">
                          {item.category}
                        </td>

                        <td className="p-3.5 text-center font-mono font-bold text-[#282926]">
                          {item.onHandStock}{" "}
                          <span className="text-[10px] text-[#606460] font-normal">
                            {item.unit}s
                          </span>
                        </td>

                        <td className="p-3.5 text-center font-mono font-bold text-[#A66A08]">
                          {item.reservedStock || 0}{" "}
                          <span className="text-[10px] text-[#606460] font-normal">
                            {item.unit}s
                          </span>
                        </td>

                        <td className="p-3.5 text-center font-mono font-black text-sm text-[#173885]">
                          {item.availableStock}{" "}
                          <span className="text-[10px] text-[#606460] font-normal">
                            {item.unit}s
                          </span>
                        </td>

                        <td className="p-3.5">{getStatusBadge(item.status)}</td>

                        <td className="p-3.5 text-[#6F8A92] text-[11px] whitespace-nowrap font-mono">
                          {new Date(item.lastUpdated).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </td>

                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedProductForAdjust(item)}
                            className="btn-gm-primary px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 shadow-xs"
                          >
                            <Edit2 className="w-3 h-3 text-[#FEFEFE]" />
                            <span>Adjust Stock</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Inventory History Audit Trail Tab */
        <div className="space-y-4">
          <div className="gm-panel rounded-2xl overflow-hidden border border-[#D9E2EA]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#E4EEF3] text-[#173885] font-bold border-b border-[#D9E2EA]">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Product</th>
                    <th className="p-3.5">Adjustment Reason</th>
                    <th className="p-3.5 text-center">Previous Stock</th>
                    <th className="p-3.5 text-center">Change Qty</th>
                    <th className="p-3.5 text-center">New On-Hand Stock</th>
                    <th className="p-3.5">Batch / Ref #</th>
                    <th className="p-3.5">Logged By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9E2EA]">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-[#F4F6FA] transition">
                      <td className="p-3.5 text-[#6F8A92] font-mono text-[11px] whitespace-nowrap">
                        {new Date(h.timestamp).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="p-3.5 font-bold text-[#282926] max-w-xs truncate">
                        {h.productName}
                      </td>

                      <td className="p-3.5 text-[#606460]">
                        <span className="font-semibold text-[#173885]">
                          {h.reason}
                        </span>
                      </td>

                      <td className="p-3.5 text-center font-mono text-[#606460]">
                        {h.previousStock} {h.unit}
                      </td>

                      <td className="p-3.5 text-center font-mono font-bold">
                        <span
                          className={`inline-flex items-center gap-0.5 ${
                            h.changeQty > 0
                              ? "text-[#3F7D20]"
                              : "text-[#B43D20]"
                          }`}
                        >
                          {h.changeQty > 0 ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          )}
                          {h.changeQty > 0 ? `+${h.changeQty}` : h.changeQty}{" "}
                          {h.unit}
                        </span>
                      </td>

                      <td className="p-3.5 text-center font-mono font-black text-[#173885]">
                        {h.newStock} {h.unit}
                      </td>

                      <td className="p-3.5 font-mono text-[11px] text-[#606460]">
                        {h.batchNumber}
                      </td>

                      <td className="p-3.5 text-[#606460]">{h.adjustedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={Boolean(selectedProductForAdjust)}
        onClose={() => setSelectedProductForAdjust(null)}
        product={selectedProductForAdjust}
        vendorId={vendorId}
        onStockAdjusted={(updatedItem) => {
          setInventory((prev) =>
            prev.map((i) =>
              i.productId === updatedItem.productId ? updatedItem : i,
            ),
          );
          loadData();
        }}
      />
    </div>
  );
};
