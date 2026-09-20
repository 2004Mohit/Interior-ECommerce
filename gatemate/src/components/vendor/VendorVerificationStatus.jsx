import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Clock,
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
  FileText,
  Building2,
  User,
  MapPin,
  Layers,
  CreditCard,
  ArrowRight,
  Edit2,
  RotateCcw,
  Lock,
  Eye,
} from "lucide-react";
import { useVendorAuth } from "../../context/VendorAuthContext";
import {
  vendorOnboardingService,
  VENDOR_APPLICATION_STATUS,
} from "../../services/vendorOnboardingService";
import { CATALOGUE_CATEGORIES } from "../../data/categories";
import { SeoHead } from "../common/SeoHead";

export const VendorVerificationStatus = () => {
  const { vendorUser, loading: authLoading } = useVendorAuth();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewingDocument, setViewingDocument] = useState(null);

  const loadApplication = async () => {
    if (!vendorUser?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await vendorOnboardingService.getApplication(vendorUser.id);
      setApplication(data);
    } catch (err) {
      setError("Unable to load verification records. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && vendorUser) {
      loadApplication();
    } else if (!authLoading && !vendorUser) {
      setLoading(false);
    }
  }, [vendorUser, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-6 animate-pulse">
        <div className="h-6 bg-[#E4EEF3] rounded w-1/3" />
        <div className="h-44 bg-[#FEFEFE] rounded-3xl border border-[#D9E2EA]" />
      </div>
    );
  }

  if (!vendorUser) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4 font-sans">
        <div className="w-14 h-14 rounded-2xl bg-[#E4EEF3] text-[#173885] flex items-center justify-center mx-auto border border-[#D9E2EA]">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-[#173885]">
          Sign In to Check Verification Status
        </h2>
        <p className="text-xs text-[#606460]">
          Please sign in to inspect your submitted business credentials and
          reviewer remarks.
        </p>
        <Link
          to="/vendor/login"
          className="btn-gm-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold shadow-sm"
        >
          <span>Sign In to Vendor Terminal</span>
          <ArrowRight className="w-4 h-4 text-[#FEFEFE]" />
        </Link>
      </div>
    );
  }

  const status = application?.status || VENDOR_APPLICATION_STATUS.DRAFT;

  const getStatusBadge = () => {
    switch (status) {
      case VENDOR_APPLICATION_STATUS.APPROVED:
        return {
          title: "Application Approved — Active Stockist Partner",
          desc: "Your depot registration, primary product mappings, and GST credentials have been verified. You can now list construction products and receive site dispatch orders in Pune & PCMC.",
          icon: CheckCircle2,
          bg: "bg-[#E1F2D9]",
          border: "border-[#3F7D20]/30",
          text: "text-[#3F7D20]",
          badgeText: "APPROVED",
        };
      case VENDOR_APPLICATION_STATUS.SUBMITTED:
      case VENDOR_APPLICATION_STATUS.UNDER_REVIEW:
        return {
          title: "Application Under Review",
          desc: "Your application is currently undergoing manual verification by our contractor verification desk. We verify physical depot accessibility, GST certificates, and primary distributor authenticity.",
          icon: Clock,
          bg: "bg-[#E3EBFA]",
          border: "border-[#2E4D94]/30",
          text: "text-[#173885]",
          badgeText:
            status === VENDOR_APPLICATION_STATUS.UNDER_REVIEW
              ? "UNDER REVIEW"
              : "SUBMITTED",
        };
      case VENDOR_APPLICATION_STATUS.CHANGES_REQUESTED:
        return {
          title: "Changes Requested by Reviewer",
          desc: "Our review team noted specific items that require correction before approval can be granted. Please update the requested fields and resubmit.",
          icon: AlertCircle,
          bg: "bg-[#FFF0D5]",
          border: "border-[#A66A08]/30",
          text: "text-[#A66A08]",
          badgeText: "CHANGES REQUESTED",
        };
      case VENDOR_APPLICATION_STATUS.REJECTED:
        return {
          title: "Application Declined",
          desc: "Your registration could not be verified against primary construction distributor guidelines. Please see the detailed reviewer notes below.",
          icon: ShieldAlert,
          bg: "bg-[#FBE3DE]",
          border: "border-[#B43D20]/30",
          text: "text-[#B43D20]",
          badgeText: "DECLINED",
        };
      default:
        return {
          title: "Draft Application In Progress",
          desc: "You have started the vendor onboarding form but have not yet submitted it for verification.",
          icon: FileText,
          bg: "bg-[#E4EEF3]",
          border: "border-[#9AAED4]/40",
          text: "text-[#173885]",
          badgeText: "DRAFT",
        };
    }
  };

  const statusInfo = getStatusBadge();
  const StatusIcon = statusInfo.icon;

  const handleViewDocument = async (documentPath, documentName) => {
    if (!documentPath) {
      setError("This document is not available.");
      return;
    }

    try {
      setViewingDocument(documentName);

      const signedUrl =
        await vendorOnboardingService.getVerificationDocumentUrl(
          vendorUser.id,
          documentPath,
        );

      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to open verification document:", err);

      setError(err?.message || "Unable to open the verification document.");
    } finally {
      setViewingDocument(null);
    }
  };

  const handleEditAndResubmit = () => {
    navigate("/vendor/onboarding");
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 pb-28 font-sans">
      <SeoHead
        title="Vendor Verification Status | GateMate"
        description="Inspect your GateMate vendor onboarding review state, submitted business documents, and reviewer remarks."
        canonicalUrl="/vendor/verification"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div>
          <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Verification & Compliance
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
            Vendor Verification Status
          </h1>
          <p className="text-xs text-[#606460]">
            Review your application timeline, reviewer feedback, and submitted
            construction credentials.
          </p>
        </div>

        <button
          onClick={loadApplication}
          className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh Status</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#B43D20] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Primary Status Card */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border ${statusInfo.bg} ${statusInfo.border} space-y-4 shadow-xs`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9E2EA]/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FEFEFE] border border-[#D9E2EA] flex items-center justify-center shrink-0">
              <StatusIcon className={`w-6 h-6 ${statusInfo.text}`} />
            </div>
            <div>
              <h2
                className={`text-base sm:text-lg font-black ${statusInfo.text}`}
              >
                {statusInfo.title}
              </h2>
              <span className="text-[10px] text-[#606460] font-mono">
                Last updated:{" "}
                {application?.updatedAt
                  ? new Date(application.updatedAt).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )
                  : "Pending Submission"}
              </span>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-black tracking-wider border ${statusInfo.border} bg-[#FEFEFE] ${statusInfo.text} self-start sm:self-auto`}
          >
            {statusInfo.badgeText}
          </span>
        </div>

        <p className="text-xs text-[#282926] leading-relaxed">
          {statusInfo.desc}
        </p>

        {/* Reviewer Feedback / Changes Requested Box */}
        {(application?.reviewerNotes || application?.rejectionReason) && (
          <div className="p-4 rounded-2xl bg-[#FEFEFE] border border-[#D9E2EA] text-xs space-y-2">
            <span className="font-bold text-[#173885] block">
              Reviewer Feedback & Remarks:
            </span>
            <p className="text-[#606460] leading-relaxed">
              {application.reviewerNotes || application.rejectionReason}
            </p>
          </div>
        )}

        {/* Action CTAs depending on state */}
        <div className="pt-2 flex flex-wrap gap-3">
          {status === VENDOR_APPLICATION_STATUS.APPROVED && (
            <Link
              to="/vendor/dashboard"
              className="btn-gm-primary px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <span>Go to Vendor Terminal</span>
              <ArrowRight className="w-4 h-4 text-[#FEFEFE]" />
            </Link>
          )}

          {(status === VENDOR_APPLICATION_STATUS.CHANGES_REQUESTED ||
            status === VENDOR_APPLICATION_STATUS.DRAFT ||
            status === VENDOR_APPLICATION_STATUS.REJECTED) && (
            <button
              onClick={handleEditAndResubmit}
              className="btn-gm-primary px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4 text-[#FEFEFE]" />
              <span>
                {status === VENDOR_APPLICATION_STATUS.DRAFT
                  ? "Continue Onboarding Form"
                  : "Correct Information & Resubmit"}
              </span>
            </button>
          )}

          {status === VENDOR_APPLICATION_STATUS.SUBMITTED && (
            <Link
              to="/vendor/guidelines"
              className="btn-gm-secondary px-5 py-2.5 rounded-xl text-xs font-bold"
            >
              Review Quality Guidelines
            </Link>
          )}
        </div>
      </div>

      {/* 2. Submitted Information Summary */}
      <div className="gm-panel p-6 sm:p-8 rounded-3xl border border-[#D9E2EA] space-y-6">
        <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-3">
          <h3 className="text-base font-bold text-[#173885]">
            Submitted Business Profile
          </h3>
          {status !== VENDOR_APPLICATION_STATUS.APPROVED && (
            <button
              onClick={handleEditAndResubmit}
              className="text-xs font-bold text-[#3C7DDA] hover:underline flex items-center gap-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Business & Legal Identity */}
          <div className="space-y-3 bg-[#F4F6FA] p-4 rounded-2xl border border-[#D9E2EA]">
            <div className="flex items-center gap-2 text-[#173885] font-bold border-b border-[#D9E2EA] pb-2">
              <Building2 className="w-4 h-4 text-[#3C7DDA]" />
              <span>Business & Tax Identity</span>
            </div>
            <div className="space-y-1.5 text-[#606460]">
              <div>
                <strong className="text-[#282926]">Legal Name:</strong>{" "}
                {application?.businessDetails?.legalBusinessName ||
                  "Not provided"}
              </div>
              <div>
                <strong className="text-[#282926]">Trade Name:</strong>{" "}
                {application?.businessDetails?.tradeName ||
                  "Same as Legal Name"}
              </div>
              <div>
                <strong className="text-[#282926]">Structure:</strong>{" "}
                {application?.businessDetails?.businessType}
              </div>
              <div>
                <strong className="text-[#282926]">GSTIN:</strong>{" "}
                <span className="font-mono font-bold text-[#173885]">
                  {application?.businessDetails?.gstin || "Pending"}
                </span>
              </div>
              <div>
                <strong className="text-[#282926]">Company PAN:</strong>{" "}
                <span className="font-mono">
                  {application?.businessDetails?.panNumber || "Pending"}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Person */}
          <div className="space-y-3 bg-[#F4F6FA] p-4 rounded-2xl border border-[#D9E2EA]">
            <div className="flex items-center gap-2 text-[#173885] font-bold border-b border-[#D9E2EA] pb-2">
              <User className="w-4 h-4 text-[#3C7DDA]" />
              <span>Managing Contact Details</span>
            </div>
            <div className="space-y-1.5 text-[#606460]">
              <div>
                <strong className="text-[#282926]">Contact Person:</strong>{" "}
                {application?.ownerDetails?.primaryContactName ||
                  "Not provided"}
              </div>
              <div>
                <strong className="text-[#282926]">Designation:</strong>{" "}
                {application?.ownerDetails?.designation}
              </div>
              <div>
                <strong className="text-[#282926]">Official Email:</strong>{" "}
                {application?.ownerDetails?.email}
              </div>
              <div>
                <strong className="text-[#282926]">Mobile Number:</strong>{" "}
                <span className="font-mono font-bold text-[#173885]">
                  {application?.ownerDetails?.mobileNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Depot Location & Access */}
          <div className="space-y-3 bg-[#F4F6FA] p-4 rounded-2xl border border-[#D9E2EA]">
            <div className="flex items-center gap-2 text-[#173885] font-bold border-b border-[#D9E2EA] pb-2">
              <MapPin className="w-4 h-4 text-[#3C7DDA]" />
              <span>Physical Depot Yard</span>
            </div>
            <div className="space-y-1.5 text-[#606460]">
              <div>
                <strong className="text-[#282926]">Address:</strong>{" "}
                {application?.businessAddress?.depotAddressLine1 ||
                  "Not provided"}
              </div>
              <div>
                <strong className="text-[#282926]">Locality:</strong>{" "}
                {application?.businessAddress?.locality},{" "}
                {application?.businessAddress?.city}
              </div>
              <div>
                <strong className="text-[#282926]">PIN Code:</strong>{" "}
                <span className="font-mono font-bold text-[#173885]">
                  {application?.businessAddress?.pincode}
                </span>
              </div>
              <div>
                <strong className="text-[#282926]">
                  Heavy Trailer Access:
                </strong>{" "}
                {application?.businessAddress?.hasHeavyTrailerAccess
                  ? "Yes (40-Ton Access Confirmed)"
                  : "Standard Light Commercial Access"}
              </div>
            </div>
          </div>

          {/* Bank Destination */}
          <div className="space-y-3 bg-[#F4F6FA] p-4 rounded-2xl border border-[#D9E2EA]">
            <div className="flex items-center gap-2 text-[#173885] font-bold border-b border-[#D9E2EA] pb-2">
              <CreditCard className="w-4 h-4 text-[#3C7DDA]" />
              <span>Settlement Bank Details</span>
            </div>
            <div className="space-y-1.5 text-[#606460]">
              <div>
                <strong className="text-[#282926]">Beneficiary:</strong>{" "}
                {application?.bankDetails?.bankAccountName || "Not provided"}
              </div>
              <div>
                <strong className="text-[#282926]">Bank & Branch:</strong>{" "}
                {application?.bankDetails?.bankName}
              </div>
              <div>
                <strong className="text-[#282926]">Account:</strong>{" "}
                <span className="font-mono">
                  •••• ••••{" "}
                  {application?.bankDetails?.accountNumber?.slice(-4) || "••••"}
                </span>
              </div>
              <div>
                <strong className="text-[#282926]">IFSC Code:</strong>{" "}
                <span className="font-mono font-bold text-[#173885]">
                  {application?.bankDetails?.ifscCode}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Product Categories */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-[#173885] uppercase tracking-wider">
            Approved Product Categories
          </h4>
          {application?.productCategories?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {application.productCategories.map((slug) => {
                const cat = CATALOGUE_CATEGORIES.find((c) => c.slug === slug);
                return (
                  <span
                    key={slug}
                    className="badge-gm-info px-3 py-1 rounded-xl text-xs font-semibold"
                  >
                    {cat?.name || slug}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-[#606460]">
              No product categories selected yet.
            </p>
          )}
        </div>

        {/* 4. Submitted Documents Verification Card */}
        <div className="space-y-3 pt-4 border-t border-[#D9E2EA]">
          <h4 className="text-xs font-bold text-[#173885] uppercase tracking-wider">
            Submitted Verification Documents
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* GST Certificate */}
            <div className="p-3.5 rounded-2xl border border-[#D9E2EA] bg-[#F4F6FA] space-y-2">
              <span className="text-[10px] font-bold text-[#6F8A92] uppercase">
                GST Registration (REG-06)
              </span>

              <div className="font-semibold text-[#282926] truncate">
                {application?.verificationDocuments?.gstCertificateName ||
                  "Not Uploaded"}
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[10px] text-emerald-700 font-bold">
                  {application?.verificationDocuments?.gstCertificateName
                    ? "Securely Stored"
                    : "Pending Upload"}
                </span>

                {application?.verificationDocuments?.gstCertificateUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      handleViewDocument(
                        application.verificationDocuments.gstCertificateUrl,
                        application.verificationDocuments.gstCertificateName,
                      )
                    }
                    disabled={
                      viewingDocument ===
                      application.verificationDocuments.gstCertificateName
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9D9E8] bg-white px-2.5 py-1.5 text-[10px] font-bold text-[#3C7DDA] transition hover:border-[#3C7DDA] hover:bg-[#EEF5FB] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Eye className="w-3.5 h-3.5" />

                    {viewingDocument ===
                    application.verificationDocuments.gstCertificateName
                      ? "Opening..."
                      : "View Document"}
                  </button>
                )}
              </div>
            </div>

            {/* PAN Card */}
            <div className="p-3.5 rounded-2xl border border-[#D9E2EA] bg-[#F4F6FA] space-y-2">
              <span className="text-[10px] font-bold text-[#6F8A92] uppercase">
                Business PAN Card
              </span>

              <div className="font-semibold text-[#282926] truncate">
                {application?.verificationDocuments?.panCardName ||
                  "Not Uploaded"}
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[10px] text-emerald-700 font-bold">
                  {application?.verificationDocuments?.panCardName
                    ? "Securely Stored"
                    : "Pending Upload"}
                </span>

                {application?.verificationDocuments?.panCardUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      handleViewDocument(
                        application.verificationDocuments.panCardUrl,
                        application.verificationDocuments.panCardName,
                      )
                    }
                    disabled={
                      viewingDocument ===
                      application.verificationDocuments.panCardName
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9D9E8] bg-white px-2.5 py-1.5 text-[10px] font-bold text-[#3C7DDA] transition hover:border-[#3C7DDA] hover:bg-[#EEF5FB] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Eye className="w-3.5 h-3.5" />

                    {viewingDocument ===
                    application.verificationDocuments.panCardName
                      ? "Opening..."
                      : "View Document"}
                  </button>
                )}
              </div>
            </div>

            {/* Cancelled Cheque */}
            <div className="p-3.5 rounded-2xl border border-[#D9E2EA] bg-[#F4F6FA] space-y-2">
              <span className="text-[10px] font-bold text-[#6F8A92] uppercase">
                Cancelled Cheque
              </span>

              <div className="font-semibold text-[#282926] truncate">
                {application?.verificationDocuments?.cancelledChequeName ||
                  "Not Uploaded"}
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[10px] text-emerald-700 font-bold">
                  {application?.verificationDocuments?.cancelledChequeName
                    ? "Securely Stored"
                    : "Pending Upload"}
                </span>

                {application?.verificationDocuments?.cancelledChequeUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      handleViewDocument(
                        application.verificationDocuments.cancelledChequeUrl,
                        application.verificationDocuments.cancelledChequeName,
                      )
                    }
                    disabled={
                      viewingDocument ===
                      application.verificationDocuments.cancelledChequeName
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9D9E8] bg-white px-2.5 py-1.5 text-[10px] font-bold text-[#3C7DDA] transition hover:border-[#3C7DDA] hover:bg-[#EEF5FB] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Eye className="w-3.5 h-3.5" />

                    {viewingDocument ===
                    application.verificationDocuments.cancelledChequeName
                      ? "Opening..."
                      : "View Document"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
