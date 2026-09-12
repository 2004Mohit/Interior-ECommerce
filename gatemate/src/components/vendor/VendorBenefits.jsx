import React from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Zap,
  ShoppingBag,
  TrendingUp,
  Boxes,
  FileText,
  History,
  Percent,
  ShieldCheck,
  Star,
  ArrowRight,
  Check,
} from "lucide-react";
import { VendorPublicHeader } from "./VendorPublicHeader";
import { Footer } from "../Footer";
import { SeoHead } from "../common/SeoHead";

export const VendorBenefits = () => {
  const benefits = [
    {
      title: "Direct Nearby Construction Buyers",
      desc: "Connect with builders, civil contractors, and site engineers actively looking for construction products within your immediate local supply territory.",
      icon: Building2,
    },
    {
      title: "Digital Order Management",
      desc: "Eliminate manual phone order friction with standardized digital order tickets specifying product units, delivery addresses, and contact numbers.",
      icon: ShoppingBag,
    },
    {
      title: "Local Sales Expansion",
      desc: "Increase market reach across residential and commercial development projects throughout Pune and Pimpri-Chinchwad municipal limits.",
      icon: TrendingUp,
    },
    {
      title: "Serve Urgent Site Replenishment Buyers",
      desc: "Monetize product availability by fulfilling urgent site orders with 30-minute priority dispatch options where logistically feasible.",
      icon: Zap,
    },
    {
      title: "Integrated Product & Inventory Controls",
      desc: "Manage technical specifications, unit prices, batch details, and real-time warehouse stock counts through a centralized vendor terminal.",
      icon: Boxes,
    },
    {
      title: "Commercial Bulk & Project RFQ Inquiries",
      desc: "Receive direct Bill of Quantities (BOQ) quote requests from developers and submit tailored bids for truckload quantities.",
      icon: FileText,
    },
    {
      title: "Complete Order History & Accounting",
      desc: "Access consolidated historical dispatch archives, delivery timestamps, payment reconciliations, and downloadable GST invoice copies.",
      icon: History,
    },
    {
      title: "Transparent Commission Model",
      desc: "Clear, predictable platform service fees with zero hidden deductions, transparent payout breakdowns, and weekly bank settlements.",
      icon: Percent,
    },
    {
      title: "Verified Construction Marketplace Trust",
      desc: "Benefit from GateMate’s reputation for certified primary quality (IS/BIS test batches) and contractor-trusted local logistics.",
      icon: ShieldCheck,
    },
    {
      title: "Verified Customer Product Ratings & Reviews",
      desc: "Gain credibility through customer product ratings and reviews posted by verified site purchasers upon completed deliveries.",
      icon: Star,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-[#282926] flex flex-col font-sans">
      <SeoHead
        title="Vendor Partner Benefits | GateMate Construction Marketplace"
        description="Discover the operational advantages of partnering with GateMate. Expand local sales, manage digital orders, participate in commercial project RFQs, and access transparent weekly settlements."
        canonicalUrl="/vendor/benefits"
      />

      <VendorPublicHeader />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-16">
        {/* Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="badge-gm-info px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            Stockist & Dealer Advantage
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#173885] tracking-tight">
            GateMate Vendor Partner Benefits
          </h1>
          <p className="text-xs sm:text-sm text-[#606460] leading-relaxed">
            Modern digital tools and local commercial reach designed
            specifically for construction product stockists and dealers in Pune
            and PCMC.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                className="gm-card p-6 rounded-3xl space-y-3.5 border border-[#D9E2EA]"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#E4EEF3] border border-[#9AAED4]/40 flex items-center justify-center text-[#173885]">
                  <Icon className="w-6 h-6 text-[#173885]" />
                </div>
                <h2 className="text-base font-bold text-[#173885]">
                  {b.title}
                </h2>
                <p className="text-xs text-[#606460] leading-relaxed">
                  {b.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Disclaimer Callout (No guaranteed sales/revenue promises) */}
        <div className="p-4 rounded-2xl bg-[#E4EEF3]/80 border border-[#9AAED4]/40 text-xs text-[#606460] text-center max-w-3xl mx-auto leading-relaxed">
          <strong className="text-[#173885]">
            Marketplace Transparency Notice:
          </strong>{" "}
          GateMate provides digital listing infrastructure, local contractor
          discovery, and logistics coordination. Order volume and commercial
          sales depend on vendor pricing competitiveness, product availability,
          quality compliance, and market demand.
        </div>

        {/* Bottom Onboarding CTA */}
        <div className="gm-panel p-8 sm:p-10 rounded-3xl border border-[#D9E2EA] bg-[#173885] text-[#FEFEFE] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <h2 className="text-2xl font-black text-[#120d0d]">
              Ready to Partner with GateMate?
            </h2>
            <p className="text-xs text-[#143291] max-w-xl">
              Register your building supply depot today and start listing your
              construction products for local site dispatches.
            </p>
          </div>
          <Link
            to="/vendor/onboarding"
            className="btn-gm-primary px-8 py-3.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 shadow-md"
          >
            <span>Start Vendor Registration</span>
            <ArrowRight className="w-4 h-4 text-[#FEFEFE]" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};
