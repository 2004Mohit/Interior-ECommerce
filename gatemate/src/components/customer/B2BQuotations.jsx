import React from "react";
import { Building2, Clock3 } from "lucide-react";
import { AccountNav } from "./AccountNav";

export const B2BQuotations = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Account Sidebar */}
        <div className="md:col-span-1">
          <AccountNav />
        </div>

        {/* Commercial B2B RFQs Content */}
        <div className="md:col-span-3">
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#173885]">
                  Commercial B2B RFQs
                </h1>

                <p className="mt-2 text-sm text-[#606460]">
                  Submit and track bulk project quotation requests.
                </p>
              </div>
            </div>

            {/* Coming Soon Panel */}
            <div className="gm-panel rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] min-h-[430px] flex items-center justify-center p-8 sm:p-12">
              <div className="max-w-xl text-center">
                {/* Icon */}
                <div className="w-20 h-20 mx-auto rounded-3xl bg-[#E4EEF3] border border-[#D9E2EA] text-[#173885] flex items-center justify-center">
                  <Building2 className="w-9 h-9" />
                </div>

                {/* Heading */}
                <h2 className="mt-6 text-2xl font-extrabold text-[#173885]">
                  Commercial B2B RFQs
                </h2>

                {/* Coming Soon Badge */}
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E4EEF3] border border-[#C9DCE8] text-[#173885] text-xs font-bold">
                  <Clock3 className="w-4 h-4" />
                  Coming Soon
                </div>

                {/* Description */}
                <p className="mt-6 text-sm leading-6 text-[#606460]">
                  Commercial quotation requests, bulk project requirements,
                  vendor quotations, and B2B ordering are currently under
                  development.
                </p>

                <p className="mt-3 text-sm leading-6 text-[#606460]">
                  This section will be available in a future Ferrado update.
                </p>

                {/* Feature Information */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                  <div className="rounded-2xl border border-[#D9E2EA] bg-[#F8FAFC] p-4">
                    <p className="text-xs font-bold text-[#173885]">
                      Project RFQs
                    </p>
                    <p className="mt-1 text-[11px] leading-4 text-[#606460]">
                      Request quotations for larger construction requirements.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#D9E2EA] bg-[#F8FAFC] p-4">
                    <p className="text-xs font-bold text-[#173885]">
                      Vendor Quotations
                    </p>
                    <p className="mt-1 text-[11px] leading-4 text-[#606460]">
                      Compare commercial quotations from vendors.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#D9E2EA] bg-[#F8FAFC] p-4">
                    <p className="text-xs font-bold text-[#173885]">
                      Bulk Orders
                    </p>
                    <p className="mt-1 text-[11px] leading-4 text-[#606460]">
                      Manage larger project-oriented construction orders.
                    </p>
                  </div>
                </div>

                {/* Status Note */}
                <div className="mt-8 pt-6 border-t border-[#E4EAF0]">
                  <p className="text-xs text-[#7A8188]">
                    You can continue using Ferrado for regular construction
                    product purchases and 30-minute eligible deliveries.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
