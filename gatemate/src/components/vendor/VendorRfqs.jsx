import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Search,
  RotateCcw,
  MapPin,
  Calendar,
  ChevronRight,
  Building2,
  Phone,
  Package,
  AlertCircle,
} from "lucide-react";

import { useVendorAuth } from "../../context/VendorAuthContext";

import {
  vendorRfqService,
  RFQ_STATUS,
  RFQ_STATUS_CONFIG,
} from "../../services/vendorRfqService";

import { SeoHead } from "../common/SeoHead";

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

export const VendorRfqs = () => {
  const { vendorUser } = useVendorAuth();

  const [rfqs, setRfqs] = useState([]);

  const [loading, setLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");

  /* ---------------------------------------------------------------------- */
  /* Load RFQs                                                              */
  /* ---------------------------------------------------------------------- */

  const loadRfqs = async () => {
    if (!vendorUser?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const data = await vendorRfqService.getVendorRfqs();

      setRfqs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load vendor RFQs:", error);

      setErrorMessage(error?.message || "Unable to load project RFQs.");

      setRfqs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vendorUser?.id) {
      loadRfqs();
    } else {
      setLoading(false);
    }
  }, [vendorUser?.id]);

  /* ---------------------------------------------------------------------- */
  /* Filtering                                                              */
  /* ---------------------------------------------------------------------- */

  const filteredRfqs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rfqs.filter((rfq) => {
      const products = Array.isArray(rfq.requestedProducts)
        ? rfq.requestedProducts
        : [];

      const searchableText = [
        rfq.id,
        rfq.projectName,
        rfq.buyerName,
        rfq.buyerPhone,
        rfq.buyerGstin,
        rfq.status,
        rfq.siteAddress?.address,
        rfq.siteAddress?.locality,
        rfq.siteAddress?.city,
        rfq.siteAddress?.pincode,

        ...products.flatMap((product) => [
          product.name,
          product.unit,
          product.notes,
          product.productId,
        ]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      const matchesStatus =
        statusFilter === "ALL" || rfq.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rfqs, search, statusFilter]);

  /* ---------------------------------------------------------------------- */
  /* Status filters                                                         */
  /* ---------------------------------------------------------------------- */

  const statusFilters = [
    {
      key: "ALL",
      label: "All RFQs",
    },
    {
      key: RFQ_STATUS.NEW,
      label: "New RFQs",
    },
    {
      key: RFQ_STATUS.QUOTATION_SENT,
      label: "Quotation Sent",
    },
    {
      key: RFQ_STATUS.NEGOTIATION,
      label: "Negotiation",
    },
    {
      key: RFQ_STATUS.ACCEPTED,
      label: "Accepted",
    },
    {
      key: RFQ_STATUS.REJECTED,
      label: "Rejected",
    },
    {
      key: RFQ_STATUS.EXPIRED,
      label: "Expired",
    },
    {
      key: RFQ_STATUS.CONVERTED_TO_ORDER,
      label: "Converted to Order",
    },
    {
      key: RFQ_STATUS.COMPLETED,
      label: "Completed",
    },
  ];

  /* ---------------------------------------------------------------------- */
  /* Loading                                                                */
  /* ---------------------------------------------------------------------- */

  if (loading && rfqs.length === 0) {
    return (
      <div className="space-y-6 pb-24 font-sans">
        <div className="border-b border-[#D9E2EA] pb-5">
          <div className="h-4 w-48 bg-[#E4EEF3] rounded animate-pulse" />

          <div className="h-8 w-80 bg-[#E4EEF3] rounded mt-3 animate-pulse" />

          <div className="h-4 w-full max-w-xl bg-[#E4EEF3] rounded mt-2 animate-pulse" />
        </div>

        <div className="gm-panel p-4 rounded-2xl border border-[#D9E2EA]">
          <div className="h-10 bg-[#E4EEF3] rounded-xl animate-pulse" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="gm-panel h-56 rounded-3xl border border-[#D9E2EA] bg-[#F4F6FA] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* UI                                                                     */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="space-y-6 pb-24 font-sans">
      <SeoHead
        title="Commercial Project RFQs | GateMate Vendor Portal"
        description="Review incoming construction project RFQs and submit commercial quotations."
        canonicalUrl="/vendor/rfqs"
        noIndex={true}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div>
          <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Commercial Bidding
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-2">
            Commercial Project RFQs
          </h1>

          <p className="text-xs text-[#606460] mt-1">
            Review incoming project requirements, quantities, site details, and
            submit commercial quotations.
          </p>
        </div>

        <button
          type="button"
          onClick={loadRfqs}
          disabled={loading}
          className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
        >
          <RotateCcw
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
          />

          <span>Refresh RFQs</span>
        </button>
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />

          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filters */}
      <div className="gm-panel p-4 rounded-2xl border border-[#D9E2EA] space-y-4">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92] pointer-events-none" />

          <input
            type="text"
            placeholder="Search RFQ ID, project, buyer, phone, city, or product..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full gm-input pl-10 pr-4 py-2.5 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full overflow-x-auto pb-1 scrollbar-none">
          {statusFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setStatusFilter(filter.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                statusFilter === filter.key
                  ? "bg-[#173885] text-[#FEFEFE]"
                  : "bg-[#F4F6FA] text-[#606460] hover:bg-[#E4EEF3]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#6F8A92]">
          <span>
            Showing{" "}
            <strong className="text-[#173885]">{filteredRfqs.length}</strong> of{" "}
            <strong className="text-[#173885]">{rfqs.length}</strong> RFQs
          </span>

          {(search || statusFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
              }}
              className="text-[#3C7DDA] font-bold hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {!loading && filteredRfqs.length === 0 && (
        <div className="gm-panel p-16 rounded-3xl text-center space-y-3 border border-[#D9E2EA]">
          <FileText className="w-12 h-12 text-[#6F8A92] mx-auto" />

          <h3 className="text-base font-bold text-[#173885]">
            No Project RFQs Found
          </h3>

          <p className="text-xs text-[#606460] max-w-md mx-auto">
            {rfqs.length === 0
              ? "There are currently no incoming commercial project RFQs assigned to this vendor."
              : "No RFQs match the current search or status filter."}
          </p>

          {(search || statusFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
              }}
              className="btn-gm-secondary px-4 py-2 rounded-xl text-xs font-bold"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* RFQ list */}
      {filteredRfqs.length > 0 && (
        <div className="space-y-4">
          {filteredRfqs.map((rfq) => {
            const statusCfg = RFQ_STATUS_CONFIG[rfq.status] || {
              label: rfq.status || "Unknown",
              badgeClass: "bg-[#F4F6FA] text-[#606460] border border-[#D9E2EA]",
            };

            const products = Array.isArray(rfq.requestedProducts)
              ? rfq.requestedProducts
              : [];

            const site = rfq.siteAddress || {};

            const quotation = rfq.quotation;

            const quotationStatus = quotation?.status || null;

            return (
              <div
                key={rfq.id}
                className="gm-panel p-5 sm:p-6 rounded-3xl border border-[#D9E2EA] hover:border-[#3C7DDA] transition space-y-5 shadow-xs"
              >
                {/* Card header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-black text-[#173885] text-sm">
                        {rfq.id}
                      </span>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] ${statusCfg.badgeClass}`}
                      >
                        {statusCfg.label}
                      </span>

                      {quotationStatus && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-[#F4F6FA] text-[#606460] border border-[#D9E2EA]">
                          Quote: {quotationStatus}
                        </span>
                      )}
                    </div>

                    <h2 className="text-sm sm:text-base font-bold text-[#282926]">
                      {rfq.projectName || "Untitled Project"}
                    </h2>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#606460]">
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-[#3C7DDA]" />

                        <strong className="text-[#282926]">
                          {rfq.buyerName || "Buyer"}
                        </strong>
                      </span>

                      {rfq.buyerPhone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />

                          <span className="font-mono">{rfq.buyerPhone}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/vendor/rfqs/${encodeURIComponent(rfq.id)}`}
                    className="btn-gm-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm self-start lg:self-auto shrink-0"
                  >
                    <span>
                      {quotation ? "View Quotation" : "Submit Quotation"}
                    </span>

                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Main content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Products */}
                  <div className="lg:col-span-7 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F8A92]">
                        Requested Products
                      </span>

                      <span className="text-[10px] text-[#6F8A92] font-mono">
                        {products.length}{" "}
                        {products.length === 1 ? "line" : "lines"}
                      </span>
                    </div>

                    {products.length === 0 ? (
                      <div className="p-4 rounded-2xl bg-[#F4F6FA] border border-[#D9E2EA] text-xs text-[#606460]">
                        No requested products found.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {products.map((product, index) => {
                          const productKey =
                            product.productId ||
                            product.id ||
                            `product-${index}`;

                          return (
                            <div
                              key={productKey}
                              className="bg-[#F4F6FA] p-3 rounded-2xl border border-[#D9E2EA]"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <strong className="text-xs font-bold text-[#282926] block">
                                    {product.name || "Product"}
                                  </strong>

                                  {product.notes && (
                                    <p className="text-[10px] text-[#606460] mt-1 line-clamp-2">
                                      {product.notes}
                                    </p>
                                  )}
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="text-[10px] text-[#6F8A92] block">
                                    Quantity
                                  </span>

                                  <strong className="text-xs font-mono text-[#173885]">
                                    {Number(
                                      product.quantity || 0,
                                    ).toLocaleString("en-IN")}{" "}
                                    {product.unit || "unit"}
                                  </strong>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Site / RFQ information */}
                  <div className="lg:col-span-5 space-y-3">
                    <div className="bg-[#F4F6FA] p-4 rounded-2xl border border-[#D9E2EA] space-y-3">
                      <div className="flex items-center gap-1.5 text-[#173885] font-bold">
                        <MapPin className="w-3.5 h-3.5 text-[#3C7DDA]" />

                        <span className="text-xs">Site Destination</span>
                      </div>

                      <div>
                        <p className="text-[11px] text-[#282926] font-semibold leading-relaxed">
                          {site.address || "Address not provided"}
                        </p>

                        <p className="text-[10px] text-[#606460] mt-1">
                          {[site.locality, site.city, site.state, site.pincode]
                            .filter(Boolean)
                            .join(", ") || "Location details not provided"}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#D9E2EA] grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[9px] text-[#6F8A92] uppercase font-bold block">
                            RFQ Created
                          </span>

                          <span className="text-[10px] text-[#282926] font-mono">
                            {formatDate(rfq.createdAt)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[9px] text-[#6F8A92] uppercase font-bold block">
                            RFQ Expires
                          </span>

                          <span className="text-[10px] text-[#282926] font-mono">
                            {formatDate(rfq.expiryDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {rfq.buyerProjectNotes && (
                      <div className="p-3 rounded-2xl bg-[#FFF0D5] border border-[#A66A08]/30">
                        <span className="text-[9px] font-bold text-[#A66A08] uppercase block mb-1">
                          Buyer Notes
                        </span>

                        <p className="text-[10px] text-[#606460] line-clamp-3 leading-relaxed">
                          {rfq.buyerProjectNotes}
                        </p>
                      </div>
                    )}
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

export default VendorRfqs;
