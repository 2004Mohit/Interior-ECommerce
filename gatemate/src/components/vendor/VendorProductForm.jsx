import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Send,
  Save,
  Info,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react";
import { useVendorAuth } from "../../context/VendorAuthContext";
import {
  vendorProductService,
  PRODUCT_APPROVAL_STATUS,
} from "../../services/vendorProductService";
import {
  productAttributeService,
  ATTRIBUTE_TYPES,
} from "../../services/productAttributeService";
import { productMediaService } from "../../services/productMediaService";
import { CATALOGUE_CATEGORIES } from "../../data/categories";
import { getRecommendedUnitsForCategory } from "../../data/constructionUnits";
import { SuggestAttributeModal } from "./SuggestAttributeModal";
import { SeoHead } from "../common/SeoHead";

export const VendorProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { vendorUser } = useVendorAuth();
  const isEditing = Boolean(id && id !== "new");

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    categorySlug: "cement",
    category: "Cement",
    unit: "bag",
    sku: "",
    price: "",
    originalPrice: "",
    stock: "",
    moq: "1",
    description: "",
    features: "",
    dynamicAttributes: {},
    images: [],
    status: PRODUCT_APPROVAL_STATUS.DRAFT,
  });

  const [categoryAttributes, setCategoryAttributes] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [savingAction, setSavingAction] = useState(null); // 'draft' | 'submit'
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);
  const [imageUploadError, setImageUploadError] = useState(null);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);

  useEffect(() => {
    productAttributeService
      .getCategoryAttributes(formData.categorySlug)
      .then(setCategoryAttributes);
  }, [formData.categorySlug]);

  useEffect(() => {
    if (isEditing) {
      vendorProductService
        .getVendorProductById(vendorUser?.id || "vnd-pune-001", id)
        .then((prod) => {
          if (prod) {
            const attrMap = {};
            if (Array.isArray(prod.dynamicAttributes)) {
              prod.dynamicAttributes.forEach((a) => {
                attrMap[a.key] = a.value;
              });
            }

            setFormData({
              ...prod,
              price: String(prod.price || ""),
              originalPrice: String(prod.originalPrice || ""),
              stock: String(prod.stock !== undefined ? prod.stock : ""),
              moq: String(prod.moq || "1"),
              features: Array.isArray(prod.features)
                ? prod.features.join("\n")
                : prod.features || "",
              dynamicAttributes: attrMap,
              images: prod.images || (prod.img ? [prod.img] : []),
            });
          }
          setLoading(false);
        });
    }
  }, [id, isEditing, vendorUser]);

  const availableUnits = getRecommendedUnitsForCategory(formData.categorySlug);

  const handleCategoryChange = (e) => {
    const slug = e.target.value;
    const match = CATALOGUE_CATEGORIES.find((c) => c.slug === slug);
    const recommended = getRecommendedUnitsForCategory(slug);

    setFormData((prev) => ({
      ...prev,
      categorySlug: slug,
      category: match?.name || slug,
      unit: recommended[0]?.value || prev.unit,
      dynamicAttributes: {},
    }));
  };

  const handleDynamicAttributeChange = (attrName, value) => {
    setFormData((prev) => ({
      ...prev,
      dynamicAttributes: {
        ...prev.dynamicAttributes,
        [attrName]: value,
      },
    }));
  };

  // Upload image to Supabase Storage and add to product image gallery
  const handleImageUpload = async (e) => {
    setImageUploadError(null);
    const files = Array.from(e.target.files || []);
    if (files.length + formData.images.length > 5) {
      setImageUploadError("Maximum 5 product photographs allowed per listing.");
      return;
    }

    setIsUploadingImage(true);
    try {
      const vendorId = vendorUser?.id || "vnd-pune-001";
      for (const file of files) {
        const uploaded = await productMediaService.uploadProductImage(
          vendorId,
          file,
        );
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, uploaded.url],
        }));
      }
    } catch (err) {
      setImageUploadError(err.message || "Image upload failed.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleMoveImage = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= formData.images.length) return;
    setFormData((prev) => {
      const updated = [...prev.images];
      const item = updated.splice(fromIdx, 1)[0];
      updated.splice(toIdx, 0, item);
      return { ...prev, images: updated };
    });
  };

  const validateProductPayload = (isSubmittingForReview = false) => {
    setFormError(null);

    if (!formData.name.trim() || formData.name.trim().length < 5) {
      return "Please provide a clear product name (at least 5 characters).";
    }

    if (!formData.brand.trim()) {
      return "Please enter the product manufacturer or brand name.";
    }

    if (!formData.categorySlug) {
      return "Please select a valid construction product category.";
    }

    if (!formData.unit) {
      return "Please select an appropriate unit of supply.";
    }

    const numPrice = Number(formData.price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return "Please enter a valid positive unit selling price (₹).";
    }

    const numStock = Number(formData.stock);
    if (isNaN(numStock) || numStock < 0 || !Number.isInteger(numStock)) {
      return "Please enter a valid available stock quantity (0 or positive whole number).";
    }

    const numMoq = Number(formData.moq);
    if (isNaN(numMoq) || numMoq < 1 || !Number.isInteger(numMoq)) {
      return "Minimum Order Quantity (MOQ) must be at least 1 unit.";
    }

    if (
      !formData.description.trim() ||
      formData.description.trim().length < 15
    ) {
      return "Please enter a product description (at least 15 characters).";
    }

    if (isSubmittingForReview) {
      for (const attr of categoryAttributes) {
        if (attr.required && !formData.dynamicAttributes[attr.name]?.trim()) {
          return `Please fill in the required category field: "${attr.name}".`;
        }
      }

      if (formData.images.length === 0) {
        return "At least 1 product photograph is required to submit for Admin Review.";
      }
    }

    return null;
  };

  const handleSave = async (isSubmitAction) => {
    const error = validateProductPayload(isSubmitAction);
    if (error) {
      setFormError(error);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSavingAction(isSubmitAction ? "submit" : "draft");
    setFormError(null);

    const featureList = formData.features
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    const structuredAttributes = Object.entries(formData.dynamicAttributes).map(
      ([k, v]) => ({
        key: k,
        value: v,
      }),
    );

    const payload = {
      ...formData,
      price: Number(formData.price),
      originalPrice: formData.originalPrice
        ? Number(formData.originalPrice)
        : null,
      stock: Number(formData.stock),
      moq: Number(formData.moq),
      features: featureList,
      dynamicAttributes: structuredAttributes,
      img:
        formData.images[0] ||
        "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80",
      images:
        formData.images.length > 0
          ? formData.images
          : [
              "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80",
            ],
    };

    const vendorId = vendorUser?.id || "vnd-pune-001";

    try {
      if (isSubmitAction) {
        await vendorProductService.submitProductForReview(vendorId, payload);
        setSuccessNotice(
          isEditing &&
            (formData.status === PRODUCT_APPROVAL_STATUS.PUBLISHED ||
              formData.status === PRODUCT_APPROVAL_STATUS.APPROVED)
            ? "Product updates submitted for Admin Review. Changes will reflect once verified."
            : "Product submitted successfully for Admin Review. Direct publishing is disabled.",
        );
      } else {
        await vendorProductService.saveProductDraft(vendorId, payload);
        setSuccessNotice("Product saved as Draft.");
      }

      setTimeout(() => {
        navigate("/vendor/products");
      }, 1200);
    } catch (err) {
      setFormError(err.message || "Failed to save product.");
    } finally {
      setSavingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-4 animate-pulse">
        <div className="h-6 bg-[#E4EEF3] rounded w-1/3" />
        <div className="h-64 bg-[#FEFEFE] rounded-3xl border border-[#D9E2EA]" />
      </div>
    );
  }

  const isOutOfStock = Number(formData.stock) === 0;

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6 pb-24">
      <SeoHead
        title={`${isEditing ? "Edit Product" : "Add New Product"} | GateMate Vendor Portal`}
        description="Add and edit construction products with technical attributes, units of supply, MOQ, and batch imagery."
        canonicalUrl="/vendor/products/new"
        noIndex={true}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9E2EA] pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/vendor/products"
            className="p-2 rounded-xl bg-[#FEFEFE] border border-[#D9E2EA] text-[#606460] hover:text-[#173885] hover:bg-[#E4EEF3] transition"
            aria-label="Back to products list"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="badge-gm-info px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Product Management
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#173885] mt-0.5">
              {isEditing
                ? "Edit Construction Product"
                : "Add New Construction Product"}
            </h1>
          </div>
        </div>

        <span className="text-xs text-[#6F8A92] self-start sm:self-auto">
          Status: <strong className="text-[#173885]">{formData.status}</strong>
        </span>
      </div>

      {/* Alerts */}
      {formError && (
        <div className="p-3.5 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#B43D20] shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {successNotice && (
        <div className="p-3.5 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#3F7D20] shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Moderation Workflow Policy */}
      {isEditing &&
        (formData.status === PRODUCT_APPROVAL_STATUS.PUBLISHED ||
          formData.status === PRODUCT_APPROVAL_STATUS.APPROVED) && (
          <div className="p-4 rounded-2xl bg-[#FFF0D5] border border-[#A66A08]/30 text-xs text-[#A66A08] flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">
                Moderation Notice for Live Products:
              </strong>
              <p className="text-[11px] text-[#606460] mt-0.5 leading-relaxed">
                Editing price, title, category attributes, or photographs on an
                approved product requires review by GateMate inspectors before
                updating on the live customer storefront.
              </p>
            </div>
          </div>
        )}

      {/* Form Container */}
      <div className="gm-panel p-6 sm:p-8 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-6 shadow-xs">
        {/* 1. Identification & Category */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-[#173885] border-b border-[#D9E2EA] pb-2">
            1. Product Information & Category
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#282926] block mb-1">
                Product Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. UltraTech Super Weather-Shield PPC Cement (50 kg Bag)"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#282926] block mb-1">
                Brand / Manufacturer *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. UltraTech, Tata Tiscon, Astral"
                value={formData.brand}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value })
                }
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-[#282926] block mb-1">
                Product Category *
              </label>
              <select
                value={formData.categorySlug}
                onChange={handleCategoryChange}
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-bold"
              >
                {CATALOGUE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#282926] block mb-1">
                Unit of Supply *
              </label>
              <select
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-bold"
              >
                {availableUnits.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#282926] block mb-1">
                Depot SKU / Batch ID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. ULT-PPC-50KG"
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* 2. Category Attributes & Suggestion */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9E2EA] pb-2">
            <div>
              <h2 className="text-sm font-bold text-[#173885]">
                2. Category Technical Specifications ({formData.category})
              </h2>
              <p className="text-[11px] text-[#606460]">
                System attributes configured for this construction category.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsSuggestModalOpen(true)}
              className="text-xs font-bold text-[#3C7DDA] hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Suggest Additional Field</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categoryAttributes.map((attr) => (
              <div key={attr.id}>
                <label className="text-xs font-bold text-[#282926] flex items-center justify-between mb-1">
                  <span>
                    {attr.name}{" "}
                    {attr.required && <span className="text-[#B43D20]">*</span>}
                  </span>
                  {attr.isCommunityApproved && (
                    <span className="text-[9px] text-[#3C7DDA] bg-[#E4EEF3] px-1.5 py-0.2 rounded">
                      Vendor Approved Field
                    </span>
                  )}
                </label>

                {attr.type === ATTRIBUTE_TYPES.SELECT ? (
                  <select
                    value={formData.dynamicAttributes[attr.name] || ""}
                    onChange={(e) =>
                      handleDynamicAttributeChange(attr.name, e.target.value)
                    }
                    className="w-full gm-input px-3 py-2 rounded-xl text-xs font-semibold"
                  >
                    <option value="">Select {attr.name}...</option>
                    {attr.allowedValues?.map((val) => (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={
                      attr.type === ATTRIBUTE_TYPES.NUMBER ? "number" : "text"
                    }
                    placeholder={attr.placeholder || `Enter ${attr.name}...`}
                    value={formData.dynamicAttributes[attr.name] || ""}
                    onChange={(e) =>
                      handleDynamicAttributeChange(attr.name, e.target.value)
                    }
                    className="w-full gm-input px-3 py-2 rounded-xl text-xs"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 3. Pricing, Stock & MOQ */}
        <div className="space-y-4 pt-2">
          <h2 className="text-sm font-bold text-[#173885] border-b border-[#D9E2EA] pb-2">
            3. Pricing, Inventory & MOQ
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-[#282926] block mb-1">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                required
                min={1}
                step="any"
                placeholder="385"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#282926] block mb-1">
                MRP / Strikethrough
              </label>
              <input
                type="number"
                min={0}
                step="any"
                placeholder="420"
                value={formData.originalPrice}
                onChange={(e) =>
                  setFormData({ ...formData, originalPrice: e.target.value })
                }
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#282926] block mb-1">
                Available Quantity ({formData.unit}) *
              </label>
              <input
                type="number"
                required
                min={0}
                placeholder="500"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: e.target.value })
                }
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#282926] block mb-1">
                MOQ ({formData.unit}s) *
              </label>
              <input
                type="number"
                required
                min={1}
                placeholder="10"
                value={formData.moq}
                onChange={(e) =>
                  setFormData({ ...formData, moq: e.target.value })
                }
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-[#F4F6FA] border border-[#D9E2EA]">
            <span className="text-[#606460]">Stock Status:</span>
            <span
              className={`px-3 py-0.5 rounded-full font-bold text-[10px] ${
                isOutOfStock
                  ? "bg-[#FBE3DE] text-[#B43D20]"
                  : "bg-[#E1F2D9] text-[#3F7D20]"
              }`}
            >
              {isOutOfStock
                ? "Out of Stock (Zero Quantity)"
                : "In Stock & Ready for Site Dispatch"}
            </span>
          </div>
        </div>

        {/* 4. Description */}
        <div className="space-y-4 pt-2">
          <h2 className="text-sm font-bold text-[#173885] border-b border-[#D9E2EA] pb-2">
            4. Product Description
          </h2>

          <div>
            <label className="text-xs font-bold text-[#282926] block mb-1">
              Product Description *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Provide technical overview, concrete mix performance, chemical resistance, or site offloading terms..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full gm-input p-3 rounded-xl text-xs leading-relaxed"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#282926] block mb-1">
              Key Features (One per line)
            </label>
            <textarea
              rows={3}
              placeholder="IS 1489 Part 1 Certified&#10;Micro-fine particle grade&#10;50 kg tamper-proof packing"
              value={formData.features}
              onChange={(e) =>
                setFormData({ ...formData, features: e.target.value })
              }
              className="w-full gm-input p-3 rounded-xl text-xs leading-relaxed font-mono"
            />
          </div>
        </div>

        {/* 5. Product Image Management (Upload, Preview, Ordering, Remove) */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-2">
            <div>
              <h2 className="text-sm font-bold text-[#173885]">
                5. Product Photographs (Supabase Storage)
              </h2>
              <p className="text-[11px] text-[#606460]">
                First image serves as the primary catalogue cover.
              </p>
            </div>
            <span className="text-[11px] text-[#6F8A92]">
              {formData.images.length} / 5 uploaded
            </span>
          </div>

          {imageUploadError && (
            <div className="p-3 rounded-xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs">
              {imageUploadError}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {formData.images.map((imgUrl, idx) => (
              <div
                key={idx}
                className="relative w-28 h-28 rounded-2xl overflow-hidden border border-[#D9E2EA] bg-[#F4F6FA] group"
              >
                <img
                  src={imgUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 p-1 rounded-lg bg-[#173885]/80 text-[#FEFEFE] hover:bg-[#B43D20] transition z-10"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Re-ordering Controls */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#173885]/90 to-transparent p-1.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveImage(idx, idx - 1)}
                    className="p-1 rounded bg-[#FEFEFE]/20 text-[#FEFEFE] disabled:opacity-30 hover:bg-[#FEFEFE]/40"
                    title="Move left (Make cover)"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>

                  <span className="text-[9px] text-[#FEFEFE] font-bold">
                    {idx === 0 ? "Cover" : `#${idx + 1}`}
                  </span>

                  <button
                    type="button"
                    disabled={idx === formData.images.length - 1}
                    onClick={() => handleMoveImage(idx, idx + 1)}
                    className="p-1 rounded bg-[#FEFEFE]/20 text-[#FEFEFE] disabled:opacity-30 hover:bg-[#FEFEFE]/40"
                    title="Move right"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {idx === 0 && (
                  <span className="absolute bottom-1 left-1 bg-[#173885] text-[#FEFEFE] text-[8px] font-bold px-1.5 py-0.5 rounded group-hover:opacity-0 transition-opacity">
                    Cover
                  </span>
                )}
              </div>
            ))}

            {formData.images.length < 5 && (
              <label className="w-28 h-28 rounded-2xl border-2 border-dashed border-[#D9E2EA] hover:border-[#3C7DDA] flex flex-col items-center justify-center text-[#6F8A92] hover:text-[#3C7DDA] cursor-pointer transition bg-[#F4F6FA]">
                <Upload className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold">
                  {isUploadingImage ? "Uploading..." : "Upload Image"}
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  disabled={isUploadingImage}
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Action CTAs */}
        <div className="pt-6 border-t border-[#D9E2EA] flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            to="/vendor/products"
            className="w-full sm:w-auto btn-gm-secondary px-5 py-2.5 rounded-xl text-xs font-bold text-center"
          >
            Cancel
          </Link>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={Boolean(savingAction) || isUploadingImage}
              onClick={() => handleSave(false)}
              className="w-full sm:w-auto btn-gm-secondary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 text-[#173885]" />
              <span>
                {savingAction === "draft" ? "Saving Draft..." : "Save as Draft"}
              </span>
            </button>

            <button
              type="button"
              disabled={Boolean(savingAction) || isUploadingImage}
              onClick={() => handleSave(true)}
              className="w-full sm:w-auto btn-gm-primary px-6 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 text-[#FEFEFE]" />
              <span>
                {savingAction === "submit"
                  ? "Submitting..."
                  : "Submit for Admin Review"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Suggest Dynamic Attribute Modal */}
      <SuggestAttributeModal
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
        categorySlug={formData.categorySlug}
        categoryName={formData.category}
        vendorId={vendorUser?.id}
        vendorBusinessName={vendorUser?.businessName}
        onSuggestionSubmitted={() => {
          productAttributeService
            .getCategoryAttributes(formData.categorySlug)
            .then(setCategoryAttributes);
        }}
      />
    </div>
  );
};
