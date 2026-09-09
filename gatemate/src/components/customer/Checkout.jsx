import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { addressService } from "../../services/addressService";
import { AddressFormModal } from "./AddressFormModal";
import { AuthModal } from "../AuthModal";

export const Checkout = () => {
  const { cart, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Address modal states
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Payment execution states
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  useEffect(() => {
    const loadUserAddresses = async () => {
      setLoadingAddresses(true);
      try {
        const list = await addressService.getAddresses(user?.id);
        setSavedAddresses(list);
        const defaultAddr = list.find((a) => a.isDefault) || list[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        }
      } catch (e) {
        console.error("Error fetching addresses during checkout", e);
      } finally {
        setLoadingAddresses(false);
      }
    };
    loadUserAddresses();
  }, [user]);

  if (cart.length === 0 && !completedOrder) {
    navigate("/cart");
    return null;
  }

  const selectedAddress = savedAddresses.find(
    (a) => a.id === selectedAddressId,
  );
  const deliveryAssessment = selectedAddress
    ? addressService.evaluateDeliveryEligibility(selectedAddress.pincode)
    : null;

  const handleSaveNewAddress = async (formData) => {
    setIsSavingAddress(true);
    try {
      const updated = await addressService.saveAddress(user?.id, formData);
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

  const handleCashfreePay = (e) => {
    e.preventDefault();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!selectedAddress) {
      alert("Please add or select a delivery address to proceed.");
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const orderId = `GM-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      setCompletedOrder({
        id: orderId,
        amount: subtotal,
        recipient: selectedAddress.fullName,
        address: `${selectedAddress.line1}, ${selectedAddress.locality}, ${selectedAddress.city} - ${selectedAddress.pincode}`,
        isExpress: deliveryAssessment?.isExpress30Min,
      });
      clearCart();
    }, 1600);
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
          <div className="p-3 rounded-2xl bg-white/5 text-xs text-slate-300 space-y-1 text-left">
            <div>
              <strong className="text-white">Recipient:</strong>{" "}
              {completedOrder.recipient}
            </div>
            <div>
              <strong className="text-white">Shipping To:</strong>{" "}
              {completedOrder.address}
            </div>
            {completedOrder.isExpress && (
              <div className="text-amber-400 font-bold flex items-center gap-1 pt-1">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Priority 30-Minute Dispatch Initiated</span>
              </div>
            )}
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate("/account/orders")}
              className="flex-1 gold-gradient-btn py-3 rounded-xl text-xs font-bold"
            >
              View Order Tracking
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
        <h1 className="text-2xl font-black text-white">Secure Checkout</h1>
        <p className="text-xs text-slate-400">
          Delivery address selection and Cashfree Payments gateway
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Delivery Address Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="premium-panel p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Select Delivery Address
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditingAddress(null);
                  setIsAddressModalOpen(true);
                }}
                className="gold-gradient-btn px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Address</span>
              </button>
            </div>

            {loadingAddresses ? (
              <div className="h-28 bg-white/5 rounded-2xl animate-pulse" />
            ) : savedAddresses.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <p className="text-xs text-slate-400">No addresses on file.</p>
                <button
                  onClick={() => setIsAddressModalOpen(true)}
                  className="gold-gradient-btn px-4 py-2 rounded-xl text-xs font-bold"
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
                          ? "bg-[#122442] border-amber-400 shadow-md shadow-amber-950/30"
                          : "premium-card hover:border-slate-600"
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
                            <h4 className="text-xs font-bold text-white">
                              {addr.fullName}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({addr.phone})
                            </span>
                            {addr.isDefault && (
                              <span className="text-[9px] bg-amber-400/20 text-amber-300 font-black px-1.5 py-0.2 rounded">
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                            {addr.line1}, {addr.locality}
                            {addr.landmark
                              ? `, Near ${addr.landmark}`
                              : ""}, {addr.city} -{" "}
                            <span className="font-mono text-amber-400">
                              {addr.pincode}
                            </span>
                          </p>
                          {assessment.isExpress30Min && (
                            <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-400/20">
                              <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                              <span>
                                Eligible for 30-Minute Priority Delivery in{" "}
                                {assessment.area}
                              </span>
                            </div>
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
        </div>

        {/* Right Column: Order Summary & Cashfree Payment Button */}
        <div>
          <div className="premium-panel p-6 rounded-3xl space-y-4 sticky top-24">
            <h3 className="text-base font-bold text-white border-b border-white/10 pb-3">
              Payable Summary
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Items Subtotal</span>
                <span className="text-white font-bold">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Delivery (Pune / PCMC)</span>
                <span className="text-emerald-400 font-bold">FREE</span>
              </div>
              <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-white/10">
                <span>Total Amount</span>
                <span className="text-amber-400 text-lg">₹{subtotal}</span>
              </div>
            </div>

            <button
              onClick={handleCashfreePay}
              disabled={isProcessing || !selectedAddress}
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
      </div>

      {/* Address & Auth Modals */}
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
