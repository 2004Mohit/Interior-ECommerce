import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, AlertCircle, RotateCcw } from "lucide-react";
import { productService } from "../../services/productService";
import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "../ProductCardSkeleton";
import { FilterPanel } from "./FilterPanel";
import { SortSelect } from "./SortSelect";
import { SeoHead } from "../common/SeoHead";
import { seoService } from "../../services/seoService";

export const ProductListing = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get("category") || "all";
  const brand = searchParams.get("brand") || "all";
  const material = searchParams.get("material") || "all";
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
        material,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sort,
        expressOnly,
        pincode,
      })
      .then((data) => setProducts(data))
      .catch(() =>
        setError(
          "Unable to load products. Please check your filters and retry.",
        ),
      )
      .finally(() => setLoading(false));
  }, [
    category,
    brand,
    material,
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
    material,
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
    : "All Products & Architectural Fittings";

  const canonicalPath = isFilteredCategory
    ? `/products?category=${category}`
    : "/products";

  const collectionSchema = seoService.generateCollectionSchema({
    categoryName: categoryTitle,
    categoryDescription: `Discover verified ${categoryTitle} with 30-minute priority delivery in Pune & PCMC.`,
    products,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Category SEO Tags */}
      <SeoHead
        title={`${categoryTitle} | GateMate Catalog`}
        description={`Explore our collection of ${categoryTitle} in Pune & PCMC. Guaranteed quality, express 30-min courier dispatch, and GST input tax credit for contractors.`}
        canonicalUrl={canonicalPath}
        structuredData={collectionSchema}
      />

      {/* Top Header & Sort Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {categoryTitle}
          </h1>
          <p className="text-xs text-slate-400">
            {loading
              ? "Finding matching items..."
              : `Showing ${products.length} verified item(s) in Pune / PCMC`}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden premium-card px-3.5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 border border-white/10"
          >
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
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

        {/* Mobile Filter Modal Drawer */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden flex justify-end">
            <div className="w-full max-w-xs bg-[#0a1424] h-full p-5 overflow-y-auto border-l border-white/10 shadow-2xl">
              <FilterPanel
                filters={currentFilters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                isMobileDrawer={true}
                onCloseMobileDrawer={() => setMobileFilterOpen(false)}
              />
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full mt-6 gold-gradient-btn py-3 rounded-xl text-xs font-bold"
              >
                Apply & View Results
              </button>
            </div>
          </div>
        )}

        {/* Results Container */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Array(6)
                .fill(0)
                .map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
            </div>
          ) : error ? (
            <div className="premium-panel p-12 rounded-3xl text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
              <h3 className="text-base font-bold text-white">
                Error Loading Catalog
              </h3>
              <p className="text-xs text-slate-400">{error}</p>
              <button
                onClick={fetchFilteredProducts}
                className="gold-gradient-btn px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="premium-panel p-16 rounded-3xl text-center space-y-4">
              <h3 className="text-lg font-bold text-white">
                No products match your criteria
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try widening your price range or clearing some filters to
                explore more items.
              </p>
              <button
                onClick={handleClearFilters}
                className="gold-gradient-btn px-5 py-2.5 rounded-xl text-xs font-bold"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
