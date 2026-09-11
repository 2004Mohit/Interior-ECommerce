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
        <div className="h-4 bg-[#D9E2EA] rounded w-48 mb-4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="aspect-[4/3] bg-[#E4EEF3] rounded-3xl"></div>
          <div className="space-y-4">
            <div className="h-6 bg-[#D9E2EA] rounded w-1/3"></div>
            <div className="h-10 bg-[#E4EEF3] rounded w-3/4"></div>
            <div className="h-6 bg-[#D9E2EA] rounded w-1/4"></div>
            <div className="h-28 bg-[#E4EEF3] rounded"></div>
            <div className="h-12 bg-[#D9E2EA] rounded"></div>
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
        <div className="w-16 h-16 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/20 text-[#B43D20] flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-[#173885]">
          Product Not Available
        </h2>
        <p className="text-[#606460] text-sm max-w-md mx-auto">
          {error || "The product was not found in our catalogue."}
        </p>
        <Link
          to="/products"
          className="btn-gm-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4 text-[#FEFEFE]" />
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
      <nav className="flex items-center gap-2 text-xs text-[#6F8A92] overflow-x-auto whitespace-nowrap">
        <Link to="/" className="hover:text-[#3C7DDA] transition">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/products" className="hover:text-[#3C7DDA] transition">
          Catalogue
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link
          to={`/products?category=${product.categorySlug}`}
          className="hover:text-[#3C7DDA] transition"
        >
          {product.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#282926] font-bold truncate max-w-xs">
          {product.name}
        </span>
      </nav>

      {/* 2. Construction Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Gallery Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative rounded-3xl overflow-hidden gm-card shadow-md bg-[#FEFEFE]">
            <ProductImage
              src={currentMediaUrl}
              alt={product.name}
              aspectRatio="aspect-square sm:aspect-[4/3]"
              priority={true}
              width={1000}
            />
            {product.isExpress30MinAvailable && (
              <span className="absolute top-4 left-4 bg-[#3C7DDA] text-[#FEFEFE] px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md">
                <Zap className="w-3.5 h-3.5 fill-current" />
                30-MIN PRIORITY SITE DISPATCH
              </span>
            )}
            <button
              onClick={() => executeProtectedAction("wishlist")}
              className={`absolute top-4 right-4 p-3 rounded-2xl bg-[#FEFEFE]/90 backdrop-blur-md border border-[#D9E2EA] shadow-xs transition ${
                activeWish
                  ? "text-[#B43D20] fill-[#B43D20]"
                  : "text-[#606460] hover:text-[#B43D20]"
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
                      ? "border-[#3C7DDA] shadow-xs scale-95"
                      : "border-[#D9E2EA] opacity-60 hover:opacity-100"
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
              <span className="font-bold text-[#3C7DDA] uppercase tracking-widest">
                {product.brand}
              </span>
              <span className="text-[#6F8A92] font-mono text-[11px]">
                SKU: {product.sku}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1 leading-tight">
              {product.name}
            </h1>

            {/* Customer Rating & Stock Info */}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <div className="flex items-center gap-1 text-[#173885] text-sm font-bold">
                <Star className="w-4 h-4 fill-[#3C7DDA] text-[#3C7DDA]" />
                <span className="text-[#282926]">{product.rating}</span>
              </div>
              <span className="text-xs text-[#606460]">
                ({product.reviews} verified customer reviews)
              </span>
              <span className="text-[#D9E2EA]">•</span>
              <span className="text-xs text-[#3F7D20] font-semibold flex items-center gap-1 bg-[#E1F2D9] px-2.5 py-0.5 rounded-full">
                <Check className="w-3.5 h-3.5 stroke-[3]" /> In Stock (
                {product.stock} {product.unit || "units"} available)
              </span>
            </div>
          </div>

          {/* Pricing & Unit Box */}
          <div className="gm-panel p-5 rounded-2xl flex flex-wrap items-baseline justify-between gap-3 border border-[#D9E2EA] bg-[#FEFEFE]">
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl sm:text-4xl font-black text-[#173885] font-mono">
                ₹{product.price}
              </span>
              <span className="text-xs font-bold text-[#606460]">
                / {product.unit || "Unit"}
              </span>
              {product.originalPrice && (
                <span className="text-base text-[#6F8A92] line-through font-mono ml-2">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>

            {product.originalPrice && (
              <span className="text-xs font-bold text-[#3F7D20] bg-[#E1F2D9] px-2.5 py-1 rounded-lg">
                Save ₹{product.originalPrice - product.price} per{" "}
                {product.unit || "unit"} (GST Included)
              </span>
            )}
          </div>

          {/* Minimum Order Quantity (MOQ) Notice */}
          {product.moq && product.moq > 1 && (
            <div className="p-3.5 rounded-2xl bg-[#FFF0D5] border border-[#A66A08]/20 text-[#A66A08] text-xs flex items-center gap-2.5">
              <span className="font-bold">
                Minimum Order Quantity (MOQ): {product.moq} {product.unit}s
                required for wholesale depot dispatch.
              </span>
            </div>
          )}

          {/* Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-4 pt-1">
              {product.variants.map((v) => (
                <div key={v.id} className="space-y-2">
                  <span className="text-xs font-bold text-[#282926]">
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
                              ? "bg-[#173885] text-[#FEFEFE] border-[#173885] shadow-xs font-bold"
                              : "bg-[#FEFEFE] text-[#282926] border-[#D9E2EA] hover:border-[#3C7DDA]"
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

          {/* Construction Delivery Geofence Checker */}
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
              <div className="flex items-center bg-[#FEFEFE] border border-[#D9E2EA] rounded-xl p-1 shrink-0">
                <button
                  type="button"
                  onClick={handleDecreaseQuantity}
                  disabled={quantity <= minOrderQty}
                  className="px-3 py-1.5 text-[#606460] hover:text-[#282926] disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="px-3 text-xs font-bold text-[#282926] font-mono">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncreaseQuantity}
                  className="px-3 py-1.5 text-[#606460] hover:text-[#282926]"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => executeProtectedAction("cart")}
                className="flex-1 btn-gm-secondary py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-98"
              >
                <ShoppingBag className="w-4 h-4 text-[#173885]" />
                <span>Add to Bag</span>
              </button>

              <button
                type="button"
                onClick={() => executeProtectedAction("buy_now")}
                className="flex-1 btn-gm-primary py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-98"
              >
                <span>Buy Instant</span>
              </button>
            </div>

            {actionSuccessMsg && (
              <div className="p-3 rounded-xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#3F7D20] shrink-0" />
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
          <div className="gm-panel p-6 sm:p-8 rounded-3xl space-y-4">
            <h2 className="text-lg font-black text-[#173885] border-b border-[#D9E2EA] pb-3">
              Product Overview
            </h2>
            <p className="text-sm text-[#282926] leading-relaxed">
              {product.description}
            </p>

            {product.features && product.features.length > 0 && (
              <div className="pt-2 space-y-2">
                <h3 className="text-xs font-bold text-[#3C7DDA] uppercase tracking-wider">
                  Key Product Features
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#282926]">
                  {product.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#3F7D20] shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.dynamicAttributes &&
              product.dynamicAttributes.length > 0 && (
                <div className="pt-4 space-y-3">
                  <h3 className="text-xs font-bold text-[#3C7DDA] uppercase tracking-wider">
                    Technical Specifications ({product.category})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {product.dynamicAttributes.map((attr, idx) => (
                      <div
                        key={idx}
                        className="bg-[#F4F6FA] p-3 rounded-xl flex justify-between text-xs border border-[#D9E2EA]"
                      >
                        <span className="text-[#606460]">{attr.key}</span>
                        <span className="text-[#282926] font-semibold font-mono">
                          {attr.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* Customer Reviews */}
          <ProductReviewsSection product={product} />
        </div>

        {/* Right Side: Stockist/Depot Info */}
        <div className="space-y-6">
          {product.seller && (
            <div className="gm-panel p-6 rounded-3xl space-y-3">
              <span className="text-[10px] font-bold text-[#3C7DDA] uppercase tracking-widest">
                Fulfillment Depot
              </span>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#E4EEF3] border border-[#9AAED4]/40 flex items-center justify-center text-[#173885] shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#282926]">
                    {product.seller.name}
                  </h3>
                  <p className="text-xs text-[#606460]">
                    {product.seller.location}
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#F4F6FA] border border-[#D9E2EA] text-[11px] text-[#606460] leading-relaxed">
                Direct stockist fulfillment with batch test certificate
                compliance for Pune & PCMC construction sites.
              </div>
            </div>
          )}

          {/* Commercial B2B Quotation Prompt */}
          <div className="gm-panel p-6 rounded-3xl space-y-3 border border-[#3C7DDA]/30 bg-[#E4EEF3]/40">
            <div className="flex items-center gap-2 text-[#173885]">
              <Building2 className="w-4 h-4 text-[#3C7DDA]" />
              <h3 className="text-xs font-bold text-[#173885] uppercase tracking-wider">
                B2B Wholesale Procurement
              </h3>
            </div>
            <p className="text-xs text-[#606460] leading-relaxed">
              Ordering full truckloads or require formal GST project estimates
              for this Product?
            </p>
            <Link
              to="/account/b2b"
              className="w-full btn-gm-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Submit Project RFQ</span>
            </Link>
          </div>

          {/* Delivery & Handling Policies */}
          <div className="gm-panel p-6 rounded-3xl space-y-3">
            <div className="flex items-center gap-2 border-b border-[#D9E2EA] pb-2">
              <ShieldCheck className="w-4 h-4 text-[#3F7D20]" />
              <h3 className="text-xs font-bold text-[#282926]">
                Quality & Site Unloading Policy
              </h3>
            </div>
            <div className="space-y-2 text-xs text-[#606460] leading-relaxed">
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
