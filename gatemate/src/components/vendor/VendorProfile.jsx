import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  User,
  MapPin,
  CreditCard,
  ShieldCheck,
  Zap,
  Save,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Lock,
  Edit2,
} from "lucide-react";
import { useVendorAuth } from "../../context/VendorAuthContext";
import { vendorOnboardingService } from "../../services/vendorOnboardingService";
import { SeoHead } from "../common/SeoHead";

export const VendorProfile = () => {
  const { vendorUser } = useVendorAuth();
  const vendorId = vendorUser?.id || "vnd-pune-001";

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState(null);
  const [formError, setFormError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    businessName: "",
    tradeName: "",
    contactPerson: "",
    designation: "",
    email: "",
    phone: "",
    gstin: "",
    panNumber: "",
    address: "",
    locality: "",
    city: "Pune",
    pincode: "411028",
    hasHeavyTrailerAccess: true,
    isExpress30MinEnabled: true,
    bankDetails: {
      accountName: "",
      accountNumber: "",
      bankName: "",
      ifscCode: "",
    },
  });

  const loadProfileData = async () => {
    setLoading(true);
    const app = await vendorOnboardingService.getApplication(vendorId);
    setProfile(app);
    setFormData({
      businessName:
        app.businessDetails?.legalBusinessName ||
        vendorUser?.businessName ||
        "",
      tradeName: app.businessDetails?.tradeName || "",
      contactPerson:
        app.ownerDetails?.primaryContactName || vendorUser?.contactPerson || "",
      designation: app.ownerDetails?.designation || "Depot Manager",
      email: app.ownerDetails?.email || vendorUser?.email || "",
      phone: app.ownerDetails?.mobileNumber || "",
      gstin: app.businessDetails?.gstin || "27AAAAA0000A1Z5",
      panNumber: app.businessDetails?.panNumber || "AAAAA0000A",
      address:
        app.businessAddress?.depotAddressLine1 ||
        "Plot 48, Hadapsar Industrial Estate",
      locality: app.businessAddress?.locality || "Hadapsar",
      city: app.businessAddress?.city || "Pune",
      pincode: app.businessAddress?.pincode || "411028",
      hasHeavyTrailerAccess:
        app.businessAddress?.hasHeavyTrailerAccess !== false,
      isExpress30MinEnabled: true,
      bankDetails: {
        accountName:
          app.bankDetails?.bankAccountName ||
          "Pune Mega Infrastructure Depot Pvt Ltd",
        accountNumber: app.bankDetails?.accountNumber || "•••• •••• 5678",
        bankName: app.bankDetails?.bankName || "HDFC Bank, Hadapsar Branch",
        ifscCode: app.bankDetails?.ifscCode || "HDFC0001234",
      },
    });
    setLoading(false);
  };

  useEffect(() => {
    loadProfileData();
  }, [vendorId]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    try {
      await vendorOnboardingService.saveDraft(vendorId, {
        businessDetails: {
          legalBusinessName: formData.businessName,
          tradeName: formData.tradeName,
          gstin: formData.gstin,
          panNumber: formData.panNumber,
        },
        ownerDetails: {
          primaryContactName: formData.contactPerson,
          designation: formData.designation,
          email: formData.email,
          mobileNumber: formData.phone,
        },
        businessAddress: {
          depotAddressLine1: formData.address,
          locality: formData.locality,
          city: formData.city,
          pincode: formData.pincode,
          hasHeavyTrailerAccess: formData.hasHeavyTrailerAccess,
        },
      });

      setSaveNotice(
        "Business profile and dispatch settings updated successfully.",
      );
      setIsEditing(false);
      setTimeout(() => setSaveNotice(null), 3000);
    } catch (err) {
      setFormError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-4 animate-pulse font-sans">
        <div className="h-6 bg-[#E4EEF3] rounded w-1/3" />
        <div className="h-64 bg-[#FEFEFE] rounded-3xl border border-[#D9E2EA]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6 pb-24 font-sans">
      <SeoHead
        title="Depot Partner Profile | GateMate Vendor Portal"
        description="Manage your verified construction depot business identity, contact escalations, and logistics settings."
        canonicalUrl="/vendor/profile"
        noIndex={true}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div>
          <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Verified Stockist Partner
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
            Depot Partner Profile
          </h1>
          <p className="text-xs text-[#606460]">
            Review business credentials, managing contacts, and dispatch yard
            parameters.
          </p>
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="btn-gm-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(false)}
            className="btn-gm-secondary px-4 py-2 rounded-xl text-xs font-bold self-start sm:self-auto"
          >
            Cancel Editing
          </button>
        )}
      </div>

      {saveNotice && (
        <div className="p-3.5 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#3F7D20]" />
          <span>{saveNotice}</span>
        </div>
      )}

      {formError && (
        <div className="p-3.5 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#B43D20]" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* 1. Legal Entity & GST Information */}
        <div className="gm-panel p-6 sm:p-8 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-3">
            <div className="flex items-center gap-2 text-[#173885] font-bold">
              <Building2 className="w-4 h-4 text-[#3C7DDA]" />
              <h2 className="text-sm font-bold">
                1. Legal Entity & Tax Identifiers
              </h2>
            </div>
            <span className="badge-gm-success px-2.5 py-0.5 rounded-full text-[10px] flex items-center gap-1 font-bold">
              <ShieldCheck className="w-3 h-3" /> GST Verified
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-[#282926] block mb-1">
                Legal Entity / Business Name
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.businessName}
                onChange={(e) =>
                  setFormData({ ...formData, businessName: e.target.value })
                }
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs disabled:bg-[#F4F6FA]"
              />
            </div>

            <div>
              <label className="font-bold text-[#282926] block mb-1">
                Trade / Yard Display Name
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.tradeName}
                onChange={(e) =>
                  setFormData({ ...formData, tradeName: e.target.value })
                }
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs disabled:bg-[#F4F6FA]"
              />
            </div>

            <div>
              <label className="font-bold text-[#282926] block mb-1">
                15-Digit GSTIN (Maharashtra)
              </label>
              <input
                type="text"
                disabled={true}
                value={formData.gstin}
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold bg-[#F4F6FA]"
              />
              <span className="text-[10px] text-[#6F8A92] mt-0.5 block">
                GSTIN modifications require administrative re-verification.
              </span>
            </div>

            <div>
              <label className="font-bold text-[#282926] block mb-1">
                Company PAN
              </label>
              <input
                type="text"
                disabled={true}
                value={formData.panNumber}
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold bg-[#F4F6FA]"
              />
            </div>
          </div>
        </div>

        {/* 2. Managing Contact & Escalations */}
        <div className="gm-panel p-6 sm:p-8 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-[#173885] font-bold border-b border-[#D9E2EA] pb-3">
            <User className="w-4 h-4 text-[#3C7DDA]" />
            <h2 className="text-sm font-bold">
              2. Managing Contact & Escalations
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-[#282926] block mb-1">
                Contact Person Name
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.contactPerson}
                onChange={(e) =>
                  setFormData({ ...formData, contactPerson: e.target.value })
                }
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs disabled:bg-[#F4F6FA]"
              />
            </div>

            <div>
              <label className="font-bold text-[#282926] block mb-1">
                Designation
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.designation}
                onChange={(e) =>
                  setFormData({ ...formData, designation: e.target.value })
                }
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs disabled:bg-[#F4F6FA]"
              />
            </div>

            <div>
              <label className="font-bold text-[#282926] block mb-1">
                Official Business Email
              </label>
              <input
                type="email"
                disabled={!isEditing}
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs disabled:bg-[#F4F6FA]"
              />
            </div>

            <div>
              <label className="font-bold text-[#282926] block mb-1">
                Primary Mobile Number
              </label>
              <input
                type="tel"
                disabled={!isEditing}
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold disabled:bg-[#F4F6FA]"
              />
            </div>
          </div>
        </div>

        {/* 3. Physical Yard & Logistics Parameters */}
        <div className="gm-panel p-6 sm:p-8 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-[#173885] font-bold border-b border-[#D9E2EA] pb-3">
            <MapPin className="w-4 h-4 text-[#3C7DDA]" />
            <h2 className="text-sm font-bold">
              3. Physical Depot Yard & Logistics Access
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="font-bold text-[#282926] block mb-1">
                Depot Plot / Street Address
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs disabled:bg-[#F4F6FA]"
              />
            </div>

            <div>
              <label className="font-bold text-[#282926] block mb-1">
                Locality
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.locality}
                onChange={(e) =>
                  setFormData({ ...formData, locality: e.target.value })
                }
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs disabled:bg-[#F4F6FA]"
              />
            </div>

            <div>
              <label className="font-bold text-[#282926] block mb-1">
                City
              </label>
              <input
                type="text"
                disabled={true}
                value={formData.city}
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs bg-[#F4F6FA]"
              />
            </div>

            <div>
              <label className="font-bold text-[#282926] block mb-1">
                PIN Code
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.pincode}
                onChange={(e) =>
                  setFormData({ ...formData, pincode: e.target.value })
                }
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold disabled:bg-[#F4F6FA]"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  disabled={!isEditing}
                  checked={formData.hasHeavyTrailerAccess}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hasHeavyTrailerAccess: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded accent-[#3C7DDA]"
                />
                <span className="text-xs font-semibold text-[#282926]">
                  40-Ton Trailer Access
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* 4. Bank Settlement Configuration (Read-Only) */}
        <div className="gm-panel p-6 sm:p-8 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-3">
            <div className="flex items-center gap-2 text-[#173885] font-bold">
              <CreditCard className="w-4 h-4 text-[#3C7DDA]" />
              <h2 className="text-sm font-bold">
                4. Destination Settlement Bank Account
              </h2>
            </div>
            <span className="text-[10px] text-[#6F8A92] font-semibold">
              Direct NEFT/RTGS Batch Destination
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#606460]">
            <div>
              <strong className="text-[#282926]">Account Name:</strong>{" "}
              {formData.bankDetails.accountName}
            </div>
            <div>
              <strong className="text-[#282926]">Bank & Branch:</strong>{" "}
              {formData.bankDetails.bankName}
            </div>
            <div>
              <strong className="text-[#282926]">Account Number:</strong>{" "}
              <span className="font-mono font-bold">
                {formData.bankDetails.accountNumber}
              </span>
            </div>
            <div>
              <strong className="text-[#282926]">IFSC Code:</strong>{" "}
              <span className="font-mono font-bold text-[#173885]">
                {formData.bankDetails.ifscCode}
              </span>
            </div>
          </div>
        </div>

        {/* Save CTA */}
        {isEditing && (
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="btn-gm-secondary px-5 py-2.5 rounded-xl text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-gm-primary px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? "Saving..." : "Save Profile Changes"}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
