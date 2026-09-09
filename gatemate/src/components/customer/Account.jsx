import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AccountNav } from "./AccountNav";
import { useAuth } from "../../context/AuthContext";
import { profileService } from "../../services/profileService";
import { AuthModal } from "../AuthModal";
import {
  User,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Building2,
  Lock,
  Save,
  RotateCcw,
  Zap,
  Sparkles,
} from "lucide-react";

export const Account = () => {
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusNotice, setStatusNotice] = useState(null);

  // Edit Form Fields
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    location: "Pune / PCMC Region",
    companyName: "",
    gstNumber: "",
    isB2BRegistered: false,
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await profileService.getProfile(user.id, user);
      setProfile(data);
      setFormData({
        fullName: data.fullName || "",
        phone: data.phone || "",
        location: data.location || "Pune / PCMC Region",
        companyName: data.b2bProfile?.companyName || "",
        gstNumber: data.b2bProfile?.gstNumber || "",
        isB2BRegistered: Boolean(data.b2bProfile?.isB2BRegistered),
      });
    } catch (err) {
      setError("Failed to retrieve profile record.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchProfile();
    }
  }, [user, authLoading]);

  // Guest Protection View
  if (!authLoading && !user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <h1 className="text-2xl font-black text-white">Customer Account</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <AccountNav />
          </div>
          <div className="md:col-span-3">
            <div className="premium-panel p-12 rounded-3xl text-center space-y-4 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-white">
                Authentication Required
              </h2>
              <p className="text-xs text-slate-400">
                Please log in to manage your profile, delivery addresses, and
                verified reviews.
              </p>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="gold-gradient-btn px-6 py-3 rounded-xl text-xs font-bold shadow-lg"
              >
                Sign In to Your Account
              </button>
            </div>
          </div>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => {
            setAuthModalOpen(false);
            fetchProfile();
          }}
        />
      </div>
    );
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const updated = {
      ...profile,
      fullName: formData.fullName,
      phone: formData.phone,
      location: formData.location,
      b2bProfile: {
        isB2BRegistered: formData.isB2BRegistered,
        companyName: formData.companyName,
        gstNumber: formData.gstNumber,
        businessType:
          profile?.b2bProfile?.businessType || "Architect / Contractor",
      },
    };

    try {
      await profileService.updateProfile(user.id, updated);
      setProfile(updated);
      setIsEditing(false);
      setStatusNotice("Profile changes saved successfully.");
      setTimeout(() => setStatusNotice(null), 3000);
    } catch (err) {
      setError("Could not update profile. Please retry.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white">Account Overview</h1>
          <p className="text-xs text-slate-400">
            Manage your personal identity, contact information, and verified B2B
            credentials.
          </p>
        </div>

        {profile && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="gold-gradient-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto shadow-md"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {statusNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusNotice}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Navigation Column */}
        <div className="md:col-span-1">
          <AccountNav />
        </div>

        {/* Content Column */}
        <div className="md:col-span-3 space-y-6">
          {loading ? (
            <div className="premium-panel p-8 rounded-3xl h-72 animate-pulse bg-white/5" />
          ) : isEditing ? (
            /* Profile Edit Form */
            <form
              onSubmit={handleSaveProfile}
              className="premium-panel p-6 sm:p-8 rounded-3xl space-y-5 border border-white/10"
            >
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Edit Profile & Contact Details
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="w-full premium-input px-3.5 py-2.5 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Mobile Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full premium-input px-3.5 py-2.5 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Operating Region
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full premium-input px-3.5 py-2.5 rounded-xl text-xs"
                />
              </div>

              {/* B2B Quotation Extension Fields */}
              <div className="pt-3 border-t border-white/10 space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isB2BRegistered}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isB2BRegistered: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded accent-amber-400 cursor-pointer"
                  />
                  <span className="text-xs text-white font-bold flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    Register as B2B Business Customer (Contractors / Architects)
                  </span>
                </label>

                {formData.isB2BRegistered && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-2xl bg-[#091526] border border-white/5">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Registered Entity Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rathore Architectural Interiors"
                        value={formData.companyName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            companyName: e.target.value,
                          })
                        }
                        className="w-full premium-input px-3 py-2 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        GSTIN Number
                      </label>
                      <input
                        type="text"
                        placeholder="27AAAAA0000A1Z5"
                        value={formData.gstNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            gstNumber: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full premium-input px-3 py-2 rounded-xl text-xs font-mono uppercase"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="flex-1 premium-card hover:bg-white/5 py-2.5 rounded-xl text-xs font-bold text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 gold-gradient-btn py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? "Saving..." : "Save Profile"}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Profile View */
            <div className="space-y-6">
              <div className="premium-panel p-6 sm:p-8 rounded-3xl space-y-6 border border-white/10">
                {/* Avatar & User Details */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 text-2xl font-black shadow-lg">
                      {profile.fullName?.[0]?.toUpperCase() || "G"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-white">
                          {profile.fullName}
                        </h2>
                        {profile.isEmailVerified && (
                          <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> VERIFIED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Region:{" "}
                        <span className="text-amber-300 font-semibold">
                          {profile.location}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-[#091526] p-2 rounded-2xl border border-white/5 text-xs text-slate-300">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Pune / PCMC Launch Corridor</span>
                  </div>
                </div>

                {/* Contact Information Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="premium-card p-4 rounded-2xl flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Registered Email
                      </span>
                      <div className="text-xs font-semibold text-white truncate max-w-[200px]">
                        {profile.email || "Email not linked"}
                      </div>
                    </div>
                  </div>

                  <div className="premium-card p-4 rounded-2xl flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-400/10 text-emerald-400 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Contact Phone
                      </span>
                      <div className="text-xs font-semibold text-white font-mono">
                        {profile.phone || "+91 Not Provided"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* B2B Registered Entity Banner */}
                {profile.b2bProfile?.isB2BRegistered ? (
                  <div className="p-4 rounded-2xl bg-[#091526] border border-amber-400/30 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-amber-400 uppercase">
                          Registered B2B Partner
                        </span>
                        <h4 className="font-bold text-white">
                          {profile.b2bProfile.companyName}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono">
                          GSTIN: {profile.b2bProfile.gstNumber}
                        </p>
                      </div>
                    </div>
                    <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full">
                      ACTIVE B2B
                    </span>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-[#091526] border border-white/5 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <h4 className="font-bold text-white">
                        Are you an Architect or Contractor?
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Unlock bulk hardware pricing and GST invoicing in
                        Pune/PCMC.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="gold-gradient-btn px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0"
                    >
                      Add Business GST
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
