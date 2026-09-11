import React, { useState, useEffect } from "react";
import { vendorService } from "../../services/vendorService";

export const VendorQuotations = () => {
  const [rfqs, setRfqs] = useState([]);

  useEffect(() => {
    vendorService.getRfqs().then((list) => {
      setRfqs(list.filter((r) => r.status === "QUOTATION_SUBMITTED"));
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D9E2EA] pb-4">
        <h1 className="text-2xl font-black text-[#173885]">
          Active Submitted Quotations
        </h1>
        <p className="text-xs text-[#606460]">
          Commercial bids and tiered project quotes submitted to developers.
        </p>
      </div>

      <div className="space-y-4">
        {rfqs.map((q) => (
          <div
            key={q.id}
            className="gm-panel p-5 rounded-3xl border border-[#D9E2EA] flex items-center justify-between text-xs"
          >
            <div>
              <span className="font-mono font-black text-[#173885]">
                {q.id}
              </span>
              <h3 className="font-bold text-[#282926] mt-0.5">
                {q.projectName}
              </h3>
              <p className="text-[#606460] mt-0.5">
                {q.productName} ({q.quantity} {q.unit}s @ ₹{q.quotedRate}/
                {q.unit})
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono font-black text-[#173885] text-sm">
                ₹{q.totalEstimate?.toLocaleString("en-IN")}
              </span>
              <div className="text-[10px] text-emerald-700 font-bold">
                Active Bid
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
