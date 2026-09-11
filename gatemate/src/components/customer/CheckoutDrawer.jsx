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
  Banknote,
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

  // Calculation & Execution States
  const [calculatedTotals, setCalculatedTotals] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
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
    "Processing",
    "Confirmed",
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Multi-step Checkout Drawer"
    >
      <div className="w-full max-w-xl bg-[#FEFEFE] border-l border-[#D9E2EA] h-full p-4 sm:p-6 flex flex-col justify-between overflow-y-auto shadow-2xl">
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[#D9E2EA]">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#3C7DDA]">
                GateMate Checkout
              </span>
              <h2 className="text-lg sm:text-xl font-black text-[#173885]">
                Step {currentStep}: {stepLabels[currentStep - 1]}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-[#F4F6FA] text-[#606460] hover:text-[#282926] border border-[#D9E2EA] transition"
              aria-label="Close Checkout"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Progress */}
          {currentStep < 7 && (
            <div className="flex items-center justify-between gap-1 py-3 border-b border-[#D9E2EA] overflow-x-auto scrollbar-none">
              {stepLabels.slice(0, 5).map((label, idx) => {
                const stepNum = idx + 1;
                const isDone = currentStep > stepNum;
                const isCurrent = currentStep === stepNum;
                return (
                  <div key={label} className="flex items-center gap-1 shrink-0">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isDone
                          ? "bg-[#3F7D20] text-[#FEFEFE]"
                          : isCurrent
                            ? "bg-[#173885] text-[#FEFEFE]"
                            : "bg-[#E4EEF3] text-[#6F8A92] border border-[#D9E2EA]"
                      }`}
                    >
                      {isDone ? (
                        <Check className="w-3 h-3 stroke-[3]" />
                      ) : (
                        stepNum
                      )}
                    </div>
                    <span
                      className={`text-[11px] hidden sm:inline font-bold ${
                        isCurrent ? "text-[#173885]" : "text-[#6F8A92]"
                      }`}
                    >
                      {label}
                    </span>
                    {idx < 4 && (
                      <div className="w-2 sm:w-4 h-px bg-[#D9E2EA] mx-1" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dynamic Step Body */}
        <div className="flex-1 py-4 overflow-y-auto space-y-4">
          {/* STEP 1: CART */}
          {currentStep === 1 && (
            <div className="space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <ShoppingBag className="w-12 h-12 text-[#6F8A92] mx-auto" />
                  <p className="text-[#606460] text-xs">
                    Your shopping bag is currently empty.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="gm-card p-3 rounded-2xl flex items-center gap-3"
                  >
                    <img
                      src={item.img}
                      alt={item.name}
                      className="w-14 h-14 object-cover rounded-xl bg-[#F4F6FA] shrink-0 border border-[#D9E2EA]"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-[#3C7DDA] uppercase">
                        {item.category}
                      </span>
                      <h4 className="text-xs font-bold text-[#282926] truncate">
                        {item.name}
                      </h4>
                      <div className="text-[#173885] font-black text-sm mt-0.5 font-mono">
                        ₹{item.price}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-[#F4F6FA] border border-[#D9E2EA] rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-[#606460] hover:text-[#282926]"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-[#282926] px-1">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 flex items-center justify-center text-[#606460] hover:text-[#282926]"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 text-[#B43D20] hover:bg-[#FBE3DE] rounded-lg transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                      aria-label={`Remove ${item.name} from bag`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* STEP 2: ADDRESS */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#282926]">
                  Select Delivery Address
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingAddress(null);
                    setIsAddressModalOpen(true);
                  }}
                  className="text-xs font-bold text-[#3C7DDA] hover:underline"
                >
                  + Add New Address
                </button>
              </div>

              {savedAddresses.length === 0 ? (
                <div className="gm-panel p-6 rounded-2xl text-center space-y-3">
                  <MapPin className="w-8 h-8 text-[#3C7DDA] mx-auto" />
                  <p className="text-xs text-[#606460]">
                    No saved addresses found.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(true)}
                    className="btn-gm-primary px-4 py-2 rounded-xl text-xs font-bold"
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
                        className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start justify-between gap-2.5 ${
                          isSelected
                            ? "bg-[#E4EEF3] border-[#3C7DDA] shadow-xs"
                            : "gm-card hover:border-[#9AAED4]"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center border ${
                              isSelected
                                ? "border-[#3C7DDA] bg-[#3C7DDA]"
                                : "border-[#9AAED4]"
                            }`}
                          >
                            {isSelected && (
                              <div className="w-1.5 h-1.5 rounded-full bg-[#FEFEFE]" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#282926]">
                                {addr.fullName}
                              </span>
                              <span className="text-[10px] text-[#606460]">
                                ({addr.phone})
                              </span>
                            </div>
                            <p className="text-[11px] text-[#606460] mt-0.5">
                              {addr.line1}, {addr.locality}, {addr.city} -{" "}
                              <span className="font-mono font-bold text-[#173885]">
                                {addr.pincode}
                              </span>
                            </p>
                            {zone.isExpress30Min && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#173885] bg-[#E4EEF3] px-2 py-0.5 rounded-full mt-1 border border-[#9AAED4]/40">
                                <Zap className="w-2.5 h-2.5 fill-[#3C7DDA] text-[#3C7DDA]" />{" "}
                                30-Min Zone
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAddress(addr);
                            setIsAddressModalOpen(true);
                          }}
                          className="p-1 text-[#606460] hover:text-[#282926]"
                          aria-label="Edit this address"
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
              <div className="p-3.5 rounded-2xl bg-[#E4EEF3] border border-[#D9E2EA] flex items-center gap-2 text-xs">
                <MapPin className="w-4 h-4 text-[#3C7DDA] shrink-0" />
                <span className="text-[#606460]">
                  Delivering to:{" "}
                  <strong className="text-[#173885]">
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
                      className={`p-4 rounded-2xl border transition ${
                        !isAvailable
                          ? "opacity-40 cursor-not-allowed bg-[#F4F6FA] border-[#D9E2EA]"
                          : isSelected
                            ? "bg-[#E4EEF3] border-[#3C7DDA] shadow-xs cursor-pointer"
                            : "gm-card hover:border-[#9AAED4] cursor-pointer"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-4 h-4 rounded-full mt-1 flex items-center justify-center border ${
                              isSelected
                                ? "border-[#3C7DDA] bg-[#3C7DDA]"
                                : "border-[#9AAED4]"
                            }`}
                          >
                            {isSelected && (
                              <div className="w-1.5 h-1.5 rounded-full bg-[#FEFEFE]" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-[#282926] flex items-center gap-1.5">
                              {opt.name}
                              {isExpress && isAvailable && (
                                <span className="bg-[#173885] text-[#FEFEFE] text-[9px] font-bold px-1.5 py-0.2 rounded">
                                  FASTEST
                                </span>
                              )}
                            </h4>
                            <p className="text-[11px] text-[#606460] mt-0.5">
                              {opt.description}
                            </p>
                            <div className="text-[10px] text-[#3C7DDA] font-semibold mt-1">
                              SLA: {opt.sla} • {opt.cutoffTime}
                            </div>
                          </div>
                        </div>

                        <span className="text-xs font-black text-[#3F7D20] font-mono">
                          {opt.baseFee === 0 ? "FREE" : `₹${opt.baseFee}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: PAYMENT */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-[#282926]">
                Choose Payment Option
              </span>

              <div className="space-y-2.5">
                <div
                  onClick={() =>
                    setPaymentMethod(PAYMENT_METHODS.PAY_ON_DELIVERY)
                  }
                  className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                    paymentMethod === PAYMENT_METHODS.PAY_ON_DELIVERY
                      ? "bg-[#E4EEF3] border-[#3C7DDA] shadow-xs"
                      : "gm-card"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Banknote className="w-5 h-5 text-[#3F7D20] shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-[#282926] flex items-center justify-between">
                        <span>Pay on Delivery (Cash / UPI on Arrival)</span>
                        <span className="text-[10px] text-[#173885] font-bold">
                          +₹49 Convenience
                        </span>
                      </div>
                      <p className="text-[10px] text-[#606460]">
                        Pay safely after inspecting the delivery package.
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setPaymentMethod(PAYMENT_METHODS.UPI_COLLECT)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                    paymentMethod === PAYMENT_METHODS.UPI_COLLECT
                      ? "bg-[#E4EEF3] border-[#3C7DDA] shadow-xs"
                      : "gm-card"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-[#3C7DDA] shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-[#282926] flex items-center justify-between">
                        <span>UPI Collect (GPay, PhonePe, Paytm)</span>
                        <span className="text-[9px] text-[#3F7D20] font-bold">
                          ZERO FEES
                        </span>
                      </div>
                      <p className="text-[10px] text-[#606460]">
                        Direct instant bank transfer via UPI VPA.
                      </p>
                    </div>
                  </div>
                  {paymentMethod === PAYMENT_METHODS.UPI_COLLECT && (
                    <div className="mt-3 pt-3 border-t border-[#D9E2EA]">
                      <input
                        type="text"
                        placeholder="yourname@upi or yourname@okhdfcbank"
                        value={upiIdInput}
                        onChange={(e) => setUpiIdInput(e.target.value)}
                        className="w-full gm-input px-3 py-2 rounded-xl text-xs"
                      />
                    </div>
                  )}
                </div>

                <div
                  onClick={() => setPaymentMethod(PAYMENT_METHODS.CARD)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                    paymentMethod === PAYMENT_METHODS.CARD
                      ? "bg-[#E4EEF3] border-[#3C7DDA] shadow-xs"
                      : "gm-card"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-[#173885] shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-[#282926]">
                        Credit / Debit Card
                      </div>
                      <p className="text-[10px] text-[#606460]">
                        Visa, MasterCard, RuPay (256-bit encrypted).
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {isOnlinePaymentSelected && !onlinePaymentStatus.ready && (
                <div className="p-3.5 rounded-2xl bg-[#FFF0D5] border border-[#A66A08]/20 text-[#A66A08] text-xs flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#A66A08]" />
                  <div className="space-y-0.5">
                    <span className="font-bold">Gateway Notice:</span>
                    <p className="text-[11px] text-[#606460]">
                      Online payments are not configured yet. Select "Pay on
                      Delivery" to complete testing.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: REVIEW */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="gm-panel p-4 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between items-start border-b border-[#D9E2EA] pb-2">
                  <div>
                    <span className="text-[10px] font-bold text-[#3C7DDA] uppercase">
                      Shipping Address
                    </span>
                    <h5 className="font-bold text-[#282926] mt-0.5">
                      {activeAddress?.fullName} ({activeAddress?.phone})
                    </h5>
                    <p className="text-[#606460] text-[11px]">
                      {activeAddress?.line1}, {activeAddress?.locality},{" "}
                      {activeAddress?.city} - {activeAddress?.pincode}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-[#3C7DDA] hover:underline font-bold text-[11px]"
                  >
                    Edit
                  </button>
                </div>

                <div className="flex justify-between items-center pt-1 text-[11px]">
                  <span className="text-[#606460]">Delivery:</span>
                  <span className="font-bold text-[#282926]">
                    {deliveryOptionId === "express_30min"
                      ? "30-Minute Priority Express"
                      : "Standard Delivery"}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#606460]">Payment:</span>
                  <span className="font-bold text-[#173885]">
                    {paymentMethod === PAYMENT_METHODS.PAY_ON_DELIVERY
                      ? "Pay on Delivery"
                      : "Online Gateway"}
                  </span>
                </div>
              </div>

              <div className="gm-panel p-4 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between text-[#606460]">
                  <span>Items Subtotal:</span>
                  <span className="font-bold text-[#282926] font-mono">
                    ₹{calculatedTotals?.itemSubtotal}
                  </span>
                </div>
                <div className="flex justify-between text-[#606460]">
                  <span>Delivery Charges:</span>
                  <span className="text-[#3F7D20] font-bold">
                    {calculatedTotals?.deliveryFee === 0
                      ? "FREE"
                      : `₹${calculatedTotals?.deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-[#606460]">
                  <span>Packaging & Platform Fee:</span>
                  <span className="font-mono text-[#282926]">
                    ₹{calculatedTotals?.packagingFee}
                  </span>
                </div>
                {calculatedTotals?.codConvenienceFee > 0 && (
                  <div className="flex justify-between text-[#606460]">
                    <span>Pay on Delivery Handling Fee:</span>
                    <span className="font-mono text-[#173885]">
                      +₹{calculatedTotals?.codConvenienceFee}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-[#282926] pt-2 border-t border-[#D9E2EA]">
                  <span>Authoritative Total:</span>
                  <span className="text-[#173885] text-base font-mono">
                    ₹{calculatedTotals?.grandTotal}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: PROCESSING */}
          {currentStep === 6 && (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#E4EEF3] border border-[#9AAED4]/40 text-[#173885] flex items-center justify-center mx-auto animate-spin">
                <Zap className="w-7 h-7 fill-current" />
              </div>
              <h3 className="text-base font-bold text-[#173885]">
                Processing Order...
              </h3>
              <p className="text-xs text-[#606460] max-w-sm mx-auto">
                Authorizing inventory reservation with backend order dispatcher.
              </p>

              {submissionError && (
                <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs text-left max-w-md mx-auto space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertCircle className="w-4 h-4 text-[#B43D20] shrink-0" />
                    <span>Order Notice</span>
                  </div>
                  <p className="leading-relaxed">{submissionError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod(PAYMENT_METHODS.PAY_ON_DELIVERY);
                      setCurrentStep(5);
                    }}
                    className="mt-2 w-full btn-gm-primary py-2 rounded-xl text-xs font-bold"
                  >
                    Switch to "Pay on Delivery" & Complete Order
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 7: CONFIRMATION */}
          {currentStep === 7 && confirmedOrder && (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#E1F2D9] text-[#3F7D20] flex items-center justify-center mx-auto border border-[#3F7D20]/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#173885]">
                  Order Confirmed!
                </h3>
                <p className="text-xs text-[#606460] mt-0.5">
                  Order Reference:{" "}
                  <span className="font-mono text-[#3C7DDA] font-bold">
                    {confirmedOrder.orderId}
                  </span>
                </p>
              </div>

              <div className="gm-panel p-4 rounded-2xl text-left text-xs space-y-2 max-w-md mx-auto bg-[#F4F6FA]">
                <div className="flex justify-between">
                  <span className="text-[#606460]">Payment Status:</span>
                  <span className="text-[#A66A08] font-bold font-mono">
                    {confirmedOrder.paymentStatus}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#606460]">Fulfillment Status:</span>
                  <span className="text-[#3F7D20] font-bold">
                    {confirmedOrder.orderStatus}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#606460]">Payable at Arrival:</span>
                  <span className="text-[#282926] font-black font-mono">
                    ₹{confirmedOrder.record?.totals?.grandTotal}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    window.location.href = "/account/orders";
                  }}
                  className="flex-1 btn-gm-primary py-3 rounded-xl text-xs font-bold"
                >
                  Track Order
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    window.location.href = "/products";
                  }}
                  className="flex-1 btn-gm-secondary py-3 rounded-xl text-xs font-bold"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {cart.length > 0 && currentStep < 6 && (
          <div className="pt-3 border-t border-[#D9E2EA] space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#606460]">Total Payable:</span>
              <span className="text-[#173885] text-base font-black font-mono">
                {isCalculating
                  ? "Computing..."
                  : `₹${calculatedTotals?.grandTotal || 0}`}
              </span>
            </div>

            <div className="flex gap-2">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                  className="px-3.5 py-2.5 rounded-xl btn-gm-secondary text-xs font-bold flex items-center gap-1 min-h-[44px]"
                  aria-label="Previous step"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}

              {currentStep === 1 && (
                <button
                  type="button"
                  onClick={handleNextFromCart}
                  className="flex-1 btn-gm-primary min-h-[44px] py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-98"
                >
                  <span>Select Delivery Address</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {currentStep === 2 && (
                <button
                  type="button"
                  disabled={!selectedAddressId}
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 btn-gm-primary min-h-[44px] py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>Choose Delivery Method</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {currentStep === 3 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="flex-1 btn-gm-primary min-h-[44px] py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                >
                  <span>Proceed to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {currentStep === 4 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="flex-1 btn-gm-primary min-h-[44px] py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                >
                  <span>Review Final Order</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {currentStep === 5 && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(6);
                    handlePlaceOrder();
                  }}
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl btn-gm-primary text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:scale-98"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm Order (₹{calculatedTotals?.grandTotal})</span>
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
