import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Search,
  Filter,
  RotateCcw,
  Building2,
  DollarSign,
  Boxes,
  Truck,
  Eye,
  EyeOff,
  Layers,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { adminCatalogueService } from "../../services/adminCatalogueService";
import { AdminPermissionGuard } from "./AdminPermissionGuard";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";
import { SeoHead } from "../common/SeoHead";

export const AdminProductManagementView = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, catList] = await Promise.all([
        adminCatalogueService.getProducts({
          search,
          categorySlug: selectedCategory,
          status: selectedStatus,
          minPrice,
          maxPrice,
          inStockOnly,
          limit: 100,
        }),
        adminCatalogueService.getCategories(),
      ]);
      setProducts(prodRes?.products || []);
      setTotalCount(prodRes?.totalCount || 0);
      setCategories(catList || []);
    } catch (err) {
      setError(err?.message || "Failed to retrieve product catalogue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedStatus, inStockOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleToggleStatus = async (productId, currentStatus) => {
    const nextStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      await adminCatalogueService.toggleProductStatus(
        productId,
        nextStatus,
        "Manual admin publishing override",
      );
      setActionSuccess(`Product status updated to ${nextStatus}.`);
      loadData();
    } catch (err) {
      setError(err?.message || "Failed to update product state.");
    }
  };

  const formatCurrency = (val) =>
    `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.MANAGE_PRODUCTS}>
      <div className="space-y-6 pb-20 font-sans">
        <SeoHead
          title="Product Catalogue Management | Ferrado Admin"
          description="Oversee construction products, vendor pricing, stock levels, and publication states across Pune & PCMC."
          canonicalUrl="/admin/products"
          noIndex={true}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
          <div>
            <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Marketplace Catalogue Control
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
              Construction Products Master Directory
            </h1>
            <p className="text-xs text-[#606460]">
              Filter, audit pricing, inspect unit specifications, and manage
              publication states across all registered vendors.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/categories"
              className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-[#3C7DDA]" />
              <span>Manage Categories</span>
            </Link>
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

        {/* Filters Toolbar */}
        <div className="gm-panel p-5 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-4 shadow-2xs">
          <form
            onSubmit={handleSearchSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
          >
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92]" />
              <input
                type="text"
                placeholder="Search product, brand, vendor, or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full gm-input pl-10 pr-3.5 py-2 rounded-xl text-xs"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="gm-input px-3 py-2 rounded-xl text-xs font-bold"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}{" "}
                  {c.productCount !== undefined ? `(${c.productCount})` : ""}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="gm-input px-3 py-2 rounded-xl text-xs font-bold"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="SUBMITTED">Submitted / Under Review</option>
              <option value="CHANGES_REQUESTED">Changes Requested</option>
              <option value="DRAFT">Unpublished / Draft</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <button
              type="submit"
              className="btn-gm-primary py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Apply Filters</span>
            </button>
          </form>

          {/* Price & Stock Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#D9E2EA] text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-[#282926]">Price Range:</span>
              <input
                type="number"
                placeholder="Min ₹"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-24 gm-input px-2.5 py-1.5 rounded-lg text-xs font-mono"
              />
              <span className="text-[#6F8A92]">-</span>
              <input
                type="number"
                placeholder="Max ₹"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-24 gm-input px-2.5 py-1.5 rounded-lg text-xs font-mono"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none font-bold text-[#173885]">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded border-[#D9E2EA] text-[#173885] focus:ring-[#173885]"
              />
              <span>In-Stock Depot Products Only</span>
            </label>
          </div>
        </div>

        {/* Master Products Table */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-[#FEFEFE] rounded-2xl border border-[#D9E2EA]"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="gm-panel p-12 rounded-3xl border border-[#D9E2EA] text-center space-y-2 bg-[#FEFEFE]">
            <Package className="w-10 h-10 text-[#6F8A92] mx-auto" />
            <h2 className="text-base font-bold text-[#173885]">
              No Construction Products Found
            </h2>
            <p className="text-xs text-[#606460]">
              No items match the specified search and filter combination.
            </p>
          </div>
        ) : (
          <div className="gm-panel rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F6FA] border-b border-[#D9E2EA] text-[10px] font-bold uppercase text-[#6F8A92]">
                  <tr>
                    <th className="p-4">Product Details</th>
                    <th className="p-4">Vendor</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Unit Price</th>
                    <th className="p-4">Stock Level</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9E2EA]">
                  {products.map((p) => {
                    const vendor = Array.isArray(p.vendor_profiles)
                      ? p.vendor_profiles[0]
                      : p.vendor_profiles;
                    const stock = Array.isArray(p.vendor_inventory)
                      ? p.vendor_inventory[0]
                      : p.vendor_inventory;
                    const onHand = stock
                      ? Number(stock.on_hand_stock || 0) -
                        Number(stock.reserved_stock || 0)
                      : 0;
                    const isPublished = p.status === "PUBLISHED";
                    const coverImg =
                      p.cover_image_url ||
                      (Array.isArray(p.image_urls) ? p.image_urls[0] : null);

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-[#F4F6FA]/50 transition"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#F4F6FA] border border-[#D9E2EA] overflow-hidden shrink-0 flex items-center justify-center">
                              {coverImg ? (
                                <img
                                  src={coverImg}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-4 h-4 text-[#6F8A92]" />
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-[#173885] block">
                                {p.name || "Unnamed Product"}
                              </span>
                              <span className="text-[11px] text-[#606460]">
                                Brand: {p.brand || "Generic"}{" "}
                                {p.sku ? `• SKU: ${p.sku}` : ""}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="font-semibold text-[#282926] block">
                            {vendor?.business_name || "Vendor Depot"}
                          </span>
                          <span className="text-[10px] text-[#6F8A92]">
                            {vendor?.locality || "Pune"}, {vendor?.city || "MH"}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className="badge-gm-info px-2.5 py-0.5 rounded-md text-[11px] font-bold">
                            {p.category_slug || "General"}
                          </span>
                        </td>

                        <td className="p-4 font-mono font-bold text-[#173885]">
                          {formatCurrency(p.price)} / {p.unit || "Unit"}
                        </td>

                        <td className="p-4 font-mono">
                          <span
                            className={`font-bold ${onHand <= 0 ? "text-[#B43D20]" : onHand <= 10 ? "text-[#A66A08]" : "text-[#3F7D20]"}`}
                          >
                            {onHand} {p.unit || "Units"}
                          </span>
                        </td>

                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              isPublished
                                ? "bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30"
                                : p.status === "SUBMITTED"
                                  ? "bg-[#E4EEF3] text-[#173885] border border-[#3C7DDA]/30"
                                  : p.status === "REJECTED"
                                    ? "bg-[#FBE3DE] text-[#B43D20] border border-[#B43D20]/30"
                                    : "bg-[#FFF0D5] text-[#A66A08] border border-[#A66A08]/30"
                            }`}
                          >
                            {p.status || "DRAFT"}
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(p.id, p.status)}
                              className={`p-1.5 rounded-lg border text-xs font-bold transition ${
                                isPublished
                                  ? "border-[#B43D20]/30 text-[#B43D20] hover:bg-[#FBE3DE]"
                                  : "border-[#3F7D20]/30 text-[#3F7D20] hover:bg-[#E1F2D9]"
                              }`}
                              title={
                                isPublished
                                  ? "Unpublish Product"
                                  : "Publish Product"
                              }
                            >
                              {isPublished ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                            <Link
                              to={`/products/${p.slug || p.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg border border-[#D9E2EA] text-[#606460] hover:text-[#173885] hover:bg-[#E4EEF3] transition"
                              title="View Customer Product Page"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminPermissionGuard>
  );
};
