import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Search,
  RotateCcw,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronRight,
  Building2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { useVendorAuth } from "../../context/VendorAuthContext";
import {
  vendorRfqService,
  RFQ_STATUS,
  RFQ_STATUS_CONFIG,
} from "../../services/vendorRfqService";
import { SeoHead } from "../common/SeoHead";

export const VendorRfqs = () => {
  const { vendorUser } = useVendorAuth();
  const vendorId = vendorUser?.id || "vnd-pune-001";

  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadRfqs = async () => {
    setLoading(true);
    const data = await vendorRfqService.getVendorRfqs(vendorId);
    setRfqs(data);
    setLoading(false);
  };

  useEffect(() => {
    loadRfqs();
  }, [vendorId]);

  const filteredRfqs = rfqs.filter((r) => {
    const matchSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.projectName.toLowerCase().includes(search.toLowerCase()) ||
      r.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      r.requestedProducts.some((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      );
    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRfqs = rfqs.length;
  const newRfqsCount = rfqs.filter((r) => r.status === RFQ_STATUS.NEW).length;
  const pendingQuotesCount = rfqs.filter(
    (r) =>
      r.status === RFQ_STATUS.QUOTATION_SENT ||
      r.status === RFQ_STATUS.NEGOTIATION,
  ).length;
  const convertedCount = rfqs.filter(
    (r) =>
      r.status === RFQ_STATUS.CONVERTED_TO_ORDER ||
      r.status === RFQ_STATUS.COMPLETED,
  ).length;

  return (
    <div className="space-y-6 pb-24 font-sans">
      <SeoHead
        title="Commercial Project RFQs | GateMate Vendor Portal"
        description="Review builder Bill of Quantities (BOQ) inquiries, submit competitive bids, and track wholesale project quotations."
        canonicalUrl="/vendor/rfqs"
        noIndex={true}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div>
          <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Commercial Wholesale Desk
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
            Bulk Orders & Project RFQs
          </h1>
          <p className="text-xs text-[#606460]">
            Review builder Bill of Quantities (BOQ) specifications, submit
            competitive wholesale price quotes, and manage multi-stage
            dispatches.
          </p>
        </div>

        <button
          onClick={loadRfqs}
          className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh RFQs</span>
        </button>
      </div>

      {/* RFQ Notice Callout */}
      <div className="p-4 rounded-2xl bg-[#E4EEF3] border border-[#9AAED4]/40 text-xs text-[#173885] flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-[#3C7DDA] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <strong className="font-bold">Wholesale RFQ Logistics Policy:</strong>
          <p className="text-[11px] text-[#606460] leading-relaxed">
            Project RFQs represent high-volume bulk orders and do not follow the
            standard retail 30-minute delivery promise. Deliveries follow
            planned, scheduled multi-axle truck dispatches as agreed in your
            quotation.
          </p>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="gm-card p-5 rounded-2xl border border-[#D9E2EA]">
          <span className="text-[11px] font-bold text-[#6F8A92] uppercase tracking-wider block">
            Total RFQs Received
          </span>
          <div className="text-2xl font-black text-[#173885] mt-1 font-mono">
            {totalRfqs}
          </div>
          <span className="text-[10px] text-[#606460] mt-0.5 block">
            Pune & PCMC project inquiries
          </span>
        </div>

        <div className="gm-card p-5 rounded-2xl border border-[#D9E2EA] bg-[#E3EBFA]/30">
          <span className="text-[11px] font-bold text-[#173885] uppercase tracking-wider block">
            New / Awaiting Quote
          </span>
          <div className="text-2xl font-black text-[#173885] mt-1 font-mono">
            {newRfqsCount}
          </div>
          <span className="text-[10px] text-[#3C7DDA] font-semibold mt-0.5 block">
            Requires commercial review
          </span>
        </div>

        <div className="gm-card p-5 rounded-2xl border border-[#D9E2EA] bg-[#FFF0D5]/30">
          <span className="text-[11px] font-bold text-[#A66A08] uppercase tracking-wider block">
            Active Bids Sent
          </span>
          <div className="text-2xl font-black text-[#A66A08] mt-1 font-mono">
            {pendingQuotesCount}
          </div>
          <span className="text-[10px] text-[#606460] mt-0.5 block">
            Under developer consideration
          </span>
        </div>

        <div className="gm-card p-5 rounded-2xl border border-[#D9E2EA] bg-[#E1F2D9]/30">
          <span className="text-[11px] font-bold text-[#3F7D20] uppercase tracking-wider block">
            Converted Orders
          </span>
          <div className="text-2xl font-black text-[#3F7D20] mt-1 font-mono">
            {convertedCount}
          </div>
          <span className="text-[10px] text-[#3F7D20] font-semibold mt-0.5 block">
            Wholesale POs in progress
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="gm-panel p-4 rounded-2xl border border-[#D9E2EA] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92] pointer-events-none" />
          <input
            type="text"
            placeholder="Search by RFQ ID, project, contractor, or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full gm-input pl-10 pr-4 py-2 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { key: "ALL", label: "All RFQs" },
            { key: RFQ_STATUS.NEW, label: "New" },
            { key: RFQ_STATUS.QUOTATION_SENT, label: "Quotation Sent" },
            { key: RFQ_STATUS.NEGOTIATION, label: "Negotiation" },
            { key: RFQ_STATUS.ACCEPTED, label: "Accepted" },
            { key: RFQ_STATUS.CONVERTED_TO_ORDER, label: "Converted to Order" },
            { key: RFQ_STATUS.COMPLETED, label: "Completed" },
          ].map((pill) => (
            <button
              key={pill.key}
              onClick={() => setStatusFilter(pill.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                statusFilter === pill.key
                  ? "bg-[#173885] text-[#FEFEFE]"
                  : "bg-[#F4F6FA] text-[#606460] hover:bg-[#E4EEF3]"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* RFQ List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="gm-panel p-6 rounded-3xl h-36 animate-pulse bg-[#E4EEF3]"
            />
          ))}
        </div>
      ) : filteredRfqs.length === 0 ? (
        <div className="gm-panel p-16 rounded-3xl text-center space-y-3 border border-[#D9E2EA]">
          <FileText className="w-12 h-12 text-[#6F8A92] mx-auto" />
          <h3 className="text-base font-bold text-[#173885]">
            No Project RFQs Found
          </h3>
          <p className="text-xs text-[#606460]">
            There are no bulk quotation requests matching your search or status
            criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRfqs.map((rfq) => {
            const statusCfg = RFQ_STATUS_CONFIG[rfq.status] || {
              label: rfq.status,
              badgeClass: "bg-[#F4F6FA]",
            };
            const totalLines = rfq.requestedProducts.length;

            return (
              <div
                key={rfq.id}
                className="gm-panel p-5 sm:p-6 rounded-3xl border border-[#D9E2EA] hover:border-[#3C7DDA] transition space-y-4 shadow-xs"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9E2EA] pb-3.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-black text-[#173885] text-sm">
                        {rfq.id}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] ${statusCfg.badgeClass}`}
                      >
                        {statusCfg.label}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#282926]">
                      {rfq.projectName}
                    </h3>
                    <p className="text-[11px] text-[#606460]">
                      Developer / Buyer:{" "}
                      <strong className="text-[#282926]">
                        {rfq.buyerName}
                      </strong>{" "}
                      • GST: <span className="font-mono">{rfq.buyerGstin}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    {rfq.quotation ? (
                      <div className="text-right sm:block hidden">
                        <div className="font-mono font-black text-[#173885] text-base">
                          ₹
                          {rfq.quotation.estimatedGrandTotal.toLocaleString(
                            "en-IN",
                          )}
                        </div>
                        <span className="text-[10px] text-[#3F7D20] font-bold">
                          Quoted (Incl. GST)
                        </span>
                      </div>
                    ) : (
                      <div className="text-right sm:block hidden">
                        <span className="text-[11px] text-[#A66A08] font-bold bg-[#FFF0D5] px-2.5 py-1 rounded-lg">
                          Quote Pending
                        </span>
                      </div>
                    )}

                    <Link
                      to={`/vendor/rfqs/${rfq.id}`}
                      className="btn-gm-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <span>
                        {rfq.quotation
                          ? "Inspect / Modify Quote"
                          : "Inspect & Submit Quote"}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Products & Delivery Location Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                  {/* Requested Products */}
                  <div className="md:col-span-7 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F8A92] block">
                      Requested Construction Products ({totalLines} line items)
                    </span>
                    <div className="space-y-2">
                      {rfq.requestedProducts.map((prod) => (
                        <div
                          key={prod.id}
                          className="bg-[#F4F6FA] p-3 rounded-2xl border border-[#D9E2EA] space-y-1"
                        >
                          <div className="flex justify-between items-start">
                            <strong className="text-[#282926] text-xs font-bold">
                              {prod.name}
                            </strong>
                            <span className="font-mono font-black text-xs text-[#173885] bg-[#FEFEFE] px-2 py-0.5 rounded border border-[#D9E2EA]">
                              {prod.quantity} {prod.unit}s
                            </span>
                          </div>
                          <p className="text-[11px] text-[#606460]">
                            Spec: {prod.specifications}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Planned Schedule & Job Site Location */}
                  <div className="md:col-span-5 bg-[#F4F6FA] p-3.5 rounded-2xl border border-[#D9E2EA] space-y-2.5 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[#173885] font-bold">
                        <MapPin className="w-3.5 h-3.5 text-[#3C7DDA]" />
                        <span>Project Site Destination</span>
                      </div>
                      <p className="text-[11px] text-[#282926] font-semibold leading-relaxed">
                        {rfq.requestedDeliverySchedule.siteAddress},{" "}
                        {rfq.requestedDeliverySchedule.locality} -{" "}
                        {rfq.requestedDeliverySchedule.pincode}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-[#606460] pt-1">
                        <Calendar className="w-3 h-3 text-[#173885]" />
                        <span>
                          Target Start:{" "}
                          <strong>
                            {rfq.requestedDeliverySchedule.startDate}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          {rfq.requestedDeliverySchedule.stagedDelivery
                            ? "Staged Runs"
                            : "Single Consignment"}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#D9E2EA] flex items-center justify-between text-[10px] text-[#6F8A92] font-mono">
                      <span>
                        Expires:{" "}
                        {new Date(rfq.expiryDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span className="text-[#173885] font-bold">
                        Trailer Access:{" "}
                        {rfq.requestedDeliverySchedule.trailerAccessConfirmed
                          ? "Yes"
                          : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
