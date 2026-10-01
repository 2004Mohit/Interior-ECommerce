import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  RotateCcw,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  AlertCircle,
  CreditCard,
  ReceiptIndianRupee,
} from "lucide-react";

import { useVendorAuth } from "../../context/VendorAuthContext";

import {
  vendorFinancialService,
  SETTLEMENT_STATUS,
} from "../../services/vendorFinancialService";

import { SeoHead } from "../common/SeoHead";

const AUTO_REFRESH_MS = 30000;

export const VendorPayments = () => {
  const { vendorUser } = useVendorAuth();

  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadFinancialData = useCallback(
    async (manual = false) => {
      if (!vendorUser?.id) {
        setLoading(false);
        return;
      }

      if (manual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const [financialSummary, transactionRows] = await Promise.all([
          vendorFinancialService.getFinancialSummary(),
          vendorFinancialService.getTransactions(200),
        ]);

        setSummary(financialSummary || {});
        setTransactions(Array.isArray(transactionRows) ? transactionRows : []);
      } catch (err) {
        console.error("Failed to load vendor financial data:", err);

        setError(
          err?.message || "Unable to load payment and transaction history.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [vendorUser?.id],
  );

  useEffect(() => {
    if (!vendorUser?.id) {
      setLoading(false);
      return;
    }

    loadFinancialData();

    const interval = window.setInterval(() => {
      loadFinancialData();
    }, AUTO_REFRESH_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [vendorUser?.id, loadFinancialData]);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const searchableText = [
        transaction.id,
        transaction.orderId,
        transaction.customerRef,
        transaction.paymentMethod,
        transaction.utrNumber,
        transaction.settlementStatus,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      const matchesStatus =
        statusFilter === "ALL" || transaction.settlementStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [transactions, search, statusFilter]);

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDateTime = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getSettlementLabel = (status) => {
    if (
      status === SETTLEMENT_STATUS.SETTLED ||
      status === SETTLEMENT_STATUS.PROCESSED
    ) {
      return "SETTLED";
    }

    if (status === SETTLEMENT_STATUS.HOLD) {
      return "ON HOLD";
    }

    return "PENDING";
  };

  const getSettlementClasses = (status) => {
    if (
      status === SETTLEMENT_STATUS.SETTLED ||
      status === SETTLEMENT_STATUS.PROCESSED
    ) {
      return "bg-[#E1F2D9] text-[#3F7D20] border-[#3F7D20]/30";
    }

    if (status === SETTLEMENT_STATUS.HOLD) {
      return "bg-[#FFF0D5] text-[#A66A08] border-[#A66A08]/30";
    }

    return "bg-[#E4EEF3] text-[#173885] border-[#173885]/20";
  };

  return (
    <div className="space-y-7 pb-24 font-sans">
      <SeoHead
        title="Vendor Payments & Transaction History | Ferrado"
        description="View vendor payment transactions, earnings, settlement status and bank references."
        canonicalUrl="/vendor/payments"
        noIndex={true}
      />

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div>
          <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Payment Ledger
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-2">
            Vendor Payments
          </h1>

          <p className="text-xs text-[#606460] mt-1 max-w-2xl">
            Review customer payment transactions, vendor earnings and settlement
            status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadFinancialData(true)}
          disabled={loading || refreshing}
          className="btn-gm-secondary px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 self-start lg:self-auto disabled:opacity-50"
        >
          <RotateCcw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />

          {refreshing ? "Refreshing..." : "Refresh Ledger"}
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />

          <div>
            <p className="text-xs font-bold">
              Payment data could not be loaded
            </p>

            <p className="text-[11px] mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* SUMMARY */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="gm-panel rounded-2xl p-5 border border-[#D9E2EA]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F8A92]">
              Transaction Volume
            </span>

            <ReceiptIndianRupee className="w-5 h-5 text-[#173885]" />
          </div>

          <p className="text-2xl font-black text-[#173885] mt-3 font-mono">
            {loading
              ? "—"
              : Number(summary?.transactionCount || 0).toLocaleString("en-IN")}
          </p>

          <p className="text-[10px] text-[#606460] mt-1">
            Recorded payment transactions
          </p>
        </div>

        <div className="gm-panel rounded-2xl p-5 border border-[#D9E2EA]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F8A92]">
              Product Sales
            </span>

            <CreditCard className="w-5 h-5 text-[#173885]" />
          </div>

          <p className="text-2xl font-black text-[#173885] mt-3 font-mono">
            {loading ? "—" : formatCurrency(summary?.grossProductSubtotal)}
          </p>

          <p className="text-[10px] text-[#606460] mt-1">
            Product subtotal recorded in transactions
          </p>
        </div>

        <div className="gm-panel rounded-2xl p-5 border border-[#3F7D20]/25 bg-[#E1F2D9]/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#3F7D20]">
              Vendor Earnings
            </span>

            <CheckCircle2 className="w-5 h-5 text-[#3F7D20]" />
          </div>

          <p className="text-2xl font-black text-[#3F7D20] mt-3 font-mono">
            {loading ? "—" : formatCurrency(summary?.totalVendorEarnings)}
          </p>

          <p className="text-[10px] text-[#606460] mt-1">
            Amount recorded as payable to vendor
          </p>
        </div>

        <div className="gm-panel rounded-2xl p-5 border border-[#FFF0D5] bg-[#FFF0D5]/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A66A08]">
              Pending Settlement
            </span>

            <Clock className="w-5 h-5 text-[#A66A08]" />
          </div>

          <p className="text-2xl font-black text-[#A66A08] mt-3 font-mono">
            {loading ? "—" : formatCurrency(summary?.pendingSettlementAmount)}
          </p>

          <p className="text-[10px] text-[#606460] mt-1">
            Awaiting bank settlement
          </p>
        </div>
      </section>

      {/* SETTLED SUMMARY */}
      <section className="rounded-3xl border border-[#3F7D20]/25 bg-[#F6FBF3] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#3F7D20]">
              Settled to Bank
            </p>

            <p className="text-2xl font-black text-[#3F7D20] mt-1 font-mono">
              {loading ? "—" : formatCurrency(summary?.settledDisbursedAmount)}
            </p>

            <p className="text-[10px] text-[#606460] mt-1">
              Total amount represented by settled vendor transactions.
            </p>
          </div>

          <Link
            to="/vendor/settlements"
            className="btn-gm-secondary px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 self-start"
          >
            View Settlements
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* FILTERS */}
      <section className="gm-panel rounded-2xl border border-[#D9E2EA] p-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92] pointer-events-none" />

            <input
              type="text"
              placeholder="Search transaction ID, order ID, customer, UTR..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full gm-input pl-10 pr-4 py-2.5 rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {[
              {
                key: "ALL",
                label: "All Transactions",
              },
              {
                key: SETTLEMENT_STATUS.PROCESSED,
                label: "Settled",
              },
              {
                key: SETTLEMENT_STATUS.SETTLED,
                label: "Settled",
              },
              {
                key: SETTLEMENT_STATUS.PENDING,
                label: "Pending",
              },
              {
                key: SETTLEMENT_STATUS.HOLD,
                label: "On Hold",
              },
            ]
              .filter(
                (pill, index, array) =>
                  array.findIndex((item) => item.key === pill.key) === index,
              )
              .map((pill) => (
                <button
                  key={pill.key}
                  type="button"
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
      </section>

      {/* TRANSACTION HISTORY */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-black text-[#173885]">
              Payment Transaction History
            </h2>

            <p className="text-[11px] text-[#606460] mt-0.5">
              Every financial transaction recorded for your vendor account.
            </p>
          </div>

          <span className="text-[10px] font-mono text-[#6F8A92]">
            {filteredTransactions.length} records
          </span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="gm-panel rounded-2xl h-20 animate-pulse bg-[#E4EEF3]"
              />
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="gm-panel p-14 rounded-3xl border border-[#D9E2EA] text-center">
            <ReceiptIndianRupee className="w-9 h-9 mx-auto text-[#6F8A92]" />

            <h3 className="text-sm font-bold text-[#173885] mt-3">
              No payment transactions found
            </h3>

            <p className="text-xs text-[#606460] mt-1">
              Payment transactions will appear here after successful customer
              orders are recorded.
            </p>
          </div>
        ) : (
          <div className="gm-panel rounded-3xl overflow-hidden border border-[#D9E2EA] bg-[#FEFEFE]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#E4EEF3] text-[#173885] font-bold border-b border-[#D9E2EA]">
                  <tr>
                    <th className="p-4 min-w-[220px]">
                      Transaction & Order Ref
                    </th>

                    <th className="p-4 min-w-[140px]">Customer</th>

                    <th className="p-4 text-right min-w-[140px]">
                      Product Subtotal
                    </th>

                    <th className="p-4 text-right min-w-[150px]">
                      Vendor Amount
                    </th>

                    <th className="p-4 min-w-[150px]">Payment Mode</th>

                    <th className="p-4 min-w-[180px]">Settlement</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#D9E2EA]">
                  {filteredTransactions.map((transaction) => (
                    <tr
                      key={
                        transaction.id ||
                        transaction.orderId ||
                        `${transaction.createdAt}-${transaction.customerRef}`
                      }
                      className="hover:bg-[#F4F6FA]/70 transition"
                    >
                      {/* TRANSACTION / ORDER */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="font-mono font-bold text-[#173885] break-all">
                            {transaction.id || "Transaction unavailable"}
                          </div>

                          {transaction.orderId ? (
                            <Link
                              to={`/vendor/orders/${encodeURIComponent(
                                transaction.orderId,
                              )}`}
                              className="text-[10px] text-[#3C7DDA] hover:underline font-mono break-all inline-flex items-center gap-1"
                            >
                              {transaction.orderId}
                              <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          ) : (
                            <span className="text-[10px] text-[#B43D20]">
                              Order reference unavailable
                            </span>
                          )}

                          <p className="text-[9px] text-[#6F8A92]">
                            {formatDateTime(transaction.createdAt)}
                          </p>
                        </div>
                      </td>

                      {/* CUSTOMER */}
                      <td className="p-4 text-[#282926]">
                        <span className="block max-w-[180px] truncate">
                          {transaction.customerRef || "Customer"}
                        </span>
                      </td>

                      {/* PRODUCT SUBTOTAL */}
                      <td className="p-4 text-right font-mono font-bold text-[#282926] whitespace-nowrap">
                        ₹{transaction.productSubtotal || "0.00"}
                      </td>

                      {/* VENDOR AMOUNT */}
                      <td className="p-4 text-right font-mono font-black text-sm text-[#3F7D20] whitespace-nowrap">
                        ₹{transaction.vendorPayableAmount || "0.00"}
                      </td>

                      {/* PAYMENT MODE */}
                      <td className="p-4 text-[#606460] text-[11px]">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#F4F6FA] border border-[#D9E2EA]">
                          {transaction.paymentMethod || "—"}
                        </span>
                      </td>

                      {/* SETTLEMENT */}
                      <td className="p-4">
                        <div className="space-y-1.5">
                          <span
                            className={`px-2.5 py-1 rounded-full border text-[9px] font-black inline-flex items-center gap-1 ${getSettlementClasses(
                              transaction.settlementStatus,
                            )}`}
                          >
                            {transaction.settlementStatus ===
                              SETTLEMENT_STATUS.PENDING && (
                              <Clock className="w-3 h-3" />
                            )}

                            {(transaction.settlementStatus ===
                              SETTLEMENT_STATUS.PROCESSED ||
                              transaction.settlementStatus ===
                                SETTLEMENT_STATUS.SETTLED) && (
                              <CheckCircle2 className="w-3 h-3" />
                            )}

                            {getSettlementLabel(transaction.settlementStatus)}
                          </span>

                          {transaction.utrNumber && (
                            <span className="block text-[9px] text-[#6F8A92] font-mono break-all">
                              UTR: {transaction.utrNumber}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
