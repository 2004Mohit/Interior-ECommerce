import React, { useState, useEffect } from "react";
import {
  Image as ImageIcon,
  PlusCircle,
  Search,
  Filter,
  RotateCcw,
  Edit3,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Layers,
  X,
  Calendar,
} from "lucide-react";
import { adminContentService } from "../../services/adminContentService";
import { adminCatalogueService } from "../../services/adminCatalogueService";
import { AdminPermissionGuard } from "./AdminPermissionGuard";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";
import { SeoHead } from "../common/SeoHead";

const BANNER_TYPES = [
  { label: "All Banners", value: "ALL" },
  { label: "Homepage", value: "HOMEPAGE" },
  { label: "Category Promotions", value: "CATEGORY" },
  { label: "Campaigns", value: "CAMPAIGN" },
];

export const AdminBannersView = () => {
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bannerType, setBannerType] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Edit / Create Modal State
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    banner_type: "HOMEPAGE",
    title: "",
    subtitle: "",
    image_url: "",
    cta_text: "Explore Products",
    target_url: "/products",
    category_slug: "",
    display_order: 0,
    is_active: true,
    start_at: "",
    end_at: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bannerRes, catList] = await Promise.all([
        adminContentService.getBanners({ bannerType, limit: 100 }),
        adminCatalogueService.getCategories(),
      ]);
      setBanners(bannerRes.banners);
      setCategories(catList || []);
    } catch (err) {
      setError(err.message || "Failed to load marketing banners.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [bannerType]);

  const openCreateModal = () => {
    setEditingBanner("NEW");
    setFormData({
      banner_type: "HOMEPAGE",
      title: "",
      subtitle: "",
      image_url: "",
      cta_text: "Explore Products",
      target_url: "/products",
      category_slug: "",
      display_order: banners.length,
      is_active: true,
      start_at: new Date().toISOString().slice(0, 16),
      end_at: "",
    });
  };

  const openEditModal = (b) => {
    setEditingBanner(b);
    setFormData({
      id: b.id,
      banner_type: b.banner_type,
      title: b.title,
      subtitle: b.subtitle || "",
      image_url: b.image_url,
      cta_text: b.cta_text || "Explore Now",
      target_url: b.target_url,
      category_slug: b.category_slug || "",
      display_order: b.display_order || 0,
      is_active: Boolean(b.is_active),
      start_at: b.start_at
        ? new Date(b.start_at).toISOString().slice(0, 16)
        : "",
      end_at: b.end_at ? new Date(b.end_at).toISOString().slice(0, 16) : "",
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.title.trim() ||
      !formData.image_url.trim() ||
      !formData.target_url.trim()
    ) {
      setError("Title, Image URL, and Target URL are strictly required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await adminContentService.saveBanner({
        ...formData,
        id: editingBanner !== "NEW" ? editingBanner.id : null,
        category_slug:
          formData.banner_type === "CATEGORY" ? formData.category_slug : null,
      });

      setActionSuccess(`Banner "${formData.title}" saved successfully.`);
      setEditingBanner(null);
      loadData();
    } catch (err) {
      setError(err.message || "Failed to save banner.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBanner = async (bannerId, title) => {
    if (!window.confirm(`Are you sure you want to delete banner "${title}"?`))
      return;
    try {
      await adminContentService.deleteBanner(bannerId);
      setActionSuccess(`Banner "${title}" deleted.`);
      loadData();
    } catch (err) {
      setError(err.message || "Failed to delete banner.");
    }
  };

  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.MANAGE_CONTENT}>
      <div className="space-y-6 pb-20 font-sans">
        <SeoHead
          title="Marketing Banners & Visual Content | GateMate Admin"
          description="Manage homepage hero banners, category promotions, and scheduled promotional visual campaigns."
          canonicalUrl="/admin/banners"
          noIndex={true}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
          <div>
            <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Storefront Visual Merchandising
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
              Marketing Banners Management
            </h1>
            <p className="text-xs text-[#606460]">
              Create, schedule, and organize customer storefront banners,
              call-to-actions, and category landing links.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openCreateModal}
              className="btn-gm-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <PlusCircle className="w-4 h-4 text-[#FEFEFE]" />
              <span>Create Banner</span>
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <RotateCcw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="gm-panel p-4 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] flex items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <Filter className="w-3.5 h-3.5 text-[#6F8A92] shrink-0 mr-1" />
            {BANNER_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setBannerType(t.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                  bannerType === t.value
                    ? "bg-[#173885] text-[#FEFEFE] shadow-xs"
                    : "bg-[#F4F6FA] text-[#606460] hover:bg-[#E4EEF3] hover:text-[#173885]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <span className="text-xs font-mono text-[#6F8A92] hidden sm:inline">
            {banners.length} Banners Configured
          </span>
        </div>

        {/* Banners Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-48 bg-[#FEFEFE] rounded-2xl border border-[#D9E2EA]"
              />
            ))}
          </div>
        ) : banners.length === 0 ? (
          <div className="gm-panel p-12 rounded-3xl border border-[#D9E2EA] text-center space-y-2 bg-[#FEFEFE]">
            <ImageIcon className="w-10 h-10 text-[#6F8A92] mx-auto" />
            <h2 className="text-base font-bold text-[#173885]">
              No Banners Configured
            </h2>
            <p className="text-xs text-[#606460]">
              Create a banner to highlight storefront promotions or construction
              categories.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {banners.map((b) => (
              <div
                key={b.id}
                className="gm-panel rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] overflow-hidden shadow-2xs flex flex-col justify-between"
              >
                <div className="relative h-40 bg-[#F4F6FA] border-b border-[#D9E2EA] overflow-hidden">
                  <img
                    src={b.image_url}
                    alt={b.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-[#173885] text-[#FEFEFE]">
                      #{b.display_order} • {b.banner_type}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-black ${
                        b.is_active
                          ? "bg-[#E1F2D9] text-[#3F7D20]"
                          : "bg-[#FBE3DE] text-[#B43D20]"
                      }`}
                    >
                      {b.is_active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-[#173885]">
                      {b.title}
                    </h3>
                    {b.subtitle && (
                      <p className="text-xs text-[#606460]">{b.subtitle}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-[#6F8A92] pt-1">
                      <span>
                        CTA:{" "}
                        <strong className="text-[#282926]">{b.cta_text}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Target:{" "}
                        <strong className="text-[#3C7DDA] font-mono">
                          {b.target_url}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#D9E2EA] pt-3 text-xs">
                    <span className="text-[10px] text-[#6F8A92] font-mono">
                      Start: {new Date(b.start_at).toLocaleDateString("en-IN")}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(b)}
                        className="p-1.5 rounded-lg border border-[#D9E2EA] text-[#606460] hover:text-[#173885] hover:bg-[#E4EEF3] transition"
                        title="Edit Banner"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBanner(b.id, b.title)}
                        className="p-1.5 rounded-lg border border-[#B43D20]/30 text-[#B43D20] hover:bg-[#FBE3DE] transition"
                        title="Delete Banner"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create / Edit Modal */}
        {editingBanner && (
          <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-lg p-6 sm:p-8 rounded-3xl relative shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex justify-between items-center border-b border-[#D9E2EA] pb-3">
                <h3 className="text-lg font-black text-[#173885]">
                  {editingBanner === "NEW"
                    ? "Create Marketing Banner"
                    : "Edit Banner"}
                </h3>
                <button
                  onClick={() => setEditingBanner(null)}
                  className="text-[#606460] hover:text-[#282926]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#282926] block mb-1">
                      Banner Type *
                    </label>
                    <select
                      value={formData.banner_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          banner_type: e.target.value,
                        })
                      }
                      className="w-full gm-input px-3 py-2 rounded-xl text-xs font-bold"
                    >
                      <option value="HOMEPAGE">Homepage Hero</option>
                      <option value="CATEGORY">Category Promotional</option>
                      <option value="CAMPAIGN">Campaign Highlight</option>
                    </select>
                  </div>

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
                      className="w-full gm-input px-3.5 py-2 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Banner Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pune Express Concrete Delivery"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Subtitle / Descriptor
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Certified M25 & M30 Batch Mixes Delivered in 30 Mins"
                    value={formData.subtitle}
                    onChange={(e) =>
                      setFormData({ ...formData, subtitle: e.target.value })
                    }
                    className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Image URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/..."
                    value={formData.image_url}
                    onChange={(e) =>
                      setFormData({ ...formData, image_url: e.target.value })
                    }
                    className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#282926] block mb-1">
                      CTA Button Text *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Order Now"
                      value={formData.cta_text}
                      onChange={(e) =>
                        setFormData({ ...formData, cta_text: e.target.value })
                      }
                      className="w-full gm-input px-3.5 py-2 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#282926] block mb-1">
                      Target Destination URL *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="/products?category=ready-mix-concrete"
                      value={formData.target_url}
                      onChange={(e) =>
                        setFormData({ ...formData, target_url: e.target.value })
                      }
                      className="w-full gm-input px-3.5 py-2 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                {formData.banner_type === "CATEGORY" && (
                  <div>
                    <label className="text-xs font-bold text-[#282926] block mb-1">
                      Associated Category
                    </label>
                    <select
                      value={formData.category_slug}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category_slug: e.target.value,
                        })
                      }
                      className="w-full gm-input px-3 py-2 rounded-xl text-xs font-bold"
                    >
                      <option value="">Select category...</option>
                      {categories.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-bold text-[#282926] block mb-1">
                      Start Schedule
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.start_at}
                      onChange={(e) =>
                        setFormData({ ...formData, start_at: e.target.value })
                      }
                      className="w-full gm-input px-2.5 py-1.5 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#282926] block mb-1">
                      End Schedule (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.end_at}
                      onChange={(e) =>
                        setFormData({ ...formData, end_at: e.target.value })
                      }
                      className="w-full gm-input px-2.5 py-1.5 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2">
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
                      className="rounded border-[#D9E2EA] text-[#173885]"
                    />
                    <span>Active in Storefront</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#D9E2EA]">
                  <button
                    type="button"
                    onClick={() => setEditingBanner(null)}
                    disabled={submitting}
                    className="btn-gm-secondary px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-gm-primary px-5 py-2 rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
                  >
                    <span>{submitting ? "Saving..." : "Save Banner"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminPermissionGuard>
  );
};
