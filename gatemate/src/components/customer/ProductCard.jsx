import React from "react";
import { Link } from "react-router-dom";
import { Star, ShoppingBag, Heart } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { ProductImage } from "./ProductImage";

export const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const activeWish = isInWishlist(product.id);

  return (
    <div className="gm-card gm-card-hover rounded-2xl overflow-hidden flex flex-col group relative">
      {/* Thumbnail Frame */}
      <div className="relative w-full overflow-hidden bg-[#F4F6FA]">
        <Link to={`/products/${product.slug}`}>
          <ProductImage
            src={product.img}
            alt={product.name}
            aspectRatio="aspect-square sm:aspect-[4/3]"
            imageClassName="group-hover:scale-105"
            width={600}
          />
        </Link>
        {product.tag && (
          <span className="absolute top-3 left-3 bg-[#173885]/90 px-2.5 py-0.5 rounded-lg text-xs font-bold text-[#FEFEFE] shadow-sm">
            {product.tag}
          </span>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product);
          }}
          className={`absolute top-3 right-3 p-2.5 rounded-xl bg-[#FEFEFE]/90 border border-[#D9E2EA] shadow-xs backdrop-blur-md transition ${
            activeWish
              ? "text-[#B43D20] fill-[#B43D20]"
              : "text-[#606460] hover:text-[#B43D20]"
          }`}
          aria-label={activeWish ? "Remove from wishlist" : "Save to wishlist"}
        >
          <Heart className={`w-4 h-4 ${activeWish ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Content Meta */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
        <div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-[#3C7DDA] uppercase tracking-wider">
              {product.category}
            </span>
            <span className="text-[#6F8A92] font-mono">{product.brand}</span>
          </div>

          <Link to={`/products/${product.slug}`}>
            <h3 className="text-[#282926] font-bold text-sm mt-1 line-clamp-2 group-hover:text-[#173885] transition-colors">
              {product.name}
            </h3>
          </Link>

          <div className="flex items-center gap-1 mt-1.5 text-[#173885] text-xs">
            <Star className="w-3.5 h-3.5 fill-[#3C7DDA] text-[#3C7DDA]" />
            <span className="font-bold text-[#282926]">{product.rating}</span>
            <span className="text-[#6F8A92]">({product.reviews})</span>
            {product.moq && product.moq > 1 && (
              <span className="ml-auto text-[10px] text-[#173885] bg-[#E4EEF3] px-2 py-0.5 rounded border border-[#9AAED4]/40 font-semibold">
                MOQ: {product.moq} {product.unit}s
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#D9E2EA]">
          <div>
            {product.originalPrice && (
              <div className="text-xs text-[#6F8A92] line-through font-mono">
                ₹{product.originalPrice}
              </div>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-[#173885] font-mono">
                ₹{product.price}
              </span>
              <span className="text-[10px] text-[#606460] font-semibold">
                / {product.unit || "Unit"}
              </span>
            </div>
          </div>
          <button
            onClick={() => addToCart(product)}
            className="btn-gm-primary px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 active:scale-95"
            aria-label={`Add ${product.name} to bag`}
          >
            <ShoppingBag className="w-4 h-4 text-[#FEFEFE]" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};
