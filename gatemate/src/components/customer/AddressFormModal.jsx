import React, { useState, useEffect } from "react";
import { X, MapPin, Building, Phone, User } from "lucide-react";
import { addressService } from "../../services/addressService";

export const AddressFormModal = ({
  isOpen,
  onClose,
  onSave,
  addressToEdit = null,
  isSaving = false,
}) => {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    line1: "",
    locality: "",
    landmark: "",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411006",
    isDefault: false,
  });

  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (addressToEdit) {
      setFormData({ ...addressToEdit });
    } else {
      setFormData({
        fullName: "",
        phone: "",
        line1: "",
        locality: "",
        landmark: "",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411006",
        isDefault: false,
      });
    }
    setFormError(null);
  }, [addressToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError(null);

    const cleanPhone = formData.phone.trim();
    if (!/^\d{10}$/.test(cleanPhone)) {
      setFormError("Please enter a valid 10-digit mobile number.");
      return;
    }

    const cleanPin = formData.pincode.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      setFormError("Please enter a valid 6-digit PIN code.");
      return;
    }

    onSave({
      ...formData,
      phone: cleanPhone,
      pincode: cleanPin,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-lg p-6 sm:p-8 rounded-3xl relative shadow-2xl overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          disabled={isSaving}
          className="absolute top-5 right-5 text-[#606460] hover:text-[#282926] transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-[#173885] mb-1">
          {addressToEdit
            ? "Edit Site Address"
            : "Add New Construction Site Address"}
        </h3>
        <p className="text-xs text-[#606460] mb-5">
          Enter site access details for direct unloading in Pune & PCMC.
        </p>

        {formError && (
          <div className="p-3 rounded-xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs mb-4">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#282926] block mb-1">
                Contact Name / Site Engineer *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Patil"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#282926] block mb-1">
                Mobile Number *
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="10-digit number"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    phone: e.target.value.replace(/\D/g, ""),
                  })
                }
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#282926] block mb-1">
              Site Address (Plot / Wing / Street) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Site #402, Rose Valley Infrastructure Project"
              value={formData.line1}
              onChange={(e) =>
                setFormData({ ...formData, line1: e.target.value })
              }
              className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#282926] block mb-1">
                Locality / Area *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Pimple Saudagar / Baner"
                value={formData.locality}
                onChange={(e) =>
                  setFormData({ ...formData, locality: e.target.value })
                }
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#282926] block mb-1">
                Landmark (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Near Toll Plaza"
                value={formData.landmark}
                onChange={(e) =>
                  setFormData({ ...formData, landmark: e.target.value })
                }
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#282926] block mb-1">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className="w-full gm-input px-3 py-2.5 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#282926] block mb-1">
                State
              </label>
              <input
                type="text"
                disabled
                value="Maharashtra"
                className="w-full gm-input px-3 py-2.5 rounded-xl text-xs bg-[#F4F6FA]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#282926] block mb-1">
                PIN Code *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={formData.pincode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pincode: e.target.value.replace(/\D/g, ""),
                  })
                }
                className="w-full gm-input px-3 py-2.5 rounded-xl text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) =>
                  setFormData({ ...formData, isDefault: e.target.checked })
                }
                className="w-4 h-4 rounded accent-[#3C7DDA]"
              />
              <span className="text-xs text-[#606460]">
                Set as default site delivery destination
              </span>
            </label>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 btn-gm-secondary py-3 rounded-xl text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 btn-gm-primary py-3 rounded-xl text-xs font-bold disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Address"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
