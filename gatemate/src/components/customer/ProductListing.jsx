import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, PackageX } from "lucide-react";
import { productService } from "../../services/productService";
import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "../ProductCardSkeleton";
import { FilterPanel } from "./FilterPanel";
import { SortSelect } from "./SortSelect";
import { SeoHead } from "../common/SeoHead";
import { seoService } from "../../services/seoService";
import { ErrorStateView, EmptyStateView } from "../common/StateViews";

export const ProductListing = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get("category") || "all";
  const brand = searchParams.get("brand") || "all";
  const unit = searchParams.get("unit") || "all";
  const grade = searchParams.get("grade") || "all";
  const inStockOnly = searchParams.get("inStockOnly") === "true";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const sort = searchParams.get("sort") || "relevance";
  const expressOnly = searchParams.get("expressOnly") === "true";
  const pincode = searchParams.get("pincode") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const fetchFilteredProducts = useCallback(() => {
    setLoading(true);
    setError(null);

    productService
      .queryProducts({
        category,
        brand,
        unit,
        grade,
        inStockOnly,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sort,
        expressOnly,
        pincode,
      })
      .then((data) => setProducts(data))
      .catch(() =>
        setError(
          "Unable to load construction products. Please check connection.",
        ),
      )
      .finally(() => setLoading(false));
  }, [
    category,
    brand,
    unit,
    grade,
    inStockOnly,
    minPrice,
    maxPrice,
    sort,
    expressOnly,
    pincode,
  ]);

  useEffect(() => {
    fetchFilteredProducts();
  }, [fetchFilteredProducts]);

  const handleFilterChange = (key, value) => {
    const updated = new URLSearchParams(searchParams);
    if (!value || value === "all" || value === "") {
      updated.delete(key);
    } else {
      updated.set(key, value);
    }
    setSearchParams(updated);
  };

  const handleClearFilters = () => {
    setSearchParams({});
  };

  const currentFilters = {
    category,
    brand,
    unit,
    grade,
    inStockOnly,
    minPrice,
    maxPrice,
    expressOnly,
    pincode,
  };

  const isFilteredCategory = category && category !== "all";
  const categoryTitle = isFilteredCategory
    ? category
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "All Construction Products";

  const canonicalPath = isFilteredCategory
    ? `/products?category=${category}`
    : "/products";

  const collectionSchema = seoService.generateCollectionSchema({
    categoryName: categoryTitle,
    categoryDescription: `Buy verified ${categoryTitle} construction supplies online with 30-minute delivery on eligible Products/orders in Pune & PCMC.`,
    products,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-24">
      {/* Category SEO Tags */}
      <SeoHead
        title={`${categoryTitle} | GateMate Construction Products`}
        description={`Explore certified ${categoryTitle} supplies in Pune & PCMC. Direct wholesale depot rates, 30-minute delivery on eligible Products/orders, and GST input tax credit for contractors.`}
        canonicalUrl={canonicalPath}
        structuredData={collectionSchema}
      />

      {/* Top Header & Sort Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-dark">
            {categoryTitle}
          </h1>
          <p className="text-xs text-slate-400">
            {loading
              ? "Finding matching construction products..."
              : `Showing ${products.length} verified product(s) in Pune / PCMC`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden premium-card min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold text-dark flex items-center gap-2 border border-white/10"
            aria-label="Open Filter Controls"
          >
            <SlidersHorizontal className="w-4 h-4 text-dark-400" />
            <span>Filters</span>
          </button>

          <SortSelect
            value={sort}
            onChange={(val) => handleFilterChange("sort", val)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <div className="hidden lg:block premium-panel p-5 rounded-3xl sticky top-24">
          <FilterPanel
            filters={currentFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Mobile Filter Slide-out Drawer */}
        {mobileFilterOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-label="Construction Product Filters"
          >
            <div className="w-full max-w-xs bg-[#0a1424] h-full p-5 overflow-y-auto border-l border-white/10 shadow-2xl flex flex-col justify-between">
              <FilterPanel
                filters={currentFilters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                isMobileDrawer={true}
                onCloseMobileDrawer={() => setMobileFilterOpen(false)}
              />
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="w-full mt-6 dark-gradient-btn min-h-[44px] py-3 rounded-xl text-xs font-bold"
              >
                Apply Product Filters
              </button>
            </div>
          </div>
        )}

        {/* Results Container */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {Array(6)
                .fill(0)
                .map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
            </div>
          ) : error ? (
            <ErrorStateView
              title="Error Loading Products"
              description={error}
              onRetry={fetchFilteredProducts}
            />
          ) : products.length === 0 ? (
            <EmptyStateView
              icon={PackageX}
              title="No Products Match Filters"
              description="Try widening your maximum price range or clear category/unit filters to explore more items."
              actionLabel="Reset All Filters"
              onActionClick={handleClearFilters}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
