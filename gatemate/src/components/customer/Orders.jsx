import React from "react";
import { Link } from "react-router-dom";
import { AccountNav } from "../../components/customer/AccountNav";
import { MOCK_ORDERS } from "../../data/mockData";
import { Package, ChevronRight } from "lucide-react";

export const Orders = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <h1 className="text-2xl font-black text-white">Order History</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <AccountNav />
        </div>

        <div className="md:col-span-3 space-y-4">
          {MOCK_ORDERS.map((order) => (
            <div
              key={order.id}
              className="premium-panel p-5 rounded-2xl space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div>
                  <span className="text-xs font-bold text-amber-400">
                    {order.id}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Placed on {order.createdAt}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      order.status === "Delivered"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                    }`}
                  >
                    {order.status}
                  </span>
                  <Link
                    to={`/account/orders/${order.id}`}
                    className="p-1.5 rounded-lg bg-[#0c182b] text-slate-300 hover:text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img
                      src={item.img}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg bg-black shrink-0"
                    />
                    <div className="flex-1">
                      <h4 className="text-xs font-semibold text-white line-clamp-1">
                        {item.name}
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Qty: {item.quantity} × ₹{item.price}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-white/5 text-xs">
                <span className="text-slate-400">Total Paid:</span>
                <span className="text-amber-400 font-bold text-sm">
                  ₹{order.total}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
