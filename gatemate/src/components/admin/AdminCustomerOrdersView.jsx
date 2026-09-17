import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Search,
  Filter,
  RotateCcw,
  Building2,
  User,
  Eye,
  DollarSign,
} from "lucide-react";
import { adminContentService } from "../../services/adminContentService";
import { AdminPermissionGuard } from "./AdminPermissionGuard";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";
import { SeoHead } from "../common/SeoHead";

export const AdminCustomerOrdersView = () => {
  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminContentService.getCustomerOrdersLedger({
        search,
        status: statusFilter,
        limit: 100,
      });
      setOrders(res.orders);
      setTotalCount(res.totalCount);
    } catch (err) {
      setError(err.message || "Failed to load customer orders ledger.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const formatCurrency = (val) =>
    `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.MANAGE_CUSTOMERS}>
      <div className="space-y-6 pb-20 font-sans">
        <SeoHead
          title="Customer Orders Ledger | GateMate Admin"
          description="Platform-wide ledger of orders placed by contractor buyers and site customers across Pune & PCMC."
          canonicalUrl="/admin/customer-orders"
          noIndex={true}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
          <div>
            <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Buyer Dispatches
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
              Customer Orders Master Ledger
            </h1>
            <p className="text-xs text-[#606460]">
              Audit contractor purchases, site delivery destinations, and
              fulfilling vendor depots.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/customers"
              className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold"
            >
              <span>View Customer Accounts</span>
            </Link>
            <button
              onClick={loadData}
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

        {/* Filters */}
        <div className="gm-panel p-4 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-2xs">
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1 max-w-md"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92]" />
            <input
              type="text"
              placeholder="Search Order ID, contractor name, or phone..."
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
          </form>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              "ALL",
              "NEW",
              "ACCEPTED",
              "OUT_FOR_DELIVERY",
              "DELIVERED",
              "CANCELLED",
            ].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                  statusFilter === st
                    ? "bg-[#173885] text-[#FEFEFE] shadow-xs"
                    : "bg-[#F4F6FA] text-[#606460] hover:bg-[#E4EEF3] hover:text-[#173885]"
                }`}
              >
                {st}
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
                className="h-16 bg-[#FEFEFE] rounded-2xl border border-[#D9E2EA]"
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="gm-panel p-12 rounded-3xl border border-[#D9E2EA] text-center space-y-2 bg-[#FEFEFE]">
            <ShoppingCart className="w-10 h-10 text-[#6F8A92] mx-auto" />
            <h2 className="text-base font-bold text-[#173885]">
              No Orders Recorded
            </h2>
            <p className="text-xs text-[#606460]">
              No customer orders match the selected filters.
            </p>
          </div>
        ) : (
          <div className="gm-panel rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F6FA] border-b border-[#D9E2EA] text-[10px] font-bold uppercase text-[#6F8A92]">
                <tr>
                  <th className="p-4">Order ID & Date</th>
                  <th className="p-4">Contractor Customer</th>
                  <th className="p-4">Fulfilling Vendor</th>
                  <th className="p-4">Grand Total</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E2EA]">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#F4F6FA]/50 transition">
                    <td className="p-4">
                      <Link
                        to={`/admin/orders/${o.id}`}
                        className="font-mono font-bold text-[#173885] hover:underline block"
                      >
                        {o.id}
                      </Link>
                      <span className="text-[10px] font-mono text-[#6F8A92]">
                        {new Date(o.created_at).toLocaleString("en-IN")}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-[#282926] block">
                        {o.shipping_address?.fullName || "Contractor"}
                      </span>
                      <span className="text-[10px] text-[#6F8A92]">
                        {o.shipping_address?.locality || "Pune"}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="font-semibold text-[#282926] block">
                        {o.vendor?.business_name || "Vendor Depot"}
                      </span>
                      <span className="text-[10px] text-[#6F8A92]">
                        {o.vendor?.city || "Pune"}
                      </span>
                    </td>

                    <td className="p-4 font-mono font-bold text-[#173885]">
                      {formatCurrency(o.grand_total)}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          o.payment_status === "PAID"
                            ? "bg-[#E1F2D9] text-[#3F7D20]"
                            : "bg-[#FFF0D5] text-[#A66A08]"
                        }`}
                      >
                        {o.payment_status || "PENDING"}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#E4EEF3] text-[#173885]">
                        {o.status}
                      </span>
                    </td>

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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminPermissionGuard>
  );
};
