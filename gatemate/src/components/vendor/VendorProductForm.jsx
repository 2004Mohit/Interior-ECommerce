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
} from "lucide-react";

import { fileOptimizer } from "../../utils/fileOptimizer";
import { useVendorAuth } from "../../context/VendorAuthContext";

import {
  vendorProductService,
  PRODUCT_APPROVAL_STATUS,
} from "../../services/vendorProductService";

import {
  productAttributeService,
  ATTRIBUTE_TYPES,
} from "../../services/productAttributeService";
import { productCategoryService } from "../../services/productCategoryService";
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

    categorySlug: "",
    category: "",

    unit: "bag",

    sku: "",

    price: "",
    originalPrice: "",

    /*
     * Inventory
     *
     * For NEW products:
     * initialStock = starting physical stock.
     *
     * For EDIT:
     * onHandStock is displayed read-only.
     */
    initialStock: "0",
    onHandStock: 0,
    reservedStock: 0,
    availableStock: 0,
    lowStockThreshold: "10",

    /*
     * MOQ is separate from inventory.
     */
    moq: "1",

    description: "",

    features: "",

    dynamicAttributes: {},

    /*
     * Existing uploaded image URLs.
     */
    images: [],

    status: PRODUCT_APPROVAL_STATUS.DRAFT,
  });

  /*
   * Newly selected files are kept here.
   * vendorProductService uploads them after the
   * product ID exists.
   */
  const [files, setFiles] = useState([]);

  const [categoryAttributes, setCategoryAttributes] = useState([]);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [loading, setLoading] = useState(isEditing);

  const [savingAction, setSavingAction] = useState(null);

  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [optimizationStatus, setOptimizationStatus] = useState("");

  const [formError, setFormError] = useState(null);

  const [successNotice, setSuccessNotice] = useState(null);

  const [imageUploadError, setImageUploadError] = useState(null);

  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);

        const data = await productCategoryService.getCategories();

        if (!cancelled) {
          setCategories(data || []);
        }
      } catch (error) {
        if (!cancelled) {
          setCategories([]);
          setFormError(error.message || "Unable to load product categories.");
        }
      } finally {
        if (!cancelled) {
          setCategoriesLoading(false);
        }
      }
    };

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isEditing || categoriesLoading || categories.length === 0) {
      return;
    }

    if (formData.categorySlug) {
      return;
    }

    const firstCategory = categories[0];

    const recommended = getRecommendedUnitsForCategory(firstCategory.slug);

    setFormData((prev) => ({
      ...prev,

      categorySlug: firstCategory.slug,

      category: firstCategory.name,

      unit: recommended[0]?.value || prev.unit,
    }));
  }, [categories, categoriesLoading, isEditing, formData.categorySlug]);

  /*
   * Category attributes
   */
  useEffect(() => {
    let cancelled = false;

    productAttributeService
      .getCategoryAttributes(formData.categorySlug)
      .then((attributes) => {
        if (!cancelled) {
          setCategoryAttributes(attributes || []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCategoryAttributes([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [formData.categorySlug]);

  /*
   * Load product while editing.
   */
  useEffect(() => {
    if (!isEditing) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadProduct = async () => {
      try {
        setLoading(true);
        setFormError(null);

        /*
         * IMPORTANT:
         * Current service signature is:
         * getVendorProductById(productId, vendorId?)
         */
        const prod = await vendorProductService.getVendorProductById(id);

        if (cancelled || !prod) {
          return;
        }

        const attrMap = {};

        if (Array.isArray(prod.dynamicAttributes)) {
          prod.dynamicAttributes.forEach((attribute) => {
            if (!attribute?.key) return;

            attrMap[attribute.key] = attribute.value ?? "";
          });
        }

        setFormData({
          name: prod.name || "",

          brand: prod.brand || "",

          categorySlug: prod.categorySlug || prod.category || "cement",

          category: prod.category || prod.categorySlug || "Cement",

          unit: prod.unit || "bag",

          sku: prod.sku || "",

          price: prod.price != null ? String(prod.price) : "",

          originalPrice:
            prod.originalPrice != null ? String(prod.originalPrice) : "",

          /*
           * Inventory
           */
          initialStock:
            prod.onHandStock != null ? String(prod.onHandStock) : "0",

          onHandStock: Number(prod.onHandStock || 0),

          reservedStock: Number(prod.reservedStock || 0),

          availableStock: Number(prod.availableStock ?? prod.stock ?? 0),

          lowStockThreshold: String(prod.lowStockThreshold ?? 10),

          moq: String(prod.moq || 1),

          description: prod.description || "",

          features: Array.isArray(prod.features)
            ? prod.features.join("\n")
            : prod.features || "",

          dynamicAttributes: attrMap,

          images: prod.images || prod.imageUrls || (prod.img ? [prod.img] : []),

          status: prod.status || PRODUCT_APPROVAL_STATUS.DRAFT,
        });
      } catch (error) {
        if (!cancelled) {
          setFormError(error.message || "Unable to load product.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [id, isEditing, vendorUser?.id]);

  const availableUnits = getRecommendedUnitsForCategory(formData.categorySlug);

  /*
   * Category change
   */
  const handleCategoryChange = (e) => {
    const slug = e.target.value;

    const selectedCategory = categories.find(
      (category) => category.slug === slug,
    );

    const recommended = getRecommendedUnitsForCategory(slug);

    setFormData((prev) => ({
      ...prev,

      categorySlug: slug,

      category: selectedCategory?.name || slug,

      unit: recommended[0]?.value || prev.unit,

      dynamicAttributes: {},
    }));
  };

  /*
   * Dynamic attribute
   */
  const handleDynamicAttributeChange = (attrName, value) => {
    setFormData((prev) => ({
      ...prev,

      dynamicAttributes: {
        ...prev.dynamicAttributes,

        [attrName]: value,
      },
    }));
  };

  /*
   * Image selection.
   *
   * IMPORTANT:
   * We only optimize and preview files here.
   * We do NOT upload them yet.
   *
   * The service uploads them after the product
   * database row has been created.
   */
  const handleImageUpload = async (e) => {
    setImageUploadError(null);
    setOptimizationStatus("");

    const selectedFiles = Array.from(e.target.files || []);

    if (selectedFiles.length === 0) {
      return;
    }

    if (selectedFiles.length + formData.images.length + files.length > 5) {
      setImageUploadError("Maximum 5 product photographs allowed per listing.");

      e.target.value = "";
      return;
    }

    setIsUploadingImage(true);

    try {
      const optimizedFiles = [];

      for (const file of selectedFiles) {
        const optimized = await fileOptimizer.optimizeProductImage(
          file,
          (status) => {
            setOptimizationStatus(status);
          },
        );

        optimizedFiles.push(optimized);
      }

      setFiles((prev) => [...prev, ...optimizedFiles]);

      /*
       * Create local previews for newly
       * selected files.
       */
      const newPreviewUrls = optimizedFiles.map((file) =>
        URL.createObjectURL(file),
      );

      setFormData((prev) => ({
        ...prev,

        images: [...prev.images, ...newPreviewUrls],
      }));

      setOptimizationStatus(
        "Image optimized successfully. It will be uploaded when you save the product.",
      );
    } catch (error) {
      setImageUploadError(error.message || "Image optimization failed.");

      setOptimizationStatus("");
    } finally {
      setIsUploadingImage(false);

      /*
       * Allow selecting the same file again.
       */
      e.target.value = "";
    }
  };

  /*
   * Remove image.
   *
   * Existing image:
   * remove from formData.images.
   *
   * New local image:
   * remove the corresponding file too.
   */
  const handleRemoveImage = (indexToRemove) => {
    const existingImageCount = isEditing
      ? formData.images.length - files.length
      : formData.images.length - files.length;

    setFormData((prev) => ({
      ...prev,

      images: prev.images.filter((_, index) => index !== indexToRemove),
    }));

    /*
     * New files are always appended
     * after existing images.
     */
    if (indexToRemove >= existingImageCount) {
      const fileIndex = indexToRemove - existingImageCount;

      setFiles((prev) => prev.filter((_, index) => index !== fileIndex));
    }
  };

  /*
   * Reorder image.
   */
  const handleMoveImage = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= formData.images.length) {
      return;
    }

    setFormData((prev) => {
      const updated = [...prev.images];

      const item = updated.splice(fromIdx, 1)[0];

      updated.splice(toIdx, 0, item);

      return {
        ...prev,
        images: updated,
      };
    });

    /*
     * We intentionally don't reorder files here.
     * The service uploads files in their selected
     * order and existing URLs remain in their
     * existing order.
     *
     * Cover image ordering is primarily handled
     * through formData.images.
     */
  };

  /*
   * Product validation.
   */
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

    if (Number.isNaN(numPrice) || numPrice <= 0) {
      return "Please enter a valid positive unit selling price (₹).";
    }

    /*
     * Inventory validation
     *
     * New product:
     * initialStock must be integer >= 0.
     *
     * Existing product:
     * physical stock is not edited here.
     */
    if (!isEditing) {
      const initialStock = Number(formData.initialStock);

      if (
        Number.isNaN(initialStock) ||
        !Number.isInteger(initialStock) ||
        initialStock < 0
      ) {
        return "Initial on-hand quantity must be a whole number greater than or equal to 0.";
      }
    }

    const threshold = Number(formData.lowStockThreshold);

    if (
      Number.isNaN(threshold) ||
      !Number.isInteger(threshold) ||
      threshold < 0
    ) {
      return "Low stock threshold must be a whole number greater than or equal to 0.";
    }

    const numMoq = Number(formData.moq);

    if (Number.isNaN(numMoq) || numMoq < 1 || !Number.isInteger(numMoq)) {
      return "Minimum Order Quantity (MOQ) must be at least 1 unit.";
    }

    /*
     * Physical inventory protection.
     *
     * Existing product:
     * available = onHand - reserved.
     *
     * Since this form doesn't modify onHand,
     * there is no possibility of violating
     * reserved_stock <= on_hand_stock here.
     */
    if (
      isEditing &&
      Number(formData.onHandStock) < Number(formData.reservedStock)
    ) {
      return "Product inventory is in an invalid state: reserved stock cannot exceed on-hand stock.";
    }

    if (
      !formData.description.trim() ||
      formData.description.trim().length < 15
    ) {
      return "Please enter a product description (at least 15 characters).";
    }

    if (isSubmittingForReview) {
      for (const attr of categoryAttributes) {
        if (
          attr.required &&
          !String(formData.dynamicAttributes[attr.name] || "").trim()
        ) {
          return `Please fill in the required category field: "${attr.name}".`;
        }
      }

      if (formData.images.length === 0) {
        return "At least 1 product photograph is required to submit for Admin Review.";
      }
    }

    return null;
  };

  /*
   * Save / submit.
   */
  const handleSave = async (isSubmitAction) => {
    const error = validateProductPayload(isSubmitAction);

    if (error) {
      setFormError(error);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    setSavingAction(isSubmitAction ? "submit" : "draft");

    setFormError(null);
    setSuccessNotice(null);

    const featureList = formData.features
      .split("\n")
      .map((feature) => feature.trim())
      .filter(Boolean);

    const structuredAttributes = Object.entries(formData.dynamicAttributes).map(
      ([key, value]) => ({
        key,
        value,
      }),
    );

    /*
     * For newly selected local images,
     * don't send their blob URLs to Supabase.
     *
     * Existing Supabase image URLs are retained.
     */
    const existingImageUrls = formData.images.filter(
      (url) => !String(url).startsWith("blob:"),
    );

    const payload = {
      name: formData.name.trim(),

      brand: formData.brand.trim(),

      categorySlug: formData.categorySlug,

      category: formData.category,

      unit: formData.unit,

      sku: formData.sku.trim(),

      price: Number(formData.price),

      originalPrice: formData.originalPrice
        ? Number(formData.originalPrice)
        : null,

      /*
       * New product inventory.
       */
      initialStock: Number(formData.initialStock),

      /*
       * Only threshold is sent for
       * existing products.
       */
      lowStockThreshold: Number(formData.lowStockThreshold),

      /*
       * MOQ is independent of inventory.
       */
      moq: Number(formData.moq),

      description: formData.description.trim(),

      features: featureList,

      dynamicAttributes: structuredAttributes,

      imageUrls: existingImageUrls,

      status: formData.status,
    };

    try {
      if (isEditing) {
        /*
         * EDIT
         */
        await vendorProductService.updateVendorProduct(id, payload, files);

        /*
         * If submitting, update product status
         * after saving the changes.
         */
        if (isSubmitAction) {
          await vendorProductService.submitProductForReview(id);

          setSuccessNotice(
            formData.status === PRODUCT_APPROVAL_STATUS.PUBLISHED ||
              formData.status === PRODUCT_APPROVAL_STATUS.APPROVED
              ? "Product updates submitted for Admin Review. Changes will reflect once verified."
              : "Product submitted successfully for Admin Review.",
          );
        } else {
          setSuccessNotice("Product updated successfully.");
        }
      } else {
        /*
         * NEW PRODUCT
         *
         * createVendorProduct:
         * 1. creates vendor_products
         * 2. creates vendor_inventory
         * 3. uploads images
         */
        const created = await vendorProductService.createVendorProduct(
          payload,
          files,
        );

        /*
         * createVendorProduct already submits
         * the product with SUBMITTED status.
         */
        if (isSubmitAction) {
          setSuccessNotice(
            "Product successfully created and submitted for Admin Review.",
          );
        } else {
          /*
           * For Save as Draft, create the product
           * as a draft instead.
           *
           * Since createVendorProduct intentionally
           * submits products, use saveProductDraft
           * instead when draft was requested.
           */
          /*
           * This branch is not used because the
           * draft action below is handled separately.
           */
          setSuccessNotice(
            created ? "Product successfully created." : "Product saved.",
          );
        }
      }

      setTimeout(() => {
        navigate("/vendor/products");
      }, 1200);
    } catch (error) {
      setFormError(error.message || "Failed to save product.");
    } finally {
      setSavingAction(null);
    }
  };

  /*
   * Dedicated draft handler.
   *
   * New product drafts need to use saveProductDraft()
   * instead of createVendorProduct().
   */
  const handleSaveDraft = async () => {
    const error = validateProductPayload(false);

    if (error) {
      setFormError(error);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    setSavingAction("draft");
    setFormError(null);
    setSuccessNotice(null);

    const featureList = formData.features
      .split("\n")
      .map((feature) => feature.trim())
      .filter(Boolean);

    const structuredAttributes = Object.entries(formData.dynamicAttributes).map(
      ([key, value]) => ({
        key,
        value,
      }),
    );

    const existingImageUrls = formData.images.filter(
      (url) => !String(url).startsWith("blob:"),
    );

    const payload = {
      name: formData.name.trim(),

      brand: formData.brand.trim(),

      categorySlug: formData.categorySlug,

      unit: formData.unit,

      sku: formData.sku.trim(),

      price: formData.price ? Number(formData.price) : null,

      originalPrice: formData.originalPrice
        ? Number(formData.originalPrice)
        : null,

      initialStock: Number(formData.initialStock),

      lowStockThreshold: Number(formData.lowStockThreshold),

      moq: Number(formData.moq),

      description: formData.description.trim(),

      features: featureList,

      dynamicAttributes: structuredAttributes,

      imageUrls: existingImageUrls,

      status: PRODUCT_APPROVAL_STATUS.DRAFT,
    };

    try {
      await vendorProductService.saveProductDraft(
        payload,
        isEditing ? id : null,
        files,
      );

      setSuccessNotice("Product saved as Draft.");

      setTimeout(() => {
        navigate("/vendor/products");
      }, 1200);
    } catch (error) {
      setFormError(error.message || "Failed to save product draft.");
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

  const displayedStock = isEditing
    ? Number(formData.availableStock || 0)
    : Number(formData.initialStock || 0);

  const isOutOfStock = displayedStock <= 0;

  const isLowStock =
    displayedStock > 0 &&
    displayedStock <= Number(formData.lowStockThreshold || 10);

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6 pb-24 font-sans">
      <SeoHead
        title={
          isEditing
            ? "Edit Product Listing | Ferrado Vendor"
            : "Add New Product | Ferrado Vendor"
        }
        description="Create or update construction product listings with inventory specifications and MOQ terms."
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

      {/* Moderation Notice */}
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
                Editing product information or photographs on an approved
                product requires review by Ferrado before the changes appear on
                the customer storefront.
              </p>
            </div>
          </div>
        )}

      {/* Form Container */}
      <div className="gm-panel p-6 sm:p-8 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-6 shadow-xs">
        {/* 1. Identification */}
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
                  setFormData({
                    ...formData,
                    name: e.target.value,
                  })
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
                  setFormData({
                    ...formData,
                    brand: e.target.value,
                  })
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
                disabled={categoriesLoading}
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-bold disabled:opacity-60"
              >
                <option value="">
                  {categoriesLoading
                    ? "Loading categories..."
                    : "Select Category"}
                </option>

                {categories.map((cat) => (
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
                  setFormData({
                    ...formData,
                    unit: e.target.value,
                  })
                }
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-bold"
              >
                {availableUnits.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
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
                  setFormData({
                    ...formData,
                    sku: e.target.value,
                  })
                }
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* 2. Category Attributes */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9E2EA] pb-2">
            <div>
              <h2 className="text-sm font-bold text-[#173885]">
                2. Category Technical Specifications
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
                    <option value="">
                      Select {attr.name}
                      ...
                    </option>

                    {attr.allowedValues?.map((value) => (
                      <option key={value} value={value}>
                        {value}
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

        {/* 3. Pricing + Inventory + MOQ */}
        <div className="space-y-4 pt-2">
          <h2 className="text-sm font-bold text-[#173885] border-b border-[#D9E2EA] pb-2">
            3. Pricing, Inventory & MOQ
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  setFormData({
                    ...formData,
                    price: e.target.value,
                  })
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
                  setFormData({
                    ...formData,
                    originalPrice: e.target.value,
                  })
                }
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono"
              />
            </div>

            {/* Inventory */}
            <div>
              <label className="text-xs font-bold text-[#282926] block mb-1">
                {isEditing
                  ? `Available Quantity (${formData.unit})`
                  : `Initial On-Hand (${formData.unit}) *`}
              </label>

              <input
                type="number"
                min={0}
                step={1}
                placeholder="500"
                value={
                  isEditing ? formData.availableStock : formData.initialStock
                }
                disabled={isEditing}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    initialStock: e.target.value,
                  })
                }
                className={`w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold ${
                  isEditing ? "bg-[#F4F6FA] cursor-not-allowed opacity-80" : ""
                }`}
              />

              {isEditing && (
                <p className="text-[10px] text-[#6F8A92] mt-1">
                  Physical stock is managed from Inventory Management.
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-[#282926] block mb-1">
                MOQ ({formData.unit}s) *
              </label>

              <input
                type="number"
                required
                min={1}
                step={1}
                placeholder="10"
                value={formData.moq}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    moq: e.target.value,
                  })
                }
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* Inventory details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 rounded-xl bg-[#F4F6FA] border border-[#D9E2EA]">
              <p className="text-[10px] uppercase tracking-wide font-bold text-[#6F8A92]">
                On-Hand
              </p>

              <p className="text-sm font-black text-[#173885] mt-1">
                {isEditing ? formData.onHandStock : formData.initialStock}{" "}
                {formData.unit}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#F4F6FA] border border-[#D9E2EA]">
              <p className="text-[10px] uppercase tracking-wide font-bold text-[#6F8A92]">
                Reserved
              </p>

              <p className="text-sm font-black text-[#173885] mt-1">
                {isEditing ? formData.reservedStock : 0} {formData.unit}
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-[#282926] block mb-1">
                Low Stock Threshold
              </label>

              <input
                type="number"
                min={0}
                step={1}
                value={formData.lowStockThreshold}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lowStockThreshold: e.target.value,
                  })
                }
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold"
              />

              <p className="text-[10px] text-[#6F8A92] mt-1">Default: 10</p>
            </div>
          </div>

          {/* Stock status */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs p-3 rounded-xl bg-[#F4F6FA] border border-[#D9E2EA]">
            <div>
              <span className="text-[#606460]">Available Stock:</span>

              <strong className="text-[#173885] ml-1">
                {displayedStock} {formData.unit}
              </strong>
            </div>

            <span
              className={`px-3 py-0.5 rounded-full font-bold text-[10px] ${
                isOutOfStock
                  ? "bg-[#FBE3DE] text-[#B43D20]"
                  : isLowStock
                    ? "bg-[#FFF0D5] text-[#A66A08]"
                    : "bg-[#E1F2D9] text-[#3F7D20]"
              }`}
            >
              {isOutOfStock
                ? "Out of Stock"
                : isLowStock
                  ? "Low Stock"
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
                setFormData({
                  ...formData,
                  description: e.target.value,
                })
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
              placeholder={
                "IS 1489 Part 1 Certified\nMicro-fine particle grade\n50 kg tamper-proof packing"
              }
              value={formData.features}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  features: e.target.value,
                })
              }
              className="w-full gm-input p-3 rounded-xl text-xs leading-relaxed font-mono"
            />
          </div>
        </div>

        {/* 5. Product Images */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-2">
            <div>
              <h2 className="text-sm font-bold text-[#173885]">
                5. Product Photographs
              </h2>

              <p className="text-[11px] text-[#606460]">
                First image serves as the primary catalogue cover.
              </p>
            </div>

            <span className="text-[11px] text-[#6F8A92]">
              {formData.images.length} / 5
            </span>
          </div>

          {imageUploadError && (
            <div className="p-3 rounded-xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs">
              {imageUploadError}
            </div>
          )}

          {optimizationStatus && (
            <div className="p-3 rounded-xl bg-[#E4EEF3] border border-[#3C7DDA]/30 text-[#173885] text-xs font-bold flex items-center gap-2">
              <span>{optimizationStatus}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {formData.images.map((imgUrl, idx) => (
              <div
                key={`${imgUrl}-${idx}`}
                className="relative w-28 h-28 rounded-2xl overflow-hidden border border-[#D9E2EA] bg-[#F4F6FA] group"
              >
                <img
                  src={imgUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />

                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 p-1 rounded-lg bg-[#173885]/80 text-[#FEFEFE] hover:bg-[#B43D20] transition z-10"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#173885]/90 to-transparent p-1.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveImage(idx, idx - 1)}
                    className="p-1 rounded bg-[#FEFEFE]/20 text-[#FEFEFE] disabled:opacity-30 hover:bg-[#FEFEFE]/40"
                    title="Move left"
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
                  {isUploadingImage ? "Optimizing..." : "Upload Image"}
                </span>

                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  disabled={isUploadingImage || Boolean(savingAction)}
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <p className="text-[10px] text-[#6F8A92]">
            Images are optimized in the browser first and uploaded only when you
            save the product.
          </p>
        </div>

        {/* Actions */}
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
              onClick={handleSaveDraft}
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
