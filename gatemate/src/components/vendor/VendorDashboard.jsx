import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Zap,
  FileText,
  Boxes,
  CreditCard,
  Banknote,
  Plus,
  Package,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  ExternalLink,
  Eye,
  ChevronRight,
} from "lucide-react";
import { useVendorAuth } from "../../context/VendorAuthContext";
import { vendorDashboardService } from "../../services/vendorDashboardService";
import { vendorOrderStateMachine } from "../../services/vendorOrderStateMachine";
import { RFQ_STATUS_CONFIG } from "../../services/vendorRfqService";
import { PRODUCT_APPROVAL_STATUS } from "../../services/vendorProductService";
import { StockAdjustmentModal } from "./StockAdjustmentModal";
import { SeoHead } from "../common/SeoHead";

export const VendorDashboard = () => {
  const { vendorUser } = useVendorAuth();
  const vendorId = vendorUser?.id || "vnd-pune-001";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adjustingProduct, setAdjustingProduct] = useState(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await vendorDashboardService.getDashboardOverview(vendorId);
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [vendorId]);

  if (loading) {
    return (
      <div className="space-y-6 pb-24 font-sans animate-pulse">
        <div className="h-6 bg-[#E4EEF3] rounded w-1/4" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="gm-panel p-5 rounded-2xl h-24 bg-[#FEFEFE]"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-[#FEFEFE] rounded-3xl border border-[#D9E2EA]" />
          <div className="h-64 bg-[#FEFEFE] rounded-3xl border border-[#D9E2EA]" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4 font-sans">
        <AlertCircle className="w-12 h-12 text-[#B43D20] mx-auto" />
        <h2 className="text-xl font-black text-[#173885]">
          Dashboard Unavailable
        </h2>
        <p className="text-xs text-[#606460]">
          {error || "Unable to connect to vendor operational services."}
        </p>
        <button
          onClick={loadDashboard}
          className="btn-gm-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold"
        >
          <RotateCcw className="w-4 h-4 text-[#FEFEFE]" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  const { metrics, actionQueues } = data;

  return (
    <div className="space-y-8 pb-24 font-sans">
      <SeoHead
        title="Vendor Terminal Dashboard | GateMate"
        description="Actionable operational dashboard for site orders, gross sales, commercial RFQs, and inventory warnings."
        canonicalUrl="/vendor/dashboard"
        noIndex={true}
      />

      {/* Top Header & Fast Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-[#173885]">
              Vendor Terminal Dashboard
            </h1>
            <span className="badge-gm-success px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Live Terminal
            </span>
          </div>
          <p className="text-xs text-[#606460] mt-0.5">
            Operational overview for{" "}
            <strong>
              {vendorUser?.businessName || "Pune Infrastructure Supplies Depot"}
            </strong>
          </p>
        </div>

        <button
          onClick={loadDashboard}
          className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start lg:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh Terminal</span>
        </button>
      </div>

      {/* Quick Action Bar */}
      <div className="gm-panel p-4 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F8A92] block px-1">
          Quick Actions
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          <Link
            to="/vendor/products/new"
            className="btn-gm-primary p-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm text-center"
          >
            <Plus className="w-3.5 h-3.5 text-[#FEFEFE]" />
            <span>Add Product</span>
          </Link>

          <Link
            to="/vendor/products"
            className="btn-gm-secondary p-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 text-center"
          >
            <Package className="w-3.5 h-3.5 text-[#173885]" />
            <span>Manage Products</span>
          </Link>

          <Link
            to="/vendor/inventory"
            className="btn-gm-secondary p-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 text-center"
          >
            <Boxes className="w-3.5 h-3.5 text-[#173885]" />
            <span>Update Inventory</span>
          </Link>

          <Link
            to="/vendor/orders"
            className="btn-gm-secondary p-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 text-center"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-[#173885]" />
            <span>View Orders</span>
          </Link>

          <Link
            to="/vendor/rfqs"
            className="btn-gm-secondary p-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 text-center"
          >
            <FileText className="w-3.5 h-3.5 text-[#173885]" />
            <span>View RFQs</span>
          </Link>

          <Link
            to="/vendor/settlements"
            className="btn-gm-secondary p-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 text-center"
          >
            <Banknote className="w-3.5 h-3.5 text-[#173885]" />
            <span>View Settlements</span>
          </Link>
        </div>
      </div>

      {/* 8 Primary Actionable KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Today's Orders */}
        <Link
          to="/vendor/orders"
          className="gm-card gm-card-hover p-4 sm:p-5 rounded-2xl flex flex-col justify-between border border-[#D9E2EA]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6F8A92] uppercase tracking-wider">
              Today's Orders
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#E4EEF3] text-[#173885] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-[#173885] font-mono">
              {metrics?.todayOrdersCount || 0}
            </div>
            <span className="text-[10px] text-[#606460] mt-0.5 block">
              ₹{Number(metrics?.todayOrdersAmount || 0).toLocaleString("en-IN")}{" "}
              booked today
            </span>
          </div>
        </Link>

        {/* 2. Pending Orders */}
        <Link
          to="/vendor/orders"
          className="gm-card gm-card-hover p-4 sm:p-5 rounded-2xl flex flex-col justify-between border border-[#D9E2EA] bg-[#E3EBFA]/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#173885] uppercase tracking-wider">
              Pending Orders
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#173885] text-[#FEFEFE] flex items-center justify-center font-bold font-mono text-xs">
              {metrics.pendingOrdersCount}
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-[#173885] font-mono">
              {metrics.pendingOrdersCount}
            </div>
            <span className="text-[10px] text-[#3C7DDA] font-semibold mt-0.5 block">
              Requires active dispatch action
            </span>
          </div>
        </Link>

        {/* 3. Gross Sales */}
        <Link
          to="/vendor/payments"
          className="gm-card gm-card-hover p-4 sm:p-5 rounded-2xl flex flex-col justify-between border border-[#D9E2EA]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6F8A92] uppercase tracking-wider">
              Gross Sales
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#E4EEF3] text-[#173885] flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-[#173885] font-mono">
              ₹
              {Number(metrics?.grossVolume || 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </div>
            <span className="text-[10px] text-[#606460] mt-0.5 block">
              Total Product Subtotals
            </span>
          </div>
        </Link>

        {/* 4. Net Revenue (After 5% GateMate Commission) */}
        <Link
          to="/vendor/payments"
          className="gm-card gm-card-hover p-4 sm:p-5 rounded-2xl flex flex-col justify-between border border-[#D9E2EA] bg-[#E1F2D9]/30"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#3F7D20] uppercase tracking-wider">
              Net Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#E1F2D9] text-[#3F7D20] flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-[#3F7D20] font-mono">
              ₹
              {Number(metrics?.netRevenue || 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </div>
            <span className="text-[10px] text-[#3F7D20] font-semibold mt-0.5 block">
              After 5% platform commission
            </span>
          </div>
        </Link>

        {/* 5. Inventory Alerts */}
        <Link
          to="/vendor/inventory"
          className={`gm-card gm-card-hover p-4 sm:p-5 rounded-2xl flex flex-col justify-between border ${
            metrics.inventoryAlertsCount > 0
              ? "border-[#A66A08]/40 bg-[#FFF0D5]/30"
              : "border-[#D9E2EA]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#A66A08] uppercase tracking-wider">
              Inventory Alerts
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FFF0D5] text-[#A66A08] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-[#A66A08] font-mono">
              {metrics.inventoryAlertsCount}
            </div>
            <span className="text-[10px] text-[#606460] mt-0.5 block">
              Low / Out-of-Stock SKUs
            </span>
          </div>
        </Link>

        {/* 6. Completed Orders */}
        <Link
          to="/vendor/orders"
          className="gm-card gm-card-hover p-4 sm:p-5 rounded-2xl flex flex-col justify-between border border-[#D9E2EA]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6F8A92] uppercase tracking-wider">
              Completed Orders
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#E1F2D9] text-[#3F7D20] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-[#173885] font-mono">
              {metrics.completedOrdersCount}
            </div>
            <span className="text-[10px] text-[#606460] mt-0.5 block">
              Fulfilled and delivered
            </span>
          </div>
        </Link>

        {/* 7. Pending Settlements */}
        <Link
          to="/vendor/settlements"
          className="gm-card gm-card-hover p-4 sm:p-5 rounded-2xl flex flex-col justify-between border border-[#D9E2EA]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6F8A92] uppercase tracking-wider">
              Pending Settlements
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#E4EEF3] text-[#173885] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-[#173885] font-mono">
              ₹
              {Number(metrics?.pendingSettlements || 0).toLocaleString(
                "en-IN",
                { minimumFractionDigits: 2 },
              )}
            </div>
            <span className="text-[10px] text-[#606460] mt-0.5 block">
              Awaiting weekly bank disbursal
            </span>
          </div>
        </Link>

        {/* 8. New RFQs */}
        <Link
          to="/vendor/rfqs"
          className={`gm-card gm-card-hover p-4 sm:p-5 rounded-2xl flex flex-col justify-between border ${
            metrics.newRfqsCount > 0
              ? "border-[#3C7DDA]/50 bg-[#E4EEF3]/40"
              : "border-[#D9E2EA]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#173885] uppercase tracking-wider">
              New Project RFQs
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#E4EEF3] text-[#3C7DDA] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-[#173885] font-mono">
              {metrics.newRfqsCount}
            </div>
            <span className="text-[10px] text-[#3C7DDA] font-semibold mt-0.5 block">
              Bulk BOQs awaiting quote
            </span>
          </div>
        </Link>
      </div>

      {/* Main Actionable Sections: Live Orders Queue & Incoming Project RFQs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 Cols): Urgent Orders Dispatch Queue */}
        <div className="lg:col-span-7 space-y-6">
          <div className="gm-panel p-5 sm:p-6 rounded-3xl border border-[#D9E2EA] space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#3C7DDA]" />
                <h2 className="text-sm font-bold text-[#173885]">
                  Priority Site Orders Queue
                </h2>
              </div>
              <Link
                to="/vendor/orders"
                className="text-xs font-bold text-[#3C7DDA] hover:underline flex items-center gap-1"
              >
                <span>View All ({metrics.pendingOrdersCount})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {actionQueues.urgentOrders.length === 0 ? (
              <div className="p-8 text-center space-y-2 bg-[#F4F6FA] rounded-2xl border border-[#D9E2EA]">
                <CheckCircle2 className="w-8 h-8 text-[#3F7D20] mx-auto" />
                <p className="text-xs font-bold text-[#282926]">
                  All site orders are fulfilled!
                </p>
                <p className="text-[11px] text-[#606460]">
                  New incoming dispatches from nearby construction sites will
                  appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {actionQueues.urgentOrders.map((order) => {
                  const cfg = vendorOrderStateMachine.getStatusConfig(
                    order.status,
                  );
                  return (
                    <div
                      key={order.id}
                      className="p-4 rounded-2xl bg-[#F4F6FA] border border-[#D9E2EA] hover:border-[#3C7DDA] transition space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9E2EA] pb-2.5">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-xs text-[#173885]">
                              {order.id}
                            </span>
                            {order.isExpress30Min && (
                              <span className="bg-[#3C7DDA] text-[#FEFEFE] text-[9px] font-black px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                <Zap className="w-2.5 h-2.5 fill-current" />{" "}
                                30-MIN
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.2 rounded-full text-[9px] ${cfg.badgeClass}`}
                            >
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#606460] mt-0.5">
                            {order.customerName} • Site:{" "}
                            <strong>{order.deliveryAddress.locality}</strong>
                          </p>
                        </div>

                        <div className="text-right flex sm:flex-col items-center sm:items-end justify-between gap-1">
                          <span className="font-mono font-black text-xs text-[#173885]">
                            ₹{order.totals?.grandTotal}
                          </span>
                          <Link
                            to={`/vendor/orders/${order.id}`}
                            className="btn-gm-primary px-3 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-xs"
                          >
                            <span>Manage</span>
                            <ArrowRight className="w-3 h-3 text-[#FEFEFE]" />
                          </Link>
                        </div>
                      </div>

                      <div className="text-[11px] text-[#606460] space-y-1">
                        {order.items.map((it) => (
                          <div key={it.id} className="flex justify-between">
                            <span className="truncate max-w-xs">{it.name}</span>
                            <span className="font-mono font-semibold text-[#282926] shrink-0">
                              {it.quantity} {it.unit}s
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Product Approval & Moderation Items */}
          {actionQueues.moderationProducts.length > 0 && (
            <div className="gm-panel p-5 sm:p-6 rounded-3xl border border-[#D9E2EA] space-y-4">
              <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#A66A08]" />
                  <h2 className="text-sm font-bold text-[#173885]">
                    Product Approval & Revisions Queue
                  </h2>
                </div>
                <Link
                  to="/vendor/products"
                  className="text-xs font-bold text-[#3C7DDA] hover:underline"
                >
                  Manage Products
                </Link>
              </div>

              <div className="space-y-2.5">
                {actionQueues.moderationProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl bg-[#F4F6FA] border border-[#D9E2EA] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={p.img}
                        alt=""
                        className="w-9 h-9 rounded-lg object-cover bg-[#FEFEFE] border border-[#D9E2EA] shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-[#282926] truncate">
                          {p.name}
                        </h4>
                        <span className="text-[10px] text-[#A66A08] font-semibold">
                          {p.status}
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/vendor/products/${p.id}`}
                      className="btn-gm-secondary px-3 py-1 rounded-lg text-xs font-bold shrink-0"
                    >
                      Edit
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (5 Cols): Incoming Bulk RFQs & Low-Stock Inventory Alerts */}
        <div className="lg:col-span-5 space-y-6">
          {/* New Commercial RFQs */}
          <div className="gm-panel p-5 sm:p-6 rounded-3xl border border-[#D9E2EA] space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#3C7DDA]" />
                <h2 className="text-sm font-bold text-[#173885]">
                  New Commercial Project RFQs
                </h2>
              </div>
              <Link
                to="/vendor/rfqs"
                className="text-xs font-bold text-[#3C7DDA] hover:underline"
              >
                View All ({metrics.newRfqsCount})
              </Link>
            </div>

            {actionQueues.urgentRfqs.length === 0 ? (
              <p className="text-xs text-[#606460] py-4 text-center">
                No new project RFQs awaiting quote bids.
              </p>
            ) : (
              <div className="space-y-3">
                {actionQueues.urgentRfqs.map((rfq) => (
                  <div
                    key={rfq.id}
                    className="p-3.5 rounded-2xl bg-[#F4F6FA] border border-[#D9E2EA] space-y-2 text-xs"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-[10px] font-black text-[#173885]">
                          {rfq.id}
                        </span>
                        <h4 className="font-bold text-[#282926]">
                          {rfq.projectName}
                        </h4>
                      </div>
                      <span className="badge-gm-info px-2 py-0.2 rounded-md text-[9px]">
                        {rfq.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#606460]">
                      Client: <strong>{rfq.buyerName}</strong> • Locality:{" "}
                      {rfq.requestedDeliverySchedule.locality}
                    </p>

                    <div className="pt-2 border-t border-[#D9E2EA] flex items-center justify-between">
                      <span className="text-[10px] text-[#6F8A92] font-mono">
                        {rfq.requestedProducts.length} Product Line(s)
                      </span>
                      <Link
                        to={`/vendor/rfqs/${rfq.id}`}
                        className="btn-gm-primary px-3 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1"
                      >
                        <span>Submit Bid</span>
                        <ArrowRight className="w-3 h-3 text-[#FEFEFE]" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inventory Low-Stock Yard Alerts */}
          <div className="gm-panel p-5 sm:p-6 rounded-3xl border border-[#D9E2EA] space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-3">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-[#A66A08]" />
                <h2 className="text-sm font-bold text-[#173885]">
                  Depot Inventory Alerts
                </h2>
              </div>
              <Link
                to="/vendor/inventory"
                className="text-xs font-bold text-[#3C7DDA] hover:underline"
              >
                Manage Stock ({metrics.inventoryAlertsCount})
              </Link>
            </div>

            {actionQueues.lowStockAlerts.length === 0 ? (
              <p className="text-xs text-[#3F7D20] font-semibold py-4 text-center">
                All product stock counts are healthy.
              </p>
            ) : (
              <div className="space-y-2.5">
                {actionQueues.lowStockAlerts.map((item) => (
                  <div
                    key={item.productId}
                    className="p-3 rounded-2xl bg-[#F4F6FA] border border-[#D9E2EA] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <h4 className="font-bold text-[#282926] truncate">
                        {item.productName}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            item.isOutOfStock
                              ? "bg-[#FBE3DE] text-[#B43D20]"
                              : "bg-[#FFF0D5] text-[#A66A08]"
                          }`}
                        >
                          {item.isOutOfStock ? "Out of Stock" : "Low Stock"}
                        </span>
                        <span className="font-mono text-[#6F8A92] text-[10px]">
                          Available:{" "}
                          <strong className="text-[#173885]">
                            {item.availableStock}
                          </strong>{" "}
                          {item.unit}s
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setAdjustingProduct(item)}
                      className="btn-gm-secondary px-3 py-1 rounded-lg text-xs font-bold shrink-0"
                    >
                      Adjust
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={Boolean(adjustingProduct)}
        onClose={() => setAdjustingProduct(null)}
        product={adjustingProduct}
        vendorId={vendorId}
        onStockAdjusted={() => {
          loadDashboard();
        }}
      />
    </div>
  );
};
