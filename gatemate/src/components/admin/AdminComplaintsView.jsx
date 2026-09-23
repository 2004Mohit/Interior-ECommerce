import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  FileText,
  Loader2,
  MessageSquare,
  Phone,
  Search,
  ShieldAlert,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

import adminSupportService from "../../services/adminSupportService";
import AdminPermissionGuard from "../../components/admin/AdminPermissionGuard";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Complaints" },
  { value: "OPEN", label: "Open" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "WAITING_FOR_INFORMATION", label: "Waiting for Information" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "ESCALATED", label: "Escalated" },
  { value: "REJECTED", label: "Rejected" },
];

const CATEGORY_OPTIONS = [
  { value: "ALL", label: "All Categories" },
  { value: "DELIVERY_DELAY", label: "Delivery Delay" },
  { value: "DAMAGED_MATERIAL", label: "Damaged Material" },
  { value: "WRONG_ITEM", label: "Wrong Item" },
  { value: "QUALITY_DISPUTE", label: "Quality Dispute" },
  { value: "BILLING", label: "Billing" },
  { value: "OTHER", label: "Other" },
];

const STATUS_CONFIG = {
  OPEN: {
    label: "Open",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    icon: AlertCircle,
  },
  UNDER_REVIEW: {
    label: "Under Review",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock3,
  },
  WAITING_FOR_INFORMATION: {
    label: "Waiting for Information",
    className: "bg-purple-50 text-purple-700 border-purple-200",
    icon: MessageSquare,
  },
  RESOLVED: {
    label: "Resolved",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  ESCALATED: {
    label: "Escalated",
    className: "bg-orange-50 text-orange-700 border-orange-200",
    icon: ShieldAlert,
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: XCircle,
  },
};

const CATEGORY_LABELS = {
  DELIVERY_DELAY: "Delivery Delay",
  DAMAGED_MATERIAL: "Damaged Material",
  WRONG_ITEM: "Wrong Item",
  QUALITY_DISPUTE: "Quality Dispute",
  BILLING: "Billing",
  OTHER: "Other",
};

const ESCALATION_OPTIONS = [
  { value: "", label: "Select escalation destination" },
  { value: "OPERATIONS", label: "Operations" },
  { value: "VENDOR_MANAGEMENT", label: "Vendor Management" },
  { value: "FINANCE", label: "Finance" },
  { value: "CUSTOMER_SUPPORT", label: "Customer Support" },
  { value: "ADMIN", label: "Admin" },
];

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatCategory(value) {
  return CATEGORY_LABELS[value] || value || "—";
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || {
    label: status || "Unknown",
    className: "bg-slate-50 text-slate-700 border-slate-200",
    icon: AlertCircle,
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
      <Icon size={13} />
      {config.label}
    </span>
  );
}

function EmptyState({ search, status, category }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <FileText className="text-slate-500" size={22} />
      </div>

      <h3 className="text-base font-semibold text-slate-900">
        No complaints found
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        {search || status !== "ALL" || category !== "ALL"
          ? "Try changing the search text or filters."
          : "There are currently no customer complaints to review."}
      </p>
    </div>
  );
}

function getCustomerPhone(complaint) {
  return (
    complaint?.customer_phone ||
    complaint?.phone ||
    complaint?.customer?.phone ||
    null
  );
}

function ComplaintCard({ complaint, onProcess, processingId }) {
  const isProcessing = processingId === complaint.id;
  const isClosed =
    complaint.status === "RESOLVED" || complaint.status === "REJECTED";

  const customerPhone = getCustomerPhone(complaint);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={complaint.status} />

              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                {formatCategory(complaint.category)}
              </span>
            </div>

            <h3 className="mt-3 text-base font-semibold text-slate-900">
              {complaint.subject || "Untitled Complaint"}
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Complaint ID: {complaint.id}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {complaint.order_id && (
              <Link
                to={`/admin/orders/${complaint.order_id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                View Order
                <ExternalLink size={13} />
              </Link>
            )}

            {!isClosed && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => onProcess(complaint)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isProcessing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <MessageSquare size={14} />
                )}
                Process
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-3">
        <div className="border-b border-slate-100 px-5 py-4 lg:border-b-0 lg:border-r">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Customer
          </p>

          <div className="mt-2 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
              <UserRound size={17} className="text-slate-500" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">
                {complaint.customer_name || complaint.user_name || "Customer"}
              </p>

              {customerPhone ? (
                <a
                  href={`tel:${customerPhone}`}
                  className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  <Phone size={13} />
                  {customerPhone}
                </a>
              ) : (
                <p className="mt-1 text-xs text-red-500">
                  Contact number not available
                </p>
              )}

              {complaint.customer_id && (
                <Link
                  to={`/admin/customers/${complaint.customer_id}`}
                  className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                >
                  View Customer
                  <ExternalLink size={11} />
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="border-b border-slate-100 px-5 py-4 lg:border-b-0 lg:border-r">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Vendor / Product
          </p>

          <div className="mt-2">
            <p className="text-sm font-medium text-slate-900">
              {complaint.vendor_name || "Vendor not available"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {complaint.product_name || "Product not specified"}
            </p>
          </div>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Submitted
          </p>

          <p className="mt-2 text-sm font-medium text-slate-900">
            {formatDate(complaint.created_at)}
          </p>

          {complaint.updated_at &&
            complaint.updated_at !== complaint.created_at && (
              <p className="mt-1 text-xs text-slate-500">
                Updated {formatDate(complaint.updated_at)}
              </p>
            )}
        </div>
      </div>

      <div className="border-t border-slate-100 px-5 py-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Customer Description
        </p>

        <div className="mt-2 rounded-xl bg-slate-50 p-4">
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {complaint.description || "No description provided."}
          </p>
        </div>
      </div>

      {(complaint.internal_notes || complaint.escalated_to) && (
        <div className="border-t border-slate-100 px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Administrative Information
          </p>

          <div className="mt-3 space-y-3">
            {complaint.escalated_to && (
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Escalated To
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {complaint.escalated_to}
                </p>
              </div>
            )}

            {complaint.internal_notes && (
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Internal Notes
                </p>

                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                  {complaint.internal_notes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {isClosed && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            {complaint.status === "RESOLVED" ? (
              <>
                <CheckCircle2 size={14} className="text-emerald-600" />
                Complaint resolved. No further processing is required.
              </>
            ) : (
              <>
                <XCircle size={14} className="text-red-600" />
                Complaint rejected. No further processing is required.
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProcessComplaintModal({ complaint, onClose, onSubmit, submitting }) {
  const [status, setStatus] = useState(complaint?.status || "UNDER_REVIEW");

  const [escalatedTo, setEscalatedTo] = useState(complaint?.escalated_to || "");

  const [internalNotes, setInternalNotes] = useState(
    complaint?.internal_notes || "",
  );

  const [error, setError] = useState("");

  useEffect(() => {
    if (!complaint) return;

    setStatus(complaint.status || "UNDER_REVIEW");
    setEscalatedTo(complaint.escalated_to || "");
    setInternalNotes(complaint.internal_notes || "");
    setError("");
  }, [complaint]);

  const requiresEscalation = status === "ESCALATED";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const cleanInternalNotes = internalNotes.trim();
    const cleanEscalatedTo = escalatedTo.trim();

    if (!status) {
      setError("Please select a status.");
      return;
    }

    if (requiresEscalation && !cleanEscalatedTo) {
      setError("Please select an escalation destination.");
      return;
    }

    try {
      await onSubmit({
        status,
        escalatedTo: cleanEscalatedTo || null,
        internalNotes: cleanInternalNotes || null,
      });
    } catch (err) {
      setError(err?.message || "Failed to process complaint.");
    }
  };

  if (!complaint) return null;

  const customerPhone = getCustomerPhone(complaint);

  const customerName =
    complaint?.customer_name ||
    complaint?.user_name ||
    complaint?.customer?.full_name ||
    "Customer";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                <MessageSquare size={18} className="text-slate-700" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Process Complaint
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  {complaint.customer_name || complaint.user_name || "Customer"}
                </p>

                <p className="mt-0.5 text-xs text-slate-400">
                  Complaint ID: {complaint.id}
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm font-medium text-slate-800">
              {complaint.subject || "Untitled Complaint"}
            </p>

            {customerPhone && (
              <a
                href={`tel:${customerPhone}`}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                <Phone size={14} />
                Call Customer: {customerPhone}
              </a>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </div>

        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Customer
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {customerName}
              </p>

              {complaint.customer_id && (
                <Link
                  to={`/admin/customers/${complaint.customer_id}`}
                  className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                >
                  View Customer
                  <ExternalLink size={11} />
                </Link>
              )}
            </div>

            <div className="shrink-0">
              {customerPhone ? (
                <a
                  href={`tel:${customerPhone}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <Phone size={15} />
                  {customerPhone}
                </a>
              ) : (
                <span className="text-xs font-medium text-red-600">
                  Contact number not available
                </span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-6">
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />

              <p className="text-sm leading-5 text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Customer Complaint
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-900">
                {complaint.subject || "Untitled Complaint"}
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {complaint.description || "No description provided."}
              </p>
            </div>

            <div>
              <label
                htmlFor="complaint-status"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Complaint Status
              </label>

              <div className="relative">
                <select
                  id="complaint-status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  disabled={submitting}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
                >
                  {STATUS_OPTIONS.filter(
                    (option) => option.value !== "ALL",
                  ).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={17}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            {requiresEscalation && (
              <div>
                <label
                  htmlFor="escalated-to"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Escalate To
                </label>

                <div className="relative">
                  <select
                    id="escalated-to"
                    value={escalatedTo}
                    onChange={(event) => setEscalatedTo(event.target.value)}
                    disabled={submitting}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
                  >
                    {ESCALATION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={17}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="internal-notes"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Internal Notes
              </label>

              <textarea
                id="internal-notes"
                value={internalNotes}
                onChange={(event) => setInternalNotes(event.target.value)}
                disabled={submitting}
                rows={5}
                placeholder="Record what happened during the call, investigation details, vendor response, action taken, or any other information useful to administrators..."
                className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
              />

              <p className="mt-1.5 text-xs text-slate-500">
                Internal Notes are visible only to authorized administrators and
                support staff.
              </p>
            </div>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}

              {submitting ? "Saving..." : "Save Complaint Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminComplaintsViewContent() {
  const [complaints, setComplaints] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [category, setCategory] = useState("ALL");

  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const [processingId, setProcessingId] = useState(null);

  const loadComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await adminSupportService.getComplaints({
        search: search.trim(),
        status,
        category,
      });

      /*
       * adminSupportService.getComplaints()
       * returns:
       *
       * {
       *   complaints: [],
       *   totalCount: number
       * }
       */
      const complaintRows = Array.isArray(result?.complaints)
        ? result.complaints
        : [];

      setComplaints(complaintRows);
      setTotalCount(Number(result?.totalCount || 0));
    } catch (err) {
      console.error("Failed to load complaints:", err);

      setError(err?.message || "Failed to load complaints.");

      setComplaints([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [search, status, category]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadComplaints();
    }, 250);

    return () => clearTimeout(timeout);
  }, [loadComplaints]);

  const counts = useMemo(() => {
    return complaints.reduce(
      (result, complaint) => {
        const currentStatus = complaint.status;

        if (currentStatus === "OPEN") {
          result.open += 1;
        }

        if (currentStatus === "UNDER_REVIEW") {
          result.underReview += 1;
        }

        if (currentStatus === "WAITING_FOR_INFORMATION") {
          result.waiting += 1;
        }

        if (currentStatus === "ESCALATED") {
          result.escalated += 1;
        }

        if (currentStatus === "RESOLVED") {
          result.resolved += 1;
        }

        return result;
      },
      {
        open: 0,
        underReview: 0,
        waiting: 0,
        escalated: 0,
        resolved: 0,
      },
    );
  }, [complaints]);

  const handleProcess = (complaint) => {
    if (complaint.status === "RESOLVED" || complaint.status === "REJECTED") {
      return;
    }

    setSelectedComplaint(complaint);
  };

  const handleSubmitProcess = async (payload) => {
    if (!selectedComplaint) return;

    try {
      setProcessingId(selectedComplaint.id);

      /*
       * IMPORTANT:
       * adminSupportService.processComplaintUpdate()
       * expects ONE object argument.
       */
      await adminSupportService.processComplaintUpdate({
        complaintId: selectedComplaint.id,
        status: payload.status,
        internalNotes: payload.internalNotes,
        vendorId: selectedComplaint.vendor_id || null,
        productId: selectedComplaint.product_id || null,
        orderId: selectedComplaint.order_id || null,
        escalatedTo: payload.escalatedTo,
      });

      setSelectedComplaint(null);

      await loadComplaints();
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Customer Complaints
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Review customer complaints, contact customers, investigate
                issues, and update complaint status.
              </p>
            </div>

            <button
              type="button"
              onClick={loadComplaints}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 lg:self-auto"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Refresh
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Open</p>

            <p className="mt-1 text-xl font-semibold text-blue-700">
              {counts.open}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Under Review</p>

            <p className="mt-1 text-xl font-semibold text-amber-700">
              {counts.underReview}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Waiting</p>

            <p className="mt-1 text-xl font-semibold text-purple-700">
              {counts.waiting}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Escalated</p>

            <p className="mt-1 text-xl font-semibold text-orange-700">
              {counts.escalated}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Resolved</p>

            <p className="mt-1 text-xl font-semibold text-emerald-700">
              {counts.resolved}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search complaint, customer, order, vendor or product..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            <div className="relative">
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            <div className="relative">
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <AlertCircle size={19} className="mt-0.5 shrink-0 text-red-600" />

            <div>
              <p className="text-sm font-medium text-red-800">
                Unable to load complaints
              </p>

              <p className="mt-1 text-sm text-red-700">{error}</p>

              <button
                type="button"
                onClick={loadComplaints}
                className="mt-3 text-sm font-medium text-red-800 underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
            <Loader2
              size={28}
              className="mx-auto animate-spin text-slate-400"
            />

            <p className="mt-3 text-sm text-slate-500">Loading complaints...</p>
          </div>
        ) : complaints.length === 0 ? (
          <EmptyState search={search} status={status} category={category} />
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <ComplaintCard
                key={complaint.id}
                complaint={complaint}
                onProcess={handleProcess}
                processingId={processingId}
              />
            ))}
          </div>
        )}

        {!loading && totalCount > 0 && (
          <div className="mt-4 text-center text-xs text-slate-500">
            Showing {complaints.length} of {totalCount} complaints
          </div>
        )}
      </div>

      {selectedComplaint && (
        <ProcessComplaintModal
          complaint={selectedComplaint}
          onClose={() => {
            if (!processingId) {
              setSelectedComplaint(null);
            }
          }}
          onSubmit={handleSubmitProcess}
          submitting={processingId === selectedComplaint.id}
        />
      )}
    </div>
  );
}

export function AdminComplaintsView() {
  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.MANAGE_COMPLAINTS}>
      <AdminComplaintsViewContent />
    </AdminPermissionGuard>
  );
}

export default AdminComplaintsView;
