import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AccountNav } from "./AccountNav";
import { useAuth } from "../../context/AuthContext";
import {
  notificationService,
  NOTIFICATION_TYPES,
} from "../../services/notificationService";
import { AuthModal } from "../AuthModal";
import {
  Bell,
  CheckCheck,
  Zap,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  Lock,
  ExternalLink,
  Package,
  Clock,
  Sparkles,
} from "lucide-react";

export const Notifications = () => {
  const { user, loading: authLoading } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("ALL");
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await notificationService.getNotifications(user.id);
      setNotifications(data);
    } catch (err) {
      setError("Unable to load dispatch notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchNotifications();
    }
  }, [user, authLoading]);

  if (!authLoading && !user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <h1 className="text-2xl font-black text-[#173885]">Notifications</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <AccountNav />
          </div>
          <div className="md:col-span-3">
            <div className="gm-panel p-12 rounded-3xl text-center space-y-4 max-w-md mx-auto">
              <Lock className="w-10 h-10 text-[#173885] mx-auto" />
              <h2 className="text-lg font-bold text-[#173885]">
                Authentication Required
              </h2>
              <p className="text-xs text-[#606460]">
                Please log in to view your site dispatch updates and payment
                receipts.
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

  const handleMarkAsRead = async (id) => {
    const updated = await notificationService.markAsRead(user.id, id);
    setNotifications(updated);
  };

  const handleMarkAllAsRead = async () => {
    const updated = await notificationService.markAllAsRead(user.id);
    setNotifications(updated);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "ORDERS") {
      return (
        n.type === NOTIFICATION_TYPES.ORDER_UPDATE ||
        n.type === NOTIFICATION_TYPES.DELIVERY_DISPATCH ||
        n.type === NOTIFICATION_TYPES.PAYMENT_UPDATE
      );
    }
    if (activeTab === "SECURITY") {
      return n.type === NOTIFICATION_TYPES.SECURITY_ACCOUNT;
    }
    return true;
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.DELIVERY_DISPATCH:
        return <Zap className="w-4 h-4 text-[#3C7DDA] fill-[#3C7DDA]" />;
      case NOTIFICATION_TYPES.ORDER_UPDATE:
        return <Package className="w-4 h-4 text-[#173885]" />;
      case NOTIFICATION_TYPES.PAYMENT_UPDATE:
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case NOTIFICATION_TYPES.SECURITY_ACCOUNT:
        return <ShieldCheck className="w-4 h-4 text-[#2E4D94]" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#3C7DDA]" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24">
      {/* Header */}
      <div className="border-b border-[#D9E2EA] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#E4EEF3] border border-[#9AAED4]/40 flex items-center justify-center text-[#173885]">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#173885]">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="bg-[#B43D20] text-[#FEFEFE] text-[10px] font-black px-2 py-0.5 rounded-full">
                  {unreadCount} NEW
                </span>
              )}
            </div>
            <p className="text-xs text-[#606460]">
              Real-time construction site delivery progress and payment
              verifications in Pune & PCMC.
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="btn-gm-primary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1">
          <AccountNav />
        </div>

        {/* Notifications Column */}
        <div className="md:col-span-3 space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-[#D9E2EA] pb-3">
            {[
              { key: "ALL", label: "All Alerts" },
              { key: "ORDERS", label: "Site Orders & 30-Min Dispatch" },
              { key: "SECURITY", label: "Account & Security" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === tab.key
                    ? "bg-[#173885] text-[#FEFEFE] font-bold shadow-xs"
                    : "text-[#606460] hover:text-[#282926]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="gm-panel p-5 rounded-2xl h-24 animate-pulse bg-[#E4EEF3]"
                />
              ))}
            </div>
          ) : error ? (
            <div className="gm-panel p-12 rounded-3xl text-center space-y-3 max-w-md mx-auto">
              <AlertCircle className="w-8 h-8 text-[#B43D20] mx-auto" />
              <h3 className="text-sm font-bold text-[#173885]">
                Error Loading Notifications
              </h3>
              <p className="text-xs text-[#606460]">{error}</p>
              <button
                onClick={fetchNotifications}
                className="btn-gm-primary px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="gm-panel p-16 rounded-3xl text-center space-y-3 max-w-md mx-auto">
              <Bell className="w-12 h-12 text-[#6F8A92] mx-auto" />
              <h3 className="text-lg font-bold text-[#173885]">
                No Notifications
              </h3>
              <p className="text-xs text-[#606460]">
                You're all caught up! Order status updates and site delivery
                alerts will appear here.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`gm-panel p-4 sm:p-5 rounded-2xl transition flex items-start gap-3.5 border ${
                  !notif.isRead
                    ? "border-[#3C7DDA] bg-[#E4EEF3]/40 shadow-xs"
                    : "border-[#D9E2EA] hover:border-[#9AAED4]"
                }`}
              >
                <div className="p-2.5 rounded-xl bg-[#FEFEFE] border border-[#D9E2EA] shrink-0 mt-0.5">
                  {getNotificationIcon(notif.type)}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-[#282926] flex items-center gap-2">
                      <span>{notif.title}</span>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#3C7DDA] shrink-0" />
                      )}
                    </h4>
                    <span className="text-[10px] text-[#6F8A92] flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(notif.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      ,{" "}
                      {new Date(notif.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-[#606460] leading-relaxed">
                    {notif.message}
                  </p>

                  <div className="flex items-center justify-between pt-2">
                    {notif.link ? (
                      <Link
                        to={notif.link}
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="text-[11px] font-bold text-[#3C7DDA] hover:underline flex items-center gap-1"
                      >
                        <span>View Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : (
                      <div />
                    )}

                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="text-[10px] text-[#6F8A92] hover:text-[#282926]"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
