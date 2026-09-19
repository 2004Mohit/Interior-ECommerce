import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, PackageX, SlidersHorizontal } from "lucide-react";

import { productService } from "../../services/productService";
import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "../ProductCardSkeleton";
import { FilterPanel } from "./FilterPanel";
import { SortSelect } from "./SortSelect";
import { SeoHead } from "../common/SeoHead";
import { seoService } from "../../services/seoService";
import { ErrorStateView, EmptyStateView } from "../common/StateViews";

export const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  /*
   * --------------------------------------------------------------------------
   * URL PARAMETERS
   * --------------------------------------------------------------------------
   */

  const query = searchParams.get("q") || "";

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
   * FETCH SEARCH RESULTS
   * --------------------------------------------------------------------------
   *
   * Search is handled by the Supabase-backed productService.
   *
   * No:
   * - demoProducts
   * - mockData
   * - static catalogue
   * - banner data
   * - promotion data
   */

  const fetchSearchResults = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await productService.queryProducts({
        search: query.trim(),

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

      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("SearchResults: failed to load products:", err);

      setProducts([]);

      setError(
        err?.message ||
          "Unable to load search results. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    query,
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
   * LOAD RESULTS WHEN SEARCH/FILTERS CHANGE
   * --------------------------------------------------------------------------
   */

  useEffect(() => {
    fetchSearchResults();
  }, [fetchSearchResults]);

  /*
   * --------------------------------------------------------------------------
   * UPDATE URL FILTER
   * --------------------------------------------------------------------------
   */

  const handleFilterChange = useCallback(
    (key, value) => {
      const updated = new URLSearchParams(searchParams);

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
   * CLEAR FILTERS
   * --------------------------------------------------------------------------
   *
   * Keep the search query when clearing filters.
   *
   * Example:
   *
   * /search?q=cement&brand=abc&maxPrice=1000
   *
   * becomes:
   *
   * /search?q=cement
   */

  const handleClearFilters = useCallback(() => {
    const updated = new URLSearchParams();

    if (query.trim()) {
      updated.set("q", query.trim());
    }

    setSearchParams(updated);
  }, [query, setSearchParams]);

  /*
   * --------------------------------------------------------------------------
   * CURRENT FILTER OBJECT
   * --------------------------------------------------------------------------
   */

  const currentFilters = useMemo(
    () => ({
      category,
      brand,
      unit,
      grade,
      inStockOnly,
      minPrice,
      maxPrice,
      expressOnly,
      pincode,
    }),
    [
      category,
      brand,
      unit,
      grade,
      inStockOnly,
      minPrice,
      maxPrice,
      expressOnly,
      pincode,
    ],
  );

  /*
   * --------------------------------------------------------------------------
   * DISPLAY TITLE
   * --------------------------------------------------------------------------
   */

  const searchTitle = query.trim()
    ? `Search results for "${query.trim()}"`
    : "Construction Product Search";

  /*
   * --------------------------------------------------------------------------
   * SEO CATEGORY
   * --------------------------------------------------------------------------
   */

  const categoryTitle =
    category && category !== "all"
      ? category
          .split("-")
          .filter(Boolean)
          .map(
            (word) =>
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
          )
          .join(" ")
      : "Construction Products";

  /*
   * --------------------------------------------------------------------------
   * CANONICAL URL
   * --------------------------------------------------------------------------
   */

  const canonicalParams = new URLSearchParams();

  if (query.trim()) {
    canonicalParams.set("q", query.trim());
  }

  if (category !== "all") {
    canonicalParams.set("category", category);
  }

  const canonicalQuery = canonicalParams.toString();

  const canonicalPath = canonicalQuery
    ? `/search?${canonicalQuery}`
    : "/search";

  /*
   * --------------------------------------------------------------------------
   * SEO STRUCTURED DATA
   * --------------------------------------------------------------------------
   */

  const collectionSchema = seoService.generateCollectionSchema({
    categoryName: query.trim()
      ? `Search results for ${query.trim()}`
      : categoryTitle,

    categoryDescription: query.trim()
      ? `Search verified construction products for ${query.trim()} in Pune and PCMC.`
      : `Search verified construction products available in Pune and PCMC.`,

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
        title={
          query.trim()
            ? `${query.trim()} | GateMate Construction Products`
            : "Search Construction Products | GateMate"
        }
        description={
          query.trim()
            ? `Find verified ${query.trim()} construction products from vendors in Pune and PCMC. Check pricing, availability, units and eligible 30-minute delivery.`
            : "Search verified construction products from vendors in Pune and PCMC with product availability and eligible 30-minute delivery."
        }
        canonicalUrl={canonicalPath}
        structuredData={collectionSchema}
      />

      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Search className="w-4 h-4 text-dark-400 shrink-0" />

            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Product Search
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-dark break-words">
            {searchTitle}
          </h1>

          <p className="text-xs text-slate-400 mt-1">
            {loading
              ? "Searching construction products..."
              : `Found ${products.length} matching product${
                  products.length === 1 ? "" : "s"
                } in Pune / PCMC`}
          </p>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* SORT + MOBILE FILTER                                            */}
        {/* -------------------------------------------------------------- */}

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden premium-card min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold text-dark flex items-center gap-2 border border-white/10"
            aria-label="Open Search Filters"
            aria-haspopup="dialog"
            aria-expanded={mobileFilterOpen}
          >
            <SlidersHorizontal className="w-4 h-4 text-dark-400" />
            <span>Filters</span>
          </button>

          <SortSelect
            value={sort}
            onChange={(value) => handleFilterChange("sort", value)}
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SEARCH QUERY SUMMARY                                               */}
      {/* ------------------------------------------------------------------ */}

      {query.trim() && (
        <div className="premium-card rounded-2xl px-4 py-3 border border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                Search Query
              </p>

              <p className="text-sm font-bold text-dark break-words">
                {query.trim()}
              </p>
            </div>

            {!loading && (
              <p className="text-xs text-slate-400">
                {products.length} result{products.length === 1 ? "" : "s"}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MAIN CONTENT                                                       */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* ---------------------------------------------------------------- */}
        {/* DESKTOP FILTER PANEL                                             */}
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
            aria-label="Search Product Filters"
            onClick={(event) => {
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
                <ProductCardSkeleton key={`search-skeleton-${index}`} />
              ))}
            </div>
          ) : error ? (
            /* ------------------------------------------------------------ */
            /* ERROR                                                        */
            /* ------------------------------------------------------------ */

            <ErrorStateView
              title="Unable to Load Search Results"
              description={error}
              onRetry={fetchSearchResults}
            />
          ) : products.length === 0 ? (
            /* ------------------------------------------------------------ */
            /* EMPTY                                                        */
            /* ------------------------------------------------------------ */

            <EmptyStateView
              icon={PackageX}
              title={
                query.trim()
                  ? `No Products Found for "${query.trim()}"`
                  : "No Construction Products Found"
              }
              description={
                query.trim()
                  ? "Try a different product name, category, brand, unit, or remove some filters."
                  : "Try changing your filters or clear them to explore available construction products."
              }
              actionLabel="Reset Filters"
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

export default SearchResults;
