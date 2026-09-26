import React, { useState, useEffect } from "react";
import {
  Package,
  Search,
  Filter,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  ArrowRight,
  Building2,
  Truck,
  Tag,
  DollarSign,
  Layers,
  Boxes,
  X,
  ExternalLink,
} from "lucide-react";
import { adminProductModerationService } from "../../services/adminProductModerationService";
import { AdminPermissionGuard } from "./AdminPermissionGuard";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";
import { CATALOGUE_CATEGORIES } from "../../data/categories";
import { SeoHead } from "../common/SeoHead";

const STATUS_FILTERS = [
  { label: "All Products", value: "ALL" },
  { label: "Submitted / Review", value: "SUBMITTED" },
  { label: "Under Review", value: "UNDER_REVIEW" },
  { label: "Changes Requested", value: "CHANGES_REQUESTED" },
  { label: "Published / Approved", value: "PUBLISHED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Draft", value: "DRAFT" },
];

export const AdminProductReviewPanel = () => {
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("SUBMITTED");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Detailed Modal Inspection
  const [inspectingProduct, setInspectingProduct] = useState(null);
  const [decisionType, setDecisionType] = useState(null); // 'PUBLISHED' | 'CHANGES_REQUESTED' | 'REJECTED'
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminProductModerationService.getProductsQueue({
        status: statusFilter,
        search,
        limit: 50,
      });
      setProducts(res.products);
      setTotalCount(res.totalCount);
    } catch (err) {
      setError(err.message || "Failed to load product moderation queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadProducts();
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (decisionType === "REJECTED" && !rejectionReason.trim()) {
      setError("A rejection reason is strictly required.");
      return;
    }
    if (decisionType === "CHANGES_REQUESTED" && !reviewerNotes.trim()) {
      setError(
        "Reviewer notes are required when requesting product modifications.",
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await adminProductModerationService.submitDecision({
        productId: inspectingProduct.id,
        decision: decisionType,
        reviewerNotes,
        rejectionReason,
      });

      setActionSuccess(
        `Product "${inspectingProduct.name}" marked as ${decisionType}.`,
      );
      setInspectingProduct(null);
      setDecisionType(null);
      setReviewerNotes("");
      setRejectionReason("");
      loadProducts();
    } catch (err) {
      setError(err.message || "Failed to record moderation decision.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val) =>
    `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  const getStatusBadge = (status) => {
    switch (status) {
      case "PUBLISHED":
      case "APPROVED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30">
            PUBLISHED
          </span>
        );
      case "UNDER_REVIEW":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FFF0D5] text-[#A66A08] border border-[#A66A08]/30">
            UNDER REVIEW
          </span>
        );
      case "SUBMITTED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#E4EEF3] text-[#173885] border border-[#3C7DDA]/30">
            SUBMITTED
          </span>
        );
      case "CHANGES_REQUESTED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FFF0D5] text-[#A66A08] border border-[#A66A08]/30">
            CHANGES REQUESTED
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FBE3DE] text-[#B43D20] border border-[#B43D20]/30">
            REJECTED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#F4F6FA] text-[#606460] border border-[#D9E2EA]">
            DRAFT
          </span>
        );
    }
  };

  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.REVIEW_PRODUCTS}>
      <div className="space-y-6 pb-20 font-sans">
        <SeoHead
          title="Product Approvals & Moderation | Ferrado Admin"
          description="Review product listings, technical attributes, dynamic pricing, and stock readiness before publication."
          canonicalUrl="/admin/product-reviews"
          noIndex={true}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
          <div>
            <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Marketplace Quality Oversight
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
              Product Moderation & Approvals
            </h1>
            <p className="text-xs text-[#606460]">
              Inspect product details, vendor pricing, dynamic attributes, and
              stock levels before publishing to the customer store.
            </p>
          </div>

          <button
            onClick={loadProducts}
            disabled={loading}
            className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RotateCcw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span>Refresh Queue</span>
          </button>
        </div>

        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Toolbar */}
        <div className="gm-panel p-4 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1 max-w-md"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92]" />
            <input
              type="text"
              placeholder="Search product name, brand, vendor, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full gm-input pl-10 pr-20 py-2 rounded-xl text-xs"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 btn-gm-primary px-3 py-1 rounded-lg text-xs font-bold"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <Filter className="w-3.5 h-3.5 text-[#6F8A92] shrink-0 mr-1" />
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                  statusFilter === f.value
                    ? "bg-[#173885] text-[#FEFEFE] shadow-xs"
                    : "bg-[#F4F6FA] text-[#606460] hover:bg-[#E4EEF3] hover:text-[#173885]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Queue */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-28 bg-[#FEFEFE] rounded-2xl border border-[#D9E2EA]"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="gm-panel p-12 rounded-3xl border border-[#D9E2EA] text-center space-y-2 bg-[#FEFEFE]">
            <Package className="w-10 h-10 text-[#6F8A92] mx-auto" />
            <h2 className="text-base font-bold text-[#173885]">
              No Products in Moderation Queue
            </h2>
            <p className="text-xs text-[#606460]">
              No product listings match the current status filter.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p) => {
              const vendor = p.vendor_profiles;
              const stock = p.vendor_inventory;
              const category = CATALOGUE_CATEGORIES.find(
                (c) => c.slug === p.category_slug,
              );
              const coverImg = p.cover_image_url || p.image_urls?.[0];

              return (
                <div
                  key={p.id}
                  className="gm-panel p-4 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-[#3C7DDA] transition shadow-2xs"
                >
                  <div className="flex items-start gap-3.5 flex-1">
                    <div className="w-16 h-16 rounded-xl bg-[#F4F6FA] border border-[#D9E2EA] overflow-hidden shrink-0 flex items-center justify-center">
                      {coverImg ? (
                        <img
                          src={coverImg}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-[#6F8A92]" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#173885]">
                          {p.name}
                        </span>
                        {getStatusBadge(p.status)}
                        <span className="text-[10px] font-bold text-[#3C7DDA] bg-[#E4EEF3] px-2 py-0.5 rounded-md">
                          {category?.name || p.category_slug}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#606460]">
                        <span className="flex items-center gap-1 font-semibold text-[#282926]">
                          <Building2 className="w-3.5 h-3.5 text-[#3C7DDA]" />
                          <span>{vendor?.business_name || "Vendor Depot"}</span>
                        </span>
                        <span>•</span>
                        <span>
                          Brand:{" "}
                          <strong className="text-[#282926]">{p.brand}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Price:{" "}
                          <strong className="text-[#173885] font-mono">
                            {formatCurrency(p.price)} / {p.unit}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Available Stock:{" "}
                          <strong className="text-[#282926] font-mono">
                            {stock
                              ? stock.on_hand_stock - stock.reserved_stock
                              : 0}{" "}
                            {p.unit}
                          </strong>
                        </span>
                        {p.is_express_30min_available && (
                          <span className="text-[10px] font-bold text-[#3F7D20] bg-[#E1F2D9] px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Truck className="w-3 h-3" /> 30-Min Express
                          </span>
                        )}
                      </div>

                      {p.reviewer_notes && (
                        <p className="text-[11px] text-[#A66A08] bg-[#FFF0D5] px-2.5 py-0.5 rounded-md inline-block">
                          <strong>Moderator Note:</strong> {p.reviewer_notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setInspectingProduct(p);
                      setDecisionType("PUBLISHED");
                      setReviewerNotes(p.reviewer_notes || "");
                    }}
                    className="btn-gm-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 self-end md:self-auto shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#FEFEFE]" />
                    <span>Inspect Product</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Inspect & Moderate Modal */}
        {inspectingProduct && (
          <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-2xl p-6 sm:p-8 rounded-3xl relative shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
              <button
                type="button"
                onClick={() => setInspectingProduct(null)}
                className="absolute top-5 right-5 text-[#606460] hover:text-[#282926]"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="border-b border-[#D9E2EA] pb-3 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-[#173885]">
                    {inspectingProduct.name}
                  </h3>
                  {getStatusBadge(inspectingProduct.status)}
                </div>
                <p className="text-xs text-[#606460]">
                  Vendor:{" "}
                  <strong>
                    {inspectingProduct.vendor_profiles?.business_name}
                  </strong>{" "}
                  • Brand: <strong>{inspectingProduct.brand}</strong>
                </p>
              </div>

              {/* Product Gallery */}
              {inspectingProduct.image_urls?.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-[#6F8A92] uppercase">
                    Product Media ({inspectingProduct.image_urls.length})
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {inspectingProduct.image_urls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative group shrink-0"
                      >
                        <img
                          src={url}
                          alt={`Preview ${idx}`}
                          className="w-20 h-20 rounded-xl object-cover border border-[#D9E2EA]"
                        />
                        <ExternalLink className="absolute bottom-1 right-1 w-3.5 h-3.5 text-[#FEFEFE] bg-[#173885]/80 p-0.5 rounded opacity-0 group-hover:opacity-100 transition" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Core Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#F4F6FA] p-4 rounded-2xl">
                <div>
                  <span className="text-[10px] text-[#6F8A92] font-bold uppercase">
                    Pricing
                  </span>
                  <p className="font-mono font-bold text-sm text-[#173885]">
                    {formatCurrency(inspectingProduct.price)}
                  </p>
                  <span className="text-[10px] text-[#606460]">
                    per {inspectingProduct.unit}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#6F8A92] font-bold uppercase">
                    Minimum Order
                  </span>
                  <p className="font-mono font-bold text-sm text-[#282926]">
                    {inspectingProduct.moq} {inspectingProduct.unit}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-[#6F8A92] font-bold uppercase">
                    Stock on Hand
                  </span>
                  <p className="font-mono font-bold text-sm text-[#282926]">
                    {inspectingProduct.vendor_inventory
                      ? inspectingProduct.vendor_inventory.on_hand_stock
                      : 0}{" "}
                    {inspectingProduct.unit}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-[#6F8A92] font-bold uppercase">
                    30-Min Delivery
                  </span>
                  <p className="font-bold text-sm text-[#3F7D20]">
                    {inspectingProduct.is_express_30min_available
                      ? "Eligible"
                      : "Standard"}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1 text-xs">
                <span className="text-[10px] font-bold text-[#6F8A92] uppercase">
                  Product Description
                </span>
                <p className="text-[#606460] bg-[#FEFEFE] p-3 rounded-xl border border-[#D9E2EA] whitespace-pre-wrap leading-relaxed">
                  {inspectingProduct.description}
                </p>
              </div>

              {/* Dynamic Technical Attributes */}
              {inspectingProduct.dynamic_attributes?.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold text-[#6F8A92] uppercase">
                    Technical Attributes
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {inspectingProduct.dynamic_attributes.map((attr, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border border-[#D9E2EA] bg-[#FEFEFE]"
                      >
                        <span className="text-[10px] text-[#6F8A92] block">
                          {attr.name}
                        </span>
                        <span className="font-bold text-[#173885]">
                          {attr.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Moderation Form */}
              <form
                onSubmit={handleDecisionSubmit}
                className="space-y-4 pt-3 border-t border-[#D9E2EA]"
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDecisionType("PUBLISHED")}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                      decisionType === "PUBLISHED"
                        ? "bg-[#E1F2D9] text-[#3F7D20] border-2 border-[#3F7D20]"
                        : "bg-[#F4F6FA] text-[#606460] border border-[#D9E2EA]"
                    }`}
                  >
                    Approve & Publish
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionType("CHANGES_REQUESTED")}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                      decisionType === "CHANGES_REQUESTED"
                        ? "bg-[#FFF0D5] text-[#A66A08] border-2 border-[#A66A08]"
                        : "bg-[#F4F6FA] text-[#606460] border border-[#D9E2EA]"
                    }`}
                  >
                    Request Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionType("REJECTED")}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                      decisionType === "REJECTED"
                        ? "bg-[#FBE3DE] text-[#B43D20] border-2 border-[#B43D20]"
                        : "bg-[#F4F6FA] text-[#606460] border border-[#D9E2EA]"
                    }`}
                  >
                    Reject
                  </button>
                </div>

                {decisionType === "REJECTED" && (
                  <div>
                    <label className="text-xs font-bold text-[#282926] block mb-1">
                      Rejection Reason *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why this product listing is rejected..."
                      className="w-full gm-input p-3 rounded-xl text-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Moderator Remarks / Notes{" "}
                    {decisionType === "CHANGES_REQUESTED" && "*"}
                  </label>
                  <textarea
                    required={decisionType === "CHANGES_REQUESTED"}
                    rows={2}
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    placeholder="Enter notes dispatched to the vendor..."
                    className="w-full gm-input p-3 rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setInspectingProduct(null)}
                    disabled={submitting}
                    className="btn-gm-secondary px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-gm-primary px-5 py-2 rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
                  >
                    <span>
                      {submitting
                        ? "Processing..."
                        : `Submit Decision (${decisionType})`}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminPermissionGuard>
  );
};
