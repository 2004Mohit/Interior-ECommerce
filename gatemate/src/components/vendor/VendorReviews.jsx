import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Star,
  Search,
  RotateCcw,
  ShieldCheck,
  MessageSquare,
  ExternalLink,
  Filter,
  CheckCircle2,
  Info,
  Package,
  Sparkles,
} from "lucide-react";
import { useVendorAuth } from "../../context/VendorAuthContext";
import {
  vendorReviewService,
  REVIEW_MODERATION_STATUS,
} from "../../services/vendorReviewService";
import { SeoHead } from "../common/SeoHead";

export const VendorReviews = () => {
  const { vendorUser } = useVendorAuth();

  const [reviews, setReviews] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("ALL");

  const loadReviewsData = async () => {
    if (!vendorUser?.id) return;
    setLoading(true);
    const [revList, met] = await Promise.all([
      vendorReviewService.getVendorProductReviews(),
      vendorReviewService.getProductReviewMetrics(),
    ]);
    setReviews(revList);
    setMetrics(met);
    setLoading(false);
  };

  useEffect(() => {
    if (vendorUser?.id) {
      loadReviewsData();
    } else {
      setLoading(false);
    }
  }, [vendorUser?.id]);

  const filteredReviews = reviews.filter((r) => {
    const matchSearch =
      r.productName.toLowerCase().includes(search.toLowerCase()) ||
      r.customerName.toLowerCase().includes(search.toLowerCase()) ||
      r.comment.toLowerCase().includes(search.toLowerCase()) ||
      r.headline.toLowerCase().includes(search.toLowerCase());
    const matchRating =
      ratingFilter === "ALL" || r.rating === Number(ratingFilter);
    return matchSearch && matchRating;
  });

  return (
    <div className="space-y-6 pb-24 font-sans">
      <SeoHead
        title="Customer Product Reviews | GateMate Vendor Portal"
        description="Inspect customer ratings and feedback on your listed construction products in Pune & PCMC."
        canonicalUrl="/vendor/reviews"
        noIndex={true}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div>
          <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Customer Feedback & Ratings
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
            Customer Product Reviews
          </h1>
          <p className="text-xs text-[#606460]">
            Review ratings, test feedback, and site performance evaluations
            submitted by verified buyers for your products.
          </p>
        </div>

        <button
          onClick={loadReviewsData}
          className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh Reviews</span>
        </button>
      </div>

      {/* Product Reviews Only Policy Banner */}
      <div className="p-4 rounded-2xl bg-[#E4EEF3] border border-[#9AAED4]/40 text-xs text-[#173885] flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#3C7DDA] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <strong className="font-bold">GateMate Product Rating Policy:</strong>
          <p className="text-[11px] text-[#606460] leading-relaxed">
            GateMate exclusively supports{" "}
            <strong>Customer Product Ratings and Reviews</strong> on individual
            construction products (Cement, TMT Steel, AAC Blocks, Sand, etc.).
            GateMate does not issue vendor performance ratings or seller scores.
          </p>
        </div>
      </div>

      {/* Metrics & Ratings Distribution Card */}
      <div className="gm-panel p-6 sm:p-8 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center shadow-xs">
        {/* Left: Overall Product Score */}
        <div className="lg:col-span-4 text-center lg:border-r border-[#D9E2EA] lg:pr-6 space-y-2">
          <span className="text-[11px] font-bold text-[#6F8A92] uppercase tracking-wider block">
            Average Customer Product Rating
          </span>
          <div className="text-5xl font-black text-[#173885] font-mono tracking-tight">
            {metrics?.averageRating || "0.0"}
          </div>
          <div className="flex justify-center text-[#3C7DDA] my-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  (metrics?.averageRating || 0) >= star
                    ? "fill-[#3C7DDA] text-[#3C7DDA]"
                    : "text-[#D9E2EA]"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-[#606460]">
            Based on{" "}
            <strong>
              {metrics?.totalReviews || 0} verified customer review(s)
            </strong>
          </p>
        </div>

        {/* Right: 5-to-1 Star Distribution Breakdown */}
        <div className="lg:col-span-8 space-y-2 text-xs">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = metrics?.ratingBreakdown?.[stars] || 0;
            const percentage =
              metrics?.totalReviews > 0
                ? (count / metrics.totalReviews) * 100
                : 0;

            return (
              <div key={stars} className="flex items-center gap-3">
                <span className="w-10 text-[11px] font-bold text-[#282926] flex items-center gap-1 shrink-0">
                  {stars}{" "}
                  <Star className="w-3.5 h-3.5 fill-[#3C7DDA] text-[#3C7DDA]" />
                </span>
                <div className="flex-1 h-3 rounded-full bg-[#E4EEF3] overflow-hidden">
                  <div
                    className="h-full bg-[#3C7DDA] rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-12 text-[11px] text-[#606460] font-mono text-right shrink-0">
                  {count} ({Math.round(percentage)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="gm-panel p-4 rounded-2xl border border-[#D9E2EA] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92] pointer-events-none" />
          <input
            type="text"
            placeholder="Search reviews by product name, buyer, or feedback..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full gm-input pl-10 pr-4 py-2 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { key: "ALL", label: "All Reviews" },
            { key: "5", label: "5 Stars" },
            { key: "4", label: "4 Stars" },
            { key: "3", label: "3 Stars" },
            { key: "2", label: "2 Stars" },
            { key: "1", label: "1 Star" },
          ].map((pill) => (
            <button
              key={pill.key}
              onClick={() => setRatingFilter(pill.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                ratingFilter === pill.key
                  ? "bg-[#173885] text-[#FEFEFE]"
                  : "bg-[#F4F6FA] text-[#606460] hover:bg-[#E4EEF3]"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Feed */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="gm-panel p-6 rounded-3xl h-36 animate-pulse bg-[#E4EEF3]"
            />
          ))}
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="gm-panel p-16 rounded-3xl text-center space-y-3 border border-[#D9E2EA]">
          <MessageSquare className="w-12 h-12 text-[#6F8A92] mx-auto" />
          <h3 className="text-base font-bold text-[#173885]">
            No Customer Reviews Found
          </h3>
          <p className="text-xs text-[#606460]">
            There are no customer product reviews matching your filter criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="gm-panel p-5 sm:p-6 rounded-3xl border border-[#D9E2EA] hover:border-[#3C7DDA] transition space-y-4 shadow-xs"
            >
              {/* Review Card Header: Product & Buyer Context */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9E2EA] pb-3.5">
                <div className="flex items-center gap-3">
                  <img
                    src={rev.productImg}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover bg-[#F4F6FA] border border-[#D9E2EA] shrink-0"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-[#3C7DDA] uppercase tracking-wider block">
                      Product: {rev.productCategory}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-[#282926] hover:text-[#173885] transition-colors">
                      {rev.productName}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Link
                    to={`/products/${rev.productSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-gm-secondary px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 text-[#3C7DDA]"
                    title="View public product review on customer storefront"
                  >
                    <span>Storefront View</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Rating, Headline & Review Body */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="flex text-[#3C7DDA]">
                      {Array(rev.rating)
                        .fill(0)
                        .map((_, i) => (
                          <Star
                            key={i}
                            className="w-4 h-4 fill-current text-[#3C7DDA]"
                          />
                        ))}
                    </div>
                    <span className="text-xs font-bold text-[#173885]">
                      {rev.rating}.0 / 5.0
                    </span>
                    {rev.isVerifiedPurchase && (
                      <span className="bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Verified Purchase
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-[#6F8A92] font-mono">
                    Reviewed on{" "}
                    {new Date(rev.reviewDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {rev.headline && (
                  <h4 className="text-xs font-bold text-[#173885]">
                    {rev.headline}
                  </h4>
                )}

                <p className="text-xs text-[#282926] leading-relaxed">
                  "{rev.comment}"
                </p>
              </div>

              {/* Customer Identity Footer (Read-Only) */}
              <div className="pt-3 border-t border-[#D9E2EA] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#606460]">
                <div>
                  Customer:{" "}
                  <strong className="text-[#282926]">{rev.customerName}</strong>{" "}
                  ({rev.customerLocation})
                </div>
                <div className="text-[10px] text-[#3F7D20] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Published on
                  Storefront
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
