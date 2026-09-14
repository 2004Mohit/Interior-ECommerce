import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  FileCheck,
  CheckCircle2,
  Zap,
  Truck,
  AlertCircle,
  Scale,
  Building2,
  BookOpen,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useVendorAuth } from "../../context/VendorAuthContext";
import { VendorPublicHeader } from "./VendorPublicHeader";
import { Footer } from "../Footer";
import { SeoHead } from "../common/SeoHead";

export const VendorGuidelines = () => {
  const { isVendorAuthenticated } = useVendorAuth();

  const standards = [
    {
      title: "Mandatory Primary Material Certification",
      desc: "All listed Cement, TMT Steel, CPVC Pipes, and AAC Blocks must have authentic manufacturer mill test certificates (e.g., IS 1489 for PPC Cement, IS 1786 for Fe 550D Rebars). Secondary or uncertified rerolled stock is strictly prohibited.",
      icon: ShieldCheck,
    },
    {
      title: "30-Minute Priority Dispatch SLA",
      desc: "Vendors opting into the 30-minute priority delivery badge must keep fast-moving SKUs staged for immediate driver loading and ensure packaging is completed within 8 minutes of order confirmation.",
      icon: Zap,
    },
    {
      title: "Accurate Weighment & Measurement Compliance",
      desc: "Aggregates, M-Sand, and structural steel must comply with standard brass and metric ton weighbridge slips. GateMate conducts random unannounced physical depot audits across Pune & PCMC.",
      icon: Scale,
    },
    {
      title: "Safe Loading & Trailer Access Requirements",
      desc: "Heavy commercial consignments (40-ton trailer drops) require clear depot yard loading docks, proper safety rigging, and certified loading cranes.",
      icon: Truck,
    },
  ];

  const content = (
    <div className="space-y-8 pb-16 font-sans">
      <SeoHead
        title="Vendor Quality Guidelines & Fulfillment SLAs | GateMate"
        description="Official GateMate stockist compliance guidelines, dispatch SLAs, and quality standards for Pune and PCMC construction supply depots."
        canonicalUrl="/vendor/guidelines"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div>
          <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Quality & Operations Protocol
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
            Vendor Quality & Fulfillment Guidelines
          </h1>
          <p className="text-xs text-[#606460]">
            Operational standards for verified stockists, building supply
            depots, and distributors in Pune & PCMC.
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
            <ArrowRight className="w-3.5 h-3.5 text-[#FEFEFE]" />
          </Link>
        )}
      </div>

      {/* Core Standards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {standards.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] space-y-3 bg-[#FEFEFE] shadow-xs"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#E4EEF3] text-[#173885] flex items-center justify-center">
                <Icon className="w-5 h-5 text-[#173885]" />
              </div>
              <h2 className="text-sm font-bold text-[#173885]">{s.title}</h2>
              <p className="text-xs text-[#606460] leading-relaxed">{s.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Detailed Operational Sections */}
      <div className="gm-panel p-6 sm:p-8 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-6 shadow-xs">
        <h2 className="text-base font-bold text-[#173885] border-b border-[#D9E2EA] pb-3">
          Detailed Dispatch & Settlement Policies
        </h2>

        <div className="space-y-4 text-xs text-[#282926]">
          <div className="space-y-1">
            <h3 className="font-bold text-[#173885]">
              1. E-Way Bill & GST Invoicing Protocol
            </h3>
            <p className="text-[#606460] leading-relaxed">
              Every dispatched commercial consignment must be accompanied by a
              valid tax invoice generated with the buyer’s registered GSTIN and
              an active E-Way bill when consignment value exceeds ₹50,000.
            </p>
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-[#173885]">
              2. Product Subtotal Commission Model (5%)
            </h3>
            <p className="text-[#606460] leading-relaxed">
              GateMate deducts a flat 5% platform service fee solely on the
              Product Subtotal. Freight logistics, packaging fees, and taxes are
              excluded from commission deductions.
            </p>
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-[#173885]">
              3. Direct NEFT/RTGS Bank Settlements
            </h3>
            <p className="text-[#606460] leading-relaxed">
              Payments for completed and delivered site orders are settled
              directly into the vendor’s verified bank account on a structured
              weekly cycle with transparent UTR records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // If vendor is logged in, render inside Dashboard workspace without public header/footer
  if (isVendorAuthenticated) {
    return content;
  }

  // If visitor is public/guest, render with public landing header and footer
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
