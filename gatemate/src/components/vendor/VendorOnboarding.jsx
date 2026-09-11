import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { vendorService } from "../../services/vendorService";
import { b2bService } from "../../services/b2bService";

export const VendorOnboarding = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    businessName: "",
    contactPerson: "",
    email: "",
    phone: "",
    gstin: "",
    address: "",
    pincode: "411028",
  });

  const [gstValidation, setGstValidation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleGstChange = (e) => {
    const val = e.target.value.toUpperCase();
    setFormData({ ...formData, gstin: val });
    if (val.length === 15) {
      setGstValidation(b2bService.validateGSTIN(val));
    } else {
      setGstValidation(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await vendorService.saveProfile("mock-user-1", formData);
      setSuccess(true);
      setTimeout(() => navigate("/vendor/dashboard"), 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div className="border-b border-[#D9E2EA] pb-4">
        <h1 className="text-2xl font-black text-[#173885]">
          Vendor Onboarding
        </h1>
        <p className="text-xs text-[#606460]">
          Register your construction supply depot or stockist dealership in Pune
          & PCMC.
        </p>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-[#3F7D20]" />
          <span>
            Vendor account registered successfully. Redirecting to your
            dashboard...
          </span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="gm-panel p-6 sm:p-8 rounded-3xl space-y-4"
      >
        <div>
          <label className="text-xs font-semibold text-[#282926] block mb-1">
            Business / Depot Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Pune Infrastructure Cement & Steel Hub"
            value={formData.businessName}
            onChange={(e) =>
              setFormData({ ...formData, businessName: e.target.value })
            }
            className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#282926] block mb-1">
              Contact Person *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Suresh Patil"
              value={formData.contactPerson}
              onChange={(e) =>
                setFormData({ ...formData, contactPerson: e.target.value })
              }
              className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#282926] block mb-1">
              Business Mobile *
            </label>
            <input
              type="tel"
              required
              maxLength={10}
              placeholder="10-digit mobile"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#282926] block mb-1">
              Business Email *
            </label>
            <input
              type="email"
              required
              placeholder="depot@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#282926] block mb-1">
              GSTIN (Maharashtra 27...) *
            </label>
            <input
              type="text"
              required
              maxLength={15}
              placeholder="27AAAAA0000A1Z5"
              value={formData.gstin}
              onChange={handleGstChange}
              className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold"
            />
            {gstValidation && (
              <span
                className={`text-[10px] mt-1 block font-semibold ${gstValidation.isValid ? "text-[#3F7D20]" : "text-[#B43D20]"}`}
              >
                {gstValidation.message}
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#282926] block mb-1">
            Depot / Yard Physical Address *
          </label>
          <input
            type="text"
            required
            placeholder="Plot / Street / Industrial Area"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full btn-gm-primary py-3 rounded-xl text-xs font-bold disabled:opacity-50"
        >
          {isSubmitting
            ? "Registering Depot..."
            : "Complete Vendor Registration"}
        </button>
      </form>
    </div>
  );
};
