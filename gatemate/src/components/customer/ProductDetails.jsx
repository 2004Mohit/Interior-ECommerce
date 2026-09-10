import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Star,
  ShieldCheck,
  Zap,
  ShoppingBag,
  Heart,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Check,
  AlertCircle,
  Building2,
  HelpCircle,
  Package,
  Layers,
  Info,
} from "lucide-react";
import { productService } from "../../services/productService";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useAuth } from "../../context/AuthContext";
import { AuthModal } from "../AuthModal";
import { DeliveryChecker } from "./DeliveryChecker";
import { ProductReviewsSection } from "./ProductReviewsSection";
import { ProductImage } from "./ProductImage";
import { SeoHead } from "../common/SeoHead";
import { seoService } from "../../services/seoService";

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
            "The requested construction product could not be located in our catalogue.",
          );
        } else {
          setProduct(data);
          const initialQty = data.moq && data.moq > 1 ? data.moq : 1;
          setQuantity(initialQty);

          if (data.variants && data.variants.length > 0) {
            const initialVars = {};
            data.variants.forEach((v) => {
              initialVars[v.name] = v.options[0];
            });
            setSelectedVariants(initialVars);
          }
        }
      })
      .catch(() => {
        if (isMounted)
          setError(
            "An unexpected error occurred while loading construction product details.",
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

  const minOrderQty = product?.moq || 1;

  const handleDecreaseQuantity = () => {
    setQuantity((prev) => Math.max(minOrderQty, prev - 1));
  };

  const handleIncreaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

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
      setActionSuccessMsg(
        `Added ${quantity} ${product.unit || "unit"}(s) to your shopping bag.`,
      );
      setTimeout(() => setActionSuccessMsg(null), 3500);
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
          <div className="aspect-[4/3] bg-white/10 rounded-3xl"></div>
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
        <SeoHead
          title="Product Not Found | GateMate"
          description="The requested construction product was not found in our catalogue."
          noIndex={true}
        />
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white">
          Product Not Available
        </h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          {error || "The product was not found in our catalogue."}
        </p>
        <Link
          to="/products"
          className="gold-gradient-btn inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4 text-slate-950" />
          <span>Return to Construction Catalogue</span>
        </Link>
      </div>
    );
  }

  const currentMediaUrl = product.gallery?.[selectedImgIndex] || product.img;

  const breadcrumbSchema = seoService.generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Catalogue", url: "/products" },
    {
      name: product.category,
      url: `/products?category=${product.categorySlug}`,
    },
    { name: product.name, url: `/products/${product.slug}` },
  ]);
  const productSchema = seoService.generateProductSchema(product);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10 pb-28">
      {/* Dynamic SEO Meta & Structured Data */}
      <SeoHead
        title={`${product.name} | ${product.brand || "GateMate"}`}
        description={`${product.name} - Buy online in Pune & PCMC. ${product.description.slice(0, 140)}... 30-minute express site delivery available.`}
        canonicalUrl={`/products/${product.slug}`}
        ogImage={currentMediaUrl}
        ogType="product"
        structuredData={[breadcrumbSchema, productSchema]}
      />

      {/* 1. Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 overflow-x-auto whitespace-nowrap">
        <Link to="/" className="hover:text-amber-400 transition">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/products" className="hover:text-amber-400 transition">
          Catalogue
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

      {/* 2. Construction Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Gallery Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative rounded-3xl overflow-hidden premium-card border border-white/10 shadow-2xl bg-[#060e1a]">
            <ProductImage
              src={currentMediaUrl}
              alt={product.name}
              aspectRatio="aspect-square sm:aspect-[4/3]"
              priority={true}
              width={1000}
            />
            {product.isExpress30MinAvailable && (
              <span className="absolute top-4 left-4 bg-amber-400 text-slate-950 px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg">
                <Zap className="w-3.5 h-3.5 fill-current" />
                30-MIN PRIORITY SITE DISPATCH
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
              aria-label={activeWish ? "Remove from Saved" : "Save to Wishlist"}
            >
              <Heart
                className={`w-5 h-5 ${activeWish ? "fill-current" : ""}`}
              />
            </button>
          </div>

          {/* Interactive Thumbnails */}
          {product.gallery && product.gallery.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {product.gallery.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImgIndex(idx)}
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition ${
                    selectedImgIndex === idx
                      ? "border-amber-400 shadow-md shadow-amber-500/20 scale-95"
                      : "border-white/10 opacity-60 hover:opacity-100"
                  }`}
                  aria-label={`View image ${idx + 1}`}
                >
                  <ProductImage
                    src={imgUrl}
                    alt=""
                    aspectRatio="aspect-square"
                    width={160}
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

            {/* Customer Rating & Stock Info */}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <div className="flex items-center gap-1 text-amber-400 text-sm font-bold">
                <Star className="w-4 h-4 fill-current text-amber-400" />
                <span>{product.rating}</span>
              </div>
              <span className="text-xs text-slate-400">
                ({product.reviews} verified customer reviews)
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5 stroke-[3]" /> In Stock (
                {product.stock} {product.unit || "units"} available)
              </span>
            </div>
          </div>

          {/* Pricing & Unit Box */}
          <div className="premium-panel p-5 rounded-2xl flex flex-wrap items-baseline justify-between gap-3 border border-amber-400/20 bg-[#0a1526]">
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                ₹{product.price}
              </span>
              <span className="text-xs font-bold text-slate-400">
                / {product.unit || "Unit"}
              </span>
              {product.originalPrice && (
                <span className="text-base text-slate-500 line-through font-mono ml-2">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>

            {product.originalPrice && (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-lg border border-emerald-400/20">
                Save ₹{product.originalPrice - product.price} per{" "}
                {product.unit || "unit"} (GST Included)
              </span>
            )}
          </div>

          {/* Minimum Order Quantity (MOQ) Notice */}
          {product.moq && product.moq > 1 && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-center gap-2.5">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong className="font-bold text-amber-200">
                  Minimum Order Quantity (MOQ):{" "}
                </strong>
                {product.moq} {product.unit}s required for wholesale depot
                dispatch.
              </span>
            </div>
          )}

          {/* Variant Selector (if applicable) */}
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
                              ? "bg-[#172a4d] text-amber-300 border-amber-400 shadow-sm font-bold"
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

          {/* Construction Delivery Geofence & Serviceability Checker */}
          <DeliveryChecker
            initialPincode="411006"
            productWeightKg={product.category === "Cement" ? 50 : 25}
            deliveryClass={
              product.category === "Steel & TMT"
                ? "HEAVY_HARDWARE"
                : "STANDARD_PARCEL"
            }
            compact={true}
          />

          {/* Quantity Selector & Action Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-[#050b14] border border-white/10 rounded-xl p-1 shrink-0">
                <button
                  type="button"
                  onClick={handleDecreaseQuantity}
                  disabled={quantity <= minOrderQty}
                  className="px-3 py-1.5 text-slate-400 hover:text-white disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="px-3 text-xs font-bold text-white font-mono">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncreaseQuantity}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => executeProtectedAction("cart")}
                className="flex-1 premium-card hover:bg-white/10 border border-amber-400/40 text-amber-300 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition active:scale-98"
              >
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>Add to Bag</span>
              </button>

              <button
                type="button"
                onClick={() => executeProtectedAction("buy_now")}
                className="flex-1 gold-gradient-btn py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition active:scale-98"
              >
                <span>Buy Instant</span>
              </button>
            </div>

            {actionSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{actionSuccessMsg}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Category-Specific Specifications & Customer Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        {/* Left Side: Product Description, Category Technical Specs & Customer Reviews */}
        <div className="lg:col-span-2 space-y-8">
          {/* Product Overview & Features */}
          <div className="premium-panel p-6 sm:p-8 rounded-3xl space-y-4">
            <h2 className="text-lg font-black text-white border-b border-white/10 pb-3">
              Product Overview
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {product.description}
            </p>

            {product.features && product.features.length > 0 && (
              <div className="pt-2 space-y-2">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Key Product Features
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                  {product.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Dynamic Construction Attributes (Varies per category) */}
            {product.dynamicAttributes &&
              product.dynamicAttributes.length > 0 && (
                <div className="pt-4 space-y-3">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Technical Specifications ({product.category})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {product.dynamicAttributes.map((attr, idx) => (
                      <div
                        key={idx}
                        className="premium-card p-3 rounded-xl flex justify-between text-xs border border-white/5"
                      >
                        <span className="text-slate-400">{attr.key}</span>
                        <span className="text-white font-semibold font-mono">
                          {attr.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* Genuine Customer Reviews Section */}
          <ProductReviewsSection product={product} />
        </div>

        {/* Right Side: Verified Stockist/Depot Info & Commercial RFQ Notice */}
        <div className="space-y-6">
          {/* Stockist / Distributor Info (No fake vendor-performance ratings) */}
          {product.seller && (
            <div className="premium-panel p-6 rounded-3xl space-y-3 border border-white/10">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                Fulfillment Depot
              </span>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
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
              <div className="p-3 rounded-xl bg-[#091526] border border-white/5 text-[11px] text-slate-300 leading-relaxed">
                Direct stockist fulfillment with batch test certificate
                compliance for Pune & PCMC construction sites.
              </div>
            </div>
          )}

          {/* Commercial B2B Quotation Prompt */}
          <div className="premium-panel p-6 rounded-3xl space-y-3 border border-amber-400/20 bg-gradient-to-b from-[#091526] to-[#0c182b]">
            <div className="flex items-center gap-2 text-amber-400">
              <Building2 className="w-4 h-4" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                B2B Wholesale Procurement
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ordering full truckloads or require formal GST project estimates
              for this item?
            </p>
            <Link
              to="/account/b2b"
              className="w-full gold-gradient-btn py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
            >
              <span>Submit Project RFQ</span>
            </Link>
          </div>

          {/* Delivery & Handling Policies */}
          <div className="premium-panel p-6 rounded-3xl space-y-3 border border-white/10">
            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white">
                Quality & Site Unloading Policy
              </h3>
            </div>
            <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
              <p>
                • Unloading and ground-level placement included at the vehicle
                access point.
              </p>
              <p>• Upper-floor crane or manual shifting is excluded.</p>
              <p>
                • Mill test certificates available on request for TMT and cement
                batches.
              </p>
            </div>
          </div>
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
