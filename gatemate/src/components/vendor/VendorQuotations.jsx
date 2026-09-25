import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Receipt,
  Search,
  RotateCcw,
  MapPin,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Building2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Clock,
  XCircle,
  FileText,
  Check,
  ArrowUpRight,
  Package,
  Phone,
  IndianRupee,
  Loader2,
} from "lucide-react";

import { useVendorAuth } from "../../context/VendorAuthContext";

import {
  vendorQuotationService,
  QUOTATION_STATUS,
  QUOTATION_STATUS_CONFIG,
} from "../../services/vendorQuotationService";

import { SeoHead } from "../common/SeoHead";

export const VendorQuotations = () => {
  const { vendorUser } = useVendorAuth();
  const navigate = useNavigate();

  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [convertingId, setConvertingId] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const loadQuotations = async () => {
    if (!vendorUser?.id) {
      setQuotations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const data = await vendorQuotationService.getVendorQuotations();
      setQuotations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load vendor quotations:", error);
      setErrorMessage(error?.message || "Unable to load vendor quotations.");
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, [vendorUser?.id]);

  const formatCurrency = (value) => {
    const amount = Number(value || 0);

    return `₹${amount.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusConfig = (status) => {
    return (
      QUOTATION_STATUS_CONFIG[status] || {
        key: status,
        label: status || "Unknown",
        badgeClass: "bg-[#F4F6FA] text-[#606460] border border-[#D9E2EA]",
        description: "Quotation status.",
      }
    );
  };

  const handleConvertToOrder = async (quotationId) => {
    if (!quotationId) {
      return;
    }

    const quotation = quotations.find((item) => item.id === quotationId);

    if (!quotation) {
      return;
    }

    if (quotation.status !== QUOTATION_STATUS.ACCEPTED) {
      setErrorMessage(
        "Only accepted quotations can be converted into wholesale orders.",
      );
      return;
    }

    const confirmed = window.confirm(
      "Convert this accepted quotation into a wholesale order?",
    );

    if (!confirmed) {
      return;
    }

    setConvertingId(quotationId);
    setActionNotice(null);
    setErrorMessage(null);

    try {
      const result =
        await vendorQuotationService.convertAcceptedQuotationToOrder(
          quotationId,
        );

      const orderId = result?.createdOrder?.id;

      if (!orderId) {
        throw new Error(
          "Wholesale order was created but no order ID was returned.",
        );
      }

      setActionNotice(
        `Quotation converted successfully into Wholesale Order ${orderId}.`,
      );

      await loadQuotations();

      setTimeout(() => {
        navigate(`/vendor/orders/${orderId}`);
      }, 900);
    } catch (error) {
      console.error("Failed to convert quotation to wholesale order:", error);

      setErrorMessage(
        error?.message || "Failed to convert quotation into a wholesale order.",
      );
    } finally {
      setConvertingId(null);
    }
  };

  const filteredQuotations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return quotations.filter((quotation) => {
      const itemSearchText = Array.isArray(quotation.items)
        ? quotation.items
            .map((item) => `${item.productName || ""} ${item.productId || ""}`)
            .join(" ")
        : "";

      const searchableText = [
        quotation.id,
        quotation.rfq_id,
        quotation.projectName,
        quotation.buyerName,
        quotation.buyerPhone,
        quotation.buyerGstin,
        quotation.siteAddress,
        quotation.status,
        itemSearchText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch === "" || searchableText.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" || quotation.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [quotations, search, statusFilter]);

  const totalQuotations = quotations.length;

  const acceptedCount = quotations.filter(
    (quotation) => quotation.status === QUOTATION_STATUS.ACCEPTED,
  ).length;

  const pendingCustomerCount = quotations.filter(
    (quotation) =>
      quotation.status === QUOTATION_STATUS.SUBMITTED ||
      quotation.status === QUOTATION_STATUS.UNDER_REVIEW,
  ).length;

  const convertedCount = quotations.filter(
    (quotation) => quotation.status === QUOTATION_STATUS.CONVERTED_TO_ORDER,
  ).length;

  const rejectedCount = quotations.filter(
    (quotation) =>
      quotation.status === QUOTATION_STATUS.REJECTED ||
      quotation.status === QUOTATION_STATUS.WITHDRAWN ||
      quotation.status === QUOTATION_STATUS.EXPIRED,
  ).length;

  return (
    <div className="space-y-6 pb-24 font-sans">
      <SeoHead
        title="Commercial Quotations | GateMate Vendor Portal"
        description="Manage commercial quotations, customer decisions, and wholesale order conversion."
        canonicalUrl="/vendor/quotations"
        noIndex={true}
      />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div>
          <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Commercial Quotations
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-2">
            Vendor Quotations
          </h1>

          <p className="text-xs text-[#606460] mt-1 max-w-2xl">
            Review submitted project quotations, track customer decisions, and
            convert accepted quotations into wholesale orders.
          </p>
        </div>

        <button
          type="button"
          onClick={loadQuotations}
          disabled={loading}
          className="btn-gm-secondary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 self-start lg:self-auto disabled:opacity-60"
        >
          <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />

          <span>Refresh Quotations</span>
        </button>
      </div>

      {/* Success */}
      {actionNotice && (
        <div className="p-4 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />

          <div>
            <p className="font-black">Action completed</p>

            <p className="mt-0.5">{actionNotice}</p>
          </div>
        </div>
      )}

      {/* Error */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />

          <div className="flex-1">
            <p className="font-black">Unable to complete the request</p>

            <p className="mt-0.5">{errorMessage}</p>
          </div>

          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-[#B43D20] font-black"
          >
            ×
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="gm-card p-5 rounded-2xl border border-[#D9E2EA]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6F8A92] uppercase tracking-wider">
              Total
            </span>

            <Receipt className="w-5 h-5 text-[#173885]" />
          </div>

          <div className="text-2xl font-black text-[#173885] mt-2">
            {totalQuotations}
          </div>

          <p className="text-[10px] text-[#606460] mt-1">
            Commercial quotations
          </p>
        </div>

        <div className="gm-card p-5 rounded-2xl border border-[#D9E2EA]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6F8A92] uppercase tracking-wider">
              Awaiting Decision
            </span>

            <Clock className="w-5 h-5 text-[#2E4D94]" />
          </div>

          <div className="text-2xl font-black text-[#173885] mt-2">
            {pendingCustomerCount}
          </div>

          <p className="text-[10px] text-[#606460] mt-1">
            Submitted / under review
          </p>
        </div>

        <div className="gm-card p-5 rounded-2xl border border-[#D9E2EA]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6F8A92] uppercase tracking-wider">
              Accepted
            </span>

            <CheckCircle2 className="w-5 h-5 text-[#3F7D20]" />
          </div>

          <div className="text-2xl font-black text-[#3F7D20] mt-2">
            {acceptedCount}
          </div>

          <p className="text-[10px] text-[#606460] mt-1">
            Ready for conversion
          </p>
        </div>

        <div className="gm-card p-5 rounded-2xl border border-[#D9E2EA]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6F8A92] uppercase tracking-wider">
              Converted
            </span>

            <ArrowUpRight className="w-5 h-5 text-[#173885]" />
          </div>

          <div className="text-2xl font-black text-[#173885] mt-2">
            {convertedCount}
          </div>

          <p className="text-[10px] text-[#606460] mt-1">
            Wholesale orders created
          </p>
        </div>

        <div className="gm-card p-5 rounded-2xl border border-[#D9E2EA]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6F8A92] uppercase tracking-wider">
              Closed
            </span>

            <XCircle className="w-5 h-5 text-[#606460]" />
          </div>

          <div className="text-2xl font-black text-[#606460] mt-2">
            {rejectedCount}
          </div>

          <p className="text-[10px] text-[#606460] mt-1">
            Declined / expired / withdrawn
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="gm-card rounded-2xl border border-[#D9E2EA] p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92]" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search quotation, project, buyer, phone, GSTIN or product..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#D9E2EA] bg-white text-sm text-[#173885] outline-none focus:border-[#33B2FF] focus:ring-2 focus:ring-[#33B2FF]/10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 px-4 rounded-xl border border-[#D9E2EA] bg-white text-sm text-[#173885] font-semibold outline-none focus:border-[#33B2FF]"
          >
            <option value="ALL">All Statuses</option>

            <option value={QUOTATION_STATUS.SUBMITTED}>Submitted</option>

            <option value={QUOTATION_STATUS.UNDER_REVIEW}>Under Review</option>

            <option value={QUOTATION_STATUS.ACCEPTED}>Accepted</option>

            <option value={QUOTATION_STATUS.REJECTED}>Rejected</option>

            <option value={QUOTATION_STATUS.EXPIRED}>Expired</option>

            <option value={QUOTATION_STATUS.WITHDRAWN}>Withdrawn</option>

            <option value={QUOTATION_STATUS.CONVERTED_TO_ORDER}>
              Converted to Order
            </option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="gm-card rounded-2xl border border-[#D9E2EA] p-6 animate-pulse"
            >
              <div className="h-5 bg-[#E4EEF3] rounded w-1/3" />
              <div className="h-4 bg-[#E4EEF3] rounded w-1/2 mt-4" />
              <div className="h-20 bg-[#E4EEF3] rounded-xl mt-5" />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filteredQuotations.length === 0 && (
        <div className="gm-card rounded-2xl border border-[#D9E2EA] p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#E4EEF3] flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7 text-[#173885]" />
          </div>

          <h2 className="text-lg font-black text-[#173885] mt-4">
            No quotations found
          </h2>

          <p className="text-xs text-[#606460] mt-2 max-w-md mx-auto">
            {search || statusFilter !== "ALL"
              ? "No quotations match your current search or status filter."
              : "Commercial quotations created for your vendor account will appear here."}
          </p>

          {(search || statusFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
              }}
              className="btn-gm-secondary mt-5 px-4 py-2 rounded-xl text-xs font-bold"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Quotation List */}
      {!loading && filteredQuotations.length > 0 && (
        <div className="space-y-4">
          {filteredQuotations.map((quotation) => {
            const statusConfig = getStatusConfig(quotation.status);

            const isConverting = convertingId === quotation.id;

            const isAccepted = quotation.status === QUOTATION_STATUS.ACCEPTED;

            const isConverted =
              quotation.status === QUOTATION_STATUS.CONVERTED_TO_ORDER;

            const items = Array.isArray(quotation.items) ? quotation.items : [];

            return (
              <div
                key={quotation.id}
                className="gm-card rounded-2xl border border-[#D9E2EA] overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-[#D9E2EA]">
                  <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black text-[#173885]">
                          {quotation.id}
                        </span>

                        {quotation.rfq_id && (
                          <span className="text-[10px] px-2 py-1 rounded-full bg-[#F4F6FA] border border-[#D9E2EA] text-[#606460] font-bold">
                            RFQ: {quotation.rfq_id}
                          </span>
                        )}

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wide ${statusConfig.badgeClass}`}
                        >
                          {statusConfig.label}
                        </span>
                      </div>

                      <h2 className="text-lg font-black text-[#173885] mt-2">
                        {quotation.projectName || "Untitled Project"}
                      </h2>

                      <p className="text-xs text-[#606460] mt-1">
                        {statusConfig.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/vendor/quotations/${encodeURIComponent(
                          quotation.id,
                        )}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#D9E2EA] text-[#173885] text-xs font-bold hover:border-[#33B2FF] hover:bg-[#E4EEF3] transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        View
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>

                      {isAccepted && (
                        <button
                          type="button"
                          onClick={() => handleConvertToOrder(quotation.id)}
                          disabled={isConverting}
                          className="btn-gm-primary inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold disabled:opacity-60"
                        >
                          {isConverting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ArrowRight className="w-3.5 h-3.5" />
                          )}

                          {isConverting ? "Converting..." : "Convert to Order"}
                        </button>
                      )}

                      {isConverted && quotation.convertedOrderId && (
                        <Link
                          to={`/vendor/orders/${quotation.convertedOrderId}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs font-black"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          Open Order
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Main Information */}
                <div className="p-5">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Buyer */}
                    <div className="rounded-xl border border-[#D9E2EA] bg-[#FEFEFE] p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 className="w-4 h-4 text-[#173885]" />

                        <span className="text-[10px] font-black uppercase tracking-wider text-[#6F8A92]">
                          Buyer
                        </span>
                      </div>

                      <p className="text-sm font-black text-[#173885]">
                        {quotation.buyerName || "B2B Customer"}
                      </p>

                      {quotation.buyerPhone && (
                        <p className="text-xs text-[#606460] mt-1 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" />
                          {quotation.buyerPhone}
                        </p>
                      )}

                      {quotation.buyerGstin && (
                        <p className="text-xs text-[#606460] mt-1">
                          GSTIN:{" "}
                          <span className="font-semibold text-[#173885]">
                            {quotation.buyerGstin}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Site */}
                    <div className="rounded-xl border border-[#D9E2EA] bg-[#FEFEFE] p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4 text-[#173885]" />

                        <span className="text-[10px] font-black uppercase tracking-wider text-[#6F8A92]">
                          Project Site
                        </span>
                      </div>

                      <p className="text-xs text-[#606460] leading-relaxed">
                        {quotation.siteAddress || "Site address not available."}
                      </p>
                    </div>

                    {/* Commercial Summary */}
                    <div className="rounded-xl border border-[#D9E2EA] bg-[#FEFEFE] p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <IndianRupee className="w-4 h-4 text-[#173885]" />

                        <span className="text-[10px] font-black uppercase tracking-wider text-[#6F8A92]">
                          Commercial Total
                        </span>
                      </div>

                      <p className="text-xl font-black text-[#173885]">
                        {formatCurrency(quotation.grandTotal)}
                      </p>

                      <div className="text-[10px] text-[#606460] mt-1 space-y-0.5">
                        <p>
                          Products:{" "}
                          {formatCurrency(quotation.totalProductSubtotal)}
                        </p>

                        <p>
                          Delivery: {formatCurrency(quotation.deliveryCharge)}
                        </p>

                        <p>
                          Unloading: {formatCurrency(quotation.unloadingCharge)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Products */}
                  <div className="mt-4 rounded-xl border border-[#D9E2EA] overflow-hidden">
                    <div className="px-4 py-3 bg-[#F8FBFD] border-b border-[#D9E2EA] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-[#173885]" />

                        <span className="text-[10px] font-black uppercase tracking-wider text-[#6F8A92]">
                          Quoted Products
                        </span>
                      </div>

                      <span className="text-[10px] font-bold text-[#606460]">
                        {items.length} {items.length === 1 ? "item" : "items"}
                      </span>
                    </div>

                    {items.length === 0 ? (
                      <div className="p-4 text-xs text-[#606460]">
                        No quotation items available.
                      </div>
                    ) : (
                      <div className="divide-y divide-[#D9E2EA]">
                        {items.map((item, index) => (
                          <div
                            key={item.id || item.productId || index}
                            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[#173885]">
                                {item.productName || "Product"}
                              </p>

                              <p className="text-[10px] text-[#606460] mt-0.5">
                                Quantity:{" "}
                                <span className="font-semibold">
                                  {item.quantity}
                                </span>{" "}
                                {item.unit || "unit"}
                              </p>
                            </div>

                            <div className="text-left sm:text-right">
                              <p className="text-xs text-[#606460]">
                                {formatCurrency(item.unitRate)} /{" "}
                                {item.unit || "unit"}
                              </p>

                              <p className="text-sm font-black text-[#173885] mt-0.5">
                                {formatCurrency(item.total)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dates + Delivery */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                    <div className="flex items-start gap-2.5">
                      <Calendar className="w-4 h-4 text-[#6F8A92] mt-0.5" />

                      <div>
                        <p className="text-[10px] uppercase tracking-wide font-bold text-[#6F8A92]">
                          Submitted
                        </p>

                        <p className="text-xs font-semibold text-[#173885] mt-0.5">
                          {formatDateTime(quotation.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Clock className="w-4 h-4 text-[#6F8A92] mt-0.5" />

                      <div>
                        <p className="text-[10px] uppercase tracking-wide font-bold text-[#6F8A92]">
                          Valid Until
                        </p>

                        <p className="text-xs font-semibold text-[#173885] mt-0.5">
                          {formatDate(quotation.validUntil)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-[#6F8A92] mt-0.5" />

                      <div>
                        <p className="text-[10px] uppercase tracking-wide font-bold text-[#6F8A92]">
                          Delivery Schedule
                        </p>

                        <p className="text-xs font-semibold text-[#173885] mt-0.5">
                          {quotation.estimatedDeliverySchedule ||
                            "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {(quotation.notes || quotation.moqConditions) && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {quotation.moqConditions && (
                        <div className="rounded-xl bg-[#F8FBFD] border border-[#D9E2EA] p-4">
                          <p className="text-[10px] uppercase tracking-wide font-black text-[#6F8A92]">
                            MOQ Conditions
                          </p>

                          <p className="text-xs text-[#606460] mt-1 leading-relaxed">
                            {quotation.moqConditions}
                          </p>
                        </div>
                      )}

                      {quotation.notes && (
                        <div className="rounded-xl bg-[#F8FBFD] border border-[#D9E2EA] p-4">
                          <p className="text-[10px] uppercase tracking-wide font-black text-[#6F8A92]">
                            Vendor Notes
                          </p>

                          <p className="text-xs text-[#606460] mt-1 leading-relaxed">
                            {quotation.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Converted Order */}
                  {isConverted && quotation.convertedOrderId && (
                    <div className="mt-4 rounded-xl bg-[#E1F2D9] border border-[#3F7D20]/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-[#3F7D20] shrink-0 mt-0.5" />

                        <div>
                          <p className="text-xs font-black text-[#3F7D20]">
                            Wholesale Order Created
                          </p>

                          <p className="text-[11px] text-[#3F7D20]/80 mt-0.5">
                            Order ID:{" "}
                            <span className="font-mono font-bold">
                              {quotation.convertedOrderId}
                            </span>
                          </p>
                        </div>
                      </div>

                      <Link
                        to={`/vendor/orders/${quotation.convertedOrderId}`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#3F7D20]/30 text-[#3F7D20] text-xs font-black"
                      >
                        View Wholesale Order
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Info */}
      {!loading && quotations.length > 0 && (
        <div className="rounded-2xl border border-[#D9E2EA] bg-[#F8FBFD] p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#173885] shrink-0 mt-0.5" />

          <div>
            <p className="text-xs font-black text-[#173885]">
              Wholesale quotation workflow
            </p>

            <p className="text-[11px] text-[#606460] mt-1 leading-relaxed">
              Once a customer accepts a quotation, it can be converted into a
              real wholesale order. The resulting order enters the normal vendor
              fulfillment lifecycle.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorQuotations;
