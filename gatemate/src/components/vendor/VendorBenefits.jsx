import React from "react";
import { Users, Zap, CreditCard, Boxes, FileText, Award } from "lucide-react";
import { useVendorAuth } from "../../context/VendorAuthContext";
import { VendorPublicHeader } from "./VendorPublicHeader";
import { VendorLayout } from "./VendorLayout";
import { Footer } from "../Footer";
import { SeoHead } from "../common/SeoHead";

export const VendorBenefits = () => {
  const { vendorUser, loading } = useVendorAuth();

  const benefits = [
    {
      title: "Access to Construction Product Demand",
      desc: "Connect with customers, contractors, builders, and project buyers looking for construction products across Pune and PCMC.",
      icon: Users,
    },
    {
      title: "Commercial RFQ Opportunities",
      desc: "Receive commercial requirements and BOQ-based RFQs for larger construction-product orders.",
      icon: FileText,
    },
    {
      title: "30-Minute Dispatch Eligibility",
      desc: "Eligible vendors can participate in the 30-minute dispatch program for qualifying products and serviceable locations.",
      icon: Zap,
    },
    {
      title: "Transparent Bank Settlements",
      desc: "Track completed-order settlement information and relevant transaction references from the vendor terminal.",
      icon: CreditCard,
    },
    {
      title: "Inventory Management",
      desc: "Maintain product availability, quantities, minimum order quantities, and inventory information from the vendor terminal.",
      icon: Boxes,
    },
    {
      title: "Customer Reviews",
      desc: "Build trust through verified customer feedback associated with completed product orders.",
      icon: Award,
    },
  ];

  const content = (
    <div className="w-full space-y-8 pb-12 font-sans">
      <SeoHead
        title="Vendor Benefits & Growth Program | Ferrado"
        description="Discover Ferrado vendor benefits, sales opportunities, inventory tools, dispatch programs, and settlement visibility."
        canonicalUrl="/vendor/benefits"
      />

      <div className="border-b border-[#D9E2EA] pb-5">
        <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          Vendor Growth Program
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-2">
          Ferrado Vendor Benefits
        </h1>

        <p className="text-xs text-[#606460] mt-1 max-w-3xl leading-relaxed">
          Tools and commercial opportunities designed to help verified vendors
          manage construction-product sales through Ferrado.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {benefits.map((benefit) => {
          const Icon = benefit.icon;

          return (
            <div
              key={benefit.title}
              className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] space-y-3 bg-[#FEFEFE] shadow-xs"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#E4EEF3] flex items-center justify-center">
                <Icon className="w-5 h-5 text-[#173885]" />
              </div>

              <h2 className="text-sm font-bold text-[#173885]">
                {benefit.title}
              </h2>

              <p className="text-xs text-[#606460] leading-relaxed">
                {benefit.desc}
              </p>
            </div>
          );
        })}
      </div>

      <div className="gm-panel p-6 sm:p-8 rounded-3xl border border-[#9AAED4]/40 bg-[#E4EEF3]/60">
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-[#173885]">
            Manage Your Vendor Operations
          </h2>

          <p className="text-xs text-[#606460] leading-relaxed max-w-3xl">
            Use the Vendor Terminal to manage products, inventory, orders, RFQs,
            quotations, settlements, reviews, notifications, and your verified
            business profile.
          </p>
        </div>
      </div>
    </div>
  );

  /*
   * Wait until VendorAuthProvider knows whether
   * a vendor session exists.
   */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6FA] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#D9E2EA] border-t-[#173885] animate-spin" />
      </div>
    );
  }

  /*
   * SIGNED-IN VENDOR
   *
   * VendorLayout provides:
   * - VendorSidebar
   * - VendorHeader
   * - Terminal content area
   */
  if (vendorUser) {
    return <VendorLayout>{content}</VendorLayout>;
  }

  /*
   * GUEST
   */
  return (
    <div className="min-h-screen bg-[#F4F6FA] text-[#282926] flex flex-col font-sans">
      <VendorPublicHeader />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {content}
      </main>

      <Footer />
    </div>
  );
};
