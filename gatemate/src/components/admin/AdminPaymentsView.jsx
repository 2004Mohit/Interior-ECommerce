import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
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

      setTransactions(res?.transactions || []);
      setTotalCount(res?.totalCount || 0);
    } catch (err) {
      console.error("Failed to load payment transactions:", err);
      setError(err?.message || "Failed to load payment transactions.");
      setTransactions([]);
      setTotalCount(0);
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

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const normalizeStatus = (status) => String(status || "PENDING").toUpperCase();

  const getStatusClasses = (status) => {
    const normalized = normalizeStatus(status);

    if (
      normalized === "SUCCESS" ||
      normalized === "PAID" ||
      normalized === "SETTLED"
    ) {
      return "bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30";
    }

    if (
      normalized === "FAILED" ||
      normalized === "CANCELLED" ||
      normalized === "REFUNDED"
    ) {
      return "bg-[#FBE3DE] text-[#B43D20] border border-[#B43D20]/30";
    }

    return "bg-[#FFF0D5] text-[#A66A08] border border-[#A66A08]/30";
  };

  const getStatusIcon = (status) => {
    const normalized = normalizeStatus(status);

    if (
      normalized === "SUCCESS" ||
      normalized === "PAID" ||
      normalized === "SETTLED"
    ) {
      return <CheckCircle2 className="w-3 h-3" />;
    }

    if (
      normalized === "FAILED" ||
      normalized === "CANCELLED" ||
      normalized === "REFUNDED"
    ) {
      return <AlertCircle className="w-3 h-3" />;
    }

    return <Clock className="w-3 h-3" />;
  };

  const getGatewayReference = (tx) =>
    tx?.payment_gateway_reference ||
    tx?.gateway_payment_id ||
    tx?.gateway_reference ||
    tx?.payment_reference ||
    null;

  const getGatewayOrderId = (tx) =>
    tx?.payment_gateway_order_id || tx?.gateway_order_id || null;

  const getGatewayName = (tx) =>
    tx?.payment_gateway ||
    (String(tx?.payment_method || "")
      .toUpperCase()
      .includes("CASHFREE")
      ? "CASHFREE"
      : null);

  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.MANAGE_PAYMENTS}>
      <div className="space-y-6 pb-20 font-sans">
        <SeoHead
          title="Payment Transactions & Gateways | Ferrado Admin"
          description="Inspect server-verified online payments, gateway references, and Pay on Delivery transactions."
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
              Audit online payments, gateway references, and Pay on Delivery
              transactions across site orders.
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

        {/* Error */}
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92]" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order ID or vendor..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#D9E2EA] bg-white text-xs outline-none focus:ring-2 focus:ring-[#3C7DDA]/20 focus:border-[#3C7DDA]"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-[#D9E2EA] bg-white text-xs font-semibold text-[#282926] outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>

            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-[#D9E2EA] bg-white text-xs font-semibold text-[#282926] outline-none"
            >
              <option value="ALL">All Methods</option>
              <option value="CASHFREE_ONLINE">Cashfree Online</option>
              <option value="PAY_ON_DELIVERY">Pay on Delivery</option>
            </select>

            <span className="text-[10px] font-bold text-[#6F8A92] px-2">
              {totalCount} transaction{totalCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="gm-panel p-12 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] text-center">
            <RotateCcw className="w-8 h-8 text-[#3C7DDA] mx-auto animate-spin" />
            <p className="text-xs font-semibold text-[#6F8A92] mt-3">
              Loading payment transactions...
            </p>
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
                    <th className="p-4">Gateway Order ID</th>
                    <th className="p-4">Vendor</th>
                    <th className="p-4">Subtotal</th>
                    <th className="p-4">Grand Total</th>
                    <th className="p-4">Method</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#D9E2EA]">
                  {transactions.map((tx) => {
                    const gatewayReference = getGatewayReference(tx);
                    const gatewayOrderId = getGatewayOrderId(tx);
                    const gatewayName = getGatewayName(tx);

                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-[#F4F6FA]/50 transition"
                      >
                        {/* Order */}
                        <td className="p-4">
                          <Link
                            to={`/admin/orders/${tx.id}`}
                            className="font-mono font-bold text-[#173885] hover:underline block"
                          >
                            {tx.id}
                          </Link>

                          <span className="text-[10px] text-[#6F8A92] font-mono">
                            {tx.created_at
                              ? new Date(tx.created_at).toLocaleString("en-IN")
                              : "—"}
                          </span>
                        </td>

                        {/* Gateway Reference */}
                        <td className="p-4 font-mono text-[11px]">
                          {gatewayReference ? (
                            <div className="space-y-1">
                              <span className="text-[#282926] bg-[#F4F6FA] px-2 py-0.5 rounded border border-[#D9E2EA] inline-block">
                                {gatewayReference}
                              </span>

                              {gatewayName && (
                                <span className="block text-[9px] uppercase font-bold text-[#6F8A92]">
                                  {gatewayName}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#6F8A92]">
                              Not available
                            </span>
                          )}
                        </td>

                        {/* Gateway Order ID */}
                        <td className="p-4 font-mono text-[10px]">
                          {gatewayOrderId ? (
                            <span className="text-[#282926] bg-[#F4F6FA] px-2 py-0.5 rounded border border-[#D9E2EA] inline-block">
                              {gatewayOrderId}
                            </span>
                          ) : (
                            <span className="text-[#6F8A92]">—</span>
                          )}
                        </td>

                        {/* Vendor */}
                        <td className="p-4">
                          <span className="font-semibold text-[#282926] block">
                            {tx.vendor?.business_name ||
                              tx.vendor_name ||
                              "Vendor"}
                          </span>

                          <span className="text-[10px] text-[#6F8A92]">
                            {tx.vendor?.locality || tx.vendor?.city || "Pune"}
                          </span>
                        </td>

                        {/* Subtotal */}
                        <td className="p-4 font-mono font-bold text-[#282926]">
                          {formatCurrency(
                            tx.item_subtotal ?? tx.product_subtotal,
                          )}
                        </td>

                        {/* Grand Total */}
                        <td className="p-4 font-mono font-bold text-[#173885]">
                          {formatCurrency(tx.grand_total ?? tx.amount)}
                        </td>

                        {/* Method */}
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-[#F4F6FA] text-[#606460] font-bold text-[10px]">
                            {tx.payment_method || "—"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${getStatusClasses(
                              tx.payment_status,
                            )}`}
                          >
                            {getStatusIcon(tx.payment_status)}
                            {normalizeStatus(tx.payment_status)}
                          </span>
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

export default AdminPaymentsView;
