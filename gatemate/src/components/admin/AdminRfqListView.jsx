import React from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Clock3,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  Users,
  MessageSquareQuote,
  ShoppingCart,
  Bell,
  GitBranch,
} from "lucide-react";
import { AdminPermissionGuard } from "./AdminPermissionGuard";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";
import { SeoHead } from "../common/SeoHead";

const REMAINING_FEATURES = [
  {
    icon: FileText,
    title: "Commercial RFQ Creation & Lifecycle",
    description:
      "Complete the end-to-end commercial project RFQ workflow from request creation through closure.",
  },
  {
    icon: Users,
    title: "Vendor Quotation Workflow",
    description:
      "Complete the vendor-side quotation submission, revision, response, and lifecycle handling.",
  },
  {
    icon: MessageSquareQuote,
    title: "Quotation Comparison & Negotiation",
    description:
      "Complete the Admin workflow for reviewing, comparing, and managing vendor quotations.",
  },
  {
    icon: GitBranch,
    title: "RFQ Status & Conversion Flow",
    description:
      "Complete and validate the RFQ lifecycle, quotation acceptance, and conversion into an order.",
  },
  {
    icon: Bell,
    title: "RFQ Notifications",
    description:
      "Complete notifications and operational communication for RFQ and quotation status changes.",
  },
];

const EXISTING_FOUNDATION = [
  "Commercial RFQ database structure",
  "Vendor quotation data structure",
  "Admin RFQ permission",
  "Admin RFQ service layer",
  "RFQ status management foundation",
];

export const AdminRfqListView = () => {
  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.MANAGE_RFQ}>
      <div className="space-y-6 pb-20 font-sans">
        <SeoHead
          title="Commercial Project RFQs | Feature Paused | Ferrado Admin"
          description="Commercial Project RFQ administration is currently paused while the remaining workflow is completed."
          canonicalUrl="/admin/rfqs"
          noIndex={true}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 border-b border-[#D9E2EA] pb-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FFF0D5] text-[#A66A08] border border-[#A66A08]/30">
                Feature Paused
              </span>

              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#F4F6FA] text-[#606460] border border-[#D9E2EA]">
                Remaining to Complete
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-2">
              Commercial Project RFQs
            </h1>

            <p className="text-xs text-[#606460] mt-1 max-w-2xl">
              Commercial project RFQ operations are currently paused during MVP
              development. This module will be enabled after the remaining RFQ,
              quotation, and conversion workflows are completed and validated.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/admin"
              className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Operations</span>
            </Link>
          </div>
        </div>

        {/* Main Status Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] shadow-2xs">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-[#A66A08]" />

          <div className="p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-[#FFF0D5] border border-[#A66A08]/20 flex items-center justify-center shrink-0">
                <Clock3 className="w-8 h-8 text-[#A66A08]" />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-[#A66A08]" />

                  <span className="text-[11px] font-black uppercase tracking-wider text-[#A66A08]">
                    Development Status
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-[#173885]">
                  Commercial RFQ workflow is not available for live operations
                  yet.
                </h2>

                <p className="text-sm text-[#606460] mt-2 max-w-3xl leading-6">
                  The Admin console currently keeps the Commercial Project RFQ
                  area visible so the team can clearly track that this feature
                  is still part of the product roadmap. Do not use this section
                  for live commercial project processing until the remaining
                  workflow is completed.
                </p>
              </div>

              <div className="lg:min-w-[190px]">
                <div className="rounded-2xl border border-[#D9E2EA] bg-[#F4F6FA] p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#6F8A92]">
                    Current State
                  </p>

                  <p className="text-lg font-black text-[#A66A08] mt-1">
                    PAUSED
                  </p>

                  <p className="text-[11px] text-[#606460] mt-1">
                    Awaiting completion
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Remaining Work */}
        <section className="gm-panel rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] overflow-hidden">
          <div className="px-6 py-5 border-b border-[#D9E2EA]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E4EEF3] flex items-center justify-center">
                <GitBranch className="w-4 h-4 text-[#3C7DDA]" />
              </div>

              <div>
                <h2 className="text-base font-black text-[#173885]">
                  Remaining Work
                </h2>

                <p className="text-[11px] text-[#606460] mt-0.5">
                  These areas need to be completed before this module is enabled
                  for operations.
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-[#D9E2EA]">
            {REMAINING_FEATURES.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="px-6 py-5 flex items-start gap-4"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#FFF0D5] border border-[#A66A08]/20 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[#A66A08]" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#282926]">
                        {index + 1}. {feature.title}
                      </span>

                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide bg-[#FFF0D5] text-[#A66A08] border border-[#A66A08]/20">
                        Remaining
                      </span>
                    </div>

                    <p className="text-xs text-[#606460] mt-1.5 leading-5 max-w-3xl">
                      {feature.description}
                    </p>
                  </div>

                  <Circle className="w-4 h-4 text-[#A66A08] shrink-0 mt-1" />
                </div>
              );
            })}
          </div>
        </section>

        {/* Existing Foundation */}
        <section className="gm-panel rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] overflow-hidden">
          <div className="px-6 py-5 border-b border-[#D9E2EA]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E1F2D9] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-[#3F7D20]" />
              </div>

              <div>
                <h2 className="text-base font-black text-[#173885]">
                  Existing Foundation
                </h2>

                <p className="text-[11px] text-[#606460] mt-0.5">
                  The following Admin-side foundation already exists.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {EXISTING_FOUNDATION.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-2.5 rounded-xl border border-[#D9E2EA] bg-[#F8FAFC] p-3"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#3F7D20] shrink-0 mt-0.5" />

                  <span className="text-xs font-semibold text-[#282926] leading-5">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What Admin Should Know */}
        <section className="rounded-3xl border border-[#D9E2EA] bg-[#F4F6FA] p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#E4EEF3] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#3C7DDA]" />
            </div>

            <div>
              <h2 className="text-sm font-black text-[#173885]">
                Admin Operational Notice
              </h2>

              <p className="text-xs text-[#606460] mt-1.5 leading-5 max-w-4xl">
                This screen is intentionally informational. No commercial RFQ
                records are loaded or modified from this page while the feature
                is paused. Once the remaining workflow is completed, this page
                can be restored as the operational RFQ Command Center.
              </p>
            </div>
          </div>
        </section>

        {/* Footer Status */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#A66A08]" />

            <span className="text-[11px] font-bold text-[#606460]">
              Commercial Project RFQs
            </span>

            <span className="text-[11px] text-[#6F8A92]">• Feature paused</span>
          </div>

          <div className="text-[10px] text-[#6F8A92]">
            Enable after end-to-end RFQ workflow validation
          </div>
        </div>
      </div>
    </AdminPermissionGuard>
  );
};
