import React, { useState, useEffect } from "react";
import { AccountNav } from "./AccountNav";
import { addressService } from "../../services/addressService";
import { useAuth } from "../../context/AuthContext";
import { AuthModal } from "../AuthModal";
import { AddressFormModal } from "./AddressFormModal";
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Zap,
  AlertCircle,
  ShieldCheck,
  Phone,
  Check,
} from "lucide-react";

export const Addresses = () => {
  const { user } = useAuth();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusNotice, setStatusNotice] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Auth enforcement
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const fetchAddresses = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await addressService.getAddresses(user?.id);
      setAddresses(list);
    } catch (e) {
      setError("Failed to retrieve addresses. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  const handleOpenAddModal = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (addr) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setEditingAddress(addr);
    setIsModalOpen(true);
  };

  const handleSaveAddress = async (formData) => {
    if (!user) {
      setIsModalOpen(false);
      setAuthModalOpen(true);
      return;
    }

    setIsSaving(true);
    try {
      const updatedList = await addressService.saveAddress(user.id, formData);
      setAddresses(updatedList);
      setIsModalOpen(false);
      setStatusNotice(
        formData.id ? "Address updated successfully!" : "New address added!",
      );
      setTimeout(() => setStatusNotice(null), 3000);
    } catch (e) {
      setError("Could not save address. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      const updated = await addressService.setDefaultAddress(
        user?.id,
        addressId,
      );
      setAddresses(updated);
      setStatusNotice("Default delivery address updated.");
      setTimeout(() => setStatusNotice(null), 2500);
    } catch (e) {
      setError("Unable to update default address.");
    }
  };

  const handleDelete = async (addressId) => {
    if (
      !window.confirm("Are you sure you want to remove this delivery address?")
    )
      return;
    setDeletingId(addressId);
    try {
      const updated = await addressService.deleteAddress(user?.id, addressId);
      setAddresses(updated);
      setStatusNotice("Address deleted.");
      setTimeout(() => setStatusNotice(null), 2500);
    } catch (e) {
      setError("Unable to delete address.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Delivery Addresses</h1>
          <p className="text-xs text-slate-400">
            Manage your delivery destinations in Pune, Pimpri-Chinchwad, and
            Jodhpur.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="gold-gradient-btn px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 font-bold shadow-lg self-start sm:self-auto active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Address</span>
        </button>
      </div>

      {/* Status Feedback Notice */}
      {statusNotice && (
        <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusNotice}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Account Nav Side Column */}
        <div className="md:col-span-1">
          <AccountNav />
        </div>

        {/* Addresses Grid Column */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="premium-panel p-6 rounded-3xl h-44 animate-pulse bg-white/5"
                />
              ))}
            </div>
          ) : addresses.length === 0 ? (
            <div className="premium-panel p-16 rounded-3xl text-center space-y-4 max-w-md mx-auto">
              <MapPin className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-white">
                No addresses saved
              </h3>
              <p className="text-xs text-slate-400">
                Save an address to unlock fast 30-minute hyper-local checkout.
              </p>
              <button
                onClick={handleOpenAddModal}
                className="gold-gradient-btn px-5 py-2.5 rounded-xl text-xs font-bold"
              >
                Add Your First Address
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addresses.map((addr) => {
                const eligibility = addressService.evaluateDeliveryEligibility(
                  addr.pincode,
                );
                return (
                  <div
                    key={addr.id}
                    className={`premium-panel p-5 rounded-3xl space-y-3.5 border transition relative flex flex-col justify-between ${
                      addr.isDefault
                        ? "border-amber-400/40 shadow-lg shadow-amber-950/30 bg-[#0e1d33]"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {addr.isDefault && (
                            <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3" /> DEFAULT
                            </span>
                          )}
                          {eligibility.isExpress30Min && (
                            <span className="bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />{" "}
                              30-Min Zone
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(addr)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
                            title="Edit Address"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(addr.id)}
                            disabled={deletingId === addr.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Delete Address"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Recipient Details */}
                      <h3 className="text-sm font-bold text-white">
                        {addr.fullName}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1">
                        {addr.line1}, {addr.locality}
                        {addr.landmark ? `, Near ${addr.landmark}` : ""}
                      </p>
                      <p className="text-xs font-semibold text-slate-200">
                        {addr.city}, {addr.state} -{" "}
                        <span className="font-mono text-amber-400">
                          {addr.pincode}
                        </span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>+91 {addr.phone}</span>
                      </p>
                    </div>

                    {/* Bottom Default Selector */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      {!addr.isDefault ? (
                        <button
                          onClick={() => handleSetDefault(addr.id)}
                          className="text-[11px] text-slate-400 hover:text-amber-400 font-semibold"
                        >
                          Set as Default
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-400 font-semibold">
                          Primary Address
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddressFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAddress}
        addressToEdit={editingAddress}
        isSaving={isSaving}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setAuthModalOpen(false);
          setIsModalOpen(true);
        }}
      />
    </div>
  );
};
