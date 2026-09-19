import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  Package,
  ArrowDownToLine,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  vendorInventoryService,
  ADJUSTMENT_REASONS,
} from "../../services/vendorInventoryService";

export const StockAdjustmentModal = ({
  isOpen,
  onClose,
  product,
  onStockAdjusted,
}) => {
  const [newStock, setNewStock] = useState("");
  const [reason, setReason] = useState(ADJUSTMENT_REASONS.RESTOCK);
  const [batchNumber, setBatchNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  /*
   * Keep modal state synchronized whenever a different product
   * is selected or the modal is opened again.
   */
  useEffect(() => {
    if (!isOpen || !product) {
      return;
    }

    setNewStock(
      product.onHandStock !== undefined && product.onHandStock !== null
        ? String(product.onHandStock)
        : "0",
    );

    setReason(ADJUSTMENT_REASONS.RESTOCK);
    setBatchNumber("");
    setSubmitting(false);
    setError("");
    setSuccess(false);
  }, [isOpen, product]);

  const currentOnHand = Number(product?.onHandStock) || 0;

  const reservedStock = Number(product?.reservedStock) || 0;

  const moq = Number(product?.moq) > 0 ? Number(product.moq) : 1;

  const currentAvailable =
    Number(product?.availableStock) >= 0
      ? Number(product.availableStock)
      : Math.max(0, currentOnHand - reservedStock);

  const targetStock = newStock === "" ? null : Number(newStock);

  const stockDiff =
    targetStock === null || !Number.isFinite(targetStock)
      ? 0
      : targetStock - currentOnHand;

  const resultingAvailable =
    targetStock === null || !Number.isFinite(targetStock)
      ? currentAvailable
      : Math.max(0, targetStock - reservedStock);

  const willHaveReservationShortage =
    targetStock !== null &&
    Number.isFinite(targetStock) &&
    targetStock < reservedStock;

  const adjustmentLabel = useMemo(() => {
    if (stockDiff > 0) {
      return `+${stockDiff}`;
    }

    if (stockDiff < 0) {
      return `${stockDiff}`;
    }

    return "0";
  }, [stockDiff]);

  if (!isOpen || !product) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess(false);

    if (newStock === "") {
      setError("Please enter the new on-hand quantity.");
      return;
    }

    const targetNum = Number(newStock);

    if (!Number.isFinite(targetNum)) {
      setError("Please enter a valid stock quantity.");
      return;
    }

    if (targetNum < 0) {
      setError("Stock quantity cannot be negative.");
      return;
    }

    if (!Number.isInteger(targetNum)) {
      setError("Stock quantity must be a whole number.");
      return;
    }

    if (!reason) {
      setError("Please select an adjustment reason.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await vendorInventoryService.adjustStock({
        productId: product.productId,
        newOnHandStock: targetNum,
        reason,
        batchNumber,
      });

      setSuccess(true);

      onStockAdjusted?.(result?.updatedItem);

      setTimeout(() => {
        onClose?.();
      }, 1000);
    } catch (err) {
      console.error("[StockAdjustmentModal]", err);

      setError(err?.message || "Unable to update inventory. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) {
      return;
    }

    setError("");
    setSuccess(false);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                <Package className="h-5 w-5 text-slate-700" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Adjust Inventory
                </h2>

                <p className="text-sm text-slate-500">
                  Update the physical on-hand quantity.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Product summary */}
        <div className="px-6 pt-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
                {product.img || product.image ? (
                  <img
                    src={product.img || product.image}
                    alt={product.productName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-6 w-6 text-slate-400" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-slate-900">
                  {product.productName}
                </h3>

                {product.brand && (
                  <p className="text-sm text-slate-500">{product.brand}</p>
                )}

                {product.sku && (
                  <p className="mt-1 text-xs text-slate-400">
                    SKU: {product.sku}
                  </p>
                )}
              </div>
            </div>

            {/* Inventory stats */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-white p-3 border border-slate-200">
                <p className="text-xs text-slate-500">On Hand</p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {currentOnHand} {product.unit || ""}
                </p>
              </div>

              <div className="rounded-lg bg-white p-3 border border-slate-200">
                <p className="text-xs text-slate-500">Reserved</p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {reservedStock} {product.unit || ""}
                </p>
              </div>

              <div className="rounded-lg bg-white p-3 border border-slate-200">
                <p className="text-xs text-slate-500">Available</p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {currentAvailable} {product.unit || ""}
                </p>
              </div>

              <div className="rounded-lg bg-white p-3 border border-slate-200">
                <p className="text-xs text-slate-500">MOQ</p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {moq} {product.unit || ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5">
            {/* New stock */}
            <div>
              <label
                htmlFor="new-on-hand-stock"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                New On-Hand Quantity
              </label>

              <div className="relative">
                <input
                  id="new-on-hand-stock"
                  type="number"
                  min="0"
                  step="1"
                  value={newStock}
                  onChange={(event) => setNewStock(event.target.value)}
                  disabled={submitting}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-20 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                  placeholder="Enter physical quantity"
                />

                {product.unit && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    {product.unit}
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Current: {currentOnHand} {product.unit || ""}
                </span>

                <span
                  className={
                    stockDiff > 0
                      ? "font-medium text-emerald-600"
                      : stockDiff < 0
                        ? "font-medium text-red-600"
                        : "font-medium text-slate-500"
                  }
                >
                  Change: {adjustmentLabel}
                </span>
              </div>
            </div>

            {/* Resulting availability */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <ArrowDownToLine className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />

                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Resulting available quantity
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    {resultingAvailable} {product.unit || ""}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Available quantity is calculated from on-hand stock minus
                    reserved stock.
                  </p>
                </div>
              </div>
            </div>

            {/* Reservation warning */}
            {willHaveReservationShortage && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Reserved quantity is higher than on-hand stock
                    </p>

                    <p className="mt-1 text-xs text-amber-700">
                      This adjustment will make available stock zero until the
                      reserved quantity is resolved.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label
                htmlFor="adjustment-reason"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Adjustment Reason
              </label>

              <select
                id="adjustment-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={submitting}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
              >
                <option value={ADJUSTMENT_REASONS.RESTOCK}>Restock</option>

                <option value={ADJUSTMENT_REASONS.ORDER_FULFILLED}>
                  Order Fulfilled
                </option>

                <option value={ADJUSTMENT_REASONS.DAMAGE}>Damage</option>

                <option value={ADJUSTMENT_REASONS.LOSS}>Loss</option>

                <option value={ADJUSTMENT_REASONS.CORRECTION}>
                  Correction
                </option>

                <option value={ADJUSTMENT_REASONS.RETURN}>Return</option>

                <option value={ADJUSTMENT_REASONS.OTHER}>Other</option>
              </select>
            </div>

            {/* Batch number */}
            <div>
              <label
                htmlFor="batch-number"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Batch / Inward Challan
                <span className="ml-1 font-normal text-slate-400">
                  (Optional)
                </span>
              </label>

              <input
                id="batch-number"
                type="text"
                value={batchNumber}
                onChange={(event) => setBatchNumber(event.target.value)}
                disabled={submitting}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                placeholder="Enter batch or inward reference"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                  <p className="text-sm text-emerald-700">
                    Inventory updated successfully.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || success}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Updating..." : "Update Inventory"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockAdjustmentModal;
