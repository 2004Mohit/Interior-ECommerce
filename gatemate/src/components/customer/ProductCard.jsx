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
<<<<<<< HEAD
            <span className="font-bold text-[#3C7DDA] uppercase tracking-wider">
              {product.category}
            </span>
            <span className="text-[#6F8A92] font-mono">{product.brand}</span>
          </div>

          <Link to={`/products/${product.slug}`}>
            <h3 className="text-[#282926] font-bold text-sm mt-1 line-clamp-2 group-hover:text-[#173885] transition-colors">
=======
            <span className="font-bold text-amber-400 uppercase tracking-wider">
              {product.category}
            </span>
            <span className="text-slate-400 font-mono">{product.brand}</span>
          </div>

          <Link to={`/products/${product.slug}`}>
            <h3 className="text-white font-bold text-sm mt-1 line-clamp-2 group-hover:text-amber-300 transition-colors">
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
              {product.name}
            </h3>
          </Link>

<<<<<<< HEAD
          <div className="flex items-center gap-1 mt-1.5 text-[#173885] text-xs">
            <Star className="w-3.5 h-3.5 fill-[#3C7DDA] text-[#3C7DDA]" />
            <span className="font-bold text-[#282926]">{product.rating}</span>
            <span className="text-[#6F8A92]">({product.reviews})</span>
            {product.moq && product.moq > 1 && (
              <span className="ml-auto text-[10px] text-[#173885] bg-[#E4EEF3] px-2 py-0.5 rounded border border-[#9AAED4]/40 font-semibold">
=======
          <div className="flex items-center gap-1 mt-1.5 text-amber-400 text-xs">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span className="font-bold">{product.rating}</span>
            <span className="text-slate-400">({product.reviews})</span>
            {product.moq && product.moq > 1 && (
              <span className="ml-auto text-[10px] text-amber-300 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20">
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
                MOQ: {product.moq} {product.unit}s
              </span>
            )}
          </div>
        </div>

<<<<<<< HEAD
        <div className="flex items-center justify-between pt-3 border-t border-[#D9E2EA]">
=======
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
          <div>
            {product.originalPrice && (
              <div className="text-xs text-[#6F8A92] line-through font-mono">
                ₹{product.originalPrice}
              </div>
            )}
            <div className="flex items-baseline gap-1">
<<<<<<< HEAD
              <span className="text-xl font-black text-[#173885] font-mono">
                ₹{product.price}
              </span>
              <span className="text-[10px] text-[#606460] font-semibold">
=======
              <span className="text-xl font-black text-white font-mono">
                ₹{product.price}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
                / {product.unit || "Unit"}
              </span>
            </div>
          </div>
          <button
            onClick={() => addToCart(product)}
<<<<<<< HEAD
            className="btn-gm-primary px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 active:scale-95"
            aria-label={`Add ${product.name} to bag`}
          >
            <ShoppingBag className="w-4 h-4 text-[#FEFEFE]" />
=======
            className="gold-gradient-btn px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md"
            aria-label={`Add ${product.name} to bag`}
          >
            <ShoppingBag className="w-4 h-4 text-slate-950" />
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};
