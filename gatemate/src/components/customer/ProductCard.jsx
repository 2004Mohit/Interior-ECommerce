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
    <div className="premium-card premium-card-hover rounded-2xl overflow-hidden flex flex-col group relative">
      {/* Thumbnail Frame */}
      <div className="relative w-full overflow-hidden bg-[#060e1a]">
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
          <span className="absolute top-3 left-3 bg-[#050b14]/90 px-3 py-1 rounded-lg text-xs font-bold text-amber-300 border border-amber-400/30 shadow-md">
            {product.tag}
          </span>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product);
          }}
          className={`absolute top-3 right-3 p-2.5 rounded-xl bg-[#050b14]/80 border border-white/10 backdrop-blur-md transition ${
            activeWish
              ? "text-rose-500 fill-rose-500"
              : "text-slate-300 hover:text-rose-400"
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
            <span className="font-bold text-amber-400 uppercase tracking-wider">
              {product.category}
            </span>
            <span className="text-slate-400 font-mono">{product.brand}</span>
          </div>

          <Link to={`/products/${product.slug}`}>
            <h3 className="text-white font-bold text-sm mt-1 line-clamp-2 group-hover:text-amber-300 transition-colors">
              {product.name}
            </h3>
          </Link>

          <div className="flex items-center gap-1 mt-1.5 text-amber-400 text-xs">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span className="font-bold">{product.rating}</span>
            <span className="text-slate-400">({product.reviews})</span>
            {product.moq && product.moq > 1 && (
              <span className="ml-auto text-[10px] text-amber-300 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20">
                MOQ: {product.moq} {product.unit}s
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div>
            {product.originalPrice && (
              <div className="text-xs text-slate-500 line-through">
                ₹{product.originalPrice}
              </div>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-white font-mono">
                ₹{product.price}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">
                / {product.unit || "Unit"}
              </span>
            </div>
          </div>
          <button
            onClick={() => addToCart(product)}
            className="gold-gradient-btn px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md"
            aria-label={`Add ${product.name} to bag`}
          >
            <ShoppingBag className="w-4 h-4 text-slate-950" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};
