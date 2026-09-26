import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Zap,
  ShoppingCart,
  FileText,
  ShieldCheck,
  AlertCircle,
  Banknote,
  Clock,
  RotateCcw,
  ExternalLink,
  Sparkles,
  Info,
  Check,
  Layers,
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
  const [activeCategory, setActiveCategory] = useState(
    VENDOR_NOTIFICATION_CATEGORIES.ALL,
  );

  const loadNotifications = async () => {
    if (!vendorUser?.id) return;
    setLoading(true);
    const data = await vendorNotificationService.getNotifications();
    setNotifications(data);
    setLoading(false);
  };

  useEffect(() => {
    if (vendorUser?.id) {
      loadNotifications();
    } else {
      setLoading(false);
    }
  }, [vendorUser?.id]);

  const handleMarkAsRead = async (id) => {
    const updated = await vendorNotificationService.markAsRead(id);
    setNotifications(updated);
  };

  const handleMarkAllAsRead = async () => {
    const updated = await vendorNotificationService.markAllAsRead();
    setNotifications(updated);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeCategory === VENDOR_NOTIFICATION_CATEGORIES.ALL) return true;
    return n.category === activeCategory;
  });

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
      default:
        return <Info className="w-4 h-4 text-[#173885]" />;
    }
  };

  const categoryTabs = [
    { key: VENDOR_NOTIFICATION_CATEGORIES.ALL, label: "All Alerts" },
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
      label: "Depot Verification",
    },
    {
      key: VENDOR_NOTIFICATION_CATEGORIES.PLATFORM_NOTICES,
      label: "Platform Notices",
    },
  ];

  return (
    <div className="space-y-6 pb-24 font-sans">
      <SeoHead
        title="Vendor Notifications & Dispatch Alerts | Ferrado"
        description="Real-time alerts on new site orders, commercial project RFQ bids, product moderation updates, and bank settlements."
        canonicalUrl="/vendor/notifications"
        noIndex={true}
      />

      {/* Header */}
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
              onClick={handleMarkAllAsRead}
              className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All as Read</span>
            </button>
          )}

          <button
            onClick={loadNotifications}
            className="btn-gm-secondary p-2 rounded-xl text-[#606460] hover:text-[#173885]"
            title="Refresh notifications"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-[#D9E2EA] scrollbar-none">
        {categoryTabs.map((tab) => {
          const isSelected = activeCategory === tab.key;
          const count =
            tab.key === VENDOR_NOTIFICATION_CATEGORIES.ALL
              ? notifications.length
              : notifications.filter((n) => n.category === tab.key).length;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveCategory(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
                isSelected
                  ? "bg-[#173885] text-[#FEFEFE] shadow-xs"
                  : "bg-[#FEFEFE] text-[#606460] border border-[#D9E2EA] hover:bg-[#E4EEF3]"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected
                    ? "bg-[#3C7DDA] text-[#FEFEFE]"
                    : "bg-[#E4EEF3] text-[#173885]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="gm-panel p-5 rounded-2xl h-24 animate-pulse bg-[#E4EEF3]"
            />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="gm-panel p-16 rounded-3xl text-center space-y-3 border border-[#D9E2EA]">
          <Bell className="w-12 h-12 text-[#6F8A92] mx-auto" />
          <h3 className="text-base font-bold text-[#173885]">
            No Notifications
          </h3>
          <p className="text-xs text-[#606460]">
            You have no notifications in this category at this time.
          </p>
        </div>
      ) : (
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
              <div className="p-2.5 rounded-xl bg-[#FEFEFE] border border-[#D9E2EA] shrink-0 mt-0.5">
                {getCategoryIcon(notif.category)}
              </div>

              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-[#282926] flex items-center gap-2">
                    <span>{notif.title}</span>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#3C7DDA] shrink-0" />
                    )}
                  </h4>
                  <span className="text-[10px] text-[#6F8A92] flex items-center gap-1 font-mono shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(notif.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
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
                      className="text-[10px] text-[#6F8A92] hover:text-[#282926] font-semibold"
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
