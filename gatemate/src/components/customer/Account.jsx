import React from "react";
import { Link } from "react-router-dom";
import { AccountNav } from "./AccountNav";
import { useAuth } from "../../context/AuthContext";
import { AuthModal } from "../AuthModal";
import { profileService } from "../../services/profileService";
import {
  User,
  Package,
  MapPin,
  Heart,
  Building2,
  Bell,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Lock,
  CheckCircle2,
  Loader2,
  Pencil,
  Check,
  X,
  Mail,
  Phone,
  MapPinned,
  Languages,
  AlertCircle,
} from "lucide-react";

export const Account = () => {
  const { user, logout, loading: authLoading } = useAuth();

  const [authModalOpen, setAuthModalOpen] = React.useState(false);

  const [profile, setProfile] = React.useState({
    fullName: "",
    email: "",
    phone: "",
    defaultPincode: "",
    preferredLanguage: "en",
    isEmailVerified: false,
    isPhoneVerified: false,
    phoneVerificationAvailable: false,
  });

  const [editingField, setEditingField] = React.useState(null);
  const [editValue, setEditValue] = React.useState("");

  const [loadingProfile, setLoadingProfile] = React.useState(true);
  const [savingField, setSavingField] = React.useState(false);
  const [profileError, setProfileError] = React.useState("");
  const [successMessage, setSuccessMessage] = React.useState("");

  const loadProfile = React.useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoadingProfile(true);
      setProfileError("");

      const data = await profileService.getProfile(user.id, user);

      setProfile({
        fullName: data?.fullName || "",
        email: data?.email || user?.email || "",
        phone: data?.phone || "",
        defaultPincode: data?.defaultPincode || "",
        preferredLanguage: data?.preferredLanguage || "en",
        isEmailVerified: Boolean(data?.isEmailVerified),
        isPhoneVerified: Boolean(data?.isPhoneVerified),
        phoneVerificationAvailable: Boolean(data?.phoneVerificationAvailable),
      });
    } catch (error) {
      console.error("Failed to load customer profile:", error);

      setProfileError(
        error?.message ||
          "Unable to load your profile details. Please try again.",
      );
    } finally {
      setLoadingProfile(false);
    }
  }, [user]);

  React.useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user?.id, loadProfile]);

  const getFieldValue = (field) => {
    return profile[field] ?? "";
  };

  const getDisplayValue = (field) => {
    if (field === "preferredLanguage") {
      const languages = {
        en: "English",
        mr: "Marathi",
        hi: "Hindi",
      };

      return languages[profile.preferredLanguage] || "English";
    }

    return profile[field] || "Not provided";
  };

  const startEditing = (field) => {
    setProfileError("");
    setSuccessMessage("");
    setEditingField(field);
    setEditValue(getFieldValue(field));
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue("");
    setProfileError("");
  };

  const saveField = async (field) => {
    if (!user?.id) {
      setProfileError("You must be signed in to update your profile.");
      return;
    }

    let value = String(editValue ?? "").trim();

    if (field === "fullName" && !value) {
      setProfileError("Please enter your full name.");
      return;
    }

    if (field === "phone" && value && !/^\d{10}$/.test(value)) {
      setProfileError("Phone number must contain exactly 10 digits.");
      return;
    }

    if (field === "defaultPincode" && value && !/^\d{6}$/.test(value)) {
      setProfileError("Pincode must contain exactly 6 digits.");
      return;
    }

    try {
      setSavingField(true);
      setProfileError("");
      setSuccessMessage("");

      const updatePayload = {
        fullName: profile.fullName,
        phone: profile.phone,
        defaultPincode: profile.defaultPincode,
        preferredLanguage: profile.preferredLanguage,
      };

      updatePayload[field] = value;

      const result = await profileService.updateProfile(
        user.id,
        updatePayload,
        user,
      );

      const updated = result?.data;

      if (updated) {
        setProfile({
          fullName: updated.fullName || "",
          email: updated.email || user?.email || "",
          phone: updated.phone || "",
          defaultPincode: updated.defaultPincode || "",
          preferredLanguage: updated.preferredLanguage || "en",
          isEmailVerified: Boolean(updated.isEmailVerified),
          isPhoneVerified: Boolean(updated.isPhoneVerified),
          phoneVerificationAvailable: Boolean(
            updated.phoneVerificationAvailable,
          ),
        });
      } else {
        setProfile((prev) => ({
          ...prev,
          [field]: value,
        }));
      }

      setEditingField(null);
      setEditValue("");

      setSuccessMessage(
        result?.message || "Profile detail updated successfully.",
      );

      window.setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);

      setProfileError(
        error?.message ||
          "Unable to update this profile detail. Please try again.",
      );
    } finally {
      setSavingField(false);
    }
  };

  const handleEditInput = (field, value) => {
    if (field === "phone" || field === "defaultPincode") {
      value = value.replace(/\D/g, "");

      if (field === "phone") {
        value = value.slice(0, 10);
      }

      if (field === "defaultPincode") {
        value = value.slice(0, 6);
      }
    }

    setEditValue(value);
    setProfileError("");
  };

  const quickLinks = [
    {
      title: "My Orders",
      desc: "Track live dispatches and delivery timelines",
      path: "/account/orders",
      icon: Package,
    },
    {
      title: "Delivery Addresses",
      desc: "Manage your construction site drop points",
      path: "/account/addresses",
      icon: MapPin,
    },
    {
      title: "Saved Products",
      desc: "Products saved for upcoming project phases",
      path: "/account/wishlist",
      icon: Heart,
    },
    {
      title: "Commercial B2B RFQs",
      desc: "Submit and track bulk project estimates",
      path: "/account/b2b",
      icon: Building2,
    },
    {
      title: "Dispatch Notifications",
      desc: "Live alerts for 30-minute priority orders",
      path: "/account/notifications",
      icon: Bell,
    },
  ];

  const profileInitial =
    profile.fullName?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "C";

  if (!authLoading && !user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <h1 className="text-2xl font-black text-[#173885]">Account Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          <div className="md:col-span-1">
            <AccountNav />
          </div>

          <div className="md:col-span-3">
            <div className="gm-panel p-12 rounded-3xl text-center space-y-4 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-[#E4EEF3] text-[#173885] flex items-center justify-center mx-auto border border-[#D9E2EA]">
                <Lock className="w-7 h-7" />
              </div>

              <h2 className="text-lg font-bold text-[#173885]">
                Sign In to View Profile
              </h2>

              <p className="text-xs text-[#606460]">
                Access your construction order history, saved addresses, and
                commercial project RFQs.
              </p>

              <button
                onClick={() => setAuthModalOpen(true)}
                className="btn-gm-primary px-6 py-3 rounded-xl text-xs font-bold"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => setAuthModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24">
      {/* Profile Header */}
      <div className="gm-panel p-6 sm:p-8 rounded-3xl border border-[#D9E2EA] flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-[#FEFEFE]">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#E4EEF3] border border-[#9AAED4]/40 flex items-center justify-center text-[#173885] font-black text-xl">
            {profileInitial}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-[#173885]">
                {profile.fullName || "Customer Account"}
              </h1>

              {profile.isEmailVerified && (
                <span className="badge-gm-success px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Email Verified
                </span>
              )}
            </div>

            <p className="text-xs text-[#606460] font-mono">
              {profile.email || user?.email}
            </p>

            {profile.phone && (
              <p className="text-xs text-[#6F8A92] font-mono">
                {profile.phone}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={logout}
          className="btn-gm-secondary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto text-[#B43D20] hover:bg-[#FBE3DE] hover:border-[#FBE3DE]"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Account Navigation */}
        <div className="md:col-span-1">
          <AccountNav />
        </div>

        {/* Main Content */}
        <div className="md:col-span-3 space-y-5">
          {/* Profile Details */}
          <div className="gm-panel rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] overflow-hidden">
            <div className="p-6 border-b border-[#D9E2EA]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E4EEF3] text-[#173885] flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-[#173885]">
                    Profile Details
                  </h2>

                  <p className="text-[11px] text-[#606460] mt-0.5">
                    Manage your personal information.
                  </p>
                </div>
              </div>
            </div>

            {loadingProfile ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3 text-[#606460]">
                <Loader2 className="w-6 h-6 animate-spin text-[#173885]" />
                <span className="text-xs">Loading profile...</span>
              </div>
            ) : (
              <div className="p-6 space-y-1">
                {/* Error */}
                {profileError && (
                  <div className="mb-5 flex items-start gap-2 p-3 rounded-xl bg-[#FBE3DE] border border-[#E7B7AA] text-[#9D3A25]">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />

                    <p className="text-[11px] leading-relaxed">
                      {profileError}
                    </p>
                  </div>
                )}

                {/* Success */}
                {successMessage && (
                  <div className="mb-5 flex items-center gap-2 p-3 rounded-xl bg-[#E5F3EA] border border-[#B8DCC6] text-[#3C7D5A]">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />

                    <p className="text-[11px] font-medium">{successMessage}</p>
                  </div>
                )}

                {/* Full Name */}
                <ProfileField
                  label="Full Name"
                  icon={User}
                  field="fullName"
                  value={getDisplayValue("fullName")}
                  editingField={editingField}
                  editValue={editValue}
                  savingField={savingField}
                  onEdit={startEditing}
                  onCancel={cancelEditing}
                  onSave={saveField}
                  onChange={handleEditInput}
                  placeholder="Enter your full name"
                  type="text"
                />

                {/* Email */}
                <ProfileField
                  label="Email Address"
                  icon={Mail}
                  field="email"
                  value={getDisplayValue("email")}
                  readOnly
                  verified={profile.isEmailVerified}
                />

                {/* Phone */}
                <ProfileField
                  label="Phone Number"
                  icon={Phone}
                  field="phone"
                  value={getDisplayValue("phone")}
                  editingField={editingField}
                  editValue={editValue}
                  savingField={savingField}
                  onEdit={startEditing}
                  onCancel={cancelEditing}
                  onSave={saveField}
                  onChange={handleEditInput}
                  placeholder="10-digit mobile number"
                  type="tel"
                  helperText="Phone verification will be available when SMS/WhatsApp verification is enabled."
                />

                {/* Default Pincode */}
                <ProfileField
                  label="Default Pincode"
                  icon={MapPinned}
                  field="defaultPincode"
                  value={getDisplayValue("defaultPincode")}
                  editingField={editingField}
                  editValue={editValue}
                  savingField={savingField}
                  onEdit={startEditing}
                  onCancel={cancelEditing}
                  onSave={saveField}
                  onChange={handleEditInput}
                  placeholder="6-digit pincode"
                  type="text"
                />

                {/* Preferred Language */}
                <ProfileField
                  label="Preferred Language"
                  icon={Languages}
                  field="preferredLanguage"
                  value={getDisplayValue("preferredLanguage")}
                  editingField={editingField}
                  editValue={editValue}
                  savingField={savingField}
                  onEdit={startEditing}
                  onCancel={cancelEditing}
                  onSave={saveField}
                  onChange={handleEditInput}
                  type="select"
                />
              </div>
            )}
          </div>

          {/* Account Verification */}
          <div className="gm-panel rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E4EEF3] text-[#173885] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>

              <div className="flex-1">
                <h2 className="text-sm font-bold text-[#173885]">
                  Account Verification
                </h2>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#6F8A92]" />

                      <span className="text-xs text-[#282926]">
                        Email Verification
                      </span>
                    </div>

                    {profile.isEmailVerified ? (
                      <span className="text-[10px] font-bold text-[#3C7D5A] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-[#8A6A22]">
                        Not Verified
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#6F8A92]" />

                      <span className="text-xs text-[#282926]">
                        Phone Verification
                      </span>
                    </div>

                    <span className="text-[10px] font-bold text-[#8A6A22]">
                      Not Available Yet
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="text-sm font-bold text-[#173885] uppercase tracking-wider mb-3">
              Account Dashboard
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="gm-card gm-card-hover p-5 rounded-2xl flex items-start justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#E4EEF3] border border-[#9AAED4]/40 flex items-center justify-center text-[#173885] shrink-0 group-hover:bg-[#173885] group-hover:text-[#FEFEFE] transition">
                        <Icon className="w-5 h-5" />
                      </div>

                      <div>
                        <h3 className="text-xs font-bold text-[#282926] group-hover:text-[#173885] transition-colors">
                          {item.title}
                        </h3>

                        <p className="text-[11px] text-[#606460] mt-0.5 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-[#6F8A92] group-hover:text-[#3C7DDA] transition-transform group-hover:translate-x-0.5 shrink-0 mt-1" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Regional Hub Info */}
          <div className="p-5 rounded-2xl bg-[#E4EEF3]/60 border border-[#D9E2EA] text-xs text-[#606460] space-y-1">
            <span className="font-bold text-[#173885]">
              Pune & PCMC Construction Logistics Support
            </span>

            <p className="text-[11px] leading-relaxed">
              For on-site offloading coordination, crane access inquiries, or
              mill test certificate batches, contact the Contractor Desk at
              +91-9829012345.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Individual inline-editable profile field.
 */
const ProfileField = ({
  label,
  icon: Icon,
  field,
  value,
  editingField,
  editValue,
  savingField,
  onEdit,
  onCancel,
  onSave,
  onChange,
  placeholder,
  type = "text",
  readOnly = false,
  verified = false,
  helperText = "",
}) => {
  const isEditing = editingField === field;

  return (
    <div className="py-4 border-b border-[#EDF1F4] last:border-b-0">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#F2F6F8] text-[#173885] flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <label className="text-[10px] font-bold uppercase tracking-wide text-[#6F8A92]">
              {label}
            </label>

            {!readOnly && !isEditing && (
              <button
                type="button"
                onClick={() => onEdit(field)}
                className="flex items-center gap-1.5 text-[10px] font-bold text-[#3C7DDA] hover:text-[#173885] transition-colors shrink-0"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2 flex items-center gap-2">
              {type === "select" ? (
                <select
                  autoFocus
                  value={editValue}
                  onChange={(e) => onChange(field, e.target.value)}
                  disabled={savingField}
                  className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-[#3C7DDA] bg-[#FEFEFE] text-xs text-[#282926] outline-none focus:ring-2 focus:ring-[#3C7DDA]/10"
                >
                  <option value="en">English</option>
                  <option value="mr">Marathi</option>
                  <option value="hi">Hindi</option>
                </select>
              ) : (
                <input
                  autoFocus
                  type={type}
                  inputMode={
                    field === "phone" || field === "defaultPincode"
                      ? "numeric"
                      : undefined
                  }
                  maxLength={
                    field === "phone"
                      ? 10
                      : field === "defaultPincode"
                        ? 6
                        : undefined
                  }
                  value={editValue}
                  onChange={(e) => onChange(field, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onSave(field);
                    }

                    if (e.key === "Escape") {
                      onCancel();
                    }
                  }}
                  disabled={savingField}
                  placeholder={placeholder}
                  className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-[#3C7DDA] bg-[#FEFEFE] text-xs text-[#282926] outline-none focus:ring-2 focus:ring-[#3C7DDA]/10"
                />
              )}

              <button
                type="button"
                onClick={() => onSave(field)}
                disabled={savingField}
                title="Save"
                className="w-9 h-9 rounded-xl bg-[#173885] text-white flex items-center justify-center hover:bg-[#102B67] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {savingField ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={onCancel}
                disabled={savingField}
                title="Cancel"
                className="w-9 h-9 rounded-xl border border-[#D9E2EA] text-[#606460] flex items-center justify-center hover:bg-[#F4F7F9] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-2 min-h-[28px]">
              <p
                className={`text-sm ${
                  value === "Not provided" ? "text-[#9AA0A5]" : "text-[#282926]"
                }`}
              >
                {value}
              </p>

              {verified && (
                <span className="text-[9px] font-bold text-[#3C7D5A] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
          )}

          {helperText && (
            <p className="mt-1.5 text-[10px] text-[#8A6A22] leading-relaxed">
              {helperText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
