import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Layers,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Image,
  Upload,
  X,
} from "lucide-react";

import { supabase } from "../../lib/supabaseClient";
import { adminCatalogueService } from "../../services/adminCatalogueService";
import { AdminPermissionGuard } from "./AdminPermissionGuard";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";
import { SeoHead } from "../common/SeoHead";

export const AdminCategoryEditView = () => {
  const { id } = useParams(); // 'new' or category slug
  const navigate = useNavigate();
  const isNew = !id || id === "new";

  const [formData, setFormData] = useState({
    slug: "",
    name: "",
    descriptor: "",
    image_url: "",
    display_order: 0,
    is_active: true,
  });

  const [loading, setLoading] = useState(!isNew);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageProcessing, setImageProcessing] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isNew) {
      adminCatalogueService
        .getCategoryBySlug(id)
        .then((cat) => {
          setFormData({
            slug: cat.slug,
            name: cat.name,
            descriptor: cat.descriptor || "",
            image_url: cat.image_url || "",
            display_order: cat.display_order || 0,
            is_active: Boolean(cat.is_active),
          });
          setImagePreview(cat.image_url || "");
        })
        .catch((err) =>
          setError(err.message || "Failed to load category details."),
        )
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  const compressCategoryImage = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const img = new window.Image();

        img.onload = () => {
          const MAX_SIZE = 800;

          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Could not process the selected image."));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Could not compress the selected image."));
                return;
              }

              if (blob.size > 350 * 1024) {
                reject(
                  new Error(
                    "The processed image is still larger than 350 KB. Please choose a simpler image.",
                  ),
                );
                return;
              }

              const compressedFile = new File(
                [blob],
                `${Date.now()}-category.webp`,
                {
                  type: "image/webp",
                  lastModified: Date.now(),
                },
              );

              resolve(compressedFile);
            },
            "image/webp",
            0.82,
          );
        };

        img.onerror = () => {
          reject(new Error("The selected image could not be read."));
        };

        img.src = reader.result;
      };

      reader.onerror = () => {
        reject(new Error("The selected image could not be read."));
      };

      reader.readAsDataURL(file);
    });

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setError(null);

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG, and WebP images are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Original category image must be smaller than 2 MB.");
      e.target.value = "";
      return;
    }

    try {
      setImageProcessing(true);

      const compressedFile = await compressCategoryImage(file);

      setSelectedImage(compressedFile);

      const previewUrl = URL.createObjectURL(compressedFile);
      setImagePreview(previewUrl);
    } catch (err) {
      setError(err.message || "Failed to process category image.");
      setSelectedImage(null);
      setImagePreview("");
      e.target.value = "";
    } finally {
      setImageProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.slug.trim()) {
      setError("Category Name and Slug are required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    let uploadedImagePath = null;

    try {
      let imageUrl = formData.image_url || "";

      /*
       * Upload only when the admin selected a new image.
       */
      if (selectedImage) {
        setSuccess("Uploading category image...");

        const uploadResult = await adminCatalogueService.uploadCategoryImage(
          selectedImage,
          formData.slug,
        );

        imageUrl = uploadResult.publicUrl;
        uploadedImagePath = uploadResult.filePath;
      }

      setSuccess("Saving category...");

      await adminCatalogueService.saveCategory({
        ...formData,
        image_url: imageUrl,
      });

      setSuccess(`Category "${formData.name}" saved successfully.`);

      setTimeout(() => navigate("/admin/categories"), 1200);
    } catch (err) {
      /*
       * If the image upload succeeded but category saving failed,
       * remove the newly uploaded file so we don't create an
       * orphaned Storage object.
       */
      if (uploadedImagePath) {
        await supabase.storage
          .from("category-images")
          .remove([uploadedImagePath])
          .catch(() => {});
      }

      setError(err.message || "Failed to save category.");
      setSuccess(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.MANAGE_CATEGORIES}>
      <div className="max-w-3xl mx-auto space-y-6 pb-24 font-sans">
        <SeoHead
          title={`${isNew ? "Create" : "Edit"} Category | Ferrado Admin`}
          description="Manage construction category details, ordering, and marketplace visibility."
          canonicalUrl={`/admin/categories/${id}`}
          noIndex={true}
        />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-5">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/categories"
              className="p-2 rounded-xl bg-[#FEFEFE] border border-[#D9E2EA] text-[#606460] hover:text-[#173885] hover:bg-[#E4EEF3] transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#173885]">
                {isNew
                  ? "Create Construction Category"
                  : `Edit Category: ${formData.name}`}
              </h1>
              <p className="text-xs text-[#606460]">
                Configure category details, display order, and marketplace
                visibility.
              </p>
            </div>
          </div>
        </div>

        {success && (
          <div className="p-4 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="h-96 bg-[#FEFEFE] rounded-3xl border border-[#D9E2EA] animate-pulse" />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Primary Details */}
            <div className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 border-b border-[#D9E2EA] pb-3 text-xs font-bold text-[#173885]">
                <Layers className="w-4 h-4 text-[#3C7DDA]" />
                <span>Core Category Information</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ready-Mix Concrete"
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData({
                        ...formData,
                        name,
                        slug: isNew
                          ? name
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/(^-|-$)/g, "")
                          : formData.slug,
                      });
                    }}
                    className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    URL Identifier (Slug) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isNew}
                    placeholder="ready-mix-concrete"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                      })
                    }
                    className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono disabled:bg-[#F4F6FA] disabled:text-[#6F8A92]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#282926] block mb-1">
                  Descriptor / Subtitle
                </label>
                <input
                  type="text"
                  placeholder="e.g. M20 to M40 certified batch mixes with transit-mixer delivery"
                  value={formData.descriptor}
                  onChange={(e) =>
                    setFormData({ ...formData, descriptor: e.target.value })
                  }
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#282926] block mb-1">
                  Category Image
                </label>

                <div className="border border-[#D9E2EA] rounded-2xl p-4 bg-[#F8FBFD]">
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    {/* Image Preview */}
                    <div className="w-32 h-32 rounded-xl overflow-hidden border border-[#D9E2EA] bg-[#FEFEFE] flex items-center justify-center shrink-0">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Category preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image className="w-8 h-8 text-[#9AAAB5]" />
                      )}
                    </div>

                    {/* Upload Controls */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-xs font-bold text-[#173885]">
                          Upload Category Image
                        </p>

                        <p className="text-[11px] text-[#606460] mt-1">
                          JPG, PNG, or WebP. Maximum original size 2 MB. The
                          image will automatically be resized to a maximum of
                          800 × 800 pixels and compressed to WebP.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {/* Choose / Replace */}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={imageProcessing || submitting}
                          className="btn-gm-secondary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-50"
                        >
                          <Upload className="w-4 h-4" />

                          {imageProcessing
                            ? "Processing Image..."
                            : imagePreview
                              ? "Replace Image"
                              : "Choose Image"}
                        </button>

                        {/* Remove */}
                        {imagePreview && selectedImage && (
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            disabled={submitting}
                            className="px-4 py-2 rounded-xl border border-[#D9E2EA] text-[#B43D20] text-xs font-bold flex items-center gap-2 hover:bg-[#FBE3DE] transition disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                            Remove
                          </button>
                        )}
                      </div>

                      {/* Processed Size */}
                      {selectedImage && (
                        <p className="text-[10px] font-mono text-[#3F7D20]">
                          Processed size:{" "}
                          {(selectedImage.size / 1024).toFixed(0)} KB
                        </p>
                      )}

                      {/* Existing Image Information */}
                      {!selectedImage && formData.image_url && (
                        <p className="text-[10px] text-[#606460]">
                          Existing category image will remain unchanged unless
                          you choose a new image.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        display_order: e.target.value,
                      })
                    }
                    className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-[#173885]">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                      className="rounded border-[#D9E2EA] text-[#173885] focus:ring-[#173885]"
                    />
                    <span>Active in Marketplace Storefront</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                to="/admin/categories"
                className="btn-gm-secondary px-5 py-2.5 rounded-xl text-xs font-bold"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="btn-gm-primary px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-[#FEFEFE]" />
                <span>
                  {submitting ? "Saving Category..." : "Save Category"}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminPermissionGuard>
  );
};
