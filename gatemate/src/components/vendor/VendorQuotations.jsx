import React, { useState, useEffect } from "react";
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
  const vendorId = vendorUser?.id || "vnd-pune-001";
  const navigate = useNavigate();

  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [convertingId, setConvertingId] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);

  const loadQuotations = async () => {
    setLoading(true);
    const data = await vendorQuotationService.getVendorQuotations(vendorId);
    setQuotations(data);
    setLoading(false);
  };

  useEffect(() => {
    loadQuotations();
  }, [vendorId]);

  const handleConvertToOrder = async (quoteId) => {
    setConvertingId(quoteId);
    setActionNotice(null);

    try {
      const result =
        await vendorQuotationService.convertAcceptedQuotationToOrder(
          vendorId,
          quoteId,
        );
      setActionNotice(
        `Quotation converted to Wholesale Order ${result.createdOrder.id}!`,
      );
      loadQuotations();
      setTimeout(() => {
        navigate(`/vendor/orders/${result.createdOrder.id}`);
      }, 1200);
    } catch (err) {
      alert(err.message || "Failed to convert quotation to order.");
    } finally {
      setConvertingId(null);
    }
  };

  const filteredQuotations = quotations.filter((q) => {
    const matchSearch =
      q.id.toLowerCase().includes(search.toLowerCase()) ||
      q.projectName.toLowerCase().includes(search.toLowerCase()) ||
      q.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      q.items.some((it) =>
        it.productName.toLowerCase().includes(search.toLowerCase()),
      );
    const matchStatus = statusFilter === "ALL" || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalQuotations = quotations.length;
  const acceptedCount = quotations.filter(
    (q) => q.status === QUOTATION_STATUS.ACCEPTED,
  ).length;
  const pendingCustomerCount = quotations.filter(
    (q) =>
      q.status === QUOTATION_STATUS.SUBMITTED ||
      q.status === QUOTATION_STATUS.UNDER_REVIEW,
  ).length;
  const convertedCount = quotations.filter(
    (q) => q.status === QUOTATION_STATUS.CONVERTED_TO_ORDER,
  ).length;

  return (
    <div className="space-y-6 pb-24 font-sans">
      <SeoHead
        title="Commercial Quotations Ledger | GateMate Vendor Portal"
        description="Track submitted commercial quotations, customer acceptance decisions, and convert accepted quotes into wholesale orders."
        canonicalUrl="/vendor/quotations"
        noIndex={true}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div>
          <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Commercial Quotations Ledger
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
            Vendor Quotations Tracker
          </h1>
          <p className="text-xs text-[#606460]">
            Track submitted project price bids, inspect customer review states,
            and convert accepted quotations into active wholesale orders.
          </p>
        </div>

        <button
          onClick={loadQuotations}
          className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh Quotations</span>
        </button>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#3F7D20]" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="gm-card p-5 rounded-2xl border border-[#D9E2EA]">
          <span className="text-[11px] font-bold text-[#6F8A92] uppercase tracking-wider block">
            Total Quotations Sent
          </span>
          <div className="text-2xl font-black text-[#173885] mt-1 font-mono">
            {totalQuotations}
          </div>
          <span className="text-[10px] text-[#606460] mt-0.5 block">
            Across all commercial RFQs
          </span>
        </div>

        <div className="gm-card p-5 rounded-2xl border border-[#D9E2EA] bg-[#E3EBFA]/30">
          <span className="text-[11px] font-bold text-[#173885] uppercase tracking-wider block">
            Awaiting Customer Decision
          </span>
          <div className="text-2xl font-black text-[#173885] mt-1 font-mono">
            {pendingCustomerCount}
          </div>
          <span className="text-[10px] text-[#3C7DDA] font-semibold mt-0.5 block">
            Under evaluation by buyer
          </span>
        </div>

        <div className="gm-card p-5 rounded-2xl border border-[#D9E2EA] bg-[#E1F2D9]/40">
          <span className="text-[11px] font-bold text-[#3F7D20] uppercase tracking-wider block">
            Accepted Quotations
          </span>
          <div className="text-2xl font-black text-[#3F7D20] mt-1 font-mono">
            {acceptedCount}
          </div>
          <span className="text-[10px] text-[#3F7D20] font-bold mt-0.5 block">
            Ready to convert to Order
          </span>
        </div>

        <div className="gm-card p-5 rounded-2xl border border-[#D9E2EA] bg-[#E4EEF3]/40">
          <span className="text-[11px] font-bold text-[#173885] uppercase tracking-wider block">
            Converted into Orders
          </span>
          <div className="text-2xl font-black text-[#173885] mt-1 font-mono">
            {convertedCount}
          </div>
          <span className="text-[10px] text-[#606460] mt-0.5 block">
            In active fulfillment queue
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="gm-panel p-4 rounded-2xl border border-[#D9E2EA] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92] pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Quotation ID, project, buyer, or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full gm-input pl-10 pr-4 py-2 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { key: "ALL", label: "All Quotations" },
            { key: QUOTATION_STATUS.SUBMITTED, label: "Submitted" },
            { key: QUOTATION_STATUS.ACCEPTED, label: "Accepted" },
            {
              key: QUOTATION_STATUS.CONVERTED_TO_ORDER,
              label: "Converted to Order",
            },
            { key: QUOTATION_STATUS.REJECTED, label: "Declined" },
            { key: QUOTATION_STATUS.EXPIRED, label: "Expired" },
          ].map((pill) => (
            <button
              key={pill.key}
              onClick={() => setStatusFilter(pill.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                statusFilter === pill.key
                  ? "bg-[#173885] text-[#FEFEFE]"
                  : "bg-[#F4F6FA] text-[#606460] hover:bg-[#E4EEF3]"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quotations List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="gm-panel p-6 rounded-3xl h-36 animate-pulse bg-[#E4EEF3]"
            />
          ))}
        </div>
      ) : filteredQuotations.length === 0 ? (
        <div className="gm-panel p-16 rounded-3xl text-center space-y-3 border border-[#D9E2EA]">
          <Receipt className="w-12 h-12 text-[#6F8A92] mx-auto" />
          <h3 className="text-base font-bold text-[#173885]">
            No Commercial Quotations Found
          </h3>
          <p className="text-xs text-[#606460]">
            There are no quotations matching your search or status filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuotations.map((quote) => {
            const statusCfg = QUOTATION_STATUS_CONFIG[quote.status] || {
              label: quote.status,
              badgeClass: "bg-[#F4F6FA]",
            };
            const isAccepted = quote.status === QUOTATION_STATUS.ACCEPTED;
            const isConverted =
              quote.status === QUOTATION_STATUS.CONVERTED_TO_ORDER;

            return (
              <div
                key={quote.id}
                className="gm-panel p-5 sm:p-6 rounded-3xl border border-[#D9E2EA] hover:border-[#3C7DDA] transition space-y-4 shadow-xs"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9E2EA] pb-3.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-black text-[#173885] text-sm">
                        {quote.id}
                      </span>
                      <span className="text-[10px] text-[#6F8A92] font-mono">
                        (RFQ:{" "}
                        <Link
                          to={`/vendor/rfqs/${quote.rfqId}`}
                          className="text-[#3C7DDA] hover:underline"
                        >
                          {quote.rfqId}
                        </Link>
                        )
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] ${statusCfg.badgeClass}`}
                      >
                        {statusCfg.label}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#282926]">
                      {quote.projectName}
                    </h3>
                    <p className="text-[11px] text-[#606460]">
                      Client:{" "}
                      <strong className="text-[#282926]">
                        {quote.buyerName}
                      </strong>{" "}
                      • Contact:{" "}
                      <span className="font-mono">{quote.buyerPhone}</span>
                    </p>
                  </div>

                  {/* Actions & Price */}
                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <div className="text-right sm:block hidden">
                      <div className="font-mono font-black text-[#173885] text-base">
                        ₹{quote.grandTotal.toLocaleString("en-IN")}
                      </div>
                      <span className="text-[10px] text-[#3F7D20] font-semibold">
                        Gross Total (Incl. 18% GST)
                      </span>
                    </div>

                    {isAccepted && (
                      <button
                        type="button"
                        disabled={convertingId === quote.id}
                        onClick={() => handleConvertToOrder(quote.id)}
                        className="btn-gm-primary bg-[#3F7D20] hover:bg-[#34661A] text-[#FEFEFE] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>
                          {convertingId === quote.id
                            ? "Converting..."
                            : "Convert to Wholesale Order"}
                        </span>
                      </button>
                    )}

                    {isConverted && quote.convertedOrderId && (
                      <Link
                        to={`/vendor/orders/${quote.convertedOrderId}`}
                        className="btn-gm-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                      >
                        <span>View Order {quote.convertedOrderId}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    )}

                    {!isAccepted && !isConverted && (
                      <Link
                        to={`/vendor/rfqs/${quote.rfqId}`}
                        className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <span>Inspect RFQ</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Quoted Items Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                  {/* Line Items */}
                  <div className="md:col-span-7 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F8A92] block">
                      Quoted Product Lines ({quote.items.length} item
                      {quote.items.length > 1 ? "s" : ""})
                    </span>
                    <div className="space-y-2">
                      {quote.items.map((it) => (
                        <div
                          key={it.id}
                          className="bg-[#F4F6FA] p-3 rounded-2xl border border-[#D9E2EA] flex items-center justify-between gap-2"
                        >
                          <div>
                            <strong className="text-[#282926] text-xs font-bold block">
                              {it.productName}
                            </strong>
                            <span className="text-[10px] text-[#6F8A92] font-mono">
                              Rate: ₹{it.unitPrice} / {it.unit} × {it.quantity}{" "}
                              {it.unit}s
                            </span>
                          </div>
                          <span className="font-mono font-bold text-xs text-[#173885] shrink-0">
                            ₹{it.totalItemPrice.toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>

                    {quote.moqConditions && (
                      <p className="text-[10px] text-[#606460] italic pt-1">
                        <strong>MOQ Terms:</strong> {quote.moqConditions}
                      </p>
                    )}
                  </div>

                  {/* Planned Delivery & Pricing Breakdown */}
                  <div className="md:col-span-5 bg-[#F4F6FA] p-3.5 rounded-2xl border border-[#D9E2EA] space-y-2.5 flex flex-col justify-between">
                    <div className="space-y-1 text-[#606460]">
                      <div className="flex items-center gap-1.5 text-[#173885] font-bold">
                        <Calendar className="w-3.5 h-3.5 text-[#3C7DDA]" />
                        <span>Estimated Delivery Turnaround</span>
                      </div>
                      <p className="text-[11px] text-[#282926] font-semibold leading-relaxed">
                        {quote.estimatedDeliverySchedule}
                      </p>
                      <div className="pt-1.5 space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span>Product Subtotal:</span>
                          <span className="font-mono font-bold text-[#282926]">
                            ₹
                            {quote.totalProductSubtotal.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Freight & Unloading:</span>
                          <span className="font-mono font-bold text-[#282926]">
                            ₹
                            {(
                              quote.deliveryCharge + quote.unloadingCharge
                            ).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>18% GST (ITC):</span>
                          <span className="font-mono font-bold text-[#282926]">
                            ₹{quote.taxes.gstAmount.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#D9E2EA] flex items-center justify-between text-[10px] text-[#6F8A92] font-mono">
                      <span>
                        Valid until:{" "}
                        {new Date(quote.validUntil).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "short" },
                        )}
                      </span>
                      <strong className="text-sm text-[#173885] font-black">
                        Total: ₹{quote.grandTotal.toLocaleString("en-IN")}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
