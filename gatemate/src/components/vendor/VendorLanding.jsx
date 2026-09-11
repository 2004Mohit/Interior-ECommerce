import React from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  ShieldCheck,
  Zap,
  ArrowRight,
  Boxes,
  CreditCard,
  Star,
  FileText,
  ShoppingCart,
  FileCheck2,
  Check,
  Clock,
  TrendingUp,
} from "lucide-react";
import { VendorPublicHeader } from "./VendorPublicHeader";
import { Footer } from "../Footer";
import { SeoHead } from "../common/SeoHead";

export const VendorLanding = () => {
  const marketplacePillars = [
    {
      title: "Digital Product Listings",
      desc: "Catalog your full inventory of Cement, TMT Steel, AAC Blocks, CPVC Pipes, Electrical Cables, and Hardware Products with technical specifications, packaging sizes, and units of supply.",
      icon: Boxes,
    },
    {
      title: "Real-Time Inventory Management",
      desc: "Update live warehouse and depot stock counts, set Minimum Order Quantities (MOQ), and instantly toggle product availability for customer checkout.",
      icon: FileCheck2,
    },
    {
      title: "Normal Site Orders",
      desc: "Receive digital orders from nearby contractors, builders, and retail buyers in your local Pune & PCMC delivery radius with automated dispatch tickets.",
      icon: ShoppingCart,
    },
    {
      title: "Commercial Bulk Orders & Project RFQs",
      desc: "Review developer Bill of Quantities (BOQ) inquiries and submit competitive wholesale bids for full truckload dispatches without sales intermediaries.",
      icon: FileText,
    },
    {
      title: "Automated Payments & Weekly Settlements",
      desc: "Reconcile digital and Pay on Delivery collections with transparent accounting, GST invoice records, and direct weekly NEFT/RTGS bank payouts.",
      icon: CreditCard,
    },
    {
      title: "Customer Product Reviews & Ratings",
      desc: "Build buyer confidence through verified customer reviews and ratings on delivered product batches across construction job sites.",
      icon: Star,
    },
  ];

  const onboardingSteps = [
    {
      step: "01",
      title: "Submit Business Credentials",
      desc: "Provide your trading entity name, depot yard location, contact details, and 15-character Indian GSTIN.",
    },
    {
      step: "02",
      title: "Verification & Yard Approval",
      desc: "Our contractor onboarding team validates your GST status and delivery zone eligibility in Pune or PCMC.",
    },
    {
      step: "03",
      title: "List Products & Inventory",
      desc: "Configure your commercial products, specify unit rates, define MOQs, and upload test batch details.",
    },
    {
      step: "04",
      title: "Fulfill Site Orders & B2B RFQs",
      desc: "Accept incoming dispatches, stage trucks for 30-minute runs where eligible, and receive weekly payouts.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-[#282926] flex flex-col font-sans">
      <SeoHead
        title="Sell Construction Products on GateMate | Pune & PCMC Stockist Partner Network"
        description="Expand your building supplies and hardware business. Connect with nearby contractors, fulfill site dispatches, manage digital product listings, and receive weekly bank settlements."
        canonicalUrl="/sell"
      />

      {/* Reusable Public Header */}
      <VendorPublicHeader />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-16">
        {/* 1. Hero Section */}
        <div className="text-center space-y-5 max-w-4xl mx-auto">
          <span className="badge-gm-info px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            Hyperlocal Construction Products Marketplace
          </span>

          <h1 className="text-3xl sm:text-5xl font-black text-[#173885] tracking-tight leading-tight">
            Sell Construction Products Directly to Nearby Buyers
          </h1>

          <p className="text-sm sm:text-base text-[#606460] leading-relaxed max-w-3xl mx-auto">
            GateMate connects authorized stockists, manufacturers, and building
            supply depots in Pune and Pimpri-Chinchwad directly with active
            construction sites, contractors, and project engineers.
          </p>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              to="/vendor/onboarding"
              className="w-full sm:w-auto btn-gm-primary px-8 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md transition active:scale-98"
            >
              <span>Register Your Depot</span>
              <ArrowRight className="w-4 h-4 text-[#FEFEFE]" />
            </Link>

            <Link
              to="/vendor/guidelines"
              className="w-full sm:w-auto btn-gm-secondary px-6 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            >
              <span>Review Vendor Guidelines</span>
            </Link>
          </div>
        </div>

        {/* 2. Platform Capabilities Grid */}
        <div className="space-y-6">
          <div className="text-center space-y-1 max-w-2xl mx-auto">
            <h2 className="text-2xl font-black text-[#173885]">
              Complete Vendor Commerce Architecture
            </h2>
            <p className="text-xs text-[#606460]">
              Everything you need to digitize local construction product sales
              and project fulfillment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {marketplacePillars.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="gm-card p-6 rounded-3xl space-y-3.5 border border-[#D9E2EA]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#E4EEF3] border border-[#9AAED4]/40 flex items-center justify-center text-[#173885]">
                    <Icon className="w-6 h-6 text-[#173885]" />
                  </div>
                  <h3 className="text-base font-bold text-[#173885]">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#606460] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Verification & Compliance Callout */}
        <div className="gm-panel p-8 sm:p-10 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center gap-2 text-[#3F7D20]">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Verified Stockist Network
              </span>
            </div>
            <h2 className="text-2xl font-black text-[#173885]">
              Strict Vendor Verification & Product Integrity
            </h2>
            <p className="text-xs text-[#606460] leading-relaxed">
              To protect site engineers and builders, every GateMate vendor
              undergoes business verification including valid 15-character GSTIN
              authentication, physical depot verification, and confirmation of
              genuine product sourcing from certified primary producers.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#282926] pt-2">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#3F7D20]" />
                <span>GST Tax & e-Way Bill Compliance</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#3F7D20]" />
                <span>Manufacturer Mill Test Certification</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#3F7D20]" />
                <span>Physical Yard Stock Verification</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#3F7D20]" />
                <span>Direct Bank Account Reconciliation</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-[#E4EEF3]/60 p-6 rounded-2xl border border-[#9AAED4]/40 text-center space-y-3">
            <h3 className="text-sm font-bold text-[#173885]">
              Ready to Join as a Stockist?
            </h3>
            <p className="text-xs text-[#606460]">
              Registration takes less than 5 minutes with your business GST
              details.
            </p>
            <Link
              to="/vendor/onboarding"
              className="w-full btn-gm-primary py-3 rounded-xl text-xs font-bold block"
            >
              Start Onboarding Form
            </Link>
          </div>
        </div>

        {/* 4. How It Works: Step-by-Step */}
        <div className="space-y-8">
          <div className="text-center space-y-1 max-w-2xl mx-auto">
            <h2 className="text-2xl font-black text-[#173885]">
              How to Sell on GateMate
            </h2>
            <p className="text-xs text-[#606460]">
              Simple, transparent workflow designed for industrial building
              suppliers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {onboardingSteps.map((s) => (
              <div
                key={s.step}
                className="gm-card p-6 rounded-3xl space-y-3 border border-[#D9E2EA]"
              >
                <div className="w-10 h-10 rounded-xl bg-[#173885] text-[#FEFEFE] flex items-center justify-center text-sm font-black font-mono">
                  {s.step}
                </div>
                <h3 className="text-sm font-bold text-[#173885]">{s.title}</h3>
                <p className="text-xs text-[#606460] leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Global Dark Blue Footer */}
      <Footer />
    </div>
  );
};
