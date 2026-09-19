import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Star, ShoppingBag, Heart, Zap, Package, MapPin } from "lucide-react";

import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { ProductImage } from "./ProductImage";

export const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  if (!product) {
    return null;
  }

  const activeWish = isInWishlist(product.id);

  const productName = product.name || "Construction Product";
  const productSlug = product.slug || product.id;

  const categoryName =
    product.categoryName || product.category || "Construction Product";

  const brandName = product.brand || "";

  const unit = product.unit || "Unit";

  const price = Number(product.price) || 0;
  const originalPrice = Number(product.originalPrice) || 0;

  const rating = Number(product.rating) || 0;
  const reviewCount = Number(product.reviewCount ?? product.reviews) || 0;

  const moq = Math.max(Number(product.moq) || 1, 1);

  const availableStock =
    Number(
      product.availableStock ??
        product.stock ??
        product.inventory?.availableStock,
    ) || 0;

  const isInStock =
    product.isInStock !== undefined
      ? Boolean(product.isInStock)
      : availableStock > 0;

  const isExpressAvailable = Boolean(
    product.isExpress30MinAvailable ?? product.express ?? false,
  );

  const vendorName =
    product.vendorName ||
    product.vendor?.businessName ||
    product.vendor?.tradeName ||
    "";

  const imageSrc =
    product.coverImageUrl ||
    product.img ||
    product.image ||
    product.imageUrls?.[0] ||
    product.images?.[0] ||
    "";

  const discountPercentage = useMemo(() => {
    if (!originalPrice || originalPrice <= price || price <= 0) {
      return 0;
    }

    return Math.round(((originalPrice - price) / originalPrice) * 100);
  }, [originalPrice, price]);

  const formattedPrice = price.toLocaleString("en-IN");

  const formattedOriginalPrice =
    originalPrice > 0 ? originalPrice.toLocaleString("en-IN") : "";

  const formattedRating = rating > 0 ? rating.toFixed(1) : "New";

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isInStock) {
      return;
    }

    addToCart(product);
  };

  const handleWishlistToggle = (event) => {
    event.preventDefault();
    event.stopPropagation();

    toggleWishlist(product);
  };

  const unitLabel = unit.toString().trim().toLowerCase();

  const displayUnit =
    moq > 1 && unitLabel
      ? `${unit}${unitLabel.endsWith("s") ? "" : "s"}`
      : unit;

  return (
    <article className="gm-card gm-card-hover rounded-2xl overflow-hidden flex flex-col group relative bg-white">
      {/* Product Image */}
      <div className="relative w-full overflow-hidden bg-[#F4F6FA]">
        <Link
          to={`/products/${productSlug}`}
          aria-label={`View ${productName}`}
          className="block"
        >
          <ProductImage
            src={imageSrc}
            alt={productName}
            aspectRatio="aspect-square sm:aspect-[4/3]"
            imageClassName="group-hover:scale-105 transition-transform duration-500"
            width={600}
          />
        </Link>

        {/* Product Status Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {discountPercentage > 0 && (
            <span className="inline-flex items-center w-fit bg-[#173885]/95 px-2.5 py-1 rounded-lg text-[10px] font-bold text-[#FEFEFE] shadow-sm">
              {discountPercentage}% OFF
            </span>
          )}

          {product.tag && (
            <span className="inline-flex items-center w-fit bg-[#173885]/90 px-2.5 py-1 rounded-lg text-[10px] font-bold text-[#FEFEFE] shadow-sm">
              {product.tag}
            </span>
          )}

          {isExpressAvailable && (
            <span className="inline-flex items-center gap-1 w-fit bg-[#E4EEF3] border border-[#9AAED4]/50 px-2 py-1 rounded-lg text-[10px] font-bold text-[#173885] shadow-sm">
              <Zap className="w-3 h-3 fill-current" />
              30 Min
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 p-2.5 rounded-xl bg-[#FEFEFE]/95 border border-[#D9E2EA] shadow-sm backdrop-blur-md transition active:scale-90 ${
            activeWish
              ? "text-[#B43D20] fill-[#B43D20]"
              : "text-[#606460] hover:text-[#B43D20]"
          }`}
          aria-label={
            activeWish
              ? `Remove ${productName} from wishlist`
              : `Add ${productName} to wishlist`
          }
          aria-pressed={activeWish}
        >
          <Heart className={`w-4 h-4 ${activeWish ? "fill-current" : ""}`} />
        </button>

        {/* Out of Stock Overlay */}
        {!isInStock && (
          <div className="absolute inset-0 bg-[#173885]/10 flex items-center justify-center pointer-events-none">
            <span className="px-3 py-1.5 rounded-lg bg-[#282926]/90 text-white text-[11px] font-bold">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Content */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
        <div>
          {/* Category + Brand */}
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className="font-bold text-[#3C7DDA] uppercase tracking-wider truncate">
              {categoryName}
            </span>

            {brandName && (
              <span className="text-[#6F8A92] font-mono truncate max-w-[45%]">
                {brandName}
              </span>
            )}
          </div>

          {/* Product Name */}
          <Link to={`/products/${productSlug}`} className="block">
            <h3 className="text-[#282926] font-bold text-sm mt-1.5 line-clamp-2 group-hover:text-[#173885] transition-colors">
              {productName}
            </h3>
          </Link>

          {/* Rating + MOQ */}
          <div className="flex items-center gap-1.5 mt-2 text-xs min-h-[20px]">
            {rating > 0 ? (
              <>
                <Star className="w-3.5 h-3.5 fill-[#3C7DDA] text-[#3C7DDA]" />

                <span className="font-bold text-[#282926]">
                  {formattedRating}
                </span>

                <span className="text-[#6F8A92]">({reviewCount})</span>
              </>
            ) : (
              <span className="text-[#6F8A92] font-semibold">
                No reviews yet
              </span>
            )}

            {moq > 1 && (
              <span className="ml-auto text-[10px] text-[#173885] bg-[#E4EEF3] px-2 py-0.5 rounded border border-[#9AAED4]/40 font-semibold whitespace-nowrap">
                MOQ: {moq} {displayUnit}
              </span>
            )}
          </div>

          {/* Vendor */}
          {vendorName && (
            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[#6F8A92]">
              <Package className="w-3 h-3 shrink-0" />

              <span className="truncate">
                Sold by{" "}
                <span className="font-semibold text-[#606460]">
                  {vendorName}
                </span>
              </span>
            </div>
          )}

          {/* Delivery / Stock Information */}
          <div className="flex items-center gap-3 mt-2">
            {isExpressAvailable && (
              <div className="flex items-center gap-1 text-[10px] font-semibold text-[#173885]">
                <Zap className="w-3 h-3 fill-current" />
                <span>30-min eligible</span>
              </div>
            )}

            {isInStock ? (
              <div className="flex items-center gap-1 text-[10px] font-semibold text-[#3F7D20]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3F7D20]" />
                <span>
                  {availableStock > 0
                    ? `${availableStock} available`
                    : "In stock"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[10px] font-semibold text-[#B43D20]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B43D20]" />
                <span>Out of stock</span>
              </div>
            )}
          </div>
        </div>

        {/* Price + Add Button */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#D9E2EA]">
          <div className="min-w-0">
            {originalPrice > price && (
              <div className="text-xs text-[#6F8A92] line-through font-mono">
                ₹{formattedOriginalPrice}
              </div>
            )}

            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-[#173885] font-mono">
                ₹{formattedPrice}
              </span>

              <span className="text-[10px] text-[#606460] font-semibold">
                / {unit}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isInStock}
            className={`px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 active:scale-95 transition shrink-0 ${
              isInStock
                ? "btn-gm-primary"
                : "bg-[#E4EEF3] text-[#9AAED4] cursor-not-allowed border border-[#D9E2EA]"
            }`}
            aria-label={
              isInStock
                ? `Add ${productName} to cart`
                : `${productName} is out of stock`
            }
          >
            <ShoppingBag className="w-4 h-4" />

            <span>{isInStock ? "Add" : "Unavailable"}</span>
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
