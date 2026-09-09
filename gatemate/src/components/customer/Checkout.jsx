import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

export const Checkout = () => {
  const { cart, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    line1: "",
    city: "Jodhpur",
    state: "Rajasthan",
    pincode: "",
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  if (cart.length === 0 && !completedOrder) {
    navigate("/cart");
    return null;
  }

  const handleCashfreePay = (e) => {
    e.preventDefault();
    setIsProcessing(true);

    // Mock Cashfree Gateway Flow
    setTimeout(() => {
      setIsProcessing(false);
      const orderId = `GM-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      setCompletedOrder({
        id: orderId,
        amount: subtotal,
        address: `${address.line1}, ${address.city} - ${address.pincode}`,
      });
      clearCart();
    }, 1800);
  };

  if (completedOrder) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="premium-panel p-8 rounded-3xl border border-emerald-500/30 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-white">
            Payment & Order Confirmed!
          </h2>
          <p className="text-xs text-slate-300">
            Order Reference:{" "}
            <span className="text-amber-400 font-bold">
              {completedOrder.id}
            </span>
          </p>
          <p className="text-xs text-slate-400">
            Delivery to:{" "}
            <span className="text-white font-semibold">
              {completedOrder.address}
            </span>
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate("/account/orders")}
              className="flex-1 gold-gradient-btn py-3 rounded-xl text-xs font-bold"
            >
              View My Orders
            </button>
            <button
              onClick={() => navigate("/products")}
              className="flex-1 premium-card hover:bg-white/5 py-3 rounded-xl text-xs font-bold text-white border border-white/10"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Delivery & Payment</h1>
        <p className="text-xs text-slate-400">
          Authorized checkout with Cashfree Payments India
        </p>
      </div>

      <form
        onSubmit={handleCashfreePay}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Shipping details */}
        <div className="lg:col-span-2 premium-panel p-6 rounded-3xl space-y-4">
          <h3 className="text-base font-bold text-white border-b border-white/10 pb-3">
            Shipping Address
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-300 block mb-1 font-semibold">
                Recipient Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Aditya Rathore"
                value={address.fullName}
                onChange={(e) =>
                  setAddress({ ...address, fullName: e.target.value })
                }
                className="w-full premium-input px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 block mb-1 font-semibold">
                Mobile Number *
              </label>
              <input
                type="tel"
                required
                placeholder="+91 9876543210"
                value={address.phone}
                onChange={(e) =>
                  setAddress({ ...address, phone: e.target.value })
                }
                className="w-full premium-input px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-300 block mb-1 font-semibold">
              Address Line (Street/Gate/House No.) *
            </label>
            <input
              type="text"
              required
              placeholder="Flat 204, Circuit House Enclave"
              value={address.line1}
              onChange={(e) =>
                setAddress({ ...address, line1: e.target.value })
              }
              className="w-full premium-input px-3.5 py-2.5 rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-300 block mb-1 font-semibold">
                City *
              </label>
              <input
                type="text"
                required
                value={address.city}
                onChange={(e) =>
                  setAddress({ ...address, city: e.target.value })
                }
                className="w-full premium-input px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 block mb-1 font-semibold">
                State *
              </label>
              <input
                type="text"
                required
                value={address.state}
                onChange={(e) =>
                  setAddress({ ...address, state: e.target.value })
                }
                className="w-full premium-input px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 block mb-1 font-semibold">
                Pincode *
              </label>
              <input
                type="text"
                required
                placeholder="342001"
                value={address.pincode}
                onChange={(e) =>
                  setAddress({ ...address, pincode: e.target.value })
                }
                className="w-full premium-input px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>
          </div>
        </div>

        {/* Order review */}
        <div>
          <div className="premium-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-base font-bold text-white border-b border-white/10 pb-3">
              Payable Summary
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Items Subtotal</span>
                <span className="text-white font-bold">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Delivery Charge</span>
                <span className="text-emerald-400 font-bold">FREE</span>
              </div>
              <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-white/10">
                <span>Total</span>
                <span className="text-amber-400 text-lg">₹{subtotal}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-98 disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {isProcessing ? "Connecting Cashfree..." : `Pay ₹${subtotal}`}
              </span>
            </button>

            <div className="flex items-center justify-center gap-2 text-emerald-400 text-[11px]">
              <ShieldCheck className="w-4 h-4" /> Bank Grade 256-Bit Protection
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
