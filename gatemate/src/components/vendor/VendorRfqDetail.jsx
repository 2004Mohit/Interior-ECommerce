import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Send,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  Building2,
  Calendar,
  Truck,
  FileText,
} from "lucide-react";

import { useVendorAuth } from "../../context/VendorAuthContext";

import {
  vendorRfqService,
  RFQ_STATUS,
  RFQ_STATUS_CONFIG,
} from "../../services/vendorRfqService";

import { SeoHead } from "../common/SeoHead";

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const VendorRfqDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { vendorUser } = useVendorAuth();

  const [rfq, setRfq] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [actionNotice, setActionNotice] = useState("");

  const [itemRates, setItemRates] = useState({});

  const [freightCharges, setFreightCharges] = useState("0");
  const [unloadingCharges, setUnloadingCharges] = useState("0");

  const [turnaroundSchedule, setTurnaroundSchedule] = useState("");

  const [validityDays, setValidityDays] = useState("7");

  const [vendorRemarks, setVendorRemarks] = useState("");

  const [moqConditions, setMoqConditions] = useState("");

  const [isEditingExistingQuote, setIsEditingExistingQuote] = useState(false);

  /* ---------------------------------------------------------------------- */
  /* Load RFQ                                                               */
  /* ---------------------------------------------------------------------- */

  const loadRfq = async () => {
    if (!vendorUser?.id || !id) {
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const data = await vendorRfqService.getRfqById(id);

      setRfq(data);

      if (!data) {
        return;
      }

      const rateMap = {};

      const requestedProducts = Array.isArray(data.requestedProducts)
        ? data.requestedProducts
        : [];

      const quotation = data.quotation;

      if (quotation) {
        const quotationItems = Array.isArray(quotation.items)
          ? quotation.items
          : [];

        quotationItems.forEach((item) => {
          const productId = item.productId || item.product_id || item.id;

          if (productId) {
            rateMap[productId] =
              item.unitRate ?? item.unit_rate ?? item.rate ?? "";
          }
        });

        setFreightCharges(
          String(quotation.deliveryCharge ?? quotation.delivery_charge ?? 0),
        );

        setUnloadingCharges(
          String(quotation.unloadingCharge ?? quotation.unloading_charge ?? 0),
        );

        setTurnaroundSchedule(quotation.estimatedDeliverySchedule || "");

        setVendorRemarks(quotation.notes || "");

        setMoqConditions(quotation.moqConditions || "");

        if (quotation.validUntil) {
          const remainingDays = Math.max(
            1,
            Math.ceil(
              (new Date(quotation.validUntil).getTime() - Date.now()) /
                (24 * 60 * 60 * 1000),
            ),
          );

          setValidityDays(String(remainingDays));
        }
      } else {
        requestedProducts.forEach((product) => {
          const productId = product.productId || product.id;

          if (productId) {
            rateMap[productId] = "";
          }
        });
      }

      setItemRates(rateMap);
    } catch (error) {
      console.error("Failed to load RFQ:", error);

      setErrorMessage(error?.message || "Unable to load RFQ record.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vendorUser?.id && id) {
      loadRfq();
    } else {
      setLoading(false);
    }
  }, [vendorUser?.id, id]);

  /* ---------------------------------------------------------------------- */
  /* Input handlers                                                         */
  /* ---------------------------------------------------------------------- */

  const handleRateChange = (productId, value) => {
    setItemRates((previous) => ({
      ...previous,
      [productId]: value,
    }));
  };

  /* ---------------------------------------------------------------------- */
  /* Calculations                                                            */
  /* ---------------------------------------------------------------------- */

  const calculateLiveTotals = () => {
    if (!rfq) {
      return {
        subtotal: 0,
        delivery: 0,
        unloading: 0,
        taxable: 0,
        gstAmount: 0,
        grandTotal: 0,
      };
    }

    const products = Array.isArray(rfq.requestedProducts)
      ? rfq.requestedProducts
      : [];

    let subtotal = 0;

    products.forEach((product) => {
      const productId = product.productId || product.id;

      const quantity = Number(product.quantity || 0);

      const rate = Number(itemRates[productId] || 0);

      subtotal += quantity * rate;
    });

    const delivery = Number(freightCharges || 0);

    const unloading = Number(unloadingCharges || 0);

    const taxable = subtotal + delivery + unloading;

    const gstAmount = Math.round(taxable * 0.18 * 100) / 100;

    const grandTotal = Math.round((taxable + gstAmount) * 100) / 100;

    return {
      subtotal,
      delivery,
      unloading,
      taxable,
      gstAmount,
      grandTotal,
    };
  };

  /* ---------------------------------------------------------------------- */
  /* Submit quotation                                                       */
  /* ---------------------------------------------------------------------- */

  const handleQuoteSubmit = async (event) => {
    event.preventDefault();

    if (!rfq) {
      return;
    }

    setErrorMessage("");
    setActionNotice("");

    const requestedProducts = Array.isArray(rfq.requestedProducts)
      ? rfq.requestedProducts
      : [];

    if (requestedProducts.length === 0) {
      setErrorMessage("This RFQ does not contain any requested products.");
      return;
    }

    for (const product of requestedProducts) {
      const productId = product.productId || product.id;

      const rate = Number(itemRates[productId]);

      if (!Number.isFinite(rate) || rate <= 0) {
        setErrorMessage(
          `Please enter a valid positive unit rate for "${product.name}".`,
        );
        return;
      }
    }

    if (!turnaroundSchedule.trim()) {
      setErrorMessage(
        "Please specify the promised delivery turnaround timeline.",
      );
      return;
    }

    const validity = Number(validityDays);

    if (!Number.isFinite(validity) || validity < 1) {
      setErrorMessage("Quotation validity must be at least 1 day.");
      return;
    }

    setSubmitting(true);

    try {
      const itemQuotes = requestedProducts.map((product) => {
        const productId = product.productId || product.id;

        return {
          productId,
          unitRate: Number(itemRates[productId]),
        };
      });

      const result = await vendorRfqService.submitOrUpdateQuotation({
        rfqId: rfq.id,

        itemQuotes,

        freightCharges: Number(freightCharges || 0),

        unloadingCharges: Number(unloadingCharges || 0),

        promisedTurnaroundDays: turnaroundSchedule.trim(),

        validityDays: validity,

        vendorRemarks: vendorRemarks.trim(),

        moqConditions: moqConditions.trim(),
      });

      /*
       * The service returns:
       * {
       *   rfq,
       *   quotation
       * }
       */

      if (result?.rfq) {
        setRfq(result.rfq);
      } else {
        await loadRfq();
      }

      setIsEditingExistingQuote(false);

      setActionNotice("Commercial quotation submitted successfully.");

      window.setTimeout(() => {
        setActionNotice("");
      }, 4000);
    } catch (error) {
      console.error("Quotation submission failed:", error);

      setErrorMessage(error?.message || "Failed to submit quotation.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Withdraw quotation                                                    */
  /* ---------------------------------------------------------------------- */

  const handleWithdrawQuote = async () => {
    if (!rfq?.quotation?.id) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to withdraw this quotation?",
    );

    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setActionNotice("");

    try {
      const result = await vendorRfqService.withdrawQuotation(
        rfq.id,
        "Vendor withdrew the active quotation.",
      );

      if (result?.rfq) {
        setRfq(result.rfq);
      } else {
        await loadRfq();
      }

      setIsEditingExistingQuote(false);

      setActionNotice("Quotation withdrawn successfully.");
    } catch (error) {
      console.error("Quotation withdrawal failed:", error);

      setErrorMessage(error?.message || "Failed to withdraw quotation.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Loading                                                                */
  /* ---------------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-8 space-y-5 animate-pulse font-sans">
        <div className="h-6 bg-[#E4EEF3] rounded w-1/3" />

        <div className="h-24 bg-[#FEFEFE] rounded-3xl border border-[#D9E2EA]" />

        <div className="h-72 bg-[#FEFEFE] rounded-3xl border border-[#D9E2EA]" />
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Not found                                                              */
  /* ---------------------------------------------------------------------- */

  if (!rfq) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-5 font-sans">
        <AlertCircle className="w-12 h-12 text-[#B43D20] mx-auto" />

        <h2 className="text-xl font-black text-[#173885]">
          Project RFQ Not Found
        </h2>

        <p className="text-xs text-[#606460]">
          This RFQ does not exist or does not belong to the current vendor.
        </p>

        <Link
          to="/vendor/rfqs"
          className="btn-gm-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />

          <span>Return to RFQs</span>
        </Link>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Derived state                                                          */
  /* ---------------------------------------------------------------------- */

  const statusCfg = RFQ_STATUS_CONFIG[rfq.status] || {
    label: rfq.status,
    badgeClass: "bg-[#F4F6FA] text-[#606460] border border-[#D9E2EA]",
  };

  const quotation = rfq.quotation;

  const liveTotals = calculateLiveTotals();

  const canEditQuote =
    rfq.status === RFQ_STATUS.NEW ||
    rfq.status === RFQ_STATUS.QUOTATION_SENT ||
    rfq.status === RFQ_STATUS.NEGOTIATION;

  const isConvertedOrCompleted =
    rfq.status === RFQ_STATUS.CONVERTED_TO_ORDER ||
    rfq.status === RFQ_STATUS.COMPLETED;

  const canWithdraw =
    Boolean(quotation) && canEditQuote && quotation.status !== "WITHDRAWN";

  const site = rfq.siteAddress || {};

  const requestedProducts = Array.isArray(rfq.requestedProducts)
    ? rfq.requestedProducts
    : [];

  /* ---------------------------------------------------------------------- */
  /* UI                                                                     */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6 pb-24 font-sans">
      <SeoHead
        title={`RFQ ${rfq.id} | ${rfq.projectName} | Ferrado`}
        description="Review project RFQ requirements and submit a commercial quotation."
        canonicalUrl={`/vendor/rfqs/${rfq.id}`}
        noIndex={true}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/vendor/rfqs"
            className="p-2 rounded-xl bg-[#FEFEFE] border border-[#D9E2EA] text-[#606460] hover:text-[#173885] hover:bg-[#E4EEF3] transition"
            aria-label="Back to RFQs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#173885]">
                {rfq.projectName || "Project RFQ"}
              </h1>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] ${statusCfg.badgeClass}`}
              >
                {statusCfg.label}
              </span>
            </div>

            <p className="text-xs text-[#606460] mt-1">
              RFQ Ref:{" "}
              <strong className="text-[#173885] font-mono">{rfq.id}</strong>
              {" • "}
              Buyer:{" "}
              <strong className="text-[#282926]">{rfq.buyerName || "—"}</strong>
              {rfq.buyerPhone && <> ({rfq.buyerPhone})</>}
            </p>
          </div>
        </div>

        <div className="text-xs text-[#6F8A92] font-mono">
          RFQ Expiry:{" "}
          <strong className="text-[#173885]">
            {formatDate(rfq.expiryDate)}
          </strong>
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />

          <span>{errorMessage}</span>
        </div>
      )}

      {actionNotice && (
        <div className="p-4 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />

          <span>{actionNotice}</span>
        </div>
      )}

      {/* Project / Buyer Information */}
      <div className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] space-y-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#173885]">
              Project & Buyer Information
            </h2>

            <p className="text-[11px] text-[#606460] mt-0.5">
              Details submitted with this RFQ.
            </p>
          </div>

          <FileText className="w-5 h-5 text-[#3C7DDA]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Buyer */}
          <div className="p-4 rounded-2xl bg-[#F4F6FA] border border-[#D9E2EA]">
            <span className="text-[10px] font-bold text-[#6F8A92] uppercase block mb-2">
              Buyer
            </span>

            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#3C7DDA]" />

              <span className="text-xs font-bold text-[#282926]">
                {rfq.buyerName || "—"}
              </span>
            </div>

            {rfq.buyerPhone && (
              <div className="flex items-center gap-2 mt-2">
                <Phone className="w-3.5 h-3.5 text-[#6F8A92]" />

                <span className="text-[11px] text-[#606460]">
                  {rfq.buyerPhone}
                </span>
              </div>
            )}

            {rfq.buyerGstin && (
              <p className="text-[11px] text-[#606460] mt-2">
                GSTIN:{" "}
                <span className="font-mono font-bold text-[#282926]">
                  {rfq.buyerGstin}
                </span>
              </p>
            )}
          </div>

          {/* Project */}
          <div className="p-4 rounded-2xl bg-[#F4F6FA] border border-[#D9E2EA]">
            <span className="text-[10px] font-bold text-[#6F8A92] uppercase block mb-2">
              Project
            </span>

            <p className="text-xs font-bold text-[#282926]">
              {rfq.projectName || "—"}
            </p>

            <p className="text-[11px] text-[#606460] mt-2">
              Created: {formatDate(rfq.createdAt)}
            </p>
          </div>

          {/* Expiry */}
          <div className="p-4 rounded-2xl bg-[#F4F6FA] border border-[#D9E2EA]">
            <span className="text-[10px] font-bold text-[#6F8A92] uppercase block mb-2">
              RFQ Validity
            </span>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#3C7DDA]" />

              <span className="text-xs font-bold text-[#282926]">
                {formatDate(rfq.expiryDate)}
              </span>
            </div>

            <p className="text-[11px] text-[#606460] mt-2">RFQ expiry date</p>
          </div>
        </div>

        {/* Site */}
        <div className="p-4 rounded-2xl bg-[#F4F6FA] border border-[#D9E2EA]">
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-[#3C7DDA] mt-0.5 shrink-0" />

            <div>
              <span className="text-[10px] font-bold text-[#6F8A92] uppercase block mb-1">
                Site Address
              </span>

              <p className="text-xs font-bold text-[#282926]">
                {site.address || "Address not provided"}
              </p>

              <p className="text-[11px] text-[#606460] mt-1">
                {[site.locality, site.city, site.state, site.pincode]
                  .filter(Boolean)
                  .join(", ") || "Location details not provided"}
              </p>

              {site.landmark && (
                <p className="text-[11px] text-[#606460] mt-1">
                  Landmark: {site.landmark}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Project notes */}
        {rfq.buyerProjectNotes && (
          <div className="p-4 rounded-2xl bg-[#FFF0D5] border border-[#A66A08]/30">
            <span className="text-[10px] font-bold text-[#A66A08] uppercase block mb-1">
              Buyer Project Notes
            </span>

            <p className="text-xs text-[#606460] leading-relaxed">
              {rfq.buyerProjectNotes}
            </p>
          </div>
        )}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left */}
        <div className="lg:col-span-8 space-y-6">
          {/* Products */}
          <form
            onSubmit={handleQuoteSubmit}
            className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] space-y-5 shadow-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9E2EA] pb-3">
              <div>
                <h2 className="text-sm font-bold text-[#173885]">
                  {quotation && !isEditingExistingQuote
                    ? "Submitted Commercial Quotation"
                    : "Prepare Commercial Quotation"}
                </h2>

                <p className="text-[11px] text-[#606460] mt-0.5">
                  Enter your commercial rate for each requested product.
                </p>
              </div>

              {quotation && !isEditingExistingQuote && canEditQuote && (
                <button
                  type="button"
                  onClick={() => setIsEditingExistingQuote(true)}
                  className="btn-gm-secondary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 text-[#3C7DDA]"
                >
                  <Edit2 className="w-3.5 h-3.5" />

                  <span>Revise Quote</span>
                </button>
              )}
            </div>

            {/* Requested Products */}
            <div className="space-y-4">
              {requestedProducts.map((product, index) => {
                const productId =
                  product.productId || product.id || `product-${index}`;

                const quantity = Number(product.quantity || 0);

                const rate = Number(itemRates[productId] || 0);

                const lineTotal = quantity * rate;

                return (
                  <div
                    key={productId}
                    className="p-4 rounded-2xl bg-[#F4F6FA] border border-[#D9E2EA] space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-[#3C7DDA] uppercase">
                          Requested Product
                        </span>

                        <h3 className="text-sm font-bold text-[#282926] mt-1">
                          {product.name || "Product"}
                        </h3>

                        {product.notes && (
                          <p className="text-[11px] text-[#606460] mt-1">
                            {product.notes}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-[#6F8A92] uppercase block">
                          Requested Quantity
                        </span>

                        <span className="font-mono font-black text-sm text-[#173885]">
                          {quantity} {product.unit || "unit"}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#D9E2EA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <label className="text-xs font-bold text-[#282926] block mb-1.5">
                          Quote Rate per {product.unit || "unit"} (₹)
                        </label>

                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          required
                          disabled={Boolean(
                            quotation && !isEditingExistingQuote,
                          )}
                          value={itemRates[productId] ?? ""}
                          onChange={(event) =>
                            handleRateChange(productId, event.target.value)
                          }
                          placeholder="Enter rate"
                          className="w-40 gm-input px-3 py-2 rounded-xl text-xs font-mono font-bold"
                        />
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-[#606460] block">
                          Line Total
                        </span>

                        <strong className="font-mono font-black text-base text-[#173885]">
                          ₹{formatCurrency(lineTotal)}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Charges */}
            <div className="pt-4 border-t border-[#D9E2EA] space-y-4">
              <h3 className="text-xs font-bold text-[#173885] uppercase tracking-wider">
                Delivery & Commercial Charges
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1.5">
                    Delivery / Freight Charge (₹)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={Boolean(quotation && !isEditingExistingQuote)}
                    value={freightCharges}
                    onChange={(event) => setFreightCharges(event.target.value)}
                    className="w-full gm-input px-3 py-2 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1.5">
                    Unloading Charge (₹)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={Boolean(quotation && !isEditingExistingQuote)}
                    value={unloadingCharges}
                    onChange={(event) =>
                      setUnloadingCharges(event.target.value)
                    }
                    className="w-full gm-input px-3 py-2 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Delivery schedule */}
            <div>
              <label className="text-xs font-bold text-[#282926] block mb-1.5">
                Estimated Delivery Schedule *
              </label>

              <textarea
                required
                rows={3}
                disabled={Boolean(quotation && !isEditingExistingQuote)}
                value={turnaroundSchedule}
                onChange={(event) => setTurnaroundSchedule(event.target.value)}
                placeholder="Example: Delivery in 2 business days from order confirmation."
                className="w-full gm-input p-3 rounded-xl text-xs leading-relaxed"
              />
            </div>

            {/* MOQ conditions */}
            <div>
              <label className="text-xs font-bold text-[#282926] block mb-1.5">
                MOQ / Commercial Conditions
              </label>

              <textarea
                rows={2}
                disabled={Boolean(quotation && !isEditingExistingQuote)}
                value={moqConditions}
                onChange={(event) => setMoqConditions(event.target.value)}
                placeholder="Mention MOQ, batching, dispatch conditions, or other commercial conditions."
                className="w-full gm-input p-3 rounded-xl text-xs leading-relaxed"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-bold text-[#282926] block mb-1.5">
                Vendor Notes
              </label>

              <textarea
                rows={3}
                disabled={Boolean(quotation && !isEditingExistingQuote)}
                value={vendorRemarks}
                onChange={(event) => setVendorRemarks(event.target.value)}
                placeholder="Add product certification, stock availability, payment terms, or other quotation notes."
                className="w-full gm-input p-3 rounded-xl text-xs leading-relaxed"
              />
            </div>

            {/* Validity */}
            <div className="max-w-xs">
              <label className="text-xs font-bold text-[#282926] block mb-1.5">
                Quotation Validity (Days) *
              </label>

              <input
                type="number"
                min="1"
                max="365"
                required
                disabled={Boolean(quotation && !isEditingExistingQuote)}
                value={validityDays}
                onChange={(event) => setValidityDays(event.target.value)}
                className="w-full gm-input px-3 py-2 rounded-xl text-xs font-mono"
              />
            </div>

            {/* Submit */}
            {(!quotation || isEditingExistingQuote) && (
              <div className="pt-4 border-t border-[#D9E2EA] flex items-center justify-between gap-3">
                {isEditingExistingQuote && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      setIsEditingExistingQuote(false);

                      if (rfq.quotation) {
                        loadRfq();
                      }
                    }}
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

          {/* Existing quotation information */}
          {quotation && (
            <div className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#173885]">
                    Quotation Information
                  </h3>

                  <p className="text-[11px] text-[#606460] mt-0.5">
                    Current quotation stored for this RFQ.
                  </p>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-[#E3EBFA] text-[#173885] border border-[#3C7DDA]/30 text-[10px] font-bold">
                  {quotation.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-[#6F8A92] uppercase font-bold block">
                    Quotation ID
                  </span>

                  <span className="font-mono font-bold text-[#282926]">
                    {quotation.id}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-[#6F8A92] uppercase font-bold block">
                    Created
                  </span>

                  <span className="text-[#282926]">
                    {formatDateTime(quotation.createdAt)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-[#6F8A92] uppercase font-bold block">
                    Valid Until
                  </span>

                  <span className="text-[#282926]">
                    {formatDate(quotation.validUntil)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quote summary */}
          <div className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] space-y-4 text-xs sticky top-24 shadow-xs">
            <h3 className="text-xs font-bold text-[#173885] uppercase tracking-wider border-b border-[#D9E2EA] pb-2">
              Commercial Quote Summary
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between text-[#606460]">
                <span>Product Subtotal</span>

                <span className="font-mono font-bold text-[#282926]">
                  ₹{formatCurrency(liveTotals.subtotal)}
                </span>
              </div>

              <div className="flex justify-between text-[#606460]">
                <span>Delivery / Freight</span>

                <span className="font-mono text-[#282926]">
                  ₹{formatCurrency(liveTotals.delivery)}
                </span>
              </div>

              <div className="flex justify-between text-[#606460]">
                <span>Unloading</span>

                <span className="font-mono text-[#282926]">
                  ₹{formatCurrency(liveTotals.unloading)}
                </span>
              </div>

              <div className="flex justify-between text-[#606460]">
                <span>GST (18%)</span>

                <span className="font-mono text-[#282926]">
                  ₹{formatCurrency(liveTotals.gstAmount)}
                </span>
              </div>

              <div className="flex justify-between text-sm font-black text-[#173885] pt-3 border-t border-[#D9E2EA]">
                <span>Grand Total</span>

                <span className="text-base font-mono">
                  ₹{formatCurrency(liveTotals.grandTotal)}
                </span>
              </div>
            </div>

            {quotation && (
              <div className="pt-3 border-t border-[#D9E2EA] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#606460]">Saved Quote Total</span>

                  <strong className="font-mono text-[#173885]">
                    ₹{formatCurrency(quotation.grandTotal)}
                  </strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#606460]">Valid Until</span>

                  <strong className="text-[#282926]">
                    {formatDate(quotation.validUntil)}
                  </strong>
                </div>
              </div>
            )}

            {canWithdraw && (
              <div className="pt-3 border-t border-[#D9E2EA]">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleWithdrawQuote}
                  className="w-full btn-gm-secondary py-2.5 rounded-xl text-xs font-bold text-[#B43D20] hover:bg-[#FBE3DE] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />

                  <span>Withdraw Quotation</span>
                </button>
              </div>
            )}

            {isConvertedOrCompleted && (
              <div className="p-3 rounded-xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-xs text-[#3F7D20] flex items-start gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />

                <span>
                  This RFQ has been converted into a wholesale B2B order.
                </span>
              </div>
            )}
          </div>

          {/* Delivery information */}
          <div className="gm-panel p-5 rounded-3xl border border-[#D9E2EA] space-y-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#3C7DDA]" />

              <h3 className="text-xs font-bold text-[#173885] uppercase">
                Delivery Site
              </h3>
            </div>

            <p className="text-xs font-bold text-[#282926]">
              {site.address || "Address not provided"}
            </p>

            <p className="text-[11px] text-[#606460]">
              {[site.locality, site.city, site.state, site.pincode]
                .filter(Boolean)
                .join(", ") || "Location details not provided"}
            </p>
          </div>

          {/* Vendor note */}
          {quotation?.notes && (
            <div className="gm-panel p-5 rounded-3xl border border-[#D9E2EA] space-y-2">
              <h3 className="text-xs font-bold text-[#173885] uppercase">
                Vendor Notes
              </h3>

              <p className="text-[11px] text-[#606460] leading-relaxed">
                {quotation.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer status */}
      <div className="flex items-center justify-between gap-3 px-1">
        <button
          type="button"
          onClick={() => navigate("/vendor/rfqs")}
          className="text-xs font-bold text-[#3C7DDA] hover:underline"
        >
          ← Back to all RFQs
        </button>

        <span className="text-[10px] text-[#6F8A92] font-mono">
          Last updated: {formatDateTime(rfq.updatedAt)}
        </span>
      </div>
    </div>
  );
};

export default VendorRfqDetail;
