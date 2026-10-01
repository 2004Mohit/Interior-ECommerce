import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Search,
  RotateCcw,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  FileText,
  ArrowUpRight,
  AlertCircle,
  WalletCards,
  ReceiptIndianRupee,
} from "lucide-react";

import { useVendorAuth } from "../../context/VendorAuthContext";

import {
  vendorFinancialService,
  SETTLEMENT_STATUS,
} from "../../services/vendorFinancialService";

import { SeoHead } from "../common/SeoHead";

const AUTO_REFRESH_MS = 30000;

export const VendorSettlements = () => {
  const { vendorUser } = useVendorAuth();

  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadSettlements = useCallback(
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
        const data = await vendorFinancialService.getSettlementBatches();

        setSettlements(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load vendor settlements:", err);

        setError(err?.message || "Unable to load settlement history.");
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

    loadSettlements();

    const interval = window.setInterval(() => {
      loadSettlements();
    }, AUTO_REFRESH_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [vendorUser?.id, loadSettlements]);

  const filteredSettlements = useMemo(() => {
    const query = search.trim().toLowerCase();

    return settlements.filter((settlement) => {
      const searchableText = [
        settlement.id,
        settlement.batchReferenceId,
        settlement.utrNumber,
        settlement.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      const matchesStatus =
        statusFilter === "ALL" || settlement.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [settlements, search, statusFilter]);

  const totalDisbursed = settlements.reduce(
    (sum, settlement) => sum + Number(settlement.netDisbursedAmount || 0),
    0,
  );

  const totalOrders = settlements.reduce(
    (sum, settlement) => sum + Number(settlement.orderCount || 0),
    0,
  );

  const latestSettlement = settlements[0] || null;

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

  const getStatusLabel = (status) => {
    if (status === SETTLEMENT_STATUS.PROCESSED) {
      return "PROCESSED";
    }

    if (status === SETTLEMENT_STATUS.HOLD) {
      return "ON HOLD";
    }

    return status || "UNKNOWN";
  };

  const getStatusClasses = (status) => {
    if (status === SETTLEMENT_STATUS.PROCESSED) {
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
        title="Vendor Settlements | Ferrado"
        description="Track vendor bank settlements, disbursals and UTR references."
        canonicalUrl="/vendor/settlements"
        noIndex={true}
      />

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div>
          <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Bank Disbursal Batches
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-2">
            Vendor Settlements
          </h1>

          <p className="text-xs text-[#606460] mt-1 max-w-2xl">
            Track completed bank disbursals, settlement batches and UTR
            references.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadSettlements(true)}
          disabled={loading || refreshing}
          className="btn-gm-secondary px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 self-start lg:self-auto disabled:opacity-50"
        >
          <RotateCcw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />

          <div>
            <p className="text-xs font-bold">
              Settlement data could not be loaded
            </p>

            <p className="text-[11px] mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* SUMMARY */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="gm-panel rounded-2xl p-5 border border-[#D9E2EA]">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F8A92]">
              Total Settlements
            </span>

            <ReceiptIndianRupee className="w-5 h-5 text-[#173885]" />
          </div>

          <p className="text-2xl font-black text-[#173885] mt-3 font-mono">
            {loading ? "—" : settlements.length}
          </p>
        </div>

        <div className="gm-panel rounded-2xl p-5 border border-[#3F7D20]/25 bg-[#E1F2D9]/20">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#3F7D20]">
              Total Disbursed
            </span>

            <WalletCards className="w-5 h-5 text-[#3F7D20]" />
          </div>

          <p className="text-2xl font-black text-[#3F7D20] mt-3 font-mono">
            {loading ? "—" : formatCurrency(totalDisbursed)}
          </p>
        </div>

        <div className="gm-panel rounded-2xl p-5 border border-[#D9E2EA]">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F8A92]">
              Latest Settlement
            </span>

            <CheckCircle2 className="w-5 h-5 text-[#3F7D20]" />
          </div>

          <p className="text-sm font-black text-[#173885] mt-3">
            {loading
              ? "—"
              : formatDateTime(
                  latestSettlement?.processedAt || latestSettlement?.createdAt,
                )}
          </p>

          <p className="text-[10px] text-[#6F8A92] mt-1">
            Most recent bank disbursal
          </p>
        </div>

        <div className="gm-panel rounded-2xl p-5 border border-[#D9E2EA]">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F8A92]">
              Orders Settled
            </span>

            <FileText className="w-5 h-5 text-[#173885]" />
          </div>

          <p className="text-2xl font-black text-[#173885] mt-3 font-mono">
            {loading ? "—" : totalOrders}
          </p>
        </div>
      </section>

      {/* LATEST SETTLEMENT */}
      {latestSettlement && (
        <section className="rounded-3xl border border-[#3F7D20]/25 bg-[#F6FBF3] p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#E1F2D9] text-[#3F7D20] flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#3F7D20]">
                  Latest Settlement
                </p>

                <h2 className="text-base font-black text-[#173885] mt-1">
                  {latestSettlement.batchReferenceId}
                </h2>

                <p className="text-xs text-[#606460] mt-1">
                  {formatDateTime(
                    latestSettlement.processedAt || latestSettlement.createdAt,
                  )}
                </p>
              </div>
            </div>

            <div className="text-left lg:text-right">
              <p className="text-[10px] uppercase text-[#6F8A92]">
                Net Disbursed
              </p>

              <p className="text-2xl font-black font-mono text-[#3F7D20]">
                {formatCurrency(latestSettlement.netDisbursedAmount)}
              </p>

              {latestSettlement.utrNumber && (
                <p className="text-[10px] font-mono text-[#606460] mt-1">
                  UTR: {latestSettlement.utrNumber}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* FILTERS */}
      <section className="gm-panel rounded-2xl border border-[#D9E2EA] p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92]" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search batch ID or UTR..."
              className="w-full gm-input pl-9 pr-3 py-2.5 rounded-xl text-xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="gm-input px-3 py-2.5 rounded-xl text-xs md:w-44"
          >
            <option value="ALL">All Statuses</option>
            <option value={SETTLEMENT_STATUS.PROCESSED}>Processed</option>
            <option value={SETTLEMENT_STATUS.HOLD}>On Hold</option>
          </select>
        </div>
      </section>

      {/* TABLE */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-[#173885]">
              Settlement History
            </h2>

            <p className="text-[11px] text-[#606460] mt-0.5">
              Bank disbursals recorded against your vendor account.
            </p>
          </div>

          <span className="text-[10px] font-mono text-[#6F8A92]">
            {filteredSettlements.length} records
          </span>
        </div>

        {loading ? (
          <div className="gm-panel rounded-3xl border border-[#D9E2EA] p-10 text-center">
            <RotateCcw className="w-6 h-6 animate-spin mx-auto text-[#3C7DDA]" />
            <p className="text-xs text-[#606460] mt-3">
              Loading settlement history...
            </p>
          </div>
        ) : filteredSettlements.length === 0 ? (
          <div className="gm-panel rounded-3xl border border-[#D9E2EA] p-10 text-center">
            <Banknote className="w-8 h-8 mx-auto text-[#6F8A92]" />

            <h3 className="text-sm font-bold text-[#173885] mt-3">
              No settlement records found
            </h3>

            <p className="text-xs text-[#606460] mt-1">
              Completed vendor bank disbursals will appear here.
            </p>
          </div>
        ) : (
          <div className="gm-panel rounded-3xl border border-[#D9E2EA] overflow-hidden bg-[#FEFEFE]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F6FA] border-b border-[#D9E2EA]">
                  <tr className="text-[10px] uppercase font-bold text-[#6F8A92]">
                    <th className="p-4">Settlement</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Orders</th>
                    <th className="p-4">Sales Value</th>
                    <th className="p-4">Amount Disbursed</th>
                    <th className="p-4">UTR</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#D9E2EA]">
                  {filteredSettlements.map((settlement) => (
                    <tr
                      key={settlement.settlementId || settlement.id}
                      className="hover:bg-[#F4F6FA]/50 transition"
                    >
                      <td className="p-4">
                        <p className="font-mono font-black text-[#173885]">
                          {settlement.batchReferenceId}
                        </p>

                        {settlement.notes && (
                          <p className="text-[10px] text-[#6F8A92] mt-1 max-w-[180px] truncate">
                            {settlement.notes}
                          </p>
                        )}
                      </td>

                      <td className="p-4 text-[#606460] whitespace-nowrap">
                        {formatDateTime(
                          settlement.processedAt || settlement.createdAt,
                        )}
                      </td>

                      <td className="p-4 font-mono font-bold text-[#282926]">
                        {settlement.orderCount}
                      </td>

                      <td className="p-4 font-mono text-[#282926]">
                        {formatCurrency(settlement.grossProductSubtotal)}
                      </td>

                      <td className="p-4 font-mono font-black text-[#3F7D20]">
                        {formatCurrency(settlement.netDisbursedAmount)}
                      </td>

                      <td className="p-4">
                        {settlement.utrNumber ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F4F6FA] border border-[#D9E2EA] font-mono text-[10px] text-[#282926]">
                            {settlement.utrNumber}
                          </span>
                        ) : (
                          <span className="text-[#6F8A92]">—</span>
                        )}
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full border text-[9px] font-black ${getStatusClasses(
                            settlement.status,
                          )}`}
                        >
                          {getStatusLabel(settlement.status)}
                        </span>
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
