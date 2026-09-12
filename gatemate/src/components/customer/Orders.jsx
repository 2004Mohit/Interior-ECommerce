import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AccountNav } from "./AccountNav";
import {
  orderRepository,
  ORDER_LIFECYCLE_STATUS,
} from "../../services/orderRepository";
import { useAuth } from "../../context/AuthContext";
import { AuthModal } from "../AuthModal";
import { ChevronRight, Zap, PackageX } from "lucide-react";
import {
  AuthRequiredStateView,
  ErrorStateView,
  EmptyStateView,
} from "../common/StateViews";

export const Orders = () => {
  const { user, loading: authLoading } = useAuth();

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

  if (!authLoading && !user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24">
        <h1 className="text-xl sm:text-2xl font-black text-[#173885]">
          My Orders
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <AccountNav />
          </div>
          <div className="md:col-span-3">
            <AuthRequiredStateView
              title="Sign In to View Orders"
              description="Personal order history and 30-minute priority delivery tracking are private to verified accounts."
              onOpenAuth={() => setAuthModalOpen(true)}
            />
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
        return "bg-[#E1F2D9] text-[#3F7D20] border-[#3F7D20]/30";
      case ORDER_LIFECYCLE_STATUS.OUT_FOR_DELIVERY:
        return "bg-[#E4EEF3] text-[#173885] border-[#9AAED4]/40";
      case ORDER_LIFECYCLE_STATUS.CANCELLED:
        return "bg-[#FBE3DE] text-[#B43D20] border-[#B43D20]/30";
      default:
        return "bg-[#E3EBFA] text-[#2E4D94] border-[#2E4D94]/30";
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-24">
      <div className="border-b border-[#D9E2EA] pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-[#173885]">
          My Orders
        </h1>
        <p className="text-xs text-[#606460]">
          Track live dispatch status, delivery timelines, and invoices in Pune &
          PCMC.
        </p>
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
                  className="gm-panel p-6 rounded-3xl h-40 animate-pulse bg-[#E4EEF3]"
                />
              ))}
            </div>
          ) : error ? (
            <ErrorStateView
              title="Error Loading Orders"
              description={error}
              onRetry={fetchOrders}
            />
          ) : orders.length === 0 ? (
            <EmptyStateView
              icon={PackageX}
              title="No Orders Found"
              description="You haven't placed any orders yet. Discover our certified construction supplies catalogue."
              actionLink="/products"
              actionLabel="Discover Products"
            />
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="gm-panel p-4 sm:p-5 rounded-3xl space-y-3.5 border border-[#D9E2EA] hover:border-[#3C7DDA] transition"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9E2EA] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-[#173885]">
                        {order.id}
                      </span>
                      {order.isExpress30Min && (
                        <span className="bg-[#3C7DDA] text-[#FEFEFE] text-[9px] font-black px-1.5 py-0.2 rounded flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 fill-current" /> 30-MIN
                          PRIORITY
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#606460] mt-0.5">
                      Placed on{" "}
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getOrderStatusBadge(order.orderStatus)}`}
                    >
                      {order.orderStatus.replace(/_/g, " ")}
                    </span>
                    <Link
                      to={`/account/orders/${order.id}`}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl bg-[#F4F6FA] text-[#282926] hover:text-[#3C7DDA] border border-[#D9E2EA] transition"
                      title="View Order Details"
                      aria-label={`View details for order ${order.id}`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-xl bg-[#F4F6FA] shrink-0 border border-[#D9E2EA]"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-[#282926] truncate">
                          {item.name}
                        </h4>
                        <span className="text-[11px] text-[#606460]">
                          Qty: {item.quantity} × ₹{item.price}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-[#D9E2EA] text-xs">
                  <div className="flex items-center gap-1.5 text-[#606460]">
                    <span>Payment:</span>
                    <strong className="text-[#282926]">
                      {order.paymentStatus}
                    </strong>
                    <span>({order.paymentMethod})</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[#606460]">Total:</span>
                    <span className="font-mono text-[#173885] font-black text-sm">
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
