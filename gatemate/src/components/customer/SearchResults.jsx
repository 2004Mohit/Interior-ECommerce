import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { productService } from "../../services/productService";

import ProductCard from "./ProductCard";
import { ProductCardSkeleton } from "../ProductCardSkeleton";
import FilterPanel from "./FilterPanel";
import { SortSelect } from "./SortSelect";

/*
 * =============================================================================
 * CUSTOMER SEARCH RESULTS
 * =============================================================================
 *
 * URL is the single source of truth.
 *
 * Supported:
 *
 * /search?q=cement
 * /search?q=ultratech
 * /search?q=ceme
 *
 * Filters:
 *
 * category
 * brand
 * unit
 * grade
 * inStockOnly
 * expressOnly
 * pincode
 * minPrice
 * maxPrice
 *
 * Sort:
 *
 * relevance
 * price_low
 * price_high
 * newest
 *
 * Search and filters are passed to productService.queryProducts().
 * FilterPanel uses the same filter object and reports individual changes
 * through onFilterChange(key, value).
 */

/*
 * =============================================================================
 * HELPERS
 * =============================================================================
 */

const cleanText = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

const normalizeSearch = (value) => {
  return cleanText(value).replace(/\s+/g, " ").trim();
};

const normalizeBoolean = (value) => {
  return value === true || String(value).toLowerCase() === "true";
};

const normalizeNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : "";
};

const getProductsFromResponse = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.products)) {
    return response.products;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
};

const getTotalFromResponse = (response, products) => {
  if (response?.totalCount !== undefined) {
    return Number(response.totalCount) || 0;
  }

  if (response?.total !== undefined) {
    return Number(response.total) || 0;
  }

  if (response?.count !== undefined) {
    return Number(response.count) || 0;
  }

  return products.length;
};

/*
 * =============================================================================
 * URL PARAMETER PARSER
 * =============================================================================
 */

const readSearchParams = (searchString) => {
  const params = new URLSearchParams(searchString);

  return {
    search: normalizeSearch(params.get("q") || params.get("search") || ""),

    category: cleanText(
      params.get("category") || params.get("categorySlug") || "",
    ),

    brand: cleanText(params.get("brand") || ""),

    unit: cleanText(params.get("unit") || ""),

    grade: cleanText(params.get("grade") || ""),

    inStockOnly: normalizeBoolean(params.get("inStockOnly")),

    expressOnly: normalizeBoolean(params.get("expressOnly")),

    pincode: cleanText(params.get("pincode") || ""),

    minPrice: normalizeNumber(params.get("minPrice")),

    maxPrice: normalizeNumber(params.get("maxPrice")),

    sort: cleanText(params.get("sort") || "relevance") || "relevance",

    page: Math.max(1, Number(params.get("page")) || 1),
  };
};

/*
 * =============================================================================
 * URL BUILDER
 * =============================================================================
 */

const buildSearchUrl = (pathname, state) => {
  const params = new URLSearchParams();

  const search = normalizeSearch(state.search);

  if (search) {
    params.set("q", search);
  }

  if (state.category && state.category !== "all") {
    params.set("category", state.category);
  }

  if (state.brand && state.brand !== "all") {
    params.set("brand", state.brand);
  }

  if (state.unit && state.unit !== "all") {
    params.set("unit", state.unit);
  }

  if (state.grade && state.grade !== "all") {
    params.set("grade", state.grade);
  }

  if (state.inStockOnly) {
    params.set("inStockOnly", "true");
  }

  if (state.expressOnly) {
    params.set("expressOnly", "true");
  }

  if (state.pincode) {
    params.set("pincode", state.pincode);
  }

  if (
    state.minPrice !== "" &&
    state.minPrice !== null &&
    state.minPrice !== undefined
  ) {
    params.set("minPrice", String(state.minPrice));
  }

  if (
    state.maxPrice !== "" &&
    state.maxPrice !== null &&
    state.maxPrice !== undefined
  ) {
    params.set("maxPrice", String(state.maxPrice));
  }

  if (state.sort && state.sort !== "relevance") {
    params.set("sort", state.sort);
  }

  if (Number(state.page) > 1) {
    params.set("page", String(state.page));
  }

  const query = params.toString();

  return query ? `${pathname}?${query}` : pathname;
};

/*
 * =============================================================================
 * COMPONENT
 * =============================================================================
 */

export const SearchResults = () => {
  const location = useLocation();

  const navigate = useNavigate();

  /*
   * ---------------------------------------------------------------------------
   * URL STATE
   * ---------------------------------------------------------------------------
   */

  const urlFilters = useMemo(
    () => readSearchParams(location.search),
    [location.search],
  );

  /*
   * ---------------------------------------------------------------------------
   * LOCAL STATE
   * ---------------------------------------------------------------------------
   */

  const [products, setProducts] = useState([]);

  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  /*
   * ---------------------------------------------------------------------------
   * PAGINATION
   * ---------------------------------------------------------------------------
   */

  const pageSize = 24;

  const offset = (urlFilters.page - 1) * pageSize;

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  /*
   * ---------------------------------------------------------------------------
   * FILTER OBJECT
   * ---------------------------------------------------------------------------
   *
   * This object is passed directly to FilterPanel.
   *
   * This matches the actual FilterPanel interface:
   *
   * filters={}
   * onFilterChange={}
   * onClearFilters={}
   */

  const filterState = useMemo(
    () => ({
      category: urlFilters.category,

      brand: urlFilters.brand,

      unit: urlFilters.unit,

      grade: urlFilters.grade,

      inStockOnly: urlFilters.inStockOnly,

      expressOnly: urlFilters.expressOnly,

      pincode: urlFilters.pincode,

      minPrice: urlFilters.minPrice,

      maxPrice: urlFilters.maxPrice,
    }),
    [
      urlFilters.category,
      urlFilters.brand,
      urlFilters.unit,
      urlFilters.grade,
      urlFilters.inStockOnly,
      urlFilters.expressOnly,
      urlFilters.pincode,
      urlFilters.minPrice,
      urlFilters.maxPrice,
    ],
  );

  /*
   * ---------------------------------------------------------------------------
   * LOAD PRODUCTS
   * ---------------------------------------------------------------------------
   */

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await productService.queryProducts({
        search: urlFilters.search,

        category: urlFilters.category,

        categorySlug: urlFilters.category,

        brand: urlFilters.brand,

        unit: urlFilters.unit,

        grade: urlFilters.grade,

        inStockOnly: urlFilters.inStockOnly,

        expressOnly: urlFilters.expressOnly,

        pincode: urlFilters.pincode,

        minPrice: urlFilters.minPrice,

        maxPrice: urlFilters.maxPrice,

        sort: urlFilters.sort,

        limit: pageSize,

        offset,
      });

      const nextProducts = getProductsFromResponse(response);

      const nextTotal = getTotalFromResponse(response, nextProducts);

      setProducts(nextProducts);

      setTotalCount(nextTotal);
    } catch (err) {
      console.error("Customer search failed:", err);

      setProducts([]);

      setTotalCount(0);

      setError(err?.message || "Unable to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [
    urlFilters.search,
    urlFilters.category,
    urlFilters.brand,
    urlFilters.unit,
    urlFilters.grade,
    urlFilters.inStockOnly,
    urlFilters.expressOnly,
    urlFilters.pincode,
    urlFilters.minPrice,
    urlFilters.maxPrice,
    urlFilters.sort,
    offset,
  ]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  /*
   * ---------------------------------------------------------------------------
   * UPDATE ONE FILTER
   * ---------------------------------------------------------------------------
   *
   * FilterPanel calls:
   *
   * onFilterChange("brand", "UltraTech")
   * onFilterChange("category", "cement")
   * onFilterChange("maxPrice", "5000")
   * onFilterChange("inStockOnly", "true")
   *
   * Every filter change:
   *
   * 1. Updates URL
   * 2. Resets page to 1
   * 3. Automatically reloads products
   */

  const handleFilterChange = useCallback(
    (key, value) => {
      const nextState = {
        search: urlFilters.search,

        category: urlFilters.category,

        brand: urlFilters.brand,

        unit: urlFilters.unit,

        grade: urlFilters.grade,

        inStockOnly: urlFilters.inStockOnly,

        expressOnly: urlFilters.expressOnly,

        pincode: urlFilters.pincode,

        minPrice: urlFilters.minPrice,

        maxPrice: urlFilters.maxPrice,

        sort: urlFilters.sort,

        page: 1,
      };

      /*
       * Normalize "all" into empty state.
       */

      if (
        key === "category" ||
        key === "brand" ||
        key === "unit" ||
        key === "grade"
      ) {
        nextState[key] = value === "all" ? "" : cleanText(value);
      } else if (key === "inStockOnly" || key === "expressOnly") {
        nextState[key] = normalizeBoolean(value);
      } else if (key === "minPrice" || key === "maxPrice") {
        nextState[key] = normalizeNumber(value);
      } else if (key === "pincode") {
        nextState[key] = cleanText(value).replace(/\D/g, "").slice(0, 6);
      } else {
        nextState[key] = value;
      }

      navigate(buildSearchUrl(location.pathname, nextState));
    },
    [location.pathname, navigate, urlFilters],
  );

  /*
   * ---------------------------------------------------------------------------
   * CLEAR FILTERS
   * ---------------------------------------------------------------------------
   */

  const handleClearFilters = useCallback(() => {
    const nextState = {
      search: urlFilters.search,

      category: "",

      brand: "",

      unit: "",

      grade: "",

      inStockOnly: false,

      expressOnly: false,

      pincode: "",

      minPrice: "",

      maxPrice: "",

      sort: urlFilters.sort,

      page: 1,
    };

    navigate(buildSearchUrl(location.pathname, nextState));

    setMobileFilterOpen(false);
  }, [location.pathname, navigate, urlFilters.search, urlFilters.sort]);

  /*
   * ---------------------------------------------------------------------------
   * SORT
   * ---------------------------------------------------------------------------
   */

  const handleSortChange = useCallback(
    (value) => {
      const nextState = {
        ...urlFilters,

        sort: cleanText(value) || "relevance",

        page: 1,
      };

      navigate(buildSearchUrl(location.pathname, nextState));
    },
    [location.pathname, navigate, urlFilters],
  );

  /*
   * ---------------------------------------------------------------------------
   * PAGINATION
   * ---------------------------------------------------------------------------
   */

  const handlePageChange = useCallback(
    (page) => {
      const nextPage = Math.max(1, Math.min(Number(page) || 1, totalPages));

      const nextState = {
        ...urlFilters,

        page: nextPage,
      };

      navigate(buildSearchUrl(location.pathname, nextState));

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    },
    [location.pathname, navigate, totalPages, urlFilters],
  );

  /*
   * ---------------------------------------------------------------------------
   * ACTIVE FILTER DETECTION
   * ---------------------------------------------------------------------------
   */

  const hasActiveFilters =
    Boolean(urlFilters.category) ||
    Boolean(urlFilters.brand) ||
    Boolean(urlFilters.unit) ||
    Boolean(urlFilters.grade) ||
    urlFilters.inStockOnly ||
    urlFilters.expressOnly ||
    Boolean(urlFilters.pincode) ||
    urlFilters.minPrice !== "" ||
    urlFilters.maxPrice !== "";

  /*
   * ---------------------------------------------------------------------------
   * TITLE
   * ---------------------------------------------------------------------------
   */

  const resultTitle = urlFilters.search
    ? `Search results for "${urlFilters.search}"`
    : urlFilters.category
      ? "Products"
      : "All Products";

  /*
   * ---------------------------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------------------------
   */

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ================================================================= */}
        {/* PAGE HEADER                                                       */}
        {/* ================================================================= */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              {resultTitle}
            </h1>

            {!loading && (
              <p className="mt-1 text-sm text-gray-500">
                {totalCount} {totalCount === 1 ? "product" : "products"} found
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="inline-flex items-center rounded-xl border border-[#D9E2EA] bg-white px-4 py-2 text-sm font-semibold text-[#282926] hover:bg-[#F4F6FA] lg:hidden"
            >
              Filters
            </button>

            <SortSelect value={urlFilters.sort} onChange={handleSortChange} />
          </div>
        </div>

        {/* ================================================================= */}
        {/* CONTENT                                                           */}
        {/* ================================================================= */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* =============================================================== */}
          {/* DESKTOP FILTER PANEL                                            */}
          {/* =============================================================== */}

          <aside className="hidden lg:block">
            <FilterPanel
              filters={filterState}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
          </aside>

          {/* =============================================================== */}
          {/* PRODUCT RESULTS                                                  */}
          {/* =============================================================== */}

          <main className="min-w-0">
            {/* Error */}

            {error && (
              <div className="mb-5 rounded-xl border border-[#F0C7BE] bg-[#FFF5F2] p-4 text-sm text-[#B43D20]">
                {error}
              </div>
            )}

            {/* Active filter summary */}

            {!loading && hasActiveFilters && (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-sm font-semibold text-[#606460]">
                  Active filters:
                </span>

                {urlFilters.category && (
                  <span className="rounded-full bg-[#E4EEF3] px-3 py-1 text-xs font-medium text-[#173885]">
                    Category: {urlFilters.category}
                  </span>
                )}

                {urlFilters.brand && (
                  <span className="rounded-full bg-[#E4EEF3] px-3 py-1 text-xs font-medium text-[#173885]">
                    Brand: {urlFilters.brand}
                  </span>
                )}

                {urlFilters.unit && (
                  <span className="rounded-full bg-[#E4EEF3] px-3 py-1 text-xs font-medium text-[#173885]">
                    Unit: {urlFilters.unit}
                  </span>
                )}

                {urlFilters.grade && (
                  <span className="rounded-full bg-[#E4EEF3] px-3 py-1 text-xs font-medium text-[#173885]">
                    Grade: {urlFilters.grade}
                  </span>
                )}

                {urlFilters.inStockOnly && (
                  <span className="rounded-full bg-[#E4EEF3] px-3 py-1 text-xs font-medium text-[#173885]">
                    In stock
                  </span>
                )}

                {urlFilters.expressOnly && (
                  <span className="rounded-full bg-[#E4EEF3] px-3 py-1 text-xs font-medium text-[#173885]">
                    30-minute delivery
                  </span>
                )}

                {urlFilters.pincode && (
                  <span className="rounded-full bg-[#E4EEF3] px-3 py-1 text-xs font-medium text-[#173885]">
                    PIN: {urlFilters.pincode}
                  </span>
                )}

                {(urlFilters.minPrice !== "" || urlFilters.maxPrice !== "") && (
                  <span className="rounded-full bg-[#E4EEF3] px-3 py-1 text-xs font-medium text-[#173885]">
                    Price: ₹{urlFilters.minPrice || 0} - ₹
                    {urlFilters.maxPrice || "Any"}
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="ml-1 text-xs font-bold text-[#3C7DDA] underline underline-offset-2"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* ============================================================= */}
            {/* LOADING                                                        */}
            {/* ============================================================= */}

            {loading ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({
                  length: 8,
                }).map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                {/* ========================================================= */}
                {/* PRODUCTS                                                   */}
                {/* ========================================================= */}

                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {products.map((product, index) => (
                    <ProductCard
                      key={
                        product?.id ||
                        product?.productId ||
                        product?.slug ||
                        `product-${index}`
                      }
                      product={product}
                    />
                  ))}
                </div>

                {/* ========================================================= */}
                {/* PAGINATION                                                 */}
                {/* ========================================================= */}

                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      disabled={urlFilters.page <= 1}
                      onClick={() => handlePageChange(urlFilters.page - 1)}
                      className="rounded-xl border border-[#D9E2EA] bg-white px-4 py-2 text-sm font-semibold text-[#282926] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>

                    <span className="px-3 text-sm text-[#606460]">
                      Page {urlFilters.page} of {totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={urlFilters.page >= totalPages}
                      onClick={() => handlePageChange(urlFilters.page + 1)}
                      className="rounded-xl border border-[#D9E2EA] bg-white px-4 py-2 text-sm font-semibold text-[#282926] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* ============================================================= */
              /* EMPTY STATE                                                   */
              /* ============================================================= */

              <div className="rounded-2xl border border-[#D9E2EA] bg-[#F7FAFC] px-6 py-16 text-center">
                <h2 className="text-lg font-bold text-[#173885]">
                  No products found
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6F8A92]">
                  {urlFilters.search
                    ? `We couldn't find products matching "${urlFilters.search}". Try a shorter product name, brand, or keyword.`
                    : "Try changing or clearing your filters."}
                </p>

                {(urlFilters.search || hasActiveFilters) && (
                  <button
                    type="button"
                    onClick={() => {
                      navigate(location.pathname);
                    }}
                    className="mt-5 rounded-xl bg-[#173885] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#12306f]"
                  >
                    Clear Search & Filters
                  </button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MOBILE FILTER DRAWER                                                */}
      {/* =================================================================== */}

      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}

          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setMobileFilterOpen(false)}
            className="absolute inset-0 bg-black/40"
          />

          {/* Drawer */}

          <div className="absolute right-0 top-0 h-full w-[90%] max-w-sm overflow-y-auto bg-white p-5 shadow-xl">
            <FilterPanel
              filters={filterState}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              isMobileDrawer={true}
              onCloseMobileDrawer={() => setMobileFilterOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
