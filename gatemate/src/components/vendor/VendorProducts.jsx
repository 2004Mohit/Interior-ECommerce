import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Edit2,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  PackageX,
  Filter,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import {
  vendorProductService,
  PRODUCT_APPROVAL_STATUS,
} from "../../services/vendorProductService";
import { CATALOGUE_CATEGORIES } from "../../data/categories";
import { SeoHead } from "../common/SeoHead";

export const VendorProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    product: null,
  });

  const [deletingId, setDeletingId] = useState(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);

      const data = await vendorProductService.getVendorProducts();

      setProducts(data || []);
    } catch (error) {
      console.error("[VendorProducts] Failed to load products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleDeleteProduct = (product) => {
    setDeleteConfirm({
      open: true,
      product,
    });
  };

  const handleConfirmDelete = async () => {
    const product = deleteConfirm.product;

    if (!product?.id) return;

    try {
      setDeletingId(product.id);

      await vendorProductService.deleteVendorProduct(product.id);

      setProducts((prev) => prev.filter((item) => item.id !== product.id));

      setDeleteConfirm({
        open: false,
        product: null,
      });

      alert("Product deleted successfully.");
    } catch (error) {
      console.error("Failed to delete product:", error);

      alert(error?.message || "Failed to delete product. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const statusTabs = [
    { key: "ALL", label: "All Products" },
    {
      key: PRODUCT_APPROVAL_STATUS.PUBLISHED,
      label: "Published",
    },
    {
      key: PRODUCT_APPROVAL_STATUS.APPROVED,
      label: "Approved",
    },
    {
      key: PRODUCT_APPROVAL_STATUS.UNDER_REVIEW,
      label: "Under Review",
    },
    {
      key: PRODUCT_APPROVAL_STATUS.SUBMITTED,
      label: "Submitted",
    },
    {
      key: PRODUCT_APPROVAL_STATUS.CHANGES_REQUESTED,
      label: "Changes Requested",
    },
    {
      key: PRODUCT_APPROVAL_STATUS.DRAFT,
      label: "Draft",
    },
    {
      key: PRODUCT_APPROVAL_STATUS.REJECTED,
      label: "Rejected",
    },
  ];

  const filteredProducts = products.filter((p) => {
    const productName = String(p.name || "").toLowerCase();
    const brand = String(p.brand || "").toLowerCase();
    const sku = String(p.sku || "").toLowerCase();
    const query = search.toLowerCase();

    const matchSearch =
      productName.includes(query) ||
      brand.includes(query) ||
      sku.includes(query);

    const matchCategory =
      selectedCategory === "all" ||
      p.categorySlug === selectedCategory ||
      p.category === selectedCategory;

    const matchStatus = selectedStatus === "ALL" || p.status === selectedStatus;

    return matchSearch && matchCategory && matchStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case PRODUCT_APPROVAL_STATUS.PUBLISHED:
        return (
          <span className="bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
            Published
          </span>
        );

      case PRODUCT_APPROVAL_STATUS.APPROVED:
        return (
          <span className="bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
            Approved
          </span>
        );

      case PRODUCT_APPROVAL_STATUS.UNDER_REVIEW:
        return (
          <span className="bg-[#E3EBFA] text-[#173885] border border-[#2E4D94]/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
            Under Review
          </span>
        );

      case PRODUCT_APPROVAL_STATUS.SUBMITTED:
        return (
          <span className="bg-[#E4EEF3] text-[#173885] border border-[#9AAED4]/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
            Submitted
          </span>
        );

      case PRODUCT_APPROVAL_STATUS.CHANGES_REQUESTED:
        return (
          <span className="bg-[#FFF0D5] text-[#A66A08] border border-[#A66A08]/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
            Changes Requested
          </span>
        );

      case PRODUCT_APPROVAL_STATUS.REJECTED:
        return (
          <span className="bg-[#FBE3DE] text-[#B43D20] border border-[#B43D20]/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
            Rejected
          </span>
        );

      default:
        return (
          <span className="bg-[#F4F6FA] text-[#606460] border border-[#D9E2EA] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <SeoHead
        title="Vendor Products Management | Ferrado"
        description="Manage your construction product catalogue, inspect approval status, and update available inventory."
        canonicalUrl="/vendor/products"
        noIndex={true}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div>
          <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Stockist Storefront
          </span>

          <h1 className="text-2xl font-black text-[#173885] mt-1">
            Vendor Products Management
          </h1>

          <p className="text-xs text-[#606460]">
            Track product approval lifecycle, stock counts, and view how
            products appear to guest customers.
          </p>
        </div>

        <Link
          to="/vendor/products/new"
          className="btn-gm-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4 text-[#FEFEFE]" />
          <span>Add New Product</span>
        </Link>
      </div>

      {/* Status Lifecycle Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-[#D9E2EA] scrollbar-none">
        {statusTabs.map((tab) => {
          const isSelected = selectedStatus === tab.key;

          const count =
            tab.key === "ALL"
              ? products.length
              : products.filter((product) => product.status === tab.key).length;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedStatus(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
                isSelected
                  ? "bg-[#173885] text-[#FEFEFE] shadow-xs"
                  : "bg-[#FEFEFE] text-[#606460] border border-[#D9E2EA] hover:bg-[#E4EEF3]"
              }`}
            >
              <span>{tab.label}</span>

              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected
                    ? "bg-[#3C7DDA] text-[#FEFEFE]"
                    : "bg-[#E4EEF3] text-[#173885]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Category Filter */}
      <div className="gm-panel p-4 rounded-2xl border border-[#D9E2EA] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92] pointer-events-none" />

          <input
            type="text"
            placeholder="Search vendor products by title, brand, or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full gm-input pl-10 pr-4 py-2 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#3C7DDA] shrink-0" />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto gm-input px-3 py-2 rounded-xl text-xs font-bold"
          >
            <option value="all">All Product Categories</option>

            {CATALOGUE_CATEGORIES.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="gm-panel p-5 rounded-2xl h-20 animate-pulse bg-[#E4EEF3]"
            />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="gm-panel p-16 rounded-3xl text-center space-y-3 border border-[#D9E2EA]">
          <PackageX className="w-12 h-12 text-[#6F8A92] mx-auto" />

          <h3 className="text-base font-bold text-[#173885]">
            No Products Found
          </h3>

          <p className="text-xs text-[#606460]">
            No products match the selected status or search filter.
          </p>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedCategory("all");
              setSelectedStatus("ALL");
            }}
            className="btn-gm-secondary px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      ) : (
        <div className="gm-panel rounded-2xl overflow-hidden border border-[#D9E2EA]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#E4EEF3] text-[#173885] font-bold border-b border-[#D9E2EA]">
                <tr>
                  <th className="p-3.5">Product Title & Brand</th>

                  <th className="p-3.5">Category</th>

                  <th className="p-3.5">Unit Price</th>

                  <th className="p-3.5">Stock & MOQ</th>

                  <th className="p-3.5">Approval Status</th>

                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#D9E2EA]">
                {filteredProducts.map((product) => {
                  const isDeleting = deletingId === product.id;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-[#F4F6FA] transition"
                    >
                      <td className="p-3.5 flex items-center gap-3">
                        <img
                          src={
                            product.img ||
                            product.coverImageUrl ||
                            product.images?.[0] ||
                            ""
                          }
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover bg-[#F4F6FA] border border-[#D9E2EA] shrink-0"
                        />

                        <div className="min-w-0">
                          <div className="font-bold text-[#282926] truncate max-w-xs">
                            {product.name}
                          </div>

                          <div className="text-[10px] text-[#6F8A92] font-mono">
                            {product.brand} • SKU: {product.sku || "—"}
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 font-semibold text-[#606460]">
                        {product.category}
                      </td>

                      <td className="p-3.5 font-mono font-bold text-[#173885]">
                        ₹{product.price}{" "}
                        <span className="text-[10px] text-[#606460]">
                          / {product.unit}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-[#282926]">
                          {product.stock} {product.unit}s
                        </div>

                        <div className="text-[10px] text-[#6F8A92]">
                          MOQ: {product.moq || 1}
                        </div>
                      </td>

                      <td className="p-3.5">
                        {getStatusBadge(product.status)}

                        {product.reviewerNotes && (
                          <p className="text-[10px] text-[#A66A08] mt-1 line-clamp-1 max-w-xs font-medium">
                            {product.reviewerNotes}
                          </p>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Edit */}
                          <Link
                            to={`/vendor/products/${product.id}`}
                            className="btn-gm-secondary p-2 rounded-xl text-xs font-bold inline-flex items-center gap-1"
                            title="Edit Product Details"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#173885]" />

                            <span className="hidden sm:inline">Edit</span>
                          </Link>

                          {/* Guest View */}
                          <Link
                            to={`/vendor/products/${product.id}/preview`}
                            className="btn-gm-secondary p-2 rounded-xl text-xs font-bold inline-flex items-center gap-1 text-[#3C7DDA]"
                            title="Inspect product as seen by guest customers"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#3C7DDA]" />

                            <span className="hidden sm:inline">Guest View</span>
                          </Link>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product)}
                            disabled={deletingId !== null}
                            className="p-2 rounded-xl text-xs font-bold inline-flex items-center gap-1 border border-[#B43D20]/30 bg-[#FBE3DE] text-[#B43D20] hover:bg-[#F5D5CF] transition disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />

                            <span className="hidden sm:inline">
                              {isDeleting ? "Deleting..." : "Delete"}
                            </span>
                          </button>
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
      {deleteConfirm.open && deleteConfirm.product && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f2747]/35 px-4 backdrop-blur-[2px]"
          onClick={() => {
            if (!deletingId) {
              setDeleteConfirm({
                open: false,
                product: null,
              });
            }
          }}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-xl border border-[#d6e2ee] bg-white shadow-[0_20px_50px_rgba(31,65,114,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start gap-4 border-b border-[#e1e9f1] px-6 py-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#cfe0f0] bg-[#eef5fb] text-[#244b8f]">
                <Trash2 size={21} strokeWidth={2} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold tracking-[-0.01em] text-[#173f82]">
                  Delete Product
                </h3>

                <p className="mt-1 text-sm leading-5 text-[#687b91]">
                  This action will permanently remove the product.
                </p>
              </div>

              <button
                type="button"
                disabled={!!deletingId}
                onClick={() =>
                  setDeleteConfirm({
                    open: false,
                    product: null,
                  })
                }
                className="rounded-lg p-1.5 text-[#7b8da2] transition hover:bg-[#edf3f8] hover:text-[#244b8f] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              <p className="text-sm leading-6 text-[#4f637a]">
                Are you sure you want to delete
                <span className="font-semibold text-[#173f82]">
                  {" "}
                  "{deleteConfirm.product.name}"
                </span>
                ?
              </p>

              <div className="mt-4 rounded-xl border border-[#d7e5f1] bg-[#f3f8fc] px-4 py-3">
                <p className="text-xs leading-5 text-[#5e748c]">
                  This product will no longer be available in your product
                  catalogue. Please make sure you no longer need this product
                  before continuing.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-[#e1e9f1] bg-[#f7f9fc] px-6 py-4">
              <button
                type="button"
                disabled={!!deletingId}
                onClick={() =>
                  setDeleteConfirm({
                    open: false,
                    product: null,
                  })
                }
                className="rounded-lg border border-[#ccd9e6] bg-white px-4 py-2.5 text-sm font-medium text-[#52677e] transition hover:border-[#b8c9da] hover:bg-[#f2f6fa] hover:text-[#244b8f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!!deletingId}
                onClick={handleConfirmDelete}
                className="inline-flex min-w-[110px] items-center justify-center gap-2 rounded-lg bg-[#347fd3] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#286dbd] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId === deleteConfirm.product.id ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={17} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
