import React from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Clock3,
  ArrowLeft,
  ShieldCheck,
  Package,
} from "lucide-react";

import { SeoHead } from "../common/SeoHead";

export const VendorRfqs = () => {
  return (
    <div className="space-y-6 pb-24 font-sans">
      <SeoHead
        title="Commercial RFQs & Quotations | Ferrado Vendor Portal"
        description="Commercial project RFQs and quotation management are coming soon."
        canonicalUrl="/vendor/rfqs"
        noIndex={true}
      />

      {/* Header */}
      <div className="border-b border-[#D9E2EA] pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Commercial Bidding
            </span>

            <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-2">
              Commercial Project RFQs
            </h1>

            <p className="text-xs text-[#606460] mt-1 max-w-2xl">
              Commercial project RFQs, vendor quotations, and bulk-order
              workflows will be available here.
            </p>
          </div>

          <Link
            to="/vendor"
            className="btn-gm-secondary px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Vendor Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Coming Soon Content */}
      <div className="gm-panel rounded-3xl border border-[#D9E2EA] overflow-hidden">
        <div className="p-8 sm:p-12 lg:p-16">
          <div className="max-w-3xl mx-auto text-center">
            {/* Icon */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#E4EEF3] border border-[#D9E2EA] mx-auto flex items-center justify-center">
              <Clock3 className="w-10 h-10 sm:w-12 sm:h-12 text-[#173885]" />
            </div>

            {/* Badge */}
            <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFF0D5] border border-[#A66A08]/30 text-[#A66A08] text-[10px] font-black uppercase tracking-wider">
              <Clock3 className="w-3.5 h-3.5" />
              Coming Soon
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-black text-[#173885] mt-4">
              Commercial RFQs & Quotations
            </h2>

            {/* Description */}
            <p className="text-sm text-[#606460] leading-relaxed max-w-2xl mx-auto mt-4">
              We are currently preparing the commercial RFQ and quotation
              workflow for vendors. This will allow vendors to review project
              requirements, submit commercial quotations, and manage future
              bulk-order opportunities.
            </p>

            {/* Feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 text-left">
              <div className="p-5 rounded-2xl bg-[#F4F6FA] border border-[#D9E2EA]">
                <div className="w-10 h-10 rounded-xl bg-[#E4EEF3] flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5 text-[#173885]" />
                </div>

                <h3 className="text-xs font-black text-[#282926]">
                  Project RFQs
                </h3>

                <p className="text-[11px] text-[#606460] mt-1.5 leading-relaxed">
                  Receive and review commercial construction project
                  requirements.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#F4F6FA] border border-[#D9E2EA]">
                <div className="w-10 h-10 rounded-xl bg-[#E4EEF3] flex items-center justify-center mb-3">
                  <Package className="w-5 h-5 text-[#173885]" />
                </div>

                <h3 className="text-xs font-black text-[#282926]">
                  Commercial Quotations
                </h3>

                <p className="text-[11px] text-[#606460] mt-1.5 leading-relaxed">
                  Prepare and submit pricing for larger project requirements.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#F4F6FA] border border-[#D9E2EA]">
                <div className="w-10 h-10 rounded-xl bg-[#E4EEF3] flex items-center justify-center mb-3">
                  <ShieldCheck className="w-5 h-5 text-[#173885]" />
                </div>

                <h3 className="text-xs font-black text-[#282926]">
                  Secure Workflow
                </h3>

                <p className="text-[11px] text-[#606460] mt-1.5 leading-relaxed">
                  Commercial ordering and quotation workflows will be introduced
                  in a controlled future release.
                </p>
              </div>
            </div>

            {/* Bottom notice */}
            <div className="mt-10 p-4 sm:p-5 rounded-2xl bg-[#E4EEF3]/70 border border-[#D9E2EA]">
              <p className="text-xs text-[#606460] leading-relaxed">
                <strong className="text-[#173885]">For now:</strong> Continue
                managing your regular products, inventory, and customer orders
                through the available vendor features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorRfqs;
