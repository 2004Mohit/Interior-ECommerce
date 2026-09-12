import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Zap,
  ShieldCheck,
  CreditCard,
  Check,
  X,
  Truck,
  AlertCircle,
  RotateCcw,
  AlertTriangle,
  PackageX,
} from "lucide-react";
import { useVendorAuth } from "../../context/VendorAuthContext";
import { vendorOrderService } from "../../services/vendorOrderService";
import {
  VENDOR_ORDER_STATUS,
  ORDER_LIFECYCLE_SEQUENCE,
  vendorOrderStateMachine,
} from "../../services/vendorOrderStateMachine";
import { SeoHead } from "../common/SeoHead";

export const VendorOrderDetail = () => {
  const { id } = useParams();
  const { vendorUser } = useVendorAuth();
  const vendorId = vendorUser?.id || "vnd-pune-001";

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);
  const [transitionError, setTransitionError] = useState(null);
  const [customNotes, setCustomNotes] = useState("");
  const [showRejectPrompt, setShowRejectPrompt] = useState(false);

  const loadOrder = async () => {
    setLoading(true);
    setTransitionError(null);
    try {
      const match = await vendorOrderService.getVendorOrderById(vendorId, id);
      setOrder(match);
    } catch (err) {
      setTransitionError("Unable to load order details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [vendorId, id]);

  const handleExecuteTransition = async (nextStatus, optionalNotes = "") => {
    setUpdatingStatus(true);
    setTransitionError(null);
    setActionNotice(null);

    try {
      const updated = await vendorOrderService.advanceOrderStatus(
        vendorId,
        order.id,
        nextStatus,
        optionalNotes || customNotes,
      );
      setOrder(updated);
      setCustomNotes("");
      setShowRejectPrompt(false);
      setActionNotice(
        `Order successfully updated to "${vendorOrderStateMachine.getStatusConfig(nextStatus).label}".`,
      );
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      setTransitionError(err.message || "Invalid status transition attempt.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-8 space-y-4 animate-pulse font-sans">
        <div className="h-6 bg-[#E4EEF3] rounded w-1/3" />
        <div className="h-64 bg-[#FEFEFE] rounded-3xl border border-[#D9E2EA]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4 font-sans">
        <AlertCircle className="w-12 h-12 text-[#B43D20] mx-auto" />
        <h2 className="text-xl font-black text-[#173885]">
          Order Not Found or Access Restricted
        </h2>
        <p className="text-xs text-[#606460]">
          This order is either invalid or does not belong to your vendor depot.
        </p>
        <Link
          to="/vendor/orders"
          className="btn-gm-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4 text-[#FEFEFE]" />
          <span>Return to Normal Orders</span>
        </Link>
      </div>
    );
  }

  const currentStatusConfig = vendorOrderStateMachine.getStatusConfig(
    order.status,
  );
  const availableActions = vendorOrderStateMachine.getNextAvailableActions(
    order.status,
  );
  const isTerminalOrder = currentStatusConfig.isTerminal;
  const isDelivered = order.status === VENDOR_ORDER_STATUS.DELIVERED;
  const isCancelledOrRejected =
    order.status === VENDOR_ORDER_STATUS.CANCELLED ||
    order.status === VENDOR_ORDER_STATUS.REJECTED;

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6 pb-24 font-sans">
      <SeoHead
        title={`Order ${order.id} | GateMate Vendor Fulfillment`}
        description="Manage live stage advancement, inspect customer delivery destination, and reconcile payments."
        canonicalUrl={`/vendor/orders/${order.id}`}
        noIndex={true}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/vendor/orders"
            className="p-2 rounded-xl bg-[#FEFEFE] border border-[#D9E2EA] text-[#606460] hover:text-[#173885] hover:bg-[#E4EEF3] transition"
            aria-label="Back to orders list"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#173885]">
                {order.id}
              </h1>
              {order.isExpress30Min && (
                <span className="bg-[#3C7DDA] text-[#FEFEFE] text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-current" /> 30-MIN PRIORITY
                </span>
              )}
            </div>
            <p className="text-xs text-[#606460] mt-0.5">
              Customer Ref:{" "}
              <strong className="text-[#282926]">{order.customerRef}</strong> •
              Placed{" "}
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <span
          className={`px-3.5 py-1.5 rounded-xl text-xs ${currentStatusConfig.badgeClass} self-start sm:self-auto`}
        >
          Status: {currentStatusConfig.label}
        </span>
      </div>

      {/* Action Alerts */}
      {transitionError && (
        <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-[#B43D20] shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Transition Blocked:</strong>
            <p className="mt-0.5">{transitionError}</p>
          </div>
        </div>
      )}

      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#3F7D20] shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* 1. Interactive Lifecycle Actions Card */}
      <div className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9E2EA] pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#173885]">
              Order Lifecycle Progression
            </h2>
            <p className="text-[11px] text-[#606460]">
              {currentStatusConfig.description}
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#606460]">
            {isTerminalOrder
              ? "Terminal State"
              : `Step ${currentStatusConfig.stageNumber} of 6`}
          </span>
        </div>

        {/* Linear Stage Visualizer */}
        {!isCancelledOrRejected ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {ORDER_LIFECYCLE_SEQUENCE.map((stageKey, idx) => {
              const cfg = vendorOrderStateMachine.getStatusConfig(stageKey);
              const isPast =
                cfg.stageNumber < currentStatusConfig.stageNumber ||
                isDelivered;
              const isCurrent = order.status === stageKey;

              return (
                <div
                  key={stageKey}
                  className={`p-2.5 rounded-2xl border text-center transition ${
                    isCurrent
                      ? "bg-[#173885] text-[#FEFEFE] border-[#173885] font-bold shadow-xs"
                      : isPast
                        ? "bg-[#E1F2D9] text-[#3F7D20] border-[#3F7D20]/30 font-semibold"
                        : "bg-[#F4F6FA] text-[#6F8A92] border-[#D9E2EA]"
                  }`}
                >
                  <div className="text-[10px] font-mono">{idx + 1}</div>
                  <div className="text-xs mt-0.5 truncate">{cfg.label}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#FBE3DE]/60 border border-[#B43D20]/30 text-xs text-[#B43D20] flex items-center gap-2">
            <PackageX className="w-5 h-5 shrink-0" />
            <span>
              This order was {order.status.toLowerCase()} and is closed for
              further dispatch transitions.
            </span>
          </div>
        )}

        {/* Action Controls */}
        {!isTerminalOrder ? (
          <div className="pt-3 border-t border-[#D9E2EA] flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-[#282926]">
              Available Actions:
            </span>

            <div className="flex flex-wrap items-center gap-2.5">
              {availableActions.map((action) => {
                if (action.isDestructive) {
                  return (
                    <button
                      key={action.targetStatus}
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => setShowRejectPrompt(true)}
                      className="btn-gm-secondary px-4 py-2 rounded-xl text-xs font-bold text-[#B43D20] hover:bg-[#FBE3DE] disabled:opacity-50"
                    >
                      <span>
                        {action.targetStatus === VENDOR_ORDER_STATUS.REJECTED
                          ? "Reject Order"
                          : "Cancel Order"}
                      </span>
                    </button>
                  );
                }

                return (
                  <button
                    key={action.targetStatus}
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => handleExecuteTransition(action.targetStatus)}
                    className="btn-gm-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {action.targetStatus === VENDOR_ORDER_STATUS.ACCEPTED && (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    {action.targetStatus === VENDOR_ORDER_STATUS.PREPARING && (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    {action.targetStatus ===
                      VENDOR_ORDER_STATUS.READY_FOR_DISPATCH && (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    {action.targetStatus ===
                      VENDOR_ORDER_STATUS.OUT_FOR_DELIVERY && (
                      <Truck className="w-3.5 h-3.5" />
                    )}
                    {action.targetStatus === VENDOR_ORDER_STATUS.DELIVERED && (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>Advance to: {action.config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="pt-3 border-t border-[#D9E2EA] flex items-center justify-between text-xs">
            <span className="text-[#606460]">Order Closed:</span>
            <span
              className={`font-bold flex items-center gap-1 ${isDelivered ? "text-[#3F7D20]" : "text-[#B43D20]"}`}
            >
              {isDelivered ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>{currentStatusConfig.label}</span>
            </span>
          </div>
        )}

        {/* Reject / Cancel Prompt Drawer */}
        {showRejectPrompt && (
          <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 space-y-3 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#B43D20]">
                Provide Reason for Declining Order
              </span>
              <button
                onClick={() => setShowRejectPrompt(false)}
                className="text-[#606460] hover:text-[#282926]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              placeholder="e.g. Stock temporarily depleted, or delivery distance exceeds 30-min courier range."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="w-full gm-input px-3 py-2 rounded-xl text-xs bg-[#FEFEFE]"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRejectPrompt(false)}
                className="btn-gm-secondary px-3 py-1.5 rounded-lg text-xs font-bold"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={updatingStatus}
                onClick={() =>
                  handleExecuteTransition(
                    order.status === VENDOR_ORDER_STATUS.NEW
                      ? VENDOR_ORDER_STATUS.REJECTED
                      : VENDOR_ORDER_STATUS.CANCELLED,
                    customNotes || "Declined by depot",
                  )
                }
                className="btn-gm-primary bg-[#B43D20] hover:bg-[#962F16] text-[#FEFEFE] px-4 py-1.5 rounded-lg text-xs font-bold"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Order Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Products & Line Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] space-y-4">
            <h3 className="text-sm font-bold text-[#173885] border-b border-[#D9E2EA] pb-3">
              Ordered Construction Products ({order.items.length} lines)
            </h3>

            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-[#F4F6FA] border border-[#D9E2EA]"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.img}
                      alt=""
                      className="w-14 h-14 rounded-xl object-cover bg-[#FEFEFE] border border-[#D9E2EA] shrink-0"
                    />
                    <div>
                      <span className="text-[10px] font-bold text-[#3C7DDA] uppercase">
                        {item.category}
                      </span>
                      <h4 className="text-xs font-bold text-[#282926]">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-[#606460] font-mono mt-0.5">
                        SKU: {item.sku} • {item.brand}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-[#173885] text-xs">
                      {item.quantity} {item.unit}s × ₹{item.price}
                    </div>
                    <div className="font-mono font-black text-sm text-[#282926] mt-0.5">
                      ₹{item.subtotal}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Complete Status Audit Timeline */}
          <div className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] space-y-3">
            <h3 className="text-sm font-bold text-[#173885] border-b border-[#D9E2EA] pb-2">
              Authoritative Status Timeline Audit
            </h3>

            <div className="space-y-3 pt-1 text-xs">
              {order.timeline?.map((t, idx) => {
                const cfg = vendorOrderStateMachine.getStatusConfig(t.status);
                return (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#E4EEF3] text-[#173885] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 font-mono">
                      {idx + 1}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-[#282926]">
                          {t.label || cfg.label}
                        </h4>
                        <span
                          className={`text-[9px] px-2 py-0.2 rounded-full ${cfg.badgeClass}`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#6F8A92] font-mono block">
                        {new Date(t.timestamp).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {t.notes && (
                        <p className="text-[11px] text-[#606460] italic">
                          "{t.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Site Destination & Settlement Reconciliation */}
        <div className="space-y-6">
          {/* Site Drop Location */}
          <div className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] space-y-3 text-xs">
            <h3 className="text-xs font-bold text-[#173885] uppercase tracking-wider border-b border-[#D9E2EA] pb-2">
              Site Delivery Destination
            </h3>

            <div className="space-y-1 text-[#606460]">
              <strong className="text-sm text-[#282926] block">
                {order.deliveryAddress.fullName}
              </strong>
              <p className="flex items-center gap-1.5 text-[#3C7DDA] font-bold font-mono">
                <Phone className="w-3.5 h-3.5" />
                <span>{order.deliveryAddress.phone}</span>
              </p>
              <p className="pt-1 text-[#282926] leading-relaxed">
                {order.deliveryAddress.line1}, {order.deliveryAddress.locality},{" "}
                {order.deliveryAddress.city} -{" "}
                <span className="font-mono font-bold text-[#173885]">
                  {order.deliveryAddress.pincode}
                </span>
              </p>
            </div>
          </div>

          {/* Payment & Reconciliations */}
          <div className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] space-y-3 text-xs">
            <h3 className="text-xs font-bold text-[#173885] uppercase tracking-wider border-b border-[#D9E2EA] pb-2">
              Payment & Invoicing Summary
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between text-[#606460]">
                <span>Items Subtotal:</span>
                <span className="font-mono font-bold text-[#282926]">
                  ₹{order.totals.itemSubtotal}
                </span>
              </div>
              <div className="flex justify-between text-[#606460]">
                <span>Site Delivery Fee:</span>
                <span className="text-[#3F7D20] font-bold">
                  {order.totals.deliveryFee === 0
                    ? "FREE"
                    : `₹${order.totals.deliveryFee}`}
                </span>
              </div>
              <div className="flex justify-between text-[#606460]">
                <span>Platform Packaging:</span>
                <span className="font-mono text-[#282926]">
                  ₹{order.totals.packagingFee}
                </span>
              </div>
              {order.totals.codConvenienceFee > 0 && (
                <div className="flex justify-between text-[#606460]">
                  <span>Pay on Delivery Handling:</span>
                  <span className="font-mono text-[#173885]">
                    +₹{order.totals.codConvenienceFee}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-[#173885] pt-2 border-t border-[#D9E2EA]">
                <span>Grand Total:</span>
                <span className="text-base font-mono">
                  ₹{order.totals.grandTotal}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#D9E2EA] text-[11px] text-[#606460]">
              <span>Payment Mode: </span>
              <strong className="text-[#282926]">{order.paymentMethod}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
