import React, { useState, useEffect, useCallback } from "react";
import { Star, ShieldCheck, MessageSquare, Plus, Info } from "lucide-react";
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
      setError("Unable to load Customer Reviews for this Product.");
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

  const handleReviewSubmitted = () => {
    fetchReviews();
    setEligibilityNotice(
      "Customer Review published successfully. Thank you for sharing your feedback.",
    );
  };

  return (
    <div className="gm-panel p-6 sm:p-8 rounded-3xl space-y-6">
      {/* Top Header & Customer Rating Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#D9E2EA] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-5 h-5 text-[#173885]" />
            <h2 className="text-xl font-black text-[#173885]">
              Customer Reviews & Customer Ratings
            </h2>
          </div>
          <p className="text-xs text-[#606460]">
            Verified Customer Reviews and Product Ratings across Pune and
            Pimpri-Chinchwad.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleWriteReviewClick}
            disabled={eligibilityChecking}
            className="btn-gm-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition disabled:opacity-50"
          >
            <Plus className="w-4 h-4 text-[#FEFEFE]" />
            <span>
              {eligibilityChecking ? "Verifying..." : "Write a Customer Review"}
            </span>
          </button>
        </div>
      </div>

      {/* Ineligibility or Feedback Alert */}
      {eligibilityNotice && (
        <div className="p-3.5 rounded-2xl bg-[#E3EBFA] border border-[#2E4D94]/30 text-[#2E4D94] text-xs flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-[#2E4D94]" />
          <span>{eligibilityNotice}</span>
        </div>
      )}

      {/* Customer Ratings Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 rounded-2xl bg-[#F4F6FA] border border-[#D9E2EA] items-center">
        <div className="text-center md:border-r border-[#D9E2EA] md:pr-4">
          <div className="text-4xl font-black text-[#173885] font-mono">
            {reviewsData.averageRating || product.rating}
          </div>
          <div className="flex justify-center text-[#3C7DDA] my-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="w-4 h-4 fill-current text-[#3C7DDA]"
              />
            ))}
          </div>
          <p className="text-[11px] text-[#606460] font-semibold">
            Overall Customer Rating ({reviewsData.totalCount} reviews)
          </p>
        </div>

        {/* Progress Bars */}
        <div className="md:col-span-2 space-y-2 text-xs">
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
                <span className="w-7 text-[11px] font-bold text-[#282926] flex items-center gap-0.5">
                  {stars}{" "}
                  <Star className="w-3 h-3 text-[#3C7DDA] fill-[#3C7DDA]" />
                </span>
                <div className="flex-1 h-2.5 rounded-full bg-[#D9E2EA] overflow-hidden">
                  <div
                    className="h-full bg-[#3C7DDA] rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-[10px] text-[#606460] font-mono text-right font-bold">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Customer Reviews List */}
      <div className="space-y-4 pt-2">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="gm-card p-5 rounded-2xl h-28 animate-pulse bg-[#E4EEF3]"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-[#B43D20]">{error}</div>
        ) : reviewsData.reviews.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-xs font-bold text-[#282926]">
              No Customer Reviews submitted yet for this Product.
            </p>
            <p className="text-[11px] text-[#606460]">
              Be the first verified customer in Pune or PCMC to write a Customer
              Review.
            </p>
          </div>
        ) : (
          reviewsData.reviews.map((rev) => (
            <div key={rev.id} className="gm-card p-5 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#E4EEF3] text-[#173885] font-bold flex items-center justify-center text-xs">
                    {rev.userName?.[0] || "C"}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#282926] flex items-center gap-2">
                      <span>{rev.userName}</span>
                      {rev.isVerifiedPurchase && (
                        <span className="text-[10px] text-[#3F7D20] bg-[#E1F2D9] border border-[#3F7D20]/30 px-2 py-0.2 rounded-full flex items-center gap-1 font-semibold">
                          <ShieldCheck className="w-3 h-3" /> Verified Purchase
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-[#6F8A92]">
                      {rev.userLocation}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] text-[#6F8A92]">
                  {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              {/* Stars & Headline */}
              <div className="space-y-1">
                <div className="flex text-[#3C7DDA]">
                  {Array(rev.rating)
                    .fill(0)
                    .map((_, i) => (
                      <Star
                        key={i}
                        className="w-3.5 h-3.5 fill-current text-[#3C7DDA]"
                      />
                    ))}
                </div>
                {rev.headline && (
                  <h5 className="text-xs font-bold text-[#282926]">
                    {rev.headline}
                  </h5>
                )}
                <p className="text-xs text-[#606460] leading-relaxed">
                  {rev.comment}
                </p>
              </div>

              {/* Review Photos */}
              {rev.images && rev.images.length > 0 && (
                <div className="flex gap-2 pt-1">
                  {rev.images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="w-16 h-16 rounded-xl overflow-hidden border border-[#D9E2EA] bg-[#F4F6FA]"
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

      {/* Review Form Modal */}
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
