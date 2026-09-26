import React, { useEffect, useMemo, useState } from "react";
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
  Package,
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
import FeatureComingSoonModal from "../common/FeatureComingSoonModal";

export const ProductDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  /*
   * --------------------------------------------------------------------------
   * STATE
   * --------------------------------------------------------------------------
   */

  const [product, setProduct] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);

  const [comingSoonModalOpen, setComingSoonModalOpen] = useState(false);

  /*
   * --------------------------------------------------------------------------
   * LOAD PRODUCT
   * --------------------------------------------------------------------------
   *
   * Product is loaded from:
   *
   * ProductDetails
   *      ↓
   * productService
   *      ↓
   * catalogRepository
   *      ↓
   * Supabase
   *      ↓
   * vendor_products
   * vendor_profiles
   * vendor_inventory
   * customer_product_reviews
   *
   * No demo product data is used here.
   */

  useEffect(() => {
    let isMounted = true;

    const loadProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!slug) {
          throw new Error("Product slug is missing.");
        }

        const data = await productService.getProductBySlug(slug);

        if (!isMounted) {
          return;
        }

        if (!data) {
          setProduct(null);
          setError(
            "The requested construction product could not be located in our catalogue.",
          );
          return;
        }

        /*
         * Only published products should normally be returned by the
         * catalogue repository.
         */
        if (data.isPublished === false) {
          setProduct(null);
          setError(
            "This construction product is currently unavailable in the catalogue.",
          );
          return;
        }

        setProduct(data);

        /*
         * Respect the product's minimum order quantity.
         */
        const initialQuantity = Number(data.moq) > 1 ? Number(data.moq) : 1;

        setQuantity(initialQuantity);

        /*
         * Always start the gallery from the first image.
         */
        setSelectedImgIndex(0);
      } catch (err) {
        console.error("ProductDetails: failed to load product:", err);

        if (isMounted) {
          setProduct(null);

          setError(
            err?.message ||
              "An unexpected error occurred while loading construction product details.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  /*
   * --------------------------------------------------------------------------
   * DERIVED PRODUCT VALUES
   * --------------------------------------------------------------------------
   */

  const activeWish = product ? isInWishlist(product.id) : false;

  const minOrderQty = Number(product?.moq) > 0 ? Number(product.moq) : 1;

  const availableStock = Number(product?.availableStock ?? product?.stock ?? 0);

  const isInStock = product?.isInStock === true || availableStock > 0;

  const gallery = useMemo(() => {
    if (!product) {
      return [];
    }

    /*
     * New productService exposes:
     *
     * imageUrls
     * images
     * gallery
     * coverImageUrl
     * img
     */

    const sourceImages = [
      ...(Array.isArray(product.gallery) ? product.gallery : []),
      ...(Array.isArray(product.imageUrls) ? product.imageUrls : []),
      ...(Array.isArray(product.images) ? product.images : []),
    ];

    if (product.coverImageUrl) {
      sourceImages.unshift(product.coverImageUrl);
    }

    if (product.img) {
      sourceImages.push(product.img);
    }

    /*
     * Remove duplicate image URLs.
     */
    return [...new Set(sourceImages.filter(Boolean))];
  }, [product]);

  const currentMediaUrl =
    gallery[selectedImgIndex] || product?.coverImageUrl || product?.img || "";

  /*
   * --------------------------------------------------------------------------
   * PRICE FORMATTING
   * --------------------------------------------------------------------------
   */

  const formattedPrice = useMemo(() => {
    if (!product || product.price === undefined || product.price === null) {
      return "0";
    }

    return Number(product.price).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
  }, [product]);

  const formattedOriginalPrice = useMemo(() => {
    if (
      !product ||
      product.originalPrice === undefined ||
      product.originalPrice === null
    ) {
      return null;
    }

    if (Number(product.originalPrice) <= Number(product.price)) {
      return null;
    }

    return Number(product.originalPrice).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
  }, [product]);

  const savings = useMemo(() => {
    if (!product?.originalPrice || !product?.price) {
      return 0;
    }

    const value = Number(product.originalPrice) - Number(product.price);

    return value > 0 ? value : 0;
  }, [product]);

  /*
   * --------------------------------------------------------------------------
   * DYNAMIC ATTRIBUTES
   * --------------------------------------------------------------------------
   *
   * vendor_products.dynamic_attributes is JSONB.
   *
   * Support both:
   *
   * [
   *   { key: "Grade", value: "M20" }
   * ]
   *
   * and:
   *
   * {
   *   Grade: "M20",
   *   Finish: "Smooth"
   * }
   */

  const dynamicAttributes = useMemo(() => {
    if (!product?.dynamicAttributes) {
      return [];
    }

    const attributes = product.dynamicAttributes;

    if (Array.isArray(attributes)) {
      return attributes
        .map((attribute) => {
          if (!attribute) {
            return null;
          }

          if (typeof attribute === "object" && attribute.key !== undefined) {
            return {
              key: attribute.key,
              value: attribute.value,
            };
          }

          if (typeof attribute === "object" && attribute.name !== undefined) {
            return {
              key: attribute.name,
              value:
                attribute.value ??
                attribute.values ??
                attribute.allowed_values ??
                "",
            };
          }

          return null;
        })
        .filter(Boolean);
    }

    if (typeof attributes === "object" && !Array.isArray(attributes)) {
      return Object.entries(attributes).map(([key, value]) => ({
        key,
        value: Array.isArray(value) ? value.join(", ") : String(value ?? ""),
      }));
    }

    return [];
  }, [product]);

  /*
   * --------------------------------------------------------------------------
   * QUANTITY CONTROLS
   * --------------------------------------------------------------------------
   */

  const handleDecreaseQuantity = () => {
    setQuantity((previous) => Math.max(minOrderQty, previous - 1));
  };

  const handleIncreaseQuantity = () => {
    setQuantity((previous) => {
      const nextQuantity = previous + 1;

      /*
       * Prevent the customer from adding more than the available inventory.
       */
      if (availableStock > 0 && nextQuantity > availableStock) {
        return availableStock;
      }

      return nextQuantity;
    });
  };

  /*
   * --------------------------------------------------------------------------
   * COMING SOON
   * --------------------------------------------------------------------------
   *
   * B2B/RFQ functionality is intentionally disabled for the current MVP.
   * The button remains visible so customers can discover the future feature,
   * but it does not navigate into the unfinished RFQ workflow.
   */

  const handleProjectRFQClick = () => {
    setComingSoonModalOpen(true);
  };

  /*
   * --------------------------------------------------------------------------
   * PROTECTED CUSTOMER ACTIONS
   * --------------------------------------------------------------------------
   */

  const executeProtectedAction = (actionType) => {
    if (!product) {
      return;
    }

    if (!user) {
      setPendingAction(actionType);
      setAuthModalOpen(true);
      return;
    }

    if (actionType === "cart") {
      if (!isInStock) {
        setActionSuccessMsg("This product is currently out of stock.");

        setTimeout(() => {
          setActionSuccessMsg(null);
        }, 3500);

        return;
      }

      /*
       * CartContext currently accepts a product object.
       *
       * Quantity is added one unit at a time to preserve compatibility
       * with the existing cart implementation.
       */
      for (let index = 0; index < quantity; index += 1) {
        addToCart(product);
      }

      setActionSuccessMsg(
        `Added ${quantity} ${product.unit || "unit"}(s) to your shopping bag.`,
      );

      setTimeout(() => {
        setActionSuccessMsg(null);
      }, 3500);

      return;
    }

    if (actionType === "buy_now") {
      if (!isInStock) {
        setActionSuccessMsg("This product is currently out of stock.");

        setTimeout(() => {
          setActionSuccessMsg(null);
        }, 3500);

        return;
      }

      /*
       * Preserve compatibility with the existing CartContext.
       */
      for (let index = 0; index < quantity; index += 1) {
        addToCart(product);
      }

      navigate("/checkout");

      return;
    }

    if (actionType === "wishlist") {
      toggleWishlist(product);
    }
  };

  /*
   * --------------------------------------------------------------------------
   * AUTH SUCCESS
   * --------------------------------------------------------------------------
   */

  const handleAuthSuccess = () => {
    if (!pendingAction) {
      return;
    }

    const action = pendingAction;

    setPendingAction(null);

    /*
     * Wait for AuthContext to update before executing the action.
     */
    setTimeout(() => {
      executeProtectedAction(action);
    }, 100);
  };

  /*
   * --------------------------------------------------------------------------
   * LOADING STATE
   * --------------------------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
        <div className="h-4 bg-[#D9E2EA] rounded w-48 mb-4" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="aspect-[4/3] bg-[#E4EEF3] rounded-3xl" />

          <div className="space-y-4">
            <div className="h-6 bg-[#D9E2EA] rounded w-1/3" />

            <div className="h-10 bg-[#E4EEF3] rounded w-3/4" />

            <div className="h-6 bg-[#D9E2EA] rounded w-1/4" />

            <div className="h-28 bg-[#E4EEF3] rounded" />

            <div className="h-12 bg-[#D9E2EA] rounded" />
          </div>
        </div>
      </div>
    );
  }

  /*
   * --------------------------------------------------------------------------
   * ERROR / PRODUCT NOT FOUND
   * --------------------------------------------------------------------------
   */

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <SeoHead
          title="Product Not Found | Ferrado"
          description="The requested construction product was not found in the Ferrado catalogue."
          noIndex={true}
        />

        <div className="w-16 h-16 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/20 text-[#B43D20] flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-black text-[#173885]">
          Product Not Available
        </h2>

        <p className="text-[#606460] text-sm max-w-md mx-auto">
          {error ||
            "The requested construction product was not found in the catalogue."}
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

  /*
   * --------------------------------------------------------------------------
   * SEO STRUCTURED DATA
   * --------------------------------------------------------------------------
   */

  const breadcrumbSchema = seoService.generateBreadcrumbSchema([
    {
      name: "Home",
      url: "/",
    },
    {
      name: "Catalogue",
      url: "/products",
    },
    {
      name: product.categoryName || product.category || "Products",
      url: `/products?category=${encodeURIComponent(
        product.categorySlug || "",
      )}`,
    },
    {
      name: product.name,
      url: `/products/${product.slug}`,
    },
  ]);

  const productSchema = seoService.generateProductSchema(product);

  /*
   * --------------------------------------------------------------------------
   * VENDOR INFORMATION
   * --------------------------------------------------------------------------
   *
   * New catalogue mapping exposes:
   *
   * product.vendor
   * product.vendorName
   * product.vendorId
   */

  const vendorName =
    product.vendorName ||
    product.vendor?.businessName ||
    product.vendor?.tradeName ||
    "Verified Ferrado Vendor";

  const vendorLocation = [
    product.vendor?.locality,
    product.vendor?.city,
    product.vendor?.state,
  ]
    .filter(Boolean)
    .join(", ");

  /*
   * --------------------------------------------------------------------------
   * DELIVERY CHECKER VALUES
   * --------------------------------------------------------------------------
   *
   * Do not use the old hard-coded:
   * - Cement = 50 kg
   * - Steel = HEAVY_HARDWARE
   *
   * Those values were demo assumptions.
   *
   * Keep DeliveryChecker generic unless the product data explicitly provides
   * delivery metadata.
   */

  const deliveryClass =
    product.isExpress30MinAvailable && product.vendor?.isExpress30MinEnabled
      ? "STANDARD_PARCEL"
      : "STANDARD_PARCEL";

  /*
   * --------------------------------------------------------------------------
   * RENDER
   * --------------------------------------------------------------------------
   */

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10 pb-28">
      {/* ------------------------------------------------------------------ */}
      {/* SEO                                                               */}
      {/* ------------------------------------------------------------------ */}

      <SeoHead
        title={`${product.name} | ${product.brand || "Ferrado"}`}
        description={`${product.name} - Buy online in Pune & PCMC. ${
          product.description
            ? product.description.slice(0, 140)
            : "Verified construction product available from Ferrado vendors."
        }`}
        canonicalUrl={`/products/${product.slug}`}
        ogImage={currentMediaUrl}
        ogType="product"
        structuredData={[breadcrumbSchema, productSchema]}
      />

      {/* ------------------------------------------------------------------ */}
      {/* BREADCRUMBS                                                        */}
      {/* ------------------------------------------------------------------ */}

      <nav
        className="flex items-center gap-2 text-xs text-[#6F8A92] overflow-x-auto whitespace-nowrap"
        aria-label="Breadcrumb"
      >
        <Link to="/" className="hover:text-[#3C7DDA] transition">
          Home
        </Link>

        <ChevronRight className="w-3.5 h-3.5 shrink-0" />

        <Link to="/products" className="hover:text-[#3C7DDA] transition">
          Catalogue
        </Link>

        <ChevronRight className="w-3.5 h-3.5 shrink-0" />

        {product.categorySlug ? (
          <Link
            to={`/products?category=${encodeURIComponent(
              product.categorySlug,
            )}`}
            className="hover:text-[#3C7DDA] transition"
          >
            {product.categoryName || product.category || "Products"}
          </Link>
        ) : (
          <span>{product.categoryName || product.category || "Products"}</span>
        )}

        <ChevronRight className="w-3.5 h-3.5 shrink-0" />

        <span className="text-[#282926] font-bold truncate max-w-xs">
          {product.name}
        </span>
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* PRODUCT SHOWCASE                                                   */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* ---------------------------------------------------------------- */}
        {/* GALLERY                                                          */}
        {/* ---------------------------------------------------------------- */}

        <div className="lg:col-span-6 space-y-4">
          <div className="relative rounded-3xl overflow-hidden gm-card shadow-md bg-[#FEFEFE]">
            <ProductImage
              src={currentMediaUrl}
              alt={product.name}
              aspectRatio="aspect-square sm:aspect-[4/3]"
              priority={true}
              width={1000}
            />

            {/* Express Delivery Badge */}
            {product.isExpress30MinAvailable &&
              product.vendor?.isExpress30MinEnabled && (
                <span className="absolute top-4 left-4 bg-[#3C7DDA] text-[#FEFEFE] px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  30-MIN DELIVERY ELIGIBLE
                </span>
              )}

            {/* Wishlist */}
            <button
              type="button"
              onClick={() => executeProtectedAction("wishlist")}
              className={`absolute top-4 right-4 p-3 rounded-2xl bg-[#FEFEFE]/90 backdrop-blur-md border border-[#D9E2EA] shadow-xs transition ${
                activeWish
                  ? "text-[#B43D20] fill-[#B43D20]"
                  : "text-[#606460] hover:text-[#B43D20]"
              }`}
              title={activeWish ? "Remove from Wishlist" : "Save to Wishlist"}
              aria-label={
                activeWish ? "Remove from Wishlist" : "Save to Wishlist"
              }
            >
              <Heart
                className={`w-5 h-5 ${activeWish ? "fill-current" : ""}`}
              />
            </button>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* IMAGE THUMBNAILS                                                */}
          {/* ---------------------------------------------------------------- */}

          {gallery.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {gallery.map((imgUrl, index) => (
                <button
                  key={`${imgUrl}-${index}`}
                  type="button"
                  onClick={() => setSelectedImgIndex(index)}
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition ${
                    selectedImgIndex === index
                      ? "border-[#3C7DDA] shadow-xs scale-95"
                      : "border-[#D9E2EA] opacity-60 hover:opacity-100"
                  }`}
                  aria-label={`View product image ${index + 1}`}
                  aria-pressed={selectedImgIndex === index}
                >
                  <ProductImage
                    src={imgUrl}
                    alt={`${product.name} image ${index + 1}`}
                    aspectRatio="aspect-square"
                    width={160}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* PRODUCT DETAILS                                                  */}
        {/* ---------------------------------------------------------------- */}

        <div className="lg:col-span-6 space-y-6">
          {/* Product Heading */}
          <div>
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="font-bold text-[#3C7DDA] uppercase tracking-widest truncate">
                {product.brand || "Verified Product"}
              </span>

              {product.sku && (
                <span className="text-[#6F8A92] font-mono text-[11px] shrink-0">
                  SKU: {product.sku}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1 leading-tight">
              {product.name}
            </h1>

            {/* Rating + Stock */}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <div className="flex items-center gap-1 text-[#173885] text-sm font-bold">
                <Star className="w-4 h-4 fill-[#3C7DDA] text-[#3C7DDA]" />

                <span className="text-[#282926]">
                  {Number(product.rating || 0).toFixed(1)}
                </span>
              </div>

              <span className="text-xs text-[#606460]">
                ({product.reviewCount || product.reviews || 0} customer reviews)
              </span>

              <span className="text-[#D9E2EA]">•</span>

              {isInStock ? (
                <span className="text-xs text-[#3F7D20] font-semibold flex items-center gap-1 bg-[#E1F2D9] px-2.5 py-0.5 rounded-full">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  In Stock
                  {availableStock > 0 && (
                    <>
                      {" "}
                      ({availableStock} {product.unit || "units"} available)
                    </>
                  )}
                </span>
              ) : (
                <span className="text-xs text-[#B43D20] font-semibold flex items-center gap-1 bg-[#FBE3DE] px-2.5 py-0.5 rounded-full">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Currently Unavailable
                </span>
              )}
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* PRICE BOX                                                        */}
          {/* ---------------------------------------------------------------- */}

          <div className="gm-panel p-5 rounded-2xl flex flex-wrap items-baseline justify-between gap-3 border border-[#D9E2EA] bg-[#FEFEFE]">
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <span className="text-3xl sm:text-4xl font-black text-[#173885] font-mono">
                ₹{formattedPrice}
              </span>

              <span className="text-xs font-bold text-[#606460]">
                / {product.unit || "Unit"}
              </span>

              {formattedOriginalPrice && (
                <span className="text-base text-[#6F8A92] line-through font-mono ml-2">
                  ₹{formattedOriginalPrice}
                </span>
              )}
            </div>

            {savings > 0 && (
              <span className="text-xs font-bold text-[#3F7D20] bg-[#E1F2D9] px-2.5 py-1 rounded-lg">
                Save ₹{savings.toLocaleString("en-IN")} per{" "}
                {product.unit || "unit"}
              </span>
            )}
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* MOQ                                                              */}
          {/* ---------------------------------------------------------------- */}

          {minOrderQty > 1 && (
            <div className="p-3.5 rounded-2xl bg-[#FFF0D5] border border-[#A66A08]/20 text-[#A66A08] text-xs flex items-center gap-2.5">
              <Package className="w-4 h-4 shrink-0" />

              <span className="font-bold">
                Minimum Order Quantity: {minOrderQty} {product.unit || "units"}
              </span>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* DELIVERY CHECKER                                                 */}
          {/* ---------------------------------------------------------------- */}

          <DeliveryChecker
            initialPincode={product.vendor?.pincode || "411006"}
            deliveryClass={deliveryClass}
            compact={true}
          />

          {/* ---------------------------------------------------------------- */}
          {/* QUANTITY + ACTIONS                                               */}
          {/* ---------------------------------------------------------------- */}

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              {/* Quantity */}
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
                  disabled={availableStock > 0 && quantity >= availableStock}
                  className="px-3 py-1.5 text-[#606460] hover:text-[#282926] disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              {/* Add To Bag */}
              <button
                type="button"
                onClick={() => executeProtectedAction("cart")}
                disabled={!isInStock}
                className="flex-1 btn-gm-secondary py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-4 h-4 text-[#173885]" />

                <span>{isInStock ? "Add to Bag" : "Out of Stock"}</span>
              </button>

              {/* Buy Now */}
              <button
                type="button"
                onClick={() => executeProtectedAction("buy_now")}
                disabled={!isInStock}
                className="flex-1 btn-gm-primary py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Buy Now</span>
              </button>
            </div>

            {/* Action Success */}
            {actionSuccessMsg && (
              <div className="p-3 rounded-xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#3F7D20] shrink-0" />

                <span>{actionSuccessMsg}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* PRODUCT INFORMATION + REVIEWS                                     */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        {/* ---------------------------------------------------------------- */}
        {/* DESCRIPTION / FEATURES / SPECIFICATIONS / REVIEWS                */}
        {/* ---------------------------------------------------------------- */}

        <div className="lg:col-span-2 space-y-8">
          <div className="gm-panel p-6 sm:p-8 rounded-3xl space-y-4">
            <h2 className="text-lg font-black text-[#173885] border-b border-[#D9E2EA] pb-3">
              Product Overview
            </h2>

            <p className="text-sm text-[#282926] leading-relaxed">
              {product.description || "Product description is not available."}
            </p>

            {/* ------------------------------------------------------------ */}
            {/* FEATURES                                                     */}
            {/* ------------------------------------------------------------ */}

            {Array.isArray(product.features) && product.features.length > 0 && (
              <div className="pt-2 space-y-2">
                <h3 className="text-xs font-bold text-[#3C7DDA] uppercase tracking-wider">
                  Key Product Features
                </h3>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#282926]">
                  {product.features.map((feature, index) => (
                    <li
                      key={`${feature}-${index}`}
                      className="flex items-center gap-2"
                    >
                      <Check className="w-3.5 h-3.5 text-[#3F7D20] shrink-0" />

                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* TECHNICAL SPECIFICATIONS                                     */}
            {/* ------------------------------------------------------------ */}

            {dynamicAttributes.length > 0 && (
              <div className="pt-4 space-y-3">
                <h3 className="text-xs font-bold text-[#3C7DDA] uppercase tracking-wider">
                  Technical Specifications
                  {product.category ? ` (${product.category})` : ""}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {dynamicAttributes.map((attribute, index) => (
                    <div
                      key={`${attribute.key}-${index}`}
                      className="bg-[#F4F6FA] p-3 rounded-xl flex justify-between gap-4 text-xs border border-[#D9E2EA]"
                    >
                      <span className="text-[#606460]">{attribute.key}</span>

                      <span className="text-[#282926] font-semibold font-mono text-right">
                        {Array.isArray(attribute.value)
                          ? attribute.value.join(", ")
                          : String(attribute.value ?? "")}
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

        {/* ---------------------------------------------------------------- */}
        {/* RIGHT SIDEBAR                                                    */}
        {/* ---------------------------------------------------------------- */}

        <div className="space-y-6">
          {/* -------------------------------------------------------------- */}
          {/* VERIFIED VENDOR                                                */}
          {/* -------------------------------------------------------------- */}

          <div className="gm-panel p-6 rounded-3xl space-y-3">
            <span className="text-[10px] font-bold text-[#3C7DDA] uppercase tracking-widest">
              Verified Vendor
            </span>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#E4EEF3] border border-[#9AAED4]/40 flex items-center justify-center text-[#173885] shrink-0">
                <Building2 className="w-6 h-6" />
              </div>

              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#282926] truncate">
                  {vendorName}
                </h3>

                {vendorLocation ? (
                  <p className="text-xs text-[#606460] truncate">
                    {vendorLocation}
                  </p>
                ) : (
                  <p className="text-xs text-[#606460]">Pune & PCMC</p>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F4F6FA] border border-[#D9E2EA] text-[11px] text-[#606460] leading-relaxed">
              Product supplied by a Ferrado vendor. Vendor verification and
              product approval are managed through the Ferrado marketplace.
            </div>
          </div>

          {/* -------------------------------------------------------------- */}
          {/* B2B PROCUREMENT                                                */}
          {/* -------------------------------------------------------------- */}

          <div className="gm-panel p-6 rounded-3xl space-y-3 border border-[#3C7DDA]/30 bg-[#E4EEF3]/40">
            <div className="flex items-center gap-2 text-[#173885]">
              <Building2 className="w-4 h-4 text-[#3C7DDA]" />

              <h3 className="text-xs font-bold text-[#173885] uppercase tracking-wider">
                B2B Procurement
              </h3>
            </div>

            <p className="text-xs text-[#606460] leading-relaxed">
              Need larger quantities or a formal project quotation for this
              product?
            </p>

            <button
              type="button"
              onClick={handleProjectRFQClick}
              className="w-full btn-gm-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Submit Project RFQ</span>
            </button>
          </div>

          {/* -------------------------------------------------------------- */}
          {/* DELIVERY & QUALITY                                             */}
          {/* -------------------------------------------------------------- */}

          <div className="gm-panel p-6 rounded-3xl space-y-3">
            <div className="flex items-center gap-2 border-b border-[#D9E2EA] pb-2">
              <ShieldCheck className="w-4 h-4 text-[#3F7D20]" />

              <h3 className="text-xs font-bold text-[#282926]">
                Product & Delivery Information
              </h3>
            </div>

            <div className="space-y-3 text-xs text-[#606460] leading-relaxed">
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#3F7D20] shrink-0 mt-0.5" />

                <p>
                  Product availability is based on the vendor's current
                  inventory.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#3F7D20] shrink-0 mt-0.5" />

                <p>
                  Eligible products can be checked for 30-minute delivery using
                  your pincode.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#3F7D20] shrink-0 mt-0.5" />

                <p>
                  Delivery availability depends on vendor serviceability and
                  order location.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#3F7D20] shrink-0 mt-0.5" />

                <p>
                  Product-specific handling requirements may vary by category
                  and order quantity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* AUTH MODAL                                                         */}
      {/* ------------------------------------------------------------------ */}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setPendingAction(null);
        }}
        onSuccess={handleAuthSuccess}
      />

      {/* ------------------------------------------------------------------ */}
      {/* B2B / RFQ COMING SOON MODAL                                       */}
      {/* ------------------------------------------------------------------ */}

      <FeatureComingSoonModal
        isOpen={comingSoonModalOpen}
        onClose={() => setComingSoonModalOpen(false)}
        featureName="B2B Procurement"
        title="Project RFQs Are Coming Soon"
        description="Commercial project RFQs and bulk procurement are currently being prepared for Ferrado. This feature will be available in a future update."
      />
    </div>
  );
};

export default ProductDetails;
