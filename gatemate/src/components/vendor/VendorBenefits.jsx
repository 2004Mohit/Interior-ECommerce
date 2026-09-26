import React from "react";
import { Link } from "react-router-dom";
import {
  Award,
  TrendingUp,
  Users,
  Zap,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Boxes,
  FileText,
} from "lucide-react";
import { useVendorAuth } from "../../context/VendorAuthContext";
import { VendorPublicHeader } from "./VendorPublicHeader";
import { Footer } from "../Footer";
import { SeoHead } from "../common/SeoHead";

export const VendorBenefits = () => {
  const { isVendorAuthenticated } = useVendorAuth();

  const benefits = [
    {
      title: "Direct Access to Active Job Sites",
      desc: "Connect with certified civil contractors, structural engineers, and real estate developers across Pune & PCMC without intermediary commissions.",
      icon: Users,
    },
    {
      title: "High-Volume Commercial RFQ Bidding",
      desc: "Receive direct Bill of Quantities (BOQ) inquiries for multi-tonnage steel, bulk cement rake points, and AAC block consignments with custom payment terms.",
      icon: FileText,
    },
    {
      title: "30-Minute Express Dispatch Badge",
      desc: "Qualified local depots receive high-intent retail contractor orders within their serviceable radius with automated route dispatching.",
      icon: Zap,
    },
    {
      title: "Reliable Direct Bank Settlements",
      desc: "Transparent 5% platform fee calculated exclusively on Product Subtotals with prompt weekly payouts and UTR tracking.",
      icon: CreditCard,
    },
    {
      title: "Authoritative Real-Time Inventory Control",
      desc: "Maintain live on-hand vs. reserved stock levels, set custom Minimum Order Quantities (MOQ), and avoid stock-outs with dynamic warnings.",
      icon: Boxes,
    },
    {
      title: "Verified Customer Product Reviews",
      desc: "Build buyer confidence with verified customer reviews and ratings on delivered product batches across construction job sites.",
      icon: Award,
    },
  ];

  const content = (
    <div className="space-y-8 pb-16 font-sans">
      <SeoHead
        title="Ferrado Stockist Partner Benefits & Growth Program"
        description="Discover the advantages of becoming an authorized Ferrado construction supplies vendor in Pune and Pimpri-Chinchwad."
        canonicalUrl="/vendor/benefits"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div>
          <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Stockist Network Growth
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
            Ferrado Stockist Partner Benefits
          </h1>
          <p className="text-xs text-[#606460]">
            Empowering regional construction material stockists with digital
            sales channels and direct contractor demand.
          </p>
        </div>

        {isVendorAuthenticated ? (
          <Link
            to="/vendor/dashboard"
            className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Terminal Dashboard</span>
          </Link>
        ) : (
          <Link
            to="/vendor/register"
            className="btn-gm-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
          >
            <span>Register as Vendor</span>
            <ArrowRight className="w-4 h-4 text-[#FEFEFE]" />
          </Link>
        )}
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {benefits.map((b, idx) => {
          const Icon = b.icon;
          return (
            <div
              key={idx}
              className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] space-y-3 bg-[#FEFEFE] shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-[#E4EEF3] text-[#173885] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#173885]" />
                </div>
                <h2 className="text-sm font-bold text-[#173885]">{b.title}</h2>
                <p className="text-xs text-[#606460] leading-relaxed">
                  {b.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Program Summary Banner */}
      <div className="gm-panel p-6 sm:p-8 rounded-3xl border border-[#9AAED4]/40 bg-[#E4EEF3]/60 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-lg font-bold text-[#173885]">
            Ready to list your building products?
          </h2>
          <p className="text-xs text-[#606460]">
            Keep your inventory updated and respond to bulk project RFQs to
            maximize your depot sales.
          </p>
        </div>
        <Link
          to={
            isVendorAuthenticated ? "/vendor/products/new" : "/vendor/register"
          }
          className="btn-gm-primary px-6 py-3 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 shadow-sm"
        >
          <span>
            {isVendorAuthenticated ? "Add New Product" : "Register Your Depot"}
          </span>
          <ArrowRight className="w-4 h-4 text-[#FEFEFE]" />
        </Link>
      </div>
    </div>
  );

  if (isVendorAuthenticated) {
    return content;
  }

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-[#282926] flex flex-col font-sans">
      <VendorPublicHeader />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {content}
      </main>
      <Footer />
    </div>
  );
};
