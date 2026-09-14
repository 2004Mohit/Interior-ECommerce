import React, { useState, useEffect } from "react";
import {
  Tag,
  PlusCircle,
  RotateCcw,
  Edit3,
  CheckCircle2,
  AlertCircle,
  X,
  Calendar,
  Layers,
  Package,
} from "lucide-react";
import { adminContentService } from "../../services/adminContentService";
import { adminCatalogueService } from "../../services/adminCatalogueService";
import { AdminPermissionGuard } from "./AdminPermissionGuard";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";
import { SeoHead } from "../common/SeoHead";

export const AdminPromotionsView = () => {
  const [promotions, setPromotions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Form State
  const [editingPromo, setEditingPromo] = useState(null);
  const [formData, setFormData] = useState({
    campaign_name: "",
    title: "",
    description: "",
    banner_id: "",
    applicable_category_slug: "",
    display_priority: 0,
    is_active: true,
    start_at: "",
    end_at: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [promoRes, catList, bannerRes] = await Promise.all([
        adminContentService.getPromotions({ limit: 100 }),
        adminCatalogueService.getCategories(),
        adminContentService.getBanners({ limit: 50 }),
      ]);
      setPromotions(promoRes.promotions);
      setCategories(catList || []);
      setBanners(bannerRes.banners || []);
    } catch (err) {
      setError(err.message || "Failed to load promotional campaigns.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingPromo("NEW");
    setFormData({
      campaign_name: "",
      title: "",
      description: "",
      banner_id: "",
      applicable_category_slug: "",
      display_priority: 0,
      is_active: true,
      start_at: new Date().toISOString().slice(0, 16),
      end_at: "",
    });
  };

  const openEditModal = (p) => {
    setEditingPromo(p);
    setFormData({
      id: p.id,
      campaign_name: p.campaign_name,
      title: p.title,
      description: p.description || "",
      banner_id: p.banner_id || "",
      applicable_category_slug: p.applicable_category_slug || "",
      display_priority: p.display_priority || 0,
      is_active: Boolean(p.is_active),
      start_at: p.start_at
        ? new Date(p.start_at).toISOString().slice(0, 16)
        : "",
      end_at: p.end_at ? new Date(p.end_at).toISOString().slice(0, 16) : "",
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.campaign_name.trim() || !formData.title.trim()) {
      setError("Campaign Name and Customer Title are strictly required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await adminContentService.savePromotion({
        ...formData,
        id: editingPromo !== "NEW" ? editingPromo.id : null,
        banner_id: formData.banner_id || null,
        applicable_category_slug: formData.applicable_category_slug || null,
      });

      setActionSuccess(`Campaign "${formData.campaign_name}" saved.`);
      setEditingPromo(null);
      loadData();
    } catch (err) {
      setError(err.message || "Failed to save promotion.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.MANAGE_CONTENT}>
      <div className="space-y-6 pb-20 font-sans">
        <SeoHead
          title="Promotions & Campaigns | GateMate Admin"
          description="Manage controlled seasonal construction campaigns, category spotlights, and customer promotions."
          canonicalUrl="/admin/promotions"
          noIndex={true}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
          <div>
            <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Controlled Promotions Engine
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
              Promotional Campaigns Console
            </h1>
            <p className="text-xs text-[#606460]">
              Configure high-visibility regional promotional campaigns without
              complex coupon overhead.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openCreateModal}
              className="btn-gm-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <PlusCircle className="w-4 h-4 text-[#FEFEFE]" />
              <span>Create Campaign</span>
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

        {/* Promotions Master Table */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-[#FEFEFE] rounded-2xl border border-[#D9E2EA]"
              />
            ))}
          </div>
        ) : promotions.length === 0 ? (
          <div className="gm-panel p-12 rounded-3xl border border-[#D9E2EA] text-center space-y-2 bg-[#FEFEFE]">
            <Tag className="w-10 h-10 text-[#6F8A92] mx-auto" />
            <h2 className="text-base font-bold text-[#173885]">
              No Promotional Campaigns
            </h2>
            <p className="text-xs text-[#606460]">
              Create a promotional campaign to spotlight key construction
              materials in Pune & PCMC.
            </p>
          </div>
        ) : (
          <div className="gm-panel rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F6FA] border-b border-[#D9E2EA] text-[10px] font-bold uppercase text-[#6F8A92]">
                <tr>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Campaign Name & Title</th>
                  <th className="p-4">Applicable Scope</th>
                  <th className="p-4">Schedule Window</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E2EA]">
                {promotions.map((p) => {
                  const now = new Date();
                  const isStarted = new Date(p.start_at) <= now;
                  const isEnded = p.end_at ? new Date(p.end_at) < now : false;
                  const isLive = p.is_active && isStarted && !isEnded;

                  return (
                    <tr key={p.id} className="hover:bg-[#F4F6FA]/50 transition">
                      <td className="p-4 font-mono font-bold text-[#173885]">
                        #{p.display_priority}
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-[#173885] block">
                          {p.campaign_name}
                        </span>
                        <span className="text-[11px] text-[#606460]">
                          {p.title}
                        </span>
                      </td>

                      <td className="p-4">
                        {p.applicable_category_slug ? (
                          <span className="badge-gm-info px-2.5 py-0.5 rounded-md text-[11px] font-bold">
                            Category: {p.applicable_category_slug}
                          </span>
                        ) : (
                          <span className="text-[#6F8A92]">
                            Storewide Campaign
                          </span>
                        )}
                      </td>

                      <td className="p-4 font-mono text-[11px] text-[#606460]">
                        <div>
                          Start:{" "}
                          {new Date(p.start_at).toLocaleDateString("en-IN")}
                        </div>
                        <div>
                          End:{" "}
                          {p.end_at
                            ? new Date(p.end_at).toLocaleDateString("en-IN")
                            : "Ongoing"}
                        </div>
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            isLive
                              ? "bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30"
                              : !p.is_active
                                ? "bg-[#F4F6FA] text-[#606460]"
                                : isEnded
                                  ? "bg-[#FBE3DE] text-[#B43D20]"
                                  : "bg-[#FFF0D5] text-[#A66A08]"
                          }`}
                        >
                          {isLive
                            ? "LIVE"
                            : !p.is_active
                              ? "DISABLED"
                              : isEnded
                                ? "EXPIRED"
                                : "SCHEDULED"}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg border border-[#D9E2EA] text-[#606460] hover:text-[#173885] hover:bg-[#E4EEF3] transition"
                          title="Edit Campaign"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        {editingPromo && (
          <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-lg p-6 sm:p-8 rounded-3xl relative shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-[#D9E2EA] pb-3">
                <h3 className="text-lg font-black text-[#173885]">
                  {editingPromo === "NEW"
                    ? "Create Promotional Campaign"
                    : "Edit Campaign"}
                </h3>
                <button
                  onClick={() => setEditingPromo(null)}
                  className="text-[#606460] hover:text-[#282926]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Internal Campaign Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Monsoon Bulk Cement Special"
                    value={formData.campaign_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        campaign_name: e.target.value,
                      })
                    }
                    className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Customer-Facing Headline *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priority Transit-Mix Concrete Dispatch"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Description / Campaign Terms
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Guaranteed 30-min site dispatch on full truckload orders in Hadapsar..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full gm-input p-3 rounded-xl text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#282926] block mb-1">
                      Applicable Category
                    </label>
                    <select
                      value={formData.applicable_category_slug}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          applicable_category_slug: e.target.value,
                        })
                      }
                      className="w-full gm-input px-3 py-2 rounded-xl text-xs font-bold"
                    >
                      <option value="">Storewide (All Categories)</option>
                      {categories.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#282926] block mb-1">
                      Linked Banner Reference
                    </label>
                    <select
                      value={formData.banner_id}
                      onChange={(e) =>
                        setFormData({ ...formData, banner_id: e.target.value })
                      }
                      className="w-full gm-input px-3 py-2 rounded-xl text-xs font-bold"
                    >
                      <option value="">None (Text-only campaign)</option>
                      {banners.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-bold text-[#282926] block mb-1">
                      Start Date
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
                      End Date (Optional)
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

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <label className="text-xs font-bold text-[#282926] block mb-1">
                      Priority Ranking
                    </label>
                    <input
                      type="number"
                      value={formData.display_priority}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          display_priority: e.target.value,
                        })
                      }
                      className="w-24 gm-input px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-[#173885] pt-5">
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
                    <span>Campaign Enabled</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#D9E2EA]">
                  <button
                    type="button"
                    onClick={() => setEditingPromo(null)}
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
                    <span>{submitting ? "Saving..." : "Save Campaign"}</span>
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
