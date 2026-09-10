import React, { useState, useEffect } from "react";
import {
  X,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Zap,
  ShieldCheck,
} from "lucide-react";
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
    pincode: "",
    isDefault: false,
  });

  const [formErrors, setFormErrors] = useState({});
  const [deliveryAssessment, setDeliveryAssessment] = useState(null);

  useEffect(() => {
    if (addressToEdit) {
      setFormData({
        id: addressToEdit.id,
        fullName: addressToEdit.fullName || "",
        phone: addressToEdit.phone || "",
        line1: addressToEdit.line1 || "",
        locality: addressToEdit.locality || "",
        landmark: addressToEdit.landmark || "",
        city: addressToEdit.city || "Pune",
        state: addressToEdit.state || "Maharashtra",
        pincode: addressToEdit.pincode || "",
        isDefault: Boolean(addressToEdit.isDefault),
      });
      if (addressToEdit.pincode) {
        setDeliveryAssessment(
          addressService.evaluateDeliveryEligibility(addressToEdit.pincode),
        );
      }
    } else {
      setFormData({
        fullName: "",
        phone: "",
        line1: "",
        locality: "",
        landmark: "",
        city: "Pune",
        state: "Maharashtra",
        pincode: "",
        isDefault: false,
      });
      setDeliveryAssessment(null);
    }
    setFormErrors({});
  }, [addressToEdit, isOpen]);

  if (!isOpen) return null;

  const handlePincodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setFormData((prev) => ({ ...prev, pincode: val }));

    if (val.length === 6) {
      const assessment = addressService.evaluateDeliveryEligibility(val);
      setDeliveryAssessment(assessment);
      if (assessment.isServiceable) {
        setFormData((prev) => ({
          ...prev,
          city: assessment.city,
          locality: prev.locality || assessment.area,
        }));
      }
    } else {
      setDeliveryAssessment(null);
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = "Full Name is required";
    if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, ""))) {
      errors.phone = "Enter a valid 10-digit Indian phone number";
    }
    if (!formData.line1.trim())
      errors.line1 = "House/Flat/Gate details required";
    if (!formData.locality.trim())
      errors.locality = "Area or locality required";
    if (!/^[1-9][0-9]{5}$/.test(formData.pincode)) {
      errors.pincode = "Enter a valid 6-digit PIN code";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0a1424] border border-white/10 w-full max-w-lg p-6 sm:p-8 rounded-3xl relative shadow-2xl overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          disabled={isSaving}
          className="absolute top-5 right-5 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-5 h-5 text-amber-400" />
          <h3 className="text-xl font-black text-white">
            {addressToEdit ? "Edit Delivery Address" : "Add New Address"}
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Priority 30-minute hyper-local delivery available across Pune &
          Pimpri-Chinchwad zones.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recipient Full Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Aditya Rathore"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="w-full premium-input px-3.5 py-2.5 rounded-xl text-xs"
              />
              {formErrors.fullName && (
                <span className="text-[11px] text-rose-400 mt-1 block">
                  {formErrors.fullName}
                </span>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                10-Digit Mobile Phone *
              </label>
              <input
                type="tel"
                placeholder="9829012345"
                maxLength={10}
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full premium-input px-3.5 py-2.5 rounded-xl text-xs font-mono"
              />
              {formErrors.phone && (
                <span className="text-[11px] text-rose-400 mt-1 block">
                  {formErrors.phone}
                </span>
              )}
            </div>
          </div>

          {/* PIN code check with live eligibility */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              PIN Code (Pune / PCMC) *
            </label>
            <input
              type="text"
              placeholder="e.g. 411006 or 411061"
              value={formData.pincode}
              onChange={handlePincodeChange}
              className="w-full premium-input px-3.5 py-2.5 rounded-xl text-xs font-mono tracking-wider font-bold"
            />
            {formErrors.pincode && (
              <span className="text-[11px] text-rose-400 mt-1 block">
                {formErrors.pincode}
              </span>
            )}
            {deliveryAssessment && (
              <div
                className={`mt-2 p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                  deliveryAssessment.isServiceable
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                }`}
              >
                {deliveryAssessment.isExpress30Min ? (
                  <Zap className="w-4 h-4 text-amber-400 shrink-0 fill-amber-400" />
                ) : (
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                )}
                <span className="text-[11px] leading-tight">
                  {deliveryAssessment.message}
                </span>
              </div>
            )}
          </div>

          {/* Flat / Street / Gate Line */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Flat, House No., Building, Gate/Street *
            </label>
            <input
              type="text"
              placeholder="e.g. Flat 402, Royal Palms, Lane 7"
              value={formData.line1}
              onChange={(e) =>
                setFormData({ ...formData, line1: e.target.value })
              }
              className="w-full premium-input px-3.5 py-2.5 rounded-xl text-xs"
            />
            {formErrors.line1 && (
              <span className="text-[11px] text-rose-400 mt-1 block">
                {formErrors.line1}
              </span>
            )}
          </div>

          {/* Locality & Landmark */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Area / Locality *
              </label>
              <input
                type="text"
                placeholder="e.g. Koregaon Park or Wakad"
                value={formData.locality}
                onChange={(e) =>
                  setFormData({ ...formData, locality: e.target.value })
                }
                className="w-full premium-input px-3.5 py-2.5 rounded-xl text-xs"
              />
              {formErrors.locality && (
                <span className="text-[11px] text-rose-400 mt-1 block">
                  {formErrors.locality}
                </span>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Landmark (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Near German Bakery"
                value={formData.landmark}
                onChange={(e) =>
                  setFormData({ ...formData, landmark: e.target.value })
                }
                className="w-full premium-input px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* City & State */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className="w-full premium-input px-3.5 py-2.5 rounded-xl text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                State
              </label>
              <input
                type="text"
                value={formData.state}
                disabled
                className="w-full premium-input px-3.5 py-2.5 rounded-xl text-xs bg-slate-900/50 text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Set as Default Checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) =>
                  setFormData({ ...formData, isDefault: e.target.checked })
                }
                className="w-4 h-4 rounded accent-amber-400 cursor-pointer"
              />
              <span className="text-xs text-slate-200 font-semibold">
                Make this my primary delivery address
              </span>
            </label>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 premium-card hover:bg-white/5 py-3 rounded-xl text-xs font-bold text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 gold-gradient-btn py-3 rounded-xl text-xs font-bold transition disabled:opacity-50"
            >
              {isSaving
                ? "Saving Address..."
                : addressToEdit
                  ? "Save Changes"
                  : "Save Address"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
