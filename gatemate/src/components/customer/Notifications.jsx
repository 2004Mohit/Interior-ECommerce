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
  Sparkles,
  AlertCircle,
  RotateCcw,
  Lock,
  ExternalLink,
  Package,
  Clock,
  Check,
} from "lucide-react";

export const Notifications = () => {
  const { user, loading: authLoading } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("ALL"); // 'ALL' | 'ORDERS' | 'SECURITY'
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
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchNotifications();
    }
  }, [user, authLoading]);

  // Guest Protection View
  if (!authLoading && !user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <h1 className="text-2xl font-black text-white">Notifications</h1>
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
                Please log in to view your dispatch updates, payment receipts,
                and security alerts.
              </p>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="gold-gradient-btn px-6 py-3 rounded-xl text-xs font-bold shadow-lg"
              >
                Sign In to View Alerts
              </button>
            </div>
          </div>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => {
            setAuthModalOpen(false);
            fetchNotifications();
          }}
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
        return <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />;
      case NOTIFICATION_TYPES.ORDER_UPDATE:
        return <Package className="w-4 h-4 text-sky-400" />;
      case NOTIFICATION_TYPES.PAYMENT_UPDATE:
        return <CreditCard className="w-4 h-4 text-emerald-400" />;
      case NOTIFICATION_TYPES.SECURITY_ACCOUNT:
        return <ShieldCheck className="w-4 h-4 text-purple-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24">
      {/* Header */}
      <div className="border-b border-white/10 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">Notifications</h1>
              {unreadCount > 0 && (
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {unreadCount} NEW
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Real-time delivery progress, payment verifications, and account
              alerts in Pune & PCMC.
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="gold-gradient-btn px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto shadow-md"
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
          {/* Filter Tabs */}
          <div className="flex gap-2 border-b border-white/10 pb-3">
            {[
              { key: "ALL", label: "All Alerts" },
              { key: "ORDERS", label: "Orders & 30-Min Dispatch" },
              { key: "SECURITY", label: "Security & Account" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === tab.key
                    ? "bg-[#172a4d] text-amber-300 border border-amber-400/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Alert List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="premium-panel p-5 rounded-2xl h-24 animate-pulse bg-white/5"
                />
              ))}
            </div>
          ) : error ? (
            <div className="premium-panel p-12 rounded-3xl text-center space-y-3 max-w-md mx-auto">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">
                Error Loading Alerts
              </h3>
              <p className="text-xs text-slate-400">{error}</p>
              <button
                onClick={fetchNotifications}
                className="gold-gradient-btn px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="premium-panel p-16 rounded-3xl text-center space-y-3 max-w-md mx-auto">
              <Bell className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-white">No notifications</h3>
              <p className="text-xs text-slate-400">
                You're all caught up! Order status updates and priority dispatch
                alerts will appear here.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`premium-panel p-4 sm:p-5 rounded-2xl transition flex items-start gap-3.5 border ${
                  !notif.isRead
                    ? "border-amber-400/40 bg-[#0e1f38] shadow-lg shadow-amber-950/20"
                    : "border-white/5 hover:border-white/10"
                }`}
              >
                <div className="p-2.5 rounded-xl bg-[#060e1a] border border-white/5 shrink-0 mt-0.5">
                  {getNotificationIcon(notif.type)}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{notif.title}</span>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      )}
                    </h4>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
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

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {notif.message}
                  </p>

                  <div className="flex items-center justify-between pt-2">
                    {notif.link ? (
                      <Link
                        to={notif.link}
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1"
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
                        className="text-[10px] text-slate-400 hover:text-white"
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
