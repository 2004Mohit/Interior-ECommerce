import React, { useCallback, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  MessageSquare,
  PlusCircle,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  Package,
  FileText,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { AccountNav } from "./AccountNav";
import { SeoHead } from "../common/SeoHead";

const COMPLAINT_CATEGORIES = [
  {
    value: "DELIVERY_DELAY",
    label: "Delivery Delay / SLA Issue",
  },
  {
    value: "DAMAGED_MATERIAL",
    label: "Damaged Material",
  },
  {
    value: "WRONG_ITEM",
    label: "Wrong Item / Quantity",
  },
  {
    value: "QUALITY_DISPUTE",
    label: "Quality Dispute",
  },
  {
    value: "BILLING",
    label: "Billing / Invoice Issue",
  },
  {
    value: "OTHER",
    label: "Other Inquiry",
  },
];

const STATUS_CONFIG = {
  OPEN: {
    label: "Open",
    className: "bg-[#FFF0D5] text-[#A66A08] border-[#A66A08]/20",
    icon: Clock,
  },
  UNDER_REVIEW: {
    label: "Under Review",
    className: "bg-[#E4EEF3] text-[#3C7DDA] border-[#3C7DDA]/20",
    icon: Search,
  },
  WAITING_FOR_INFORMATION: {
    label: "Waiting for Information",
    className: "bg-[#FFF0D5] text-[#A66A08] border-[#A66A08]/20",
    icon: AlertCircle,
  },
  RESOLVED: {
    label: "Resolved",
    className: "bg-[#E1F2D9] text-[#3F7D20] border-[#3F7D20]/20",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-[#F4F6FA] text-[#606460] border-[#D9E2EA]",
    icon: AlertCircle,
  },
  ESCALATED: {
    label: "Escalated",
    className: "bg-[#FBE3DE] text-[#B43D20] border-[#B43D20]/20",
    icon: ShieldCheck,
  },
};

const getCategoryLabel = (category) => {
  return (
    COMPLAINT_CATEGORIES.find((item) => item.value === category)?.label ||
    category ||
    "Other Inquiry"
  );
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusConfig = (status) => {
  return (
    STATUS_CONFIG[status] || {
      label: status || "Unknown",
      className: "bg-[#F4F6FA] text-[#606460] border-[#D9E2EA]",
      icon: Clock,
    }
  );
};

const StatusBadge = ({ status }) => {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wide ${config.className}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

const EmptyState = ({ onCreate }) => {
  return (
    <div className="bg-[#FEFEFE] border border-[#D9E2EA] rounded-3xl p-10 sm:p-14 text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E4EEF3] border border-[#9AAED4]/30 flex items-center justify-center">
        <MessageSquare className="w-7 h-7 text-[#173885]" />
      </div>

      <h2 className="mt-5 text-lg font-black text-[#173885]">
        No Help & Inquiries Yet
      </h2>

      <p className="mt-2 max-w-md mx-auto text-xs leading-5 text-[#606460]">
        If you have a delivery, product, quality, billing, or order-related
        issue, you can register an inquiry and track its progress here.
      </p>

      <button
        type="button"
        onClick={onCreate}
        className="mt-6 btn-gm-primary px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2"
      >
        <PlusCircle className="w-4 h-4" />
        Register New Inquiry
      </button>
    </div>
  );
};

const ComplaintCard = ({ complaint }) => {
  const resolutionNotes = complaint.admin_resolution_notes;

  return (
    <article className="bg-[#FEFEFE] border border-[#D9E2EA] rounded-2xl overflow-hidden shadow-2xs">
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-[#6F8A92]">
                #
                {String(complaint.id || "")
                  .slice(0, 8)
                  .toUpperCase()}
              </span>

              <StatusBadge status={complaint.status} />
            </div>

            <h3 className="mt-2 text-sm sm:text-base font-black text-[#173885] break-words">
              {complaint.subject || "Support Inquiry"}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#6F8A92]">
              <span>{getCategoryLabel(complaint.category)}</span>

              <span className="hidden sm:inline">•</span>

              <span>Submitted {formatDate(complaint.created_at)}</span>
            </div>
          </div>

          <div className="shrink-0">
            {complaint.updated_at &&
              complaint.updated_at !== complaint.created_at && (
                <span className="text-[10px] text-[#6F8A92]">
                  Updated {formatDate(complaint.updated_at)}
                </span>
              )}
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-[#D9E2EA] bg-[#F4F6FA] p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-3.5 h-3.5 text-[#173885]" />

            <span className="text-[10px] font-black uppercase tracking-wide text-[#606460]">
              Your Inquiry
            </span>
          </div>

          <p className="text-xs leading-5 text-[#282926] whitespace-pre-wrap break-words">
            {complaint.description || "No description provided."}
          </p>
        </div>

        {complaint.order_id && (
          <div className="mt-3 flex items-center gap-2 text-xs text-[#606460]">
            <Package className="w-3.5 h-3.5 text-[#173885]" />

            <span>
              Order:
              <span className="ml-1 font-mono font-bold text-[#173885]">
                {complaint.order_id}
              </span>
            </span>
          </div>
        )}

        {complaint.admin_resolution_notes && (
          <div className="mt-4 rounded-xl border border-[#3F7D20]/20 bg-[#E1F2D9]/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3F7D20]" />

              <span className="text-[10px] font-black uppercase tracking-wide text-[#3F7D20]">
                Support Resolution
              </span>
            </div>

            <p className="text-xs leading-5 text-[#3F7D20] whitespace-pre-wrap break-words">
              {resolutionNotes}
            </p>
          </div>
        )}

        {complaint.status === "WAITING_FOR_INFORMATION" && (
          <div className="mt-4 rounded-xl border border-[#A66A08]/20 bg-[#FFF0D5]/60 p-3">
            <p className="text-[11px] leading-5 text-[#7A5508]">
              Our support team needs additional information before the inquiry
              can be completed. Please check for any further instructions from
              the support team.
            </p>
          </div>
        )}

        {complaint.status === "ESCALATED" && (
          <div className="mt-4 rounded-xl border border-[#B43D20]/20 bg-[#FBE3DE]/60 p-3">
            <p className="text-[11px] leading-5 text-[#8D301A]">
              This inquiry has been escalated for further investigation.
            </p>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-[#D9E2EA] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-[10px] text-[#6F8A92]">
            Last updated: {formatDateTime(complaint.updated_at)}
          </span>

          {complaint.resolved_at && (
            <span className="text-[10px] font-semibold text-[#3F7D20]">
              Resolved: {formatDateTime(complaint.resolved_at)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

export const Complaints = () => {
  const { user } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("DELIVERY_DELAY");
  const [orderId, setOrderId] = useState("");
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const loadComplaints = useCallback(
    async ({ silent = false } = {}) => {
      if (!user?.id) {
        setComplaints([]);
        setLoading(false);
        return;
      }

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from("customer_complaints")
          .select(
            `
              id,
              customer_id,
              order_id,
              vendor_id,
              product_id,
              subject,
              description,
              category,
              status,
              admin_resolution_notes,
              resolved_by,
              resolved_at,
              created_at,
              updated_at
            `,
          )
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false });

        if (queryError) {
          throw queryError;
        }

        setComplaints(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load customer inquiries:", err);

        setError(
          err?.message ||
            "Unable to load your support inquiries. Please try again.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id],
  );

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const filteredComplaints = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return complaints;
    }

    return complaints.filter((complaint) => {
      const subjectValue = String(complaint.subject || "").toLowerCase();
      const descriptionValue = String(
        complaint.description || "",
      ).toLowerCase();
      const orderValue = String(complaint.order_id || "").toLowerCase();
      const categoryValue = getCategoryLabel(complaint.category).toLowerCase();
      const statusValue = String(complaint.status || "").toLowerCase();

      return (
        subjectValue.includes(query) ||
        descriptionValue.includes(query) ||
        orderValue.includes(query) ||
        categoryValue.includes(query) ||
        statusValue.includes(query)
      );
    });
  }, [complaints, searchTerm]);

  const resetForm = () => {
    setSubject("");
    setCategory("DELIVERY_DELAY");
    setOrderId("");
    setDescription("");
  };

  const closeModal = () => {
    if (submitting) {
      return;
    }

    setIsModalOpen(false);
    resetForm();
  };

  const openModal = () => {
    setError(null);
    setActionSuccess(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!user?.id) {
      setError("Please sign in before registering a support inquiry.");
      return;
    }

    const cleanSubject = subject.trim();
    const cleanDescription = description.trim();
    const cleanOrderId = orderId.trim();

    if (!cleanSubject) {
      setError("Subject is required.");
      return;
    }

    if (cleanSubject.length < 5) {
      setError("Please provide a more descriptive subject.");
      return;
    }

    if (!cleanDescription) {
      setError("Please describe the issue or inquiry.");
      return;
    }

    if (cleanDescription.length < 10) {
      setError("Please provide a little more detail about the issue.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setActionSuccess(null);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "customer_submit_complaint",
        {
          p_subject: cleanSubject,
          p_description: cleanDescription,
          p_category: category,
          p_order_id: cleanOrderId || null,
        },
      );

      if (rpcError) {
        throw rpcError;
      }

      if (data?.success === false) {
        throw new Error(
          data?.message || "The support inquiry could not be registered.",
        );
      }

      setActionSuccess(
        "Your support inquiry has been registered successfully.",
      );

      setIsModalOpen(false);
      resetForm();

      await loadComplaints({ silent: true });
    } catch (err) {
      console.error("Failed to submit support inquiry:", err);

      setError(
        err?.message ||
          "Unable to register your support inquiry. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24 font-sans">
      <SeoHead
        title="Help & Inquiries | Ferrado Customer Support"
        description="Register and track construction order inquiries, delivery issues, product disputes, and billing inquiries."
        canonicalUrl="/account/complaints"
        noIndex={true}
      />

      <div className="border-b border-[#D9E2EA] pb-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-[#E4EEF3] border border-[#9AAED4]/30 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-[#173885]" />
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#173885]">
                  Help & Inquiries
                </h1>

                <p className="mt-1 text-xs text-[#606460]">
                  Register and track delivery, product, quality, billing, and
                  order-related inquiries.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start">
            <button
              type="button"
              onClick={() => loadComplaints({ silent: true })}
              disabled={refreshing || loading}
              className="btn-gm-secondary px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RotateCcw
                className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
              />

              <span className="hidden sm:inline">
                {refreshing ? "Refreshing..." : "Refresh"}
              </span>
            </button>

            <button
              type="button"
              onClick={openModal}
              className="btn-gm-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Inquiry</span>
            </button>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />

          <div className="flex-1">
            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={() => setError(null)}
            className="shrink-0 hover:opacity-70"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        <div className="md:col-span-1">
          <AccountNav />
        </div>

        <div className="md:col-span-3 space-y-4">
          {!loading && complaints.length > 0 && (
            <div className="bg-[#FEFEFE] border border-[#D9E2EA] rounded-2xl p-3.5 flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6F8A92]" />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search your inquiries..."
                  className="w-full gm-input pl-9 pr-3 py-2.5 rounded-xl text-xs"
                />
              </div>

              <div className="text-[10px] text-[#6F8A92] shrink-0">
                {filteredComplaints.length} of {complaints.length} inquiries
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="h-52 bg-[#FEFEFE] rounded-2xl border border-[#D9E2EA]"
                />
              ))}
            </div>
          ) : complaints.length === 0 ? (
            <EmptyState onCreate={openModal} />
          ) : filteredComplaints.length === 0 ? (
            <div className="bg-[#FEFEFE] border border-[#D9E2EA] rounded-3xl p-10 text-center">
              <Search className="w-9 h-9 text-[#6F8A92] mx-auto" />

              <h2 className="mt-4 text-base font-bold text-[#173885]">
                No Matching Inquiries
              </h2>

              <p className="mt-1 text-xs text-[#606460]">
                Try a different search term.
              </p>

              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="mt-4 btn-gm-secondary px-4 py-2 rounded-xl text-xs font-bold"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredComplaints.map((complaint) => (
                <ComplaintCard key={complaint.id} complaint={complaint} />
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs flex items-center justify-center p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) {
              closeModal();
            }
          }}
        >
          <div className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl">
            <div className="sticky top-0 bg-[#FEFEFE] border-b border-[#D9E2EA] px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-[#173885]">
                  Register New Inquiry
                </h2>

                <p className="mt-0.5 text-[10px] text-[#606460]">
                  Provide the details so our team can investigate the issue.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#606460] hover:bg-[#F4F6FA] disabled:opacity-50"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block mb-1.5 text-xs font-bold text-[#282926]">
                  Issue Category *
                </label>

                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  disabled={submitting}
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-semibold"
                >
                  {COMPLAINT_CATEGORIES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-bold text-[#282926]">
                  Subject *
                </label>

                <input
                  type="text"
                  required
                  maxLength={150}
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  disabled={submitting}
                  placeholder="Briefly describe your issue"
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
                />

                <div className="mt-1 text-right text-[9px] text-[#6F8A92]">
                  {subject.length}/150
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-bold text-[#282926]">
                  Order ID
                  <span className="ml-1 font-normal text-[#6F8A92]">
                    (Optional)
                  </span>
                </label>

                <input
                  type="text"
                  maxLength={100}
                  value={orderId}
                  onChange={(event) => setOrderId(event.target.value)}
                  disabled={submitting}
                  placeholder="e.g. GM-20260920..."
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono"
                />

                <p className="mt-1 text-[9px] text-[#6F8A92]">
                  Add the related order ID if your inquiry concerns a specific
                  order.
                </p>
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-bold text-[#282926]">
                  Description *
                </label>

                <textarea
                  required
                  rows={6}
                  maxLength={2000}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  disabled={submitting}
                  placeholder="Describe what happened, what you received, and what support you need..."
                  className="w-full gm-input px-3.5 py-3 rounded-xl text-xs resize-none"
                />

                <div className="mt-1 flex justify-between text-[9px] text-[#6F8A92]">
                  <span>Please provide enough detail for investigation.</span>
                  <span>{description.length}/2000</span>
                </div>
              </div>

              <div className="rounded-xl border border-[#D9E2EA] bg-[#F4F6FA] p-3.5">
                <div className="flex gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#173885] shrink-0 mt-0.5" />

                  <p className="text-[10px] leading-5 text-[#606460]">
                    Your inquiry will be reviewed by the Ferrado support team.
                    You can return to this page to track its status and any
                    resolution notes.
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="flex-1 btn-gm-secondary px-4 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn-gm-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-3.5 h-3.5" />
                      Register Inquiry
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Complaints;
