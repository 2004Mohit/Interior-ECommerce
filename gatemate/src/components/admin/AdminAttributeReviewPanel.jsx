import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Layers,
  PlusCircle,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Trash2,
  GitMerge,
  X,
  Building2,
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
    category_slug: "",
    pendingName: "",
    attributes: [],
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

  const loadData = useCallback(async () => {
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

      setCategories(Array.isArray(cats) ? cats : []);
      setAttributes(Array.isArray(attrs) ? attrs : []);
      setSuggestions(Array.isArray(sugs) ? sugs : []);
    } catch (err) {
      setError(err?.message || "Failed to load category attributes.");
      setCategories([]);
      setAttributes([]);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setError(null);
    setActionSuccess(null);
    setEditingAttr("NEW");

    setAttrForm({
      category_slug:
        selectedCategory !== "ALL"
          ? selectedCategory
          : categories[0]?.slug || "",
      pendingName: "",
      attributes: [],
    });
  };

  const openEditModal = (attr) => {
    setError(null);
    setActionSuccess(null);
    setEditingAttr(attr);

    setAttrForm({
      category_slug: attr.category_slug,
      attributes: [
        {
          id: attr.id,
          name: attr.name || "",
          type: attr.type || "text",
          allowed_values: Array.isArray(attr.allowed_values)
            ? attr.allowed_values.join(", ")
            : "",
          placeholder: attr.placeholder || "",
          is_required: Boolean(attr.is_required),
        },
      ],
    });
  };

  const addAttributeName = () => {
    const name = attrForm.pendingName?.trim();

    if (!name) return;

    const alreadyExists = attrForm.attributes.some(
      (attribute) => attribute.name.trim().toLowerCase() === name.toLowerCase(),
    );

    if (alreadyExists) {
      setError(`Attribute "${name}" has already been added.`);
      return;
    }

    setError(null);

    setAttrForm((prev) => ({
      ...prev,
      pendingName: "",
      attributes: [
        ...prev.attributes,
        {
          id: null,
          name,
          type: "text",
          allowed_values: "",
          placeholder: "",
          is_required: false,
        },
      ],
    }));
  };

  const removeAttribute = (index) => {
    setAttrForm((prev) => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index),
    }));
  };

  const updateAttribute = (index, field, value) => {
    setAttrForm((prev) => ({
      ...prev,
      attributes: prev.attributes.map((attribute, i) =>
        i === index
          ? {
              ...attribute,
              [field]: value,
              ...(field === "type" && value !== "select"
                ? { allowed_values: "" }
                : {}),
            }
          : attribute,
      ),
    }));
  };

  const handleAttributeNameKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addAttributeName();
      return;
    }

    if (
      e.key === "Backspace" &&
      !attrForm.pendingName?.trim() &&
      attrForm.attributes.length > 0
    ) {
      removeAttribute(attrForm.attributes.length - 1);
    }
  };

  const handleSaveAttribute = async (e) => {
    e.preventDefault();

    if (!attrForm.category_slug) {
      setError("Please select a category.");
      return;
    }

    if (!attrForm.attributes.length) {
      setError("Add at least one attribute before creating.");
      return;
    }

    for (const attribute of attrForm.attributes) {
      if (!attribute.name.trim()) {
        setError("Every attribute must have a name.");
        return;
      }

      if (
        attribute.type === "select" &&
        !attribute.allowed_values
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean).length
      ) {
        setError(`Allowed Values are required for "${attribute.name}".`);
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const isEditingExistingAttribute = editingAttr && editingAttr !== "NEW";

      if (isEditingExistingAttribute) {
        const attribute = attrForm.attributes[0];

        const allowedArr =
          attribute.type === "select"
            ? attribute.allowed_values
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean)
            : [];

        await adminAttributeService.saveAttribute({
          id: attribute.id,
          category_slug: attrForm.category_slug,
          name: attribute.name,
          type: attribute.type,
          allowed_values: allowedArr,
          is_required: Boolean(attribute.is_required),
          placeholder: attribute.placeholder,
        });

        setActionSuccess(`Attribute "${attribute.name}" updated successfully.`);
      } else {
        await Promise.all(
          attrForm.attributes.map((attribute) => {
            const allowedArr =
              attribute.type === "select"
                ? attribute.allowed_values
                    .split(",")
                    .map((value) => value.trim())
                    .filter(Boolean)
                : [];

            return adminAttributeService.saveAttribute({
              id: null,
              category_slug: attrForm.category_slug,
              name: attribute.name,
              type: attribute.type,
              allowed_values: allowedArr,

              // Save the requirement selected for this attribute.
              is_required: Boolean(attribute.is_required),

              placeholder: attribute.placeholder,
            });
          }),
        );

        setActionSuccess(
          `${attrForm.attributes.length} attribute${
            attrForm.attributes.length > 1 ? "s" : ""
          } created successfully.`,
        );
      }

      setEditingAttr(null);

      setAttrForm({
        category_slug: "",
        attributes: [],
        pendingName: "",
      });

      await loadData();
    } catch (err) {
      setError(err.message || "Failed to save attributes.");
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
      await loadData();
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
      await loadData();
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
      await loadData();
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
          <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 18 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl relative shadow-2xl"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-[#FEFEFE]/95 backdrop-blur-md border-b border-[#D9E2EA] px-6 sm:px-8 py-5">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-xl bg-[#D0E8F7] flex items-center justify-center">
                        <Layers className="w-4 h-4 text-[#173885]" />
                      </div>

                      <span className="text-[10px] font-black uppercase tracking-widest text-[#3C7DDA]">
                        Attribute Architecture
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-[#173885]">
                      {editingAttr === "NEW"
                        ? "Create Standard Attributes"
                        : "Edit Attribute"}
                    </h3>

                    <p className="text-xs text-[#606460] mt-1">
                      {editingAttr === "NEW"
                        ? "Add multiple technical attributes and configure each field independently."
                        : "Update the configuration of this standard attribute."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingAttr(null)}
                    className="w-9 h-9 rounded-xl border border-[#D9E2EA] text-[#606460] hover:text-[#173885] hover:bg-[#D0E8F7]/40 transition flex items-center justify-center shrink-0"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <form
                onSubmit={handleSaveAttribute}
                className="p-6 sm:p-8 space-y-6"
              >
                {/* Category */}
                <div>
                  <label className="text-xs font-black text-[#282926] block mb-2">
                    Category *
                  </label>

                  <select
                    disabled={editingAttr !== "NEW"}
                    value={attrForm.category_slug}
                    onChange={(e) =>
                      setAttrForm((prev) => ({
                        ...prev,
                        category_slug: e.target.value,
                      }))
                    }
                    className="w-full gm-input px-4 py-3 rounded-xl text-xs font-bold disabled:bg-[#F4F6FA]"
                  >
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Add Attribute Name */}
                {editingAttr === "NEW" && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-black text-[#282926]">
                        Attribute Names *
                      </label>

                      <span className="text-[10px] font-semibold text-[#6F8A92]">
                        Press Enter to add
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        autoFocus
                        type="text"
                        value={attrForm.pendingName || ""}
                        onChange={(e) =>
                          setAttrForm((prev) => ({
                            ...prev,
                            pendingName: e.target.value,
                          }))
                        }
                        onKeyDown={handleAttributeNameKeyDown}
                        placeholder="Type an attribute name and press Enter..."
                        className="w-full gm-input px-4 py-3.5 pr-12 rounded-2xl text-xs border-[#D9E2EA] focus:border-[#33B2FF] focus:ring-2 focus:ring-[#33B2FF]/20 transition-all"
                      />

                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-[#D0E8F7] flex items-center justify-center">
                        <PlusCircle className="w-4 h-4 text-[#173885]" />
                      </div>
                    </div>

                    <p className="text-[10px] text-[#6F8A92] mt-2">
                      Add one attribute at a time. Commas are not used as
                      separators.
                    </p>
                  </div>
                )}

                {/* Added Attributes */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#173885]">
                        {editingAttr === "NEW"
                          ? "Added Attributes"
                          : "Attribute Configuration"}
                      </h4>

                      {editingAttr === "NEW" && (
                        <p className="text-[10px] text-[#6F8A92] mt-1">
                          Configure each attribute independently.
                        </p>
                      )}
                    </div>

                    {editingAttr === "NEW" && (
                      <span className="px-2.5 py-1 rounded-full bg-[#D0E8F7] text-[#173885] text-[10px] font-black">
                        {attrForm.attributes.length}
                      </span>
                    )}
                  </div>

                  {attrForm.attributes.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#8CD0FA] bg-[#D0E8F7]/25 p-7 text-center">
                      <Layers className="w-7 h-7 text-[#3C7DDA] mx-auto mb-2" />

                      <p className="text-xs font-bold text-[#173885]">
                        No attributes added yet
                      </p>

                      <p className="text-[10px] text-[#6F8A92] mt-1">
                        Type an attribute name above and press Enter.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <AnimatePresence initial={false}>
                        {attrForm.attributes.map((attribute, index) => (
                          <motion.div
                            key={attribute.id || `${attribute.name}-${index}`}
                            layout
                            initial={{
                              opacity: 0,
                              y: 12,
                              scale: 0.98,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                              scale: 1,
                            }}
                            exit={{
                              opacity: 0,
                              scale: 0.96,
                              x: 20,
                            }}
                            transition={{
                              duration: 0.2,
                              ease: "easeOut",
                            }}
                            className="rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] overflow-hidden shadow-sm"
                          >
                            {/* Attribute title */}
                            <div className="px-4 py-3 bg-gradient-to-r from-[#D0E8F7]/60 to-[#FEFEFE] border-b border-[#D9E2EA] flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-[#33B2FF]/10 border border-[#33B2FF]/20 flex items-center justify-center shrink-0">
                                  <span className="text-[10px] font-black text-[#173885]">
                                    {index + 1}
                                  </span>
                                </div>

                                <div className="min-w-0">
                                  <p className="text-xs font-black text-[#173885] truncate">
                                    {attribute.name}
                                  </p>

                                  <p className="text-[9px] uppercase tracking-wider text-[#6F8A92] font-bold">
                                    Technical Attribute
                                  </p>
                                </div>
                              </div>

                              {editingAttr === "NEW" && (
                                <button
                                  type="button"
                                  onClick={() => removeAttribute(index)}
                                  className="w-7 h-7 rounded-lg border border-[#B43D20]/20 text-[#B43D20] hover:bg-[#FBE3DE] transition flex items-center justify-center shrink-0"
                                  title={`Remove ${attribute.name}`}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Configuration */}
                            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Input Type */}
                              <div>
                                <label className="text-[10px] font-black uppercase tracking-wider text-[#606460] block mb-1.5">
                                  Input Type
                                </label>

                                <select
                                  value={attribute.type}
                                  onChange={(e) =>
                                    updateAttribute(
                                      index,
                                      "type",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full gm-input px-3 py-2.5 rounded-xl text-xs font-bold"
                                >
                                  <option value="text">Text Input</option>

                                  <option value="number">Numeric Value</option>

                                  <option value="select">
                                    Dropdown Select
                                  </option>
                                </select>
                              </div>

                              {/* Placeholder */}
                              <div>
                                <label className="text-[10px] font-black uppercase tracking-wider text-[#606460] block mb-1.5">
                                  Placeholder
                                </label>

                                <input
                                  type="text"
                                  value={attribute.placeholder}
                                  onChange={(e) =>
                                    updateAttribute(
                                      index,
                                      "placeholder",
                                      e.target.value,
                                    )
                                  }
                                  placeholder={
                                    attribute.type === "number"
                                      ? "e.g. 25"
                                      : attribute.type === "select"
                                        ? "e.g. Select grade..."
                                        : "e.g. 43 Grade, OPC 53"
                                  }
                                  className="w-full gm-input px-3 py-2.5 rounded-xl text-xs"
                                />
                              </div>

                              {/* Product Requirement */}
                              <div>
                                <label className="text-[10px] font-black uppercase tracking-wider text-[#606460] block mb-1.5">
                                  Product Requirement
                                </label>

                                <select
                                  value={
                                    attribute.is_required
                                      ? "mandatory"
                                      : "optional"
                                  }
                                  onChange={(e) =>
                                    updateAttribute(
                                      index,
                                      "is_required",
                                      e.target.value === "mandatory",
                                    )
                                  }
                                  className="w-full gm-input px-3 py-2.5 rounded-xl text-xs font-bold"
                                >
                                  <option value="optional">Optional</option>
                                  <option value="mandatory">Mandatory</option>
                                </select>

                                <p className="text-[9px] text-[#6F8A92] mt-1.5">
                                  {attribute.is_required
                                    ? "Vendor must provide this value."
                                    : "Vendor can leave this value empty."}
                                </p>
                              </div>

                              {/* Allowed Values */}
                              {attribute.type === "select" && (
                                <motion.div
                                  initial={{
                                    opacity: 0,
                                    height: 0,
                                  }}
                                  animate={{
                                    opacity: 1,
                                    height: "auto",
                                  }}
                                  className="md:col-span-2"
                                >
                                  <label className="text-[10px] font-black uppercase tracking-wider text-[#606460] block mb-1.5">
                                    Allowed Values
                                  </label>

                                  <input
                                    type="text"
                                    value={attribute.allowed_values}
                                    onChange={(e) =>
                                      updateAttribute(
                                        index,
                                        "allowed_values",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="e.g. OPC 43, OPC 53, PPC"
                                    className="w-full gm-input px-3 py-2.5 rounded-xl text-xs"
                                  />

                                  <p className="text-[9px] text-[#6F8A92] mt-1.5">
                                    Separate dropdown options with commas.
                                  </p>
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Info */}
                {editingAttr === "NEW" && attrForm.attributes.length > 0 && (
                  <div className="rounded-2xl bg-[#D0E8F7]/35 border border-[#8CD0FA]/50 px-4 py-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-[#33B2FF]/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#3C7DDA]" />
                      </div>

                      <div>
                        <p className="text-[10px] font-black text-[#173885]">
                          Ready to create
                        </p>

                        <p className="text-[10px] text-[#606460] mt-0.5">
                          Each attribute will be saved with its own input type
                          and placeholder. New standard attributes are optional
                          by default.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t border-[#D9E2EA]">
                  <button
                    type="button"
                    onClick={() => setEditingAttr(null)}
                    disabled={submitting}
                    className="btn-gm-secondary px-5 py-2.5 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      !attrForm.category_slug ||
                      attrForm.attributes.length === 0
                    }
                    className="btn-gm-primary px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {editingAttr === "NEW"
                            ? `Create ${attrForm.attributes.length} ${
                                attrForm.attributes.length === 1
                                  ? "Attribute"
                                  : "Attributes"
                              }`
                            : "Save Changes"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
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
