import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  Star,
  ShieldCheck,
  ExternalLink,
  Lock,
  Clock3,
  Flag,
  AlertCircle,
  RefreshCw,
  MapPin,
  PackageCheck,
} from "lucide-react";

import { AccountNav } from "./AccountNav";
import { useAuth } from "../../context/AuthContext";
import { AuthModal } from "../AuthModal";
import { supabase } from "../../lib/supabaseClient";

const MODERATION_STATUS = {
  PUBLISHED: "PUBLISHED",
  PENDING_REVIEW: "PENDING_REVIEW",
  FLAGGED: "FLAGGED",
};

const normalizeReview = (review) => ({
  id: review.id,
  productId: review.product_id,
  userId: review.user_id,
  orderId: review.order_id,
  userName: review.user_name || "Verified Customer",
  userLocation: review.user_location || "Pune",
  rating: Number(review.rating || 0),
  headline: review.headline || "",
  comment: review.comment || "",
  isVerifiedPurchase: Boolean(review.is_verified_purchase),
  moderationStatus:
    review.moderation_status || MODERATION_STATUS.PENDING_REVIEW,
  createdAt: review.created_at,
  updatedAt: review.updated_at,
  product: review.vendor_products || null,
});

const getStatusConfig = (status) => {
  switch (status) {
    case MODERATION_STATUS.PUBLISHED:
      return {
        label: "Published",
        icon: ShieldCheck,
        wrapper: "bg-emerald-50 border-emerald-200 text-emerald-700",
        dot: "bg-emerald-500",
        description: "Your review is visible to customers.",
      };

    case MODERATION_STATUS.FLAGGED:
      return {
        label: "Under Review",
        icon: Flag,
        wrapper: "bg-amber-50 border-amber-200 text-amber-700",
        dot: "bg-amber-500",
        description: "Your review is currently under moderation review.",
      };

    case MODERATION_STATUS.PENDING_REVIEW:
    default:
      return {
        label: "Pending Moderation",
        icon: Clock3,
        wrapper: "bg-blue-50 border-blue-200 text-blue-700",
        dot: "bg-blue-500",
        description: "Your review is waiting for admin moderation.",
      };
  }
};

const formatDate = (date) => {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getProductImage = (product) => {
  if (!product) return null;

  if (product.cover_image_url) {
    return product.cover_image_url;
  }

  if (Array.isArray(product.image_urls) && product.image_urls.length > 0) {
    return product.image_urls[0];
  }

  return null;
};

const RatingStars = ({ rating }) => {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = index < rating;

        return (
          <Star
            key={index}
            className={`w-4 h-4 ${
              filled ? "fill-current text-amber-500" : "text-slate-300"
            }`}
          />
        );
      })}
    </div>
  );
};

const ReviewCard = ({ review }) => {
  const product = review.product;
  const productImage = getProductImage(product);
  const statusConfig = getStatusConfig(review.moderationStatus);
  const StatusIcon = statusConfig.icon;

  return (
    <article className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* -------------------------------------------------------- */}
      {/* Product Header */}
      {/* -------------------------------------------------------- */}

      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          {/* Product Image */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 shrink-0">
            {productImage ? (
              <img
                src={productImage}
                alt={product?.name || "Product"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <PackageCheck className="w-7 h-7 text-slate-300" />
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  {product?.name || "Construction Product"}
                </h3>

                {product?.brand && (
                  <p className="text-xs text-slate-500 mt-1">{product.brand}</p>
                )}
              </div>

              {product?.slug && (
                <Link
                  to={`/products/${product.slug}`}
                  className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-3 py-2 rounded-lg transition"
                  title="View Product"
                >
                  <span className="hidden sm:inline">View Product</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {/* Rating + Verified */}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <div className="flex items-center gap-2">
                <RatingStars rating={review.rating} />

                <span className="text-sm font-bold text-slate-800">
                  {review.rating.toFixed(1)}
                </span>
              </div>

              {review.isVerifiedPurchase && (
                <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Purchase
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------- */}
      {/* Review Content */}
      {/* -------------------------------------------------------- */}

      <div className="px-5 sm:px-6 pb-5 sm:pb-6">
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 sm:p-5">
          {review.headline && (
            <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-2">
              {review.headline}
            </h4>
          )}

          <p className="text-sm text-slate-600 leading-6">“{review.comment}”</p>
        </div>
      </div>

      {/* -------------------------------------------------------- */}
      {/* Review Information */}
      {/* -------------------------------------------------------- */}

      <div className="px-5 sm:px-6 py-4 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Clock3 className="w-3.5 h-3.5" />
            Submitted {formatDate(review.createdAt)}
          </span>

          {review.userLocation && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {review.userLocation}
            </span>
          )}

          {review.orderId && (
            <span className="flex items-center gap-1.5">
              <PackageCheck className="w-3.5 h-3.5" />
              Order #{review.orderId}
            </span>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------- */}
      {/* Moderation Status */}
      {/* -------------------------------------------------------- */}

      <div className="px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-100">
        <div className="flex items-start gap-3">
          <div
            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${statusConfig.dot}`}
          />

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold border px-2.5 py-1 rounded-full ${statusConfig.wrapper}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {statusConfig.label}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 mt-1.5">
              {statusConfig.description}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
};

export const CustomerReviews = () => {
  const { user, loading: authLoading } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const loadCustomerReviews = async () => {
    if (!user?.id) {
      setReviews([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: queryError } = await supabase
        .from("product_reviews")
        .select(
          `
            id,
            product_id,
            user_id,
            order_id,
            user_name,
            user_location,
            rating,
            headline,
            comment,
            is_verified_purchase,
            moderation_status,
            created_at,
            updated_at,
            vendor_products:product_id (
              id,
              name,
              slug,
              brand,
              cover_image_url,
              image_urls,
              status
            )
          `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (queryError) {
        console.error("Failed to load customer reviews:", queryError);

        throw new Error(
          queryError.message || "Unable to load your Customer Reviews.",
        );
      }

      const normalizedReviews = (data || [])
        .map(normalizeReview)
        .filter(Boolean);

      setReviews(normalizedReviews);
    } catch (loadError) {
      console.error("Customer Reviews loading failed:", loadError);

      setReviews([]);
      setError(loadError?.message || "Unable to load your Customer Reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.id) {
      loadCustomerReviews();
    }

    if (!authLoading && !user) {
      setReviews([]);
      setLoading(false);
      setError("");
    }
  }, [user, authLoading]);

  /* ------------------------------------------------------------ */
  /* Authentication Loading                                       */
  /* ------------------------------------------------------------ */

  if (authLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <AccountNav />
          </div>

          <div className="md:col-span-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 animate-pulse">
              <div className="h-6 w-52 bg-slate-200 rounded mb-3" />
              <div className="h-4 w-80 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------ */
  /* Not Authenticated                                             */
  /* ------------------------------------------------------------ */

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <AccountNav />
          </div>

          <div className="md:col-span-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-xl">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-5">
                <Lock className="w-6 h-6 text-slate-500" />
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                Sign In to View Your Reviews
              </h2>

              <p className="text-sm text-slate-500 mt-2 leading-6">
                Sign in to view Customer Reviews you have submitted for your
                purchased Products.
              </p>

              <button
                onClick={() => setAuthModalOpen(true)}
                className="mt-6 px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => setAuthModalOpen(false)}
        />
      </div>
    );
  }

  /* ------------------------------------------------------------ */
  /* Main Page                                                     */
  /* ------------------------------------------------------------ */

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        {/* ------------------------------------------------------ */}
        {/* Account Navigation                                     */}
        {/* ------------------------------------------------------ */}

        <div className="md:col-span-1">
          <AccountNav />
        </div>

        {/* ------------------------------------------------------ */}
        {/* Main Content                                           */}
        {/* ------------------------------------------------------ */}

        <main className="md:col-span-3">
          {/* Page Header */}
          <div className="mb-7">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-slate-700" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  My Customer Reviews
                </h1>

                <p className="text-sm text-slate-500 mt-1">
                  Reviews you have submitted for Products you purchased.
                </p>
              </div>
            </div>

            {!loading && !error && reviews.length > 0 && (
              <div className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-lg">
                <MessageSquare className="w-3.5 h-3.5" />
                {reviews.length} {reviews.length === 1 ? "Review" : "Reviews"}
              </div>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="space-y-5">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse"
                >
                  <div className="p-6 flex gap-4">
                    <div className="w-24 h-24 rounded-xl bg-slate-100 shrink-0" />

                    <div className="flex-1">
                      <div className="h-5 w-56 bg-slate-100 rounded" />
                      <div className="h-3 w-24 bg-slate-100 rounded mt-3" />
                      <div className="h-4 w-32 bg-slate-100 rounded mt-4" />
                    </div>
                  </div>

                  <div className="px-6 pb-6">
                    <div className="bg-slate-50 rounded-xl p-5">
                      <div className="h-4 w-36 bg-slate-100 rounded" />
                      <div className="h-3 w-full bg-slate-100 rounded mt-4" />
                      <div className="h-3 w-4/5 bg-slate-100 rounded mt-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="bg-white border border-red-200 rounded-2xl p-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>

                <div className="flex-1">
                  <h2 className="text-sm font-bold text-slate-900">
                    Unable to Load Your Reviews
                  </h2>

                  <p className="text-xs text-slate-500 mt-1 leading-5">
                    {error}
                  </p>

                  <button
                    onClick={loadCustomerReviews}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && reviews.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 sm:p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
                <MessageSquare className="w-7 h-7 text-slate-400" />
              </div>

              <h2 className="text-lg font-bold text-slate-900 mt-5">
                No Customer Reviews Yet
              </h2>

              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-6">
                After a Product is delivered, you can submit your Customer
                Review from the Product page.
              </p>

              <Link
                to="/account/orders"
                className="inline-flex items-center justify-center mt-6 px-5 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition"
              >
                View Order History
              </Link>
            </div>
          )}

          {/* Review Cards */}
          {!loading && !error && reviews.length > 0 && (
            <div className="space-y-5">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CustomerReviews;
