import React, { useState } from "react";
import {
  MapPin,
  Zap,
  ShieldCheck,
  Truck,
  Clock,
  AlertCircle,
  CheckCircle2,
  Info,
  ArrowRight,
} from "lucide-react";
import { deliveryService } from "../../services/deliveryService";

export const DeliveryChecker = ({
  initialPincode = "",
  productWeightKg = 2.0,
  deliveryClass = "STANDARD_PARCEL",
  onServiceabilityResolved = null,
  compact = false,
}) => {
  const [pincode, setPincode] = useState(initialPincode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCheck = async (e) => {
    e?.preventDefault();
    if (!pincode.trim()) return;

    setLoading(true);
    try {
      const evaluation = await deliveryService.evaluateServiceability({
        pincode,
        productWeightKg,
        deliveryClass,
      });
      setResult(evaluation);
      onServiceabilityResolved?.(evaluation);
    } catch (err) {
      setResult({
        isValid: false,
        isServiceable: false,
        error: "Unable to evaluate serviceability. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`premium-panel rounded-3xl border border-white/10 ${compact ? "p-4 space-y-3" : "p-6 sm:p-7 space-y-4"}`}
    >
      {/* Title & Hub info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white">
              Check Delivery & Serviceability
            </h3>
            <p className="text-[10px] text-slate-400">
              Pune, Pimpri-Chinchwad Zones
            </p>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleCheck} className="flex gap-2">
        <input
          type="text"
          placeholder="Enter 6-digit PIN code (e.g. 411006, 411061)"
          maxLength={6}
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
          className="flex-1 premium-input px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider placeholder-slate-500"
        />
        <button
          type="submit"
          disabled={loading || pincode.length < 6}
          className="gold-gradient-btn px-4 py-2.5 rounded-xl text-xs font-bold transition active:scale-95 disabled:opacity-50"
        >
          {loading ? "Checking..." : "Verify"}
        </button>
      </form>

      {/* Result Card: Serviceable */}
      {result && result.isValid && result.isServiceable && (
        <div className="space-y-3 pt-1">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{result.message}</span>
          </div>

          {/* Delivery Method Options List */}
          <div className="space-y-2">
            {result.deliveryOptions.map((opt) => (
              <div
                key={opt.id}
                className="premium-card p-3 rounded-2xl flex items-center justify-between border border-white/5"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    {opt.id.includes("express") ? (
                      <Zap className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Truck className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">
                        {opt.name}
                      </span>
                      <span className="text-[9px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded">
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {opt.description}
                    </p>
                    <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                      SLA: {opt.sla} • {opt.cutoff}
                    </div>
                  </div>
                </div>

                <span className="text-xs font-black text-amber-400 font-mono">
                  {opt.feeLabel}
                </span>
              </div>
            ))}
          </div>

          {/* Mandatory Customer-Facing Limitation */}
          <div className="p-3 rounded-2xl bg-[#091526] border border-white/5 flex items-start gap-2 text-[11px] text-slate-300">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-amber-300 font-semibold">
                Handling Policy:{" "}
              </strong>
              {result.unloadingPolicy}
            </span>
          </div>
        </div>
      )}

      {/* Result Card: Unserviceable */}
      {result && result.isValid && !result.isServiceable && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Outside Direct Launch Corridor</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {result.message}
          </p>
        </div>
      )}

      {/* Result Card: Invalid PIN */}
      {result && !result.isValid && (
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{result.error}</span>
        </div>
      )}
    </div>
  );
};
