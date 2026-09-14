import React, { useState, useEffect } from "react";
import {
  Layers,
  PlusCircle,
  Search,
  Filter,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit3,
  Trash2,
  GitMerge,
  Check,
  X,
  Building2,
  HelpCircle,
  Tag,
} from "lucide-react";
import { adminAttributeService } from "../../services/adminAttributeService";
import { adminCatalogueService } from "../../services/adminCatalogueService";
import { AdminPermissionGuard } from "./AdminPermissionGuard";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";
import { SeoHead } from "../common/SeoHead";

export const AdminAttributeReviewPanel = () => {
  const [activeTab, setActiveTab] = useState("LIBRARY"); // 'LIBRARY' | 'SUGGESTIONS'
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [search, setSearch] = useState("");

  // Data
  const [attributes, setAttributes] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Edit / Create Attribute Modal
  const [editingAttr, setEditingAttr] = useState(null);
  const [attrForm, setAttrForm] = useState({
    name: "",
    category_slug: "",
    type: "text",
    allowed_values: "",
    is_required: false,
    placeholder: "",
  });

  // Merge Attributes Modal
  const [mergeSource, setMergeSource] = useState(null);
  const [mergeTargetId, setMergeTargetId] = useState("");

  // Suggestion Decision Modal
  const [activeSuggestion, setActiveSuggestion] = useState(null);
  const [suggestionDecision, setSuggestionDecision] = useState("APPROVED");
  const [mergeTargetName, setMergeTargetName] = useState("");
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, attrs, sugs] = await Promise.all([
        adminCatalogueService.getCategories(),
        adminAttributeService.getAttributesByCategory(selectedCategory),
        adminAttributeService.getAttributeSuggestions({
          categorySlug: selectedCategory,
        }),
      ]);
      setCategories(cats);
      setAttributes(attrs);
      setSuggestions(sugs);
    } catch (err) {
      setError(err.message || "Failed to load category attributes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const openCreateModal = () => {
    setEditingAttr("NEW");
    setAttrForm({
      name: "",
      category_slug:
        selectedCategory !== "ALL"
          ? selectedCategory
          : categories[0]?.slug || "",
      type: "text",
      allowed_values: "",
      is_required: false,
      placeholder: "",
    });
  };

  const openEditModal = (attr) => {
    setEditingAttr(attr);
    setAttrForm({
      id: attr.id,
      name: attr.name,
      category_slug: attr.category_slug,
      type: attr.type,
      allowed_values: Array.isArray(attr.allowed_values)
        ? attr.allowed_values.join(", ")
        : "",
      is_required: attr.is_required,
      placeholder: attr.placeholder || "",
    });
  };

  const handleSaveAttribute = async (e) => {
    e.preventDefault();
    if (!attrForm.name.trim() || !attrForm.category_slug) {
      setError("Attribute Name and Category are required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const allowedArr =
        attrForm.type === "select"
          ? attrForm.allowed_values
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
          : [];

      await adminAttributeService.saveAttribute({
        id: editingAttr !== "NEW" ? editingAttr.id : null,
        category_slug: attrForm.category_slug,
        name: attrForm.name,
        type: attrForm.type,
        allowed_values: allowedArr,
        is_required: attrForm.is_required,
        placeholder: attrForm.placeholder,
      });

      setActionSuccess(`Attribute "${attrForm.name}" saved successfully.`);
      setEditingAttr(null);
      loadData();
    } catch (err) {
      setError(err.message || "Failed to save attribute.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMergeSubmit = async (e) => {
    e.preventDefault();
    if (!mergeTargetId) {
      setError("Please select a target attribute to merge into.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await adminAttributeService.mergeAttributes(
        mergeSource.id,
        mergeTargetId,
      );
      setActionSuccess(
        `Successfully merged "${res.sourceName}" into "${res.targetName}" across ${res.updatedProductsCount} products.`,
      );
      setMergeSource(null);
      setMergeTargetId("");
      loadData();
    } catch (err) {
      setError(err.message || "Merge failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAttribute = async (attr) => {
    if (
      !window.confirm(
        `Are you sure you want to delete attribute "${attr.name}"?`,
      )
    )
      return;
    try {
      await adminAttributeService.deleteAttribute(attr.id);
      setActionSuccess(`Attribute "${attr.name}" deleted.`);
      loadData();
    } catch (err) {
      setError(err.message || "Failed to delete attribute.");
    }
  };

  const handleProcessSuggestion = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await adminAttributeService.processSuggestion({
        suggestionId: activeSuggestion.id,
        decision: suggestionDecision,
        targetAttributeName:
          suggestionDecision === "MERGED" ? mergeTargetName : null,
        reviewerNotes,
      });

      setActionSuccess(`Suggestion marked as ${suggestionDecision}.`);
      setActiveSuggestion(null);
      setReviewerNotes("");
      setMergeTargetName("");
      loadData();
    } catch (err) {
      setError(err.message || "Failed to process suggestion.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAttributes = attributes.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.category_slug.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.MANAGE_ATTRIBUTES}>
      <div className="space-y-6 pb-20 font-sans">
        <SeoHead
          title="Category Attributes & Attribute Suggestions | GateMate Admin"
          description="Standardize technical construction attributes, merge duplicates, and review vendor attribute proposals."
          canonicalUrl="/admin/attributes"
          noIndex={true}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
          <div>
            <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Technical Specification Architecture
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
              Category Technical Attributes
            </h1>
            <p className="text-xs text-[#606460]">
              Maintain standardized product specifications, merge duplicates,
              and approve vendor attribute suggestions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openCreateModal}
              className="btn-gm-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <PlusCircle className="w-4 h-4 text-[#FEFEFE]" />
              <span>Add Attribute</span>
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

        {/* View Switcher & Filters */}
        <div className="gm-panel p-4 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-2xs">
          <div className="flex rounded-xl bg-[#F4F6FA] p-1 border border-[#D9E2EA]">
            <button
              type="button"
              onClick={() => setActiveTab("LIBRARY")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "LIBRARY"
                  ? "bg-[#FEFEFE] text-[#173885] shadow-xs"
                  : "text-[#606460]"
              }`}
            >
              Standard Attributes ({attributes.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("SUGGESTIONS")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "SUGGESTIONS"
                  ? "bg-[#FEFEFE] text-[#173885] shadow-xs"
                  : "text-[#606460]"
              }`}
            >
              Vendor Suggestions (
              {suggestions.filter((s) => s.status === "PENDING").length}{" "}
              Pending)
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92]" />
              <input
                type="text"
                placeholder="Search attribute name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full gm-input pl-9 pr-3 py-1.5 rounded-xl text-xs"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="gm-input px-3 py-1.5 rounded-xl text-xs font-bold"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TAB 1: Master Standard Attribute Library */}
        {activeTab === "LIBRARY" &&
          (loading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-[#FEFEFE] rounded-2xl border border-[#D9E2EA]"
                />
              ))}
            </div>
          ) : filteredAttributes.length === 0 ? (
            <div className="gm-panel p-12 rounded-3xl border border-[#D9E2EA] text-center space-y-2 bg-[#FEFEFE]">
              <Layers className="w-10 h-10 text-[#6F8A92] mx-auto" />
              <h2 className="text-base font-bold text-[#173885]">
                No Attributes Found
              </h2>
              <p className="text-xs text-[#606460]">
                Create a standardized technical attribute for this category.
              </p>
            </div>
          ) : (
            <div className="gm-panel rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F6FA] border-b border-[#D9E2EA] text-[10px] font-bold uppercase text-[#6F8A92]">
                  <tr>
                    <th className="p-4">Attribute Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Allowed Values</th>
                    <th className="p-4">Mandatory</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9E2EA]">
                  {filteredAttributes.map((attr) => (
                    <tr
                      key={attr.id}
                      className="hover:bg-[#F4F6FA]/50 transition"
                    >
                      <td className="p-4 font-bold text-[#173885]">
                        {attr.name}
                      </td>

                      <td className="p-4">
                        <span className="badge-gm-info px-2 py-0.5 rounded-md text-[11px] font-bold">
                          {attr.category_slug}
                        </span>
                      </td>

                      <td className="p-4 uppercase font-mono text-[11px] text-[#606460]">
                        {attr.type}
                      </td>

                      <td className="p-4 text-[#606460]">
                        {attr.allowed_values?.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {attr.allowed_values.map((v, i) => (
                              <span
                                key={i}
                                className="text-[10px] bg-[#F4F6FA] border border-[#D9E2EA] px-1.5 py-0.5 rounded"
                              >
                                {v}
                              </span>
                            ))}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            attr.is_required
                              ? "bg-[#FFF0D5] text-[#A66A08]"
                              : "bg-[#F4F6FA] text-[#606460]"
                          }`}
                        >
                          {attr.is_required ? "REQUIRED" : "OPTIONAL"}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setMergeSource(attr);
                              setMergeTargetId("");
                            }}
                            className="p-1.5 rounded-lg border border-[#3C7DDA]/30 text-[#3C7DDA] hover:bg-[#E4EEF3] transition"
                            title="Merge into Another Attribute"
                          >
                            <GitMerge className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(attr)}
                            className="p-1.5 rounded-lg border border-[#D9E2EA] text-[#606460] hover:text-[#173885] hover:bg-[#E4EEF3] transition"
                            title="Edit Attribute"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAttribute(attr)}
                            className="p-1.5 rounded-lg border border-[#B43D20]/30 text-[#B43D20] hover:bg-[#FBE3DE] transition"
                            title="Safe Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {/* TAB 2: Vendor Attribute Suggestions */}
        {activeTab === "SUGGESTIONS" &&
          (suggestions.length === 0 ? (
            <div className="gm-panel p-12 rounded-3xl border border-[#D9E2EA] text-center space-y-2 bg-[#FEFEFE]">
              <CheckCircle2 className="w-10 h-10 text-[#3F7D20] mx-auto" />
              <h2 className="text-base font-bold text-[#173885]">
                No Attribute Suggestions Pending
              </h2>
              <p className="text-xs text-[#606460]">
                All vendor attribute recommendations have been moderated.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((sug) => (
                <div
                  key={sug.id}
                  className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="space-y-1.5 flex-1 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[#173885]">
                        {sug.name}
                      </span>
                      <span className="badge-gm-info px-2 py-0.5 rounded-md text-[10px] font-bold">
                        {sug.category_slug}
                      </span>
                      <span className="font-mono uppercase text-[10px] text-[#606460]">
                        Type: {sug.type}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          sug.status === "APPROVED"
                            ? "bg-[#E1F2D9] text-[#3F7D20]"
                            : sug.status === "REJECTED"
                              ? "bg-[#FBE3DE] text-[#B43D20]"
                              : sug.status === "MERGED"
                                ? "bg-[#E4EEF3] text-[#173885]"
                                : "bg-[#FFF0D5] text-[#A66A08]"
                        }`}
                      >
                        {sug.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[#606460]">
                      <span className="flex items-center gap-1 font-semibold text-[#282926]">
                        <Building2 className="w-3.5 h-3.5 text-[#3C7DDA]" />
                        <span>
                          {sug.vendor_profiles?.business_name || "Vendor Depot"}
                        </span>
                      </span>
                      <span>•</span>
                      <span>
                        Submitted:{" "}
                        {new Date(sug.created_at).toLocaleDateString("en-IN")}
                      </span>
                    </div>

                    {sug.reason && (
                      <p className="text-[#606460]">
                        <strong>Vendor Reason:</strong> {sug.reason}
                      </p>
                    )}
                  </div>

                  {sug.status === "PENDING" && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSuggestion(sug);
                        setSuggestionDecision("APPROVED");
                        setReviewerNotes("");
                        setMergeTargetName("");
                      }}
                      className="btn-gm-primary px-4 py-2 rounded-xl text-xs font-bold shadow-xs shrink-0 self-end md:self-auto"
                    >
                      Review Suggestion
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}

        {/* Modal: Create / Edit Attribute */}
        {editingAttr && (
          <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-lg p-6 sm:p-8 rounded-3xl relative shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-[#D9E2EA] pb-3">
                <h3 className="text-lg font-black text-[#173885]">
                  {editingAttr === "NEW"
                    ? "Create Standard Attribute"
                    : `Edit Attribute: ${attrForm.name}`}
                </h3>
                <button
                  onClick={() => setEditingAttr(null)}
                  className="text-[#606460] hover:text-[#282926]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAttribute} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Target Category *
                  </label>
                  <select
                    disabled={editingAttr !== "NEW"}
                    value={attrForm.category_slug}
                    onChange={(e) =>
                      setAttrForm({
                        ...attrForm,
                        category_slug: e.target.value,
                      })
                    }
                    className="w-full gm-input px-3 py-2 rounded-xl text-xs font-bold disabled:bg-[#F4F6FA]"
                  >
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Attribute Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Compressive Strength, Cement Grade"
                    value={attrForm.name}
                    onChange={(e) =>
                      setAttrForm({ ...attrForm, name: e.target.value })
                    }
                    className="w-full gm-input px-3.5 py-2 rounded-xl text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#282926] block mb-1">
                      Field Type *
                    </label>
                    <select
                      value={attrForm.type}
                      onChange={(e) =>
                        setAttrForm({ ...attrForm, type: e.target.value })
                      }
                      className="w-full gm-input px-3 py-2 rounded-xl text-xs font-bold"
                    >
                      <option value="text">Free Text</option>
                      <option value="number">Numeric Value</option>
                      <option value="select">Dropdown Select</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-[#173885]">
                      <input
                        type="checkbox"
                        checked={attrForm.is_required}
                        onChange={(e) =>
                          setAttrForm({
                            ...attrForm,
                            is_required: e.target.checked,
                          })
                        }
                        className="rounded border-[#D9E2EA] text-[#173885] focus:ring-[#173885]"
                      />
                      <span>Mandatory on Products</span>
                    </label>
                  </div>
                </div>

                {attrForm.type === "select" && (
                  <div>
                    <label className="text-xs font-bold text-[#282926] block mb-1">
                      Allowed Values (Comma-separated) *
                    </label>
                    <input
                      type="text"
                      placeholder="M20, M25, M30, M35, M40"
                      value={attrForm.allowed_values}
                      onChange={(e) =>
                        setAttrForm({
                          ...attrForm,
                          allowed_values: e.target.value,
                        })
                      }
                      className="w-full gm-input px-3.5 py-2 rounded-xl text-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Input Placeholder / Guide
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 53 Grade (OPC)"
                    value={attrForm.placeholder}
                    onChange={(e) =>
                      setAttrForm({ ...attrForm, placeholder: e.target.value })
                    }
                    className="w-full gm-input px-3.5 py-2 rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingAttr(null)}
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
                    <span>{submitting ? "Saving..." : "Save Attribute"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Merge Attribute Tool */}
        {mergeSource && (
          <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-lg p-6 sm:p-8 rounded-3xl relative shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-[#D9E2EA] pb-3">
                <div className="flex items-center gap-2">
                  <GitMerge className="w-5 h-5 text-[#3C7DDA]" />
                  <h3 className="text-lg font-black text-[#173885]">
                    Merge Duplicate Attribute
                  </h3>
                </div>
                <button
                  onClick={() => setMergeSource(null)}
                  className="text-[#606460] hover:text-[#282926]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-[#606460]">
                Merge source attribute{" "}
                <strong className="text-[#173885]">"{mergeSource.name}"</strong>{" "}
                into a standard target attribute. Existing product technical
                data will be migrated without data loss.
              </p>

              <form onSubmit={handleMergeSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Target Standard Attribute *
                  </label>
                  <select
                    required
                    value={mergeTargetId}
                    onChange={(e) => setMergeTargetId(e.target.value)}
                    className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-bold"
                  >
                    <option value="">
                      Select target attribute in {mergeSource.category_slug}...
                    </option>
                    {attributes
                      .filter(
                        (a) =>
                          a.category_slug === mergeSource.category_slug &&
                          a.id !== mergeSource.id,
                      )
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.type})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setMergeSource(null)}
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
                    <span>
                      {submitting ? "Merging..." : "Confirm & Merge Data"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Process Vendor Suggestion */}
        {activeSuggestion && (
          <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-lg p-6 sm:p-8 rounded-3xl relative shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-[#D9E2EA] pb-3">
                <h3 className="text-lg font-black text-[#173885]">
                  Moderate Vendor Suggestion
                </h3>
                <button
                  onClick={() => setActiveSuggestion(null)}
                  className="text-[#606460] hover:text-[#282926]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F4F6FA] text-xs space-y-1">
                <div>
                  <strong className="text-[#282926]">
                    Suggested Attribute:
                  </strong>{" "}
                  <span className="font-bold text-[#173885]">
                    {activeSuggestion.name}
                  </span>
                </div>
                <div>
                  <strong className="text-[#282926]">Category:</strong>{" "}
                  {activeSuggestion.category_slug}
                </div>
                <div>
                  <strong className="text-[#282926]">Proposed Type:</strong>{" "}
                  {activeSuggestion.type}
                </div>
                {activeSuggestion.reason && (
                  <div>
                    <strong className="text-[#282926]">Justification:</strong>{" "}
                    {activeSuggestion.reason}
                  </div>
                )}
              </div>

              <form onSubmit={handleProcessSuggestion} className="space-y-4">
                <div className="flex rounded-xl bg-[#F4F6FA] p-1 border border-[#D9E2EA]">
                  <button
                    type="button"
                    onClick={() => setSuggestionDecision("APPROVED")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                      suggestionDecision === "APPROVED"
                        ? "bg-[#E1F2D9] text-[#3F7D20] shadow-xs"
                        : "text-[#606460]"
                    }`}
                  >
                    Approve Globally
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuggestionDecision("MERGED")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                      suggestionDecision === "MERGED"
                        ? "bg-[#E4EEF3] text-[#173885] shadow-xs"
                        : "text-[#606460]"
                    }`}
                  >
                    Merge into Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuggestionDecision("REJECTED")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                      suggestionDecision === "REJECTED"
                        ? "bg-[#FBE3DE] text-[#B43D20] shadow-xs"
                        : "text-[#606460]"
                    }`}
                  >
                    Reject
                  </button>
                </div>

                {suggestionDecision === "MERGED" && (
                  <div>
                    <label className="text-xs font-bold text-[#282926] block mb-1">
                      Standard Attribute Name *
                    </label>
                    <select
                      required
                      value={mergeTargetName}
                      onChange={(e) => setMergeTargetName(e.target.value)}
                      className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-bold"
                    >
                      <option value="">
                        Select standard attribute in{" "}
                        {activeSuggestion.category_slug}...
                      </option>
                      {attributes
                        .filter(
                          (a) =>
                            a.category_slug === activeSuggestion.category_slug,
                        )
                        .map((a) => (
                          <option key={a.id} value={a.name}>
                            {a.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Moderation Remarks
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter review notes for audit logs and vendor notification..."
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    className="w-full gm-input p-3 rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveSuggestion(null)}
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
                    <span>
                      {submitting
                        ? "Processing..."
                        : `Confirm ${suggestionDecision}`}
                    </span>
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
