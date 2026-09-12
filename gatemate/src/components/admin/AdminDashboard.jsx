import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Package,
  Sparkles,
  Banknote,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  LogOut,
  Boxes,
  FileText,
  ExternalLink,
  RotateCcw,
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
  const { adminUser, logoutAdmin } = useAdminAuth();

  const [vendorApps, setVendorApps] = useState([]);
  const [products, setProducts] = useState([]);
  const [attributeSuggestions, setAttributeSuggestions] = useState([]);
  const [financials, setFinancials] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, attrs, fin] = await Promise.all([
        vendorProductService.getAllProductsForAdminReview(),
        productAttributeService.getAllSuggestions(),
        vendorFinancialService.getFinancialSummary("vnd-pune-001"),
      ]);
      setProducts(prods);
      setAttributeSuggestions(attrs);
      setFinancials(fin);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingProductsCount = products.filter(
    (p) =>
      p.status === PRODUCT_APPROVAL_STATUS.SUBMITTED ||
      p.status === PRODUCT_APPROVAL_STATUS.UNDER_REVIEW,
  ).length;
  const pendingAttributesCount = attributeSuggestions.filter(
    (a) => a.status === ATTRIBUTE_SUGGESTION_STATUS.PENDING,
  ).length;

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-[#282926] font-sans pb-24">
      <SeoHead
        title="Admin Operations Console | GateMate"
        description="Review depot verification applications, moderate construction products, approve category attributes, and monitor commission settlements."
        canonicalUrl="/admin/dashboard"
        noIndex={true}
      />

      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-[#173885] text-[#FEFEFE] px-4 sm:px-8 py-3.5 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black tracking-tight leading-none">
            <span className="text-[#FEFEFE]">GATE</span>
            <span className="text-[#3C7DDA]">MATE</span>
          </span>
          <span className="bg-[#3C7DDA] text-[#FEFEFE] text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
            Operations Console
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="hidden sm:inline text-[#E4EEF3] font-semibold">
            Operator: {adminUser?.email}
          </span>
          <button
            onClick={logoutAdmin}
            className="btn-gm-secondary bg-[#FEFEFE]/10 hover:bg-[#FEFEFE]/20 text-[#FEFEFE] border-transparent px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#173885]">
              Platform Operations & Moderation Desk
            </h1>
            <p className="text-xs text-[#606460]">
              Centralized oversight across vendor applications, product
              listings, category schemas, and transactions in Pune & PCMC.
            </p>
          </div>

          <button
            onClick={loadData}
            className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refresh Queue</span>
          </button>
        </div>

        {/* 4 Operations Core Workspaces */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Vendor Onboarding Verification Console */}
          <Link
            to="/admin/vendor-reviews"
            className="gm-panel p-5 rounded-3xl border border-[#D9E2EA] hover:border-[#3C7DDA] transition space-y-3 bg-[#FEFEFE] shadow-xs flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-[#E4EEF3] text-[#173885] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-[#173885]">
                Vendor Verification
              </h2>
              <p className="text-[11px] text-[#606460] leading-relaxed">
                Validate depot GST certificates (REG-06), yard trailers, and
                approve stockists.
              </p>
            </div>
            <div className="pt-2 border-t border-[#D9E2EA] flex items-center justify-between text-xs font-bold text-[#3C7DDA]">
              <span>Open Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* 2. Product Moderation Console */}
          <Link
            to="/admin/product-reviews"
            className="gm-panel p-5 rounded-3xl border border-[#D9E2EA] hover:border-[#3C7DDA] transition space-y-3 bg-[#FEFEFE] shadow-xs flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-[#E3EBFA] text-[#3C7DDA] flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#173885]">
                  Product Moderation
                </h2>
                {pendingProductsCount > 0 && (
                  <span className="bg-[#B43D20] text-[#FEFEFE] text-[9px] font-black px-2 py-0.5 rounded-full">
                    {pendingProductsCount} PENDING
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#606460] leading-relaxed">
                Inspect technical attributes, mill certificates, and publish
                products.
              </p>
            </div>
            <div className="pt-2 border-t border-[#D9E2EA] flex items-center justify-between text-xs font-bold text-[#3C7DDA]">
              <span>Open Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* 3. Category Attributes Console */}
          <Link
            to="/admin/attributes"
            className="gm-panel p-5 rounded-3xl border border-[#D9E2EA] hover:border-[#3C7DDA] transition space-y-3 bg-[#FEFEFE] shadow-xs flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-[#FFF0D5] text-[#A66A08] flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#173885]">
                  Attribute Library
                </h2>
                {pendingAttributesCount > 0 && (
                  <span className="bg-[#A66A08] text-[#FEFEFE] text-[9px] font-black px-2 py-0.5 rounded-full">
                    {pendingAttributesCount} PENDING
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#606460] leading-relaxed">
                Merge vendor-suggested technical specifications globally into
                category schemas.
              </p>
            </div>
            <div className="pt-2 border-t border-[#D9E2EA] flex items-center justify-between text-xs font-bold text-[#3C7DDA]">
              <span>Open Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* 4. Financial Commission Overview */}
          <div className="gm-panel p-5 rounded-3xl border border-[#D9E2EA] space-y-3 bg-[#FEFEFE] shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-[#E1F2D9] text-[#3F7D20] flex items-center justify-center">
                <Banknote className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-[#173885]">
                5% Platform Commission
              </h2>
              <p className="text-[11px] text-[#606460] leading-relaxed">
                Gross Retained:{" "}
                <strong className="text-[#3F7D20] font-mono">
                  ₹{financials?.totalPlatformCommission || 0}
                </strong>{" "}
                strictly from Product Subtotals.
              </p>
            </div>
            <div className="pt-2 border-t border-[#D9E2EA] text-[10px] text-[#6F8A92] font-mono">
              Auto-locked per transaction
            </div>
          </div>
        </div>

        {/* Quick Links to Moderation Workspaces */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] space-y-3 bg-[#FEFEFE]">
            <h3 className="text-sm font-bold text-[#173885]">
              Product Queue Summary
            </h3>
            <div className="space-y-2 text-xs">
              {products.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-[#F4F6FA] border border-[#D9E2EA] flex justify-between items-center"
                >
                  <div className="truncate max-w-xs">
                    <strong className="text-[#282926] block truncate">
                      {p.name}
                    </strong>
                    <span className="text-[10px] text-[#6F8A92] font-mono">
                      ₹{p.price}/{p.unit}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#E4EEF3] text-[#173885]">
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] space-y-3 bg-[#FEFEFE]">
            <h3 className="text-sm font-bold text-[#173885]">
              Attribute Suggestions Summary
            </h3>
            <div className="space-y-2 text-xs">
              {attributeSuggestions.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-xl bg-[#F4F6FA] border border-[#D9E2EA] flex justify-between items-center"
                >
                  <div>
                    <strong className="text-[#282926] block">{a.name}</strong>
                    <span className="text-[10px] text-[#6F8A92] font-mono">
                      Category: {a.categorySlug}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#FFF0D5] text-[#A66A08]">
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
