import React from "react";
import { Star } from "lucide-react";

export const VendorReviews = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#D9E2EA] pb-4">
        <h1 className="text-2xl font-black text-[#173885]">
          Product Customer Reviews
        </h1>
        <p className="text-xs text-[#606460]">
          Verified buyer reviews and ratings on your listed construction
          products.
        </p>
      </div>

      <div className="gm-panel p-5 rounded-3xl border border-[#D9E2EA] space-y-3">
        <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-3">
          <h3 className="font-bold text-[#282926] text-xs">
            UltraTech Super Weather-Shield PPC Cement
          </h3>
          <div className="flex text-[#3C7DDA]">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className="w-3.5 h-3.5 fill-[#3C7DDA] text-[#3C7DDA]"
              />
            ))}
          </div>
        </div>
        <p className="text-xs text-[#606460]">
          "Fresh test batch cement, delivered quickly to our Koregaon Park site
          in 35 mins."
        </p>
        <span className="text-[10px] text-[#6F8A92] block">
          By Vikramaditya S. (Civil Contractor) • Pune
        </span>
      </div>
    </div>
  );
};
