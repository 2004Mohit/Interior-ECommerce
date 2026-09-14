import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Search,
  Filter,
  RotateCcw,
  Truck,
  AlertTriangle,
  Eye,
  Clock,
  Building2,
  CheckCircle2,
  XCircle,
  DollarSign,
  Calendar,
} from "lucide-react";
import { adminOrderService } from "../../services/adminOrderService";
import { AdminPermissionGuard } from "./AdminPermissionGuard";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";
import { SeoHead } from "../common/SeoHead";

const STATUS_OPTIONS = [
  { label: "All Orders", value: "ALL" },
  { label: "New", value: "NEW" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Preparing", value: "PREPARING" },
  { label: "Ready for Dispatch", value: "READY_FOR_DISPATCH" },
  { label: "Out for Delivery", value: "OUT_FOR_DELIVERY" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export const AdminOrderListView = () => {
  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isExpressOnly, setIsExpressOnly] = useState(false);
  const [isDelayedOnly, setIsDelayedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminOrderService.getOrders({
        search,
        status: statusFilter,
        isExpressOnly,
        isDelayedOnly,
        limit: 100,
      });
      setOrders(res.orders);
      setTotalCount(res.totalCount);
    } catch (err) {
      setError(err.message || "Failed to load platform orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, isExpressOnly, isDelayedOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadOrders();
  };

  const formatCurrency = (val) =>
    `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  const getStatusBadge = (status) => {
    switch (status) {
      case "DELIVERED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30">
            DELIVERED
          </span>
        );
      case "OUT_FOR_DELIVERY":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#E4EEF3] text-[#3C7DDA] border border-[#3C7DDA]/30 animate-pulse">
            OUT FOR DELIVERY
          </span>
        );
      case "READY_FOR_DISPATCH":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FFF0D5] text-[#A66A08] border border-[#A66A08]/30">
            READY DISPATCH
          </span>
        );
      case "PREPARING":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FFF0D5] text-[#A66A08] border border-[#A66A08]/30">
            PREPARING
          </span>
        );
      case "ACCEPTED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#E4EEF3] text-[#173885] border border-[#3C7DDA]/30">
            ACCEPTED
          </span>
        );
      case "NEW":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#E4EEF3] text-[#173885] border border-[#3C7DDA]/30">
            NEW
          </span>
        );
      case "CANCELLED":
      case "REJECTED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FBE3DE] text-[#B43D20] border border-[#B43D20]/30">
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#F4F6FA] text-[#606460]">
            {status}
          </span>
        );
    }
  };

  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.MANAGE_ORDERS}>
      <div className="space-y-6 pb-20 font-sans">
        <SeoHead
          title="Orders Oversight & Management | GateMate Admin"
          description="Track customer site orders, dispatch logistics, 30-minute express promises, and delivery SLA exceptions."
          canonicalUrl="/admin/orders"
          noIndex={true}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
          <div>
            <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Logistics & Fulfillment
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
              Platform Orders Master Control
            </h1>
            <p className="text-xs text-[#606460]">
              Oversee real-time Pune & PCMC contractor dispatches, monitor
              delivery SLAs, and manage order exceptions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/delivery"
              className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Truck className="w-3.5 h-3.5 text-[#3C7DDA]" />
              <span>Delivery SLA Console</span>
            </Link>
            <button
              onClick={loadOrders}
              disabled={loading}
              className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <RotateCcw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="gm-panel p-4 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-3 shadow-2xs">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92]" />
              <input
                type="text"
                placeholder="Search order ID, vendor, customer name, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full gm-input pl-10 pr-20 py-2 rounded-xl text-xs"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 btn-gm-primary px-3 py-1 rounded-lg text-xs font-bold"
              >
                Search
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs w-full md:w-auto">
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[#173885]">
                <input
                  type="checkbox"
                  checked={isExpressOnly}
                  onChange={(e) => setIsExpressOnly(e.target.checked)}
                  className="rounded border-[#D9E2EA] text-[#173885]"
                />
                <span>30-Min Express Only</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[#B43D20]">
                <input
                  type="checkbox"
                  checked={isDelayedOnly}
                  onChange={(e) => setIsDelayedOnly(e.target.checked)}
                  className="rounded border-[#D9E2EA] text-[#B43D20]"
                />
                <span>Delayed / SLA Exceptions</span>
              </label>
            </div>
          </form>

          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-[#D9E2EA] pt-3 scrollbar-thin">
            <Filter className="w-3.5 h-3.5 text-[#6F8A92] shrink-0 mr-1" />
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatusFilter(s.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                  statusFilter === s.value
                    ? "bg-[#173885] text-[#FEFEFE] shadow-xs"
                    : "bg-[#F4F6FA] text-[#606460] hover:bg-[#E4EEF3] hover:text-[#173885]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-[#FEFEFE] rounded-2xl border border-[#D9E2EA]"
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="gm-panel p-12 rounded-3xl border border-[#D9E2EA] text-center space-y-2 bg-[#FEFEFE]">
            <ShoppingCart className="w-10 h-10 text-[#6F8A92] mx-auto" />
            <h2 className="text-base font-bold text-[#173885]">
              No Orders Found
            </h2>
            <p className="text-xs text-[#606460]">
              No orders match the specified filter criteria.
            </p>
          </div>
        ) : (
          <div className="gm-panel rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F6FA] border-b border-[#D9E2EA] text-[10px] font-bold uppercase text-[#6F8A92]">
                  <tr>
                    <th className="p-4">Order ID & Delivery SLA</th>
                    <th className="p-4">Customer & Site</th>
                    <th className="p-4">Vendor</th>
                    <th className="p-4">Grand Total</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9E2EA]">
                  {orders.map((o) => {
                    const shipping = o.shipping_address || {};

                    return (
                      <tr
                        key={o.id}
                        className="hover:bg-[#F4F6FA]/50 transition"
                      >
                        <td className="p-4">
                          <div className="space-y-1">
                            <span className="font-mono font-bold text-[#173885] block">
                              {o.id}
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {o.is_express_30min ? (
                                <span className="px-2 py-0.5 rounded bg-[#E4EEF3] text-[#3C7DDA] font-bold text-[10px] flex items-center gap-1">
                                  <Truck className="w-3 h-3" /> 30-Min Express
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-[#F4F6FA] text-[#606460] font-semibold text-[10px]">
                                  Standard Delivery
                                </span>
                              )}

                              {o.isSlaBreached && (
                                <span className="px-2 py-0.5 rounded bg-[#FBE3DE] text-[#B43D20] font-bold text-[10px] flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> SLA
                                  Exception ({o.elapsedMinutes}m)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="font-bold text-[#282926] block">
                            {shipping.fullName || "Site Customer"}
                          </span>
                          <span className="text-[11px] text-[#606460] block">
                            {shipping.phone || "—"}
                          </span>
                          <span className="text-[10px] text-[#6F8A92] truncate block max-w-xs">
                            {shipping.addressLine1 ||
                              shipping.locality ||
                              "Pune"}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className="font-semibold text-[#282926] block">
                            {o.vendor?.business_name || "Vendor Depot"}
                          </span>
                          <span className="text-[10px] text-[#6F8A92]">
                            {o.vendor?.locality || "Pune"}
                          </span>
                        </td>

                        <td className="p-4 font-mono font-bold text-sm text-[#173885]">
                          {formatCurrency(o.grand_total)}
                        </td>

                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              o.payment_status === "PAID"
                                ? "bg-[#E1F2D9] text-[#3F7D20]"
                                : o.payment_status === "REFUNDED"
                                  ? "bg-[#FBE3DE] text-[#B43D20]"
                                  : "bg-[#FFF0D5] text-[#A66A08]"
                            }`}
                          >
                            {o.payment_status || "PENDING"}
                          </span>
                        </td>

                        <td className="p-4">{getStatusBadge(o.status)}</td>

                        <td className="p-4 text-right">
                          <Link
                            to={`/admin/orders/${o.id}`}
                            className="btn-gm-primary px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#FEFEFE]" />
                            <span>Inspect</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminPermissionGuard>
  );
};
