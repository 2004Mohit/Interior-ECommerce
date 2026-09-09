import React from "react";
import { Link } from "react-router-dom";
import { Star, ShoppingBag, Heart } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";

export const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const activeWish = isInWishlist(product.id);

  return (
    <div className="premium-card premium-card-hover rounded-2xl overflow-hidden flex flex-col group relative">
      {/* Thumbnail Frame */}
      <div className="relative h-60 w-full overflow-hidden bg-[#060e1a]">
        <Link to={`/products/${product.slug}`}>
          <img
            src={product.img}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>
        {product.tag && (
          <span className="absolute top-3 left-3 bg-[#050b14]/90 px-3 py-1 rounded-lg text-xs font-bold text-amber-300 border border-amber-400/30">
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
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
            {product.category}
          </span>
          <Link to={`/products/${product.slug}`}>
            <h3 className="text-white font-bold text-base mt-1 line-clamp-1 group-hover:text-amber-300 transition-colors">
              {product.name}
            </h3>
          </Link>
          <div className="flex items-center gap-1 mt-1.5 text-amber-400 text-xs">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span className="font-bold">{product.rating}</span>
            <span className="text-slate-400">({product.reviews} reviews)</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div>
            {product.originalPrice && (
              <div className="text-xs text-slate-500 line-through">
                ₹{product.originalPrice}
              </div>
            )}
            <div className="text-xl font-black text-white font-mono">
              ₹{product.price}
            </div>
          </div>
          <button
            onClick={() => addToCart(product)}
            className="gold-gradient-btn px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add to Bag</span>
          </button>
        </div>
      </div>
    </div>
  );
};
