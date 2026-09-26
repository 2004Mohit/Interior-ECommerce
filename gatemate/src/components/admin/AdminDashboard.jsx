import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Package,
  Sparkles,
  Banknote,
  ArrowRight,
  LogOut,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
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
import { vendorFinancialService } from "../../services/vendorFinancialService";
import { SeoHead } from "../common/SeoHead";

export const AdminDashboard = () => {
  const { adminUser, logout } = useAdminAuth();

  const [products, setProducts] = useState([]);
  const [attributeSuggestions, setAttributeSuggestions] = useState([]);
  const [financials, setFinancials] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, attrs, fin] = await Promise.all([
        vendorProductService.getAllProductsForAdminReview().catch(() => []),
        productAttributeService.getAllSuggestions().catch(() => []),
        vendorFinancialService.getFinancialSummary().catch(() => null),
      ]);
      setProducts(prods || []);
      setAttributeSuggestions(attrs || []);
      setFinancials(fin);
    } catch (e) {
      console.error("Failed to load admin dashboard telemetry:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingProducts = products.filter(
    (p) => p.status === PRODUCT_APPROVAL_STATUS.SUBMITTED,
  );
  const pendingSuggestions = attributeSuggestions.filter(
    (s) => s.status === ATTRIBUTE_SUGGESTION_STATUS.PENDING,
  );

  return (
    <div className="space-y-8 pb-24 font-sans">
      <SeoHead
        title="Admin Operations Control Center | Ferrado"
        description="Central platform moderation console for vendor verification, product moderation, and financial commissions."
        canonicalUrl="/admin/dashboard"
        noIndex={true}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-[#173885]">
              Admin Operations Console
            </h1>
            <span className="badge-gm-success px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Secure Admin
            </span>
          </div>
          <p className="text-xs text-[#606460] mt-0.5">
            Platform governance overview for{" "}
            <strong>{adminUser?.email || "Super Administrator"}</strong>
          </p>
        </div>

        <button
          onClick={loadData}
          className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Primary Workspace Quick Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/vendors"
          className="gm-card gm-card-hover p-5 rounded-2xl flex flex-col justify-between border border-[#D9E2EA]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6F8A92] uppercase tracking-wider">
              Vendor Onboarding
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#E4EEF3] text-[#173885] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-bold text-[#173885]">
              Review Applications
            </span>
            <ArrowRight className="w-4 h-4 text-[#3C7DDA]" />
          </div>
        </Link>

        <Link
          to="/admin/products"
          className="gm-card gm-card-hover p-5 rounded-2xl flex flex-col justify-between border border-[#D9E2EA] bg-[#E3EBFA]/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#173885] uppercase tracking-wider">
              Product Moderation
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#173885] text-[#FEFEFE] flex items-center justify-center font-bold font-mono text-xs">
              {pendingProducts.length}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-bold text-[#173885]">
              Manage Catalog SKUs
            </span>
            <ArrowRight className="w-4 h-4 text-[#3C7DDA]" />
          </div>
        </Link>

        <Link
          to="/admin/attributes"
          className="gm-card gm-card-hover p-5 rounded-2xl flex flex-col justify-between border border-[#D9E2EA]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6F8A92] uppercase tracking-wider">
              Attribute Suggestions
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#FFF0D5] text-[#A66A08] flex items-center justify-center font-bold font-mono text-xs">
              {pendingSuggestions.length}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-bold text-[#173885]">
              Review Custom Fields
            </span>
            <ArrowRight className="w-4 h-4 text-[#3C7DDA]" />
          </div>
        </Link>

        <Link
          to="/admin/finances"
          className="gm-card gm-card-hover p-5 rounded-2xl flex flex-col justify-between border border-[#D9E2EA] bg-[#E1F2D9]/30"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#3F7D20] uppercase tracking-wider">
              Financial Commissions
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#E1F2D9] text-[#3F7D20] flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-bold text-[#3F7D20]">
              Inspect 5% Ledger
            </span>
            <ArrowRight className="w-4 h-4 text-[#3F7D20]" />
          </div>
        </Link>
      </div>

      {/* Platform Financial & Operational Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Recent Product Submissions */}
        <div className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] space-y-4">
          <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#3C7DDA]" />
              <h2 className="text-sm font-bold text-[#173885]">
                Pending Product Submissions ({pendingProducts.length})
              </h2>
            </div>
            <Link
              to="/admin/products"
              className="text-xs font-bold text-[#3C7DDA] hover:underline"
            >
              View All
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-[#606460]">
              Loading telemetry...
            </div>
          ) : pendingProducts.length === 0 ? (
            <div className="p-8 text-center space-y-2 bg-[#F4F6FA] rounded-2xl border border-[#D9E2EA]">
              <CheckCircle2 className="w-8 h-8 text-[#3F7D20] mx-auto" />
              <p className="text-xs font-bold text-[#282926]">
                All product submissions have been reviewed!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingProducts.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-[#F4F6FA] border border-[#D9E2EA] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <h4 className="font-bold text-[#282926] truncate">
                      {p.name}
                    </h4>
                    <span className="text-[10px] text-[#6F8A92] font-mono">
                      Brand: {p.brand} • SKU: {p.sku}
                    </span>
                  </div>
                  <Link
                    to="/admin/products"
                    className="btn-gm-primary px-3 py-1.5 rounded-xl text-xs font-bold shrink-0"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Platform Financial Overview */}
        <div className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] space-y-4">
          <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-3">
            <div className="flex items-center gap-2">
              <Banknote className="w-4 h-4 text-[#3F7D20]" />
              <h2 className="text-sm font-bold text-[#173885]">
                Platform Commission & Volume Overview
              </h2>
            </div>
            <Link
              to="/admin/finances"
              className="text-xs font-bold text-[#3C7DDA] hover:underline"
            >
              Financial Ledger
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#F4F6FA] border border-[#D9E2EA]">
              <span className="text-[10px] font-bold text-[#6F8A92] uppercase block">
                Gross Product Volume
              </span>
              <div className="text-xl font-black text-[#173885] mt-1 font-mono">
                ₹{financials?.grossVolume?.toLocaleString("en-IN") || 0}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#E1F2D9]/30 border border-[#3F7D20]/30">
              <span className="text-[10px] font-bold text-[#3F7D20] uppercase block">
                Total Commission (5%)
              </span>
              <div className="text-xl font-black text-[#3F7D20] mt-1 font-mono">
                ₹{financials?.totalCommission?.toLocaleString("en-IN") || 0}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#E4EEF3]/40 border border-[#D9E2EA] text-xs text-[#173885] flex items-center justify-between">
            <span>Pending Payout Settlements:</span>
            <strong className="font-mono font-bold text-[#A66A08]">
              ₹{financials?.pendingSettlement?.toLocaleString("en-IN") || 0}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};
