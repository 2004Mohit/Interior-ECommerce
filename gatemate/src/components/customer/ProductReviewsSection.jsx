import React, { useState, useEffect, useCallback } from "react";
import {
  Star,
  ShieldCheck,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Plus,
} from "lucide-react";
import { reviewService } from "../../services/reviewService";
import { useAuth } from "../../context/AuthContext";
import { AuthModal } from "../AuthModal";
import { ReviewFormModal } from "./ReviewFormModal";

export const ProductReviewsSection = ({ product }) => {
  const { user } = useAuth();

  const [reviewsData, setReviewsData] = useState({
    reviews: [],
    totalCount: 0,
    averageRating: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Eligibility & Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [eligibilityChecking, setEligibilityChecking] = useState(false);
  const [eligibilityNotice, setEligibilityNotice] = useState(null);

  const fetchReviews = useCallback(async () => {
    if (!product?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await reviewService.getProductReviews(product.id);
      setReviewsData(data);
    } catch (err) {
      setError("Unable to load customer reviews.");
    } finally {
      setLoading(false);
    }
  }, [product?.id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleWriteReviewClick = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    setEligibilityChecking(true);
    setEligibilityNotice(null);

    const eligibility = await reviewService.checkCustomerEligibility(
      user.id,
      product.id,
    );
    setEligibilityChecking(false);

    if (eligibility.isEligible) {
      setIsFormModalOpen(true);
    } else {
      setEligibilityNotice(eligibility.message);
    }
  };

  const handleReviewSubmitted = (newReview) => {
    fetchReviews();
    setEligibilityNotice(
      "Review published successfully! Thank you for sharing your feedback.",
    );
  };

  return (
    <div className="premium-panel p-6 sm:p-8 rounded-3xl space-y-6 border border-white/10">
      {/* Top Header & Rating Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-black text-white">
              Customer Reviews & Ratings
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Authentic feedback from verified customers across Pune and
            Pimpri-Chinchwad.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleWriteReviewClick}
            disabled={eligibilityChecking}
            className="gold-gradient-btn px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg active:scale-95 transition disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>
              {eligibilityChecking
                ? "Checking Eligibility..."
                : "Write a Review"}
            </span>
          </button>
        </div>
      </div>

      {/* Ineligibility or Feedback Alert */}
      {eligibilityNotice && (
        <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <InfoIcon className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{eligibilityNotice}</span>
        </div>
      )}

      {/* Ratings Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-2xl bg-[#091526] border border-white/5 items-center">
        <div className="text-center md:border-r border-white/10 md:pr-4">
          <div className="text-4xl font-black text-white font-mono">
            {reviewsData.averageRating || product.rating}
          </div>
          <div className="flex justify-center text-amber-400 my-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-4 h-4 fill-current" />
            ))}
          </div>
          <p className="text-[11px] text-slate-400">
            Based on {reviewsData.totalCount} verified review(s)
          </p>
        </div>

        {/* Progress Bars */}
        <div className="md:col-span-2 space-y-1.5 text-xs">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = reviewsData.ratingDistribution[stars] || 0;
            const percentage =
              reviewsData.totalCount > 0
                ? (count / reviewsData.totalCount) * 100
                : stars === 5
                  ? 85
                  : 15;
            return (
              <div key={stars} className="flex items-center gap-3">
                <span className="w-7 text-[11px] font-bold text-slate-400 flex items-center gap-0.5">
                  {stars}{" "}
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-[10px] text-slate-400 font-mono text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-4 pt-2">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="premium-card p-5 rounded-2xl h-28 animate-pulse bg-white/5"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-slate-400">{error}</div>
        ) : reviewsData.reviews.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-xs text-slate-300">
              No customer reviews published yet for this item.
            </p>
            <p className="text-[11px] text-slate-500">
              Be the first verified customer in Pune or PCMC to submit a review!
            </p>
          </div>
        ) : (
          reviewsData.reviews.map((rev) => (
            <div
              key={rev.id}
              className="premium-card p-5 rounded-2xl space-y-3 border border-white/5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-400 font-bold flex items-center justify-center text-xs">
                    {rev.userName?.[0] || "C"}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{rev.userName}</span>
                      {rev.isVerifiedPurchase && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.2 rounded-full flex items-center gap-1 font-semibold">
                          <ShieldCheck className="w-3 h-3" /> Verified Buyer
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {rev.userLocation}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] text-slate-500">
                  {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              {/* Stars & Headline */}
              <div className="space-y-1">
                <div className="flex text-amber-400">
                  {Array(rev.rating)
                    .fill(0)
                    .map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                </div>
                {rev.headline && (
                  <h5 className="text-xs font-bold text-slate-200">
                    {rev.headline}
                  </h5>
                )}
                <p className="text-xs text-slate-300 leading-relaxed">
                  {rev.comment}
                </p>
              </div>

              {/* Review Photos */}
              {rev.images && rev.images.length > 0 && (
                <div className="flex gap-2 pt-1">
                  {rev.images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 bg-black"
                    >
                      <img
                        src={imgUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Form and Auth Modals */}
      <ReviewFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        product={product}
        user={user}
        onReviewSubmitted={handleReviewSubmitted}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          handleWriteReviewClick();
        }}
      />
    </div>
  );
};

const InfoIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);
