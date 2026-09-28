import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  ShoppingCart,
  FileText,
  ShieldCheck,
  AlertCircle,
  Banknote,
  Clock,
  RotateCcw,
  ExternalLink,
  Info,
  RefreshCw,
  X,
} from "lucide-react";

import { useVendorAuth } from "../../context/VendorAuthContext";

import {
  vendorNotificationService,
  VENDOR_NOTIFICATION_CATEGORIES,
} from "../../services/vendorNotificationService";

import { SeoHead } from "../common/SeoHead";

export const VendorNotifications = () => {
  const { vendorUser } = useVendorAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState(
    VENDOR_NOTIFICATION_CATEGORIES.ALL,
  );

  /**
   * ---------------------------------------------------------
   * Load notifications
   * ---------------------------------------------------------
   */
  const loadNotifications = useCallback(
    async (showRefreshState = false) => {
      if (!vendorUser?.id) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      try {
        setError("");

        if (showRefreshState) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const data = await vendorNotificationService.getNotifications();

        setNotifications(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Unable to load vendor notifications:", err);

        setError(
          err?.message || "Unable to load notifications. Please try again.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [vendorUser?.id],
  );

  /**
   * ---------------------------------------------------------
   * Initial load
   * ---------------------------------------------------------
   */
  useEffect(() => {
    loadNotifications(false);
  }, [loadNotifications]);

  /**
   * ---------------------------------------------------------
   * Realtime subscription
   *
   * Automatically updates the notification list when:
   *
   * INSERT  -> new notification
   * UPDATE  -> read/unread or other notification update
   * DELETE  -> notification removed
   * ---------------------------------------------------------
   */
  useEffect(() => {
    let unsubscribe = null;
    let cancelled = false;

    const setupRealtime = async () => {
      if (!vendorUser?.id) return;

      try {
        unsubscribe = await vendorNotificationService.subscribeToNotifications(
          ({ event, notification }) => {
            if (cancelled) return;

            if (!notification) {
              return;
            }

            setNotifications((currentNotifications) => {
              if (event === "INSERT") {
                const alreadyExists = currentNotifications.some(
                  (item) => item.id === notification.id,
                );

                if (alreadyExists) {
                  return currentNotifications;
                }

                return [notification, ...currentNotifications];
              }

              if (event === "UPDATE") {
                const exists = currentNotifications.some(
                  (item) => item.id === notification.id,
                );

                if (!exists) {
                  return [notification, ...currentNotifications];
                }

                return currentNotifications.map((item) =>
                  item.id === notification.id ? notification : item,
                );
              }

              if (event === "DELETE") {
                return currentNotifications.filter(
                  (item) => item.id !== notification.id,
                );
              }

              return currentNotifications;
            });
          },
        );
      } catch (err) {
        console.error("Unable to setup vendor notification realtime:", err);
      }
    };

    setupRealtime();

    return () => {
      cancelled = true;

      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [vendorUser?.id]);

  /**
   * ---------------------------------------------------------
   * Manual refresh
   * ---------------------------------------------------------
   */
  const handleRefresh = async () => {
    await loadNotifications(true);
  };

  /**
   * ---------------------------------------------------------
   * Mark one notification as read
   * ---------------------------------------------------------
   */
  const handleMarkAsRead = async (id) => {
    if (!id || actionLoading) return;

    try {
      setActionLoading(true);
      setError("");

      const updated = await vendorNotificationService.markAsRead(id);

      setNotifications(Array.isArray(updated) ? updated : []);
    } catch (err) {
      console.error("Unable to mark notification as read:", err);

      setError(err?.message || "Unable to mark notification as read.");
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * ---------------------------------------------------------
   * Mark all notifications as read
   * ---------------------------------------------------------
   */
  const handleMarkAllAsRead = async () => {
    if (actionLoading) return;

    try {
      setActionLoading(true);
      setError("");

      const updated = await vendorNotificationService.markAllAsRead();

      setNotifications(Array.isArray(updated) ? updated : []);
    } catch (err) {
      console.error("Unable to mark all notifications as read:", err);

      setError(err?.message || "Unable to mark all notifications as read.");
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * ---------------------------------------------------------
   * Unread count
   * ---------------------------------------------------------
   */
  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  /**
   * ---------------------------------------------------------
   * Category filtering
   * ---------------------------------------------------------
   */
  const filteredNotifications = notifications.filter((notification) => {
    if (activeCategory === VENDOR_NOTIFICATION_CATEGORIES.ALL) {
      return true;
    }

    return notification.category === activeCategory;
  });

  /**
   * ---------------------------------------------------------
   * Category icon
   * ---------------------------------------------------------
   */
  const getCategoryIcon = (category) => {
    switch (category) {
      case VENDOR_NOTIFICATION_CATEGORIES.ORDERS:
        return <ShoppingCart className="w-4 h-4 text-[#173885]" />;

      case VENDOR_NOTIFICATION_CATEGORIES.RFQS_QUOTATIONS:
        return <FileText className="w-4 h-4 text-[#3C7DDA]" />;

      case VENDOR_NOTIFICATION_CATEGORIES.PRODUCT_MODERATION:
        return <AlertCircle className="w-4 h-4 text-[#A66A08]" />;

      case VENDOR_NOTIFICATION_CATEGORIES.SETTLEMENTS:
        return <Banknote className="w-4 h-4 text-[#3F7D20]" />;

      case VENDOR_NOTIFICATION_CATEGORIES.VERIFICATION:
        return <ShieldCheck className="w-4 h-4 text-[#3F7D20]" />;

      case VENDOR_NOTIFICATION_CATEGORIES.PLATFORM_NOTICES:
        return <Info className="w-4 h-4 text-[#173885]" />;

      default:
        return <Info className="w-4 h-4 text-[#173885]" />;
    }
  };

  /**
   * ---------------------------------------------------------
   * Category tabs
   * ---------------------------------------------------------
   */
  const categoryTabs = [
    {
      key: VENDOR_NOTIFICATION_CATEGORIES.ALL,
      label: "All Alerts",
    },
    {
      key: VENDOR_NOTIFICATION_CATEGORIES.ORDERS,
      label: "Orders & Dispatches",
    },
    {
      key: VENDOR_NOTIFICATION_CATEGORIES.RFQS_QUOTATIONS,
      label: "RFQs & Quotes",
    },
    {
      key: VENDOR_NOTIFICATION_CATEGORIES.PRODUCT_MODERATION,
      label: "Product Moderation",
    },
    {
      key: VENDOR_NOTIFICATION_CATEGORIES.SETTLEMENTS,
      label: "Bank Settlements",
    },
    {
      key: VENDOR_NOTIFICATION_CATEGORIES.VERIFICATION,
      label: "Vendor Verification",
    },
    {
      key: VENDOR_NOTIFICATION_CATEGORIES.PLATFORM_NOTICES,
      label: "Platform Notices",
    },
  ];

  /**
   * ---------------------------------------------------------
   * Date formatter
   * ---------------------------------------------------------
   */
  const formatNotificationDate = (createdAt) => {
    if (!createdAt) {
      return "Recently";
    }

    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
      return "Recently";
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 pb-24 font-sans">
      <SeoHead
        title="Vendor Notifications & Dispatch Alerts | Ferrado"
        description="Real-time alerts on new site orders, commercial RFQ updates, product moderation updates, and bank settlements."
        canonicalUrl="/vendor/notifications"
        noIndex={true}
      />

      {/* =====================================================
          HEADER
      ====================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#E4EEF3] border border-[#9AAED4]/40 flex items-center justify-center text-[#173885]">
            <Bell className="w-6 h-6 text-[#173885]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-[#173885]">
                Vendor Notifications
              </h1>

              {unreadCount > 0 && (
                <span className="bg-[#B43D20] text-[#FEFEFE] text-[10px] font-black px-2 py-0.5 rounded-full">
                  {unreadCount} NEW
                </span>
              )}
            </div>

            <p className="text-xs text-[#606460]">
              Operational alerts on incoming dispatches, commercial RFQs,
              product review feedback, and bank payouts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={actionLoading}
              className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCheck className="w-3.5 h-3.5" />

              <span>{actionLoading ? "Updating..." : "Mark All as Read"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-gm-secondary p-2 rounded-xl text-[#606460] hover:text-[#173885] disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh notifications"
          >
            <RotateCcw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* =====================================================
          REALTIME STATUS
      ====================================================== */}
      <div className="flex items-center gap-2 text-[10px] text-[#6F8A92]">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[#3F7D20] opacity-60 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3F7D20]" />
        </span>

        <span>Notifications update automatically in real time</span>
      </div>

      {/* =====================================================
          ERROR MESSAGE
      ====================================================== */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-[#E5B4A6] bg-[#FFF5F2]">
          <AlertCircle className="w-5 h-5 text-[#B43D20] shrink-0 mt-0.5" />

          <div className="flex-1">
            <p className="text-xs font-bold text-[#8D2F19]">
              Unable to load notifications
            </p>

            <p className="text-xs text-[#606460] mt-1">{error}</p>

            <button
              type="button"
              onClick={() => loadNotifications(true)}
              className="mt-2 text-[11px] font-bold text-[#3C7DDA] hover:underline"
            >
              Try Again
            </button>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-[#6F8A92] hover:text-[#282926]"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =====================================================
          CATEGORY TABS
      ====================================================== */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-[#D9E2EA] scrollbar-none">
        {categoryTabs.map((tab) => {
          const isSelected = activeCategory === tab.key;

          const count =
            tab.key === VENDOR_NOTIFICATION_CATEGORIES.ALL
              ? notifications.length
              : notifications.filter(
                  (notification) => notification.category === tab.key,
                ).length;

          const unreadCategoryCount =
            tab.key === VENDOR_NOTIFICATION_CATEGORIES.ALL
              ? unreadCount
              : notifications.filter(
                  (notification) =>
                    notification.category === tab.key && !notification.isRead,
                ).length;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveCategory(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
                isSelected
                  ? "bg-[#173885] text-[#FEFEFE] shadow-xs"
                  : "bg-[#FEFEFE] text-[#606460] border border-[#D9E2EA] hover:bg-[#E4EEF3]"
              }`}
            >
              <span>{tab.label}</span>

              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isSelected
                    ? "bg-[#3C7DDA] text-[#FEFEFE]"
                    : "bg-[#E4EEF3] text-[#173885]"
                }`}
              >
                {count}
              </span>

              {unreadCategoryCount > 0 && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSelected ? "bg-[#FEFEFE]" : "bg-[#B43D20]"
                  }`}
                  title={`${unreadCategoryCount} unread`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* =====================================================
          LOADING
      ====================================================== */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="gm-panel p-5 rounded-2xl h-24 animate-pulse bg-[#E4EEF3]"
            />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        /* ===================================================
           EMPTY STATE
        ==================================================== */
        <div className="gm-panel p-16 rounded-3xl text-center space-y-3 border border-[#D9E2EA]">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E4EEF3] flex items-center justify-center">
            <Bell className="w-7 h-7 text-[#6F8A92]" />
          </div>

          <h3 className="text-base font-bold text-[#173885]">
            No Notifications
          </h3>

          <p className="text-xs text-[#606460] max-w-md mx-auto">
            You have no notifications in this category at this time. New
            operational alerts will appear here automatically.
          </p>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-xl border border-[#D9E2EA] text-xs font-bold text-[#173885] hover:bg-[#E4EEF3] disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      ) : (
        /* ===================================================
           NOTIFICATIONS LIST
        ==================================================== */
        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`gm-panel p-4 sm:p-5 rounded-2xl transition flex items-start gap-3.5 border ${
                !notif.isRead
                  ? "border-[#3C7DDA] bg-[#E4EEF3]/40 shadow-xs"
                  : "border-[#D9E2EA] hover:border-[#9AAED4]"
              }`}
            >
              {/* ICON */}
              <div className="p-2.5 rounded-xl bg-[#FEFEFE] border border-[#D9E2EA] shrink-0 mt-0.5">
                {getCategoryIcon(notif.category)}
              </div>

              {/* CONTENT */}
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-[#282926] flex items-center gap-2">
                    <span>{notif.title || "Notification"}</span>

                    {!notif.isRead && (
                      <span
                        className="w-2 h-2 rounded-full bg-[#3C7DDA] shrink-0"
                        title="Unread"
                      />
                    )}
                  </h4>

                  <span className="text-[10px] text-[#6F8A92] flex items-center gap-1 font-mono shrink-0">
                    <Clock className="w-3 h-3" />

                    {formatNotificationDate(notif.createdAt)}
                  </span>
                </div>

                <p className="text-xs text-[#606460] leading-relaxed">
                  {notif.message}
                </p>

                {/* ACTIONS */}
                <div className="flex items-center justify-between pt-2">
                  {notif.link ? (
                    <Link
                      to={notif.link}
                      onClick={() => {
                        if (!notif.isRead) {
                          handleMarkAsRead(notif.id);
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

                  {!notif.isRead && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(notif.id)}
                      disabled={actionLoading}
                      className="text-[10px] text-[#6F8A92] hover:text-[#282926] font-semibold disabled:opacity-50"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorNotifications;
