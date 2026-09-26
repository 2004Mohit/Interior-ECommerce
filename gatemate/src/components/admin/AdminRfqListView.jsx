import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Search,
  Filter,
  RotateCcw,
  Building2,
  Calendar,
  MapPin,
  Eye,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShoppingCart,
} from "lucide-react";
import { adminRfqService } from "../../services/adminRfqService";
import { AdminPermissionGuard } from "./AdminPermissionGuard";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";
import { SeoHead } from "../common/SeoHead";

const STATUS_FILTERS = [
  { label: "All RFQs", value: "ALL" },
  { label: "Open / Submitted", value: "OPEN" },
  { label: "Quotations Received", value: "QUOTATIONS_RECEIVED" },
  { label: "Quotation Accepted", value: "QUOTATION_ACCEPTED" },
  { label: "Converted to Order", value: "CONVERTED_TO_ORDER" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Expired", value: "EXPIRED" },
];

export const AdminRfqListView = () => {
  const [rfqs, setRfqs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminRfqService.getRfqs({
        search,
        status: statusFilter,
        limit: 100,
      });
      setRfqs(res.rfqs);
      setTotalCount(res.totalCount);
    } catch (err) {
      setError(err.message || "Failed to load commercial RFQs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "CONVERTED_TO_ORDER":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30">
            CONVERTED TO ORDER
          </span>
        );
      case "QUOTATION_ACCEPTED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30">
            QUOTATION ACCEPTED
          </span>
        );
      case "QUOTATIONS_RECEIVED":
      case "RESPONDED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#E4EEF3] text-[#3C7DDA] border border-[#3C7DDA]/30">
            QUOTATIONS RECEIVED
          </span>
        );
      case "OPEN":
      case "NEW":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FFF0D5] text-[#A66A08] border border-[#A66A08]/30">
            OPEN FOR BIDDING
          </span>
        );
      case "EXPIRED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#F4F6FA] text-[#606460] border border-[#D9E2EA]">
            EXPIRED
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FBE3DE] text-[#B43D20] border border-[#B43D20]/30">
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#F4F6FA] text-[#606460]">
            {status}
          </span>
        );
    }
  };

  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.MANAGE_RFQ}>
      <div className="space-y-6 pb-20 font-sans">
        <SeoHead
          title="Commercial RFQ Oversight | Ferrado Admin"
          description="Track high-volume contractor material inquiries, vendor bid submissions, and commercial quotation conversions."
          canonicalUrl="/admin/rfqs"
          noIndex={true}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
          <div>
            <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Commercial Project Inquiries
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
              Commercial RFQ Command Center
            </h1>
            <p className="text-xs text-[#606460]">
              Oversee B2B project inquiries, bulk material requirements, vendor
              bid timelines, and order conversions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/quotations"
              className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-[#3C7DDA]" />
              <span>Quotations Master Ledger</span>
            </Link>
            <button
              onClick={loadData}
              disabled={loading}
              className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <RotateCcw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Toolbar */}
        <div className="gm-panel p-4 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-2xs">
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1 max-w-md"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92]" />
            <input
              type="text"
              placeholder="Search RFQ ID, project name, contact person, or vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full gm-input pl-10 pr-20 py-2 rounded-xl text-xs"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 btn-gm-primary px-3 py-1 rounded-lg text-xs font-bold"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <Filter className="w-3.5 h-3.5 text-[#6F8A92] shrink-0 mr-1" />
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                  statusFilter === f.value
                    ? "bg-[#173885] text-[#FEFEFE] shadow-xs"
                    : "bg-[#F4F6FA] text-[#606460] hover:bg-[#E4EEF3] hover:text-[#173885]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* RFQ List */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-28 bg-[#FEFEFE] rounded-2xl border border-[#D9E2EA]"
              />
            ))}
          </div>
        ) : rfqs.length === 0 ? (
          <div className="gm-panel p-12 rounded-3xl border border-[#D9E2EA] text-center space-y-2 bg-[#FEFEFE]">
            <FileText className="w-10 h-10 text-[#6F8A92] mx-auto" />
            <h2 className="text-base font-bold text-[#173885]">
              No Commercial RFQs Found
            </h2>
            <p className="text-xs text-[#606460]">
              No B2B quotation requests match the specified criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rfqs.map((rfq) => {
              const quotesCount = rfq.quotations?.length || 0;
              const hasOrder = Boolean(rfq.converted_order_id);

              return (
                <div
                  key={rfq.id}
                  className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-[#3C7DDA] transition shadow-2xs"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-sm text-[#173885]">
                        {rfq.project_name || "Commercial Construction Inquiry"}
                      </span>
                      {getStatusBadge(rfq.status)}
                      <span className="text-[10px] font-mono text-[#6F8A92] bg-[#F4F6FA] px-2 py-0.5 rounded-md">
                        ID: {rfq.id.slice(0, 8)}...
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#606460]">
                      <span className="flex items-center gap-1 font-semibold text-[#282926]">
                        <Building2 className="w-3.5 h-3.5 text-[#3C7DDA]" />
                        <span>
                          Contractor: {rfq.contact_name || "Site Buyer"}
                        </span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#6F8A92]" />
                        <span>{rfq.delivery_location || "Pune Site"}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#6F8A92]" />
                        <span>
                          Req Delivery:{" "}
                          {rfq.required_delivery_date || "Standard Timeline"}
                        </span>
                      </span>
                      <span>•</span>
                      <span className="font-bold text-[#173885]">
                        {quotesCount}{" "}
                        {quotesCount === 1 ? "Quotation" : "Quotations"}{" "}
                        Received
                      </span>
                    </div>

                    {rfq.admin_notes && (
                      <p className="text-[11px] text-[#A66A08] bg-[#FFF0D5] px-2.5 py-0.5 rounded-md inline-block">
                        <strong>Admin Remark:</strong> {rfq.admin_notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                    {hasOrder && (
                      <Link
                        to={`/admin/orders/${rfq.converted_order_id}`}
                        className="btn-gm-secondary px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1"
                        title="View Converted Order"
                      >
                        <ShoppingCart className="w-3.5 h-3.5 text-[#3F7D20]" />
                        <span>Order #{rfq.converted_order_id.slice(0, 8)}</span>
                      </Link>
                    )}
                    <Link
                      to={`/admin/rfqs/${rfq.id}`}
                      className="btn-gm-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#FEFEFE]" />
                      <span>Inspect RFQ</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminPermissionGuard>
  );
};
