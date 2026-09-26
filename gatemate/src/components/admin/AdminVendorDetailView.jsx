import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  User,
  MapPin,
  CreditCard,
  Layers,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Clock,
  ShieldCheck,
  Lock,
  RotateCcw,
} from "lucide-react";
import { adminVendorService } from "../../services/adminVendorService";
import { AdminPermissionGuard } from "./AdminPermissionGuard";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";
import { CATALOGUE_CATEGORIES } from "../../data/categories";
import { SeoHead } from "../common/SeoHead";

export const AdminVendorDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAdminAuth();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Decision Modal State
  const [decisionType, setDecisionType] = useState(null); // 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED'
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Document Signed URLs
  const [docUrls, setDocUrls] = useState({});

  const canViewFinancials =
    hasPermission(ADMIN_PERMISSIONS.MANAGE_SETTLEMENTS) ||
    hasPermission(ADMIN_PERMISSIONS.MANAGE_PAYMENTS);

  const fetchApplication = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminVendorService.getVendorApplicationById(id);
      setApplication(data);

      // Load signed URLs for private verification documents
      const docs = data?.verification_documents || {};
      const urls = {};

      const gstPath = docs.gstCertificatePath || docs.gstCertificateUrl || null;

      const panPath = docs.panCardPath || docs.panCardUrl || null;

      const chequePath =
        docs.cancelledChequePath || docs.cancelledChequeUrl || null;

      if (gstPath) {
        urls.gst = await adminVendorService.getSignedDocumentUrl(gstPath);
      }

      if (panPath) {
        urls.pan = await adminVendorService.getSignedDocumentUrl(panPath);
      }

      if (chequePath) {
        urls.cheque = await adminVendorService.getSignedDocumentUrl(chequePath);
      }

      setDocUrls(urls);
    } catch (err) {
      setError(err.message || "Unable to load vendor application details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (decisionType === "REJECTED" && !rejectionReason.trim()) {
      setError("Please provide a specific rejection reason.");
      return;
    }
    if (decisionType === "CHANGES_REQUESTED" && !reviewerNotes.trim()) {
      setError(
        "Please provide notes explaining what the vendor needs to change.",
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await adminVendorService.submitDecision({
        applicationId: id,
        decision: decisionType,
        reviewerNotes,
        rejectionReason,
      });

      setActionSuccess(
        `Vendor application successfully marked as ${decisionType}.`,
      );
      setDecisionType(null);
      fetchApplication();
    } catch (err) {
      setError(err.message || "Failed to submit decision.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-10 space-y-4 animate-pulse">
        <div className="h-6 bg-[#E4EEF3] rounded w-1/4" />
        <div className="h-64 bg-[#FEFEFE] rounded-3xl border border-[#D9E2EA]" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-3 font-sans">
        <AlertCircle className="w-12 h-12 text-[#B43D20] mx-auto" />
        <h2 className="text-lg font-bold text-[#173885]">
          Vendor Application Not Found
        </h2>
        <Link
          to="/admin/vendor-reviews"
          className="btn-gm-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4 text-[#FEFEFE]" />
          <span>Back to Vendor Queue</span>
        </Link>
      </div>
    );
  }

  const bDetails = application.business_details || {};
  const oDetails = application.owner_details || {};
  const bAddress = application.business_address || {};
  const bank = application.bank_details || {};
  const categories = application.product_categories || [];

  return (
    <AdminPermissionGuard
      permission={ADMIN_PERMISSIONS.REVIEW_VENDOR_APPLICATIONS}
    >
      <div className="max-w-5xl mx-auto space-y-6 pb-24 font-sans">
        <SeoHead
          title={`Inspect Vendor: ${bDetails.legalBusinessName || "Depot"} | Ferrado Admin`}
          description="Detailed inspection of vendor legal identities, depot loading docks, and verification documents."
          canonicalUrl={`/admin/vendors/${id}`}
          noIndex={true}
        />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/vendor-reviews"
              className="p-2 rounded-xl bg-[#FEFEFE] border border-[#D9E2EA] text-[#606460] hover:text-[#173885] hover:bg-[#E4EEF3] transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#173885]">
                  {bDetails.legalBusinessName || "Vendor Application"}
                </h1>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#E4EEF3] text-[#173885] border border-[#3C7DDA]/30">
                  {application.status}
                </span>
              </div>
              <span className="text-xs text-[#606460]">
                Application ID: {application.id}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDecisionType("CHANGES_REQUESTED");
                setReviewerNotes(application.reviewer_notes || "");
              }}
              className="btn-gm-secondary px-3 py-2 rounded-xl text-xs font-bold text-[#A66A08]"
            >
              Request Changes
            </button>
            <button
              type="button"
              onClick={() => {
                setDecisionType("REJECTED");
                setRejectionReason(application.rejection_reason || "");
              }}
              className="btn-gm-secondary px-3 py-2 rounded-xl text-xs font-bold text-[#B43D20] hover:bg-[#FBE3DE]"
            >
              Reject Vendor
            </button>
            <button
              type="button"
              onClick={() => {
                setDecisionType("APPROVED");
                setReviewerNotes(
                  "All business documents and yard access verified.",
                );
              }}
              className="btn-gm-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 text-[#FEFEFE]" />
              <span>Approve Vendor</span>
            </button>
          </div>
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

        {/* 1. Primary Profile Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Business Legal Identity */}
          <div className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-3">
            <div className="flex items-center gap-2 text-[#173885] font-bold border-b border-[#D9E2EA] pb-2">
              <Building2 className="w-4 h-4 text-[#3C7DDA]" />
              <span>Business & Tax Credentials</span>
            </div>
            <div className="space-y-1.5 text-[#606460]">
              <div>
                <strong className="text-[#282926]">Legal Name:</strong>{" "}
                {bDetails.legalBusinessName || "Not provided"}
              </div>
              <div>
                <strong className="text-[#282926]">Trade Name:</strong>{" "}
                {bDetails.tradeName || "Same as Legal Name"}
              </div>
              <div>
                <strong className="text-[#282926]">Structure:</strong>{" "}
                {bDetails.businessType || "Proprietorship"}
              </div>
              <div>
                <strong className="text-[#282926]">GSTIN:</strong>{" "}
                <span className="font-mono font-bold text-[#173885]">
                  {bDetails.gstin || "Pending"}
                </span>
              </div>
              <div>
                <strong className="text-[#282926]">Company PAN:</strong>{" "}
                <span className="font-mono">
                  {bDetails.panNumber || "Pending"}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Person */}
          <div className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-3">
            <div className="flex items-center gap-2 text-[#173885] font-bold border-b border-[#D9E2EA] pb-2">
              <User className="w-4 h-4 text-[#3C7DDA]" />
              <span>Managing Representative</span>
            </div>
            <div className="space-y-1.5 text-[#606460]">
              <div>
                <strong className="text-[#282926]">Contact Person:</strong>{" "}
                {oDetails.primaryContactName || "Not provided"}
              </div>
              <div>
                <strong className="text-[#282926]">Designation:</strong>{" "}
                {oDetails.designation || "Proprietor"}
              </div>
              <div>
                <strong className="text-[#282926]">Official Email:</strong>{" "}
                {oDetails.email || "Not provided"}
              </div>
              <div>
                <strong className="text-[#282926]">Mobile Number:</strong>{" "}
                <span className="font-mono font-bold text-[#173885]">
                  {oDetails.mobileNumber || "Not provided"}
                </span>
              </div>
            </div>
          </div>

          {/* Depot Location & Access */}
          <div className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-3">
            <div className="flex items-center gap-2 text-[#173885] font-bold border-b border-[#D9E2EA] pb-2">
              <MapPin className="w-4 h-4 text-[#3C7DDA]" />
              <span>Physical Yard & Access</span>
            </div>
            <div className="space-y-1.5 text-[#606460]">
              <div>
                <strong className="text-[#282926]">Address:</strong>{" "}
                {bAddress.depotAddressLine1 || "Not provided"}
              </div>
              <div>
                <strong className="text-[#282926]">Locality:</strong>{" "}
                {bAddress.locality || "Pune"}, {bAddress.city || "Pune"}
              </div>
              <div>
                <strong className="text-[#282926]">PIN Code:</strong>{" "}
                <span className="font-mono font-bold text-[#173885]">
                  {bAddress.pincode || "411001"}
                </span>
              </div>
              <div>
                <strong className="text-[#282926]">
                  Heavy 40-Ton Trailer Access:
                </strong>{" "}
                {bAddress.hasHeavyTrailerAccess ? "Yes (Confirmed)" : "No"}
              </div>
            </div>
          </div>

          {/* Bank / Settlement Details - Protected by Permission */}
          <div className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-3">
            <div className="flex items-center gap-2 text-[#173885] font-bold border-b border-[#D9E2EA] pb-2">
              <CreditCard className="w-4 h-4 text-[#3C7DDA]" />
              <span>Settlement Bank Information</span>
            </div>
            {canViewFinancials ? (
              <div className="space-y-1.5 text-[#606460]">
                <div>
                  <strong className="text-[#282926]">Beneficiary:</strong>{" "}
                  {bank.bankAccountName || "Not provided"}
                </div>
                <div>
                  <strong className="text-[#282926]">Bank Name:</strong>{" "}
                  {bank.bankName || "Not provided"}
                </div>
                <div>
                  <strong className="text-[#282926]">Account Number:</strong>{" "}
                  <span className="font-mono font-bold text-[#173885]">
                    {bank.accountNumber || "Pending"}
                  </span>
                </div>
                <div>
                  <strong className="text-[#282926]">IFSC Code:</strong>{" "}
                  <span className="font-mono">
                    {bank.ifscCode || "Pending"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[#F4F6FA] text-center space-y-1">
                <Lock className="w-4 h-4 text-[#6F8A92] mx-auto" />
                <span className="text-[11px] text-[#6F8A92] block font-semibold">
                  Restricted to Finance Administrators
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Selected Product Categories */}
        <div className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-3">
          <div className="flex items-center gap-2 text-[#173885] font-bold border-b border-[#D9E2EA] pb-2 text-xs">
            <Layers className="w-4 h-4 text-[#3C7DDA]" />
            <span>Assigned Product Categories</span>
          </div>
          {categories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {categories.map((slug) => {
                const cat = CATALOGUE_CATEGORIES.find((c) => c.slug === slug);
                return (
                  <span
                    key={slug}
                    className="badge-gm-info px-3 py-1 rounded-xl text-xs font-bold"
                  >
                    {cat?.name || slug}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-[#606460]">
              No product categories selected during onboarding.
            </p>
          )}
        </div>

        {/* 3. Verification Documents (Signed URL View) */}
        <div className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-3">
          <div className="flex items-center gap-2 text-[#173885] font-bold border-b border-[#D9E2EA] pb-2 text-xs">
            <FileText className="w-4 h-4 text-[#3C7DDA]" />
            <span>Submitted Private Verification Documents</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-[#D9E2EA] bg-[#F4F6FA] space-y-2">
              <span className="text-[10px] font-bold text-[#6F8A92] uppercase">
                GST Certificate (REG-06)
              </span>
              {docUrls.gst ? (
                <a
                  href={docUrls.gst}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gm-secondary w-full py-1.5 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5"
                >
                  <span>View Document</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="text-xs text-[#606460] block font-mono">
                  No GST file uploaded
                </span>
              )}
            </div>

            <div className="p-3.5 rounded-xl border border-[#D9E2EA] bg-[#F4F6FA] space-y-2">
              <span className="text-[10px] font-bold text-[#6F8A92] uppercase">
                Business PAN Card
              </span>
              {docUrls.pan ? (
                <a
                  href={docUrls.pan}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gm-secondary w-full py-1.5 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5"
                >
                  <span>View Document</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="text-xs text-[#606460] block font-mono">
                  No PAN file uploaded
                </span>
              )}
            </div>

            <div className="p-3.5 rounded-xl border border-[#D9E2EA] bg-[#F4F6FA] space-y-2">
              <span className="text-[10px] font-bold text-[#6F8A92] uppercase">
                Cancelled Cheque
              </span>
              {docUrls.cheque ? (
                <a
                  href={docUrls.cheque}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gm-secondary w-full py-1.5 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5"
                >
                  <span>View Document</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="text-xs text-[#606460] block font-mono">
                  No Cheque uploaded
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Decision Modal Dialog */}
        {decisionType && (
          <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-lg p-6 rounded-3xl relative shadow-2xl space-y-4">
              <h3 className="text-lg font-black text-[#173885]">
                Confirm Decision: {decisionType}
              </h3>

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
                      placeholder="Explain why the vendor application cannot be approved..."
                      className="w-full gm-input p-3 rounded-xl text-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Reviewer Remarks / Audit Notes *
                  </label>
                  <textarea
                    required={decisionType === "CHANGES_REQUESTED"}
                    rows={3}
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    placeholder="Enter official notes recorded in the audit log and dispatched to the vendor..."
                    className="w-full gm-input p-3 rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDecisionType(null)}
                    disabled={submitting}
                    className="btn-gm-secondary px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-gm-primary px-5 py-2 rounded-xl text-xs font-bold shadow-sm disabled:opacity-50"
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
