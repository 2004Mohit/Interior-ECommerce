import React from "react";
import { Bell, Zap, Package } from "lucide-react";

export const VendorNotifications = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#D9E2EA] pb-4">
        <h1 className="text-2xl font-black text-[#173885]">
          Vendor Dispatch Notifications
        </h1>
        <p className="text-xs text-[#606460]">
          Live dispatch requests and project RFQ bid inquiries.
        </p>
      </div>

      <div className="space-y-3">
        <div className="gm-panel p-4 rounded-2xl border border-[#3C7DDA] flex items-start gap-3 bg-[#E4EEF3]/40">
          <Zap className="w-5 h-5 text-[#3C7DDA] fill-[#3C7DDA] shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <h4 className="font-bold text-[#173885]">
              30-Minute Priority Dispatch Assigned
            </h4>
            <p className="text-[#606460]">
              Order GM-ORD-20260908-0192 is ready for flatbed loading to
              Koregaon Park, Pune.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
