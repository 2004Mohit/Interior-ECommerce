import React, { useState, useEffect } from "react";
import {
  Banknote,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { adminFinanceService } from "../../services/adminFinanceService";
import { AdminPermissionGuard } from "./AdminPermissionGuard";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";
import { SeoHead } from "../common/SeoHead";

export const AdminSettlementsView = () => {
  const [data, setData] = useState({
    pendingBatches: [],
    pastSettlements: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Settlement Processing Modal
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [bankUtr, setBankUtr] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await adminFinanceService.getSettlementOverview();

      setData({
        pendingBatches: res?.pendingBatches || [],
        pastSettlements: res?.pastSettlements || [],
      });
    } catch (err) {
      setError(err?.message || "Failed to load vendor settlement batches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProcessSubmit = async (e) => {
    e.preventDefault();

    const trimmedUtr = bankUtr.trim();

    if (!trimmedUtr) {
      setError(
        "A valid bank UTR / IMPS reference number is strictly required.",
      );
      return;
    }

    if (!selectedBatch?.vendorId) {
      setError("Vendor settlement information is missing.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setActionSuccess(null);

    try {
      const res = await adminFinanceService.processSettlement({
        vendorId: selectedBatch.vendorId,
        bankReferenceUtr: trimmedUtr,
        notes: notes.trim(),
      });

      setActionSuccess(
        `Settlement batch ${res?.batchId || "processed"} of ${formatCurrency(
          res?.disbursedAmount,
        )} processed successfully (UTR: ${trimmedUtr}).`,
      );

      setSelectedBatch(null);
      setBankUtr("");
      setNotes("");

      await loadData();
    } catch (err) {
      setError(err?.message || "Settlement disbursal failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val) =>
    `₹${Number(val || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.MANAGE_SETTLEMENTS}>
      <div className="space-y-8 pb-20 font-sans">
        <SeoHead
          title="Bank Settlements & Disbursals | Ferrado Admin"
          description="Process verified vendor bank disbursals with UTR confirmation and settlement reconciliation."
          canonicalUrl="/admin/settlements"
          noIndex={true}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
          <div>
            <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Banking & Disbursals Desk
            </span>

            <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
              Vendor Bank Settlements
            </h1>

            <p className="text-xs text-[#606460]">
              Review pending vendor balances and record bank disbursals with UTR
              confirmation.
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
          >
            <RotateCcw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span>Refresh Ledger</span>
          </button>
        </div>

        {/* Success Message */}
        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Pending Disbursals Queue */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#173885] flex items-center gap-2">
              <Banknote className="w-5 h-5 text-[#3C7DDA]" />

              <span>
                Pending Disbursal Batches ({data.pendingBatches.length})
              </span>
            </h2>

            <span className="text-xs text-[#606460]">
              Current vendor payable balance
            </span>
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-[#FEFEFE] rounded-2xl border border-[#D9E2EA]"
                />
              ))}
            </div>
          ) : data.pendingBatches.length === 0 ? (
            <div className="gm-panel p-8 rounded-3xl border border-[#D9E2EA] text-center space-y-1.5 bg-[#FEFEFE]">
              <CheckCircle2 className="w-8 h-8 text-[#3F7D20] mx-auto" />

              <h3 className="text-sm font-bold text-[#173885]">
                No Pending Settlements
              </h3>

              <p className="text-xs text-[#606460]">
                All vendor transaction balances have been disbursed.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.pendingBatches.map((batch) => (
                <div
                  key={batch.vendorId}
                  className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-3 shadow-2xs hover:border-[#3C7DDA] transition"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-[#D9E2EA] pb-3">
                    <div>
                      <span className="font-bold text-sm text-[#173885] block">
                        {batch.businessName || "Vendor"}
                      </span>

                      <span className="text-[11px] text-[#606460]">
                        {batch.pendingOrdersCount}{" "}
                        {batch.pendingOrdersCount === 1 ? "Order" : "Orders"}{" "}
                        Pending Disbursal
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#6F8A92] uppercase block">
                        Disbursable Amount
                      </span>

                      <span className="text-lg font-black font-mono text-[#3F7D20]">
                        {formatCurrency(batch.pendingAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-[#606460] bg-[#F4F6FA] p-3 rounded-xl space-y-1 font-mono">
                    <div>
                      <strong className="text-[#282926] font-sans">
                        Bank:
                      </strong>{" "}
                      {batch.bankDetails?.bankName ||
                        "Bank details unavailable"}
                    </div>

                    <div>
                      <strong className="text-[#282926] font-sans">
                        Account:
                      </strong>{" "}
                      {batch.bankDetails?.accountNumber ||
                        "Account number unavailable"}
                      {batch.bankDetails?.ifscCode
                        ? ` (${batch.bankDetails.ifscCode})`
                        : ""}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBatch(batch);
                      setBankUtr("");
                      setNotes("");
                      setError(null);
                      setActionSuccess(null);
                    }}
                    className="btn-gm-primary w-full py-2 rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Banknote className="w-4 h-4 text-[#FEFEFE]" />
                    <span>Disburse & Record UTR</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Historical Disbursals Ledger */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-3">
            <h2 className="text-base font-bold text-[#173885]">
              Disbursed Settlement History
            </h2>

            <span className="text-xs font-mono text-[#6F8A92]">
              {data.pastSettlements.length} Batches Processed
            </span>
          </div>

          {data.pastSettlements.length === 0 ? (
            <p className="text-xs text-[#606460] py-6 text-center">
              No past settlement records found.
            </p>
          ) : (
            <div className="gm-panel rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F4F6FA] border-b border-[#D9E2EA] text-[10px] font-bold uppercase text-[#6F8A92]">
                    <tr>
                      <th className="p-4">Batch ID</th>
                      <th className="p-4">Vendor</th>
                      <th className="p-4">Disbursed Amount</th>
                      <th className="p-4">Bank UTR Reference</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Disbursed At</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#D9E2EA]">
                    {data.pastSettlements.map((settlement) => (
                      <tr
                        key={settlement.id}
                        className="hover:bg-[#F4F6FA]/50 transition"
                      >
                        <td className="p-4 font-mono font-bold text-[#173885]">
                          {settlement.batch_reference_id ||
                            settlement.id ||
                            "—"}
                        </td>

                        <td className="p-4 font-semibold text-[#282926]">
                          {settlement.vendor?.business_name || "Vendor"}
                        </td>

                        <td className="p-4 font-mono font-black text-sm text-[#3F7D20]">
                          {formatCurrency(settlement.net_disbursed_amount)}
                        </td>

                        <td className="p-4 font-mono text-[11px] text-[#282926]">
                          <span className="bg-[#F4F6FA] px-2 py-0.5 rounded border border-[#D9E2EA]">
                            {settlement.bank_reference_utr || "—"}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30">
                            {settlement.status || "PROCESSED"}
                          </span>
                        </td>

                        <td className="p-4 font-mono text-[11px] text-[#6F8A92]">
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

        {/* Process Settlement Modal */}
        {selectedBatch && (
          <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-md p-6 sm:p-8 rounded-3xl relative shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-[#D9E2EA] pb-3">
                <div>
                  <h3 className="text-lg font-black text-[#173885]">
                    Record Bank Disbursal
                  </h3>

                  <span className="text-xs text-[#606460]">
                    {selectedBatch.businessName || "Vendor"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!submitting) {
                      setSelectedBatch(null);
                    }
                  }}
                  disabled={submitting}
                  className="text-[#606460] hover:text-[#282926] disabled:opacity-50"
                  aria-label="Close settlement modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#E1F2D9]/40 border border-[#3F7D20]/30 space-y-1 text-xs">
                <span className="text-[10px] font-bold text-[#3F7D20] uppercase block">
                  Total Amount to Transfer
                </span>

                <p className="text-2xl font-black font-mono text-[#3F7D20]">
                  {formatCurrency(selectedBatch.pendingAmount)}
                </p>

                <span className="text-[10px] text-[#606460] block font-mono">
                  {selectedBatch.bankDetails?.bankName || "Bank"} • A/C{" "}
                  {selectedBatch.bankDetails?.accountNumber || "Unavailable"} •
                  IFSC {selectedBatch.bankDetails?.ifscCode || "Unavailable"}
                </span>
              </div>

              <form onSubmit={handleProcessSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Bank IMPS / NEFT UTR Reference Number *
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="e.g. CMS9829012384729"
                    value={bankUtr}
                    onChange={(e) => setBankUtr(e.target.value)}
                    className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Settlement Notes (Optional)
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. Pune regional batch disbursal"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBatch(null)}
                    disabled={submitting}
                    className="btn-gm-secondary px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-gm-primary px-5 py-2 rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
                  >
                    <span>
                      {submitting ? "Processing..." : "Confirm Disbursal"}
                    </span>
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
