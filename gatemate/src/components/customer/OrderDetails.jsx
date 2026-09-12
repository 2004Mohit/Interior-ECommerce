import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { AccountNav } from "./AccountNav";
import {
  orderRepository,
  ORDER_STATUS_TIMELINE_STEPS,
} from "../../services/orderRepository";
import { useAuth } from "../../context/AuthContext";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Zap,
  AlertCircle,
  Lock,
} from "lucide-react";
import { AuthModal } from "../AuthModal";

export const OrderDetails = () => {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const fetchOrderDetail = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await orderRepository.getOrderById(user.id, id);
      setOrder(data);
    } catch (err) {
      setError(err.message || "Unable to locate order details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchOrderDetail();
    }
  }, [id, user, authLoading]);

  if (!authLoading && !user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div className="gm-panel p-12 rounded-3xl text-center space-y-4 max-w-md mx-auto">
          <Lock className="w-10 h-10 text-[#173885] mx-auto" />
          <h2 className="text-lg font-bold text-[#173885]">
            Sign In to View Order
          </h2>
          <p className="text-xs text-[#606460]">
            Authentication is required to track site deliveries.
          </p>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="btn-gm-primary px-6 py-3 rounded-xl text-xs font-bold"
          >
            Sign In
          </button>
        </div>
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => {
            setAuthModalOpen(false);
            fetchOrderDetail();
          }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="gm-panel p-8 rounded-3xl h-64 animate-pulse bg-[#E4EEF3]" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/20 text-[#B43D20] flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-[#173885]">Order Not Found</h2>
        <p className="text-xs text-[#606460] max-w-md mx-auto">
          {error || "Order does not exist."}
        </p>
        <Link
          to="/account/orders"
          className="btn-gm-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4 text-[#FEFEFE]" />
          <span>Return to Order History</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <Link
              to="/account/orders"
              className="p-2 rounded-xl bg-[#FEFEFE] text-[#606460] hover:text-[#282926] border border-[#D9E2EA] transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#173885]">
                  Order {order.id}
                </h1>
                {order.isExpress30Min && (
                  <span className="bg-[#3C7DDA] text-[#FEFEFE] text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-current" />
                    30-MIN PRIORITY
                  </span>
                )}
              </div>
              <p className="text-xs text-[#606460] mt-0.5">
                Placed on{" "}
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>

        <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#E4EEF3] text-[#173885] border border-[#9AAED4]/40 self-start sm:self-auto">
          Status: {order.orderStatus.replace(/_/g, " ")}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        <div className="md:col-span-1">
          <AccountNav />
        </div>

        <div className="md:col-span-3 space-y-6">
          {/* Timeline */}
          <div className="gm-panel p-6 rounded-3xl space-y-4 border border-[#D9E2EA]">
            <h3 className="text-sm font-bold text-[#173885] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#3C7DDA]" />
              <span>Live Site Dispatch Timeline</span>
            </h3>

            <div className="space-y-4 pt-2">
              {ORDER_STATUS_TIMELINE_STEPS.map((step, idx) => {
                const isDelivered = order.orderStatus === "DELIVERED";
                const isPassed = isDelivered || idx <= 4;
                return (
                  <div
                    key={step.key}
                    className="flex items-start gap-3 relative"
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        isPassed
                          ? "bg-[#173885] text-[#FEFEFE]"
                          : "bg-[#D9E2EA] text-[#606460]"
                      }`}
                    >
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <div>
                      <h4
                        className={`text-xs font-bold ${isPassed ? "text-[#282926]" : "text-[#606460]"}`}
                      >
                        {step.label}
                      </h4>
                      <p className="text-[11px] text-[#606460]">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Items & Shipping Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Products in this Order */}
            <div className="gm-panel p-6 rounded-3xl space-y-3 border border-[#D9E2EA]">
              <h3 className="text-xs font-bold text-[#173885] uppercase tracking-wider">
                Ordered Products
              </h3>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img
                      src={item.img}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover bg-[#F4F6FA] shrink-0 border border-[#D9E2EA]"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#282926] truncate">
                        {item.name}
                      </h4>
                      <span className="text-[11px] text-[#606460] font-mono">
                        Qty: {item.quantity} × ₹{item.price}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Site Address & Payment Info */}
            <div className="gm-panel p-6 rounded-3xl space-y-3 border border-[#D9E2EA] text-xs">
              <h3 className="text-xs font-bold text-[#173885] uppercase tracking-wider">
                Site Delivery Destination
              </h3>
              <p className="text-[#282926] font-bold">
                {order.shippingAddress?.fullName} (
                {order.shippingAddress?.phone})
              </p>
              <p className="text-[#606460] leading-relaxed">
                {order.shippingAddress?.line1},{" "}
                {order.shippingAddress?.locality}, {order.shippingAddress?.city}{" "}
                -{" "}
                <span className="font-mono font-bold text-[#173885]">
                  {order.shippingAddress?.pincode}
                </span>
              </p>

              <div className="pt-3 border-t border-[#D9E2EA] space-y-1">
                <span className="text-[#606460]">Payment: </span>
                <strong className="text-[#282926]">
                  {order.paymentMethod}
                </strong>
                <div className="text-[#173885] font-black text-sm font-mono mt-1">
                  Total: ₹{order.totals?.grandTotal}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
