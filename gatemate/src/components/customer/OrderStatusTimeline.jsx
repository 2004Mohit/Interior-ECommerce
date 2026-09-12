import React from "react";
import { Check, Clock, Truck, Package, Home, Sparkles } from "lucide-react";
import {
  ORDER_STATUS_TIMELINE_STEPS,
  ORDER_LIFECYCLE_STATUS,
} from "../../services/orderRepository";

export const OrderStatusTimeline = ({
  currentStatus,
  isExpress30Min = false,
}) => {
  const isCancelled = currentStatus === ORDER_LIFECYCLE_STATUS.CANCELLED;

  const getStepIndex = (status) => {
    return ORDER_STATUS_TIMELINE_STEPS.findIndex((s) => s.key === status);
  };

  const currentIndex = getStepIndex(currentStatus);

  if (isCancelled) {
    return (
      <div className="premium-panel p-4 rounded-2xl border border-rose-500/30 bg-rose-950/20 text-xs text-rose-300">
        <strong className="block text-sm font-bold text-rose-200 mb-0.5">
          Order Cancelled
        </strong>
        This order has been cancelled. Any applicable online payment will be
        refunded to your source account.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Fulfillment Journey
        </span>
        {isExpress30Min && (
          <span className="bg-dark-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md">
            <Sparkles className="w-3 h-3 fill-current" />
            30-MIN PRIORITY DISPATCH
          </span>
        )}
      </div>

      <div className="relative pl-6 space-y-6 border-l-2 border-white/10 ml-3">
        {ORDER_STATUS_TIMELINE_STEPS.map((step, idx) => {
          const isCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.key} className="relative">
              {/* Timeline Indicator Dot */}
              <div
                className={`absolute -left-[31px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  isCurrent
                    ? "bg-dark-400 text-slate-950 ring-4 ring-dark-400/20 shadow-lg font-black"
                    : isCompleted
                      ? "bg-emerald-500 text-slate-950"
                      : "bg-[#091526] border border-white/20 text-slate-500"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <span className="text-[10px]">{idx + 1}</span>
                )}
              </div>

              {/* Text Description */}
              <div>
                <h4
                  className={`text-xs font-bold ${
                    isCurrent
                      ? "text-dark-400 text-sm"
                      : isCompleted
                        ? "text-dark"
                        : "text-slate-500"
                  }`}
                >
                  {step.label}
                </h4>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
