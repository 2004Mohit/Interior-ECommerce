import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  FileCheck,
  Zap,
  AlertTriangle,
  Clock,
  Scale,
  Ban,
  CheckCircle2,
  Building2,
  ArrowRight,
  FileText,
  Check,
} from "lucide-react";
import { VendorPublicHeader } from "./VendorPublicHeader";
import { Footer } from "../Footer";
import { SeoHead } from "../common/SeoHead";

export const VendorGuidelines = () => {
  const guidelines = [
    {
      id: "rule-1",
      title: "1. Business Registration & Contact Accuracy",
      icon: Building2,
      points: [
        "Vendors must maintain valid, verified business entity credentials and an active 15-character GSTIN registered in Maharashtra (State Code 27) for local operations.",
        "Primary contact details, dispatch manager phone numbers, and physical warehouse/depot addresses must remain accurate and reachable during stated working hours.",
      ],
    },
    {
      id: "rule-2",
      title: "2. Legitimate Construction Products Only",
      icon: ShieldCheck,
      points: [
        "Only legitimate construction products, industrial hardware, electrical supplies, plumbing systems, and structural building supplies are permitted.",
        "Products must adhere to Indian Standards (BIS/ISI, Fe 550D, IS 1489, IS 1786, IS 4985) and be sourced directly from authorized manufacturers or certified primary stockists.",
      ],
    },
    {
      id: "rule-3",
      title: "3. Accurate Technical Specifications & Pricing",
      icon: FileCheck,
      points: [
        "Product listings must accurately state structural grades, diameters, dimensions, units of measurement (Bag, Piece, Brass, Can), and Minimum Order Quantities (MOQ).",
        "Listed prices must reflect genuine commercial unit rates inclusive of applicable GST. Hidden surcharges or misleading price reductions are strictly prohibited.",
      ],
    },
    {
      id: "rule-4",
      title: "4. Inventory Accuracy & Real-Time Stock Updates",
      icon: Scale,
      points: [
        "Vendors are obligated to maintain accurate digital stock levels matching physical depot availability.",
        'Mark products as "Out of Stock" immediately when physical inventory is depleted to prevent customer order cancellations.',
      ],
    },
    {
      id: "rule-5",
      title: "5. Prompt Order Acceptance & Dispatch Preparation",
      icon: Clock,
      points: [
        "Incoming site orders must be accepted or rejected within 10 minutes of placement during operational depot hours.",
        "Products must be inspected, bundled, and staged for vehicle loading within the promised turnaround schedule.",
      ],
    },
    {
      id: "rule-6",
      title: "6. 30-Minute Priority Delivery Eligibility & Protocol",
      icon: Zap,
      points: [
        "30-minute priority dispatch is restricted to eligible products and designated delivery corridors in Pune & PCMC.",
        "Vendors must never enable or promise 30-minute delivery if vehicle loading or staging cannot be executed within 10 minutes.",
        "Operating hours must be strictly configured to prevent customer expectations of 30-minute delivery outside active dispatch hours.",
      ],
    },
    {
      id: "rule-7",
      title: "7. Legal, Tax & e-Way Bill Compliance",
      icon: FileText,
      points: [
        "Every dispatch must accompany a valid GST Tax Invoice and e-Way Bill for consignments exceeding statutory thresholds.",
        "Vendors are solely responsible for remitting collected taxes and issuing GST input tax credit (ITC) compliant invoices.",
      ],
    },
    {
      id: "rule-8",
      title: "8. Prohibited, Fraudulent & Counterfeit Products",
      icon: Ban,
      points: [
        "Zero tolerance for counterfeit cement brands, secondary re-rolled non-standard steel rebars, expired chemical admixtures, or misleading product descriptions.",
        "Violations result in immediate vendor suspension, forfeiture of pending settlements, and referral to commercial regulatory authorities.",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-[#282926] flex flex-col font-sans">
      <SeoHead
        title="Vendor Quality & Dispatch Guidelines | GateMate Construction Marketplace"
        description="Comprehensive operational rules, technical quality standards, 30-minute delivery fulfillment requirements, and tax compliance guidelines for GateMate stockist partners."
        canonicalUrl="/vendor/guidelines"
      />

      <VendorPublicHeader />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="badge-gm-info px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            Operational Code of Conduct
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#173885] tracking-tight">
            Vendor Quality & Dispatch Guidelines
          </h1>
          <p className="text-xs sm:text-sm text-[#606460] leading-relaxed">
            These standards ensure safety, structural compliance, and prompt
            fulfillment for construction sites across Pune and Pimpri-Chinchwad.
          </p>
        </div>

        {/* Core Principles Grid */}
        <div className="space-y-6">
          {guidelines.map((g) => {
            const Icon = g.icon;
            return (
              <div
                key={g.id}
                className="gm-panel p-6 sm:p-8 rounded-3xl border border-[#D9E2EA] space-y-3.5"
              >
                <div className="flex items-center gap-3 border-b border-[#D9E2EA] pb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E4EEF3] border border-[#9AAED4]/40 flex items-center justify-center text-[#173885] shrink-0">
                    <Icon className="w-5 h-5 text-[#173885]" />
                  </div>
                  <h2 className="text-base font-bold text-[#173885]">
                    {g.title}
                  </h2>
                </div>

                <ul className="space-y-2 text-xs text-[#606460] leading-relaxed">
                  {g.points.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#3F7D20] shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Policy Summary Callout */}
        <div className="gm-card p-6 sm:p-8 rounded-3xl border border-[#D9E2EA] bg-[#E4EEF3]/40 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-sm font-bold text-[#173885]">
              Questions Regarding Compliance?
            </h3>
            <p className="text-xs text-[#606460]">
              Our contractor and vendor onboarding desk is available to assist
              with product categorizations and batch test documentation.
            </p>
          </div>
          <Link
            to="/vendor/onboarding"
            className="btn-gm-primary px-6 py-3 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2"
          >
            <span>Proceed to Onboarding</span>
            <ArrowRight className="w-4 h-4 text-[#FEFEFE]" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};
