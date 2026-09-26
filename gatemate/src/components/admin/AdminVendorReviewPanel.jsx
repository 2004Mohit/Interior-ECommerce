import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Search,
  Filter,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Building2,
  MapPin,
  Eye,
  FileText,
} from "lucide-react";
import { adminVendorService } from "../../services/adminVendorService";
import { AdminPermissionGuard } from "./AdminPermissionGuard";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";
import { SeoHead } from "../common/SeoHead";

const STATUS_FILTERS = [
  { label: "All Vendors", value: "ALL" },
  { label: "Under Review", value: "UNDER_REVIEW" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Changes Requested", value: "CHANGES_REQUESTED" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Draft", value: "DRAFT" },
];

export const AdminVendorReviewPanel = () => {
  const [applications, setApplications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminVendorService.getVendorApplications({
        search,
        status: statusFilter,
        limit: 100,
      });
      setApplications(res.applications);
      setTotalCount(res.totalCount);
    } catch (err) {
      setError(err.message || "Failed to load vendor application queue.");
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
      case "APPROVED":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30">
            APPROVED
          </span>
        );
      case "UNDER_REVIEW":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#FFF0D5] text-[#A66A08] border border-[#A66A08]/30">
            UNDER REVIEW
          </span>
        );
      case "SUBMITTED":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#E4EEF3] text-[#173885] border border-[#3C7DDA]/30">
            SUBMITTED
          </span>
        );
      case "CHANGES_REQUESTED":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#FFF0D5] text-[#A66A08] border border-[#A66A08]/30">
            CHANGES REQUESTED
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#FBE3DE] text-[#B43D20] border border-[#B43D20]/30">
            REJECTED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#F4F6FA] text-[#606460] border border-[#D9E2EA]">
            DRAFT
          </span>
        );
    }
  };

  return (
    <AdminPermissionGuard
      permission={ADMIN_PERMISSIONS.REVIEW_VENDOR_APPLICATIONS}
    >
      <div className="space-y-6 pb-20 font-sans">
        <SeoHead
          title="Vendor Reviews & Onboarding Queue | Ferrado Admin"
          description="Review, inspect, approve, or reject vendor onboarding applications across Pune & PCMC."
          canonicalUrl="/admin/vendor-reviews"
          noIndex={true}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
          <div>
            <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Stockist Network Verification
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
              Vendor Onboarding & Verification
            </h1>
            <p className="text-xs text-[#606460]">
              Inspect business identities, yard accessibility, and dispatch
              readiness for regional vendors.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RotateCcw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span>Refresh Queue</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="gm-panel p-4 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1 max-w-md"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92]" />
            <input
              type="text"
              placeholder="Search by business name, email, phone, or application ID..."
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

          {/* Status Pills */}
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

        {error && (
          <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Application Cards / Queue List */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-28 bg-[#FEFEFE] rounded-2xl border border-[#D9E2EA]"
              />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="gm-panel p-12 rounded-3xl border border-[#D9E2EA] text-center space-y-2 bg-[#FEFEFE]">
            <Users className="w-10 h-10 text-[#6F8A92] mx-auto" />
            <h2 className="text-base font-bold text-[#173885]">
              No Vendor Applications Found
            </h2>
            <p className="text-xs text-[#606460]">
              No applications match your search query or filter selection.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => {
              const bName =
                app.business_details?.legalBusinessName ||
                app.business_details?.tradeName ||
                "Unnamed Vendor Depot";
              const location = `${app.business_address?.locality || "Pune"}, ${app.business_address?.city || "Maharashtra"}`;
              const contact =
                app.ownerDetails?.primaryContactName || "Authorized Contact";
              const email = app.ownerDetails?.email || "No email provided";
              const phone = app.ownerDetails?.mobileNumber || "No phone";

              return (
                <div
                  key={app.id}
                  className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-[#3C7DDA] transition shadow-2xs"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-sm text-[#173885]">
                        {bName}
                      </span>
                      {getStatusBadge(app.status)}
                      <span className="text-[10px] font-mono text-[#6F8A92] bg-[#F4F6FA] px-2 py-0.5 rounded-md">
                        ID: {app.id.slice(0, 8)}...
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#606460]">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-[#3C7DDA]" />
                        <span>{contact}</span>
                      </span>
                      <span>•</span>
                      <span>{email}</span>
                      <span>•</span>
                      <span className="font-mono font-bold text-[#173885]">
                        {phone}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#3C7DDA]" />
                        <span>{location}</span>
                      </span>
                    </div>

                    {app.reviewer_notes && (
                      <p className="text-[11px] text-[#A66A08] bg-[#FFF0D5] px-2.5 py-1 rounded-lg inline-block">
                        <strong>Review Note:</strong> {app.reviewer_notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                    <Link
                      to={`/admin/vendors/${app.id}`}
                      className="btn-gm-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#FEFEFE]" />
                      <span>Inspect Application</span>
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
