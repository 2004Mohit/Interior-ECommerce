import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  MapPin,
  Plus,
  Check,
  Zap,
  AlertCircle,
  Edit2,
  Banknote,
  QrCode,
  Building2,
  ShoppingBag,
  ArrowLeft,
  Info,
  Truck,
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
import { AuthModal } from "../AuthModal";
import { SeoHead } from "../common/SeoHead";

export const Checkout = () => {
  const { cart, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const [deliveryOptionId, setDeliveryOptionId] = useState("express_30min");
  const [paymentMethod, setPaymentMethod] = useState(
    PAYMENT_METHODS.PAY_ON_DELIVERY,
  );
  const [upiIdInput, setUpiIdInput] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC");

  const [calculatedTotals, setCalculatedTotals] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      setLoadingAddresses(true);
      addressService.getAddresses(user.id).then((list) => {
        setSavedAddresses(list);
        const defaultAddr = list.find((a) => a.isDefault) || list[0];
        if (defaultAddr && !selectedAddressId) {
          setSelectedAddressId(defaultAddr.id);
        }
        setLoadingAddresses(false);
      });
    } else if (!authLoading && !user) {
      setLoadingAddresses(false);
    }
  }, [user, authLoading, selectedAddressId]);

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
    fetchAuthoritativeTotals();
  }, [fetchAuthoritativeTotals]);

  const handleSaveNewAddress = async (formData) => {
    if (!user) {
      setIsAddressModalOpen(false);
      setAuthModalOpen(true);
      return;
    }

    setIsSavingAddress(true);
    try {
      const updated = await addressService.saveAddress(user.id, formData);
      setSavedAddresses(updated);
      const newlyAdded = formData.id
        ? updated.find((a) => a.id === formData.id)
        : updated[0];
      if (newlyAdded) setSelectedAddressId(newlyAdded.id);
      setIsAddressModalOpen(false);
    } catch (e) {
      console.error("Failed to save address", e);
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (!activeAddress) {
      alert("Please add or select a delivery address to proceed.");
      return;
    }

    setIsProcessing(true);
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
        setIsProcessing(false);
        return;
      }

      setCompletedOrder(result);
      clearCart();
    } catch (err) {
      setSubmissionError("Network error while placing order. Please retry.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.length === 0 && !completedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#E4EEF3] border border-[#D9E2EA] text-[#173885] flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-[#173885]">
          Your Shopping Bag is Empty
        </h2>
        <p className="text-xs text-[#606460]">
          Add products to your cart to proceed with instant checkout.
        </p>
        <Link
          to="/products"
          className="btn-gm-primary inline-block px-6 py-3 rounded-xl text-xs font-bold"
        >
          Explore Products
        </Link>
      </div>
    );
  }

  if (completedOrder) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <SeoHead
          title="Order Confirmed | Ferrado"
          description="Your Ferrado order has been placed successfully."
          noIndex={true}
        />
        <div className="gm-panel p-8 rounded-3xl border border-[#3F7D20]/30 space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#E1F2D9] text-[#3F7D20] flex items-center justify-center mx-auto border border-[#3F7D20]/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-[#173885]">
            Order Confirmed!
          </h2>
          <p className="text-xs text-[#606460]">
            Order Reference:{" "}
            <span className="text-[#3C7DDA] font-bold font-mono">
              {completedOrder.orderId}
            </span>
          </p>

          <div className="p-4 rounded-2xl bg-[#F4F6FA] text-xs text-[#282926] space-y-2 text-left border border-[#D9E2EA]">
            <div className="flex justify-between">
              <span className="text-[#606460]">Payment Status:</span>
              <span className="text-[#A66A08] font-bold font-mono">
                {completedOrder.paymentStatus}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#606460]">Fulfillment Status:</span>
              <span className="text-[#3F7D20] font-bold">
                {completedOrder.orderStatus}
              </span>
            </div>
            <div className="flex justify-between border-t border-[#D9E2EA] pt-2">
              <span className="text-[#606460]">Amount Payable:</span>
              <span className="text-[#173885] font-black font-mono">
                ₹{completedOrder.record?.totals?.grandTotal}
              </span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate("/account/orders")}
              className="flex-1 btn-gm-primary py-3 rounded-xl text-xs font-bold"
            >
              Track Live Order
            </button>
            <button
              onClick={() => navigate("/products")}
              className="flex-1 btn-gm-secondary py-3 rounded-xl text-xs font-bold"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOnlinePaymentSelected =
    paymentMethod !== PAYMENT_METHODS.PAY_ON_DELIVERY;
  const onlinePaymentStatus = paymentService.isPaymentModeReady(paymentMethod);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
      <SeoHead
        title="Secure Checkout | Ferrado"
        description="Complete your order with 30-minute priority delivery in Pune & PCMC."
        noIndex={true}
      />

      <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#173885]">
            Instant Checkout
          </h1>
          <p className="text-xs text-[#606460] mt-0.5">
            Review delivery destination, dispatch SLA, and payment methods in
            Pune & PCMC.
          </p>
        </div>
        <Link
          to="/products"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#3C7DDA] font-bold hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Catalogue</span>
        </Link>
      </div>

      <form
        onSubmit={handlePlaceOrder}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Address Section */}
          <div className="gm-panel p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#3C7DDA]" />
                <h3 className="text-base font-bold text-[#173885]">
                  1. Delivery Address
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingAddress(null);
                  setIsAddressModalOpen(true);
                }}
                className="btn-gm-primary px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Address</span>
              </button>
            </div>

            {loadingAddresses ? (
              <div className="h-28 bg-[#E4EEF3] rounded-2xl animate-pulse" />
            ) : savedAddresses.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <p className="text-xs text-[#606460]">
                  No saved address found on file.
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
              <div className="space-y-3">
                {savedAddresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  const assessment = addressService.evaluateDeliveryEligibility(
                    addr.pincode,
                  );
                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition flex items-start justify-between gap-3 ${
                        isSelected
                          ? "bg-[#E4EEF3] border-[#3C7DDA] shadow-xs"
                          : "gm-card hover:border-[#9AAED4]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
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
                            <h4 className="text-xs font-bold text-[#282926]">
                              {addr.fullName}
                            </h4>
                            <span className="text-[10px] text-[#606460] font-mono">
                              ({addr.phone})
                            </span>
                            {addr.isDefault && (
                              <span className="text-[9px] bg-[#173885] text-[#FEFEFE] font-black px-1.5 py-0.2 rounded">
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#606460] mt-0.5 leading-relaxed">
                            {addr.line1}, {addr.locality}
                            {addr.landmark
                              ? `, Near ${addr.landmark}`
                              : ""}, {addr.city} -{" "}
                            <span className="font-mono text-[#173885] font-bold">
                              {addr.pincode}
                            </span>
                          </p>
                          {assessment.isExpress30Min && (
                            <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-[#173885] bg-[#E4EEF3] px-2 py-0.5 rounded-full border border-[#9AAED4]/40">
                              <Zap className="w-3 h-3 text-[#3C7DDA] fill-[#3C7DDA]" />
                              <span>
                                30-Minute Priority Express Zone in{" "}
                                {assessment.area}
                              </span>
                            </div>
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
                        title="Edit address"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Delivery Option Section */}
          <div className="gm-panel p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 border-b border-[#D9E2EA] pb-3">
              <Truck className="w-5 h-5 text-[#3C7DDA]" />
              <h3 className="text-base font-bold text-[#173885]">
                2. Delivery SLA Option
              </h3>
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
                      <div className="flex items-start gap-3">
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

          {/* 3. Payment Option Section */}
          <div className="gm-panel p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 border-b border-[#D9E2EA] pb-3">
              <CreditCard className="w-5 h-5 text-[#3C7DDA]" />
              <h3 className="text-base font-bold text-[#173885]">
                3. Payment Option
              </h3>
            </div>

            <div className="space-y-3">
              <div
                onClick={() =>
                  setPaymentMethod(PAYMENT_METHODS.PAY_ON_DELIVERY)
                }
                className={`p-4 rounded-2xl border cursor-pointer transition ${
                  paymentMethod === PAYMENT_METHODS.PAY_ON_DELIVERY
                    ? "bg-[#E4EEF3] border-[#3C7DDA] shadow-xs"
                    : "gm-card hover:border-[#9AAED4]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-4 h-4 rounded-full mt-1 flex items-center justify-center border ${
                      paymentMethod === PAYMENT_METHODS.PAY_ON_DELIVERY
                        ? "border-[#3C7DDA] bg-[#3C7DDA]"
                        : "border-[#9AAED4]"
                    }`}
                  >
                    {paymentMethod === PAYMENT_METHODS.PAY_ON_DELIVERY && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FEFEFE]" />
                    )}
                  </div>
                  <Banknote className="w-5 h-5 text-[#3F7D20] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs font-bold text-[#282926] flex items-center justify-between">
                      <span>
                        Pay on Delivery (Cash / UPI on Doorstep Arrival)
                      </span>
                      <span className="text-[10px] text-[#173885] font-bold font-mono">
                        +₹49 Handling
                      </span>
                    </div>
                    <p className="text-[11px] text-[#606460] mt-0.5">
                      Pay safely after inspecting the delivery package at your
                      site.
                    </p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setPaymentMethod(PAYMENT_METHODS.UPI_COLLECT)}
                className={`p-4 rounded-2xl border cursor-pointer transition ${
                  paymentMethod === PAYMENT_METHODS.UPI_COLLECT
                    ? "bg-[#E4EEF3] border-[#3C7DDA] shadow-xs"
                    : "gm-card hover:border-[#9AAED4]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-4 h-4 rounded-full mt-1 flex items-center justify-center border ${
                      paymentMethod === PAYMENT_METHODS.UPI_COLLECT
                        ? "border-[#3C7DDA] bg-[#3C7DDA]"
                        : "border-[#9AAED4]"
                    }`}
                  >
                    {paymentMethod === PAYMENT_METHODS.UPI_COLLECT && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FEFEFE]" />
                    )}
                  </div>
                  <Zap className="w-5 h-5 text-[#3C7DDA] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs font-bold text-[#282926] flex items-center justify-between">
                      <span>UPI Collect (GPay, PhonePe, Paytm, BHIM)</span>
                      <span className="text-[9px] text-[#3F7D20] font-bold">
                        ZERO FEES
                      </span>
                    </div>
                    <p className="text-[11px] text-[#606460] mt-0.5">
                      Direct instant bank transfer via your UPI Virtual Private
                      Address.
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
                      className="w-full gm-input px-3 py-2 rounded-xl text-xs font-mono"
                    />
                  </div>
                )}
              </div>

              <div
                onClick={() => setPaymentMethod(PAYMENT_METHODS.CARD)}
                className={`p-4 rounded-2xl border cursor-pointer transition ${
                  paymentMethod === PAYMENT_METHODS.CARD
                    ? "bg-[#E4EEF3] border-[#3C7DDA] shadow-xs"
                    : "gm-card hover:border-[#9AAED4]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-4 h-4 rounded-full mt-1 flex items-center justify-center border ${
                      paymentMethod === PAYMENT_METHODS.CARD
                        ? "border-[#3C7DDA] bg-[#3C7DDA]"
                        : "border-[#9AAED4]"
                    }`}
                  >
                    {paymentMethod === PAYMENT_METHODS.CARD && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FEFEFE]" />
                    )}
                  </div>
                  <CreditCard className="w-5 h-5 text-[#173885] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs font-bold text-[#282926]">
                      Credit / Debit Card
                    </div>
                    <p className="text-[11px] text-[#606460] mt-0.5">
                      Visa, MasterCard, RuPay, Diners (256-bit encrypted
                      checkout).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {isOnlinePaymentSelected && !onlinePaymentStatus.ready && (
              <div className="p-3.5 rounded-2xl bg-[#FFF0D5] border border-[#A66A08]/20 text-[#A66A08] text-xs flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#A66A08]" />
                <div className="space-y-0.5">
                  <span className="font-bold">Gateway Integration Notice:</span>
                  <p className="text-[11px] text-[#606460] leading-relaxed">
                    Online payments are not configured yet. Please select "Pay
                    on Delivery" to proceed with placing this order.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div>
          <div className="gm-panel p-6 rounded-3xl space-y-4 sticky top-24">
            <h3 className="text-base font-bold text-[#173885] border-b border-[#D9E2EA] pb-3">
              Payable Summary
            </h3>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#F4F6FA] p-2.5 rounded-xl flex items-center justify-between text-xs border border-[#D9E2EA]"
                >
                  <div className="flex items-center gap-2 truncate max-w-[180px]">
                    <img
                      src={item.img}
                      alt=""
                      className="w-8 h-8 rounded object-cover"
                    />
                    <span className="text-[#282926] font-bold truncate">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-[#173885] font-bold font-mono">
                    Qty {item.quantity} × ₹{item.price}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-xs pt-2 border-t border-[#D9E2EA]">
              <div className="flex justify-between text-[#606460]">
                <span>Products Subtotal:</span>
                <span className="text-[#282926] font-bold font-mono">
                  ₹{calculatedTotals?.itemSubtotal}
                </span>
              </div>
              <div className="flex justify-between text-[#606460]">
                <span>Delivery SLA Charges:</span>
                <span className="text-[#3F7D20] font-bold">
                  {calculatedTotals?.deliveryFee === 0
                    ? "FREE"
                    : `₹${calculatedTotals?.deliveryFee}`}
                </span>
              </div>
              <div className="flex justify-between text-[#606460]">
                <span>Custom Packaging & Platform Fee:</span>
                <span className="text-[#282926] font-mono">
                  ₹{calculatedTotals?.packagingFee}
                </span>
              </div>
              {calculatedTotals?.codConvenienceFee > 0 && (
                <div className="flex justify-between text-[#606460]">
                  <span>Pay on Delivery Handling:</span>
                  <span className="text-[#173885] font-mono font-bold">
                    +₹{calculatedTotals?.codConvenienceFee}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-[#282926] pt-2 border-t border-[#D9E2EA]">
                <span>Total Amount:</span>
                <span className="text-[#173885] text-lg font-mono">
                  ₹{calculatedTotals?.grandTotal}
                </span>
              </div>
            </div>

            {submissionError && (
              <div className="p-3 rounded-xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-[#B43D20] shrink-0" />
                  <span>Notice</span>
                </div>
                <p className="text-[11px] leading-relaxed">{submissionError}</p>
                <button
                  type="button"
                  onClick={() =>
                    setPaymentMethod(PAYMENT_METHODS.PAY_ON_DELIVERY)
                  }
                  className="w-full btn-gm-primary py-1.5 rounded-lg text-[11px] font-bold mt-1"
                >
                  Switch to Pay on Delivery
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing || isCalculating || !activeAddress}
              className="w-full py-3.5 rounded-xl btn-gm-primary font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-98 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {isProcessing
                  ? "Placing Order..."
                  : isCalculating
                    ? "Calculating..."
                    : `Confirm & Place Order (₹${calculatedTotals?.grandTotal || 0})`}
              </span>
            </button>
          </div>
        </div>
      </form>

      <AddressFormModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={handleSaveNewAddress}
        addressToEdit={editingAddress}
        isSaving={isSavingAddress}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setAuthModalOpen(false)}
      />
    </div>
  );
};
