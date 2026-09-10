import React from "react";
import { Link } from "react-router-dom";
import {
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { SeoHead } from "../common/SeoHead";

export const Cart = () => {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();

  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24">
      <SeoHead
        title="Shopping Bag | GateMate Construction Marketplace"
        description="Review your selected construction Products, cement bags, TMT rebars, and building hardware."
        noIndex={true}
      />

      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
<<<<<<< HEAD
          <h1 className="text-2xl font-black text-dark">Shopping Bag</h1>
=======
          <h1 className="text-2xl font-black text-white">Shopping Bag</h1>
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
          <p className="text-xs text-slate-400">
            {totalItems} construction Product{totalItems === 1 ? "" : "s"} ready
            for site dispatch in Pune & PCMC
          </p>
        </div>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
          >
            Clear Bag
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="premium-panel p-16 rounded-3xl text-center space-y-4 max-w-md mx-auto">
<<<<<<< HEAD
          <div className="w-16 h-16 rounded-2xl bg-[#0c182b] text-dark-400 flex items-center justify-center mx-auto border border-white/10">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-dark">
=======
          <div className="w-16 h-16 rounded-2xl bg-[#0c182b] text-amber-400 flex items-center justify-center mx-auto border border-white/10">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
            Your Shopping Bag is Empty
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Discover certified Cement, Steel TMT, AAC Blocks, Plumbing, and
            Electrical Products with priority delivery to your construction
            sites.
          </p>
          <Link
            to="/products"
<<<<<<< HEAD
            className="dark-gradient-btn inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold shadow-lg"
=======
            className="gold-gradient-btn inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold shadow-lg"
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
          >
            <span>Explore Construction Products</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Products List */}
          <div className="lg:col-span-2 space-y-3">
            {cart.map((item) => (
              <div
                key={item.id}
                className="premium-panel p-4 sm:p-5 rounded-2xl border border-white/10 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={item.img}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover bg-black shrink-0 border border-white/10"
                  />
                  <div>
<<<<<<< HEAD
                    <span className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">
                      {item.category}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-dark line-clamp-1">
                      {item.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mt-1 text-xs">
                      <span className="font-bold text-dark font-mono">
=======
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      {item.category}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                      {item.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mt-1 text-xs">
                      <span className="font-bold text-white font-mono">
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
                        ₹{item.price}
                      </span>
                      <span className="text-slate-400 font-semibold text-[10px]">
                        / {item.unit || "Unit"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-[#050b14] border border-white/10 rounded-lg p-1">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
<<<<<<< HEAD
                      className="px-2.5 py-1 text-slate-400 hover:text-dark"
=======
                      className="px-2.5 py-1 text-slate-400 hover:text-white"
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
<<<<<<< HEAD
                    <span className="px-2 text-xs font-bold text-dark font-mono">
=======
                    <span className="px-2 text-xs font-bold text-white font-mono">
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
<<<<<<< HEAD
                      className="px-2.5 py-1 text-slate-400 hover:text-dark"
=======
                      className="px-2.5 py-1 text-slate-400 hover:text-white"
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

<<<<<<< HEAD
                  <span className="font-mono text-dark-400 font-black text-sm hidden sm:inline w-20 text-right">
=======
                  <span className="font-mono text-amber-400 font-black text-sm hidden sm:inline w-20 text-right">
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
                    ₹{item.price * item.quantity}
                  </span>

                  <button
                    onClick={() => removeFromCart(item.id)}
<<<<<<< HEAD
                    className="p-2 text-rose-400 hover:text-dark hover:bg-rose-500/20 rounded-xl transition"
=======
                    className="p-2 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-xl transition"
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
                    title="Remove Product"
                    aria-label="Remove Product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="premium-panel p-6 rounded-3xl space-y-4 border border-white/10">
<<<<<<< HEAD
            <h3 className="text-base font-bold text-dark border-b border-white/10 pb-3">
=======
            <h3 className="text-base font-bold text-white border-b border-white/10 pb-3">
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
              Order Estimation
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Products Subtotal:</span>
<<<<<<< HEAD
                <span className="font-mono text-dark font-bold">
=======
                <span className="font-mono text-white font-bold">
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
                  ₹{subtotal}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Site Delivery SLA:</span>
                <span className="text-emerald-400 font-bold">
                  Calculated at Checkout
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>GST Tax & Invoicing:</span>
                <span className="text-slate-300">Included in Price</span>
              </div>
<<<<<<< HEAD
              <div className="flex justify-between text-sm font-black text-dark pt-2 border-t border-white/10">
                <span>Estimated Total:</span>
                <span className="font-mono text-dark-400 text-lg">
=======
              <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-white/10">
                <span>Estimated Total:</span>
                <span className="font-mono text-amber-400 text-lg">
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
                  ₹{subtotal}
                </span>
              </div>
            </div>

            <Link
              to="/checkout"
<<<<<<< HEAD
              className="w-full dark-gradient-btn py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition active:scale-98"
=======
              className="w-full gold-gradient-btn py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition active:scale-98"
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
            >
              <span>Proceed to Instant Checkout</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </Link>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Direct stockist fulfillment in Pune & PCMC</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
