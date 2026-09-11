import React, { useState } from "react";
import { AccountNav } from "./AccountNav";
import { useAuth } from "../../context/AuthContext";
import { AuthModal } from "../AuthModal";
import { Sliders, Bell, Mail, Phone, CheckCircle2, Lock } from "lucide-react";

export const Preferences = () => {
  const { user, loading: authLoading } = useAuth();

  const [prefs, setPrefs] = useState({
    dispatchSms: true,
    emailInvoices: true,
    b2bPromos: false,
  });

  const [savedNotice, setSavedNotice] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  if (!authLoading && !user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <h1 className="text-2xl font-black text-[#173885]">Preferences</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <AccountNav />
          </div>
          <div className="md:col-span-3">
            <div className="gm-panel p-12 rounded-3xl text-center space-y-4 max-w-md mx-auto">
              <Lock className="w-10 h-10 text-[#173885] mx-auto" />
              <h2 className="text-lg font-bold text-[#173885]">
                Sign In Required
              </h2>
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
      <div className="border-b border-[#D9E2EA] pb-5">
        <h1 className="text-2xl font-black text-[#173885]">
          Communication Preferences
        </h1>
        <p className="text-xs text-[#606460]">
          Manage your live dispatch SMS and automated GST invoice email delivery
          settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        <div className="md:col-span-1">
          <AccountNav />
        </div>

        <div className="md:col-span-3">
          <form
            onSubmit={handleSave}
            className="gm-panel p-6 sm:p-8 rounded-3xl space-y-6 border border-[#D9E2EA]"
          >
            {savedNotice && (
              <div className="p-3.5 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#3F7D20]" />
                <span>Preferences saved successfully.</span>
              </div>
            )}

            <div className="space-y-4">
              <label className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-[#F4F6FA] border border-[#D9E2EA] cursor-pointer">
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#3C7DDA] mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-[#282926]">
                      Site Dispatch SMS & OTP Alerts
                    </h4>
                    <p className="text-[11px] text-[#606460]">
                      Receive instant 30-minute priority delivery vehicle
                      updates.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.dispatchSms}
                  onChange={(e) =>
                    setPrefs({ ...prefs, dispatchSms: e.target.checked })
                  }
                  className="w-4 h-4 rounded accent-[#3C7DDA]"
                />
              </label>

              <label className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-[#F4F6FA] border border-[#D9E2EA] cursor-pointer">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#173885] mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-[#282926]">
                      Automated GST Invoice Emails
                    </h4>
                    <p className="text-[11px] text-[#606460]">
                      Receive tax invoices and delivery challans directly in
                      your inbox.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.emailInvoices}
                  onChange={(e) =>
                    setPrefs({ ...prefs, emailInvoices: e.target.checked })
                  }
                  className="w-4 h-4 rounded accent-[#3C7DDA]"
                />
              </label>
            </div>

            <button
              type="submit"
              className="btn-gm-primary px-6 py-3 rounded-xl text-xs font-bold"
            >
              Save Preferences
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
