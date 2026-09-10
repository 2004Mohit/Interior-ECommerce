import React, { useState } from "react";
import { MapPin, Zap, Truck, Check, AlertCircle, Clock } from "lucide-react";
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
      className={`premium-panel rounded-2xl border border-white/10 ${compact ? "p-3.5" : "p-5"} space-y-3`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-amber-400" />
          <span>Construction Site Delivery Estimate</span>
        </span>
        <span className="text-[10px] text-slate-400 font-mono">
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
          className="flex-1 premium-input px-3 py-2 rounded-xl text-xs font-mono font-bold"
          aria-label="Enter PIN code for delivery estimation"
        />
        <button
          type="submit"
          className="gold-gradient-btn px-4 py-2 rounded-xl text-xs font-bold shrink-0 text-slate-950"
        >
          Verify
        </button>
      </form>

      {error && (
        <div className="text-[11px] text-rose-400 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="pt-2 border-t border-white/5 space-y-2 text-xs">
          {result.isExpress30Min ? (
            <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 flex items-start gap-2">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-white">
                  30-Minute Priority Dispatch Available
                </span>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Direct flatbed delivery to {result.area} on eligible
                  Products/orders.
                </p>
              </div>
            </div>
          ) : result.isStandardPune ? (
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 flex items-start gap-2">
              <Truck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-white">
                  Standard Site Scheduled Delivery
                </span>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Delivering to {result.area} within 2 to 4 business hours from
                  regional stockist depots.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-white">
                  Outside Immediate Fast Zone
                </span>
                <p className="text-[11px] text-slate-300 mt-0.5">
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
