import React, { useState } from "react";
import {
  X,
  Minus,
  Plus,
  Trash2,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export const CheckoutDrawer = ({ isOpen, onClose, onRequireAuth }) => {
  const { cart, removeFromCart, updateQuantity, subtotal, clearCart } =
    useCart();
  const { user } = useAuth();

  // Stages: 'cart' -> 'address' -> 'payment' -> 'success'
  const [step, setStep] = useState("cart");
  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    line1: "",
    city: "Jodhpur",
    pincode: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleProceedToBuy = () => {
    if (!user) {
      onRequireAuth();
      return;
    }
    setStep("address");
  };

  const handleCashfreePayment = () => {
    setIsProcessing(true);
    // Simulation of Cashfree checkout trigger
    setTimeout(() => {
      setIsProcessing(false);
      setStep("success");
      clearCart();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-lg bg-slate-900/90 border-l border-white/20 h-full p-6 flex flex-col justify-between overflow-y-auto shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white tracking-wide">
            {step === "cart" && "Your Shopping Bag"}
            {step === "address" && "Delivery Address"}
            {step === "payment" && "Cashfree Checkout"}
            {step === "success" && "Order Placed!"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white/70"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 py-4 overflow-y-auto">
          {step === "cart" && (
            <div>
              {cart.length === 0 ? (
                <div className="text-center py-12 text-blue-200/60">
                  Your cart is empty.
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="glass-card p-3 rounded-xl flex items-center gap-3"
                    >
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-14 h-14 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-white line-clamp-1">
                          {item.name}
                        </h4>
                        <span className="text-cyan-300 font-bold text-sm">
                          ₹{item.price}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/10 rounded-lg px-2 py-1">
                        <button onClick={() => updateQuantity(item.id, -1)}>
                          <Minus className="w-3.5 h-3.5 text-white" />
                        </button>
                        <span className="text-xs font-semibold text-white px-1">
                          {item.quantity}
                        </span>
                        <button onClick={() => updateQuantity(item.id, 1)}>
                          <Plus className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === "address" && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Full Name"
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-sm"
                value={address.fullName}
                onChange={(e) =>
                  setAddress({ ...address, fullName: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Contact Mobile Number"
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-sm"
                value={address.phone}
                onChange={(e) =>
                  setAddress({ ...address, phone: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="House / Street / Gate No."
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-sm"
                value={address.line1}
                onChange={(e) =>
                  setAddress({ ...address, line1: e.target.value })
                }
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="City"
                  className="w-1/2 glass-input px-3.5 py-2.5 rounded-xl text-sm"
                  value={address.city}
                  onChange={(e) =>
                    setAddress({ ...address, city: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Pincode"
                  className="w-1/2 glass-input px-3.5 py-2.5 rounded-xl text-sm"
                  value={address.pincode}
                  onChange={(e) =>
                    setAddress({ ...address, pincode: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-4 text-center py-4">
              <div className="glass-card p-4 rounded-xl text-left space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-200">Amount Payable:</span>
                  <span className="text-cyan-300 font-bold text-base">
                    ₹{subtotal}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-blue-300">
                  <span>Gateway:</span>
                  <span>Cashfree Payments (UPI / Card / NetBanking)</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs">
                <ShieldCheck className="w-4 h-4" /> 256-bit Encrypted Secure
                Gateway
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-8 space-y-3">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
              <h3 className="text-lg font-bold text-white">
                Thank you for your order!
              </h3>
              <p className="text-xs text-blue-200">
                Order ID: GM-{Math.floor(100000 + Math.random() * 900000)}
              </p>
              <p className="text-xs text-blue-300/80">
                You can track your order status in real time.
              </p>
            </div>
          )}
        </div>

        {/* Action Footer */}
        {cart.length > 0 && step !== "success" && (
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex justify-between text-sm font-semibold text-white">
              <span>Total:</span>
              <span className="text-cyan-300 text-lg">₹{subtotal}</span>
            </div>

            {step === "cart" && (
              <button
                onClick={handleProceedToBuy}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-slate-950 font-bold flex items-center justify-center gap-2 transition"
              >
                <span>Proceed to Buy</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === "address" && (
              <button
                disabled={!address.fullName || !address.line1}
                onClick={() => setStep("payment")}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-400 to-blue-600 disabled:opacity-50 text-slate-950 font-bold transition"
              >
                Continue to Payment
              </button>
            )}

            {step === "payment" && (
              <button
                onClick={handleCashfreePayment}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition"
              >
                {isProcessing ? "Connecting Cashfree..." : `Pay ₹${subtotal}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
