import React, { useState, useEffect } from "react";
import { CreditCard, Banknote, ShieldCheck } from "lucide-react";
import { vendorService } from "../../services/vendorService";

export const VendorPayments = () => {
  const [finances, setFinances] = useState(null);

  useEffect(() => {
    vendorService.getFinancialOverview().then(setFinances);
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D9E2EA] pb-4">
        <h1 className="text-2xl font-black text-[#173885]">
          Payments & Dispatches Overview
        </h1>
        <p className="text-xs text-[#606460]">
          Reconciliation of online and doorstep pay-on-delivery orders.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="gm-panel p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-[#6F8A92] uppercase">
            Total Order Value
          </span>
          <div className="text-2xl font-black text-[#173885] mt-1 font-mono">
            ₹{finances?.netEarnings.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="gm-panel p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-[#6F8A92] uppercase">
            Pending Clearance
          </span>
          <div className="text-2xl font-black text-[#A66A08] mt-1 font-mono">
            ₹{finances?.pendingPayout.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="gm-panel p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-[#6F8A92] uppercase">
            Settled to Bank
          </span>
          <div className="text-2xl font-black text-[#3F7D20] mt-1 font-mono">
            ₹{finances?.settledPayout.toLocaleString("en-IN")}
          </div>
        </div>
      </div>
    </div>
  );
};
