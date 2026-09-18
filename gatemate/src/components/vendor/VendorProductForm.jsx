import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Package,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";
import { useVendorAuth } from "../../context/VendorAuthContext";
import { vendorProductService } from "../../services/vendorProductService";
import { fileOptimizer } from "../../utils/fileOptimizer";
import { SeoHead } from "../common/SeoHead";

export const VendorProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { vendorUser } = useVendorAuth();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    categorySlug: "cement",
    unit: "bag",
    sku: "",
    price: "",
    originalPrice: "",
    moq: "1",
    isExpress30MinAvailable: false,
    description: "",
    features: [""],
    imageUrls: [],
  });

  const [files, setFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (!vendorUser?.id) return;

    if (isEditing) {
      setFetching(true);
      vendorProductService
        .getVendorProductById(id)
        .then((prod) => {
          if (prod) {
            setFormData({
              name: prod.name || "",
              brand: prod.brand || "",
              categorySlug: prod.category_slug || "cement",
              unit: prod.unit || "bag",
              sku: prod.sku || "",
              price: prod.price || "",
              originalPrice: prod.original_price || "",
              moq: prod.moq || "1",
              isExpress30MinAvailable: Boolean(prod.is_express_30min_available),
              description: prod.description || "",
              features: prod.features?.length > 0 ? prod.features : [""],
              imageUrls: prod.image_urls || [],
            });
            setImagePreviews(prod.image_urls || []);
          }
        })
        .catch((err) => {
          setError(err.message || "Failed to load product details.");
        })
        .finally(() => {
          setFetching(false);
        });
    }
  }, [vendorUser?.id, id, isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFeatureChange = (index, value) => {
    const updated = [...formData.features];
    updated[index] = value;
    setFormData((prev) => ({ ...prev, features: updated }));
  };

  const addFeatureField = () => {
    setFormData((prev) => ({ ...prev, features: [...prev.features, ""] }));
  };

  const removeFeatureField = (index) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleImageSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    setError(null);
    try {
      const optimizedFiles = [];
      const newPreviews = [];

      for (const file of selectedFiles) {
        const optimized = await fileOptimizer.optimizeImage(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.85,
        });
        optimizedFiles.push(optimized);
        newPreviews.push(URL.createObjectURL(optimized));
      }

      setFiles((prev) => [...prev, ...optimizedFiles]);
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    } catch (err) {
      setError("Failed to optimize image: " + err.message);
    }
  };

  const removeImage = (index) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    // If it's a newly selected file
    if (index >= formData.imageUrls.length) {
      const fileIndex = index - formData.imageUrls.length;
      setFiles((prev) => prev.filter((_, i) => i !== fileIndex));
    } else {
      setFormData((prev) => ({
        ...prev,
        imageUrls: prev.imageUrls.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!vendorUser?.id) {
      setError("You must be authenticated as a vendor to save products.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        features: formData.features.filter((f) => f.trim() !== ""),
      };

      if (isEditing) {
        await vendorProductService.updateVendorProduct(id, payload, files);
        setSuccessMsg("Product successfully updated!");
      } else {
        await vendorProductService.createVendorProduct(payload, files);
        setSuccessMsg(
          "Product successfully created and submitted for moderation!",
        );
      }

      setTimeout(() => {
        navigate("/vendor/products");
      }, 1200);
    } catch (err) {
      setError(err.message || "Failed to save product listing.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-4 animate-pulse font-sans">
        <div className="h-6 bg-[#E4EEF3] rounded w-1/3" />
        <div className="h-96 bg-[#FEFEFE] rounded-3xl border border-[#D9E2EA]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6 pb-24 font-sans">
      <SeoHead
        title={
          isEditing
            ? "Edit Product Listing | GateMate Vendor"
            : "Add New Product | GateMate Vendor"
        }
        description="Create or update construction material listings with live inventory specifications and MOQ terms."
        canonicalUrl={
          isEditing ? `/vendor/products/${id}` : "/vendor/products/new"
        }
        noIndex={true}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9E2EA] pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/vendor/products"
            className="p-2 rounded-xl bg-[#FEFEFE] border border-[#D9E2EA] text-[#606460] hover:text-[#173885] hover:bg-[#E4EEF3] transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="badge-gm-info px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Product Catalog Entry
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#173885] mt-0.5">
              {isEditing
                ? "Edit Construction Product"
                : "Add New Product Listing"}
            </h1>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Details */}
        <div className="gm-panel p-6 sm:p-8 rounded-3xl border border-[#D9E2EA] space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-[#173885] border-b border-[#D9E2EA] pb-3">
            Core Product Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-[#282926] block mb-1">
                Product Title *
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. UltraTech Super Weather-Shield PPC Cement"
                value={formData.name}
                onChange={handleChange}
                className="w-full gm-input px-3.5 py-2 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-[#282926] block mb-1">
                Manufacturer Brand *
              </label>
              <input
                type="text"
                name="brand"
                required
                placeholder="e.g. UltraTech, Tata Tiscon, Siporex"
                value={formData.brand}
                onChange={handleChange}
                className="w-full gm-input px-3.5 py-2 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-[#282926] block mb-1">
                Category Slug *
              </label>
              <select
                name="categorySlug"
                value={formData.categorySlug}
                onChange={handleChange}
                className="w-full gm-input px-3.5 py-2 rounded-xl"
              >
                <option value="cement">Cement & Mortar</option>
                <option value="tmt-steel">TMT Steel Rebars</option>
                <option value="blocks-bricks">AAC Blocks & Bricks</option>
                <option value="aggregates-sand">Aggregates & M-Sand</option>
                <option value="waterproofing">Waterproofing & Chemicals</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-[#282926] block mb-1">
                Stock Keeping Unit (SKU) *
              </label>
              <input
                type="text"
                name="sku"
                required
                placeholder="e.g. ULT-PPC-50KG"
                value={formData.sku}
                onChange={handleChange}
                className="w-full gm-input px-3.5 py-2 rounded-xl font-mono"
              />
            </div>
          </div>
        </div>

        {/* Pricing & MOQ */}
        <div className="gm-panel p-6 sm:p-8 rounded-3xl border border-[#D9E2EA] space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-[#173885] border-b border-[#D9E2EA] pb-3">
            Pricing, Unit & Minimum Order Quantity (MOQ)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-bold text-[#282926] block mb-1">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                name="price"
                required
                min={1}
                placeholder="380"
                value={formData.price}
                onChange={handleChange}
                className="w-full gm-input px-3.5 py-2 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-[#282926] block mb-1">
                Original List Price (₹)
              </label>
              <input
                type="number"
                name="originalPrice"
                min={1}
                placeholder="420"
                value={formData.originalPrice}
                onChange={handleChange}
                className="w-full gm-input px-3.5 py-2 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-[#282926] block mb-1">
                Measurement Unit *
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full gm-input px-3.5 py-2 rounded-xl"
              >
                <option value="bag">Bag (50kg)</option>
                <option value="ton">Ton</option>
                <option value="piece">Piece / Block</option>
                <option value="brass">Brass</option>
                <option value="sqft">Sq. Ft.</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-[#282926] block mb-1">
                MOQ Threshold *
              </label>
              <input
                type="number"
                name="moq"
                required
                min={1}
                placeholder="10"
                value={formData.moq}
                onChange={handleChange}
                className="w-full gm-input px-3.5 py-2 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="isExpress30MinAvailable"
                checked={formData.isExpress30MinAvailable}
                onChange={handleChange}
                className="w-4 h-4 rounded text-[#173885] border-[#D9E2EA]"
              />
              <span className="text-xs font-bold text-[#173885] flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-current text-[#3C7DDA]" />
                Enable 30-Minute Priority Express Dispatch for this SKU
              </span>
            </label>
          </div>
        </div>

        {/* Description & Features */}
        <div className="gm-panel p-6 sm:p-8 rounded-3xl border border-[#D9E2EA] space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-[#173885] border-b border-[#D9E2EA] pb-3">
            Specifications & Key Features
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-[#282926] block mb-1">
                Technical Description *
              </label>
              <textarea
                name="description"
                required
                rows={3}
                placeholder="Describe material grade, IS compliance, compressive strength, or application guidelines..."
                value={formData.description}
                onChange={handleChange}
                className="w-full gm-input p-3 rounded-xl leading-relaxed"
              />
            </div>

            <div className="space-y-2">
              <label className="font-bold text-[#282926] block">
                Key Bullet Features
              </label>
              {formData.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Feature ${idx + 1} (e.g. Superior Crack Resistance)`}
                    value={feat}
                    onChange={(e) => handleFeatureChange(idx, e.target.value)}
                    className="flex-1 gm-input px-3.5 py-2 rounded-xl"
                  />
                  {formData.features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFeatureField(idx)}
                      className="p-2 rounded-xl bg-[#FBE3DE] text-[#B43D20] hover:bg-[#FBE3DE]/80"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addFeatureField}
                className="btn-gm-secondary px-3 py-1.5 rounded-xl text-xs font-bold"
              >
                + Add Feature Bullet
              </button>
            </div>
          </div>
        </div>

        {/* Image Uploads */}
        <div className="gm-panel p-6 sm:p-8 rounded-3xl border border-[#D9E2EA] space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-[#173885] border-b border-[#D9E2EA] pb-3">
            Product Images & Gallery
          </h2>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {imagePreviews.map((previewUrl, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-2xl overflow-hidden border border-[#D9E2EA] bg-[#F4F6FA]"
                >
                  <img
                    src={previewUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-[#173885] text-[#FEFEFE] shadow-md hover:bg-[#B43D20]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <label className="aspect-square rounded-2xl border-2 border-dashed border-[#9AAED4] hover:border-[#173885] bg-[#F4F6FA] hover:bg-[#E4EEF3] transition flex flex-col items-center justify-center gap-2 cursor-pointer text-[#606460]">
                <Upload className="w-6 h-6 text-[#3C7DDA]" />
                <span className="font-bold text-[11px]">Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/vendor/products"
            className="btn-gm-secondary px-5 py-2.5 rounded-xl text-xs font-bold"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-gm-primary px-7 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-[#FEFEFE]" />
            <span>
              {loading
                ? "Saving Product..."
                : isEditing
                  ? "Update Product"
                  : "Publish Product"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
