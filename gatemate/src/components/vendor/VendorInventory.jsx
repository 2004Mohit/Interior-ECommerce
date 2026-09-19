import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Package,
  Search,
  RefreshCw,
  AlertTriangle,
  XCircle,
  Boxes,
  History,
  Edit3,
} from "lucide-react";

import { useVendorAuth } from "../../context/VendorAuthContext";
import {
  vendorInventoryService,
  STOCK_STATUS,
} from "../../services/vendorInventoryService";

import StockAdjustmentModal from "../../components/vendor/StockAdjustmentModal";
import SeoHead from "../common/SeoHead";

export const VendorInventory = () => {
  const { vendorUser } = useVendorAuth();

  const [inventory, setInventory] = useState([]);
  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("LIVE");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedProductForAdjust, setSelectedProductForAdjust] =
    useState(null);

  const loadData = useCallback(
    async ({ showRefresh = false } = {}) => {
      if (!vendorUser?.id) {
        setLoading(false);
        return;
      }

      try {
        setError("");

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const inventoryData = await vendorInventoryService.getInventory();

        setInventory(inventoryData);

        /*
         * History is loaded separately so a history issue does not
         * prevent the live inventory table from being displayed.
         */
        try {
          setHistoryLoading(true);

          const historyData =
            await vendorInventoryService.getInventoryHistory();

          setHistory(historyData);
        } catch (historyError) {
          console.error("[VendorInventory] History load failed", historyError);

          setHistory([]);
        } finally {
          setHistoryLoading(false);
        }
      } catch (err) {
        console.error("[VendorInventory] Inventory load failed", err);

        setError(err?.message || "Unable to load inventory. Please try again.");

        setInventory([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [vendorUser?.id],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredInventory = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return inventory.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        String(item.productName || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(item.brand || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(item.sku || "")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [inventory, search, statusFilter]);

  const totalSkus = inventory.length;

  const lowStockCount = inventory.filter(
    (item) => item.status === STOCK_STATUS.LOW_STOCK,
  ).length;

  const outOfStockCount = inventory.filter(
    (item) => item.status === STOCK_STATUS.OUT_OF_STOCK,
  ).length;

  const totalAvailableUnits = inventory.reduce(
    (sum, item) => sum + (Number(item.availableStock) || 0),
    0,
  );

  const handleStockAdjusted = useCallback(
    (updatedItem) => {
      if (!updatedItem?.productId) {
        loadData({ showRefresh: true });
        return;
      }

      setInventory((current) =>
        current.map((item) =>
          item.productId === updatedItem.productId
            ? {
                ...item,
                ...updatedItem,
              }
            : item,
        ),
      );

      /*
       * Refresh history after a successful adjustment.
       */
      vendorInventoryService
        .getInventoryHistory()
        .then((historyData) => {
          setHistory(historyData);
        })
        .catch((historyError) => {
          console.error(
            "[VendorInventory] History refresh failed",
            historyError,
          );
        });
    },
    [loadData],
  );

  const getStatusLabel = (status) => {
    switch (status) {
      case STOCK_STATUS.IN_STOCK:
        return "In Stock";

      case STOCK_STATUS.LOW_STOCK:
        return "Low Stock";

      case STOCK_STATUS.OUT_OF_STOCK:
        return "Out of Stock";

      default:
        return status || "Unknown";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case STOCK_STATUS.IN_STOCK:
        return "bg-emerald-50 text-emerald-700 border-emerald-200";

      case STOCK_STATUS.LOW_STOCK:
        return "bg-amber-50 text-amber-700 border-amber-200";

      case STOCK_STATUS.OUT_OF_STOCK:
        return "bg-red-50 text-red-700 border-red-200";

      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <SeoHead
        title="Inventory Management | GateMate Vendor"
        description="Manage vendor inventory, stock quantities, reservations, and inventory history."
      />

      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Depot Stock Control
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Vendor Inventory Management
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Manage physical on-hand stock, inspect order reservations, and
              monitor low-stock thresholds in real time.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadData({ showRefresh: true })}
            disabled={refreshing || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-red-800">
                Unable to load inventory
              </p>

              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-lg p-1 text-red-500 transition hover:bg-red-100"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total SKUs</p>

                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {totalSkus}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                <Boxes className="h-5 w-5 text-slate-700" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Low Stock</p>

                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {lowStockCount}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Out of Stock</p>

                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {outOfStockCount}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Available Units</p>

                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {totalAvailableUnits}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                <Package className="h-5 w-5 text-slate-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setActiveTab("LIVE")}
                className={`border-b-2 px-1 py-4 text-sm font-medium transition ${
                  activeTab === "LIVE"
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Live Inventory
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("HISTORY")}
                className={`border-b-2 px-1 py-4 text-sm font-medium transition ${
                  activeTab === "HISTORY"
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Inventory History
                </span>
              </button>
            </div>
          </div>

          {/* LIVE INVENTORY */}
          {activeTab === "LIVE" && (
            <div>
              {/* Filters */}
              <div className="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search product, brand or SKU..."
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="ALL">All Status</option>

                  <option value={STOCK_STATUS.IN_STOCK}>In Stock</option>

                  <option value={STOCK_STATUS.LOW_STOCK}>Low Stock</option>

                  <option value={STOCK_STATUS.OUT_OF_STOCK}>
                    Out of Stock
                  </option>
                </select>
              </div>

              {/* Loading */}
              {loading && (
                <div className="flex min-h-[300px] items-center justify-center">
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading inventory...
                  </div>
                </div>
              )}

              {/* Table */}
              {!loading && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1200px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70">
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Product
                        </th>

                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Category
                        </th>

                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          MOQ
                        </th>

                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          On Hand
                        </th>

                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Reserved
                        </th>

                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Available
                        </th>

                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Status
                        </th>

                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Last Updated
                        </th>

                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {filteredInventory.length === 0 && (
                        <tr>
                          <td colSpan={9} className="px-5 py-14 text-center">
                            <div className="flex flex-col items-center">
                              <Package className="h-8 w-8 text-slate-300" />

                              <p className="mt-3 text-sm font-medium text-slate-700">
                                No inventory found
                              </p>

                              <p className="mt-1 text-sm text-slate-500">
                                Try changing your search or status filter.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}

                      {filteredInventory.map((item) => (
                        <tr
                          key={item.productId}
                          className="transition hover:bg-slate-50/70"
                        >
                          {/* Product */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                                {item.img ? (
                                  <img
                                    src={item.img}
                                    alt={item.productName}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <Package className="h-5 w-5 text-slate-400" />
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-900">
                                  {item.productName}
                                </p>

                                {item.brand && (
                                  <p className="truncate text-xs text-slate-500">
                                    {item.brand}
                                  </p>
                                )}

                                {item.sku && (
                                  <p className="truncate text-xs text-slate-400">
                                    SKU: {item.sku}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="px-5 py-4 text-sm text-slate-600">
                            {item.category || "—"}
                          </td>

                          {/* MOQ */}
                          <td className="px-5 py-4 text-right">
                            <span className="text-sm font-medium text-slate-900">
                              {item.moq}
                            </span>

                            {item.unit && (
                              <span className="ml-1 text-xs text-slate-500">
                                {item.unit}
                              </span>
                            )}
                          </td>

                          {/* On hand */}
                          <td className="px-5 py-4 text-right">
                            <span className="text-sm font-semibold text-slate-900">
                              {item.onHandStock}
                            </span>

                            {item.unit && (
                              <span className="ml-1 text-xs text-slate-500">
                                {item.unit}
                              </span>
                            )}
                          </td>

                          {/* Reserved */}
                          <td className="px-5 py-4 text-right">
                            <span className="text-sm text-slate-700">
                              {item.reservedStock}
                            </span>

                            {item.unit && (
                              <span className="ml-1 text-xs text-slate-500">
                                {item.unit}
                              </span>
                            )}
                          </td>

                          {/* Available */}
                          <td className="px-5 py-4 text-right">
                            <span
                              className={`text-sm font-semibold ${
                                item.isOutOfStock
                                  ? "text-red-600"
                                  : item.isLowStock
                                    ? "text-amber-600"
                                    : "text-slate-900"
                              }`}
                            >
                              {item.availableStock}
                            </span>

                            {item.unit && (
                              <span className="ml-1 text-xs text-slate-500">
                                {item.unit}
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClass(
                                item.status,
                              )}`}
                            >
                              {getStatusLabel(item.status)}
                            </span>
                          </td>

                          {/* Updated */}
                          <td className="px-5 py-4 text-sm text-slate-500">
                            {formatDate(item.lastUpdated)}
                          </td>

                          {/* Action */}
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedProductForAdjust(item)}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              <Edit3 className="h-4 w-4" />
                              Adjust
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Footer count */}
              {!loading && filteredInventory.length > 0 && (
                <div className="border-t border-slate-200 px-5 py-4">
                  <p className="text-sm text-slate-500">
                    Showing{" "}
                    <span className="font-medium text-slate-700">
                      {filteredInventory.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-slate-700">
                      {inventory.length}
                    </span>{" "}
                    inventory items
                  </p>
                </div>
              )}
            </div>
          )}

          {/* HISTORY */}
          {activeTab === "HISTORY" && (
            <div>
              {historyLoading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading inventory history...
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70">
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Date
                        </th>

                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Product
                        </th>

                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Reason
                        </th>

                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Previous
                        </th>

                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Change
                        </th>

                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          New Stock
                        </th>

                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Batch / Reference
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {history.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-5 py-14 text-center">
                            <div className="flex flex-col items-center">
                              <History className="h-8 w-8 text-slate-300" />

                              <p className="mt-3 text-sm font-medium text-slate-700">
                                No inventory history
                              </p>

                              <p className="mt-1 text-sm text-slate-500">
                                Stock adjustments will appear here.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}

                      {history.map((historyItem) => (
                        <tr
                          key={historyItem.id}
                          className="transition hover:bg-slate-50/70"
                        >
                          <td className="px-5 py-4 text-sm text-slate-500">
                            {formatDate(historyItem.timestamp)}
                          </td>

                          <td className="px-5 py-4">
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {historyItem.productName}
                              </p>

                              {historyItem.sku && (
                                <p className="mt-0.5 text-xs text-slate-400">
                                  SKU: {historyItem.sku}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                              {historyItem.reason}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right text-sm text-slate-700">
                            {historyItem.previousStock} {historyItem.unit || ""}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <span
                              className={`text-sm font-semibold ${
                                historyItem.changeQty > 0
                                  ? "text-emerald-600"
                                  : historyItem.changeQty < 0
                                    ? "text-red-600"
                                    : "text-slate-500"
                              }`}
                            >
                              {historyItem.changeQty > 0
                                ? `+${historyItem.changeQty}`
                                : historyItem.changeQty}
                            </span>

                            {historyItem.unit && (
                              <span className="ml-1 text-xs text-slate-500">
                                {historyItem.unit}
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-right text-sm font-semibold text-slate-900">
                            {historyItem.newStock} {historyItem.unit || ""}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {historyItem.batchNumber || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={Boolean(selectedProductForAdjust)}
        onClose={() => setSelectedProductForAdjust(null)}
        product={selectedProductForAdjust}
        onStockAdjusted={handleStockAdjusted}
      />
    </>
  );
};

export default VendorInventory;
