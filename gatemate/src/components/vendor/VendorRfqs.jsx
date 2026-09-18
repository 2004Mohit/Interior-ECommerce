import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Search,
  RotateCcw,
  MapPin,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Building2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Clock,
  Layers,
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

  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadRfqs = async () => {
    if (!vendorUser?.id) return;
    setLoading(true);
    const data = await vendorRfqService.getVendorRfqs();
    setRfqs(data);
    setLoading(false);
  };

  useEffect(() => {
    if (vendorUser?.id) {
      loadRfqs();
    } else {
      setLoading(false);
    }
  }, [vendorUser?.id]);

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

  return (
    <div className="space-y-6 pb-24 font-sans">
      <SeoHead
        title="Commercial Project RFQs | GateMate Vendor Portal"
        description="Inspect incoming bulk construction project RFQs, bill of quantities (BOQs), and submit competitive bids."
        canonicalUrl="/vendor/rfqs"
        noIndex={true}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div>
          <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Commercial Bidding Terminal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
            Commercial Project RFQs
          </h1>
          <p className="text-xs text-[#606460]">
            Review incoming contractor BOQs, multi-axle site delivery
            constraints, and submit formal quotations.
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

      {/* Filter Toolbar */}
      <div className="gm-panel p-4 rounded-2xl border border-[#D9E2EA] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92] pointer-events-none" />
          <input
            type="text"
            placeholder="Search by RFQ ID, project name, buyer, or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full gm-input pl-10 pr-4 py-2 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { key: "ALL", label: "All RFQs" },
            { key: RFQ_STATUS.NEW, label: "New RFQs" },
            { key: RFQ_STATUS.QUOTATION_SENT, label: "Quotation Sent" },
            { key: RFQ_STATUS.NEGOTIATION, label: "Negotiation" },
            { key: RFQ_STATUS.CONVERTED_TO_ORDER, label: "Converted to Order" },
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

      {/* RFQs List */}
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
            There are no incoming commercial project RFQs matching your filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRfqs.map((rfq) => {
            const statusCfg = RFQ_STATUS_CONFIG[rfq.status] || {
              label: rfq.status,
              badgeClass: "bg-[#F4F6FA]",
            };

            return (
              <div
                key={rfq.id}
                className="gm-panel p-5 sm:p-6 rounded-3xl border border-[#D9E2EA] hover:border-[#3C7DDA] transition space-y-4 shadow-xs"
              >
                {/* Header */}
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
                      Client:{" "}
                      <strong className="text-[#282926]">
                        {rfq.buyerName}
                      </strong>{" "}
                      • Contact:{" "}
                      <span className="font-mono">{rfq.buyerPhone}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <Link
                      to={`/vendor/rfqs/${rfq.id}`}
                      className="btn-gm-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <span>
                        {rfq.quotation ? "View Quotation" : "Submit Bid"}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Requested Products & Location */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                  {/* Products */}
                  <div className="md:col-span-7 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F8A92] block">
                      Requested BOQ Products ({rfq.requestedProducts.length}{" "}
                      line
                      {rfq.requestedProducts.length > 1 ? "s" : ""})
                    </span>
                    <div className="space-y-2">
                      {rfq.requestedProducts.map((p) => (
                        <div
                          key={p.id}
                          className="bg-[#F4F6FA] p-2.5 rounded-2xl border border-[#D9E2EA] flex items-center justify-between gap-2"
                        >
                          <div>
                            <strong className="text-[#282926] text-xs font-bold block">
                              {p.name}
                            </strong>
                            <span className="text-[10px] text-[#6F8A92] font-mono">
                              Required: {p.quantity} {p.unit}s •{" "}
                              {p.specifications}
                            </span>
                          </div>
                          <span className="badge-gm-info px-2 py-0.5 rounded text-[10px] font-mono shrink-0">
                            {p.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Location & Expiry */}
                  <div className="md:col-span-5 bg-[#F4F6FA] p-3.5 rounded-2xl border border-[#D9E2EA] space-y-2 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[#173885] font-bold">
                        <MapPin className="w-3.5 h-3.5 text-[#3C7DDA]" />
                        <span>Site Destination</span>
                      </div>
                      <p className="text-[11px] text-[#282926] font-semibold leading-relaxed">
                        {rfq.requestedDeliverySchedule.siteAddress},{" "}
                        {rfq.requestedDeliverySchedule.locality},{" "}
                        {rfq.requestedDeliverySchedule.city} -{" "}
                        {rfq.requestedDeliverySchedule.pincode}
                      </p>
                      <p className="text-[10px] text-[#606460]">
                        Target Phasing Start:{" "}
                        <strong>
                          {rfq.requestedDeliverySchedule.startDate}
                        </strong>
                      </p>
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
                        {rfq.requestedDeliverySchedule.trailerAccessConfirmed
                          ? "40-Ton Trailer Accessible"
                          : "Restricted Access"}
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
