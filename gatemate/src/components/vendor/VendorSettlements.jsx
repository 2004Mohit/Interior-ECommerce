import React, { useState, useEffect } from "react";
import {
  Banknote,
  CheckCircle2,
  RotateCcw,
  Building2,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  FileText,
} from "lucide-react";
import { useVendorAuth } from "../../context/VendorAuthContext";
import {
  vendorFinancialService,
  SETTLEMENT_STATUS,
} from "../../services/vendorFinancialService";
import { SeoHead } from "../common/SeoHead";

export const VendorSettlements = () => {
  const { vendorUser } = useVendorAuth();
  const vendorId = vendorUser?.id || "vnd-pune-001";

  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSettlements = async () => {
    setLoading(true);
    const data = await vendorFinancialService.getSettlementBatches(vendorId);
    setSettlements(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSettlements();
  }, [vendorId]);

  return (
    <div className="space-y-6 pb-24 font-sans">
      <SeoHead
        title="Bank Settlements & Disbursals | GateMate Vendor Portal"
        description="Weekly NEFT/RTGS bank settlement logs with UTR references and itemized commission statements."
        canonicalUrl="/vendor/settlements"
        noIndex={true}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div>
          <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Direct Bank Disbursals
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
            Bank Settlements & Payouts
          </h1>
          <p className="text-xs text-[#606460]">
            Weekly direct-to-bank NEFT/RTGS payout history for fulfilled
            construction site orders.
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

      {/* Settlements Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="gm-panel p-5 rounded-2xl h-20 animate-pulse bg-[#E4EEF3]"
            />
          ))}
        </div>
      ) : settlements.length === 0 ? (
        <div className="gm-panel p-16 rounded-3xl text-center text-xs text-[#606460]">
          No settlement batch records found.
        </div>
      ) : (
        <div className="space-y-4">
          {settlements.map((s) => (
            <div
              key={s.id}
              className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] space-y-4 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9E2EA] pb-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-[#173885] text-sm">
                      {s.id}
                    </span>
                    <span className="bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30 px-2 py-0.2 rounded-full text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Disbursed to Bank
                    </span>
                  </div>
                  <span className="text-[11px] text-[#606460] font-mono mt-0.5 block">
                    Disbursed on{" "}
                    {new Date(s.processedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="text-right">
                  <div className="font-mono font-black text-lg text-[#3F7D20]">
                    ₹{s.netDisbursedAmount.toLocaleString("en-IN")}
                  </div>
                  <span className="text-[10px] text-[#6F8A92] font-mono">
                    Bank UTR: {s.utrNumber}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-[#F4F6FA] p-3.5 rounded-2xl border border-[#D9E2EA]">
                  <span className="text-[10px] font-bold text-[#6F8A92] uppercase block">
                    Gross Product Sales
                  </span>
                  <strong className="text-sm font-black text-[#173885] font-mono">
                    ₹{s.grossProductSubtotal}
                  </strong>
                  <span className="text-[10px] text-[#606460] block mt-0.5">
                    {s.orderCount} order(s) reconciled
                  </span>
                </div>

                <div className="bg-[#F4F6FA] p-3.5 rounded-2xl border border-[#D9E2EA]">
                  <span className="text-[10px] font-bold text-[#6F8A92] uppercase block">
                    GateMate Commission (5%)
                  </span>
                  <strong className="text-sm font-black text-[#B43D20] font-mono">
                    -₹{s.totalCommissionDeducted}
                  </strong>
                  <span className="text-[10px] text-[#606460] block mt-0.5">
                    Excludes delivery & platform taxes
                  </span>
                </div>

                <div className="bg-[#F4F6FA] p-3.5 rounded-2xl border border-[#D9E2EA]">
                  <span className="text-[10px] font-bold text-[#6F8A92] uppercase block">
                    Destination Bank Account
                  </span>
                  <div className="font-bold text-[#282926] mt-0.5">
                    {s.bankDetails?.bankName}
                  </div>
                  <span className="text-[10px] text-[#606460] font-mono block">
                    A/C: {s.bankDetails?.accountNumber} (IFSC:{" "}
                    {s.bankDetails?.ifscCode})
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
