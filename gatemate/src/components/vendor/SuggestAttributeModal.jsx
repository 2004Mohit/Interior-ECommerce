import React, { useState } from "react";
import {
  X,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
} from "lucide-react";
import {
  productAttributeService,
  ATTRIBUTE_TYPES,
} from "../../services/productAttributeService";

export const SuggestAttributeModal = ({
  isOpen,
  onClose,
  categorySlug,
  categoryName,
  vendorId,
  vendorBusinessName,
  onSuggestionSubmitted,
}) => {
  const [attrName, setAttrName] = useState("");
  const [attrType, setAttrType] = useState(ATTRIBUTE_TYPES.TEXT);
  const [options, setOptions] = useState([""]);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAddOption = () => {
    setOptions([...options, ""]);
  };

  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleRemoveOption = (index) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!attrName.trim()) {
      setError("Please provide an attribute name.");
      return;
    }

    if (attrType === ATTRIBUTE_TYPES.SELECT) {
      const validOptions = options.map((o) => o.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        setError(
          "Please provide at least 2 dropdown options for a Select attribute.",
        );
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (!vendorId) {
        throw new Error("Vendor profile is not available.");
      }

      const result = await productAttributeService.submitVendorSuggestion({
        vendorId,
        vendorBusinessName,
        categorySlug,
        attributeName: attrName.trim(),
        type: attrType,
        allowedValues:
          attrType === ATTRIBUTE_TYPES.SELECT
            ? options.map((o) => o.trim()).filter(Boolean)
            : [],
        reason,
      });

      setSuccess(true);
      onSuggestionSubmitted?.(result);
      setTimeout(() => {
        setSuccess(false);
        setAttrName("");
        setOptions([""]);
        setReason("");
        onClose();
      }, 1400);
    } catch (err) {
      setError(err.message || "Failed to submit attribute suggestion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-lg p-6 sm:p-8 rounded-3xl relative shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 text-[#606460] hover:text-[#282926]"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-[#3C7DDA]" />
          <h3 className="text-xl font-bold text-[#173885]">
            Suggest Additional Product Attribute
          </h3>
        </div>
        <p className="text-xs text-[#606460] mb-4">
          Suggest a field for the{" "}
          <strong className="text-[#173885]">{categoryName}</strong> category.
          Suggestions undergo admin review before appearing globally.
        </p>

        {error && (
          <div className="p-3 rounded-xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#3F7D20] shrink-0" />
            <span>Attribute suggested! Entered into Pending Admin Review.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#282926] block mb-1">
              Attribute Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Wire Gauge, Sieve Fineness, Thermal Rating"
              value={attrName}
              onChange={(e) => setAttrName(e.target.value)}
              className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#282926] block mb-1">
              Field Input Type *
            </label>
            <select
              value={attrType}
              onChange={(e) => setAttrType(e.target.value)}
              className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-bold"
            >
              <option value={ATTRIBUTE_TYPES.TEXT}>
                Text Input (e.g. standard specs, certifications)
              </option>
              <option value={ATTRIBUTE_TYPES.NUMBER}>
                Numeric (e.g. thickness, weight)
              </option>
              <option value={ATTRIBUTE_TYPES.SELECT}>
                Dropdown List (Specific allowed options)
              </option>
            </select>
          </div>

          {attrType === ATTRIBUTE_TYPES.SELECT && (
            <div className="space-y-2 p-3.5 rounded-2xl bg-[#F4F6FA] border border-[#D9E2EA]">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#173885]">
                  Dropdown Allowed Values *
                </span>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-xs font-bold text-[#3C7DDA] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Option</span>
                </button>
              </div>

              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className="flex-1 gm-input px-3 py-1.5 rounded-lg text-xs"
                  />
                  {options.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-1 text-[#B43D20] hover:bg-[#FBE3DE] rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-[#282926] block mb-1">
              Why is this field needed for this category?
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Civil engineers specify this property when requesting project estimates."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full gm-input p-3 rounded-xl text-xs leading-relaxed"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#E4EEF3] border border-[#9AAED4]/40 text-xs text-[#173885]">
            <strong className="block font-bold">
              Staging Workflow Notice:
            </strong>
            <p className="text-[11px] text-[#606460] mt-0.5">
              Your suggestion will enter a pending state. Once approved by
              Ferrado reviewers, this field will automatically become available
              to all vendors listing products in {categoryName}.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 btn-gm-secondary py-2.5 rounded-xl text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 btn-gm-primary py-2.5 rounded-xl text-xs font-bold disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Suggestion"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
