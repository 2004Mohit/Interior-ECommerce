import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  Search,
  Filter,
  RotateCcw,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  DollarSign,
  Wallet,
} from "lucide-react";
import { adminFinanceService } from "../../services/adminFinanceService";
import { AdminPermissionGuard } from "./AdminPermissionGuard";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";
import { SeoHead } from "../common/SeoHead";

export const AdminPaymentsView = () => {
  const [transactions, setTransactions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("ALL");
  const [method, setMethod] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFinanceService.getPaymentTransactions({
        search,
        paymentStatus,
        method,
        limit: 100,
      });
      setTransactions(res.transactions);
      setTotalCount(res.totalCount);
    } catch (err) {
      setError(err.message || "Failed to load payment transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [paymentStatus, method]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const formatCurrency = (val) =>
    `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.MANAGE_PAYMENTS}>
      <div className="space-y-6 pb-20 font-sans">
        <SeoHead
          title="Payment Transactions & Gateways | GateMate Admin"
          description="Inspect server-verified Cashfree online payments, UPI transactions, and Pay on Delivery collections."
          canonicalUrl="/admin/payments"
          noIndex={true}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
          <div>
            <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Treasury & Gateway Operations
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
              Payment Transactions Oversight
            </h1>
            <p className="text-xs text-[#606460]">
              Audit platform payments, Cashfree gateway references, and Pay on
              Delivery status across site dispatches.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/commissions"
              className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <span>5% Commission Ledger</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#3C7DDA]" />
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

        {error && (
          <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Toolbar */}
        <div className="gm-panel p-4 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-2xs">
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1 max-w-md"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92]" />
            <input
              type="text"
              placeholder="Search Order ID, gateway reference, or vendor..."
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

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="gm-input px-3 py-1.5 rounded-xl font-bold"
            >
              <option value="ALL">All Payment States</option>
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
              <option value="REFUNDED">REFUNDED</option>
              <option value="FAILED">FAILED</option>
            </select>

            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="gm-input px-3 py-1.5 rounded-xl font-bold"
            >
              <option value="ALL">All Gateways & Methods</option>
              <option value="ONLINE">
                Cashfree (UPI / Cards / NetBanking)
              </option>
              <option value="POD">Pay on Delivery (Cash / Site Cheque)</option>
            </select>
          </div>
        </div>

        {/* Master Transactions Table */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-[#FEFEFE] rounded-2xl border border-[#D9E2EA]"
              />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="gm-panel p-12 rounded-3xl border border-[#D9E2EA] text-center space-y-2 bg-[#FEFEFE]">
            <CreditCard className="w-10 h-10 text-[#6F8A92] mx-auto" />
            <h2 className="text-base font-bold text-[#173885]">
              No Payment Transactions Found
            </h2>
            <p className="text-xs text-[#606460]">
              No transaction records match the selected filter criteria.
            </p>
          </div>
        ) : (
          <div className="gm-panel rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F6FA] border-b border-[#D9E2EA] text-[10px] font-bold uppercase text-[#6F8A92]">
                  <tr>
                    <th className="p-4">Order ID & Date</th>
                    <th className="p-4">Gateway Reference</th>
                    <th className="p-4">Vendor</th>
                    <th className="p-4">Material Subtotal</th>
                    <th className="p-4">Grand Total (GMV)</th>
                    <th className="p-4">Method</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9E2EA]">
                  {transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-[#F4F6FA]/50 transition"
                    >
                      <td className="p-4">
                        <Link
                          to={`/admin/orders/${tx.id}`}
                          className="font-mono font-bold text-[#173885] hover:underline block"
                        >
                          {tx.id}
                        </Link>
                        <span className="text-[10px] text-[#6F8A92] font-mono">
                          {new Date(tx.created_at).toLocaleString("en-IN")}
                        </span>
                      </td>

                      <td className="p-4 font-mono text-[11px]">
                        {tx.payment_reference ? (
                          <span className="text-[#282926] bg-[#F4F6FA] px-2 py-0.5 rounded border border-[#D9E2EA]">
                            {tx.payment_reference}
                          </span>
                        ) : (
                          <span className="text-[#6F8A92]">—</span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className="font-semibold text-[#282926] block">
                          {tx.vendor?.business_name || "Vendor Depot"}
                        </span>
                        <span className="text-[10px] text-[#6F8A92]">
                          {tx.vendor?.locality || "Pune"}
                        </span>
                      </td>

                      <td className="p-4 font-mono font-bold text-[#282926]">
                        {formatCurrency(tx.item_subtotal)}
                      </td>

                      <td className="p-4 font-mono font-bold text-[#173885]">
                        {formatCurrency(tx.grand_total)}
                      </td>

                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-[#F4F6FA] text-[#606460] font-bold text-[10px]">
                          {tx.payment_method || "CASHFREE"}
                        </span>
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            tx.payment_status === "PAID"
                              ? "bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30"
                              : tx.payment_status === "REFUNDED"
                                ? "bg-[#FBE3DE] text-[#B43D20] border border-[#B43D20]/30"
                                : "bg-[#FFF0D5] text-[#A66A08] border border-[#A66A08]/30"
                          }`}
                        >
                          {tx.payment_status || "PENDING"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminPermissionGuard>
  );
};
