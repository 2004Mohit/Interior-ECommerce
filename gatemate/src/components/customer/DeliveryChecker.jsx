import React, { useState } from "react";
import { MapPin, Zap, Truck, AlertCircle } from "lucide-react";
import { addressService } from "../../services/addressService";

export const DeliveryChecker = ({
  initialPincode = "",
  productWeightKg = 50,
  deliveryClass = "STANDARD_PARCEL",
  compact = false,
}) => {
  const [pincode, setPincode] = useState(initialPincode);
  const [result, setResult] = useState(
    initialPincode
      ? addressService.evaluateDeliveryEligibility(initialPincode)
      : null,
  );
  const [error, setError] = useState(null);

  const handleCheck = (e) => {
    e.preventDefault();
    setError(null);

    const cleanPin = pincode.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      setError("Please enter a valid 6-digit PIN code.");
      setResult(null);
      return;
    }

    const evaluation = addressService.evaluateDeliveryEligibility(cleanPin);
    setResult(evaluation);
  };

  return (
    <div
      className={`gm-panel rounded-2xl border border-[#D9E2EA] ${compact ? "p-3.5" : "p-5"} space-y-3`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#282926] flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-[#3C7DDA]" />
          <span>Construction Site Delivery Estimate</span>
        </span>
        <span className="text-[10px] text-[#6F8A92] font-mono">
          Pune & PCMC Zones
        </span>
      </div>

      <form onSubmit={handleCheck} className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Enter 6-digit site PIN code"
          maxLength={6}
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
          className="flex-1 gm-input px-3 py-2 rounded-xl text-xs font-mono font-bold"
          aria-label="Enter PIN code for delivery estimation"
        />
        <button
          type="submit"
          className="btn-gm-primary px-4 py-2 rounded-xl text-xs font-bold shrink-0"
        >
          Verify
        </button>
      </form>

      {error && (
        <div className="text-[11px] text-[#B43D20] flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="pt-2 border-t border-[#D9E2EA] space-y-2 text-xs">
          {result.isExpress30Min ? (
            <div className="p-2.5 rounded-xl bg-[#E4EEF3] border border-[#9AAED4]/40 text-[#173885] flex items-start gap-2">
              <Zap className="w-4 h-4 text-[#3C7DDA] fill-[#3C7DDA] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-[#173885]">
                  30-Minute Priority Dispatch Available
                </span>
                <p className="text-[11px] text-[#606460] mt-0.5">
                  Direct flatbed delivery to {result.area} on eligible
                  Products/orders.
                </p>
              </div>
            </div>
          ) : result.isStandardPune ? (
            <div className="p-2.5 rounded-xl bg-[#E3EBFA] border border-[#2E4D94]/20 text-[#2E4D94] flex items-start gap-2">
              <Truck className="w-4 h-4 text-[#2E4D94] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-[#282926]">
                  Standard Site Scheduled Delivery
                </span>
                <p className="text-[11px] text-[#606460] mt-0.5">
                  Delivering to {result.area} within 2 to 4 business hours from
                  regional stockist depots.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-[#FBE3DE] border border-[#B43D20]/20 text-[#B43D20] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#B43D20] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-[#B43D20]">
                  Outside Immediate Fast Zone
                </span>
                <p className="text-[11px] text-[#606460] mt-0.5">
                  Location {pincode} requires custom truckload booking via our
                  commercial B2B desk.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
