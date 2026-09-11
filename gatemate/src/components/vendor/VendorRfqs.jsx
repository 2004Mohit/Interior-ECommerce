import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FileText, ArrowRight } from "lucide-react";
import { vendorService } from "../../services/vendorService";

export const VendorRfqs = () => {
  const [rfqs, setRfqs] = useState([]);

  useEffect(() => {
    vendorService.getRfqs().then(setRfqs);
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D9E2EA] pb-4">
        <h1 className="text-2xl font-black text-[#173885]">
          Commercial Project RFQs
        </h1>
        <p className="text-xs text-[#606460]">
          Direct builder and contractor Bill of Quantities (BOQ) bid requests.
        </p>
      </div>

      <div className="space-y-4">
        {rfqs.map((r) => (
          <div
            key={r.id}
            className="gm-panel p-5 rounded-3xl border border-[#D9E2EA] space-y-3"
          >
            <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-3">
              <div>
                <span className="font-mono font-black text-[#173885] text-xs">
                  {r.id}
                </span>
                <h3 className="text-sm font-bold text-[#282926] mt-0.5">
                  {r.projectName}
                </h3>
              </div>
              <span className="badge-gm-info px-3 py-1 rounded-full text-xs">
                {r.status}
              </span>
            </div>

            <div className="text-xs text-[#606460] space-y-1">
              <div>
                <strong className="text-[#282926]">Product:</strong>{" "}
                {r.productName} ({r.quantity} {r.unit}s)
              </div>
              <div>
                <strong className="text-[#282926]">Site Location:</strong>{" "}
                {r.siteLocation}
              </div>
              <div>
                <strong className="text-[#282926]">Site Notes:</strong>{" "}
                {r.notes}
              </div>
            </div>

            <div className="pt-2 border-t border-[#D9E2EA] flex justify-end">
              <Link
                to={`/vendor/rfqs/${r.id}`}
                className="btn-gm-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <span>
                  {r.status === "PENDING_BID"
                    ? "Submit Bid"
                    : "Review Quotation"}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
