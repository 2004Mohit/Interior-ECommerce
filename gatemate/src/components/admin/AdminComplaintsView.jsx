import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  Search,
  Filter,
  RotateCcw,
  Building2,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
  ArrowRight,
  User,
  X,
} from "lucide-react";
import { adminSupportService } from "../../services/adminSupportService";
import { AdminPermissionGuard } from "./AdminPermissionGuard";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";
import { SeoHead } from "../common/SeoHead";

const STATUS_FILTERS = [
  { label: "All Tickets", value: "ALL" },
  { label: "Open", value: "OPEN" },
  { label: "Under Review", value: "UNDER_REVIEW" },
  { label: "Waiting Info", value: "WAITING_FOR_INFORMATION" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Escalated", value: "ESCALATED" },
  { label: "Rejected", value: "REJECTED" },
];

export const AdminComplaintsView = () => {
  const [complaints, setComplaints] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Investigation & Resolution Modal State
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [targetStatus, setTargetStatus] = useState("UNDER_REVIEW");
  const [internalNotes, setInternalNotes] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [escalatedTo, setEscalatedTo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminSupportService.getComplaints({
        status: statusFilter,
        search,
        limit: 100,
      });
      setComplaints(res.complaints);
      setTotalCount(res.totalCount);
    } catch (err) {
      setError(err.message || "Failed to load customer complaints.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadComplaints();
  };

  const handleProcessSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await adminSupportService.processComplaintUpdate({
        complaintId: activeComplaint.id,
        status: targetStatus,
        internalNotes,
        resolutionNotes,
        escalatedTo: targetStatus === "ESCALATED" ? escalatedTo : null,
      });

      setActionSuccess(
        `Complaint #${activeComplaint.id.slice(0, 8)} updated to ${targetStatus}.`,
      );
      setActiveComplaint(null);
      setInternalNotes("");
      setResolutionNotes("");
      setEscalatedTo("");
      loadComplaints();
    } catch (err) {
      setError(err.message || "Failed to update complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "RESOLVED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30">
            RESOLVED
          </span>
        );
      case "ESCALATED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FBE3DE] text-[#B43D20] border border-[#B43D20]/30 animate-pulse">
            ESCALATED
          </span>
        );
      case "WAITING_FOR_INFORMATION":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FFF0D5] text-[#A66A08] border border-[#A66A08]/30">
            WAITING FOR INFO
          </span>
        );
      case "UNDER_REVIEW":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#E4EEF3] text-[#3C7DDA] border border-[#3C7DDA]/30">
            UNDER REVIEW
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#F4F6FA] text-[#606460]">
            REJECTED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FFF0D5] text-[#A66A08]">
            OPEN
          </span>
        );
    }
  };

  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.MANAGE_COMPLAINTS}>
      <div className="space-y-6 pb-20 font-sans">
        <SeoHead
          title="Customer Complaints & Disputes Desk | GateMate Admin"
          description="Investigate contractor complaints, link disputed vendor orders, add internal operational notes, and manage escalations."
          canonicalUrl="/admin/complaints"
          noIndex={true}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
          <div>
            <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Dispute Resolution & Inquiries
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
              Customer Complaints & Disputes Desk
            </h1>
            <p className="text-xs text-[#606460]">
              Investigate site delivery issues, damage reports, invoice
              disputes, and coordinate vendor accountability.
            </p>
          </div>

          <button
            onClick={loadComplaints}
            disabled={loading}
            className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RotateCcw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span>Refresh Tickets</span>
          </button>
        </div>

        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

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
              placeholder="Search subject, description, or Order ID..."
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

        {/* Complaints List */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-28 bg-[#FEFEFE] rounded-2xl border border-[#D9E2EA]"
              />
            ))}
          </div>
        ) : complaints.length === 0 ? (
          <div className="gm-panel p-12 rounded-3xl border border-[#D9E2EA] text-center space-y-2 bg-[#FEFEFE]">
            <MessageSquare className="w-10 h-10 text-[#6F8A92] mx-auto" />
            <h2 className="text-base font-bold text-[#173885]">
              No Support Complaints Found
            </h2>
            <p className="text-xs text-[#606460]">
              All contractor support tickets have been investigated.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {complaints.map((c) => (
              <div
                key={c.id}
                className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-3 shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9E2EA] pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-[#173885]">
                      {c.subject}
                    </span>
                    <span className="badge-gm-info px-2 py-0.5 rounded-md text-[10px] font-bold">
                      {c.category}
                    </span>
                    {getStatusBadge(c.status)}
                    <span className="text-[10px] font-mono text-[#6F8A92]">
                      Filed: {new Date(c.created_at).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveComplaint(c);
                      setTargetStatus(c.status);
                      setInternalNotes(c.internal_notes || "");
                      setResolutionNotes(c.resolution_notes || "");
                      setEscalatedTo(c.escalated_to || "");
                    }}
                    className="btn-gm-primary px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 shadow-xs self-start sm:self-auto"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-[#FEFEFE]" />
                    <span>Investigate Ticket</span>
                  </button>
                </div>

                <p className="text-xs text-[#282926] bg-[#F4F6FA] p-3 rounded-xl border border-[#D9E2EA]">
                  {c.description}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#606460]">
                  {c.order_id && (
                    <Link
                      to={`/admin/orders/${c.order_id}`}
                      className="text-[#3C7DDA] font-bold hover:underline"
                    >
                      Linked Order #{c.order_id}
                    </Link>
                  )}
                  {c.vendor && (
                    <span>
                      Depot:{" "}
                      <strong className="text-[#282926]">
                        {c.vendor.business_name}
                      </strong>
                    </span>
                  )}
                  <Link
                    to={`/admin/customers/${c.user_id}`}
                    className="text-[#3C7DDA] hover:underline"
                  >
                    View Customer Profile
                  </Link>
                </div>

                {c.internal_notes && (
                  <div className="p-2.5 rounded-xl bg-[#FFF0D5]/50 border border-[#A66A08]/20 text-xs text-[#A66A08]">
                    <strong>Internal Investigation Note:</strong>{" "}
                    {c.internal_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Investigation & Action Modal */}
        {activeComplaint && (
          <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-lg p-6 sm:p-8 rounded-3xl relative shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-[#D9E2EA] pb-3">
                <div>
                  <h3 className="text-lg font-black text-[#173885]">
                    Investigate Complaint
                  </h3>
                  <span className="text-xs text-[#606460]">
                    {activeComplaint.subject}
                  </span>
                </div>
                <button
                  onClick={() => setActiveComplaint(null)}
                  className="text-[#606460] hover:text-[#282926]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleProcessSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Target Ticket Status *
                  </label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="w-full gm-input px-3 py-2 rounded-xl text-xs font-bold"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="UNDER_REVIEW">
                      UNDER_REVIEW (Active Investigation)
                    </option>
                    <option value="WAITING_FOR_INFORMATION">
                      WAITING_FOR_INFORMATION (Request Contractor Input)
                    </option>
                    <option value="RESOLVED">RESOLVED (Issue Closed)</option>
                    <option value="ESCALATED">
                      ESCALATED (Operations Leadership)
                    </option>
                    <option value="REJECTED">
                      REJECTED (Invalid / False Claim)
                    </option>
                  </select>
                </div>

                {targetStatus === "ESCALATED" && (
                  <div>
                    <label className="text-xs font-bold text-[#282926] block mb-1">
                      Escalate To (Team / Officer) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pune Logistics Head, Quality Control Team"
                      value={escalatedTo}
                      onChange={(e) => setEscalatedTo(e.target.value)}
                      className="w-full gm-input px-3 py-2 rounded-xl text-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Internal Investigation Notes (Private Admin Notes)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter notes visible only to platform admins..."
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    className="w-full gm-input p-3 rounded-xl text-xs"
                  />
                </div>

                {["RESOLVED", "REJECTED", "WAITING_FOR_INFORMATION"].includes(
                  targetStatus,
                ) && (
                  <div>
                    <label className="text-xs font-bold text-[#282926] block mb-1">
                      Customer Resolution Message (Dispatched to Contractor) *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Explain resolution findings or what extra information is required..."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      className="w-full gm-input p-3 rounded-xl text-xs"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveComplaint(null)}
                    disabled={submitting}
                    className="btn-gm-secondary px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-gm-primary px-5 py-2 rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
                  >
                    <span>
                      {submitting ? "Updating..." : "Save Investigation"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminPermissionGuard>
  );
};
