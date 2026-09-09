import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Star,
  ShieldCheck,
  Zap,
  RotateCcw,
  ShoppingBag,
  Heart,
  ArrowLeft,
  CheckCircle2,
  Truck,
  HelpCircle,
  ChevronRight,
  Check,
  AlertCircle,
  Building2,
} from "lucide-react";
import { productService } from "../../services/productService";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useAuth } from "../../context/AuthContext";
import { AuthModal } from "../AuthModal";
import { DeliveryChecker } from "./DeliveryChecker";
import { ProductReviewsSection } from "./ProductReviewsSection";

export const ProductDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState({});

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    productService
      .getProductBySlug(slug)
      .then((data) => {
        if (!isMounted) return;
        if (!data) {
          setError(
            "The requested product could not be located in our catalog.",
          );
        } else {
          setProduct(data);
          if (data.variants) {
            const initial = {};
            data.variants.forEach((v) => {
              initial[v.name] = v.options[0];
            });
            setSelectedVariants(initial);
          }
        }
      })
      .catch(() => {
        if (isMounted)
          setError(
            "An unexpected error occurred while fetching product details.",
          );
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const activeWish = product ? isInWishlist(product.id) : false;

  const executeProtectedAction = (actionType) => {
    if (!user) {
      setPendingAction(actionType);
      setAuthModalOpen(true);
      return;
    }

    if (actionType === "cart") {
      for (let i = 0; i < quantity; i++) {
        addToCart(product);
      }
      setActionSuccessMsg(`Added ${quantity} item(s) to your shopping bag!`);
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } else if (actionType === "buy_now") {
      addToCart(product);
      navigate("/checkout");
    } else if (actionType === "wishlist") {
      toggleWishlist(product);
    }
  };

  const handleAuthSuccess = () => {
    if (pendingAction) {
      const action = pendingAction;
      setPendingAction(null);
      setTimeout(() => executeProtectedAction(action), 100);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-48 mb-4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="h-[460px] bg-white/10 rounded-3xl"></div>
          <div className="space-y-4">
            <div className="h-6 bg-white/10 rounded w-1/3"></div>
            <div className="h-10 bg-white/20 rounded w-3/4"></div>
            <div className="h-6 bg-white/10 rounded w-1/4"></div>
            <div className="h-28 bg-white/10 rounded"></div>
            <div className="h-12 bg-white/20 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white">Item Not Available</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          {error || "Product was not found."}
        </p>
        <Link
          to="/products"
          className="gold-gradient-btn inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Catalog</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10 pb-28">
      {/* 1. Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 overflow-x-auto whitespace-nowrap">
        <Link to="/" className="hover:text-amber-400 transition">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/products" className="hover:text-amber-400 transition">
          Products
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link
          to={`/products?category=${product.categorySlug}`}
          className="hover:text-amber-400 transition"
        >
          {product.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-200 font-bold truncate max-w-xs">
          {product.name}
        </span>
      </nav>

      {/* 2. Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Gallery Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-square sm:aspect-4/3 rounded-3xl overflow-hidden premium-card bg-[#060e1a] border border-white/10 shadow-2xl">
            <img
              src={product.gallery[selectedImgIndex] || product.img}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover transition-all duration-300"
            />
            {product.isExpress30MinAvailable && (
              <span className="absolute top-4 left-4 bg-amber-400 text-slate-950 px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1 shadow-lg">
                <Zap className="w-3.5 h-3.5 fill-current" />⚡ 30-MIN EXPRESS
                (PUNE / PCMC)
              </span>
            )}
            <button
              onClick={() => executeProtectedAction("wishlist")}
              className={`absolute top-4 right-4 p-3 rounded-2xl bg-[#050b14]/80 backdrop-blur-md border border-white/10 transition ${
                activeWish
                  ? "text-rose-500 fill-rose-500"
                  : "text-slate-300 hover:text-rose-400"
              }`}
              title={activeWish ? "Remove from Saved" : "Save to Wishlist"}
            >
              <Heart
                className={`w-5 h-5 ${activeWish ? "fill-current" : ""}`}
              />
            </button>
          </div>

          {product.gallery.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {product.gallery.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImgIndex(idx)}
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition ${
                    selectedImgIndex === idx
                      ? "border-amber-400 shadow-md shadow-amber-500/20"
                      : "border-white/10 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details & Actions Column */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-400 uppercase tracking-widest">
                {product.brand}
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                SKU: {product.sku}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1 text-amber-400 text-sm">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-bold">{product.rating}</span>
              </div>
              <span className="text-xs text-slate-400">
                ({product.reviews} customer reviews)
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> In Stock ({product.stock}{" "}
                units)
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="premium-panel p-4 rounded-2xl flex items-baseline gap-3 border border-amber-400/20 bg-[#0a1526]">
            <span className="text-3xl sm:text-4xl font-black text-white font-mono">
              ₹{product.price}
            </span>
            {product.originalPrice && (
              <span className="text-base text-slate-500 line-through font-mono">
                ₹{product.originalPrice}
              </span>
            )}
            <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-lg">
              Save ₹
              {product.originalPrice
                ? product.originalPrice - product.price
                : 0}{" "}
              (GST Included)
            </span>
          </div>

          {/* Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-4 pt-1">
              {product.variants.map((v) => (
                <div key={v.id} className="space-y-2">
                  <span className="text-xs font-bold text-slate-300">
                    Select {v.name}:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {v.options.map((opt) => {
                      const isSelected = selectedVariants[v.name] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setSelectedVariants({
                              ...selectedVariants,
                              [v.name]: opt,
                            })
                          }
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition border ${
                            isSelected
                              ? "bg-[#172a4d] text-amber-300 border-amber-400 shadow-sm"
                              : "premium-card text-slate-300 hover:border-slate-500"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Delivery Checker (Pune / PCMC Zones) */}
          <DeliveryChecker
            initialPincode="411006"
            productWeightKg={2.5}
            deliveryClass="FRAGILE_POTTERY"
            compact={true}
          />

          {/* Quantity & CTA Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-[#050b14] border border-white/10 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  -
                </button>
                <span className="px-3 text-xs font-bold text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => executeProtectedAction("cart")}
                className="flex-1 premium-card hover:bg-white/10 border border-amber-400/40 text-amber-300 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition active:scale-98"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Shopping Bag</span>
              </button>

              <button
                type="button"
                onClick={() => executeProtectedAction("buy_now")}
                className="flex-1 gold-gradient-btn py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition active:scale-98"
              >
                <span>Buy Now (Instant)</span>
              </button>
            </div>

            {actionSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{actionSuccessMsg}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Product Specifications & Customer Review Module */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        {/* Left Side: Overview & Full Reviews System */}
        <div className="lg:col-span-2 space-y-8">
          <div className="premium-panel p-6 sm:p-8 rounded-3xl space-y-4">
            <h2 className="text-lg font-black text-white border-b border-white/10 pb-3">
              Product Overview
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {product.description}
            </p>

            {product.dynamicAttributes && (
              <div className="pt-4 space-y-3">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Specifications
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.dynamicAttributes.map((attr, idx) => (
                    <div
                      key={idx}
                      className="premium-card p-3 rounded-xl flex justify-between text-xs"
                    >
                      <span className="text-slate-400">{attr.key}</span>
                      <span className="text-white font-semibold">
                        {attr.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Integrated Review & Rating Architecture */}
          <ProductReviewsSection product={product} />
        </div>

        {/* Right Side: Merchant Details & FAQs */}
        <div className="space-y-6">
          {product.seller && (
            <div className="premium-panel p-6 rounded-3xl space-y-3 border border-white/10">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                Merchant Details
              </span>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {product.seller.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {product.seller.location}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 premium-card rounded-xl">
                  <div className="font-bold text-amber-400">
                    {product.seller.rating} ★
                  </div>
                  <div className="text-[10px] text-slate-400">Seller Score</div>
                </div>
                <div className="p-2 premium-card rounded-xl">
                  <div className="font-bold text-emerald-400">
                    {product.seller.totalSales}
                  </div>
                  <div className="text-[10px] text-slate-400">Fulfillments</div>
                </div>
              </div>
            </div>
          )}

          {product.faqs && product.faqs.length > 0 && (
            <div className="premium-panel p-6 rounded-3xl space-y-3">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white">
                  Frequently Asked Questions
                </h3>
              </div>
              <div className="space-y-3">
                {product.faqs.map((faq, idx) => (
                  <div key={idx} className="text-xs space-y-1">
                    <p className="font-bold text-slate-200">Q: {faq.q}</p>
                    <p className="text-slate-400 leading-relaxed">A: {faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};
