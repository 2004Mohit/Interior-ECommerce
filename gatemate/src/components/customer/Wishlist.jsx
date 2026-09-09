import React from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useWishlist } from "../../context/WishlistContext";
import { ProductCard } from "./ProductCard";

export const Wishlist = () => {
  const { wishlist } = useWishlist();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <Heart className="w-5 h-5 fill-current" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">My Saved Wishlist</h1>
          <p className="text-xs text-slate-400">
            {wishlist.length} item(s) saved for later
          </p>
        </div>
      </div>

      {wishlist.length === 0 ? (
        <div className="premium-panel p-16 rounded-3xl text-center space-y-4 max-w-md mx-auto">
          <Heart className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">
            Your wishlist is empty
          </h3>
          <p className="text-xs text-slate-400">
            Save your favorite handcrafted decor and hardware items as you
            browse.
          </p>
          <Link
            to="/products"
            className="gold-gradient-btn inline-block px-5 py-2.5 rounded-xl text-xs font-bold"
          >
            Discover Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
