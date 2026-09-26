import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Star,
  Search,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  X,
  ShieldAlert,
  User,
  MapPin,
  ShoppingBag,
  Building2,
  Clock3,
  ShieldCheck,
} from "lucide-react";

import { adminSupportService } from "../../services/adminSupportService";
import { AdminPermissionGuard } from "./AdminPermissionGuard";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";
import { SeoHead } from "../common/SeoHead";

const STATUS_FILTERS = ["ALL", "PENDING_REVIEW", "PUBLISHED", "FLAGGED"];

const STATUS_LABELS = {
  ALL: "All Reviews",
  PENDING_REVIEW: "Pending Review",
  PUBLISHED: "Published",
  FLAGGED: "Flagged",
};

const getStatusClasses = (status) => {
  switch (status) {
    case "PUBLISHED":
      return "bg-[#E1F2D9] text-[#3F7D20] border-[#3F7D20]/20";

    case "FLAGGED":
      return "bg-[#FFF0D5] text-[#A66A08] border-[#A66A08]/20";

    case "PENDING_REVIEW":
    default:
      return "bg-[#FBE3DE] text-[#B43D20] border-[#B43D20]/20";
  }
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

const renderStars = (rating) => {
  const numericRating = Number(rating || 0);

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= numericRating
              ? "fill-[#A66A08] text-[#A66A08]"
              : "text-[#B8C3CB]"
          }`}
        />
      ))}
    </div>
  );
};

export const AdminProductReviewsModerationView = () => {
  const [reviews, setReviews] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const [activeReview, setActiveReview] = useState(null);
  const [decision, setDecision] = useState("PUBLISHED");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminSupportService.getProductReviews({
        status: statusFilter,
        search,
        limit: 100,
        offset: 0,
      });

      setReviews(response?.reviews || []);
      setTotalCount(response?.totalCount || 0);
    } catch (err) {
      setError(err?.message || "Failed to load Customer Product Reviews.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    await loadReviews();
  };

  const openModerationDialog = (review) => {
    setActiveReview(review);
    setReason("");

    if (review.moderation_status === "PUBLISHED") {
      setDecision("FLAGGED");
    } else {
      setDecision("PUBLISHED");
    }

    setError(null);
    setActionSuccess(null);
  };

  const closeModerationDialog = () => {
    if (submitting) {
      return;
    }

    setActiveReview(null);
    setReason("");
  };

  const handleModerateSubmit = async (event) => {
    event.preventDefault();

    if (!activeReview?.id) {
      setError("No Customer Product Review is selected.");
      return;
    }

    const cleanReason = reason.trim();

    if (!cleanReason) {
      setError("A moderation reason is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setActionSuccess(null);

    try {
      await adminSupportService.moderateProductReview({
        reviewId: activeReview.id,
        decision,
        moderationReason: cleanReason,
      });

      setActiveReview(null);
      setReason("");

      setActionSuccess(`Customer Product Review moved to ${decision}.`);

      await loadReviews();
    } catch (err) {
      setError(err?.message || "Customer Product Review moderation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.MANAGE_REVIEWS}>
      <div className="space-y-6 pb-20 font-sans">
        <SeoHead
          title="Customer Product Reviews Moderation | Ferrado Admin"
          description="Inspect and moderate Customer Product Ratings and Reviews across construction products."
          canonicalUrl="/admin/reviews"
          noIndex={true}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
          <div>
            <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Product Feedback Oversight
            </span>

            <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-2">
              Customer Product Reviews Moderation
            </h1>

            <p className="text-xs text-[#606460] mt-1 max-w-2xl">
              Review verified Customer Product feedback before it becomes
              visible in the Ferrado storefront.
            </p>
          </div>

          <button
            type="button"
            onClick={loadReviews}
            disabled={loading}
            className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-60"
          >
            <RotateCcw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />

            <span>Refresh Reviews</span>
          </button>
        </div>

        {/* Success */}
        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>

            <button
              type="button"
              onClick={() => setActionSuccess(null)}
              className="ml-auto text-[#3F7D20] font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-auto font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="gm-panel p-4 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] shadow-2xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex-1 max-w-xl"
            >
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92]" />

              <input
                type="text"
                placeholder="Search product, review, customer, or vendor..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full gm-input pl-10 pr-24 py-2.5 rounded-xl text-xs"
              />

              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 btn-gm-primary px-3.5 py-1.5 rounded-lg text-xs font-bold"
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {STATUS_FILTERS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    statusFilter === status
                      ? "bg-[#173885] text-[#FEFEFE] shadow-xs"
                      : "bg-[#F4F6FA] text-[#606460] hover:bg-[#E4EEF3] hover:text-[#173885]"
                  }`}
                >
                  {STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 text-[11px] text-[#6F8A92]">
            {loading
              ? "Loading Customer Product Reviews..."
              : `${totalCount} review${totalCount === 1 ? "" : "s"} found`}
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="h-40 bg-[#FEFEFE] rounded-2xl border border-[#D9E2EA] animate-pulse"
              />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          /* Empty */
          <div className="gm-panel p-12 rounded-3xl border border-[#D9E2EA] text-center bg-[#FEFEFE]">
            <Star className="w-10 h-10 text-[#6F8A92] mx-auto mb-3" />

            <h2 className="text-base font-bold text-[#173885]">
              No Customer Product Reviews Found
            </h2>

            <p className="text-xs text-[#606460] mt-1">
              No reviews match the selected filter criteria.
            </p>
          </div>
        ) : (
          /* Reviews */
          <div className="space-y-3">
            {reviews.map((review) => {
              const status = review.moderation_status || "PENDING_REVIEW";

              return (
                <div
                  key={review.id}
                  className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] shadow-2xs"
                >
                  <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-5">
                    {/* Review Content */}
                    <div className="flex-1 min-w-0">
                      {/* Product + status */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-black text-sm text-[#173885]">
                          {review.product?.name || "Construction Product"}
                        </span>

                        <span
                          className={`px-2.5 py-1 rounded-full border text-[10px] font-black ${getStatusClasses(
                            status,
                          )}`}
                        >
                          {status}
                        </span>

                        {review.is_verified_purchase && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E4EEF3] text-[#173885] text-[10px] font-bold">
                            <ShieldCheck className="w-3 h-3" />
                            Verified Purchase
                          </span>
                        )}
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-2 mt-2">
                        {renderStars(review.rating)}

                        <span className="text-xs font-black text-[#A66A08]">
                          {Number(review.rating || 0).toFixed(1)}
                          /5
                        </span>

                        <span className="text-[10px] text-[#6F8A92]">
                          {formatDate(review.created_at)}
                        </span>
                      </div>

                      {/* Headline */}
                      {review.headline && (
                        <h3 className="font-bold text-sm text-[#282926] mt-3">
                          {review.headline}
                        </h3>
                      )}

                      {/* Comment */}
                      <p className="text-xs text-[#282926] bg-[#F4F6FA] p-3 rounded-xl border border-[#D9E2EA] mt-2 whitespace-pre-wrap leading-relaxed">
                        {review.comment || "No text review submitted."}
                      </p>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-[11px] text-[#606460]">
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />

                          <strong className="text-[#282926]">
                            {review.user_name || "Customer"}
                          </strong>
                        </span>

                        {review.user_location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {review.user_location}
                          </span>
                        )}

                        {review.vendor?.business_name && (
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            Vendor:{" "}
                            <strong className="text-[#282926]">
                              {review.vendor.business_name}
                            </strong>
                          </span>
                        )}

                        {review.order_id && (
                          <span className="inline-flex items-center gap-1 font-mono">
                            <ShoppingBag className="w-3.5 h-3.5" />
                            Order: {review.order_id}
                          </span>
                        )}
                      </div>

                      {/* Customer link */}
                      {review.user_id && (
                        <div className="mt-3">
                          <Link
                            to={`/admin/customers/${review.user_id}`}
                            className="text-[#3C7DDA] hover:underline font-bold text-[11px]"
                          >
                            View Customer Account
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openModerationDialog(review)}
                        className="btn-gm-primary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />

                        <span>Moderate Review</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Moderation Dialog */}
        {activeReview && (
          <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl relative shadow-2xl">
              {/* Dialog Header */}
              <div className="flex justify-between items-start border-b border-[#D9E2EA] pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#6F8A92]">
                    Customer Product Review
                  </span>

                  <h3 className="text-lg font-black text-[#173885] mt-1">
                    Moderate Review
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={closeModerationDialog}
                  disabled={submitting}
                  className="text-[#606460] hover:text-[#282926] disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Review Preview */}
              <div className="py-4 space-y-3">
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#6F8A92]">
                    Product
                  </p>

                  <p className="text-sm font-black text-[#173885]">
                    {activeReview.product?.name || "Construction Product"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {renderStars(activeReview.rating)}

                  <span className="text-xs font-bold text-[#A66A08]">
                    {activeReview.rating}/5
                  </span>
                </div>

                {activeReview.headline && (
                  <p className="font-bold text-sm text-[#282926]">
                    {activeReview.headline}
                  </p>
                )}

                <p className="text-xs text-[#606460] bg-[#F4F6FA] border border-[#D9E2EA] rounded-xl p-3 whitespace-pre-wrap">
                  {activeReview.comment || "No text review submitted."}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl border border-[#D9E2EA]">
                    <p className="text-[10px] text-[#6F8A92]">Customer</p>

                    <p className="text-xs font-bold text-[#282926]">
                      {activeReview.user_name || "Customer"}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-[#D9E2EA]">
                    <p className="text-[10px] text-[#6F8A92]">Current Status</p>

                    <p className="text-xs font-bold text-[#282926]">
                      {activeReview.moderation_status || "PENDING_REVIEW"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Moderation Form */}
              <form
                onSubmit={handleModerateSubmit}
                className="space-y-4 border-t border-[#D9E2EA] pt-4"
              >
                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Moderation Decision *
                  </label>

                  <select
                    value={decision}
                    onChange={(event) => setDecision(event.target.value)}
                    className="w-full gm-input px-3 py-2.5 rounded-xl text-xs font-bold"
                    disabled={submitting}
                  >
                    <option value="PUBLISHED">
                      PUBLISHED — Visible in Store
                    </option>

                    <option value="PENDING_REVIEW">
                      PENDING_REVIEW — Keep Under Review
                    </option>

                    <option value="FLAGGED">
                      FLAGGED — Policy Investigation
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Moderation Reason & Audit Remarks *
                  </label>

                  <textarea
                    required
                    rows={4}
                    placeholder="Explain why this review is being published, kept under review, or flagged."
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className="w-full gm-input p-3 rounded-xl text-xs resize-none"
                    disabled={submitting}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModerationDialog}
                    disabled={submitting}
                    className="btn-gm-secondary px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-gm-primary px-5 py-2 rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting && (
                      <Clock3 className="w-3.5 h-3.5 animate-spin" />
                    )}

                    <span>
                      {submitting ? "Applying..." : "Apply Moderation"}
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
