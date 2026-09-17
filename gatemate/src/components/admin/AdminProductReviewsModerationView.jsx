import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Star,
  Search,
  Filter,
  RotateCcw,
  Package,
  Building2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  X,
  ShieldAlert,
} from "lucide-react";
import { adminSupportService } from "../../services/adminSupportService";
import { AdminPermissionGuard } from "./AdminPermissionGuard";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";
import { SeoHead } from "../common/SeoHead";

export const AdminProductReviewsModerationView = () => {
  const [reviews, setReviews] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Moderation Dialog State
  const [activeReview, setActiveReview] = useState(null);
  const [decision, setDecision] = useState("HIDDEN");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminSupportService.getProductReviews({
        status: statusFilter,
        search,
        limit: 100,
      });
      setReviews(res.reviews);
      setTotalCount(res.totalCount);
    } catch (err) {
      setError(err.message || "Failed to load customer product reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadReviews();
  };

  const handleModerateSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("A moderation reason is strictly required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await adminSupportService.moderateProductReview({
        reviewId: activeReview.id,
        decision,
        moderationReason: reason,
      });

      setActionSuccess(`Customer Product Review marked as ${decision}.`);
      setActiveReview(null);
      setReason("");
      loadReviews();
    } catch (err) {
      setError(err.message || "Moderation action failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.MANAGE_REVIEWS}>
      <div className="space-y-6 pb-20 font-sans">
        <SeoHead
          title="Customer Product Reviews Moderation | GateMate Admin"
          description="Inspect and moderate Customer Product Ratings and Reviews across construction items."
          canonicalUrl="/admin/reviews"
          noIndex={true}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
          <div>
            <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Product Feedback Oversight
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
              Customer Product Reviews Moderation
            </h1>
            <p className="text-xs text-[#606460]">
              Audit Customer Product Ratings, review authenticity, and hide
              inappropriate or fraudulent feedback.
            </p>
          </div>

          <button
            onClick={loadReviews}
            disabled={loading}
            className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RotateCcw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span>Refresh Reviews</span>
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
        <div className="gm-panel p-4 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-2xs">
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1 max-w-md"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92]" />
            <input
              type="text"
              placeholder="Search product, review text, or vendor..."
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

          <div className="flex items-center gap-2 text-xs">
            {["ALL", "PUBLISHED", "FLAGGED", "HIDDEN"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  statusFilter === st
                    ? "bg-[#173885] text-[#FEFEFE] shadow-xs"
                    : "bg-[#F4F6FA] text-[#606460] hover:bg-[#E4EEF3] hover:text-[#173885]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-[#FEFEFE] rounded-2xl border border-[#D9E2EA]"
              />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="gm-panel p-12 rounded-3xl border border-[#D9E2EA] text-center space-y-2 bg-[#FEFEFE]">
            <Star className="w-10 h-10 text-[#6F8A92] mx-auto" />
            <h2 className="text-base font-bold text-[#173885]">
              No Customer Product Reviews Found
            </h2>
            <p className="text-xs text-[#606460]">
              No reviews match the selected filter criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs"
              >
                <div className="space-y-1.5 flex-1 text-xs">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-sm text-[#173885]">
                      {rev.product?.name || "Construction Product"}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-[#A66A08] bg-[#FFF0D5] px-2.5 py-0.5 rounded-full">
                      <Star className="w-3.5 h-3.5 fill-[#A66A08]" />
                      <span>{rev.customer_product_rating} / 5</span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        rev.status === "PUBLISHED"
                          ? "bg-[#E1F2D9] text-[#3F7D20]"
                          : rev.status === "FLAGGED"
                            ? "bg-[#FFF0D5] text-[#A66A08]"
                            : "bg-[#FBE3DE] text-[#B43D20]"
                      }`}
                    >
                      {rev.status}
                    </span>
                    <span className="text-[10px] font-mono text-[#6F8A92]">
                      {new Date(rev.created_at).toLocaleDateString("en-IN")}
                    </span>
                  </div>

                  <p className="text-[#282926] bg-[#F4F6FA] p-3 rounded-xl border border-[#D9E2EA] italic">
                    "{rev.customer_product_review || "No text review submitted"}
                    "
                  </p>

                  <div className="flex flex-wrap items-center gap-x-3 text-[#606460]">
                    <span>
                      Vendor:{" "}
                      <strong className="text-[#282926]">
                        {rev.vendor?.business_name || "Vendor Depot"}
                      </strong>
                    </span>
                    <span>•</span>
                    <Link
                      to={`/admin/customers/${rev.user_id}`}
                      className="text-[#3C7DDA] hover:underline font-bold"
                    >
                      View Customer Account
                    </Link>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveReview(rev);
                      setDecision(
                        rev.status === "PUBLISHED" ? "HIDDEN" : "PUBLISHED",
                      );
                      setReason("");
                    }}
                    className="btn-gm-primary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-[#FEFEFE]" />
                    <span>Moderate Review</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Moderation Dialog */}
        {activeReview && (
          <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-md p-6 sm:p-8 rounded-3xl relative shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-[#D9E2EA] pb-3">
                <h3 className="text-lg font-black text-[#173885]">
                  Moderate Customer Product Review
                </h3>
                <button
                  onClick={() => setActiveReview(null)}
                  className="text-[#606460] hover:text-[#282926]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleModerateSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Target Moderation Decision *
                  </label>
                  <select
                    value={decision}
                    onChange={(e) => setDecision(e.target.value)}
                    className="w-full gm-input px-3 py-2 rounded-xl text-xs font-bold"
                  >
                    <option value="PUBLISHED">
                      PUBLISHED (Visible in Store)
                    </option>
                    <option value="HIDDEN">
                      HIDDEN (Removed from Product Storefront)
                    </option>
                    <option value="FLAGGED">
                      FLAGGED (Under Policy Investigation)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Moderation Reason & Audit Remarks *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Specify policy violation reason (e.g. Abusive language, fraudulent competitor review)..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full gm-input p-3 rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveReview(null)}
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
