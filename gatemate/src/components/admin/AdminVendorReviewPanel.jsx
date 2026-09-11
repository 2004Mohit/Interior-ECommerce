import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  RotateCcw,
  Building2,
  User,
  FileText,
  Send,
} from "lucide-react";
import {
  vendorOnboardingService,
  VENDOR_APPLICATION_STATUS,
} from "../../services/vendorOnboardingService";
import { useAuth } from "../../context/AuthContext";

export const AdminVendorReviewPanel = () => {
  const { user } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(
    VENDOR_APPLICATION_STATUS.APPROVED,
  );
  const [updating, setUpdating] = useState(false);
  const [notice, setNotice] = useState(null);

  const loadApp = async () => {
    if (!user) return;
    setLoading(true);
    const data = await vendorOnboardingService.getApplication(user.id);
    setApplication(data);
    setReviewerNotes(data.reviewerNotes || "");
    setRejectionReason(data.rejectionReason || "");
    setSelectedStatus(data.status || VENDOR_APPLICATION_STATUS.APPROVED);
    setLoading(false);
  };

  useEffect(() => {
    loadApp();
  }, [user]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setNotice(null);
    try {
      const updated =
        await vendorOnboardingService.updateVerificationReviewState(user.id, {
          status: selectedStatus,
          reviewerNotes,
          rejectionReason:
            selectedStatus === VENDOR_APPLICATION_STATUS.REJECTED
              ? rejectionReason
              : "",
        });
      setApplication(updated);
      setNotice(`Vendor status updated to "${selectedStatus}".`);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-xs text-[#606460]">
        Loading admin verification review panel...
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="border-b border-[#D9E2EA] pb-4">
        <h1 className="text-2xl font-black text-[#173885]">
          Admin Vendor Verification Console
        </h1>
        <p className="text-xs text-[#606460]">
          Manual reviewer controls for GateMate contractor onboarding operations
          in Pune & PCMC.
        </p>
      </div>

      {notice && (
        <div className="p-3.5 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#3F7D20]" />
          <span>{notice}</span>
        </div>
      )}

      {/* Reviewer State Action Form */}
      <form
        onSubmit={handleUpdateStatus}
        className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-3">
          <h2 className="text-sm font-bold text-[#173885]">
            Update Verification Decision
          </h2>
          <span className="text-xs text-[#606460] font-mono">
            Current: <strong>{application?.status}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#282926] block mb-1">
              Target Verification Status *
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full gm-input px-3 py-2 rounded-xl text-xs font-bold"
            >
              <option value={VENDOR_APPLICATION_STATUS.UNDER_REVIEW}>
                UNDER REVIEW
              </option>
              <option value={VENDOR_APPLICATION_STATUS.CHANGES_REQUESTED}>
                CHANGES REQUESTED
              </option>
              <option value={VENDOR_APPLICATION_STATUS.APPROVED}>
                APPROVED (Active Seller)
              </option>
              <option value={VENDOR_APPLICATION_STATUS.REJECTED}>
                REJECTED (Declined)
              </option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#282926] block mb-1">
              Reviewer Feedback Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Please upload a clearer copy of GST certificate REG-06."
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              className="w-full gm-input px-3 py-2 rounded-xl text-xs"
            />
          </div>
        </div>

        {selectedStatus === VENDOR_APPLICATION_STATUS.REJECTED && (
          <div>
            <label className="text-xs font-semibold text-[#B43D20] block mb-1">
              Formal Rejection Reason *
            </label>
            <textarea
              rows={2}
              required
              placeholder="State reason why registration does not meet primary distributor standards..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full gm-input p-3 rounded-xl text-xs"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={updating}
          className="btn-gm-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
        >
          <Send className="w-3.5 h-3.5" />
          <span>
            {updating ? "Saving Review Decision..." : "Save Review Decision"}
          </span>
        </button>
      </form>
    </div>
  );
};
