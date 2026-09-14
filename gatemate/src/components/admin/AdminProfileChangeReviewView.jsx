import React, { useState, useEffect } from "react";
import {
  FileText,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Building2,
  ArrowRight,
  AlertCircle,
  Clock,
  X,
  Search,
  Filter,
  ExternalLink,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { adminProfileChangeService } from "../../services/adminProfileChangeService";
import { AdminPermissionGuard } from "./AdminPermissionGuard";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";
import { SeoHead } from "../common/SeoHead";

const STATUS_FILTERS = [
  { label: "All Requests", value: "ALL" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Under Review", value: "UNDER_REVIEW" },
  { label: "Changes Requested", value: "CHANGES_REQUESTED" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

export const AdminProfileChangeReviewView = () => {
  const [requests, setRequests] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("SUBMITTED");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [docUrls, setDocUrls] = useState({});

  // Decision Modal State
  const [activeModalReq, setActiveModalReq] = useState(null);
  const [decisionType, setDecisionType] = useState("APPROVED"); // 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED'
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminProfileChangeService.getChangeRequests({
        status: statusFilter,
        search,
        limit: 50,
      });
      setRequests(res.requests);
      setTotalCount(res.totalCount);

      // Hydrate signed URLs for supporting docs
      const urls = {};
      for (const req of res.requests) {
        if (req.supporting_document) {
          urls[req.id] = await adminProfileChangeService.getSignedDocumentUrl(
            req.supporting_document,
          );
        }
      }
      setDocUrls(urls);
    } catch (err) {
      setError(err.message || "Failed to load change requests queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadRequests();
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (decisionType === "REJECTED" && !rejectionReason.trim()) {
      setError("A rejection reason is strictly required.");
      return;
    }
    if (decisionType === "CHANGES_REQUESTED" && !reviewerNotes.trim()) {
      setError("Admin notes are required when requesting changes.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await adminProfileChangeService.processDecision({
        requestId: activeModalReq.id,
        decision: decisionType,
        reviewerNotes,
        rejectionReason,
      });

      setActionSuccess(`Request successfully marked as ${decisionType}.`);
      setActiveModalReq(null);
      setReviewerNotes("");
      setRejectionReason("");
      loadRequests();
    } catch (err) {
      setError(err.message || "Failed to record review decision.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatValueDisplay = (val) => {
    if (val === null || val === undefined) return "N/A";
    if (typeof val === "object") {
      return val.value || JSON.stringify(val, null, 2);
    }
    return String(val);
  };

  return (
    <AdminPermissionGuard
      permission={ADMIN_PERMISSIONS.REVIEW_VENDOR_PROFILE_CHANGES}
    >
      <div className="space-y-6 pb-20 font-sans">
        <SeoHead
          title="Vendor Profile Change Moderation | GateMate Admin"
          description="Review, verify, approve, or reject vendor legal profile change requests across Pune & PCMC."
          canonicalUrl="/admin/vendor-profile-changes"
          noIndex={true}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
          <div>
            <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Identity & Trust Verification
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
              Vendor Profile Change Requests
            </h1>
            <p className="text-xs text-[#606460]">
              Inspect proposed modifications to verified business credentials,
              physical addresses, and bank accounts.
            </p>
          </div>

          <button
            onClick={loadRequests}
            disabled={loading}
            className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RotateCcw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span>Refresh Queue</span>
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

        {/* Search & Filter Toolbar */}
        <div className="gm-panel p-4 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1 max-w-md"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92]" />
            <input
              type="text"
              placeholder="Search by vendor name, email, field, or request ID..."
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

        {/* Queue Items */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-36 bg-[#FEFEFE] rounded-2xl border border-[#D9E2EA]"
              />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="gm-panel p-12 rounded-3xl border border-[#D9E2EA] text-center space-y-2 bg-[#FEFEFE]">
            <CheckCircle2 className="w-10 h-10 text-[#3F7D20] mx-auto" />
            <h2 className="text-base font-bold text-[#173885]">
              No Change Requests Found
            </h2>
            <p className="text-xs text-[#606460]">
              There are no vendor change requests matching the selected filter
              criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const vendor = req.vendor_profiles;
              const hasDoc = Boolean(docUrls[req.id]);

              return (
                <div
                  key={req.id}
                  className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-3.5 shadow-2xs transition"
                >
                  {/* Item Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9E2EA] pb-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-sm text-[#173885]">
                        {vendor?.business_name || "Vendor Partner"}
                      </span>
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#E4EEF3] text-[#3C7DDA] border border-[#3C7DDA]/30">
                        {req.requested_field}
                      </span>
                      <span className="text-[10px] font-mono text-[#6F8A92]">
                        Submitted:{" "}
                        {new Date(req.created_at).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full self-start sm:self-auto ${
                        req.status === "APPROVED"
                          ? "bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30"
                          : req.status === "REJECTED"
                            ? "bg-[#FBE3DE] text-[#B43D20] border border-[#B43D20]/30"
                            : "bg-[#FFF0D5] text-[#A66A08] border border-[#A66A08]/30"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  {/* Diff Comparison Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-3.5 rounded-xl bg-[#FBE3DE]/30 border border-[#B43D20]/20 space-y-1">
                      <span className="text-[10px] font-bold text-[#B43D20] uppercase block">
                        Current Verified Value (Before)
                      </span>
                      <pre className="text-[#282926] text-[11px] whitespace-pre-wrap font-sans">
                        {formatValueDisplay(req.current_value)}
                      </pre>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#E1F2D9]/30 border border-[#3F7D20]/20 space-y-1">
                      <span className="text-[10px] font-bold text-[#3F7D20] uppercase block">
                        Proposed New Value (After)
                      </span>
                      <pre className="text-[#282926] text-[11px] whitespace-pre-wrap font-bold font-sans">
                        {formatValueDisplay(req.requested_value)}
                      </pre>
                    </div>
                  </div>

                  {/* Reason & Supporting Doc */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-[#F4F6FA] p-3 rounded-xl">
                    <div className="space-y-0.5 flex-1">
                      <span className="font-bold text-[#282926] block">
                        Vendor Justification:
                      </span>
                      <p className="text-[#606460]">{req.reason}</p>
                    </div>

                    {hasDoc && (
                      <a
                        href={docUrls[req.id]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-gm-secondary px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#3C7DDA]" />
                        <span>View Supporting Doc</span>
                        <ExternalLink className="w-3 h-3 text-[#6F8A92]" />
                      </a>
                    )}
                  </div>

                  {/* Actions Bar */}
                  {req.status === "SUBMITTED" && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D9E2EA]">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModalReq(req);
                          setDecisionType("CHANGES_REQUESTED");
                        }}
                        className="btn-gm-secondary px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#A66A08]"
                      >
                        Request Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModalReq(req);
                          setDecisionType("REJECTED");
                        }}
                        className="btn-gm-secondary px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#B43D20] hover:bg-[#FBE3DE]"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModalReq(req);
                          setDecisionType("APPROVED");
                        }}
                        className="btn-gm-primary px-4 py-1.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#FEFEFE]" />
                        <span>Approve & Apply</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Action Decision Modal */}
        {activeModalReq && (
          <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-md p-6 rounded-3xl relative shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-[#D9E2EA] pb-3">
                <h3 className="text-base font-black text-[#173885]">
                  Confirm Decision: {decisionType}
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveModalReq(null)}
                  className="text-[#606460] hover:text-[#282926]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleDecisionSubmit} className="space-y-4">
                {decisionType === "REJECTED" && (
                  <div>
                    <label className="text-xs font-bold text-[#282926] block mb-1">
                      Specific Rejection Reason *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why this profile change cannot be approved..."
                      className="w-full gm-input p-3 rounded-xl text-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Reviewer Remarks / Audit Notes{" "}
                    {decisionType === "CHANGES_REQUESTED" && "*"}
                  </label>
                  <textarea
                    required={decisionType === "CHANGES_REQUESTED"}
                    rows={3}
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    placeholder="Enter official remarks recorded in audit logs and sent to the vendor..."
                    className="w-full gm-input p-3 rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveModalReq(null)}
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
                      {submitting ? "Submitting..." : `Confirm ${decisionType}`}
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
