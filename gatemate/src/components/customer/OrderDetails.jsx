import React from "react";
import { useParams, Link } from "react-router-dom";
import { AccountNav } from "../../components/customer/AccountNav";
import { MOCK_ORDERS } from "../../data/mockData";
import { ArrowLeft, CheckCircle2, Truck, CreditCard } from "lucide-react";

export const OrderDetails = () => {
  const { id } = useParams();
  const order = MOCK_ORDERS.find((o) => o.id === id) || MOCK_ORDERS[0];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to="/account/orders"
        className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Order History</span>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <AccountNav />
        </div>

        <div className="md:col-span-3 space-y-6">
          <div className="premium-panel p-6 rounded-3xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-black text-white">{order.id}</h2>
                <p className="text-xs text-slate-400">
                  Placed on {order.createdAt}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {order.status}
              </span>
            </div>

            {/* Items */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase">
                Items Ordered
              </h3>
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="premium-card p-3.5 rounded-xl flex items-center gap-4"
                >
                  <img
                    src={item.img}
                    alt={item.name}
                    className="w-14 h-14 object-cover rounded-lg bg-black"
                  />
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-white">
                      {item.name}
                    </h4>
                    <span className="text-xs text-amber-400 font-semibold">
                      ₹{item.price}
                    </span>
                  </div>
                  <span className="text-xs text-slate-300 font-bold">
                    Qty: {item.quantity}
                  </span>
                </div>
              ))}
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold">
                  Shipping Destination
                </span>
                <p className="text-white">{order.address}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold">Payment Method</span>
                <p className="text-emerald-400 font-semibold">
                  {order.paymentMethod}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
