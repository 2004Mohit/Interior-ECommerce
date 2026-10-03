import React from "react";
import { ShieldCheck, Zap, Truck, Scale } from "lucide-react";
import { useVendorAuth } from "../../context/VendorAuthContext";
import { VendorPublicHeader } from "./VendorPublicHeader";
import { VendorLayout } from "./VendorLayout";
import { Footer } from "../Footer";
import { SeoHead } from "../common/SeoHead";

export const VendorGuidelines = () => {
  const { vendorUser, loading } = useVendorAuth();

  const standards = [
    {
      title: "Mandatory Product Certification",
      desc: "All listed construction products must meet the applicable manufacturer, quality, and certification requirements. Vendors must maintain genuine product documentation and must not list counterfeit, uncertified, or materially misrepresented products.",
      icon: ShieldCheck,
    },
    {
      title: "30-Minute Priority Dispatch",
      desc: "Vendors enabled for 30-minute dispatch must keep eligible fast-moving products ready for immediate processing and ensure the order can be prepared within the required dispatch window.",
      icon: Zap,
    },
    {
      title: "Accurate Weighment & Measurement",
      desc: "Products sold by weight, volume, length, or quantity must be represented accurately. Vendors are responsible for ensuring that quantities, units, packaging, and dispatch records match the actual order.",
      icon: Scale,
    },
    {
      title: "Safe Loading & Vehicle Access",
      desc: "Heavy construction-product consignments require safe loading practices, suitable access for delivery vehicles, appropriate handling equipment, and a safe depot operating environment.",
      icon: Truck,
    },
  ];

  const content = (
    <div className="w-full space-y-8 pb-12 font-sans">
      <SeoHead
        title="Vendor Quality Guidelines & Fulfillment | Ferrado"
        description="Ferrado vendor quality, product handling, dispatch, and operational guidelines."
        canonicalUrl="/vendor/guidelines"
      />

      <div className="border-b border-[#D9E2EA] pb-5">
        <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          Quality & Operations Protocol
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-2">
          Vendor Quality & Fulfillment Guidelines
        </h1>

        <p className="text-xs text-[#606460] mt-1 max-w-3xl leading-relaxed">
          Operational standards for vendors supplying construction products
          through Ferrado across Pune and PCMC.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {standards.map((standard) => {
          const Icon = standard.icon;

          return (
            <div
              key={standard.title}
              className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] space-y-3 bg-[#FEFEFE] shadow-xs"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#E4EEF3] flex items-center justify-center">
                <Icon className="w-5 h-5 text-[#173885]" />
              </div>

              <h2 className="text-sm font-bold text-[#173885]">
                {standard.title}
              </h2>

              <p className="text-xs text-[#606460] leading-relaxed">
                {standard.desc}
              </p>
            </div>
          );
        })}
      </div>

      <div className="gm-panel p-6 sm:p-8 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-6 shadow-xs">
        <h2 className="text-base font-bold text-[#173885] border-b border-[#D9E2EA] pb-3">
          Detailed Operational Policies
        </h2>

        <div className="space-y-5 text-xs text-[#282926]">
          <div className="space-y-1.5">
            <h3 className="font-bold text-[#173885]">
              1. Product Documentation
            </h3>

            <p className="text-[#606460] leading-relaxed">
              Vendors must maintain accurate manufacturer information,
              applicable product specifications, invoices, certificates, and
              supporting documentation for products listed on Ferrado.
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-bold text-[#173885]">2. Order Accuracy</h3>

            <p className="text-[#606460] leading-relaxed">
              The product, quantity, unit, packaging, and price supplied must
              correspond with the confirmed customer order.
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-bold text-[#173885]">3. Dispatch Readiness</h3>

            <p className="text-[#606460] leading-relaxed">
              Vendors must keep inventory information current and promptly
              prepare confirmed orders according to the applicable dispatch
              requirements.
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-bold text-[#173885]">4. Compliance & Safety</h3>

            <p className="text-[#606460] leading-relaxed">
              Vendors are responsible for maintaining a safe depot environment
              and complying with applicable product, transportation, tax,
              invoicing, and operational requirements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  /*
   * Wait for VendorAuthProvider to determine the session.
   * This prevents the public layout from flashing before
   * an existing vendor session is restored.
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
   *
   * VendorGuidelines provides only the page content.
   */
  if (vendorUser) {
    return <VendorLayout>{content}</VendorLayout>;
  }

  /*
   * GUEST
   *
   * Guests get the normal public vendor page.
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
