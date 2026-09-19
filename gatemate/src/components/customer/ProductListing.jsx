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

  /*
   * --------------------------------------------------------------------------
   * URL FILTERS
   * --------------------------------------------------------------------------
   * All listing filters are kept in the URL so:
   * - Refresh does not lose the current filters
   * - Products can be shared through a URL
   * - Browser back/forward works correctly
   */
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

  /*
   * --------------------------------------------------------------------------
   * LOCAL STATE
   * --------------------------------------------------------------------------
   */
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  /*
   * --------------------------------------------------------------------------
   * FETCH PRODUCTS
   * --------------------------------------------------------------------------
   *
   * This uses the new Supabase-backed productService.
   *
   * No demoProducts.js
   * No mockData.js
   * No static catalogue
   * No banner/promotion data
   */
  const fetchFilteredProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await productService.queryProducts({
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
      });

      /*
       * Make sure the UI always receives an array.
       * This protects the listing from unexpected null/undefined responses.
       */
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("ProductListing: failed to load products:", err);

      setProducts([]);

      setError(
        err?.message ||
          "Unable to load construction products. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
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

  /*
   * --------------------------------------------------------------------------
   * LOAD WHEN FILTERS CHANGE
   * --------------------------------------------------------------------------
   */
  useEffect(() => {
    fetchFilteredProducts();
  }, [fetchFilteredProducts]);

  /*
   * --------------------------------------------------------------------------
   * FILTER CHANGE
   * --------------------------------------------------------------------------
   */
  const handleFilterChange = useCallback(
    (key, value) => {
      const updated = new URLSearchParams(searchParams);

      /*
       * "all" represents the default state and should not remain
       * unnecessarily in the URL.
       */
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        value === "all"
      ) {
        updated.delete(key);
      } else {
        updated.set(key, String(value));
      }

      setSearchParams(updated);
    },
    [searchParams, setSearchParams],
  );

  /*
   * --------------------------------------------------------------------------
   * CLEAR ALL FILTERS
   * --------------------------------------------------------------------------
   */
  const handleClearFilters = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  /*
   * --------------------------------------------------------------------------
   * CURRENT FILTER OBJECT
   * --------------------------------------------------------------------------
   *
   * Passed to FilterPanel.
   */
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

  /*
   * --------------------------------------------------------------------------
   * CATEGORY TITLE
   * --------------------------------------------------------------------------
   *
   * The URL contains the category slug.
   *
   * Example:
   * cement
   * -> Cement
   *
   * construction-steel
   * -> Construction Steel
   *
   * The actual category data still comes from Supabase through
   * productService/FilterPanel.
   */
  const isFilteredCategory = category && category !== "all";

  const categoryTitle = isFilteredCategory
    ? category
        .split("-")
        .filter(Boolean)
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join(" ")
    : "All Construction Products";

  /*
   * --------------------------------------------------------------------------
   * SEO CANONICAL URL
   * --------------------------------------------------------------------------
   */
  const canonicalPath = isFilteredCategory
    ? `/products?category=${encodeURIComponent(category)}`
    : "/products";

  /*
   * --------------------------------------------------------------------------
   * COLLECTION STRUCTURED DATA
   * --------------------------------------------------------------------------
   */
  const collectionSchema = seoService.generateCollectionSchema({
    categoryName: categoryTitle,

    categoryDescription: `Buy verified ${categoryTitle} construction products online with 30-minute delivery on eligible products and orders in Pune & PCMC.`,

    products,
  });

  /*
   * --------------------------------------------------------------------------
   * RENDER
   * --------------------------------------------------------------------------
   */
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-24">
      {/* ------------------------------------------------------------------ */}
      {/* SEO                                                               */}
      {/* ------------------------------------------------------------------ */}

      <SeoHead
        title={`${categoryTitle} | GateMate Construction Products`}
        description={`Explore verified ${categoryTitle} construction products in Pune & PCMC. Competitive vendor pricing, product availability, and 30-minute delivery on eligible products/orders.`}
        canonicalUrl={canonicalPath}
        structuredData={collectionSchema}
      />

      {/* ------------------------------------------------------------------ */}
      {/* HEADER + SORT                                                     */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-dark">
            {categoryTitle}
          </h1>

          <p className="text-xs text-slate-400 mt-1">
            {loading
              ? "Finding matching construction products..."
              : `Showing ${products.length} verified product${
                  products.length === 1 ? "" : "s"
                } in Pune / PCMC`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          {/* Mobile Filters */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden premium-card min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold text-dark flex items-center gap-2 border border-white/10"
            aria-label="Open Product Filters"
            aria-haspopup="dialog"
            aria-expanded={mobileFilterOpen}
          >
            <SlidersHorizontal className="w-4 h-4 text-dark-400" />
            <span>Filters</span>
          </button>

          {/* Sorting */}
          <SortSelect
            value={sort}
            onChange={(value) => handleFilterChange("sort", value)}
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MAIN CONTENT                                                       */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* ---------------------------------------------------------------- */}
        {/* DESKTOP FILTER SIDEBAR                                          */}
        {/* ---------------------------------------------------------------- */}

        <aside className="hidden lg:block premium-panel p-5 rounded-3xl sticky top-24">
          <FilterPanel
            filters={currentFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </aside>

        {/* ---------------------------------------------------------------- */}
        {/* MOBILE FILTER DRAWER                                             */}
        {/* ---------------------------------------------------------------- */}

        {mobileFilterOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-label="Construction Product Filters"
            onClick={(event) => {
              /*
               * Clicking the backdrop closes the drawer.
               * Clicking inside the panel does not.
               */
              if (event.target === event.currentTarget) {
                setMobileFilterOpen(false);
              }
            }}
          >
            <div className="w-full max-w-xs bg-[#0a1424] h-full p-5 overflow-y-auto border-l border-white/10 shadow-2xl flex flex-col">
              <div className="flex-1">
                <FilterPanel
                  filters={currentFilters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                  isMobileDrawer={true}
                  onCloseMobileDrawer={() => setMobileFilterOpen(false)}
                />
              </div>

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

        {/* ---------------------------------------------------------------- */}
        {/* RESULTS                                                          */}
        {/* ---------------------------------------------------------------- */}

        <section
          className="lg:col-span-3 space-y-4"
          aria-live="polite"
          aria-busy={loading}
        >
          {/* -------------------------------------------------------------- */}
          {/* LOADING                                                        */}
          {/* -------------------------------------------------------------- */}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <ProductCardSkeleton key={`product-skeleton-${index}`} />
              ))}
            </div>
          ) : error ? (
            /* ------------------------------------------------------------ */
            /* ERROR                                                        */
            /* ------------------------------------------------------------ */

            <ErrorStateView
              title="Error Loading Products"
              description={error}
              onRetry={fetchFilteredProducts}
            />
          ) : products.length === 0 ? (
            /* ------------------------------------------------------------ */
            /* EMPTY                                                        */
            /* ------------------------------------------------------------ */

            <EmptyStateView
              icon={PackageX}
              title="No Products Match Filters"
              description="Try widening your price range, removing a filter, or clearing all filters to explore more construction products."
              actionLabel="Reset All Filters"
              onActionClick={handleClearFilters}
            />
          ) : (
            /* ------------------------------------------------------------ */
            /* PRODUCT GRID                                                 */
            /* ------------------------------------------------------------ */

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id || product.slug}
                  product={product}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProductListing;
