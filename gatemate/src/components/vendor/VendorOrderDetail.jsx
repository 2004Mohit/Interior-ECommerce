import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Truck, Phone } from "lucide-react";
import { vendorService } from "../../services/vendorService";

export const VendorOrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    vendorService.getOrders().then((list) => {
      const match = list.find((o) => o.id === id);
      setOrder(match);
    });
  }, [id]);

  if (!order)
    return (
      <div className="p-8 text-xs text-[#606460]">
        Order loading or not found...
      </div>
    );

  const handleStatusChange = async (newStatus) => {
    await vendorService.updateOrderStatus(order.id, newStatus);
    setOrder({ ...order, orderStatus: newStatus });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-[#D9E2EA] pb-4">
        <Link to="/vendor/orders" className="btn-gm-secondary p-2 rounded-xl">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-[#173885]">
            Order {order.id}
          </h1>
          <p className="text-xs text-[#606460]">
            Fulfillment & Dispatch Actions
          </p>
        </div>
      </div>

      <div className="gm-panel p-6 rounded-3xl space-y-4">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[#606460]">Update Fulfillment Stage:</span>
          <div className="flex gap-2">
            {[
              "PROCESSING",
              "READY_FOR_DELIVERY",
              "OUT_FOR_DELIVERY",
              "DELIVERED",
            ].map((st) => (
              <button
                key={st}
                onClick={() => handleStatusChange(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  order.orderStatus === st
                    ? "bg-[#173885] text-[#FEFEFE]"
                    : "btn-gm-secondary"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-[#D9E2EA] text-xs space-y-2">
          <h3 className="font-bold text-[#173885]">
            Customer Contact & Site Drop:
          </h3>
          <p className="text-[#282926] font-bold">
            {order.shippingAddress.fullName} ({order.shippingAddress.phone})
          </p>
          <p className="text-[#606460]">
            {order.shippingAddress.line1}, {order.shippingAddress.locality} -{" "}
            {order.shippingAddress.pincode}
          </p>
        </div>
      </div>
    </div>
  );
};
