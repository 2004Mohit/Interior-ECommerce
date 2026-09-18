import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  Banknote,
  Search,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Percent,
  ArrowUpRight,
  FileText,
  Info,
} from "lucide-react";
import { useVendorAuth } from "../../context/VendorAuthContext";
import {
  vendorFinancialService,
  SETTLEMENT_STATUS,
} from "../../services/vendorFinancialService";
import { SeoHead } from "../common/SeoHead";

export const VendorPayments = () => {
  const { vendorUser } = useVendorAuth();

  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadFinancialData = async () => {
    if (!vendorUser?.id) return;
    setLoading(true);
    const [summ, txns] = await Promise.all([
      vendorFinancialService.getFinancialSummary(),
      vendorFinancialService.getTransactions(),
    ]);
    setSummary(summ);
    setTransactions(txns);
    setLoading(false);
  };

  useEffect(() => {
    if (vendorUser?.id) {
      loadFinancialData();
    } else {
      setLoading(false);
    }
  }, [vendorUser?.id]);

  const filteredTransactions = transactions.filter((t) => {
    const matchSearch =
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.orderId.toLowerCase().includes(search.toLowerCase()) ||
      t.customerRef.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "ALL" || t.settlementStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 pb-24 font-sans">
      <SeoHead
        title="Vendor Payments & Transactions Ledger | GateMate"
        description="Transparent ledger showing Product Subtotals, 5% GateMate commission, and net vendor payable disbursements."
        canonicalUrl="/vendor/payments"
        noIndex={true}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div>
          <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Financial Ledger & Payouts
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
            Vendor Payments & Transactions
          </h1>
          <p className="text-xs text-[#606460]">
            Itemized breakdown of product sales, GateMate 5% commission
            deductions, and net vendor disbursements.
          </p>
        </div>

        <button
          onClick={loadFinancialData}
          className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Commission Policy Callout */}
      <div className="p-4 rounded-2xl bg-[#E4EEF3] border border-[#9AAED4]/40 text-xs text-[#173885] flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#3C7DDA] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <strong className="font-bold">
            Transparent GateMate Commission Policy (5%):
          </strong>
          <p className="text-[11px] text-[#606460] leading-relaxed">
            GateMate charges a flat 5% commission strictly on the{" "}
            <strong>Product Subtotal</strong>. Commission is never calculated on
            delivery charges, platform packaging fees, or GST taxes.
          </p>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="gm-card p-5 rounded-2xl border border-[#D9E2EA]">
          <span className="text-[11px] font-bold text-[#6F8A92] uppercase tracking-wider block">
            Gross Product Subtotal
          </span>
          <div className="text-2xl font-black text-[#173885] mt-1 font-mono">
            ₹{summary?.grossProductSubtotal?.toLocaleString("en-IN") || 0}
          </div>
          <span className="text-[10px] text-[#606460] mt-0.5 block">
            From {summary?.transactionCount || 0} customer orders
          </span>
        </div>

        <div className="gm-card p-5 rounded-2xl border border-[#D9E2EA]">
          <span className="text-[11px] font-bold text-[#6F8A92] uppercase tracking-wider block">
            GateMate Commission (5%)
          </span>
          <div className="text-2xl font-black text-[#173885] mt-1 font-mono">
            -₹{summary?.totalPlatformCommission?.toLocaleString("en-IN") || 0}
          </div>
          <span className="text-[10px] text-[#3C7DDA] font-semibold mt-0.5 block">
            Applied only on Product subtotal
          </span>
        </div>

        <div className="gm-card p-5 rounded-2xl border border-[#D9E2EA] bg-[#E1F2D9]/30">
          <span className="text-[11px] font-bold text-[#3F7D20] uppercase tracking-wider block">
            Settled to Bank
          </span>
          <div className="text-2xl font-black text-[#3F7D20] mt-1 font-mono">
            ₹{summary?.settledDisbursedAmount?.toLocaleString("en-IN") || 0}
          </div>
          <Link
            to="/vendor/settlements"
            className="text-[10px] text-[#3F7D20] hover:underline font-bold mt-0.5 inline-flex items-center gap-0.5"
          >
            <span>View NEFT/RTGS UTRs</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="gm-card p-5 rounded-2xl border border-[#D9E2EA] bg-[#FFF0D5]/30">
          <span className="text-[11px] font-bold text-[#A66A08] uppercase tracking-wider block">
            Pending Settlement
          </span>
          <div className="text-2xl font-black text-[#A66A08] mt-1 font-mono">
            ₹{summary?.pendingSettlementAmount?.toLocaleString("en-IN") || 0}
          </div>
          <span className="text-[10px] text-[#606460] mt-0.5 block">
            Unsettled / Delivery in transit
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="gm-panel p-4 rounded-2xl border border-[#D9E2EA] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92] pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Transaction ID, Order ID, or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full gm-input pl-10 pr-4 py-2 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { key: "ALL", label: "All Transactions" },
            { key: SETTLEMENT_STATUS.PROCESSED, label: "Settled" },
            { key: SETTLEMENT_STATUS.PENDING, label: "Pending Settlement" },
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

      {/* Transaction Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="gm-panel p-5 rounded-2xl h-16 animate-pulse bg-[#E4EEF3]"
            />
          ))}
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="gm-panel p-16 rounded-3xl text-center text-xs text-[#606460]">
          No transaction ledger records match your filter.
        </div>
      ) : (
        <div className="gm-panel rounded-2xl overflow-hidden border border-[#D9E2EA]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#E4EEF3] text-[#173885] font-bold border-b border-[#D9E2EA]">
                <tr>
                  <th className="p-3.5">Transaction & Order Ref</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5 text-right">Product Subtotal</th>
                  <th className="p-3.5 text-right">Commission (5%)</th>
                  <th className="p-3.5 text-right">Net Vendor Amount</th>
                  <th className="p-3.5">Payment Mode</th>
                  <th className="p-3.5">Settlement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E2EA]">
                {filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-[#F4F6FA] transition">
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-[#173885]">
                        {txn.id}
                      </div>
                      <Link
                        to={`/vendor/orders/${txn.orderId}`}
                        className="text-[10px] text-[#3C7DDA] hover:underline font-mono"
                      >
                        {txn.orderId}
                      </Link>
                    </td>

                    <td className="p-3.5 text-[#282926] max-w-[180px] truncate">
                      {txn.customerRef}
                    </td>

                    <td className="p-3.5 text-right font-mono font-bold text-[#282926]">
                      ₹{txn.productSubtotal}
                    </td>

                    <td className="p-3.5 text-right font-mono text-[#B43D20] font-semibold">
                      -₹{txn.commissionAmount}
                      <span className="text-[9px] text-[#6F8A92] block">
                        ({txn.commissionRate * 100}%)
                      </span>
                    </td>

                    <td className="p-3.5 text-right font-mono font-black text-sm text-[#3F7D20]">
                      ₹{txn.vendorPayableAmount}
                    </td>

                    <td className="p-3.5 text-[#606460] text-[11px]">
                      {txn.paymentMethod}
                    </td>

                    <td className="p-3.5">
                      {txn.settlementStatus === SETTLEMENT_STATUS.PROCESSED ? (
                        <div>
                          <span className="bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Settled
                          </span>
                          {txn.utrNumber && (
                            <span className="text-[9px] text-[#6F8A92] font-mono block mt-0.5">
                              UTR: {txn.utrNumber}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="bg-[#FFF0D5] text-[#A66A08] border border-[#A66A08]/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
