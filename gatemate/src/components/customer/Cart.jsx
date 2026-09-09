import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
} from "lucide-react";
import { useCart } from "../../context/CartContext";

export const Cart = () => {
  const { cart, removeFromCart, updateQuantity, subtotal } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white">
          Your Shopping Bag is Empty
        </h2>
        <p className="text-xs text-slate-400">
          Explore authentic Jodhpur handicrafts and automated gate essentials.
        </p>
        <Link
          to="/products"
          className="gold-gradient-btn inline-block px-6 py-3 rounded-xl text-xs"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <h1 className="text-2xl font-black text-white">
        Shopping Bag ({cart.length} unique items)
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Item List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div
              key={item.id}
              className="premium-card p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              <img
                src={item.img}
                alt={item.name}
                className="w-20 h-20 object-cover rounded-xl bg-black shrink-0"
              />
              <div className="flex-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase">
                  {item.category}
                </span>
                <h3 className="text-sm font-bold text-white">{item.name}</h3>
                <div className="text-amber-400 font-black text-base mt-1">
                  ₹{item.price}
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <div className="flex items-center bg-[#050b14] border border-white/10 rounded-lg px-2 py-1">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="text-slate-400 hover:text-white"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold text-white px-2">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="text-slate-400 hover:text-white"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-rose-400 hover:text-rose-300 p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Card */}
        <div>
          <div className="premium-panel p-6 rounded-3xl space-y-4 sticky top-24">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3">
              Order Summary
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Cart Subtotal</span>
                <span className="font-semibold text-white">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Estimated Shipping</span>
                <span className="text-emerald-400 font-semibold">FREE</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Taxes & GST (18%)</span>
                <span className="text-slate-400">Included</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-3 border-t border-white/10">
                <span>Total Amount</span>
                <span className="text-amber-400 text-lg font-black">
                  ₹{subtotal}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate("/checkout")}
              className="w-full py-3.5 rounded-xl gold-gradient-btn flex items-center justify-center gap-2 text-sm active:scale-98 transition"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-emerald-400 text-[11px] pt-2">
              <ShieldCheck className="w-4 h-4" /> Cashfree 256-bit encrypted
              checkout
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
