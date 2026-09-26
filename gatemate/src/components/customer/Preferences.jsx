import React, { useEffect, useState } from "react";
import {
  Check,
  Loader2,
  MessageSquare,
  ReceiptText,
  Truck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { AccountNav } from "./AccountNav";
import { AuthModal } from "../AuthModal";
import { profileService } from "../../services/profileService";
import { SeoHead } from "../common/SeoHead";

export const Preferences = () => {
  const { user, loading: authLoading } = useAuth();

  const [prefs, setPrefs] = useState({
    orderUpdates: true,
    invoiceEmails: true,
    expressDeliveryNotifications: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");
  const [error, setError] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadPreferences = async () => {
      if (!user?.id) {
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await profileService.getPreferences(user.id);

        if (!mounted) return;

        setPrefs({
          orderUpdates:
            typeof data?.orderUpdates === "boolean" ? data.orderUpdates : true,

          invoiceEmails:
            typeof data?.invoiceEmails === "boolean"
              ? data.invoiceEmails
              : true,

          expressDeliveryNotifications:
            typeof data?.expressDeliveryNotifications === "boolean"
              ? data.expressDeliveryNotifications
              : true,
        });
      } catch (err) {
        console.error("Failed to load customer preferences:", err);

        if (mounted) {
          setError(
            err?.message ||
              "Unable to load your preferences. Please try again.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (!authLoading) {
      loadPreferences();
    }

    return () => {
      mounted = false;
    };
  }, [user?.id, authLoading]);

  const handleToggle = (key) => {
    setPrefs((current) => ({
      ...current,
      [key]: !current[key],
    }));

    setSavedNotice("");
    setError("");
  };

  const handleSave = async () => {
    if (!user?.id) {
      setAuthModalOpen(true);
      return;
    }

    setSaving(true);
    setSavedNotice("");
    setError("");

    try {
      await profileService.updatePreferences(user.id, prefs);

      setSavedNotice("Preferences saved successfully.");

      window.setTimeout(() => {
        setSavedNotice("");
      }, 3500);
    } catch (err) {
      console.error("Failed to save customer preferences:", err);

      setError(
        err?.message || "Unable to save your preferences. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const preferenceItems = [
    {
      key: "orderUpdates",
      title: "Order & Dispatch Notifications",
      description:
        "Receive important updates about order acceptance, preparation, dispatch and delivery.",
      icon: MessageSquare,
    },
    {
      key: "invoiceEmails",
      title: "Invoice Emails",
      description:
        "Receive invoices and billing documents by email when they become available.",
      icon: ReceiptText,
    },
    {
      key: "expressDeliveryNotifications",
      title: "Express Delivery Notifications",
      description:
        "Receive important notifications related to eligible express delivery orders.",
      icon: Truck,
    },
  ];

  if (!authLoading && !user) {
    return (
      <>
        <SeoHead
          title="Account Preferences | Ferrado"
          description="Manage your Ferrado customer communication preferences."
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24">
          <div className="border-b border-[#D9E2EA] pb-4">
            <h1 className="text-xl sm:text-2xl font-black text-[#173885]">
              Account Preferences
            </h1>

            <p className="text-xs text-[#606460] mt-1">
              Manage your order, invoice and delivery notification preferences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
            <div className="md:col-span-1">
              <AccountNav />
            </div>

            <div className="md:col-span-3">
              <div className="gm-panel p-12 rounded-3xl text-center space-y-4 max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-[#E4EEF3] text-[#173885] flex items-center justify-center mx-auto border border-[#D9E2EA]">
                  <LockIcon />
                </div>

                <h2 className="text-lg font-bold text-[#173885]">
                  Sign In to Manage Preferences
                </h2>

                <p className="text-xs text-[#606460]">
                  Sign in to manage your Ferrado communication preferences.
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
      </>
    );
  }

  return (
    <>
      <SeoHead
        title="Account Preferences | Ferrado"
        description="Manage your Ferrado customer communication preferences."
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24">
        {/* Page Header */}
        <div className="border-b border-[#D9E2EA] pb-4">
          <h1 className="text-xl sm:text-2xl font-black text-[#173885]">
            Account Preferences
          </h1>

          <p className="text-xs text-[#606460] mt-1">
            Manage your order, invoice and delivery notification preferences.
          </p>
        </div>

        {/* Account Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {/* Navigation Sidebar */}
          <div className="md:col-span-1">
            <AccountNav />
          </div>

          {/* Preferences Content */}
          <div className="md:col-span-3 space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="gm-panel p-6 rounded-3xl h-28 animate-pulse bg-[#E4EEF3]"
                  />
                ))}
              </div>
            ) : (
              <>
                <div className="gm-panel rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] overflow-hidden">
                  {preferenceItems.map((item, index) => {
                    const Icon = item.icon;
                    const enabled = Boolean(prefs[item.key]);

                    return (
                      <div
                        key={item.key}
                        className={`flex items-start justify-between gap-5 p-5 sm:p-6 ${
                          index !== preferenceItems.length - 1
                            ? "border-b border-[#D9E2EA]"
                            : ""
                        }`}
                      >
                        <div className="flex min-w-0 gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#E4EEF3] border border-[#9AAED4]/40 flex items-center justify-center text-[#173885] shrink-0">
                            <Icon className="w-5 h-5" />
                          </div>

                          <div className="min-w-0">
                            <h2 className="text-xs sm:text-sm font-bold text-[#282926]">
                              {item.title}
                            </h2>

                            <p className="text-[11px] sm:text-xs text-[#606460] mt-1 leading-relaxed max-w-xl">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={enabled}
                          aria-label={`Toggle ${item.title}`}
                          onClick={() => handleToggle(item.key)}
                          className={`relative mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                            enabled ? "bg-[#173885]" : "bg-[#C7D0D8]"
                          }`}
                        >
                          <span
                            className={`inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-sm transition ${
                              enabled ? "translate-x-5" : "translate-x-0.5"
                            }`}
                          >
                            {enabled && (
                              <Check className="h-3 w-3 text-[#173885]" />
                            )}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Status Messages */}
                {error && (
                  <div className="rounded-2xl border border-[#B43D20]/30 bg-[#FBE3DE] px-4 py-3 text-xs text-[#B43D20]">
                    {error}
                  </div>
                )}

                {savedNotice && (
                  <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-[#E1F2D9] px-4 py-3 text-xs text-emerald-700">
                    <Check className="w-4 h-4 shrink-0" />
                    {savedNotice}
                  </div>
                )}

                {/* Save */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="btn-gm-primary px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Preferences"
                    )}
                  </button>
                </div>

                {/* Phone Verification Information */}
                <div className="p-5 rounded-2xl bg-[#E4EEF3]/60 border border-[#D9E2EA]">
                  <p className="text-xs font-bold text-[#173885]">
                    Phone Verification
                  </p>

                  <p className="text-[11px] text-[#606460] mt-1 leading-relaxed">
                    Phone verification is not available yet. SMS or WhatsApp
                    verification will be introduced after the testing phase.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setAuthModalOpen(false)}
      />
    </>
  );
};

/**
 * Small inline lock icon for the unauthenticated state.
 */
const LockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-7 h-7"
  >
    <rect width="18" height="11" x="3" y="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
