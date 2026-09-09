import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { AccountNav } from "./AccountNav";
import {
  orderRepository,
  ORDER_LIFECYCLE_STATUS,
  PAYMENT_STATUS,
} from "../../services/orderRepository";
import { OrderStatusTimeline } from "./OrderStatusTimeline";
import { useAuth } from "../../context/AuthContext";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  Truck,
  FileText,
  Ban,
} from "lucide-react";

export const OrderDetails = () => {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && user) {
      setLoading(true);
      orderRepository
        .getOrderById(user.id, id)
        .then(setOrder)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [id, user, authLoading]);

  if (!authLoading && !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-white">
          Authentication Required
        </h2>
        <p className="text-xs text-slate-400">
          You must be logged in to inspect order records.
        </p>
        <Link
          to="/account/orders"
          className="gold-gradient-btn inline-block px-5 py-2.5 rounded-xl text-xs font-bold"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-6 w-36 bg-white/10 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 h-44 bg-white/10 rounded-3xl animate-pulse" />
          <div className="md:col-span-3 h-96 bg-white/10 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-2xl font-black text-white">
          Order Record Not Found
        </h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          {error || "Order does not exist."}
        </p>
        <Link
          to="/account/orders"
          className="gold-gradient-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Orders</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Navigation Breadcrumb */}
      <Link
        to="/account/orders"
        className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Order History</span>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        <div className="md:col-span-1">
          <AccountNav />
        </div>

        <div className="md:col-span-3 space-y-6">
          {/* Main Order Card */}
          <div className="premium-panel p-6 sm:p-8 rounded-3xl space-y-6 border border-white/10">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Order Reference
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-0.5">
                  {order.id}
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Placed on {new Date(order.createdAt).toLocaleString("en-IN")}
                </p>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Fulfillment Status
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {order.orderStatus.replace(/_/g, " ")}
                </span>
              </div>
            </div>

            {/* 1. Fulfillment Journey Timeline */}
            <div className="premium-card p-5 rounded-2xl bg-[#091526]">
              <OrderStatusTimeline
                currentStatus={order.orderStatus}
                isExpress30Min={order.isExpress30Min}
              />
            </div>

            {/* 2. Itemized Product Breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Ordered Products
              </h3>
              <div className="space-y-2.5">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="premium-card p-4 rounded-2xl flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-xl bg-black shrink-0"
                      />
                      <div>
                        <span className="text-[10px] font-bold text-amber-400 uppercase">
                          {item.brand || "Handcrafted"}
                        </span>
                        <h4 className="text-xs font-bold text-white">
                          {item.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          SKU: {item.sku || "GM-SKU-001"}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-white">
                        Qty: {item.quantity}
                      </div>
                      <div className="text-amber-400 font-black font-mono text-sm">
                        ₹{item.price * item.quantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Delivery & Payment Destination Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="premium-card p-4 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <MapPin className="w-4 h-4" />
                  <span>Delivery Destination</span>
                </div>
                <p className="text-white font-semibold">
                  {order.shippingAddress?.fullName} (
                  {order.shippingAddress?.phone})
                </p>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {order.shippingAddress?.line1},{" "}
                  {order.shippingAddress?.locality},{" "}
                  {order.shippingAddress?.city} -{" "}
                  {order.shippingAddress?.pincode}
                </p>
                {order.isExpress30Min && (
                  <div className="text-amber-400 font-bold text-[10px] pt-1">
                    ⚡ Estimated SLA: {order.estimatedDeliveryTime}
                  </div>
                )}
              </div>

              <div className="premium-card p-4 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CreditCard className="w-4 h-4" />
                  <span>Payment Reconciliation</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Method:</span>
                  <span className="text-white font-semibold">
                    {order.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Transaction Status:</span>
                  <span className="font-bold text-amber-400 font-mono">
                    {order.paymentStatus}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Authoritative server transaction record</span>
                </div>
              </div>
            </div>

            {/* 4. Authoritative Total Breakdown */}
            <div className="premium-panel p-5 rounded-2xl space-y-2 text-xs border border-white/10">
              <h3 className="font-bold text-slate-300 uppercase tracking-wider mb-2">
                Billing Breakdown
              </h3>
              <div className="flex justify-between text-slate-300">
                <span>Items Subtotal</span>
                <span className="font-mono text-white font-bold">
                  ₹{order.totals?.itemSubtotal}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Delivery Charges</span>
                <span className="text-emerald-400 font-bold">
                  {order.totals?.deliveryFee === 0
                    ? "FREE"
                    : `₹${order.totals?.deliveryFee}`}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Honeycomb Box & Platform Fee</span>
                <span className="font-mono text-white">
                  ₹{order.totals?.packagingFee}
                </span>
              </div>
              {order.totals?.codConvenienceFee > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Pay on Delivery Handling Fee</span>
                  <span className="font-mono text-amber-400">
                    +₹{order.totals?.codConvenienceFee}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-white/10">
                <span>Authoritative Grand Total</span>
                <span className="font-mono text-amber-400 text-lg">
                  ₹{order.totals?.grandTotal}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
