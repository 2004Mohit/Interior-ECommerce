import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AccountNav } from "./AccountNav";
import { useAuth } from "../../context/AuthContext";
import { DEMO_PRODUCTS } from "../../data/demoProducts";
import { AuthModal } from "../AuthModal";
import {
  MessageSquare,
  Star,
  ShieldCheck,
  ExternalLink,
  Lock,
} from "lucide-react";

export const CustomerReviews = () => {
  const { user, loading: authLoading } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      setLoading(true);
      const userReviews = [];
      DEMO_PRODUCTS.forEach((product) => {
        const storedKey = `gatemate_product_reviews_${product.id}`;
        const productReviews = JSON.parse(
          localStorage.getItem(storedKey) || "[]",
        );
        const mine = productReviews.filter((r) => r.userId === user.id);
        mine.forEach((r) => userReviews.push({ ...r, product }));
      });

      setReviews(userReviews);
      setLoading(false);
    }
  }, [user, authLoading]);

  if (!authLoading && !user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <h1 className="text-2xl font-black text-dark">My Customer Reviews</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <AccountNav />
          </div>
          <div className="md:col-span-3">
            <div className="premium-panel p-12 rounded-3xl text-center space-y-4 max-w-md mx-auto">
              <Lock className="w-10 h-10 text-dark-400 mx-auto" />
              <h2 className="text-lg font-bold text-dark">
                Sign In to View Customer Reviews
              </h2>
              <p className="text-xs text-slate-400">
                Log in to inspect your verified Product reviews and Customer
                Ratings.
              </p>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="dark-gradient-btn px-6 py-3 rounded-xl text-xs font-bold shadow-lg"
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24">
      <div className="border-b border-white/10 pb-5">
        <h1 className="text-2xl font-black text-dark">My Customer Reviews</h1>
        <p className="text-xs text-slate-400">
          Customer Reviews submitted for your verified construction Product
          purchases in Pune and Pimpri-Chinchwad.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        <div className="md:col-span-1">
          <AccountNav />
        </div>

        <div className="md:col-span-3 space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="premium-panel p-6 rounded-3xl h-36 animate-pulse bg-white/5"
                />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="premium-panel p-16 rounded-3xl text-center space-y-4 max-w-md mx-auto">
              <MessageSquare className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-dark">
                No Customer Reviews Submitted Yet
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                You can write Customer Reviews for any construction Products
                delivered to your sites in Pune or PCMC.
              </p>
              <Link
                to="/account/orders"
                className="dark-gradient-btn inline-block px-5 py-2.5 rounded-xl text-xs font-bold"
              >
                View Order History
              </Link>
            </div>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="premium-panel p-5 rounded-3xl space-y-3 border border-white/10"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-dark">
                      {rev.product?.name}
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.2 rounded-full flex items-center gap-1 font-semibold">
                      <ShieldCheck className="w-3 h-3" /> Verified Purchase
                    </span>
                  </div>

                  <Link
                    to={`/products/${rev.product?.slug}`}
                    className="text-dark-400 hover:text-dark p-1"
                    title="View Product Details"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="flex text-dark-400">
                  {Array(rev.rating)
                    .fill(0)
                    .map((_, i) => (
                      <Star
                        key={i}
                        className="w-3.5 h-3.5 fill-current text-dark-400"
                      />
                    ))}
                </div>

                {rev.headline && (
                  <h4 className="text-xs font-bold text-dark">
                    {rev.headline}
                  </h4>
                )}
                <p className="text-xs text-slate-300 leading-relaxed">
                  {rev.comment}
                </p>

                <div className="text-[10px] text-slate-500 pt-1 border-t border-white/5">
                  Published on{" "}
                  {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
