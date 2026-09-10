import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  ShoppingBag,
  Trash2,
  ArrowRight,
  CheckCircle2,
  Lock,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { AuthModal } from "../AuthModal";
import { ProductCardSkeleton } from "../ProductCardSkeleton";

export const Wishlist = () => {
  const { user, loading: authLoading } = useAuth();
  const { wishlist, removeFromWishlist, loading, error, fetchWishlist } =
    useWishlist();
  const { addToCart } = useCart();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [successNotice, setSuccessNotice] = useState(null);

  const handleMoveToCart = (product) => {
    addToCart(product);
    removeFromWishlist(product.id);
    setSuccessNotice(`"${product.name}" moved to your Shopping Bag.`);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  // Guest Interception View
  if (!authLoading && !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-6">
        <div className="premium-panel p-10 sm:p-14 rounded-3xl border border-white/10 space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
<<<<<<< HEAD
          <h2 className="text-2xl font-black text-dark">
=======
          <h2 className="text-2xl font-black text-white">
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
            Saved Products Wishlist
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Please sign in to access your saved construction Products, TMT
            rebars, and building hardware.
          </p>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="dark-gradient-btn px-6 py-3 rounded-xl text-xs font-bold shadow-lg"
          >
            Sign In to View Saved Products
          </button>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => {
            setAuthModalOpen(false);
            fetchWishlist();
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24">
      {/* Page Title & Count Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <div>
<<<<<<< HEAD
            <h1 className="text-2xl font-black text-dark">My Saved Products</h1>
=======
            <h1 className="text-2xl font-black text-white">
              My Saved Products
            </h1>
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
            <p className="text-xs text-slate-400">
              {wishlist.length} construction Product
              {wishlist.length === 1 ? "" : "s"} saved in your private project
              collection
            </p>
          </div>
        </div>

        {wishlist.length > 0 && (
          <Link
            to="/products"
            className="text-xs font-bold text-dark-400 hover:underline self-start sm:self-auto"
          >
            + Add More Products
          </Link>
        )}
      </div>

      {/* Success Notification Alert */}
      {successNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
        </div>
      ) : error ? (
        <div className="premium-panel p-12 rounded-3xl text-center space-y-3 max-w-md mx-auto">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
<<<<<<< HEAD
          <h3 className="text-sm font-bold text-dark">
=======
          <h3 className="text-sm font-bold text-white">
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
            Error Loading Saved Products
          </h3>
          <p className="text-xs text-slate-400">{error}</p>
          <button
            onClick={fetchWishlist}
            className="dark-gradient-btn px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      ) : wishlist.length === 0 ? (
        <div className="premium-panel p-16 rounded-3xl text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-600 flex items-center justify-center mx-auto border border-white/5">
            <Heart className="w-8 h-8" />
          </div>
<<<<<<< HEAD
          <h3 className="text-lg font-bold text-dark">
=======
          <h3 className="text-lg font-bold text-white">
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
            Your Saved Products List is Empty
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Explore certified Cement, Steel TMT, AAC Blocks, and Plumbing
            Products to save items for your construction projects.
          </p>
          <Link
            to="/products"
            className="dark-gradient-btn inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold shadow-lg"
          >
            <span>Explore Construction Catalogue</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlist.map((product) => (
            <div
              key={product.id}
              className="premium-card premium-card-hover rounded-2xl overflow-hidden flex flex-col justify-between group border border-white/10 relative"
            >
              <div>
                <div className="relative h-56 w-full overflow-hidden bg-[#060e1a]">
                  <Link to={`/products/${product.slug}`}>
                    <img
                      src={product.img}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  {product.tag && (
                    <span className="absolute top-3 left-3 bg-[#050b14]/90 px-2.5 py-0.5 rounded-md text-[10px] font-bold text-dark-300 border border-dark-400/30">
                      {product.tag}
                    </span>
                  )}

                  <button
                    onClick={() => removeFromWishlist(product.id)}
<<<<<<< HEAD
                    className="absolute top-3 right-3 p-2 rounded-xl bg-[#050b14]/80 text-rose-400 hover:text-dark hover:bg-rose-500/30 transition border border-white/10"
=======
                    className="absolute top-3 right-3 p-2 rounded-xl bg-[#050b14]/80 text-rose-400 hover:text-white hover:bg-rose-500/30 transition border border-white/10"
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
                    title="Remove from saved list"
                    aria-label="Remove from saved list"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-4 space-y-1">
                  <span className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">
                    {product.category}
                  </span>
                  <Link to={`/products/${product.slug}`}>
                    <h3 className="text-dark font-bold text-sm line-clamp-1 group-hover:text-dark-300 transition-colors">
                      {product.name}
                    </h3>
                  </Link>

                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-base font-black text-dark font-mono">
                      ₹{product.price}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      / {product.unit || "Unit"}
                    </span>
                    {product.originalPrice && (
                      <span className="text-xs text-slate-500 line-through font-mono">
                        ₹{product.originalPrice}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0">
                <button
                  onClick={() => handleMoveToCart(product)}
<<<<<<< HEAD
                  className="w-full dark-gradient-btn py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md text-slate-950"
=======
                  className="w-full gold-gradient-btn py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md text-slate-950"
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Move to Bag</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
