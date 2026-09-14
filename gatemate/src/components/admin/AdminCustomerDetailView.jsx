import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  ShoppingCart,
  FileText,
  Star,
  AlertCircle,
  Bell,
  CheckCircle2,
  Ban,
  ShieldCheck,
  X,
  MessageSquare,
} from "lucide-react";
import { adminCustomerService } from "../../services/adminCustomerService";
import { AdminPermissionGuard } from "./AdminPermissionGuard";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";
import { SeoHead } from "../common/SeoHead";

export const AdminCustomerDetailView = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Suspension Modal
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadCustomer = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminCustomerService.getCustomerDetails(id);
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load customer profile details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomer();
  }, [id]);

  const handleToggleSuspension = async (e) => {
    e.preventDefault();
    if (!suspendReason.trim()) {
      setError("A reason is required to modify account suspension state.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const nextSuspendState = !data.profile.isSuspended;
      await adminCustomerService.toggleSuspension(
        id,
        nextSuspendState,
        suspendReason,
      );

      setActionSuccess(
        `Customer account ${nextSuspendState ? "suspended" : "reactivated"} successfully.`,
      );
      setIsSuspendModalOpen(false);
      setSuspendReason("");
      loadCustomer();
    } catch (err) {
      setError(err.message || "Action failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val) =>
    `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-10 space-y-4 animate-pulse font-sans">
        <div className="h-6 bg-[#E4EEF3] rounded w-1/4" />
        <div className="h-64 bg-[#FEFEFE] rounded-3xl border border-[#D9E2EA]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-3 font-sans">
        <AlertCircle className="w-12 h-12 text-[#B43D20] mx-auto" />
        <h2 className="text-lg font-bold text-[#173885]">Customer Not Found</h2>
        <Link
          to="/admin/customers"
          className="btn-gm-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4 text-[#FEFEFE]" />
          <span>Back to Customers</span>
        </Link>
      </div>
    );
  }

  const { profile, orders, rfqs, reviews, complaints, notifications } = data;
  const addresses = Array.isArray(profile.addresses) ? profile.addresses : [];

  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.MANAGE_CUSTOMERS}>
      <div className="max-w-5xl mx-auto space-y-6 pb-24 font-sans">
        <SeoHead
          title={`Customer 360: ${profile.fullName} | GateMate Admin`}
          description="360 view of contractor buyer identity, operational addresses, order history, RFQs, complaints, and product reviews."
          canonicalUrl={`/admin/customers/${profile.id}`}
          noIndex={true}
        />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/customers"
              className="p-2 rounded-xl bg-[#FEFEFE] border border-[#D9E2EA] text-[#606460] hover:text-[#173885] hover:bg-[#E4EEF3] transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-[#173885]">
                  {profile.fullName}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    profile.isSuspended
                      ? "bg-[#FBE3DE] text-[#B43D20]"
                      : "bg-[#E1F2D9] text-[#3F7D20]"
                  }`}
                >
                  {profile.isSuspended ? "SUSPENDED" : "ACTIVE BUYER"}
                </span>
              </div>
              <span className="text-xs text-[#606460]">
                Customer ID: {profile.id}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSuspendModalOpen(true)}
            className={`btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
              profile.isSuspended
                ? "text-[#3F7D20] hover:bg-[#E1F2D9]"
                : "text-[#B43D20] hover:bg-[#FBE3DE]"
            }`}
          >
            <Ban className="w-4 h-4" />
            <span>
              {profile.isSuspended ? "Reactivate Account" : "Suspend Customer"}
            </span>
          </button>
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

        {/* Section 1: Customer Profile & Operational Addresses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-2.5">
            <div className="flex items-center gap-2 text-[#173885] font-bold border-b border-[#D9E2EA] pb-2">
              <User className="w-4 h-4 text-[#3C7DDA]" />
              <span>Buyer Credentials & Identity</span>
            </div>
            <div className="space-y-1 text-[#606460]">
              <div>
                <strong className="text-[#282926]">Full Name:</strong>{" "}
                {profile.fullName}
              </div>
              <div>
                <strong className="text-[#282926]">Email:</strong>{" "}
                {profile.email || "—"}
              </div>
              <div>
                <strong className="text-[#282926]">Phone:</strong>{" "}
                <span className="font-mono font-bold text-[#173885]">
                  {profile.phone || "—"}
                </span>
              </div>
              <div>
                <strong className="text-[#282926]">Registered:</strong>{" "}
                {new Date(profile.createdAt).toLocaleDateString("en-IN")}
              </div>
              <div>
                <strong className="text-[#282926]">Last Sign In:</strong>{" "}
                {profile.lastSignInAt
                  ? new Date(profile.lastSignInAt).toLocaleString("en-IN")
                  : "N/A"}
              </div>
            </div>
          </div>

          <div className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-2.5">
            <div className="flex items-center gap-2 text-[#173885] font-bold border-b border-[#D9E2EA] pb-2">
              <MapPin className="w-4 h-4 text-[#3C7DDA]" />
              <span>
                Operational Site Delivery Addresses ({addresses.length})
              </span>
            </div>
            {addresses.length === 0 ? (
              <p className="text-[#606460] py-2">
                No saved contractor project addresses recorded.
              </p>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {addresses.map((addr, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#F4F6FA] border border-[#D9E2EA] text-[#606460]"
                  >
                    <span className="font-bold text-[#282926] block">
                      {addr.title || addr.fullName || `Site #${idx + 1}`}
                    </span>
                    <span>
                      {addr.addressLine1 || addr.address},{" "}
                      {addr.locality || "Pune"} - {addr.pincode}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Order History */}
        <div className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#173885]">
              <ShoppingCart className="w-4 h-4 text-[#3C7DDA]" />
              <span>Orders History ({orders.length})</span>
            </div>
          </div>

          {orders.length === 0 ? (
            <p className="text-xs text-[#606460] py-4 text-center">
              No orders placed by this contractor yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="p-3.5 rounded-2xl border border-[#D9E2EA] bg-[#F4F6FA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <Link
                      to={`/admin/orders/${o.id}`}
                      className="font-mono font-bold text-[#173885] hover:underline block"
                    >
                      Order #{o.id}
                    </Link>
                    <span className="text-[10px] text-[#6F8A92] font-mono">
                      {new Date(o.created_at).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-[#282926]">
                      {formatCurrency(o.grand_total)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#E4EEF3] text-[#173885]">
                      {o.status}
                    </span>
                    <Link
                      to={`/admin/orders/${o.id}`}
                      className="btn-gm-primary px-3 py-1 rounded-lg text-xs font-bold"
                    >
                      Inspect
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Customer Product Ratings & Reviews */}
        <div className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-[#D9E2EA] pb-3 text-xs font-bold text-[#173885]">
            <Star className="w-4 h-4 text-[#A66A08]" />
            <span>Customer Product Reviews ({reviews.length})</span>
          </div>

          {reviews.length === 0 ? (
            <p className="text-xs text-[#606460] py-4 text-center">
              No product reviews submitted by this customer.
            </p>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3.5 rounded-2xl border border-[#D9E2EA] bg-[#F4F6FA] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#173885]">
                      {rev.productName || "Construction Product"}
                    </span>
                    <div className="flex items-center gap-1 font-bold text-[#A66A08]">
                      <span>Customer Product Rating:</span>
                      <span>{rev.customerProductRating} / 5 ★</span>
                    </div>
                  </div>
                  <p className="text-[#606460] italic">
                    "{rev.customerProductReview || "No text review provided"}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Complaints & Support Tickets */}
        <div className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-[#D9E2EA] pb-3 text-xs font-bold text-[#173885]">
            <MessageSquare className="w-4 h-4 text-[#B43D20]" />
            <span>Customer Complaints & Inquiries ({complaints.length})</span>
          </div>

          {complaints.length === 0 ? (
            <p className="text-xs text-[#606460] py-4 text-center">
              No support complaints registered.
            </p>
          ) : (
            <div className="space-y-3">
              {complaints.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-2xl border border-[#D9E2EA] bg-[#F4F6FA] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#282926]">
                      {c.subject}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        c.status === "RESOLVED"
                          ? "bg-[#E1F2D9] text-[#3F7D20]"
                          : "bg-[#FFF0D5] text-[#A66A08]"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <p className="text-[#606460]">{c.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Suspend / Reactivate Modal */}
        {isSuspendModalOpen && (
          <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-md p-6 sm:p-8 rounded-3xl relative shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-[#D9E2EA] pb-3">
                <h3 className="text-lg font-black text-[#173885]">
                  {profile.isSuspended
                    ? "Reactivate Account"
                    : "Suspend Customer Account"}
                </h3>
                <button
                  onClick={() => setIsSuspendModalOpen(false)}
                  className="text-[#606460] hover:text-[#282926]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleToggleSuspension} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Administrative Justification *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter reason recorded in platform audit log..."
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    className="w-full gm-input p-3 rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSuspendModalOpen(false)}
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
                      {submitting ? "Applying..." : "Confirm Status Change"}
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
