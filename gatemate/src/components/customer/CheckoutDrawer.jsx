import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Zap,
  ShieldCheck,
  CreditCard,
  QrCode,
  Banknote,
  Building2,
  AlertCircle,
  ShoppingBag,
  Check,
  Edit2,
  Info,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { addressService } from "../../services/addressService";
import {
  orderService,
  PAYMENT_METHODS,
  DELIVERY_OPTIONS,
} from "../../services/orderService";
import { paymentService } from "../../services/payment/paymentService";
import { AddressFormModal } from "./AddressFormModal";

export const CheckoutDrawer = ({ isOpen, onClose, onRequireAuth }) => {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);

  // Address State
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Delivery Method State
  const [deliveryOptionId, setDeliveryOptionId] = useState("express_30min");

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState(
    PAYMENT_METHODS.PAY_ON_DELIVERY,
  );
  const [upiIdInput, setUpiIdInput] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC");

  // Authoritative Calculation State
  const [calculatedTotals, setCalculatedTotals] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Order Placement & Gateway Execution
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  useEffect(() => {
    if (isOpen && user) {
      addressService.getAddresses(user.id).then((list) => {
        setSavedAddresses(list);
        const def = list.find((a) => a.isDefault) || list[0];
        if (def && !selectedAddressId) setSelectedAddressId(def.id);
      });
    }
  }, [isOpen, user, selectedAddressId]);

  const activeAddress = savedAddresses.find((a) => a.id === selectedAddressId);

  const fetchAuthoritativeTotals = useCallback(async () => {
    if (cart.length === 0) return;
    setIsCalculating(true);
    try {
      const totals = await orderService.calculateCheckoutTotals({
        items: cart,
        address: activeAddress,
        deliveryOptionId,
        paymentMethod,
      });
      setCalculatedTotals(totals);

      if (deliveryOptionId === "express_30min" && !totals.isExpressEligible) {
        setDeliveryOptionId("standard_scheduled");
      }
    } catch (e) {
      console.error("Calculation error", e);
    } finally {
      setIsCalculating(false);
    }
  }, [cart, activeAddress, deliveryOptionId, paymentMethod]);

  useEffect(() => {
    if (isOpen) {
      fetchAuthoritativeTotals();
    }
  }, [isOpen, fetchAuthoritativeTotals]);

  if (!isOpen) return null;

  const handleNextFromCart = () => {
    if (!user) {
      onRequireAuth();
      return;
    }
    setCurrentStep(2);
  };

  const handleSaveAddress = async (formData) => {
    setIsSavingAddress(true);
    try {
      const updated = await addressService.saveAddress(user?.id, formData);
      setSavedAddresses(updated);
      const chosen = formData.id
        ? updated.find((a) => a.id === formData.id)
        : updated[0];
      if (chosen) setSelectedAddressId(chosen.id);
      setIsAddressModalOpen(false);
    } catch (e) {
      console.error("Failed to save address", e);
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const result = await orderService.placeOrder({
        items: cart,
        address: activeAddress,
        deliveryOptionId,
        paymentMethod,
        totals: calculatedTotals,
        user,
      });

      if (!result.success) {
        setSubmissionError(result.message);
        setIsSubmitting(false);
        return;
      }

      setConfirmedOrder(result);
      clearCart();
      setCurrentStep(7);
    } catch (e) {
      setSubmissionError("Network error while processing order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOnlinePaymentSelected =
    paymentMethod !== PAYMENT_METHODS.PAY_ON_DELIVERY;
  const onlinePaymentStatus = paymentService.isPaymentModeReady(paymentMethod);

  const stepLabels = [
    "Cart",
    "Address",
    "Delivery",
    "Payment",
    "Review",
    "Place Order",
    "Confirmed",
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-[#070e1a] border-l border-white/10 h-full p-5 sm:p-7 flex flex-col justify-between overflow-y-auto shadow-2xl">
        {/* Top Header & Step Indicator */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                GateMate Multi-Step Checkout
              </span>
              <h2 className="text-xl font-black text-white">
                Step {currentStep}: {stepLabels[currentStep - 1]}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#0c182b] text-slate-400 hover:text-white border border-white/5 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {currentStep < 7 && (
            <div className="flex items-center justify-between gap-1 py-3 border-b border-white/5 overflow-x-auto">
              {stepLabels.slice(0, 6).map((label, idx) => {
                const stepNum = idx + 1;
                const isDone = currentStep > stepNum;
                const isCurrent = currentStep === stepNum;
                return (
                  <div key={label} className="flex items-center gap-1 shrink-0">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isDone
                          ? "bg-emerald-500 text-slate-950"
                          : isCurrent
                            ? "bg-amber-400 text-slate-950 font-black"
                            : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {isDone ? <Check className="w-3.5 h-3.5" /> : stepNum}
                    </div>
                    <span
                      className={`text-[11px] hidden sm:inline font-semibold ${
                        isCurrent ? "text-amber-400" : "text-slate-400"
                      }`}
                    >
                      {label}
                    </span>
                    {idx < 5 && (
                      <div className="w-3 h-px bg-white/10 mx-1 hidden sm:block" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Step Body Content */}
        <div className="flex-1 py-4 overflow-y-auto space-y-4">
          {/* STEP 1: CART */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
                  <p className="text-slate-400 text-xs">
                    Your shopping cart is currently empty.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="premium-card p-3.5 rounded-2xl flex items-center gap-3.5"
                    >
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-xl bg-black shrink-0"
                      />
                      <div className="flex-1">
                        <span className="text-[10px] font-bold text-amber-400 uppercase">
                          {item.category}
                        </span>
                        <h4 className="text-xs font-bold text-white line-clamp-1">
                          {item.name}
                        </h4>
                        <div className="text-amber-400 font-black text-sm mt-0.5">
                          ₹{item.price}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-[#050b14] border border-white/10 rounded-lg px-2 py-1">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="text-slate-400 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-white px-1.5">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="text-slate-400 hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
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

          {/* STEP 2: ADDRESS */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300">
                  Deliver To
                </span>
                <button
                  onClick={() => {
                    setEditingAddress(null);
                    setIsAddressModalOpen(true);
                  }}
                  className="text-xs font-bold text-amber-400 hover:underline"
                >
                  + Add New Address
                </button>
              </div>

              {savedAddresses.length === 0 ? (
                <div className="premium-card p-8 rounded-2xl text-center space-y-3">
                  <MapPin className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-xs text-slate-300">
                    No saved addresses found.
                  </p>
                  <button
                    onClick={() => setIsAddressModalOpen(true)}
                    className="gold-gradient-btn px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Add Delivery Address
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {savedAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    const zone = addressService.evaluateDeliveryEligibility(
                      addr.pincode,
                    );
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start justify-between gap-3 ${
                          isSelected
                            ? "bg-[#122442] border-amber-400 shadow-md"
                            : "premium-card"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center border ${
                              isSelected
                                ? "border-amber-400 bg-amber-400"
                                : "border-slate-500"
                            }`}
                          >
                            {isSelected && (
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">
                                {addr.fullName}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ({addr.phone})
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 mt-0.5">
                              {addr.line1}, {addr.locality}, {addr.city} -{" "}
                              <span className="font-mono text-amber-400">
                                {addr.pincode}
                              </span>
                            </p>
                            {zone.isExpress30Min && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-sky-300 bg-sky-500/10 px-2 py-0.2 rounded-full mt-1 border border-sky-400/20">
                                <Zap className="w-2.5 h-2.5 fill-current text-amber-400" />
                                30-Min Priority Eligible in {zone.area}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAddress(addr);
                            setIsAddressModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: DELIVERY */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#0a1526] border border-white/10 flex items-center gap-2 text-xs">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-slate-300">
                  Delivering to:{" "}
                  <strong className="text-white">
                    {activeAddress?.locality}, {activeAddress?.city} (
                    {activeAddress?.pincode})
                  </strong>
                </span>
              </div>

              <div className="space-y-3">
                {DELIVERY_OPTIONS.map((opt) => {
                  const isExpress = opt.id === "express_30min";
                  const isAvailable =
                    !isExpress || calculatedTotals?.isExpressEligible;
                  const isSelected = deliveryOptionId === opt.id;

                  return (
                    <div
                      key={opt.id}
                      onClick={() => isAvailable && setDeliveryOptionId(opt.id)}
                      className={`p-4 rounded-2xl border transition relative ${
                        !isAvailable
                          ? "opacity-40 cursor-not-allowed bg-slate-900/40 border-white/5"
                          : isSelected
                            ? "bg-[#122442] border-amber-400 shadow-md cursor-pointer"
                            : "premium-card hover:border-slate-600 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-4 h-4 rounded-full mt-1 flex items-center justify-center border ${
                              isSelected
                                ? "border-amber-400 bg-amber-400"
                                : "border-slate-500"
                            }`}
                          >
                            {isSelected && (
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                              {opt.name}
                              {isExpress && isAvailable && (
                                <span className="bg-amber-400/20 text-amber-300 text-[9px] font-black px-1.5 py-0.2 rounded">
                                  FASTEST
                                </span>
                              )}
                            </h4>
                            <p className="text-[11px] text-slate-300 mt-0.5">
                              {opt.description}
                            </p>
                            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                              <span>
                                Estimated SLA:{" "}
                                <strong className="text-emerald-400">
                                  {opt.sla}
                                </strong>
                              </span>
                              <span>• {opt.cutoffTime}</span>
                            </div>
                          </div>
                        </div>

                        <span className="text-xs font-black text-emerald-400">
                          {opt.baseFee === 0 ? "FREE" : `₹${opt.baseFee}`}
                        </span>
                      </div>

                      {!isAvailable && (
                        <div className="mt-2 text-[10px] text-rose-300 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>
                            30-minute priority dispatch is restricted to
                            Pune/PCMC verified zones.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: PAYMENT SELECTION */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-300">
                Choose Payment Method
              </span>

              <div className="space-y-2.5">
                {/* Pay on Delivery */}
                <div
                  onClick={() =>
                    setPaymentMethod(PAYMENT_METHODS.PAY_ON_DELIVERY)
                  }
                  className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                    paymentMethod === PAYMENT_METHODS.PAY_ON_DELIVERY
                      ? "bg-[#122442] border-amber-400 shadow-md"
                      : "premium-card"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Banknote className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span>Pay on Delivery (Cash / UPI at Doorstep)</span>
                        <span className="text-[10px] text-amber-400 font-bold">
                          +₹49 Convenience
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Pay safely after inspecting the delivery package.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cashfree UPI */}
                <div
                  onClick={() => setPaymentMethod(PAYMENT_METHODS.UPI_COLLECT)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                    paymentMethod === PAYMENT_METHODS.UPI_COLLECT
                      ? "bg-[#122442] border-amber-400 shadow-md"
                      : "premium-card"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-amber-400 shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span>UPI Collect (GPay, PhonePe, Paytm, BHIM)</span>
                        <span className="text-[9px] text-emerald-400 font-bold">
                          ZERO FEES
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Direct instant bank transfer via UPI VPA.
                      </p>
                    </div>
                  </div>
                  {paymentMethod === PAYMENT_METHODS.UPI_COLLECT && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <input
                        type="text"
                        placeholder="yourname@upi or yourname@okhdfcbank"
                        value={upiIdInput}
                        onChange={(e) => setUpiIdInput(e.target.value)}
                        className="w-full premium-input px-3 py-2 rounded-xl text-xs"
                      />
                    </div>
                  )}
                </div>

                {/* Dynamic QR */}
                <div
                  onClick={() => setPaymentMethod(PAYMENT_METHODS.UPI_QR)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                    paymentMethod === PAYMENT_METHODS.UPI_QR
                      ? "bg-[#122442] border-amber-400 shadow-md"
                      : "premium-card"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <QrCode className="w-5 h-5 text-sky-400 shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white">
                        Dynamic UPI QR Code
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Scan using any UPI camera scanner.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cards */}
                <div
                  onClick={() => setPaymentMethod(PAYMENT_METHODS.CARD)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                    paymentMethod === PAYMENT_METHODS.CARD
                      ? "bg-[#122442] border-amber-400 shadow-md"
                      : "premium-card"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-purple-400 shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white">
                        Credit / Debit Card
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Visa, MasterCard, RuPay (256-bit encrypted).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Net Banking */}
                <div
                  onClick={() => setPaymentMethod(PAYMENT_METHODS.NET_BANKING)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                    paymentMethod === PAYMENT_METHODS.NET_BANKING
                      ? "bg-[#122442] border-amber-400 shadow-md"
                      : "premium-card"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-amber-400 shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white">
                        Net Banking
                      </div>
                      <p className="text-[10px] text-slate-400">
                        All major Indian scheduled banks.
                      </p>
                    </div>
                  </div>
                  {paymentMethod === PAYMENT_METHODS.NET_BANKING && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full premium-input px-3 py-2 rounded-xl text-xs font-semibold"
                      >
                        <option value="HDFC">HDFC Bank</option>
                        <option value="ICICI">ICICI Bank</option>
                        <option value="SBI">State Bank of India</option>
                        <option value="AXIS">Axis Bank</option>
                        <option value="KOTAK">Kotak Mahindra Bank</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Informational notice when digital gateway mode is chosen */}
              {isOnlinePaymentSelected && !onlinePaymentStatus.ready && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div className="space-y-0.5">
                    <span className="font-bold">
                      Gateway Integration Notice:
                    </span>
                    <p className="text-[11px] text-slate-300">
                      Online payments are not configured yet. Pay on Delivery is
                      available for immediate checkout testing.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: REVIEW */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="premium-panel p-4 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between items-start border-b border-white/5 pb-2">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase">
                      Shipping Destination
                    </span>
                    <h5 className="font-bold text-white mt-0.5">
                      {activeAddress?.fullName} ({activeAddress?.phone})
                    </h5>
                    <p className="text-slate-300 text-[11px]">
                      {activeAddress?.line1}, {activeAddress?.locality},{" "}
                      {activeAddress?.city} - {activeAddress?.pincode}
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="text-amber-400 hover:underline font-bold text-[11px]"
                  >
                    Edit
                  </button>
                </div>

                <div className="flex justify-between items-center pt-1 text-[11px]">
                  <span className="text-slate-400">Dispatch Service:</span>
                  <span className="font-semibold text-white">
                    {deliveryOptionId === "express_30min"
                      ? "⚡ 30-Minute Priority Express"
                      : "Standard 24-48h Delivery"}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Payment Selection:</span>
                  <span className="font-semibold text-amber-300">
                    {paymentMethod === PAYMENT_METHODS.PAY_ON_DELIVERY
                      ? "Pay on Delivery"
                      : "Online Gateway"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300">
                  Items ({cart.length})
                </span>
                <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="premium-card p-2.5 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate max-w-xs">
                        <img
                          src={item.img}
                          alt=""
                          className="w-8 h-8 rounded object-cover"
                        />
                        <span className="text-white truncate">{item.name}</span>
                      </div>
                      <span className="text-amber-300 font-bold font-mono">
                        Qty {item.quantity} × ₹{item.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="premium-panel p-4 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Cart Subtotal:</span>
                  <span className="font-bold text-white font-mono">
                    ₹{calculatedTotals?.itemSubtotal}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Delivery Charges:</span>
                  <span className="text-emerald-400 font-bold">
                    {calculatedTotals?.deliveryFee === 0
                      ? "FREE"
                      : `₹${calculatedTotals?.deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Packaging & Platform Fee:</span>
                  <span className="font-mono text-white">
                    ₹{calculatedTotals?.packagingFee}
                  </span>
                </div>
                {calculatedTotals?.codConvenienceFee > 0 && (
                  <div className="flex justify-between text-slate-300">
                    <span>Pay on Delivery Handling Fee:</span>
                    <span className="font-mono text-amber-400">
                      +₹{calculatedTotals?.codConvenienceFee}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-white/10">
                  <span>Authoritative Total:</span>
                  <span className="text-amber-400 text-base font-mono">
                    ₹{calculatedTotals?.grandTotal}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: PLACE ORDER */}
          {currentStep === 6 && (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto animate-spin">
                <Zap className="w-7 h-7 fill-current" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Processing Order Request...
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Authorizing inventory reservation with backend order dispatcher.
              </p>

              {submissionError && (
                <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-left max-w-md mx-auto space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Gateway Integration Notice</span>
                  </div>
                  <p className="leading-relaxed">{submissionError}</p>
                  <button
                    onClick={() => {
                      setPaymentMethod(PAYMENT_METHODS.PAY_ON_DELIVERY);
                      setCurrentStep(5);
                    }}
                    className="mt-2 w-full gold-gradient-btn py-2 rounded-xl text-xs font-bold"
                  >
                    Switch to "Pay on Delivery" & Complete Order
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 7: CONFIRMATION */}
          {currentStep === 7 && confirmedOrder && (
            <div className="py-8 text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">
                  Order Confirmed!
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Order Reference:{" "}
                  <span className="font-mono text-amber-400 font-bold">
                    {confirmedOrder.orderId}
                  </span>
                </p>
              </div>

              <div className="premium-panel p-4 rounded-2xl text-left text-xs space-y-2 border border-white/10 max-w-md mx-auto">
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Status:</span>
                  <span className="text-amber-400 font-bold font-mono">
                    {confirmedOrder.paymentStatus}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Order Fulfillment:</span>
                  <span className="text-emerald-400 font-bold">
                    {confirmedOrder.orderStatus}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payable at Delivery:</span>
                  <span className="text-white font-black font-mono">
                    ₹{confirmedOrder.record?.totals?.grandTotal}
                  </span>
                </div>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <button
                  onClick={() => {
                    onClose();
                    window.location.href = "/account/orders";
                  }}
                  className="flex-1 gold-gradient-btn py-3 rounded-xl text-xs font-bold"
                >
                  Track Order
                </button>
                <button
                  onClick={() => {
                    onClose();
                    window.location.href = "/products";
                  }}
                  className="flex-1 premium-card hover:bg-white/5 py-3 rounded-xl text-xs font-bold text-white border border-white/10"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        {cart.length > 0 && currentStep < 6 && (
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Total Payable:</span>
              <span className="text-amber-400 text-lg font-black font-mono">
                {isCalculating
                  ? "Computing..."
                  : `₹${calculatedTotals?.grandTotal || 0}`}
              </span>
            </div>

            <div className="flex gap-3">
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                  className="px-4 py-3 rounded-xl premium-card hover:bg-white/5 text-slate-300 font-bold text-xs flex items-center gap-1 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}

              {currentStep === 1 && (
                <button
                  onClick={handleNextFromCart}
                  className="flex-1 gold-gradient-btn py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-98 transition"
                >
                  <span>Select Delivery Address</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {currentStep === 2 && (
                <button
                  disabled={!selectedAddressId}
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 gold-gradient-btn py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition"
                >
                  <span>Choose Delivery Method</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {currentStep === 3 && (
                <button
                  onClick={() => setCurrentStep(4)}
                  className="flex-1 gold-gradient-btn py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <span>Proceed to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {currentStep === 4 && (
                <button
                  onClick={() => setCurrentStep(5)}
                  className="flex-1 gold-gradient-btn py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <span>Review Final Order</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {currentStep === 5 && (
                <button
                  onClick={() => {
                    setCurrentStep(6);
                    handlePlaceOrder();
                  }}
                  className="flex-1 py-3.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-98"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Place Order (₹{calculatedTotals?.grandTotal})</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <AddressFormModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={handleSaveAddress}
        addressToEdit={editingAddress}
        isSaving={isSavingAddress}
      />
    </div>
  );
};
