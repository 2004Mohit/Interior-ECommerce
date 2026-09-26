import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  ShoppingCart,
  Star,
  AlertCircle,
  Ban,
  X,
  MessageSquare,
  CheckCircle2,
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

  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadCustomer = async () => {
    if (!id) {
      setError("Customer ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await adminCustomerService.getCustomerDetails(id);

      if (!result) {
        throw new Error("Customer profile could not be found.");
      }

      setData(result);
    } catch (err) {
      console.error("Failed to load customer details:", err);

      setData(null);
      setError(err?.message || "Failed to load customer profile details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomer();
  }, [id]);

  const handleToggleSuspension = async (event) => {
    event.preventDefault();

    if (!data?.profile) {
      return;
    }

    const cleanReason = suspendReason.trim();

    if (!cleanReason) {
      setError("A reason is required to modify the customer account status.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setActionSuccess(null);

    try {
      const nextSuspendState = !Boolean(data.profile.isSuspended);

      await adminCustomerService.toggleSuspension(
        id,
        nextSuspendState,
        cleanReason,
      );

      setActionSuccess(
        `Customer account ${
          nextSuspendState ? "suspended" : "reactivated"
        } successfully.`,
      );

      setIsSuspendModalOpen(false);
      setSuspendReason("");

      await loadCustomer();
    } catch (err) {
      console.error("Customer suspension action failed:", err);

      setError(err?.message || "Failed to update customer account status.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    })}`;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-10 space-y-4 animate-pulse font-sans">
        <div className="h-6 bg-[#E4EEF3] rounded w-1/4" />

        <div className="h-64 bg-[#FEFEFE] rounded-3xl border border-[#D9E2EA]" />

        <div className="h-40 bg-[#FEFEFE] rounded-3xl border border-[#D9E2EA]" />
      </div>
    );
  }

  if (!data || !data.profile) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4 font-sans">
        <AlertCircle className="w-12 h-12 text-[#B43D20] mx-auto" />

        <div>
          <h2 className="text-lg font-bold text-[#173885]">
            Customer Not Found
          </h2>

          <p className="text-xs text-[#606460] mt-1">
            The customer profile could not be loaded.
          </p>

          {error && <p className="text-xs text-[#B43D20] mt-2">{error}</p>}
        </div>

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

  const {
    profile,
    orders = [],
    rfqs = [],
    reviews = [],
    complaints = [],
    notifications = [],
  } = data;

  const addresses = Array.isArray(profile.addresses) ? profile.addresses : [];

  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.MANAGE_CUSTOMERS}>
      <div className="max-w-5xl mx-auto space-y-6 pb-24 font-sans">
        <SeoHead
          title={`Customer 360: ${
            profile.fullName || "Customer"
          } | Ferrado Admin`}
          description="360 view of customer identity, contact information, delivery addresses, orders, reviews, complaints, and account status."
          canonicalUrl={`/admin/customers/${profile.id}`}
          noIndex={true}
        />

        {/* Header */}
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
                  {profile.fullName || "Customer"}
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
            onClick={() => {
              setError(null);
              setActionSuccess(null);
              setSuspendReason("");
              setIsSuspendModalOpen(true);
            }}
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

        {/* Success */}
        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Customer Credentials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-3">
            <div className="flex items-center gap-2 text-[#173885] font-bold border-b border-[#D9E2EA] pb-2">
              <User className="w-4 h-4 text-[#3C7DDA]" />
              <span>Buyer Credentials & Identity</span>
            </div>

            <div className="space-y-2 text-[#606460]">
              <div>
                <strong className="text-[#282926]">Full Name:</strong>{" "}
                {profile.fullName || "—"}
              </div>

              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#6F8A92]" />

                <strong className="text-[#282926]">Email:</strong>

                <span>{profile.email || "—"}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#6F8A92]" />

                <strong className="text-[#282926]">Phone:</strong>

                {profile.phone ? (
                  <a
                    href={`tel:${profile.phone}`}
                    className="font-mono font-bold text-[#173885] hover:underline"
                  >
                    {profile.phone}
                  </a>
                ) : (
                  <span className="font-mono">—</span>
                )}
              </div>

              <div>
                <strong className="text-[#282926]">Registered:</strong>{" "}
                {profile.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString("en-IN")
                  : "—"}
              </div>

              <div>
                <strong className="text-[#282926]">Last Sign In:</strong>{" "}
                {profile.lastSignInAt
                  ? new Date(profile.lastSignInAt).toLocaleString("en-IN")
                  : "N/A"}
              </div>
            </div>
          </div>

          {/* Addresses */}
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
                {addresses.map((address, index) => (
                  <div
                    key={address.id || index}
                    className="p-2.5 rounded-xl bg-[#F4F6FA] border border-[#D9E2EA] text-[#606460]"
                  >
                    <span className="font-bold text-[#282926] block">
                      {address.title ||
                        address.fullName ||
                        `Site #${index + 1}`}
                    </span>

                    <span>
                      {address.addressLine1 ||
                        address.address ||
                        "Address unavailable"}
                      {address.locality ? `, ${address.locality}` : ""}
                      {address.pincode ? ` - ${address.pincode}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Orders */}
        <div className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#173885]">
              <ShoppingCart className="w-4 h-4 text-[#3C7DDA]" />

              <span>Orders History ({orders.length})</span>
            </div>
          </div>

          {orders.length === 0 ? (
            <p className="text-xs text-[#606460] py-4 text-center">
              No orders placed by this customer yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-3.5 rounded-2xl border border-[#D9E2EA] bg-[#F4F6FA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="font-mono font-bold text-[#173885] hover:underline block"
                    >
                      Order #{order.id}
                    </Link>

                    <span className="text-[10px] text-[#6F8A92] font-mono">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleString("en-IN")
                        : "—"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono font-bold text-[#282926]">
                      {formatCurrency(order.grand_total)}
                    </span>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#E4EEF3] text-[#173885]">
                      {order.status || "UNKNOWN"}
                    </span>

                    <Link
                      to={`/admin/orders/${order.id}`}
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

        {/* Reviews */}
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
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-3.5 rounded-2xl border border-[#D9E2EA] bg-[#F4F6FA] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="font-bold text-[#173885]">
                      {review.productName || "Construction Product"}
                    </span>

                    <div className="font-bold text-[#A66A08]">
                      Customer Product Rating:{" "}
                      {review.customerProductRating ?? "—"} / 5
                    </div>
                  </div>

                  <p className="text-[#606460] italic">
                    "{review.customerProductReview || "No text review provided"}
                    "
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Complaints */}
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
              {complaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="p-3.5 rounded-2xl border border-[#D9E2EA] bg-[#F4F6FA] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-[#282926]">
                      {complaint.subject}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        complaint.status === "RESOLVED"
                          ? "bg-[#E1F2D9] text-[#3F7D20]"
                          : complaint.status === "REJECTED"
                            ? "bg-[#FBE3DE] text-[#B43D20]"
                            : "bg-[#FFF0D5] text-[#A66A08]"
                      }`}
                    >
                      {complaint.status}
                    </span>
                  </div>

                  <p className="text-[#606460]">{complaint.description}</p>
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
                  type="button"
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
                    onChange={(event) => setSuspendReason(event.target.value)}
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
                    {submitting ? "Applying..." : "Confirm Status Change"}
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

export default AdminCustomerDetailView;
