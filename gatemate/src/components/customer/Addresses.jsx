import React, { useState, useEffect, useCallback } from "react";
import { AccountNav } from "./AccountNav";
import { supabase } from "../../lib/supabaseClient";
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
  Loader2,
} from "lucide-react";

const normalizeAddress = (row) => ({
  id: row.id,
  fullName: row.recipient_name || "",
  phone: row.phone || "",
  line1: row.address_line1 || "",
  locality: row.locality || "",
  landmark: row.landmark || "",
  city: row.city || "Pune",
  state: row.state || "Maharashtra",
  pincode: row.pincode || "",
  addressType: row.address_type || "SITE",
  isDefault: Boolean(row.is_default),
  createdAt: row.created_at || null,
  updatedAt: row.updated_at || null,
});

export const Addresses = () => {
  const { user, loading: authLoading } = useAuth();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [pageError, setPageError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const clearMessages = () => {
    setPageError("");
    setSuccessMessage("");
  };

  const fetchAddresses = useCallback(async () => {
    if (!user?.id) {
      setAddresses([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setPageError("");

      const { data, error } = await supabase
        .from("customer_addresses")
        .select(
          `
            id,
            user_id,
            recipient_name,
            phone,
            address_line1,
            locality,
            city,
            state,
            pincode,
            landmark,
            address_type,
            is_default,
            created_at,
            updated_at
          `,
        )
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setAddresses((data || []).map(normalizeAddress));
    } catch (error) {
      console.error("Failed to load customer addresses:", error);

      setPageError(
        error?.message ||
          "Unable to load your saved addresses. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading) {
      fetchAddresses();
    }
  }, [authLoading, fetchAddresses]);

  const handleSave = async (formData) => {
    if (!user?.id) {
      setPageError("You must be signed in to manage addresses.");
      return;
    }

    try {
      setIsSaving(true);
      clearMessages();

      const cleanPhone = String(formData.phone || "")
        .replace(/\D/g, "")
        .slice(0, 10);

      const cleanPincode = String(formData.pincode || "")
        .replace(/\D/g, "")
        .slice(0, 6);

      const recipientName = String(formData.fullName || "").trim();
      const addressLine1 = String(formData.line1 || "").trim();
      const locality = String(formData.locality || "").trim();
      const city = String(formData.city || "Pune").trim();
      const state = String(formData.state || "Maharashtra").trim();
      const landmark = String(formData.landmark || "").trim();

      if (!recipientName) {
        throw new Error("Please enter the contact name or site engineer name.");
      }

      if (!/^\d{10}$/.test(cleanPhone)) {
        throw new Error("Please enter a valid 10-digit mobile number.");
      }

      if (!addressLine1) {
        throw new Error("Please enter the site address.");
      }

      if (!locality) {
        throw new Error("Please enter the locality.");
      }

      if (!/^\d{6}$/.test(cleanPincode)) {
        throw new Error("Please enter a valid 6-digit pincode.");
      }

      /*
       * If this address is being made default, first remove the
       * default flag from the user's other addresses.
       */
      if (formData.isDefault) {
        const { error: clearDefaultError } = await supabase
          .from("customer_addresses")
          .update({
            is_default: false,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("is_default", true);

        if (clearDefaultError) {
          throw clearDefaultError;
        }
      }

      const payload = {
        user_id: user.id,
        recipient_name: recipientName,
        phone: cleanPhone,
        address_line1: addressLine1,
        locality,
        city,
        state,
        pincode: cleanPincode,
        landmark: landmark || null,
        address_type: formData.addressType || "SITE",
        is_default: Boolean(formData.isDefault),
        updated_at: new Date().toISOString(),
      };

      let savedAddress;

      if (formData.id) {
        const { data, error } = await supabase
          .from("customer_addresses")
          .update(payload)
          .eq("id", formData.id)
          .eq("user_id", user.id)
          .select(
            `
              id,
              user_id,
              recipient_name,
              phone,
              address_line1,
              locality,
              city,
              state,
              pincode,
              landmark,
              address_type,
              is_default,
              created_at,
              updated_at
            `,
          )
          .single();

        if (error) {
          throw error;
        }

        savedAddress = data;
      } else {
        /*
         * If this is the first address, automatically make it default.
         */
        const shouldBeDefault =
          addresses.length === 0 ? true : Boolean(formData.isDefault);

        const { data, error } = await supabase
          .from("customer_addresses")
          .insert({
            ...payload,
            is_default: shouldBeDefault,
          })
          .select(
            `
              id,
              user_id,
              recipient_name,
              phone,
              address_line1,
              locality,
              city,
              state,
              pincode,
              landmark,
              address_type,
              is_default,
              created_at,
              updated_at
            `,
          )
          .single();

        if (error) {
          throw error;
        }

        savedAddress = data;
      }

      /*
       * If the inserted/updated address is the default one,
       * ensure every other address is explicitly non-default.
       */
      if (savedAddress?.is_default) {
        const { error: clearOthersError } = await supabase
          .from("customer_addresses")
          .update({
            is_default: false,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .neq("id", savedAddress.id)
          .eq("is_default", true);

        if (clearOthersError) {
          throw clearOthersError;
        }

        /*
         * Re-assert the saved address as default in case
         * the previous update affected ordering/state.
         */
        const { error: restoreDefaultError } = await supabase
          .from("customer_addresses")
          .update({
            is_default: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", savedAddress.id)
          .eq("user_id", user.id);

        if (restoreDefaultError) {
          throw restoreDefaultError;
        }
      }

      setIsModalOpen(false);
      setEditingAddress(null);

      setSuccessMessage(
        formData.id
          ? "Delivery address updated successfully."
          : "Delivery address added successfully.",
      );

      await fetchAddresses();
    } catch (error) {
      console.error("Failed to save customer address:", error);

      setPageError(
        error?.message ||
          "Unable to save this address. Please check the details and try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!user?.id || !id) return;

    const address = addresses.find((item) => item.id === id);

    const confirmed = window.confirm(
      address?.isDefault
        ? "This is your default address. Are you sure you want to remove it?"
        : "Are you sure you want to remove this site address?",
    );

    if (!confirmed) return;

    try {
      setActionLoading(id);
      clearMessages();

      const { error } = await supabase
        .from("customer_addresses")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      /*
       * If the deleted address was the default and other
       * addresses remain, promote the first remaining address.
       */
      if (address?.isDefault) {
        const { data: remaining, error: remainingError } = await supabase
          .from("customer_addresses")
          .select("id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })
          .limit(1);

        if (remainingError) {
          throw remainingError;
        }

        if (remaining?.[0]?.id) {
          const { error: promoteError } = await supabase
            .from("customer_addresses")
            .update({
              is_default: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", remaining[0].id)
            .eq("user_id", user.id);

          if (promoteError) {
            throw promoteError;
          }
        }
      }

      setSuccessMessage("Delivery address removed successfully.");

      await fetchAddresses();
    } catch (error) {
      console.error("Failed to delete address:", error);

      setPageError(
        error?.message || "Unable to remove this address. Please try again.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetDefault = async (id) => {
    if (!user?.id || !id) return;

    try {
      setActionLoading(id);
      clearMessages();

      /*
       * Remove default from every address belonging
       * to this customer.
       */
      const { error: clearError } = await supabase
        .from("customer_addresses")
        .update({
          is_default: false,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("is_default", true);

      if (clearError) {
        throw clearError;
      }

      /*
       * Make the selected address default.
       */
      const { error: setError } = await supabase
        .from("customer_addresses")
        .update({
          is_default: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (setError) {
        throw setError;
      }

      setSuccessMessage("Default delivery address updated.");

      await fetchAddresses();
    } catch (error) {
      console.error("Failed to set default address:", error);

      setPageError(
        error?.message ||
          "Unable to update the default address. Please try again.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const openAddModal = () => {
    clearMessages();
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const openEditModal = (address) => {
    clearMessages();
    setEditingAddress(address);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;

    setIsModalOpen(false);
    setEditingAddress(null);
  };

  if (!authLoading && !user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <h1 className="text-2xl font-black text-[#173885]">
          Delivery Addresses
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          <div className="md:col-span-1">
            <AccountNav />
          </div>

          <div className="md:col-span-3">
            <div className="gm-panel p-12 rounded-3xl text-center space-y-4 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-[#E4EEF3] text-[#173885] flex items-center justify-center mx-auto border border-[#D9E2EA]">
                <Lock className="w-7 h-7" />
              </div>

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
          onClick={openAddModal}
          className="btn-gm-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Site Address</span>
        </button>
      </div>

      {/* Messages */}
      {pageError && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-[#FBE3DE] border border-[#E7B7AA] text-[#9D3A25]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />

          <p className="text-[11px] leading-relaxed">{pageError}</p>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[#E5F3EA] border border-[#B8DCC6] text-[#3C7D5A]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />

          <p className="text-[11px] font-medium">{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1">
          <AccountNav />
        </div>

        {/* Addresses */}
        <div className="md:col-span-3 space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="gm-panel p-6 rounded-3xl h-52 animate-pulse bg-[#E4EEF3]"
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
                enable faster checkout.
              </p>

              <button
                onClick={openAddModal}
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

                const isActionLoading = actionLoading === addr.id;

                return (
                  <div
                    key={addr.id}
                    className={`gm-card p-5 rounded-3xl space-y-3 flex flex-col justify-between ${
                      addr.isDefault
                        ? "border-[#3C7DDA] ring-1 ring-[#3C7DDA]/40"
                        : ""
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-[#282926] truncate">
                            {addr.fullName}
                          </span>

                          {addr.isDefault && (
                            <span className="bg-[#173885] text-[#FEFEFE] text-[9px] font-black px-2 py-0.5 rounded-full shrink-0">
                              DEFAULT
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-[#606460] font-mono shrink-0">
                          {addr.phone}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold uppercase tracking-wide text-[#6F8A92] bg-[#F2F6F8] px-2 py-1 rounded-lg">
                          {addr.addressType || "SITE"}
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
                          disabled={isActionLoading}
                          className="text-[#3C7DDA] hover:underline font-bold text-[11px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                          {isActionLoading && (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          )}
                          Set as Default
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Primary Address
                        </span>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(addr)}
                          disabled={isActionLoading}
                          className="p-1.5 text-[#606460] hover:text-[#173885] hover:bg-[#E4EEF3] rounded-lg transition disabled:opacity-50"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(addr.id)}
                          disabled={isActionLoading}
                          className="p-1.5 text-[#606460] hover:text-[#B43D20] hover:bg-[#FBE3DE] rounded-lg transition disabled:opacity-50"
                          title="Delete"
                        >
                          {isActionLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
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
        onClose={closeModal}
        onSave={handleSave}
        addressToEdit={editingAddress}
        isSaving={isSaving}
      />
    </div>
  );
};
