import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Building2,
  Send,
  RotateCcw,
  AlertCircle,
  FileText,
  Calendar,
  Truck,
  ShieldCheck,
  X,
  Trash2,
  Edit2,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { useVendorAuth } from "../../context/VendorAuthContext";
import {
  vendorRfqService,
  RFQ_STATUS,
  RFQ_STATUS_CONFIG,
} from "../../services/vendorRfqService";
import { SeoHead } from "../common/SeoHead";

export const VendorRfqDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { vendorUser } = useVendorAuth();

  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Quote Form State
  const [itemRates, setItemRates] = useState({}); // { [productId]: rate }
  const [freightCharges, setFreightCharges] = useState(0);
  const [unloadingCharges, setUnloadingCharges] = useState(0);
  const [turnaroundSchedule, setTurnaroundSchedule] = useState("");
  const [validityDays, setValidityDays] = useState(7);
  const [vendorRemarks, setVendorRemarks] = useState("");
  const [isEditingExistingQuote, setIsEditingExistingQuote] = useState(false);

  const loadRfq = async () => {
    if (!vendorUser?.id) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const match = await vendorRfqService.getRfqById(id);
      setRfq(match);
      if (match?.quotation) {
        const rateMap = {};
        match.quotation.itemQuotes.forEach((q) => {
          rateMap[q.productId] = q.unitRate;
        });
        setItemRates(rateMap);
        setFreightCharges(match.quotation.freightCharges || 0);
        setUnloadingCharges(match.quotation.unloadingCharges || 0);
        setTurnaroundSchedule(match.quotation.promisedTurnaroundDays || "");
        setVendorRemarks(match.quotation.vendorRemarks || "");
      } else if (match?.requestedProducts) {
        // Initialize default empty rates
        const rateMap = {};
        match.requestedProducts.forEach((p) => {
          rateMap[p.id] = "";
        });
        setItemRates(rateMap);
        setTurnaroundSchedule(
          `Staged multi-axle dispatch starting ${match.requestedDeliverySchedule.startDate}`,
        );
      }
    } catch (err) {
      setErrorMessage("Unable to load RFQ record.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vendorUser?.id) {
      loadRfq();
    } else {
      setLoading(false);
    }
  }, [vendorUser?.id, id]);

  const handleRateChange = (productId, val) => {
    setItemRates((prev) => ({
      ...prev,
      [productId]: val,
    }));
  };

  const calculateLiveTotals = () => {
    if (!rfq?.requestedProducts)
      return { subtotal: 0, taxable: 0, gstAmount: 0, grandTotal: 0 };

    let subtotal = 0;
    rfq.requestedProducts.forEach((p) => {
      const rate = Number(itemRates[p.id]) || 0;
      subtotal += rate * p.quantity;
    });

    const freight = Number(freightCharges) || 0;
    const unloading = Number(unloadingCharges) || 0;
    const taxable = subtotal + freight + unloading;
    const gstAmount = Math.round(taxable * 0.18 * 100) / 100;
    const grandTotal = Math.round((taxable + gstAmount) * 100) / 100;

    return { subtotal, taxable, gstAmount, grandTotal };
  };

  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate that all lines have positive unit rates
    for (const prod of rfq.requestedProducts) {
      const rate = Number(itemRates[prod.id]);
      if (isNaN(rate) || rate <= 0) {
        setErrorMessage(
          `Please enter a valid positive unit quote rate for: "${prod.name}".`,
        );
        return;
      }
    }

    if (!turnaroundSchedule.trim()) {
      setErrorMessage(
        "Please specify your promised planned delivery turnaround timeline.",
      );
      return;
    }

    setSubmitting(true);

    try {
      const formattedQuotes = rfq.requestedProducts.map((p) => ({
        productId: p.id,
        unitRate: Number(itemRates[p.id]),
      }));

      const updated = await vendorRfqService.submitOrUpdateQuotation({
        rfqId: rfq.id,
        itemQuotes: formattedQuotes,
        freightCharges: Number(freightCharges) || 0,
        unloadingCharges: Number(unloadingCharges) || 0,
        promisedTurnaroundDays: turnaroundSchedule,
        validityDays: Number(validityDays) || 7,
        vendorRemarks,
      });

      setRfq(updated);
      setIsEditingExistingQuote(false);
      setActionNotice(
        "Commercial quotation successfully submitted to the developer!",
      );
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      setErrorMessage(err.message || "Failed to submit quotation.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdrawQuote = async () => {
    if (
      !window.confirm(
        "Are you sure you want to withdraw this quotation? This action will notify the buyer.",
      )
    ) {
      return;
    }

    setSubmitting(true);
    try {
      const updated = await vendorRfqService.withdrawQuotation(
        rfq.id,
        "Vendor withdrew active quotation.",
      );
      setRfq(updated);
      setActionNotice("Quotation withdrawn successfully.");
    } catch (err) {
      setErrorMessage(err.message || "Failed to withdraw quotation.");
    } finally {
      setSubmitting(false);
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

  if (!rfq) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4 font-sans">
        <AlertCircle className="w-12 h-12 text-[#B43D20] mx-auto" />
        <h2 className="text-xl font-black text-[#173885]">
          Project RFQ Not Found or Access Restricted
        </h2>
        <p className="text-xs text-[#606460]">
          This RFQ is either invalid or does not belong to your vendor depot.
        </p>
        <Link
          to="/vendor/rfqs"
          className="btn-gm-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4 text-[#FEFEFE]" />
          <span>Return to RFQs</span>
        </Link>
      </div>
    );
  }

  const statusCfg = RFQ_STATUS_CONFIG[rfq.status] || {
    label: rfq.status,
    badgeClass: "bg-[#F4F6FA]",
  };
  const liveTotals = calculateLiveTotals();
  const canEditQuote =
    rfq.status === RFQ_STATUS.NEW ||
    rfq.status === RFQ_STATUS.QUOTATION_SENT ||
    rfq.status === RFQ_STATUS.NEGOTIATION;
  const isConvertedOrCompleted =
    rfq.status === RFQ_STATUS.CONVERTED_TO_ORDER ||
    rfq.status === RFQ_STATUS.COMPLETED;

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6 pb-24 font-sans">
      <SeoHead
        title={`RFQ ${rfq.id} | ${rfq.projectName} | GateMate`}
        description="Inspect requested bulk construction products, plan delivery schedule, and submit formal quotations."
        canonicalUrl={`/vendor/rfqs/${rfq.id}`}
        noIndex={true}
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/vendor/rfqs"
            className="p-2 rounded-xl bg-[#FEFEFE] border border-[#D9E2EA] text-[#606460] hover:text-[#173885] hover:bg-[#E4EEF3] transition"
            aria-label="Back to RFQ list"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#173885]">
                {rfq.projectName}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] ${statusCfg.badgeClass}`}
              >
                {statusCfg.label}
              </span>
            </div>
            <p className="text-xs text-[#606460] mt-0.5">
              RFQ Ref:{" "}
              <strong className="text-[#173885] font-mono">{rfq.id}</strong> •
              Buyer: <strong className="text-[#282926]">{rfq.buyerName}</strong>{" "}
              ({rfq.buyerPhone})
            </p>
          </div>
        </div>

        <span className="text-xs text-[#6F8A92] self-start sm:self-auto font-mono">
          Valid Until:{" "}
          {new Date(rfq.expiryDate).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#3F7D20]" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* 1. Buyer BOQ & Delivery Requirements Card */}
      <div className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-3">
          <h2 className="text-sm font-bold text-[#173885]">
            Project Site Delivery & Unloading Specifications
          </h2>
          <span className="badge-gm-info px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">
            Planned Schedule
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-[#F4F6FA] p-3.5 rounded-2xl border border-[#D9E2EA] space-y-1">
            <span className="text-[10px] font-bold text-[#6F8A92] uppercase block">
              Site Location
            </span>
            <div className="font-bold text-[#282926]">
              {rfq.requestedDeliverySchedule.siteAddress}
            </div>
            <p className="text-[#606460]">
              {rfq.requestedDeliverySchedule.locality},{" "}
              {rfq.requestedDeliverySchedule.city} -{" "}
              {rfq.requestedDeliverySchedule.pincode}
            </p>
          </div>

          <div className="bg-[#F4F6FA] p-3.5 rounded-2xl border border-[#D9E2EA] space-y-1">
            <span className="text-[10px] font-bold text-[#6F8A92] uppercase block">
              Delivery Phasing
            </span>
            <div className="font-bold text-[#282926]">
              Target Start: {rfq.requestedDeliverySchedule.startDate}
            </div>
            <p className="text-[#606460]">
              {rfq.requestedDeliverySchedule.stagedDelivery
                ? "Staged Multi-Axle Truckloads"
                : "Single Consignment"}
            </p>
          </div>

          <div className="bg-[#F4F6FA] p-3.5 rounded-2xl border border-[#D9E2EA] space-y-1">
            <span className="text-[10px] font-bold text-[#6F8A92] uppercase block">
              Trailer Access & Offloading
            </span>
            <div className="font-bold text-[#3F7D20]">
              {rfq.requestedDeliverySchedule.trailerAccessConfirmed
                ? "40-Ton Trailer Access Confirmed"
                : "Restricted Trailer Access"}
            </div>
            <p className="text-[#606460]">Buyer GSTIN: {rfq.buyerGstin}</p>
          </div>
        </div>

        {rfq.buyerProjectNotes && (
          <div className="p-3.5 rounded-2xl bg-[#FFF0D5] border border-[#A66A08]/30 text-xs text-[#A66A08] space-y-0.5">
            <strong className="font-bold block">
              Developer Project Instructions:
            </strong>
            <p className="leading-relaxed">{rfq.buyerProjectNotes}</p>
          </div>
        )}
      </div>

      {/* 2. Quotation Submission Form / Active Quote Review */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Line Items & Rates */}
        <div className="lg:col-span-8 space-y-6">
          <form
            onSubmit={handleQuoteSubmit}
            className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] space-y-5 shadow-xs"
          >
            <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#173885]">
                  {rfq.quotation && !isEditingExistingQuote
                    ? "Submitted Commercial Quotation"
                    : "Prepare Commercial Quotation"}
                </h3>
                <p className="text-[11px] text-[#606460]">
                  Specify unit rates for each requested construction product.
                </p>
              </div>

              {rfq.quotation && !isEditingExistingQuote && canEditQuote && (
                <button
                  type="button"
                  onClick={() => setIsEditingExistingQuote(true)}
                  className="btn-gm-secondary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 text-[#3C7DDA]"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Revise Quote</span>
                </button>
              )}
            </div>

            {/* Requested Products Line Items */}
            <div className="space-y-4">
              {rfq.requestedProducts.map((prod) => {
                const currentRate = Number(itemRates[prod.id]) || 0;
                const lineTotal = currentRate * prod.quantity;

                return (
                  <div
                    key={prod.id}
                    className="p-4 rounded-2xl bg-[#F4F6FA] border border-[#D9E2EA] space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-[#3C7DDA] uppercase">
                          {prod.category}
                        </span>
                        <h4 className="text-xs font-bold text-[#282926]">
                          {prod.name}
                        </h4>
                        <p className="text-[11px] text-[#606460] mt-0.5">
                          {prod.specifications}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-xs text-[#173885]">
                          Volume: {prod.quantity} {prod.unit}s
                        </span>
                      </div>
                    </div>

                    {/* Rate Input */}
                    <div className="pt-2 border-t border-[#D9E2EA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-[#282926] whitespace-nowrap">
                          Quote Rate per {prod.unit} (₹):
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          step="any"
                          disabled={Boolean(
                            rfq.quotation && !isEditingExistingQuote,
                          )}
                          placeholder="e.g. 1420"
                          value={itemRates[prod.id] || ""}
                          onChange={(e) =>
                            handleRateChange(prod.id, e.target.value)
                          }
                          className="w-32 gm-input px-3 py-1.5 rounded-xl text-xs font-mono font-bold"
                        />
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-[#606460]">
                          Line Total:{" "}
                        </span>
                        <strong className="font-mono font-black text-sm text-[#173885]">
                          ₹{lineTotal.toLocaleString("en-IN")}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Freight, Unloading & Schedule Details */}
            <div className="space-y-4 pt-3 border-t border-[#D9E2EA]">
              <h4 className="text-xs font-bold text-[#173885] uppercase tracking-wider">
                Logistics, Freight & Delivery Phasing
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Freight / Flatbed Logistics Charges (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    disabled={Boolean(rfq.quotation && !isEditingExistingQuote)}
                    value={freightCharges}
                    onChange={(e) => setFreightCharges(e.target.value)}
                    className="w-full gm-input px-3.5 py-2 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Site Crane / Ground Unloading (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    disabled={Boolean(rfq.quotation && !isEditingExistingQuote)}
                    value={unloadingCharges}
                    onChange={(e) => setUnloadingCharges(e.target.value)}
                    className="w-full gm-input px-3.5 py-2 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#282926] block mb-1">
                  Promised Delivery Turnaround Timeline *
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(rfq.quotation && !isEditingExistingQuote)}
                  placeholder="e.g. Staged delivery across 2 business days starting Sep 22 via 40-ton flatbed"
                  value={turnaroundSchedule}
                  onChange={(e) => setTurnaroundSchedule(e.target.value)}
                  className="w-full gm-input px-3.5 py-2 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#282926] block mb-1">
                  Stockist Notes / Batch Certification Guarantee
                </label>
                <textarea
                  rows={2}
                  disabled={Boolean(rfq.quotation && !isEditingExistingQuote)}
                  placeholder="State test certificate lot availability, payment terms, or transit insurance..."
                  value={vendorRemarks}
                  onChange={(e) => setVendorRemarks(e.target.value)}
                  className="w-full gm-input p-3 rounded-xl text-xs leading-relaxed"
                />
              </div>
            </div>

            {/* Action Buttons */}
            {(!rfq.quotation || isEditingExistingQuote) && (
              <div className="pt-4 border-t border-[#D9E2EA] flex items-center justify-between gap-3">
                {isEditingExistingQuote && (
                  <button
                    type="button"
                    onClick={() => setIsEditingExistingQuote(false)}
                    className="btn-gm-secondary px-4 py-2.5 rounded-xl text-xs font-bold"
                  >
                    Cancel Revision
                  </button>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-gm-primary px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ml-auto shadow-md disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {submitting
                      ? "Submitting..."
                      : isEditingExistingQuote
                        ? "Submit Revised Quotation"
                        : "Submit Commercial Quotation"}
                  </span>
                </button>
              </div>
            )}
          </form>

          {/* Timeline Audit History */}
          <div className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] space-y-3">
            <h3 className="text-sm font-bold text-[#173885] border-b border-[#D9E2EA] pb-2">
              RFQ Audit & Interaction Timeline
            </h3>

            <div className="space-y-3 pt-1 text-xs">
              {rfq.history?.map((t, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#E4EEF3] text-[#173885] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 font-mono">
                    {idx + 1}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-[#282926]">{t.label}</h4>
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
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Contract & Pricing Breakdown Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] space-y-4 text-xs sticky top-24 shadow-xs">
            <h3 className="text-xs font-bold text-[#173885] uppercase tracking-wider border-b border-[#D9E2EA] pb-2">
              Commercial Quote Summary
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between text-[#606460]">
                <span>Product Subtotal:</span>
                <span className="font-mono font-bold text-[#282926]">
                  ₹{liveTotals.subtotal.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-[#606460]">
                <span>Freight Logistics:</span>
                <span className="font-mono text-[#282926]">
                  ₹{Number(freightCharges || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-[#606460]">
                <span>Unloading Service:</span>
                <span className="font-mono text-[#282926]">
                  ₹{Number(unloadingCharges || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-[#606460]">
                <span>GST Tax (18% ITC):</span>
                <span className="font-mono text-[#282926]">
                  ₹{liveTotals.gstAmount.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between text-sm font-black text-[#173885] pt-2 border-t border-[#D9E2EA]">
                <span>Estimated Contract:</span>
                <span className="text-base font-mono">
                  ₹{liveTotals.grandTotal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {rfq.quotation && canEditQuote && (
              <div className="pt-3 border-t border-[#D9E2EA]">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleWithdrawQuote}
                  className="w-full btn-gm-secondary py-2 rounded-xl text-xs font-bold text-[#B43D20] hover:bg-[#FBE3DE] flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Withdraw Active Quotation</span>
                </button>
              </div>
            )}

            {isConvertedOrCompleted && (
              <div className="p-3 rounded-xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-xs text-[#3F7D20] flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Converted into Wholesale Purchase Order</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
