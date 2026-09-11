import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Edit2,
  Eye,
  Boxes,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldAlert,
  PackageX,
  Filter,
  Layers,
  ExternalLink,
  RotateCcw,
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

  useEffect(() => {
    vendorProductService.getVendorProducts().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  const statusTabs = [
    { key: "ALL", label: "All Products" },
    { key: PRODUCT_APPROVAL_STATUS.PUBLISHED, label: "Published" },
    { key: PRODUCT_APPROVAL_STATUS.APPROVED, label: "Approved" },
    { key: PRODUCT_APPROVAL_STATUS.UNDER_REVIEW, label: "Under Review" },
    { key: PRODUCT_APPROVAL_STATUS.SUBMITTED, label: "Submitted" },
    {
      key: PRODUCT_APPROVAL_STATUS.CHANGES_REQUESTED,
      label: "Changes Requested",
    },
    { key: PRODUCT_APPROVAL_STATUS.DRAFT, label: "Draft" },
    { key: PRODUCT_APPROVAL_STATUS.REJECTED, label: "Rejected" },
  ];

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      selectedCategory === "all" ||
      p.categorySlug === selectedCategory ||
      p.category === selectedCategory;
    const matchStatus = selectedStatus === "ALL" || p.status === selectedStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  const getStatusBadge = (st) => {
    switch (st) {
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
        title="Vendor Products Management | GateMate"
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
              : products.filter((p) => p.status === tab.key).length;

          return (
            <button
              key={tab.key}
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

      {/* Search & Category Filter Toolbar */}
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
            {CATALOGUE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
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
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F4F6FA] transition">
                    <td className="p-3.5 flex items-center gap-3">
                      <img
                        src={p.img}
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover bg-[#F4F6FA] border border-[#D9E2EA] shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-[#282926] truncate max-w-xs">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-[#6F8A92] font-mono">
                          {p.brand} • SKU: {p.sku}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-semibold text-[#606460]">
                      {p.category}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-[#173885]">
                      ₹{p.price}{" "}
                      <span className="text-[10px] text-[#606460]">
                        / {p.unit}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-[#282926]">
                        {p.stock} {p.unit}s
                      </div>
                      <div className="text-[10px] text-[#6F8A92]">
                        MOQ: {p.moq || 1}
                      </div>
                    </td>
                    <td className="p-3.5">
                      {getStatusBadge(p.status)}
                      {p.reviewerNotes && (
                        <p className="text-[10px] text-[#A66A08] mt-1 line-clamp-1 max-w-xs font-medium">
                          {p.reviewerNotes}
                        </p>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/vendor/products/${p.id}`}
                          className="btn-gm-secondary p-2 rounded-xl text-xs font-bold inline-flex items-center gap-1"
                          title="Edit Product Details"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#173885]" />
                          <span className="hidden sm:inline">Edit</span>
                        </Link>

                        {/* Guest Storefront View Preview */}
                        <Link
                          to={`/products/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-gm-secondary p-2 rounded-xl text-xs font-bold inline-flex items-center gap-1 text-[#3C7DDA]"
                          title="View how product looks to guest customers"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#3C7DDA]" />
                          <span className="hidden sm:inline">Guest View</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
