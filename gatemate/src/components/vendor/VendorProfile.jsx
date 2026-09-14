import React, { useState, useEffect } from "react";
import {
  Building2,
  User,
  MapPin,
  CreditCard,
  Lock,
  FileText,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronRight,
  X,
} from "lucide-react";
import { useVendorAuth } from "../../context/VendorAuthContext";
import { vendorProfileChangeService } from "../../services/vendorProfileChangeService";
import { SeoHead } from "../common/SeoHead";

const PROTECTED_FIELDS = [
  { key: "BUSINESS_NAME", label: "Legal Business Name" },
  { key: "TRADE_NAME", label: "Trade Name" },
  { key: "GSTIN", label: "GSTIN Number" },
  { key: "PAN_NUMBER", label: "Business PAN" },
  { key: "CONTACT_PERSON", label: "Managing Contact Person" },
  { key: "EMAIL", label: "Registered Email" },
  { key: "PHONE", label: "Primary Phone" },
  { key: "YARD_ADDRESS", label: "Registered Physical Address" },
  { key: "BANK_DETAILS", label: "Settlement Bank Account" },
];

export const VendorProfile = () => {
  const { vendorUser } = useVendorAuth();
  const [profile, setProfile] = useState(null);
  const [changeRequests, setChangeRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState("BUSINESS_NAME");
  const [requestedValue, setRequestedValue] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const loadData = async () => {
    if (!vendorUser?.id) return;
    setLoading(true);
    try {
      const { profile: p, changeRequests: cr } =
        await vendorProfileChangeService.getVendorProfileWithRequests(
          vendorUser.id,
        );
      setProfile(p);
      setChangeRequests(cr);
    } catch (err) {
      setError(err.message || "Unable to load profile data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [vendorUser?.id]);

  const getCurrentValueForField = (fieldKey) => {
    if (!profile) return "N/A";
    switch (fieldKey) {
      case "BUSINESS_NAME":
        return profile.business_name;
      case "TRADE_NAME":
        return profile.trade_name || "Same as Legal Name";
      case "GSTIN":
        return profile.gstin;
      case "PAN_NUMBER":
        return profile.pan_number;
      case "CONTACT_PERSON":
        return profile.contact_person;
      case "EMAIL":
        return profile.email;
      case "PHONE":
        return profile.phone;
      case "YARD_ADDRESS":
        return `${profile.yard_address_line1}, ${profile.locality}, ${profile.city} - ${profile.pincode}`;
      case "BANK_DETAILS":
        return `${profile.bank_details?.bankName || "Bank"} - A/C ${profile.bank_details?.accountNumber || "Pending"}`;
      default:
        return "N/A";
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim() || !requestedValue.trim()) {
      setError("Please provide both the proposed value and justification.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.rpc(
        "vendor_submit_profile_change_request",
        {
          p_requested_field: selectedField,
          p_current_value: { value: getCurrentValueForField(selectedField) },
          p_requested_value: { value: requestedValue.trim() },
          p_reason: reason.trim(),
        },
      );

      if (err) throw err;

      setSuccessMsg(
        "Change request successfully submitted to Admin moderation queue.",
      );
      setIsModalOpen(false);
      setRequestedValue("");
      setReason("");
      loadData();
    } catch (err) {
      setError(err.message || "Failed to submit change request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 font-sans">
      <SeoHead
        title="Vendor Business Profile | GateMate Partner Terminal"
        description="View protected legal identities, tax credentials, bank accounts, and submit verified change requests."
        canonicalUrl="/vendor/profile"
        noIndex={true}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div>
          <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Verified Partner Entity
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
            Vendor Business Profile
          </h1>
          <p className="text-xs text-[#606460]">
            Core trust and identity credentials are protected. Submit an
            official Change Request to modify verified parameters.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsModalOpen(true);
            setError(null);
            setSuccessMsg(null);
          }}
          className="btn-gm-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
        >
          <PlusCircle className="w-4 h-4 text-[#FEFEFE]" />
          <span>Request Profile Change</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Protected Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Business Credentials */}
        <div className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-3">
          <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-2">
            <div className="flex items-center gap-2 text-[#173885] font-bold">
              <Building2 className="w-4 h-4 text-[#3C7DDA]" />
              <span>Legal Business Entity</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] text-[#6F8A92] font-semibold bg-[#F4F6FA] px-2 py-0.5 rounded-md">
              <Lock className="w-3 h-3 text-[#6F8A92]" /> Protected
            </span>
          </div>

          <div className="space-y-2 text-[#606460]">
            <div>
              <strong className="text-[#282926]">Legal Name:</strong>{" "}
              {profile?.business_name || "Verified Vendor"}
            </div>
            <div>
              <strong className="text-[#282926]">Trade Name:</strong>{" "}
              {profile?.trade_name || "N/A"}
            </div>
            <div>
              <strong className="text-[#282926]">Structure:</strong>{" "}
              {profile?.business_type || "Proprietorship"}
            </div>
            <div>
              <strong className="text-[#282926]">GSTIN:</strong>{" "}
              <span className="font-mono font-bold text-[#173885]">
                {profile?.gstin || "27AABCP1234F1Z5"}
              </span>
            </div>
            <div>
              <strong className="text-[#282926]">PAN:</strong>{" "}
              <span className="font-mono">
                {profile?.pan_number || "AABCP1234F"}
              </span>
            </div>
          </div>
        </div>

        {/* Contact Representative */}
        <div className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-3">
          <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-2">
            <div className="flex items-center gap-2 text-[#173885] font-bold">
              <User className="w-4 h-4 text-[#3C7DDA]" />
              <span>Contact Representative</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] text-[#6F8A92] font-semibold bg-[#F4F6FA] px-2 py-0.5 rounded-md">
              <Lock className="w-3 h-3 text-[#6F8A92]" /> Protected
            </span>
          </div>

          <div className="space-y-2 text-[#606460]">
            <div>
              <strong className="text-[#282926]">Contact Name:</strong>{" "}
              {profile?.contact_person || "Managing Director"}
            </div>
            <div>
              <strong className="text-[#282926]">Designation:</strong>{" "}
              {profile?.designation || "Proprietor"}
            </div>
            <div>
              <strong className="text-[#282926]">Email:</strong>{" "}
              {profile?.email || "depot@gatemate.in"}
            </div>
            <div>
              <strong className="text-[#282926]">Phone:</strong>{" "}
              <span className="font-mono font-bold text-[#173885]">
                {profile?.phone || "9829012345"}
              </span>
            </div>
          </div>
        </div>

        {/* Physical Address */}
        <div className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-3">
          <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-2">
            <div className="flex items-center gap-2 text-[#173885] font-bold">
              <MapPin className="w-4 h-4 text-[#3C7DDA]" />
              <span>Registered Depot Yard</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] text-[#6F8A92] font-semibold bg-[#F4F6FA] px-2 py-0.5 rounded-md">
              <Lock className="w-3 h-3 text-[#6F8A92]" /> Protected
            </span>
          </div>

          <div className="space-y-2 text-[#606460]">
            <div>
              <strong className="text-[#282926]">Yard Address:</strong>{" "}
              {profile?.yard_address_line1 || "Pune Industrial Area"}
            </div>
            <div>
              <strong className="text-[#282926]">Locality:</strong>{" "}
              {profile?.locality || "Hadapsar"}, {profile?.city || "Pune"}
            </div>
            <div>
              <strong className="text-[#282926]">PIN Code:</strong>{" "}
              <span className="font-mono font-bold text-[#173885]">
                {profile?.pincode || "411028"}
              </span>
            </div>
            <div>
              <strong className="text-[#282926]">Heavy Trailer Access:</strong>{" "}
              Confirmed (40-Ton Trailers)
            </div>
          </div>
        </div>

        {/* Settlement Bank Information */}
        <div className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-3">
          <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-2">
            <div className="flex items-center gap-2 text-[#173885] font-bold">
              <CreditCard className="w-4 h-4 text-[#3C7DDA]" />
              <span>Disbursal Bank Account</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] text-[#6F8A92] font-semibold bg-[#F4F6FA] px-2 py-0.5 rounded-md">
              <Lock className="w-3 h-3 text-[#6F8A92]" /> Protected
            </span>
          </div>

          <div className="space-y-2 text-[#606460]">
            <div>
              <strong className="text-[#282926]">Bank Name:</strong>{" "}
              {profile?.bank_details?.bankName || "State Bank of India"}
            </div>
            <div>
              <strong className="text-[#282926]">Account Name:</strong>{" "}
              {profile?.bank_details?.bankAccountName || profile?.business_name}
            </div>
            <div>
              <strong className="text-[#282926]">Account Number:</strong>{" "}
              <span className="font-mono font-bold text-[#173885]">
                {profile?.bank_details?.accountNumber || "••••••••1234"}
              </span>
            </div>
            <div>
              <strong className="text-[#282926]">IFSC Code:</strong>{" "}
              <span className="font-mono">
                {profile?.bank_details?.ifscCode || "SBIN0001234"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Change Requests History */}
      <div className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-4">
        <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#173885]" />
            <h2 className="text-sm font-bold text-[#173885]">
              Change Request Audit History
            </h2>
          </div>
          <span className="text-xs text-[#6F8A92] font-mono">
            {changeRequests.length} Total Requests
          </span>
        </div>

        {changeRequests.length === 0 ? (
          <p className="text-xs text-[#606460] py-4 text-center">
            No profile change requests filed.
          </p>
        ) : (
          <div className="space-y-3">
            {changeRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl border border-[#D9E2EA] bg-[#F4F6FA] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[#173885]">
                      {req.requested_field}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        req.status === "APPROVED"
                          ? "bg-[#E1F2D9] text-[#3F7D20]"
                          : req.status === "REJECTED"
                            ? "bg-[#FBE3DE] text-[#B43D20]"
                            : "bg-[#FFF0D5] text-[#A66A08]"
                      }`}
                    >
                      {req.status}
                    </span>
                    <span className="text-[10px] font-mono text-[#6F8A92]">
                      {new Date(req.created_at).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                  <p className="text-[#606460]">
                    <strong>Reason:</strong> {req.reason}
                  </p>
                  {req.reviewer_notes && (
                    <p className="text-[#173885]">
                      <strong>Admin Note:</strong> {req.reviewer_notes}
                    </p>
                  )}
                </div>

                <div className="text-right text-[11px] font-mono shrink-0">
                  <span className="text-[#B43D20] line-through block">
                    {JSON.stringify(
                      req.current_value?.value || req.current_value,
                    )}
                  </span>
                  <span className="text-[#3F7D20] font-bold block">
                    {JSON.stringify(
                      req.requested_value?.value || req.requested_value,
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Change Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-lg p-6 sm:p-8 rounded-3xl relative shadow-2xl space-y-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-[#606460] hover:text-[#282926]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-[#173885]">
              Submit Profile Change Request
            </h3>
            <p className="text-xs text-[#606460]">
              Specify the protected credential you wish to update along with
              official justification.
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#282926] block mb-1">
                  Target Field *
                </label>
                <select
                  value={selectedField}
                  onChange={(e) => setSelectedField(e.target.value)}
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-bold"
                >
                  {PROTECTED_FIELDS.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#282926] block mb-1">
                  Current Active Value
                </label>
                <input
                  type="text"
                  disabled
                  value={getCurrentValueForField(selectedField)}
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs bg-[#F4F6FA] text-[#6F8A92]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#282926] block mb-1">
                  Proposed New Value *
                </label>
                <input
                  type="text"
                  required
                  value={requestedValue}
                  onChange={(e) => setRequestedValue(e.target.value)}
                  placeholder="Enter the proposed new parameter..."
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#282926] block mb-1">
                  Business Justification *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this change is necessary..."
                  className="w-full gm-input p-3 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                    {submitting ? "Submitting..." : "Submit to Admin"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
