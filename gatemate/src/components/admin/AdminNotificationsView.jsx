import React, { useState, useEffect } from "react";
import {
  Bell,
  Send,
  RotateCcw,
  Building2,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  X,
} from "lucide-react";
import { adminContentService } from "../../services/adminContentService";
import { AdminPermissionGuard } from "./AdminPermissionGuard";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";
import { SeoHead } from "../common/SeoHead";

export const AdminNotificationsView = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Broadcast Modal State
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [recipientType, setRecipientType] = useState("ALL_VENDORS");
  const [category, setCategory] = useState("SYSTEM");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data =
        await adminContentService.getOperationalNotificationsLedger();
      setNotifications(data);
    } catch (err) {
      setError(err.message || "Failed to load notifications ledger.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError("Title and message are strictly required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await adminContentService.broadcastNotification({
        recipientType,
        category,
        title,
        message,
        link,
      });

      setActionSuccess(
        `Operational notification dispatched to ${res.deliveredCount} recipients.`,
      );
      setIsBroadcastModalOpen(false);
      setTitle("");
      setMessage("");
      setLink("");
      loadData();
    } catch (err) {
      setError(err.message || "Failed to broadcast notification.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.MANAGE_CONTENT}>
      <div className="space-y-6 pb-20 font-sans">
        <SeoHead
          title="Operational Notifications Center | GateMate Admin"
          description="Dispatch and audit operational notifications across vendor depots, contractor buyers, order updates, and settlement alerts."
          canonicalUrl="/admin/notifications"
          noIndex={true}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
          <div>
            <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Real-Time Messaging Center
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
              Operational Notifications
            </h1>
            <p className="text-xs text-[#606460]">
              Dispatch operational announcements and audit automated lifecycle
              alerts across vendor depots and contractor accounts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBroadcastModalOpen(true)}
              className="btn-gm-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Send className="w-4 h-4 text-[#FEFEFE]" />
              <span>Broadcast Announcement</span>
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <RotateCcw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Notifications Stream */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-[#FEFEFE] rounded-2xl border border-[#D9E2EA]"
              />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="gm-panel p-12 rounded-3xl border border-[#D9E2EA] text-center space-y-2 bg-[#FEFEFE]">
            <Bell className="w-10 h-10 text-[#6F8A92] mx-auto" />
            <h2 className="text-base font-bold text-[#173885]">
              No Notifications Recorded
            </h2>
            <p className="text-xs text-[#606460]">
              Dispatched notifications will appear in this real-time stream.
            </p>
          </div>
        ) : (
          <div className="gm-panel rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-[#D9E2EA] flex items-center justify-between">
              <span className="text-xs font-bold text-[#173885]">
                Recent Operational Alerts Ledger
              </span>
              <span className="text-xs font-mono text-[#6F8A92]">
                {notifications.length} Entries
              </span>
            </div>

            <div className="divide-y divide-[#D9E2EA]">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-4 hover:bg-[#F4F6FA]/50 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          n.targetType === "VENDOR"
                            ? "bg-[#E4EEF3] text-[#3C7DDA]"
                            : "bg-[#E1F2D9] text-[#3F7D20]"
                        }`}
                      >
                        {n.targetType}
                      </span>
                      <span className="font-bold text-[#173885]">
                        {n.title}
                      </span>
                      <span className="text-[10px] text-[#6F8A92]">
                        Recipient: {n.targetLabel}
                      </span>
                    </div>
                    <p className="text-[#606460]">{n.message}</p>
                  </div>

                  <div className="font-mono text-[11px] text-[#6F8A92] shrink-0 self-end md:self-auto">
                    {new Date(n.created_at).toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Broadcast Modal */}
        {isBroadcastModalOpen && (
          <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-md p-6 sm:p-8 rounded-3xl relative shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-[#D9E2EA] pb-3">
                <h3 className="text-lg font-black text-[#173885]">
                  Broadcast Announcement
                </h3>
                <button
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="text-[#606460] hover:text-[#282926]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleBroadcastSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Target Audience *
                  </label>
                  <select
                    value={recipientType}
                    onChange={(e) => setRecipientType(e.target.value)}
                    className="w-full gm-input px-3 py-2 rounded-xl text-xs font-bold"
                  >
                    <option value="ALL_VENDORS">
                      All Verified Vendors (Pune & PCMC)
                    </option>
                    <option value="ALL_CUSTOMERS">
                      All Contractor Customer Accounts
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Notification Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pune Regional Logistics Weather Advisory"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Message Body *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter message text delivered to the notification drawer..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full gm-input p-3 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Action Link (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="/vendor/orders or /account/orders"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="w-full gm-input px-3.5 py-2 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#D9E2EA]">
                  <button
                    type="button"
                    onClick={() => setIsBroadcastModalOpen(false)}
                    disabled={submitting}
                    className="btn-gm-secondary px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-gm-primary px-5 py-2 rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
                  >
                    <span>
                      {submitting ? "Dispatching..." : "Dispatch Notification"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminPermissionGuard>
  );
};
