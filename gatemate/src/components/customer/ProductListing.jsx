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

  const [categoryDetails, setCategoryDetails] = useState(null);

  /*
   * --------------------------------------------------------------------------
   * LOAD CATEGORY DETAILS
   * --------------------------------------------------------------------------
   *
   * Category information comes from Supabase.
   *
   * This prevents the page from guessing names such as:
   *
   * demo-category -> Demo Category
   *
   * Instead it uses the actual category name configured
   * by the admin.
   */

  const loadCategoryDetails = useCallback(async () => {
    if (!category || category === "all") {
      setCategoryDetails(null);
      return;
    }

    try {
      const categories = await productService.getCategories();

      const activeCategories = (
        Array.isArray(categories) ? categories : []
      ).filter((item) => {
        if (!item) {
          return false;
        }

        if (item.isActive === false) {
          return false;
        }

        if (item.is_active === false) {
          return false;
        }

        return Boolean(item.slug && item.name);
      });

      const selected = activeCategories.find(
        (item) =>
          String(item.slug).toLowerCase() === String(category).toLowerCase(),
      );

      /*
       * If the category no longer exists or is inactive,
       * remove it from the URL and return to all products.
       */

      if (!selected) {
        const updated = new URLSearchParams(searchParams);

        updated.delete("category");

        setSearchParams(updated, {
          replace: true,
        });

        setCategoryDetails(null);

        return;
      }

      setCategoryDetails(selected);
    } catch (err) {
      console.error("ProductListing: failed to load category:", err);

      setCategoryDetails(null);
    }
  }, [category, searchParams, setSearchParams]);

  /*
   * --------------------------------------------------------------------------
   * FETCH PRODUCTS
   * --------------------------------------------------------------------------
   */

  const fetchFilteredProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await productService.queryProducts({
        category,
        categorySlug: category !== "all" ? category : "",

        brand,
        unit,
        grade,
        inStockOnly,

        minPrice: minPrice !== "" ? Number(minPrice) : undefined,

        maxPrice: maxPrice !== "" ? Number(maxPrice) : undefined,

        sort,

        expressOnly,

        pincode,

        limit: 50,

        offset: 0,
      });

      /*
       * IMPORTANT:
       *
       * catalogRepository.queryCatalog()
       * returns:
       *
       * {
       *   products: [],
       *   items: [],
       *   totalCount: 0,
       *   ...
       * }
       *
       * Therefore we must extract the products array.
       */

      const productList = Array.isArray(data)
        ? data
        : Array.isArray(data?.products)
          ? data.products
          : Array.isArray(data?.items)
            ? data.items
            : [];

      console.log(
        "========== PRODUCT IMAGE DEBUG ==========",
        JSON.stringify(
          productList.map((product) => ({
            id: product.id,
            name: product.name,
            img: product.img,
            image: product.image,
            coverImageUrl: product.coverImageUrl,
            images: product.images,
            imageUrls: product.imageUrls,
            originalImageUrls: product.originalRow?.image_urls,
            originalCoverImageUrl: product.originalRow?.cover_image_url,
          })),
          null,
          2,
        ),
      );
      console.log("=========================================");

      setProducts(productList);
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
   * LOAD CATEGORY + PRODUCTS
   * --------------------------------------------------------------------------
   */

  useEffect(() => {
    loadCategoryDetails();
  }, [loadCategoryDetails]);

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
   */

  const isFilteredCategory = category && category !== "all";

  const categoryTitle = isFilteredCategory
    ? categoryDetails?.name ||
      category
        .split("-")
        .filter(Boolean)
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join(" ")
    : "All Construction Products";

  const categoryDescription =
    categoryDetails?.descriptor ||
    `Explore verified ${categoryTitle} construction products in Pune & PCMC.`;

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

    categoryDescription,

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
        title={`${categoryTitle} | Ferrado Construction Products`}
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

          {categoryDetails?.descriptor && (
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              {categoryDetails.descriptor}
            </p>
          )}

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
              if (event.target === event.currentTarget) {
                setMobileFilterOpen(false);
              }
            }}
          >
            <div className="w-full max-w-sm h-full overflow-y-auto bg-[#FEFEFE] p-5">
              <FilterPanel
                filters={currentFilters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                isMobileDrawer={true}
                onCloseMobileDrawer={() => setMobileFilterOpen(false)}
              />
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* PRODUCT RESULTS                                                  */}
        {/* ---------------------------------------------------------------- */}

        <main className="lg:col-span-3 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({
                length: 6,
              }).map((_, index) => (
                <ProductCardSkeleton key={`product-skeleton-${index}`} />
              ))}
            </div>
          ) : error ? (
            <ErrorStateView
              title="Unable to Load Products"
              message={error}
              onRetry={fetchFilteredProducts}
            />
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id || product.slug}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <EmptyStateView
              icon={PackageX}
              title="No Products Match Filters"
              message="Try widening your price range, removing a filter, or clearing all filters to explore more construction products."
              actionLabel="Reset All Filters"
              onAction={handleClearFilters}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductListing;
