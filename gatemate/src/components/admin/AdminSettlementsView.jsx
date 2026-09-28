import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  Banknote,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Building2,
  ShieldCheck,
  Clock,
  ReceiptIndianRupee,
  CircleDollarSign,
  WalletCards,
  Search,
} from "lucide-react";

import { adminFinanceService } from "../../services/adminFinanceService";

import { AdminPermissionGuard } from "./AdminPermissionGuard";

import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";

import { SeoHead } from "../common/SeoHead";

const AUTO_REFRESH_MS = 30000;

export const AdminSettlementsView = () => {
  const [data, setData] = useState({
    pendingBatches: [],
    pastSettlements: [],
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const [selectedBatch, setSelectedBatch] = useState(null);

  const [bankUtr, setBankUtr] = useState("");

  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");

  const loadData = useCallback(async (manual = false) => {
    if (manual) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const result = await adminFinanceService.getSettlementOverview();

      setData(result);
    } catch (err) {
      console.error("Failed to load settlements:", err);

      setError(err?.message || "Failed to load settlement data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const interval = window.setInterval(() => {
      loadData();
    }, AUTO_REFRESH_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadData]);

  const filteredHistory = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      return data.pastSettlements;
    }

    return data.pastSettlements.filter((settlement) => {
      const text = [
        settlement.batch_reference_id,
        settlement.utr_number,
        settlement.vendor?.business_name,
        settlement.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(q);
    });
  }, [data.pastSettlements, search]);

  const totalPending = data.pendingBatches.reduce(
    (sum, batch) => sum + Number(batch.pendingAmount || 0),
    0,
  );

  const totalPendingOrders = data.pendingBatches.reduce(
    (sum, batch) => sum + Number(batch.pendingOrdersCount || 0),
    0,
  );

  const totalPendingGross = data.pendingBatches.reduce(
    (sum, batch) => sum + Number(batch.grossProductSubtotal || 0),
    0,
  );

  const totalPendingCommission = data.pendingBatches.reduce(
    (sum, batch) => sum + Number(batch.totalCommission || 0),
    0,
  );

  const totalProcessed = data.pastSettlements.reduce(
    (sum, settlement) => sum + Number(settlement.net_disbursed_amount || 0),
    0,
  );

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const maskAccount = (value) => {
    if (!value) return "Not provided";

    const account = String(value);

    if (account.length <= 4) {
      return `••••${account}`;
    }

    return `••••••${account.slice(-4)}`;
  };

  const handleProcessSubmit = async (event) => {
    event.preventDefault();

    const cleanUtr = bankUtr.trim();

    if (!cleanUtr) {
      setError("A valid bank UTR / IMPS reference number is required.");
      return;
    }

    if (!selectedBatch?.vendorId) {
      setError("No vendor settlement batch is selected.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setActionSuccess(null);

    try {
      const result = await adminFinanceService.processSettlement({
        vendorId: selectedBatch.vendorId,

        bankReferenceUtr: cleanUtr,

        notes,
      });

      setActionSuccess(
        `Settlement ${result.batchId} processed successfully. ₹${Number(
          result.disbursedAmount || 0,
        ).toLocaleString("en-IN")} recorded against UTR ${result.utr}.`,
      );

      setSelectedBatch(null);
      setBankUtr("");
      setNotes("");

      await loadData(true);
    } catch (err) {
      console.error("Settlement processing failed:", err);

      setError(err?.message || "Settlement processing failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.MANAGE_SETTLEMENTS}>
      <div className="space-y-7 pb-24 font-sans">
        <SeoHead
          title="Vendor Settlements | Ferrado Admin"
          description="Manage vendor bank settlements, platform commissions and UTR reconciliation."
          canonicalUrl="/admin/settlements"
          noIndex={true}
        />

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
          <div>
            <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Banking & Disbursals Desk
            </span>

            <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-2">
              Vendor Settlements
            </h1>

            <p className="text-xs text-[#606460] mt-1 max-w-2xl">
              Reconcile vendor payable amounts, record bank disbursals and
              maintain UTR-backed settlement history.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            className="btn-gm-secondary px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 self-start lg:self-auto disabled:opacity-50"
          >
            <RotateCcw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />

            {refreshing ? "Refreshing..." : "Refresh Ledger"}
          </button>
        </div>

        {/* ALERTS */}
        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* SUMMARY */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="gm-panel rounded-2xl p-5 border border-[#D9E2EA]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#6F8A92]">
                Pending Vendors
              </span>

              <Building2 className="w-5 h-5 text-[#173885]" />
            </div>

            <p className="text-2xl font-black font-mono text-[#173885] mt-3">
              {loading ? "—" : data.pendingBatches.length}
            </p>
          </div>

          <div className="gm-panel rounded-2xl p-5 border border-[#A66A08]/25 bg-[#FFF9EF]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#A66A08]">
                Pending Disbursal
              </span>

              <Clock className="w-5 h-5 text-[#A66A08]" />
            </div>

            <p className="text-2xl font-black font-mono text-[#A66A08] mt-3">
              {loading ? "—" : formatCurrency(totalPending)}
            </p>

            <p className="text-[10px] text-[#6F8A92] mt-1">
              {totalPendingOrders} pending orders
            </p>
          </div>

          <div className="gm-panel rounded-2xl p-5 border border-[#3F7D20]/25 bg-[#E1F2D9]/20">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#3F7D20]">
                Processed Disbursals
              </span>

              <WalletCards className="w-5 h-5 text-[#3F7D20]" />
            </div>

            <p className="text-2xl font-black font-mono text-[#3F7D20] mt-3">
              {loading ? "—" : formatCurrency(totalProcessed)}
            </p>
          </div>

          <div className="gm-panel rounded-2xl p-5 border border-[#D9E2EA]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#6F8A92]">
                Pending Commission
              </span>

              <CircleDollarSign className="w-5 h-5 text-[#A66A08]" />
            </div>

            <p className="text-2xl font-black font-mono text-[#A66A08] mt-3">
              {loading ? "—" : formatCurrency(totalPendingCommission)}
            </p>

            <p className="text-[10px] text-[#6F8A92] mt-1">
              From ₹{Number(totalPendingGross).toLocaleString("en-IN")} gross
              subtotal
            </p>
          </div>
        </section>

        {/* PENDING QUEUE */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-black text-[#173885] flex items-center gap-2">
                <Banknote className="w-5 h-5 text-[#3C7DDA]" />
                Pending Disbursal Queue
              </h2>

              <p className="text-[11px] text-[#606460] mt-1">
                Vendor payable = Product Subtotal − 5% platform commission.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="h-64 rounded-2xl bg-[#F4F6FA] border border-[#D9E2EA] animate-pulse"
                />
              ))}
            </div>
          ) : data.pendingBatches.length === 0 ? (
            <div className="gm-panel rounded-3xl border border-[#3F7D20]/25 bg-[#F6FBF3] p-10 text-center">
              <CheckCircle2 className="w-9 h-9 mx-auto text-[#3F7D20]" />

              <h3 className="text-sm font-black text-[#173885] mt-3">
                No Pending Settlements
              </h3>

              <p className="text-xs text-[#606460] mt-1">
                All currently eligible vendor balances have been processed.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {data.pendingBatches.map((batch) => (
                <div
                  key={batch.vendorId}
                  className="gm-panel rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] p-5 space-y-4 hover:border-[#3C7DDA] transition"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-[#D9E2EA] pb-4">
                    <div>
                      <h3 className="text-sm font-black text-[#173885]">
                        {batch.businessName}
                      </h3>

                      <p className="text-[11px] text-[#606460] mt-1">
                        {batch.pendingOrdersCount}{" "}
                        {batch.pendingOrdersCount === 1 ? "order" : "orders"}{" "}
                        awaiting settlement
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[9px] uppercase font-bold text-[#6F8A92]">
                        Net Payable
                      </p>

                      <p className="text-lg font-black font-mono text-[#3F7D20]">
                        {formatCurrency(batch.pendingAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-[#F4F6FA] p-3">
                      <p className="text-[9px] uppercase text-[#6F8A92]">
                        Gross
                      </p>

                      <p className="text-xs font-bold font-mono text-[#282926] mt-1">
                        {formatCurrency(batch.grossProductSubtotal)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#FFF9EF] p-3">
                      <p className="text-[9px] uppercase text-[#A66A08]">
                        Commission
                      </p>

                      <p className="text-xs font-bold font-mono text-[#A66A08] mt-1">
                        {formatCurrency(batch.totalCommission)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#F6FBF3] p-3">
                      <p className="text-[9px] uppercase text-[#3F7D20]">
                        Payable
                      </p>

                      <p className="text-xs font-bold font-mono text-[#3F7D20] mt-1">
                        {formatCurrency(batch.pendingAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#F4F6FA] border border-[#D9E2EA] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-[#173885]" />

                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#6F8A92]">
                        Registered Bank Account
                      </span>
                    </div>

                    <p className="text-xs font-bold text-[#282926]">
                      {batch.bankDetails?.bankName ||
                        "Bank details not provided"}
                    </p>

                    <p className="text-[11px] font-mono text-[#606460] mt-1">
                      A/C {maskAccount(batch.bankDetails?.accountNumber)} • IFSC{" "}
                      {batch.bankDetails?.ifscCode || "—"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBatch(batch);
                      setBankUtr("");
                      setNotes("");
                      setError(null);
                    }}
                    className="btn-gm-primary w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Banknote className="w-4 h-4" />
                    Record Bank Disbursal
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* HISTORY */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-[#173885]">
                Settlement History
              </h2>

              <p className="text-[11px] text-[#606460] mt-1">
                Completed bank disbursals and UTR references.
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6F8A92]" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search vendor / batch / UTR"
                className="gm-input pl-8 pr-3 py-2 rounded-xl text-xs w-full sm:w-64"
              />
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="gm-panel rounded-3xl border border-[#D9E2EA] p-8 text-center">
              <p className="text-xs text-[#606460]">
                No processed settlement records found.
              </p>
            </div>
          ) : (
            <div className="gm-panel rounded-3xl border border-[#D9E2EA] overflow-hidden bg-[#FEFEFE]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F4F6FA] border-b border-[#D9E2EA]">
                    <tr className="text-[10px] uppercase font-bold text-[#6F8A92]">
                      <th className="p-4">Batch</th>
                      <th className="p-4">Vendor</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">UTR</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Date</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#D9E2EA]">
                    {filteredHistory.map((settlement) => (
                      <tr key={settlement.id} className="hover:bg-[#F4F6FA]/50">
                        <td className="p-4">
                          <span className="font-mono font-black text-[#173885]">
                            {settlement.batch_reference_id || settlement.id}
                          </span>
                        </td>

                        <td className="p-4 font-semibold text-[#282926]">
                          {settlement.vendor?.business_name || "Vendor"}
                        </td>

                        <td className="p-4 font-mono font-black text-[#3F7D20]">
                          {formatCurrency(settlement.net_disbursed_amount)}
                        </td>

                        <td className="p-4">
                          <span className="font-mono text-[10px] bg-[#F4F6FA] border border-[#D9E2EA] px-2 py-1 rounded-lg">
                            {settlement.utr_number || "—"}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full text-[9px] font-black bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30">
                            {settlement.status || "PROCESSED"}
                          </span>
                        </td>

                        <td className="p-4 text-[10px] font-mono text-[#6F8A92] whitespace-nowrap">
                          {settlement.settled_at || settlement.created_at
                            ? new Date(
                                settlement.settled_at || settlement.created_at,
                              ).toLocaleString("en-IN")
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* MODAL */}
        {selectedBatch && (
          <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#FEFEFE] w-full max-w-lg rounded-3xl border border-[#D9E2EA] shadow-2xl p-6 space-y-5">
              <div className="flex items-start justify-between gap-4 border-b border-[#D9E2EA] pb-4">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-[#3C7DDA]">
                    Settlement Authorization
                  </p>

                  <h3 className="text-lg font-black text-[#173885] mt-1">
                    Record Bank Disbursal
                  </h3>

                  <p className="text-xs text-[#606460] mt-1">
                    {selectedBatch.businessName}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedBatch(null)}
                  disabled={submitting}
                  className="text-[#606460] hover:text-[#282926]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="rounded-2xl bg-[#F6FBF3] border border-[#3F7D20]/25 p-5">
                <p className="text-[10px] uppercase font-bold text-[#3F7D20]">
                  Amount to Transfer
                </p>

                <p className="text-3xl font-black font-mono text-[#3F7D20] mt-2">
                  {formatCurrency(selectedBatch.pendingAmount)}
                </p>

                <p className="text-[10px] text-[#606460] mt-2">
                  {selectedBatch.pendingOrdersCount} orders • 5% platform
                  commission already deducted
                </p>
              </div>

              <div className="rounded-2xl bg-[#F4F6FA] border border-[#D9E2EA] p-4">
                <p className="text-[10px] uppercase font-bold text-[#6F8A92]">
                  Registered Bank
                </p>

                <p className="text-xs font-bold text-[#282926] mt-1">
                  {selectedBatch.bankDetails?.bankName || "Bank"}
                </p>

                <p className="text-[11px] font-mono text-[#606460] mt-1">
                  A/C {maskAccount(selectedBatch.bankDetails?.accountNumber)} •
                  IFSC {selectedBatch.bankDetails?.ifscCode || "—"}
                </p>
              </div>

              <form onSubmit={handleProcessSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1.5">
                    Bank IMPS / NEFT UTR Reference Number *
                  </label>

                  <input
                    type="text"
                    required
                    value={bankUtr}
                    onChange={(event) => setBankUtr(event.target.value)}
                    placeholder="Enter actual bank UTR / reference"
                    className="w-full gm-input px-3.5 py-3 rounded-xl text-xs font-mono font-bold"
                  />

                  <p className="text-[10px] text-[#6F8A92] mt-1.5">
                    For a real settlement, enter the reference generated by the
                    bank/payment provider.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1.5">
                    Settlement Notes
                  </label>

                  <input
                    type="text"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Optional reconciliation note"
                    className="w-full gm-input px-3.5 py-3 rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBatch(null)}
                    disabled={submitting}
                    className="btn-gm-secondary px-4 py-2.5 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || !bankUtr.trim()}
                    className="btn-gm-primary px-5 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50"
                  >
                    {submitting ? "Processing..." : "Confirm Disbursal"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminPermissionGuard>
  );
};
