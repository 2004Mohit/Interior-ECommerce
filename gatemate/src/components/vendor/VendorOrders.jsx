import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Zap, ChevronRight } from "lucide-react";
import { vendorService } from "../../services/vendorService";

export const VendorOrders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    vendorService.getOrders().then(setOrders);
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D9E2EA] pb-4">
        <h1 className="text-2xl font-black text-[#173885]">
          Site Dispatch Orders
        </h1>
        <p className="text-xs text-[#606460]">
          Manage live site delivery fulfillments and 30-minute priority
          dispatches.
        </p>
      </div>

      <div className="space-y-4">
        {orders.map((o) => (
          <div
            key={o.id}
            className="gm-panel p-5 rounded-3xl border border-[#D9E2EA] space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9E2EA] pb-3">
              <div>
                <span className="font-mono text-xs font-black text-[#173885]">
                  {o.id}
                </span>
                <p className="text-[11px] text-[#606460]">
                  Site Location: {o.shippingAddress.line1},{" "}
                  {o.shippingAddress.locality} ({o.shippingAddress.pincode})
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold">
                  {o.orderStatus}
                </span>
                <Link
                  to={`/vendor/orders/${o.id}`}
                  className="btn-gm-primary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  <span>Manage Order</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="text-xs space-y-1">
              {o.items.map((i) => (
                <div key={i.id} className="flex justify-between text-[#282926]">
                  <span>
                    {i.name} (Qty: {i.quantity})
                  </span>
                  <span className="font-mono font-bold">
                    ₹{i.price * i.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
