import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Banknote,
  Search,
  RotateCcw,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Building2,
  FileText,
  ArrowUpRight,
} from "lucide-react";
import { useVendorAuth } from "../../context/VendorAuthContext";
import {
  vendorFinancialService,
  SETTLEMENT_STATUS,
} from "../../services/vendorFinancialService";
import { SeoHead } from "../common/SeoHead";

export const VendorSettlements = () => {
  const { vendorUser } = useVendorAuth();

  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadSettlements = async () => {
    if (!vendorUser?.id) return;
    setLoading(true);
    const data = await vendorFinancialService.getSettlementBatches();
    setSettlements(data);
    setLoading(false);
  };

  useEffect(() => {
    if (vendorUser?.id) {
      loadSettlements();
    } else {
      setLoading(false);
    }
  }, [vendorUser?.id]);

  const filteredSettlements = settlements.filter((s) => {
    const matchSearch =
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      (s.utrNumber && s.utrNumber.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "ALL" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 pb-24 font-sans">
      <SeoHead
        title="Weekly Bank Settlements & UTR Payouts | Ferrado Vendor"
        description="Inspect weekly NEFT/RTGS settlement payout batches, UTR numbers, and bank disbursal logs."
        canonicalUrl="/vendor/settlements"
        noIndex={true}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div>
          <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Bank Disbursal Batches
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
            Weekly Bank Settlements
          </h1>
          <p className="text-xs text-[#606460]">
            Track NEFT / RTGS payout batches, verified UTR numbers, and settled
            wholesale funds transferred to your registered bank account.
          </p>
        </div>

        <button
          onClick={loadSettlements}
          className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh Settlements</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="gm-panel p-4 rounded-2xl border border-[#D9E2EA] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92] pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Settlement ID or UTR number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full gm-input pl-10 pr-4 py-2 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { key: "ALL", label: "All Batches" },
            { key: SETTLEMENT_STATUS.PROCESSED, label: "Processed" },
            { key: SETTLEMENT_STATUS.PENDING, label: "Pending Disbursal" },
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

      {/* Settlements Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="gm-panel p-5 rounded-2xl h-16 animate-pulse bg-[#E4EEF3]"
            />
          ))}
        </div>
      ) : filteredSettlements.length === 0 ? (
        <div className="gm-panel p-16 rounded-3xl text-center text-xs text-[#606460]">
          No settlement payout batches found.
        </div>
      ) : (
        <div className="gm-panel rounded-2xl overflow-hidden border border-[#D9E2EA]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#E4EEF3] text-[#173885] font-bold border-b border-[#D9E2EA]">
                <tr>
                  <th className="p-3.5">Batch Reference</th>
                  <th className="p-3.5">Batch Date</th>
                  <th className="p-3.5 text-center">Orders Count</th>
                  <th className="p-3.5 text-right">Disbursed Amount</th>
                  <th className="p-3.5">UTR / Bank Reference</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E2EA]">
                {filteredSettlements.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F4F6FA] transition">
                    <td className="p-3.5 font-mono font-bold text-[#173885]">
                      {s.id}
                    </td>

                    <td className="p-3.5 font-mono text-[#606460]">
                      {s.batchDate}
                    </td>

                    <td className="p-3.5 text-center font-mono font-bold text-[#282926]">
                      {s.orderCount} Order(s)
                    </td>

                    <td className="p-3.5 text-right font-mono font-black text-sm text-[#3F7D20]">
                      ₹{s.totalAmount.toLocaleString("en-IN")}
                    </td>

                    <td className="p-3.5 font-mono text-xs text-[#173885]">
                      {s.utrNumber ? (
                        <span className="font-bold">{s.utrNumber}</span>
                      ) : (
                        <span className="text-[#6F8A92] italic">
                          Awaiting clearing
                        </span>
                      )}
                    </td>

                    <td className="p-3.5">
                      {s.status === SETTLEMENT_STATUS.PROCESSED ? (
                        <span className="bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Settled
                        </span>
                      ) : (
                        <span className="bg-[#FFF0D5] text-[#A66A08] border border-[#A66A08]/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Processing
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
