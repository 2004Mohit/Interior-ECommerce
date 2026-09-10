import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AccountNav } from "./AccountNav";
import {
  orderRepository,
  ORDER_LIFECYCLE_STATUS,
  PAYMENT_STATUS,
} from "../../services/orderRepository";
import { useAuth } from "../../context/AuthContext";
import { AuthModal } from "../AuthModal";
import {
  Package,
  ChevronRight,
  Zap,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  Clock,
  CheckCircle2,
  Lock,
} from "lucide-react";

export const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const fetchOrders = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await orderRepository.getCustomerOrders(user.id);
      setOrders(data);
    } catch (err) {
      setError(err.message || "Unable to retrieve orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchOrders();
    }
  }, [user, authLoading]);

  // Guest view protection
  if (!authLoading && !user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <h1 className="text-2xl font-black text-white">Order History</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <AccountNav />
          </div>
          <div className="md:col-span-3">
            <div className="premium-panel p-12 rounded-3xl text-center space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-400/20">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Account Authentication Required
              </h3>
              <p className="text-xs text-slate-400">
                Guests cannot access personal orders. Please log in to view your
                order history and live tracking.
              </p>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="gold-gradient-btn px-6 py-3 rounded-xl text-xs font-bold"
              >
                Sign In to View Orders
              </button>
            </div>
          </div>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => {
            setAuthModalOpen(false);
            fetchOrders();
          }}
        />
      </div>
    );
  }

  const getOrderStatusBadge = (status) => {
    switch (status) {
      case ORDER_LIFECYCLE_STATUS.DELIVERED:
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
      case ORDER_LIFECYCLE_STATUS.OUT_FOR_DELIVERY:
        return "bg-sky-500/15 text-sky-300 border-sky-500/30";
      case ORDER_LIFECYCLE_STATUS.CANCELLED:
        return "bg-rose-500/15 text-rose-300 border-rose-500/30";
      default:
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    }
  };

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case PAYMENT_STATUS.SUCCESS:
        return "text-emerald-400";
      case PAYMENT_STATUS.FAILED:
        return "text-rose-400";
      case PAYMENT_STATUS.REFUNDED:
        return "text-purple-400";
      default:
        return "text-amber-400";
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">My Orders</h1>
          <p className="text-xs text-slate-400">
            Track live dispatch status, delivery timelines, and invoices.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        <div className="md:col-span-1">
          <AccountNav />
        </div>

        <div className="md:col-span-3 space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="premium-panel p-6 rounded-3xl h-44 animate-pulse bg-white/5"
                />
              ))}
            </div>
          ) : error ? (
            <div className="premium-panel p-12 rounded-3xl text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">
                Error Loading Orders
              </h3>
              <p className="text-xs text-slate-400">{error}</p>
              <button
                onClick={fetchOrders}
                className="gold-gradient-btn px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="premium-panel p-16 rounded-3xl text-center space-y-4 max-w-md mx-auto">
              <Package className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-white">
                No orders placed yet
              </h3>
              <p className="text-xs text-slate-400">
                You haven't placed any orders yet. Discover our authentic
                Jodhpur pottery and gate security catalog.
              </p>
              <Link
                to="/products"
                className="gold-gradient-btn inline-block px-5 py-2.5 rounded-xl text-xs font-bold"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="premium-panel p-5 rounded-3xl space-y-4 border border-white/10 hover:border-amber-400/30 transition"
              >
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-amber-400">
                        {order.id}
                      </span>
                      {order.isExpress30Min && (
                        <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] font-black px-1.5 py-0.2 rounded flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 fill-current" /> 30-MIN
                          PRIORITY
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Placed on{" "}
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getOrderStatusBadge(order.orderStatus)}`}
                    >
                      {order.orderStatus.replace(/_/g, " ")}
                    </span>
                    <Link
                      to={`/account/orders/${order.id}`}
                      className="p-1.5 rounded-xl bg-[#0c182b] text-slate-300 hover:text-white border border-white/5 transition"
                      title="View Order Details"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Items preview */}
                <div className="space-y-2.5">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-xl bg-black shrink-0"
                      />
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-white line-clamp-1">
                          {item.name}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          Qty: {item.quantity} × ₹{item.price}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer breakdown */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-white/5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Payment:</span>
                    <span
                      className={`font-bold ${getPaymentStatusBadge(order.paymentStatus)}`}
                    >
                      {order.paymentStatus}
                    </span>
                    <span className="text-slate-500">
                      • {order.paymentMethod}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Grand Total:</span>
                    <span className="font-mono text-amber-400 font-black text-sm">
                      ₹{order.totals?.grandTotal}
                    </span>
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
