import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await notificationService.getNotifications(user.id);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError(err?.message || "Unable to load dispatch notifications.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading) {
      fetchNotifications();
    }
  }, [authLoading, fetchNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const type = notification.type;

      if (activeTab === "ORDERS") {
        return (
          type === NOTIFICATION_TYPES.ORDER_UPDATE ||
          type === NOTIFICATION_TYPES.DELIVERY_DISPATCH ||
          type === NOTIFICATION_TYPES.PAYMENT_UPDATE
        );
      }

      if (activeTab === "SECURITY") {
        return type === NOTIFICATION_TYPES.SECURITY_ACCOUNT;
      }

      return true;
    });
  }, [notifications, activeTab]);

  const handleMarkAsRead = async (notificationId) => {
    if (!user?.id || !notificationId || actionLoading) {
      return;
    }

    setActionLoading(true);

    try {
      const updated = await notificationService.markAsRead(
        user.id,
        notificationId,
      );

      setNotifications(Array.isArray(updated) ? updated : []);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      setError(err?.message || "Unable to update the notification.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id || unreadCount === 0 || actionLoading) {
      return;
    }

    setActionLoading(true);

    try {
      const updated = await notificationService.markAllAsRead(user.id);

      setNotifications(Array.isArray(updated) ? updated : []);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      setError(err?.message || "Unable to mark all notifications as read.");
    } finally {
      setActionLoading(false);
    }
  };

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

      case NOTIFICATION_TYPES.MARKETPLACE_ANNOUNCEMENT:
        return <Sparkles className="w-4 h-4 text-[#3C7DDA]" />;

      default:
        return <Bell className="w-4 h-4 text-[#3C7DDA]" />;
    }
  };

  const getNotificationTypeLabel = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.DELIVERY_DISPATCH:
        return "Dispatch";

      case NOTIFICATION_TYPES.ORDER_UPDATE:
        return "Order";

      case NOTIFICATION_TYPES.PAYMENT_UPDATE:
        return "Payment";

      case NOTIFICATION_TYPES.SECURITY_ACCOUNT:
        return "Security";

      case NOTIFICATION_TYPES.MARKETPLACE_ANNOUNCEMENT:
        return "Announcement";

      default:
        return "Notification";
    }
  };

  const formatNotificationDate = (createdAt) => {
    if (!createdAt) {
      return "";
    }

    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatNotificationTime = (createdAt) => {
    if (!createdAt) {
      return "";
    }

    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
                type="button"
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
          onSuccess={() => {
            setAuthModalOpen(false);
          }}
        />
      </div>
    );
  }

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
              notifications.
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={actionLoading}
            className="btn-gm-primary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <CheckCheck className="w-4 h-4" />

            <span>{actionLoading ? "Updating..." : "Mark All as Read"}</span>
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
          <div className="flex flex-wrap gap-2 border-b border-[#D9E2EA] pb-3">
            {[
              {
                key: "ALL",
                label: "All Alerts",
              },
              {
                key: "ORDERS",
                label: "Site Orders & 30-Min Dispatch",
              },
              {
                key: "SECURITY",
                label: "Account & Security",
              },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === tab.key
                    ? "bg-[#173885] text-[#FEFEFE] font-bold shadow-xs"
                    : "text-[#606460] hover:text-[#282926] hover:bg-[#F3F7FA]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="gm-panel p-5 rounded-2xl h-24 animate-pulse bg-[#E4EEF3]"
                />
              ))}
            </div>
          ) : error ? (
            /* Error */
            <div className="gm-panel p-12 rounded-3xl text-center space-y-3 max-w-md mx-auto">
              <AlertCircle className="w-8 h-8 text-[#B43D20] mx-auto" />

              <h3 className="text-sm font-bold text-[#173885]">
                Error Loading Notifications
              </h3>

              <p className="text-xs text-[#606460]">{error}</p>

              <button
                type="button"
                onClick={fetchNotifications}
                disabled={actionLoading}
                className="btn-gm-primary px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-60"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            /* Empty */
            <div className="gm-panel p-16 rounded-3xl text-center space-y-3 max-w-md mx-auto">
              <Bell className="w-12 h-12 text-[#6F8A92] mx-auto" />

              <h3 className="text-lg font-bold text-[#173885]">
                No Notifications
              </h3>

              <p className="text-xs text-[#606460]">
                You're all caught up. Order status updates and site delivery
                alerts will appear here.
              </p>
            </div>
          ) : (
            /* Notification List */
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`gm-panel p-4 sm:p-5 rounded-2xl transition flex items-start gap-3.5 border ${
                  !notification.isRead
                    ? "border-[#3C7DDA] bg-[#E4EEF3]/40 shadow-xs"
                    : "border-[#D9E2EA] hover:border-[#9AAED4]"
                }`}
              >
                {/* Icon */}
                <div className="p-2.5 rounded-xl bg-[#FEFEFE] border border-[#D9E2EA] shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <h4 className="text-xs font-bold text-[#282926] truncate">
                        {notification.title}
                      </h4>

                      {!notification.isRead && (
                        <span
                          className="w-2 h-2 rounded-full bg-[#3C7DDA] shrink-0"
                          aria-label="Unread"
                        />
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] font-bold uppercase tracking-wide text-[#6F8A92] bg-[#F3F7FA] border border-[#D9E2EA] px-2 py-1 rounded-lg">
                        {getNotificationTypeLabel(notification.type)}
                      </span>

                      <span className="text-[10px] text-[#6F8A92] flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />

                        <span>
                          {formatNotificationTime(notification.createdAt)}
                        </span>

                        <span>,</span>

                        <span>
                          {formatNotificationDate(notification.createdAt)}
                        </span>
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#606460] leading-relaxed">
                    {notification.message}
                  </p>

                  <div className="flex items-center justify-between pt-2 gap-3">
                    <div>
                      {notification.link ? (
                        <Link
                          to={notification.link}
                          onClick={() => {
                            if (!notification.isRead) {
                              handleMarkAsRead(notification.id);
                            }
                          }}
                          className="text-[11px] font-bold text-[#3C7DDA] hover:underline flex items-center gap-1"
                        >
                          <span>View Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <div />
                      )}
                    </div>

                    {!notification.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={actionLoading}
                        className="text-[10px] text-[#6F8A92] hover:text-[#282926] disabled:opacity-50 disabled:cursor-not-allowed"
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

export default Notifications;
