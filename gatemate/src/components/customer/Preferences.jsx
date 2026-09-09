import React, { useState, useEffect } from "react";
import { AccountNav } from "./AccountNav";
import { useAuth } from "../../context/AuthContext";
import { profileService } from "../../services/profileService";
import { AuthModal } from "../AuthModal";
import {
  Sliders,
  MessageCircle,
  Bell,
  Mail,
  Zap,
  CheckCircle2,
  Lock,
  Save,
} from "lucide-react";

export const Preferences = () => {
  const { user, loading: authLoading } = useAuth();

  const [preferences, setPreferences] = useState({
    orderUpdatesWhatsApp: true,
    smsDispatchAlerts: true,
    promotionalEmails: false,
    priorityExpressNotice: true,
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      setLoading(true);
      profileService.getProfile(user.id, user).then((p) => {
        if (p.preferences) setPreferences(p.preferences);
        setLoading(false);
      });
    }
  }, [user, authLoading]);

  if (!authLoading && !user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <h1 className="text-2xl font-black text-white">
          Communication Preferences
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <AccountNav />
          </div>
          <div className="md:col-span-3">
            <div className="premium-panel p-12 rounded-3xl text-center space-y-4 max-w-md mx-auto">
              <Lock className="w-10 h-10 text-amber-400 mx-auto" />
              <h2 className="text-lg font-bold text-white">
                Sign In to Manage Preferences
              </h2>
              <p className="text-xs text-slate-400">
                Log in to control your WhatsApp delivery alerts, SMS dispatch
                notifications, and regional notices.
              </p>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="gold-gradient-btn px-6 py-3 rounded-xl text-xs font-bold shadow-lg"
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

  const handleToggle = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const currentProfile = await profileService.getProfile(user.id, user);
      await profileService.updateProfile(user.id, {
        ...currentProfile,
        preferences,
      });
      setNotice("Communication preferences updated.");
      setTimeout(() => setNotice(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24">
      <div className="border-b border-white/10 pb-5">
        <h1 className="text-2xl font-black text-white">Account Preferences</h1>
        <p className="text-xs text-slate-400">
          Control how GateMate delivers order updates, 30-minute dispatch
          alerts, and notifications.
        </p>
      </div>

      {notice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        <div className="md:col-span-1">
          <AccountNav />
        </div>

        <div className="md:col-span-3 space-y-4">
          <div className="premium-panel p-6 sm:p-8 rounded-3xl space-y-6 border border-white/10">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-3">
              Delivery & Order Communication Channels
            </h3>

            <div className="space-y-4">
              {/* WhatsApp Toggle */}
              <div className="premium-card p-4 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      WhatsApp Order Dispatch Tracking
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Receive live rider location & 30-min express alerts on
                      WhatsApp.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.orderUpdatesWhatsApp}
                  onChange={() => handleToggle("orderUpdatesWhatsApp")}
                  className="w-5 h-5 rounded accent-amber-400 cursor-pointer"
                />
              </div>

              {/* SMS Toggle */}
              <div className="premium-card p-4 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Critical SMS Delivery Alerts
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Receive OTP verification and doorstep delivery SMS
                      notifications.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.smsDispatchAlerts}
                  onChange={() => handleToggle("smsDispatchAlerts")}
                  className="w-5 h-5 rounded accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Promotional Emails */}
              <div className="premium-card p-4 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      New Artisan Arrivals & Special Offers
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Periodic curated catalogs for blue pottery, brassware, and
                      woodcraft.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.promotionalEmails}
                  onChange={() => handleToggle("promotionalEmails")}
                  className="w-5 h-5 rounded accent-amber-400 cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="gold-gradient-btn px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Save Preferences"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
