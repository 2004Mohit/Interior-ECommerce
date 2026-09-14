import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Layers,
  PlusCircle,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  RotateCcw,
} from "lucide-react";
import { adminCatalogueService } from "../../services/adminCatalogueService";
import { AdminPermissionGuard } from "./AdminPermissionGuard";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";
import { SeoHead } from "../common/SeoHead";

export const AdminCategoryListView = () => {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminCatalogueService.getCategories();
      setCategories(data);
    } catch (err) {
      setError(err.message || "Failed to load product categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleDeleteOrDeactivate = async (slug, name, prodCount) => {
    const confirmMsg =
      prodCount > 0
        ? `Category "${name}" is assigned to ${prodCount} products. It will be safely DEACTIVATED rather than deleted. Proceed?`
        : `Are you sure you want to permanently delete category "${name}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await adminCatalogueService.deleteCategory(slug, true);
      setActionNotice(res.message);
      loadCategories();
    } catch (err) {
      setError(err.message || "Action failed.");
    }
  };

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.MANAGE_CATEGORIES}>
      <div className="space-y-6 pb-20 font-sans">
        <SeoHead
          title="Product Category Management | GateMate Admin"
          description="Create, reorder, update SEO metadata, and safely deactivate construction material categories."
          canonicalUrl="/admin/categories"
          noIndex={true}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
          <div>
            <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Taxonomy & Structure
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
              Construction Product Categories
            </h1>
            <p className="text-xs text-[#606460]">
              Manage marketplace root categories, SEO parameters, dynamic
              display order, and catalog activation states.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/categories/new"
              className="btn-gm-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <PlusCircle className="w-4 h-4 text-[#FEFEFE]" />
              <span>Create Category</span>
            </Link>
            <button
              onClick={loadCategories}
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

        {actionNotice && (
          <div className="p-4 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Search */}
        <div className="gm-panel p-4 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92]" />
            <input
              type="text"
              placeholder="Search category name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full gm-input pl-10 pr-3.5 py-2 rounded-xl text-xs"
            />
          </div>
          <span className="text-xs font-mono text-[#6F8A92]">
            {filteredCategories.length} Categories Defined
          </span>
        </div>

        {/* Categories Grid / Table */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-[#FEFEFE] rounded-2xl border border-[#D9E2EA]"
              />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="gm-panel p-12 rounded-3xl border border-[#D9E2EA] text-center space-y-2 bg-[#FEFEFE]">
            <Layers className="w-10 h-10 text-[#6F8A92] mx-auto" />
            <h2 className="text-base font-bold text-[#173885]">
              No Categories Found
            </h2>
            <p className="text-xs text-[#606460]">
              Create a new product category to organize vendor catalog items.
            </p>
          </div>
        ) : (
          <div className="gm-panel rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F6FA] border-b border-[#D9E2EA] text-[10px] font-bold uppercase text-[#6F8A92]">
                <tr>
                  <th className="p-4">Order</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Descriptor</th>
                  <th className="p-4">Active Products</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E2EA]">
                {filteredCategories.map((c) => (
                  <tr key={c.slug} className="hover:bg-[#F4F6FA]/50 transition">
                    <td className="p-4 font-mono font-bold text-[#173885]">
                      #{c.display_order}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {c.image_url ? (
                          <img
                            src={c.image_url}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover border border-[#D9E2EA]"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-[#E4EEF3] text-[#173885] flex items-center justify-center font-bold text-[10px]">
                            {c.slug.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-[#173885] block">
                            {c.name}
                          </span>
                          <span className="text-[10px] font-mono text-[#6F8A92]">
                            {c.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-[#606460] max-w-xs truncate">
                      {c.descriptor || "—"}
                    </td>

                    <td className="p-4 font-mono font-bold text-[#282926]">
                      {c.productCount} Products
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          c.is_active
                            ? "bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30"
                            : "bg-[#FBE3DE] text-[#B43D20] border border-[#B43D20]/30"
                        }`}
                      >
                        {c.is_active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/categories/${c.slug}`}
                          className="p-1.5 rounded-lg border border-[#D9E2EA] text-[#606460] hover:text-[#173885] hover:bg-[#E4EEF3] transition"
                          title="Edit Category & SEO"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteOrDeactivate(
                              c.slug,
                              c.name,
                              c.productCount,
                            )
                          }
                          className="p-1.5 rounded-lg border border-[#B43D20]/30 text-[#B43D20] hover:bg-[#FBE3DE] transition"
                          title="Safe Delete / Deactivate"
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
        )}
      </div>
    </AdminPermissionGuard>
  );
};
