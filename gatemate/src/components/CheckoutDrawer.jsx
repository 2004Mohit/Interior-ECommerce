import React, { useState } from "react";
import {
  X,
  Minus,
  Plus,
  Trash2,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export const CheckoutDrawer = ({ isOpen, onClose, onRequireAuth }) => {
  const { cart, removeFromCart, updateQuantity, subtotal, clearCart } =
    useCart();
  const { user } = useAuth();

  const [step, setStep] = useState("cart"); // 'cart' | 'address' | 'payment' | 'success'
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
    setTimeout(() => {
      setIsProcessing(false);
      setStep("success");
      clearCart();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-lg bg-[#070e1a] border-l border-white/10 h-full p-6 flex flex-col justify-between overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wider">
              {step === "cart" && "Shopping Bag"}
              {step === "address" && "Delivery Address"}
              {step === "payment" && "Cashfree Secure Checkout"}
              {step === "success" && "Order Confirmed"}
            </h2>
            <span className="text-[11px] text-amber-400 font-semibold">
              GATE<span className="text-white">MATE</span> Checkout
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#0c182b] text-slate-400 hover:text-white border border-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 py-4 overflow-y-auto">
          {step === "cart" && (
            <div>
              {cart.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-sm">
                  Your shopping bag is currently empty.
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="premium-card p-3.5 rounded-xl flex items-center gap-3.5"
                    >
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg bg-black"
                      />
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-white line-clamp-1">
                          {item.name}
                        </h4>
                        <span className="text-amber-400 font-black text-sm">
                          ₹{item.price}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-[#050b14] border border-white/10 rounded-lg px-2.5 py-1">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="text-slate-300 hover:text-white"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-white px-1">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="text-slate-300 hover:text-white"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-rose-400 hover:text-rose-300 p-1.5"
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
            <div className="space-y-3.5">
              <input
                type="text"
                placeholder="Full Recipient Name"
                className="w-full premium-input px-4 py-3 rounded-xl text-sm"
                value={address.fullName}
                onChange={(e) =>
                  setAddress({ ...address, fullName: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Contact Mobile Number"
                className="w-full premium-input px-4 py-3 rounded-xl text-sm"
                value={address.phone}
                onChange={(e) =>
                  setAddress({ ...address, phone: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Estate / Street / Gate / Apartment No."
                className="w-full premium-input px-4 py-3 rounded-xl text-sm"
                value={address.line1}
                onChange={(e) =>
                  setAddress({ ...address, line1: e.target.value })
                }
              />
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="City"
                  className="w-1/2 premium-input px-4 py-3 rounded-xl text-sm"
                  value={address.city}
                  onChange={(e) =>
                    setAddress({ ...address, city: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Pincode"
                  className="w-1/2 premium-input px-4 py-3 rounded-xl text-sm"
                  value={address.pincode}
                  onChange={(e) =>
                    setAddress({ ...address, pincode: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-4 py-4">
              <div className="premium-card p-5 rounded-2xl space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total Payable:</span>
                  <span className="text-amber-400 font-black text-lg">
                    ₹{subtotal}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-300 pt-2 border-t border-white/10">
                  <span>Gateway Partner:</span>
                  <span className="font-semibold text-white">
                    Cashfree Payments India
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4" /> 256-Bit Bank Grade
                Encryption
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-10 space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-400/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-400/30">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-white">
                Payment Confirmed
              </h3>
              <p className="text-xs text-slate-300">
                Order Reference: GM-ORD-
                {Math.floor(100000 + Math.random() * 900000)}
              </p>
              <p className="text-xs text-amber-400/90 font-medium">
                Tracking and invoice sent to your registered contact.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {cart.length > 0 && step !== "success" && (
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex justify-between text-sm font-semibold text-white">
              <span>Subtotal:</span>
              <span className="text-amber-400 text-xl font-black">
                ₹{subtotal}
              </span>
            </div>

            {step === "cart" && (
              <button
                onClick={handleProceedToBuy}
                className="w-full py-3.5 rounded-xl gold-gradient-btn flex items-center justify-center gap-2 text-sm"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === "address" && (
              <button
                disabled={!address.fullName || !address.line1}
                onClick={() => setStep("payment")}
                className="w-full py-3.5 rounded-xl gold-gradient-btn disabled:opacity-50 text-sm"
              >
                Proceed to Cashfree Gateway
              </button>
            )}

            {step === "payment" && (
              <button
                onClick={handleCashfreePayment}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg transition"
              >
                <CreditCard className="w-4 h-4" />
                <span>
                  {isProcessing
                    ? "Connecting Cashfree..."
                    : `Authorize ₹${subtotal}`}
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
