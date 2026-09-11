import React, { useState, useEffect } from "react";
import { Banknote, CheckCircle2 } from "lucide-react";
import { vendorService } from "../../services/vendorService";

export const VendorSettlements = () => {
  const [finances, setFinances] = useState(null);

  useEffect(() => {
    vendorService.getFinancialOverview().then(setFinances);
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D9E2EA] pb-4">
        <h1 className="text-2xl font-black text-[#173885]">Bank Settlements</h1>
        <p className="text-xs text-[#606460]">
          Weekly direct-to-bank NEFT/RTGS settlement batch history.
        </p>
      </div>

      <div className="gm-panel rounded-2xl overflow-hidden border border-[#D9E2EA]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#E4EEF3] text-[#173885] font-bold border-b border-[#D9E2EA]">
            <tr>
              <th className="p-3.5">Settlement ID</th>
              <th className="p-3.5">Bank UTR Reference</th>
              <th className="p-3.5">Payout Date</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Net Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D9E2EA]">
            {finances?.recentSettlements.map((s) => (
              <tr key={s.id} className="hover:bg-[#F4F6FA]">
                <td className="p-3.5 font-mono font-bold text-[#173885]">
                  {s.id}
                </td>
                <td className="p-3.5 font-mono text-[#606460]">{s.utr}</td>
                <td className="p-3.5 text-[#606460]">{s.date}</td>
                <td className="p-3.5">
                  <span className="bg-[#E1F2D9] text-[#3F7D20] px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit">
                    <CheckCircle2 className="w-3 h-3" /> Processed
                  </span>
                </td>
                <td className="p-3.5 text-right font-mono font-bold text-[#173885]">
                  ₹{s.amount.toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
