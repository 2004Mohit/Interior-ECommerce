import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Layers,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Image,
  Globe,
  Tag,
} from "lucide-react";
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
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
  });

  const [loading, setLoading] = useState(!isNew);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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
            meta_title: cat.meta_title || "",
            meta_description: cat.meta_description || "",
            meta_keywords: Array.isArray(cat.meta_keywords)
              ? cat.meta_keywords.join(", ")
              : "",
          });
        })
        .catch((err) =>
          setError(err.message || "Failed to load category details."),
        )
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      setError("Category Name and Slug are required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const keywordsArray = formData.meta_keywords
        ? formData.meta_keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean)
        : [];

      await adminCatalogueService.saveCategory({
        ...formData,
        meta_keywords: keywordsArray,
      });

      setSuccess(`Category "${formData.name}" saved successfully.`);
      setTimeout(() => navigate("/admin/categories"), 1200);
    } catch (err) {
      setError(err.message || "Failed to save category.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.MANAGE_CATEGORIES}>
      <div className="max-w-3xl mx-auto space-y-6 pb-24 font-sans">
        <SeoHead
          title={`${isNew ? "Create" : "Edit"} Category | GateMate Admin`}
          description="Manage construction category specifications, ordering, and search engine optimization metadata."
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
                Configure taxonomy parameters, display order, and marketplace
                SEO indexing.
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
                  Category Image URL
                </label>
                <div className="relative">
                  <Image className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92]" />
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.image_url}
                    onChange={(e) =>
                      setFormData({ ...formData, image_url: e.target.value })
                    }
                    className="w-full gm-input pl-10 pr-3.5 py-2.5 rounded-xl text-xs font-mono"
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

            {/* SEO Metadata Card */}
            <div className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 border-b border-[#D9E2EA] pb-3 text-xs font-bold text-[#173885]">
                <Globe className="w-4 h-4 text-[#3C7DDA]" />
                <span>Search Engine Optimization (SEO)</span>
              </div>

              <div>
                <label className="text-xs font-bold text-[#282926] block mb-1">
                  Meta Title
                </label>
                <input
                  type="text"
                  placeholder="Buy Ready-Mix Concrete in Pune | GateMate Express Delivery"
                  value={formData.meta_title}
                  onChange={(e) =>
                    setFormData({ ...formData, meta_title: e.target.value })
                  }
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#282926] block mb-1">
                  Meta Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Order certified construction products with 30-minute priority dispatch across Pune..."
                  value={formData.meta_description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      meta_description: e.target.value,
                    })
                  }
                  className="w-full gm-input p-3 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#282926] block mb-1">
                  Meta Keywords (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="ready-mix concrete, M25 concrete, construction supply pune, transit mixer"
                  value={formData.meta_keywords}
                  onChange={(e) =>
                    setFormData({ ...formData, meta_keywords: e.target.value })
                  }
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
                />
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
