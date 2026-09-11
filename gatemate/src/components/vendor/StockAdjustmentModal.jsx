import React, { useState } from "react";
import { X, Boxes, AlertCircle, CheckCircle2, Save, Info } from "lucide-react";
import {
  vendorInventoryService,
  ADJUSTMENT_REASONS,
} from "../../services/vendorInventoryService";

export const StockAdjustmentModal = ({
  isOpen,
  onClose,
  product,
  vendorId,
  onStockAdjusted,
}) => {
  const [newStock, setNewStock] = useState(
    product ? String(product.onHandStock) : "0",
  );
  const [reason, setReason] = useState(ADJUSTMENT_REASONS.RESTOCK);
  const [batchNumber, setBatchNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !product) return null;

  const currentAvailable =
    product.availableStock !== undefined
      ? product.availableStock
      : product.onHandStock;
  const targetNum = Number(newStock);
  const stockDiff = isNaN(targetNum) ? 0 : targetNum - product.onHandStock;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isNaN(targetNum) || targetNum < 0 || !Number.isInteger(targetNum)) {
      setError(
        "Please enter a valid non-negative whole number for physical stock.",
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await vendorInventoryService.adjustStock({
        vendorId: vendorId || "vnd-pune-001",
        productId: product.productId,
        newOnHandStock: targetNum,
        reason,
        batchNumber,
      });

      setSuccess(true);
      onStockAdjusted?.(result.updatedItem);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || "Failed to update stock level.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-lg p-6 sm:p-8 rounded-3xl relative shadow-2xl overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 text-[#606460] hover:text-[#282926]"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Boxes className="w-5 h-5 text-[#3C7DDA]" />
          <h3 className="text-xl font-bold text-[#173885]">
            Adjust Physical Yard Stock
          </h3>
        </div>
        <p className="text-xs text-[#606460] mb-4 truncate">
          Product:{" "}
          <strong className="text-[#282926]">{product.productName}</strong>
        </p>

        {error && (
          <div className="p-3 rounded-xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#3F7D20] shrink-0" />
            <span>Stock level updated and logged to audit trail!</span>
          </div>
        )}

        {/* Current Balance Overview */}
        <div className="grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-[#F4F6FA] border border-[#D9E2EA] text-center text-xs mb-4">
          <div>
            <span className="text-[10px] text-[#6F8A92] font-semibold block">
              On-Hand Yard
            </span>
            <strong className="text-sm font-black text-[#173885] font-mono">
              {product.onHandStock}
            </strong>
            <span className="text-[10px] text-[#606460]"> {product.unit}</span>
          </div>
          <div className="border-x border-[#D9E2EA]">
            <span className="text-[10px] text-[#6F8A92] font-semibold block">
              Reserved Orders
            </span>
            <strong className="text-sm font-black text-[#A66A08] font-mono">
              {product.reservedStock || 0}
            </strong>
            <span className="text-[10px] text-[#606460]"> {product.unit}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#6F8A92] font-semibold block">
              Authoritative Available
            </span>
            <strong className="text-sm font-black text-[#3F7D20] font-mono">
              {currentAvailable}
            </strong>
            <span className="text-[10px] text-[#606460]"> {product.unit}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#282926] block mb-1">
              New Physical On-Hand Stock ({product.unit}s) *
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                required
                min={0}
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-sm font-mono font-bold"
              />
              <span
                className={`text-xs font-bold font-mono px-3 py-2 rounded-xl whitespace-nowrap ${
                  stockDiff > 0
                    ? "bg-[#E1F2D9] text-[#3F7D20]"
                    : stockDiff < 0
                      ? "bg-[#FBE3DE] text-[#B43D20]"
                      : "bg-[#E4EEF3] text-[#173885]"
                }`}
              >
                {stockDiff > 0 ? `+${stockDiff}` : stockDiff} {product.unit}s
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#282926] block mb-1">
              Adjustment Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-semibold"
            >
              {Object.entries(ADJUSTMENT_REASONS).map(([k, label]) => (
                <option key={k} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#282926] block mb-1">
              Manufacturer Batch / Inward Challan # (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. BATCH-UT-2026-SEP09 or GRN-4821"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              className="w-full gm-input px-3.5 py-2 rounded-xl text-xs font-mono"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#E4EEF3] border border-[#9AAED4]/40 text-xs text-[#173885] flex items-start gap-2">
            <Info className="w-4 h-4 text-[#3C7DDA] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#606460] leading-relaxed">
              Available customer checkout quantities update authoritatively
              after subtracting any unfulfilled site delivery commitments.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 btn-gm-secondary py-2.5 rounded-xl text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 btn-gm-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>
                {isSubmitting
                  ? "Saving Adjustment..."
                  : "Confirm Stock Adjustment"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
