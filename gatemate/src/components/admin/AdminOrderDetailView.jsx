import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingCart,
  Truck,
  User,
  Building2,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Package,
  DollarSign,
  X,
  ShieldAlert,
  FileText,
} from "lucide-react";
import { adminOrderService } from "../../services/adminOrderService";
import { AdminPermissionGuard } from "./AdminPermissionGuard";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";
import { SeoHead } from "../common/SeoHead";

export const AdminOrderDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Intervention Modal State
  const [isInterveneModalOpen, setIsInterveneModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [isDelayed, setIsDelayed] = useState(false);
  const [delayReason, setDelayReason] = useState("");
  const [exceptionType, setExceptionType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminOrderService.getOrderDetail(id);
      setOrderData(data);
      setNewStatus(data.order.status);
      setIsDelayed(Boolean(data.order.is_delayed));
      setDelayReason(data.order.delay_reason || "");
      setExceptionType(data.order.delivery_exception_type || "");
    } catch (err) {
      setError(err.message || "Failed to load order details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handleInterventionSubmit = async (e) => {
    e.preventDefault();
    if (!adminNotes.trim()) {
      setError(
        "Administrative justification notes are required for any order intervention.",
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await adminOrderService.updateOrderStatus({
        orderId: id,
        newStatus,
        adminNotes,
        isDelayed,
        delayReason,
        deliveryExceptionType: exceptionType,
      });

      setActionSuccess(
        `Order #${id} status successfully updated to ${newStatus}.`,
      );
      setIsInterveneModalOpen(false);
      setAdminNotes("");
      loadOrder();
    } catch (err) {
      setError(err.message || "Failed to apply order status override.");
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

  if (!orderData) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-3 font-sans">
        <AlertTriangle className="w-12 h-12 text-[#B43D20] mx-auto" />
        <h2 className="text-lg font-bold text-[#173885]">
          Order #{id} Not Found
        </h2>
        <Link
          to="/admin/orders"
          className="btn-gm-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4 text-[#FEFEFE]" />
          <span>Back to Orders List</span>
        </Link>
      </div>
    );
  }

  const { order, items, timeline } = orderData;
  const shipping = order.shipping_address || {};
  const vendor = order.vendor || {};

  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.MANAGE_ORDERS}>
      <div className="max-w-5xl mx-auto space-y-6 pb-24 font-sans">
        <SeoHead
          title={`Order #${order.id} Oversight | Ferrado Admin`}
          description="Detailed order inspection, contractor destination, vendor yard dispatch, materials breakdown, and timeline history."
          canonicalUrl={`/admin/orders/${order.id}`}
          noIndex={true}
        />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/orders"
              className="p-2 rounded-xl bg-[#FEFEFE] border border-[#D9E2EA] text-[#606460] hover:text-[#173885] hover:bg-[#E4EEF3] transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-[#173885]">
                  Order #{order.id}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#E4EEF3] text-[#173885] border border-[#3C7DDA]/30">
                  {order.status}
                </span>
                {order.is_express_30min && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30 flex items-center gap-1">
                    <Truck className="w-3 h-3" /> 30-Min SLA
                  </span>
                )}
              </div>
              <span className="text-xs text-[#606460]">
                Placed: {new Date(order.created_at).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsInterveneModalOpen(true)}
            className="btn-gm-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
          >
            <ShieldAlert className="w-4 h-4 text-[#FEFEFE]" />
            <span>Intervene / Update Status</span>
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
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Customer & Vendor Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Customer / Project Destination */}
          <div className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-2.5">
            <div className="flex items-center gap-2 text-[#173885] font-bold border-b border-[#D9E2EA] pb-2">
              <User className="w-4 h-4 text-[#3C7DDA]" />
              <span>Customer & Project Destination</span>
            </div>
            <div className="space-y-1 text-[#606460]">
              <div>
                <strong className="text-[#282926]">Contractor:</strong>{" "}
                {shipping.fullName || "Site Customer"}
              </div>
              <div>
                <strong className="text-[#282926]">Site Contact:</strong>{" "}
                <span className="font-mono font-bold text-[#173885]">
                  {shipping.phone || "—"}
                </span>
              </div>
              <div>
                <strong className="text-[#282926]">Address:</strong>{" "}
                {shipping.addressLine1 ||
                  shipping.depotAddressLine1 ||
                  "Pune Industrial Layout"}
              </div>
              <div>
                <strong className="text-[#282926]">Locality:</strong>{" "}
                {shipping.locality || "Hadapsar"}, {shipping.city || "Pune"} -{" "}
                {shipping.pincode || "411028"}
              </div>
            </div>
          </div>

          {/* Fulfilling Vendor Depot */}
          <div className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-2.5">
            <div className="flex items-center gap-2 text-[#173885] font-bold border-b border-[#D9E2EA] pb-2">
              <Building2 className="w-4 h-4 text-[#3C7DDA]" />
              <span>Fulfilling Vendor Depot</span>
            </div>
            <div className="space-y-1 text-[#606460]">
              <div>
                <strong className="text-[#282926]">Vendor Name:</strong>{" "}
                {vendor.business_name || "Vendor Depot"}
              </div>
              <div>
                <strong className="text-[#282926]">Yard Phone:</strong>{" "}
                <span className="font-mono">{vendor.phone || "—"}</span>
              </div>
              <div>
                <strong className="text-[#282926]">Yard Location:</strong>{" "}
                {vendor.locality || "Pune"}, {vendor.city || "MH"}
              </div>
              <div>
                <strong className="text-[#282926]">Official Email:</strong>{" "}
                {vendor.email || "—"}
              </div>
            </div>
          </div>

          {/* Payment & Financial Ledger */}
          <div className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-2.5">
            <div className="flex items-center gap-2 text-[#173885] font-bold border-b border-[#D9E2EA] pb-2">
              <CreditCard className="w-4 h-4 text-[#3C7DDA]" />
              <span>Payment & Totals</span>
            </div>
            <div className="space-y-1 text-[#606460]">
              <div>
                <strong className="text-[#282926]">Payment Status:</strong>{" "}
                <span className="font-bold text-[#173885]">
                  {order.payment_status}
                </span>
              </div>
              <div>
                <strong className="text-[#282926]">Payment Gateway:</strong>{" "}
                {order.payment_method || "Online Razorpay"}
              </div>
              <div>
                <strong className="text-[#282926]">Products Subtotal:</strong>{" "}
                <span className="font-mono">
                  {formatCurrency(order.item_subtotal)}
                </span>
              </div>
              <div>
                <strong className="text-[#282926]">GST & Taxes:</strong>{" "}
                <span className="font-mono">
                  {formatCurrency(order.tax_total)}
                </span>
              </div>
              <div>
                <strong className="text-[#282926]">Delivery Fee:</strong>{" "}
                <span className="font-mono">
                  {formatCurrency(order.delivery_fee)}
                </span>
              </div>
              <div className="border-t border-[#D9E2EA] pt-1 mt-1 text-sm font-black text-[#173885]">
                Grand Total:{" "}
                <span className="font-mono">
                  {formatCurrency(order.grand_total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Order Line Items Table */}
        <div className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-[#D9E2EA] pb-3 text-xs font-bold text-[#173885]">
            <Package className="w-4 h-4 text-[#3C7DDA]" />
            <span>Ordered Construction Products ({items.length} Items)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F6FA] text-[10px] font-bold uppercase text-[#6F8A92]">
                <tr>
                  <th className="p-3">Product Name & Specifications</th>
                  <th className="p-3">Unit Price</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E2EA]">
                {items.map((it) => (
                  <tr key={it.id}>
                    <td className="p-3">
                      <span className="font-bold text-[#173885] block">
                        {it.product_name}
                      </span>
                      {it.selected_variant && (
                        <span className="text-[11px] text-[#606460] block">
                          {JSON.stringify(it.selected_variant)}
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono">
                      {formatCurrency(it.unit_price)}
                    </td>
                    <td className="p-3 font-mono font-bold">
                      {it.quantity} {it.unit || "Units"}
                    </td>
                    <td className="p-3 font-mono font-bold text-right text-[#173885]">
                      {formatCurrency(it.total_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Order Milestone Timeline */}
        <div className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-[#D9E2EA] pb-3 text-xs font-bold text-[#173885]">
            <Clock className="w-4 h-4 text-[#3C7DDA]" />
            <span>Order History & Dispatch Milestones</span>
          </div>

          {timeline.length === 0 ? (
            <p className="text-xs text-[#606460]">
              No timeline milestones recorded.
            </p>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D9E2EA]">
              {timeline.map((event, idx) => (
                <div key={idx} className="relative text-xs">
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[#173885] border-2 border-[#FEFEFE]" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#173885]">
                        {event.status}
                      </span>
                      <span className="text-[10px] text-[#6F8A92] font-mono">
                        {new Date(event.created_at).toLocaleString("en-IN")}
                      </span>
                      {event.actor_type && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#E4EEF3] text-[#3C7DDA] font-bold">
                          {event.actor_type}
                        </span>
                      )}
                    </div>
                    <p className="text-[#606460]">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Administrative Status Override Modal */}
        {isInterveneModalOpen && (
          <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-lg p-6 sm:p-8 rounded-3xl relative shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-[#D9E2EA] pb-3">
                <h3 className="text-lg font-black text-[#173885]">
                  Admin Order Status Intervention
                </h3>
                <button
                  onClick={() => setIsInterveneModalOpen(false)}
                  className="text-[#606460] hover:text-[#282926]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleInterventionSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Target Order Status *
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full gm-input px-3 py-2 rounded-xl text-xs font-bold"
                  >
                    <option value="NEW">NEW</option>
                    <option value="ACCEPTED">ACCEPTED</option>
                    <option value="PREPARING">PREPARING</option>
                    <option value="READY_FOR_DISPATCH">
                      READY_FOR_DISPATCH
                    </option>
                    <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">
                      CANCELLED (Release Reserved Stock)
                    </option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-[#F4F6FA] space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#B43D20]">
                    <input
                      type="checkbox"
                      checked={isDelayed}
                      onChange={(e) => setIsDelayed(e.target.checked)}
                      className="rounded border-[#D9E2EA] text-[#B43D20]"
                    />
                    <span>Flag as Delivery Delay / SLA Exception</span>
                  </label>

                  {isDelayed && (
                    <div className="space-y-2 pt-2 border-t border-[#D9E2EA]">
                      <div>
                        <label className="text-[11px] font-bold text-[#282926] block mb-1">
                          Exception Category
                        </label>
                        <select
                          value={exceptionType}
                          onChange={(e) => setExceptionType(e.target.value)}
                          className="w-full gm-input px-2.5 py-1.5 rounded-lg text-xs"
                        >
                          <option value="">Select exception category...</option>
                          <option value="TRAFFIC_GRIDLOCK">
                            Transit Mixer / Heavy Trailer Traffic Delay
                          </option>
                          <option value="WEATHER_DISRUPTION">
                            Heavy Monsoon / Rain Inundation
                          </option>
                          <option value="SITE_ACCESS_BLOCKED">
                            Contractor Site Gates Blocked
                          </option>
                          <option value="MATERIAL_LOADING_DELAY">
                            Depot Crane / Forklift Loading Delay
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-[#282926] block mb-1">
                          Delay Explanation
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Concrete transit mixer rerouted due to Katraj tunnel repair..."
                          value={delayReason}
                          onChange={(e) => setDelayReason(e.target.value)}
                          className="w-full gm-input px-2.5 py-1.5 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Administrative Notes & Audit Reason *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide official notes recorded in timeline and platform audit log..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full gm-input p-3 rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsInterveneModalOpen(false)}
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
                      {submitting ? "Applying..." : "Apply Status Update"}
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
