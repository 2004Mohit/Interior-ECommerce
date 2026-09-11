import React, { useState, useEffect } from "react";
import { AccountNav } from "./AccountNav";
import { addressService } from "../../services/addressService";
import { useAuth } from "../../context/AuthContext";
import { AddressFormModal } from "./AddressFormModal";
import { AuthModal } from "../AuthModal";
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Zap,
  Lock,
  AlertCircle,
} from "lucide-react";

export const Addresses = () => {
  const { user, loading: authLoading } = useAuth();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const fetchAddresses = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await addressService.getAddresses(user.id);
      setAddresses(data);
    } catch (err) {
      console.error("Error loading addresses", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchAddresses();
    }
  }, [user, authLoading]);

  const handleSave = async (formData) => {
    setIsSaving(true);
    try {
      const updated = await addressService.saveAddress(user.id, formData);
      setAddresses(updated);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save address", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this site address?")) {
      const updated = await addressService.deleteAddress(user.id, id);
      setAddresses(updated);
    }
  };

  const handleSetDefault = async (id) => {
    const updated = await addressService.setDefaultAddress(user.id, id);
    setAddresses(updated);
  };

  if (!authLoading && !user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <h1 className="text-2xl font-black text-[#173885]">
          Delivery Addresses
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <AccountNav />
          </div>
          <div className="md:col-span-3">
            <div className="gm-panel p-12 rounded-3xl text-center space-y-4 max-w-md mx-auto">
              <Lock className="w-10 h-10 text-[#173885] mx-auto" />
              <h2 className="text-lg font-bold text-[#173885]">
                Sign In to Manage Addresses
              </h2>
              <p className="text-xs text-[#606460]">
                Manage construction site locations and offloading points.
              </p>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="btn-gm-primary px-6 py-3 rounded-xl text-xs font-bold"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => setAuthModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div>
          <h1 className="text-2xl font-black text-[#173885]">
            Delivery Addresses
          </h1>
          <p className="text-xs text-[#606460]">
            Saved construction site locations, depot drop points, and contractor
            yards in Pune & PCMC.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingAddress(null);
            setIsModalOpen(true);
          }}
          className="btn-gm-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Site Address</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1">
          <AccountNav />
        </div>

        {/* Addresses Grid */}
        <div className="md:col-span-3 space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="gm-panel p-6 rounded-3xl h-44 animate-pulse bg-[#E4EEF3]"
                />
              ))}
            </div>
          ) : addresses.length === 0 ? (
            <div className="gm-panel p-16 rounded-3xl text-center space-y-4 max-w-md mx-auto">
              <MapPin className="w-12 h-12 text-[#6F8A92] mx-auto" />
              <h3 className="text-lg font-bold text-[#173885]">
                No Site Addresses Saved
              </h3>
              <p className="text-xs text-[#606460] leading-relaxed">
                Add your active construction sites or warehouse locations to
                enable fast checkout.
              </p>
              <button
                onClick={() => {
                  setEditingAddress(null);
                  setIsModalOpen(true);
                }}
                className="btn-gm-primary px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Address</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addresses.map((addr) => {
                const zone = addressService.evaluateDeliveryEligibility(
                  addr.pincode,
                );
                return (
                  <div
                    key={addr.id}
                    className={`gm-card p-5 rounded-3xl space-y-3 flex flex-col justify-between ${
                      addr.isDefault
                        ? "border-[#3C7DDA] ring-1 ring-[#3C7DDA]/40"
                        : ""
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#282926]">
                            {addr.fullName}
                          </span>
                          {addr.isDefault && (
                            <span className="bg-[#173885] text-[#FEFEFE] text-[9px] font-black px-2 py-0.5 rounded-full">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#606460] font-mono">
                          {addr.phone}
                        </span>
                      </div>

                      <p className="text-xs text-[#606460] leading-relaxed">
                        {addr.line1}, {addr.locality}
                        {addr.landmark ? `, Near ${addr.landmark}` : ""},{" "}
                        {addr.city}, {addr.state} -{" "}
                        <strong className="text-[#173885] font-mono">
                          {addr.pincode}
                        </strong>
                      </p>

                      {zone.isExpress30Min && (
                        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#173885] bg-[#E4EEF3] px-2.5 py-0.5 rounded-full border border-[#9AAED4]/40">
                          <Zap className="w-3 h-3 fill-[#3C7DDA] text-[#3C7DDA]" />
                          <span>30-Min Site Priority Zone</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#D9E2EA] flex items-center justify-between text-xs">
                      {!addr.isDefault ? (
                        <button
                          onClick={() => handleSetDefault(addr.id)}
                          className="text-[#3C7DDA] hover:underline font-bold text-[11px]"
                        >
                          Set as Default
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Primary
                          Address
                        </span>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingAddress(addr);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-[#606460] hover:text-[#173885] hover:bg-[#E4EEF3] rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(addr.id)}
                          className="p-1.5 text-[#606460] hover:text-[#B43D20] hover:bg-[#FBE3DE] rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AddressFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        addressToEdit={editingAddress}
        isSaving={isSaving}
      />
    </div>
  );
};
