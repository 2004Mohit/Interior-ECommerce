import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Package,
  Sparkles,
  Banknote,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Users,
  ClipboardList,
  WalletCards,
} from "lucide-react";

import { useAdminAuth } from "../../context/AdminAuthContext";

import {
  vendorProductService,
  PRODUCT_APPROVAL_STATUS,
} from "../../services/vendorProductService";

import {
  productAttributeService,
  ATTRIBUTE_SUGGESTION_STATUS,
} from "../../services/productAttributeService";

import { adminFinanceService } from "../../services/adminFinanceService";

import { SeoHead } from "../common/SeoHead";

const AUTO_REFRESH_INTERVAL = 30000;

export const AdminDashboard = () => {
  const { adminUser } = useAdminAuth();

  const [products, setProducts] = useState([]);
  const [attributeSuggestions, setAttributeSuggestions] = useState([]);
  const [settlementData, setSettlementData] = useState({
    pendingBatches: [],
    pastSettlements: [],
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);

  const loadData = useCallback(async (manual = false) => {
    if (manual) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const [productsResult, attributesResult, settlementsResult] =
        await Promise.allSettled([
          vendorProductService.getAllProductsForAdminReview(),
          productAttributeService.getAllSuggestions(),
          adminFinanceService.getSettlementOverview(),
        ]);

      if (!mountedRef.current) return;

      const productsData =
        productsResult.status === "fulfilled" ? productsResult.value || [] : [];

      const attributesData =
        attributesResult.status === "fulfilled"
          ? attributesResult.value || []
          : [];

      const settlementResult =
        settlementsResult.status === "fulfilled"
          ? settlementsResult.value
          : {
              pendingBatches: [],
              pastSettlements: [],
            };

      setProducts(productsData);
      setAttributeSuggestions(attributesData);
      setSettlementData(settlementResult);

      const failed = [
        productsResult,
        attributesResult,
        settlementsResult,
      ].filter((result) => result.status === "rejected");

      if (failed.length > 0) {
        setError(
          "Some dashboard information could not be loaded. Refresh to try again.",
        );
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Admin dashboard load failed:", err);

      if (!mountedRef.current) return;

      setError(err?.message || "Unable to load Admin dashboard data.");
    } finally {
      if (!mountedRef.current) return;

      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    loadData();

    const intervalId = window.setInterval(() => {
      loadData();
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      mountedRef.current = false;
      window.clearInterval(intervalId);
    };
  }, [loadData]);

  const pendingProducts = useMemo(
    () =>
      products.filter(
        (product) => product.status === PRODUCT_APPROVAL_STATUS.SUBMITTED,
      ),
    [products],
  );

  const pendingSuggestions = useMemo(
    () =>
      attributeSuggestions.filter(
        (suggestion) =>
          suggestion.status === ATTRIBUTE_SUGGESTION_STATUS.PENDING,
      ),
    [attributeSuggestions],
  );

  const pendingBatches = settlementData.pendingBatches || [];

  const pastSettlements = settlementData.pastSettlements || [];

  /*
   * Real Admin-wide settlement values.
   *
   * These come from adminFinanceService, NOT
   * vendorFinancialService, because this is an
   * Admin dashboard.
   */

  const pendingSettlementAmount = useMemo(
    () =>
      pendingBatches.reduce(
        (sum, batch) => sum + Number(batch.pendingAmount || 0),
        0,
      ),
    [pendingBatches],
  );

  const pendingOrders = useMemo(
    () =>
      pendingBatches.reduce(
        (sum, batch) => sum + Number(batch.pendingOrdersCount || 0),
        0,
      ),
    [pendingBatches],
  );

  const pendingCommission = useMemo(
    () =>
      pendingBatches.reduce(
        (sum, batch) => sum + Number(batch.totalCommission || 0),
        0,
      ),
    [pendingBatches],
  );

  const totalDisbursed = useMemo(
    () =>
      pastSettlements.reduce(
        (sum, settlement) => sum + Number(settlement.net_disbursed_amount || 0),
        0,
      ),
    [pastSettlements],
  );

  const totalGrossVolume = useMemo(
    () =>
      pendingBatches.reduce(
        (sum, batch) => sum + Number(batch.grossProductSubtotal || 0),
        0,
      ) +
      pastSettlements.reduce(
        (sum, settlement) =>
          sum + Number(settlement.gross_product_subtotal || 0),
        0,
      ),
    [pendingBatches, pastSettlements],
  );

  const totalCommission = useMemo(
    () =>
      pendingCommission +
      pastSettlements.reduce(
        (sum, settlement) =>
          sum + Number(settlement.total_commission_deducted || 0),
        0,
      ),
    [pendingCommission, pastSettlements],
  );

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  };

  const formatTime = (date) => {
    if (!date) return "Not updated";

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="space-y-7 pb-20 font-sans">
      <SeoHead
        title="Admin Dashboard | Ferrado"
        description="Ferrado Admin operational dashboard."
        canonicalUrl="/admin/dashboard"
        noIndex={true}
      />

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[#173885]">
              Admin Dashboard
            </h1>

            <span className="badge-gm-success px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Secure Admin
            </span>
          </div>

          <p className="text-xs text-[#606460] mt-1">
            Operational overview for{" "}
            <strong>{adminUser?.email || "Administrator"}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-[10px] text-[#6F8A92] font-mono">
            Updated {formatTime(lastUpdated)}
          </span>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="p-4 rounded-2xl bg-[#FFF0D5] border border-[#A66A08]/30 text-[#7A5008] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* MAIN ADMIN METRICS */}
      <section>
        <div className="mb-4">
          <h2 className="text-sm font-black text-[#173885]">
            Platform Overview
          </h2>

          <p className="text-[11px] text-[#606460] mt-0.5">
            Current operational and settlement position.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pending Products */}
          <Link
            to="/admin/products"
            className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] hover:border-[#3C7DDA]/50 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#6F8A92] uppercase tracking-wider">
                Pending Products
              </span>

              <Package className="w-4 h-4 text-[#3C7DDA]" />
            </div>

            <div className="text-2xl font-black text-[#173885] mt-3">
              {loading ? "—" : pendingProducts.length}
            </div>

            <p className="text-[10px] text-[#6F8A92] mt-1">
              Awaiting Admin review
            </p>
          </Link>

          {/* Attribute Suggestions */}
          <Link
            to="/admin/attributes"
            className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] hover:border-[#3C7DDA]/50 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#6F8A92] uppercase tracking-wider">
                Attribute Suggestions
              </span>

              <Sparkles className="w-4 h-4 text-[#A66A08]" />
            </div>

            <div className="text-2xl font-black text-[#173885] mt-3">
              {loading ? "—" : pendingSuggestions.length}
            </div>

            <p className="text-[10px] text-[#6F8A92] mt-1">
              Awaiting moderation
            </p>
          </Link>

          {/* Pending Settlement */}
          <Link
            to="/admin/settlements"
            className="gm-panel p-5 rounded-2xl border border-[#A66A08]/25 bg-[#FFF9EF] hover:border-[#A66A08]/50 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#A66A08] uppercase tracking-wider">
                Pending Settlement
              </span>

              <Banknote className="w-4 h-4 text-[#A66A08]" />
            </div>

            <div className="text-2xl font-black text-[#A66A08] mt-3 font-mono">
              {loading ? "—" : formatCurrency(pendingSettlementAmount)}
            </div>

            <p className="text-[10px] text-[#A66A08] mt-1">
              {pendingOrders} pending order
              {pendingOrders === 1 ? "" : "s"}
            </p>
          </Link>

          {/* Total Disbursed */}
          <Link
            to="/admin/settlements"
            className="gm-panel p-5 rounded-2xl border border-[#3F7D20]/25 bg-[#E1F2D9]/20 hover:border-[#3F7D20]/50 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#3F7D20] uppercase tracking-wider">
                Total Disbursed
              </span>

              <WalletCards className="w-4 h-4 text-[#3F7D20]" />
            </div>

            <div className="text-2xl font-black text-[#3F7D20] mt-3 font-mono">
              {loading ? "—" : formatCurrency(totalDisbursed)}
            </div>

            <p className="text-[10px] text-[#3F7D20] mt-1">
              Completed vendor settlements
            </p>
          </Link>
        </div>
      </section>

      {/* FINANCIAL SUMMARY */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-black text-[#173885]">
              Financial Summary
            </h2>

            <p className="text-[11px] text-[#606460] mt-0.5">
              Values calculated from Admin settlement data.
            </p>
          </div>

          <Link
            to="/admin/settlements"
            className="text-xs font-bold text-[#3C7DDA] hover:underline"
          >
            Open Settlements
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="gm-panel p-5 rounded-2xl border border-[#D9E2EA]">
            <span className="text-[10px] font-bold text-[#6F8A92] uppercase tracking-wider">
              Product Volume
            </span>

            <div className="text-xl font-black text-[#173885] mt-3 font-mono">
              {loading ? "—" : formatCurrency(totalGrossVolume)}
            </div>

            <p className="text-[10px] text-[#6F8A92] mt-1">
              Pending + processed settlements
            </p>
          </div>

          <div className="gm-panel p-5 rounded-2xl border border-[#3F7D20]/25 bg-[#E1F2D9]/20">
            <span className="text-[10px] font-bold text-[#3F7D20] uppercase tracking-wider">
              Platform Commission
            </span>

            <div className="text-xl font-black text-[#3F7D20] mt-3 font-mono">
              {loading ? "—" : formatCurrency(totalCommission)}
            </div>

            <p className="text-[10px] text-[#3F7D20] mt-1">
              Recorded platform commission
            </p>
          </div>

          <div className="gm-panel p-5 rounded-2xl border border-[#D9E2EA]">
            <span className="text-[10px] font-bold text-[#6F8A92] uppercase tracking-wider">
              Pending Commission
            </span>

            <div className="text-xl font-black text-[#173885] mt-3 font-mono">
              {loading ? "—" : formatCurrency(pendingCommission)}
            </div>

            <p className="text-[10px] text-[#6F8A92] mt-1">
              From pending vendor settlements
            </p>
          </div>
        </div>
      </section>

      {/* ACTION CENTER */}
      <section>
        <div className="mb-4">
          <h2 className="text-sm font-black text-[#173885]">
            Requires Attention
          </h2>

          <p className="text-[11px] text-[#606460] mt-0.5">
            Items that may require Admin action.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Products */}
          <Link
            to="/admin/products"
            className="p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] hover:border-[#3C7DDA]/50 transition"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#E4EEF3] text-[#173885] flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>

              <span className="text-xl font-black text-[#173885]">
                {loading ? "—" : pendingProducts.length}
              </span>
            </div>

            <h3 className="text-sm font-black text-[#282926] mt-4">
              Product Reviews
            </h3>

            <p className="text-[11px] text-[#606460] mt-1">
              Products waiting for Admin moderation.
            </p>

            <div className="flex items-center gap-1 mt-4 text-xs font-bold text-[#3C7DDA]">
              Open Products
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Attributes */}
          <Link
            to="/admin/attributes"
            className="p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] hover:border-[#3C7DDA]/50 transition"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#FFF0D5] text-[#A66A08] flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>

              <span className="text-xl font-black text-[#173885]">
                {loading ? "—" : pendingSuggestions.length}
              </span>
            </div>

            <h3 className="text-sm font-black text-[#282926] mt-4">
              Attribute Suggestions
            </h3>

            <p className="text-[11px] text-[#606460] mt-1">
              Vendor-suggested fields waiting for review.
            </p>

            <div className="flex items-center gap-1 mt-4 text-xs font-bold text-[#3C7DDA]">
              Open Attributes
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Settlements */}
          <Link
            to="/admin/settlements"
            className="p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] hover:border-[#3C7DDA]/50 transition"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#E1F2D9] text-[#3F7D20] flex items-center justify-center">
                <Banknote className="w-5 h-5" />
              </div>

              <span className="text-xl font-black text-[#A66A08]">
                {loading ? "—" : pendingBatches.length}
              </span>
            </div>

            <h3 className="text-sm font-black text-[#282926] mt-4">
              Vendor Settlements
            </h3>

            <p className="text-[11px] text-[#606460] mt-1">
              Vendor batches currently waiting for disbursal.
            </p>

            <div className="flex items-center gap-1 mt-4 text-xs font-bold text-[#3C7DDA]">
              Manage Settlements
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </section>

      {/* QUICK LINKS */}
      <section>
        <div className="mb-4">
          <h2 className="text-sm font-black text-[#173885]">Quick Access</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            to="/admin/vendors"
            className="p-4 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] hover:border-[#3C7DDA]/50 transition flex items-center gap-3"
          >
            <Users className="w-4 h-4 text-[#3C7DDA]" />

            <span className="text-xs font-bold text-[#282926]">Vendors</span>
          </Link>

          <Link
            to="/admin/products"
            className="p-4 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] hover:border-[#3C7DDA]/50 transition flex items-center gap-3"
          >
            <Package className="w-4 h-4 text-[#3C7DDA]" />

            <span className="text-xs font-bold text-[#282926]">Products</span>
          </Link>

          <Link
            to="/admin/orders"
            className="p-4 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] hover:border-[#3C7DDA]/50 transition flex items-center gap-3"
          >
            <ClipboardList className="w-4 h-4 text-[#3C7DDA]" />

            <span className="text-xs font-bold text-[#282926]">Orders</span>
          </Link>

          <Link
            to="/admin/settlements"
            className="p-4 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] hover:border-[#3C7DDA]/50 transition flex items-center gap-3"
          >
            <WalletCards className="w-4 h-4 text-[#3C7DDA]" />

            <span className="text-xs font-bold text-[#282926]">
              Settlements
            </span>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <div className="flex items-center justify-between px-1 text-[10px] text-[#6F8A92]">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#3F7D20]" />

          <span>Admin dashboard automatically refreshes every 30 seconds.</span>
        </div>

        <span className="hidden sm:block font-mono">
          {lastUpdated
            ? `Last sync ${formatTime(lastUpdated)}`
            : "Waiting for sync"}
        </span>
      </div>
    </div>
  );
};
