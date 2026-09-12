import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Zap,
  Search,
  RotateCcw,
  MapPin,
  Clock,
  CheckCircle2,
  ChevronRight,
  Package,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { useVendorAuth } from "../../context/VendorAuthContext";
import { vendorOrderService } from "../../services/vendorOrderService";
import {
  VENDOR_ORDER_STATUS,
  vendorOrderStateMachine,
} from "../../services/vendorOrderStateMachine";
import { SeoHead } from "../common/SeoHead";

export const VendorOrders = () => {
  const { vendorUser } = useVendorAuth();
  const vendorId = vendorUser?.id || "vnd-pune-001";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadOrders = async () => {
    setLoading(true);
    const data = await vendorOrderService.getVendorOrders(vendorId);
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, [vendorId]);

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 pb-24 font-sans">
      <SeoHead
        title="Normal Site Orders | GateMate Vendor Portal"
        description="Live normal site orders, 30-minute priority dispatch queue, and customer fulfillment tracking."
        canonicalUrl="/vendor/orders"
        noIndex={true}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div>
          <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Site Dispatch Terminal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
            Normal Site Orders
          </h1>
          <p className="text-xs text-[#606460]">
            Manage incoming contractor site orders, staging, and 30-minute
            priority delivery commitments in Pune & PCMC.
          </p>
        </div>

        <button
          onClick={loadOrders}
          className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="gm-panel p-4 rounded-2xl border border-[#D9E2EA] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92] pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Order ID, customer, or product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full gm-input pl-10 pr-4 py-2 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { key: "ALL", label: "All Orders" },
            { key: VENDOR_ORDER_STATUS.NEW, label: "New" },
            { key: VENDOR_ORDER_STATUS.ACCEPTED, label: "Accepted" },
            { key: VENDOR_ORDER_STATUS.PREPARING, label: "Preparing" },
            { key: VENDOR_ORDER_STATUS.READY_FOR_DISPATCH, label: "Ready" },
            {
              key: VENDOR_ORDER_STATUS.OUT_FOR_DELIVERY,
              label: "Out for Delivery",
            },
            { key: VENDOR_ORDER_STATUS.DELIVERED, label: "Delivered" },
          ].map((pill) => (
            <button
              key={pill.key}
              onClick={() => setStatusFilter(pill.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                statusFilter === pill.key
                  ? "bg-[#173885] text-[#FEFEFE]"
                  : "bg-[#F4F6FA] text-[#606460] hover:bg-[#E4EEF3]"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="gm-panel p-6 rounded-3xl h-36 animate-pulse bg-[#E4EEF3]"
            />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="gm-panel p-16 rounded-3xl text-center space-y-3 border border-[#D9E2EA]">
          <ShoppingCart className="w-12 h-12 text-[#6F8A92] mx-auto" />
          <h3 className="text-base font-bold text-[#173885]">
            No Orders Found
          </h3>
          <p className="text-xs text-[#606460]">
            There are no normal site orders matching the selected filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((o) => {
            const totalQty = o.items.reduce(
              (sum, item) => sum + item.quantity,
              0,
            );
            const statusConfig = vendorOrderStateMachine.getStatusConfig(
              o.status,
            );

            return (
              <div
                key={o.id}
                className="gm-panel p-5 sm:p-6 rounded-3xl border border-[#D9E2EA] hover:border-[#3C7DDA] transition space-y-4 shadow-xs"
              >
                {/* Card Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9E2EA] pb-3.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-black text-[#173885] text-sm">
                        {o.id}
                      </span>
                      {o.isExpress30Min && (
                        <span className="bg-[#3C7DDA] text-[#FEFEFE] text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Zap className="w-3 h-3 fill-current" /> 30-MIN
                          PRIORITY
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] ${statusConfig.badgeClass}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#606460]">
                      Ordered by:{" "}
                      <strong className="text-[#282926]">
                        {o.customerName}
                      </strong>{" "}
                      • Ref: {o.customerRef}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <div className="text-right sm:block hidden">
                      <div className="font-mono font-black text-[#173885] text-base">
                        ₹{o.totals.grandTotal}
                      </div>
                      <span
                        className={`text-[10px] font-bold ${
                          o.paymentStatus === "SUCCESS"
                            ? "text-[#3F7D20]"
                            : "text-[#A66A08]"
                        }`}
                      >
                        {o.paymentStatus} ({o.paymentMethod})
                      </span>
                    </div>

                    <Link
                      to={`/vendor/orders/${o.id}`}
                      className="btn-gm-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Manage Order</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Products & Delivery Location Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                  {/* Products */}
                  <div className="md:col-span-7 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F8A92] block">
                      Ordered Products ({totalQty} total units)
                    </span>
                    <div className="space-y-2">
                      {o.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 bg-[#F4F6FA] p-2.5 rounded-2xl border border-[#D9E2EA]"
                        >
                          <img
                            src={item.img}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover bg-[#FEFEFE] border border-[#D9E2EA] shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-[#282926] truncate">
                              {item.name}
                            </h4>
                            <div className="text-[10px] text-[#6F8A92] font-mono">
                              Qty: {item.quantity} {item.unit}s × ₹{item.price}{" "}
                              • SKU: {item.sku}
                            </div>
                          </div>
                          <span className="font-mono font-bold text-[#173885] text-xs shrink-0">
                            ₹{item.subtotal}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Location & Timeline Date */}
                  <div className="md:col-span-5 bg-[#F4F6FA] p-3.5 rounded-2xl border border-[#D9E2EA] space-y-2 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[#173885] font-bold">
                        <MapPin className="w-3.5 h-3.5 text-[#3C7DDA]" />
                        <span>Site Destination</span>
                      </div>
                      <p className="text-[11px] text-[#282926] font-semibold leading-relaxed">
                        {o.deliveryAddress.line1}, {o.deliveryAddress.locality},{" "}
                        {o.deliveryAddress.city} - {o.deliveryAddress.pincode}
                      </p>
                      {o.deliveryAddress.notes && (
                        <p className="text-[10px] text-[#606460] italic">
                          "{o.deliveryAddress.notes}"
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#D9E2EA] flex items-center justify-between text-[10px] text-[#6F8A92] font-mono">
                      <span>
                        Placed:{" "}
                        {new Date(o.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="text-[#173885] font-bold">
                        {o.items.length} Product Line(s)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
