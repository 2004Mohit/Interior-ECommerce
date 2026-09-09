import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  ShoppingBag,
  Heart,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { PRODUCTS_DATA } from "../../data/mockData";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";

export const ProductDetails = () => {
  const { slug } = useParams();
  const product = PRODUCTS_DATA.find((p) => p.slug === slug);
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [selectedImg, setSelectedImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-white">Product Not Found</h2>
        <p className="text-slate-400 text-sm">
          The product you are looking for may have been retired or moved.
        </p>
        <Link
          to="/products"
          className="gold-gradient-btn inline-block px-5 py-2.5 rounded-xl text-xs"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  const activeWish = isInWishlist(product.id);

  const handleAdd = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back breadcrumb */}
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Catalog</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Gallery */}
        <div className="space-y-4">
          <div className="h-96 sm:h-[450px] rounded-3xl overflow-hidden premium-card bg-[#060e1a]">
            <img
              src={product.gallery?.[selectedImg] || product.img}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {product.gallery && product.gallery.length > 1 && (
            <div className="flex gap-3">
              {product.gallery.map((imgUrl, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImg(i)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition ${
                    selectedImg === i
                      ? "border-amber-400"
                      : "border-transparent opacity-60 hover:opacity-100"
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

        {/* Product Meta */}
        <div className="space-y-6">
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              {product.category}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
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
              <span className="text-xs text-emerald-400 font-semibold">
                • In Stock ({product.stock} units left)
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-3 border-y border-white/10 py-4">
            <span className="text-3xl font-black text-white">
              ₹{product.price}
            </span>
            {product.originalPrice && (
              <span className="text-base text-slate-500 line-through">
                ₹{product.originalPrice}
              </span>
            )}
            <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-lg">
              Save ₹{product.originalPrice - product.price}
            </span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            {product.description}
          </p>

          {/* Feature Bullets */}
          {product.features && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Key Highlights:
              </h4>
              <ul className="space-y-1.5">
                {product.features.map((feat, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-slate-200 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action CTAs */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-[#050b14] border border-white/10 rounded-xl p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 text-slate-300 hover:text-white"
                >
                  -
                </button>
                <span className="px-3 text-xs font-bold text-white">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1 text-slate-300 hover:text-white"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAdd}
                className="flex-1 gold-gradient-btn py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 active:scale-98 transition"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Shopping Bag</span>
              </button>

              <button
                onClick={() => toggleWishlist(product)}
                className={`p-3.5 rounded-xl border transition ${
                  activeWish
                    ? "bg-rose-500/20 border-rose-500/50 text-rose-400"
                    : "bg-[#0a1424] border-white/10 text-slate-300 hover:text-rose-400"
                }`}
                title="Wishlist"
              >
                <Heart
                  className={`w-5 h-5 ${activeWish ? "fill-current" : ""}`}
                />
              </button>
            </div>

            {addedNotice && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Added {quantity} item(s) to your shopping bag!</span>
              </div>
            )}
          </div>

          {/* Trust points */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 text-center">
            <div className="p-3 premium-card rounded-xl">
              <ShieldCheck className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <div className="text-[11px] font-bold text-white">
                Genuine Craft
              </div>
              <div className="text-[10px] text-slate-400">Marwar Certified</div>
            </div>
            <div className="p-3 premium-card rounded-xl">
              <Truck className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <div className="text-[11px] font-bold text-white">
                Fast Logistics
              </div>
              <div className="text-[10px] text-slate-400">Insured Delivery</div>
            </div>
            <div className="p-3 premium-card rounded-xl">
              <RotateCcw className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <div className="text-[11px] font-bold text-white">
                7 Days Return
              </div>
              <div className="text-[10px] text-slate-400">Safe Replacement</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
