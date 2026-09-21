import React, { useEffect, useMemo, useState } from "react";
import {
  Filter,
  X,
  Zap,
  RotateCcw,
  MapPin,
  Check,
  ShieldCheck,
  Package,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { productService } from "../../services/productService";

export const FilterPanel = ({
  filters = {},
  onFilterChange,
  onClearFilters,
  isMobileDrawer = false,
  onCloseMobileDrawer,
}) => {
  const [categories, setCategories] = useState([]);

  const [facets, setFacets] = useState({
    brands: [],
    units: [],
    grades: [],
    minPrice: 40,
    maxPrice: 8000,
  });

  const [loading, setLoading] = useState(true);

  const [facetError, setFacetError] = useState("");

  /*
   * --------------------------------------------------------------------------
   * LOAD CUSTOMER FILTER DATA
   * --------------------------------------------------------------------------
   *
   * Categories come from the live Supabase product_categories table.
   * Only active categories are allowed into the customer filter.
   */

  useEffect(() => {
    let mounted = true;

    const loadFilterData = async () => {
      setLoading(true);

      setFacetError("");

      try {
        const [categoryData, facetData] = await Promise.all([
          productService.getCategories(),
          productService.getFilterFacets(),
        ]);

        if (!mounted) {
          return;
        }

        /*
         * Defensive active-category validation.
         *
         * productService should already return active categories,
         * but the customer UI should never display an inactive category
         * even if an unexpected service response contains one.
         */
        const activeCategories = Array.isArray(categoryData)
          ? categoryData.filter(
              (category) =>
                category &&
                category.slug &&
                category.name &&
                category.isActive !== false,
            )
          : [];

        setCategories(activeCategories);

        setFacets({
          brands: Array.isArray(facetData?.brands) ? facetData.brands : [],

          units: Array.isArray(facetData?.units) ? facetData.units : [],

          grades: Array.isArray(facetData?.grades) ? facetData.grades : [],

          minPrice: Number(facetData?.minPrice) || 40,

          maxPrice: Number(facetData?.maxPrice) || 8000,
        });
      } catch (error) {
        console.error("Failed to load product filters:", error);

        if (!mounted) {
          return;
        }

        setFacetError(
          error?.message ||
            "Unable to load some product filters. Please try again.",
        );

        setCategories([]);

        setFacets({
          brands: [],
          units: [],
          grades: [],
          minPrice: 40,
          maxPrice: 8000,
        });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadFilterData();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * --------------------------------------------------------------------------
   * NORMALIZED FILTERS
   * --------------------------------------------------------------------------
   */

  const normalizedFilters = useMemo(
    () => ({
      category: filters.category || "",

      brand: filters.brand || "",

      unit: filters.unit || "",

      grade: filters.grade || "",

      inStockOnly: Boolean(
        filters.inStockOnly === true || filters.inStockOnly === "true",
      ),

      minPrice: filters.minPrice || "",

      maxPrice: filters.maxPrice || "",

      expressOnly: Boolean(
        filters.expressOnly === true || filters.expressOnly === "true",
      ),

      pincode: filters.pincode || "",
    }),
    [filters],
  );

  /*
   * --------------------------------------------------------------------------
   * VALID SELECTED CATEGORY
   * --------------------------------------------------------------------------
   *
   * If a category is inactive or no longer exists, it should not remain
   * visually selected in the filter panel.
   */

  const selectedCategory = useMemo(() => {
    const selectedSlug = String(normalizedFilters.category || "")
      .trim()
      .toLowerCase();

    if (!selectedSlug || selectedSlug === "all") {
      return null;
    }

    return (
      categories.find(
        (category) =>
          String(category?.slug || "")
            .trim()
            .toLowerCase() === selectedSlug,
      ) || null
    );
  }, [categories, normalizedFilters.category]);

  /*
   * --------------------------------------------------------------------------
   * ACTIVE FILTER STATE
   * --------------------------------------------------------------------------
   */

  const hasActiveFilters = Boolean(
    (normalizedFilters.category &&
      normalizedFilters.category !== "all" &&
      selectedCategory) ||
    (normalizedFilters.brand && normalizedFilters.brand !== "all") ||
    (normalizedFilters.unit && normalizedFilters.unit !== "all") ||
    (normalizedFilters.grade && normalizedFilters.grade !== "all") ||
    normalizedFilters.inStockOnly ||
    normalizedFilters.minPrice ||
    normalizedFilters.maxPrice ||
    normalizedFilters.expressOnly ||
    normalizedFilters.pincode,
  );

  /*
   * --------------------------------------------------------------------------
   * FILTER HANDLERS
   * --------------------------------------------------------------------------
   */

  const handleFilterChange = (key, value) => {
    if (typeof onFilterChange !== "function") {
      return;
    }

    onFilterChange(key, value);
  };

  const handleCategoryChange = (categorySlug) => {
    /*
     * Only allow category slugs that belong to the active category list.
     */
    if (
      categorySlug &&
      categorySlug !== "all" &&
      !categories.some(
        (category) =>
          String(category?.slug || "").toLowerCase() ===
          String(categorySlug).toLowerCase(),
      )
    ) {
      return;
    }

    handleFilterChange("category", categorySlug);
  };

  const handlePincodeChange = (event) => {
    const value = event.target.value.replace(/\D/g, "").slice(0, 6);

    handleFilterChange("pincode", value);
  };

  const handleBooleanFilterChange = (key, checked) => {
    handleFilterChange(key, checked ? "true" : "");
  };

  /*
   * --------------------------------------------------------------------------
   * PRICE HELPERS
   * --------------------------------------------------------------------------
   */

  const formatPrice = (value) => {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return "0";
    }

    return numericValue.toLocaleString("en-IN");
  };

  const selectedMaxPrice =
    Number(normalizedFilters.maxPrice) || Number(facets.maxPrice) || 8000;

  const minPrice = Number(facets.minPrice) || 40;

  const maxPrice = Number(facets.maxPrice) || 8000;

  /*
   * --------------------------------------------------------------------------
   * CATEGORY LIST
   * --------------------------------------------------------------------------
   */

  const categoryList = useMemo(() => {
    return categories
      .filter(
        (category) =>
          category &&
          category.slug &&
          category.name &&
          category.isActive !== false,
      )
      .sort(
        (a, b) => Number(a.displayOrder ?? 0) - Number(b.displayOrder ?? 0),
      );
  }, [categories]);

  /*
   * --------------------------------------------------------------------------
   * BRAND LIST
   * --------------------------------------------------------------------------
   */

  const brandList = useMemo(() => {
    return [
      ...new Set(
        (facets.brands || [])
          .filter(Boolean)
          .map((brand) => String(brand).trim())
          .filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [facets.brands]);

  /*
   * --------------------------------------------------------------------------
   * UNIT LIST
   * --------------------------------------------------------------------------
   */

  const unitList = useMemo(() => {
    return [
      ...new Set(
        (facets.units || [])
          .filter(Boolean)
          .map((unit) => String(unit).trim())
          .filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [facets.units]);

  /*
   * --------------------------------------------------------------------------
   * GRADE LIST
   * --------------------------------------------------------------------------
   */

  const gradeList = useMemo(() => {
    return [
      ...new Set(
        (facets.grades || [])
          .filter(Boolean)
          .map((grade) => String(grade).trim())
          .filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [facets.grades]);

  /*
   * --------------------------------------------------------------------------
   * RENDER
   * --------------------------------------------------------------------------
   */

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#173885]" />

          <h3 className="text-sm font-bold text-[#173885]">Filter Products</h3>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-xs font-bold text-[#3C7DDA] hover:underline flex items-center gap-1"
              aria-label="Clear all filters"
            >
              <RotateCcw className="w-3 h-3" />

              <span>Clear All</span>
            </button>
          )}

          {isMobileDrawer && (
            <button
              type="button"
              onClick={onCloseMobileDrawer}
              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-[#E4EEF3] text-[#606460] hover:text-[#282926] transition"
              aria-label="Close Filter Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}

      {loading && (
        <div className="flex items-center gap-2 rounded-xl border border-[#D9E2EA] bg-[#F7FAFC] px-3 py-2.5">
          <Loader2 className="w-4 h-4 text-[#3C7DDA] animate-spin" />

          <span className="text-xs font-semibold text-[#606460]">
            Loading product filters...
          </span>
        </div>
      )}

      {/* Facet Error */}

      {!loading && facetError && (
        <div className="rounded-xl border border-[#F0C7BE] bg-[#FFF5F2] p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#B43D20] mt-0.5 shrink-0" />

            <div>
              <p className="text-xs font-bold text-[#B43D20]">
                Filter data unavailable
              </p>

              <p className="text-[11px] leading-5 text-[#7D5147] mt-0.5">
                {facetError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 1. 30-Minute Express Filter */}

      <div className="p-3.5 rounded-2xl bg-[#E4EEF3] border border-[#9AAED4]/40">
        <label className="flex items-center justify-between cursor-pointer select-none min-h-[32px]">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#3C7DDA] fill-[#3C7DDA]" />

            <div>
              <span className="text-xs font-bold text-[#173885] block">
                30-Minute Delivery
              </span>

              <span className="text-[10px] text-[#6F8A92]">
                Show eligible products only
              </span>
            </div>
          </div>

          <input
            type="checkbox"
            checked={normalizedFilters.expressOnly}
            onChange={(event) =>
              handleBooleanFilterChange("expressOnly", event.target.checked)
            }
            className="w-5 h-5 rounded accent-[#3C7DDA] cursor-pointer"
            aria-label="Filter products eligible for 30-minute delivery"
          />
        </label>
      </div>

      {/* 2. Construction Site PIN Code */}

      <div className="space-y-1.5">
        <label
          htmlFor="filter-pincode-input"
          className="flex items-center gap-1.5 text-xs font-bold text-[#282926]"
        >
          <MapPin className="w-3.5 h-3.5 text-[#3C7DDA]" />

          <span>Construction Site PIN Code</span>
        </label>

        <div className="flex gap-2">
          <input
            id="filter-pincode-input"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 411006, 411061"
            maxLength={6}
            value={normalizedFilters.pincode}
            onChange={handlePincodeChange}
            className="w-full gm-input px-3 py-2 rounded-xl text-xs font-mono font-bold"
            aria-label="Enter 6-digit PIN code"
          />

          {normalizedFilters.pincode && (
            <button
              type="button"
              onClick={() => handleFilterChange("pincode", "")}
              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-[#E4EEF3] text-[#606460] hover:text-[#282926] transition"
              aria-label="Clear PIN filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {normalizedFilters.pincode &&
          normalizedFilters.pincode.length !== 6 && (
            <p className="text-[10px] text-[#B43D20]">
              Enter a valid 6-digit PIN code.
            </p>
          )}
      </div>

      {/* 3. Product Categories */}

      <div className="space-y-2">
        <span className="text-[11px] font-bold text-[#6F8A92] uppercase tracking-wider block">
          Product Category
        </span>

        <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => handleCategoryChange("all")}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-between min-h-[38px] ${
              !normalizedFilters.category ||
              normalizedFilters.category === "all" ||
              !selectedCategory
                ? "bg-[#E4EEF3] text-[#173885] border border-[#9AAED4]/40 font-bold"
                : "text-[#282926] hover:bg-[#F4F6FA]"
            }`}
          >
            <span>All Categories</span>

            {(!normalizedFilters.category ||
              normalizedFilters.category === "all" ||
              !selectedCategory) && (
              <Check className="w-3.5 h-3.5 text-[#173885]" />
            )}
          </button>

          {categoryList.map((category) => {
            const isSelected = selectedCategory?.slug === category.slug;

            return (
              <button
                key={category.id || category.slug}
                type="button"
                onClick={() => handleCategoryChange(category.slug)}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center justify-between min-h-[38px] ${
                  isSelected
                    ? "bg-[#E4EEF3] text-[#173885] border border-[#9AAED4]/40 font-bold"
                    : "text-[#282926] hover:bg-[#F4F6FA]"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {category.image || category.imageUrl ? (
                    <img
                      src={category.image || category.imageUrl}
                      alt=""
                      className="w-6 h-6 rounded-md object-cover bg-[#D9E2EA] shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-md bg-[#D9E2EA] flex items-center justify-center shrink-0">
                      <Package className="w-3.5 h-3.5 text-[#6F8A92]" />
                    </div>
                  )}

                  <span className="truncate">{category.name}</span>
                </div>

                {isSelected && (
                  <Check className="w-3.5 h-3.5 shrink-0 text-[#173885] ml-1" />
                )}
              </button>
            );
          })}

          {!loading && categoryList.length === 0 && (
            <div className="px-3 py-4 text-center">
              <Package className="w-5 h-5 mx-auto text-[#9AAED4]" />

              <p className="text-[11px] text-[#6F8A92] mt-1">
                No active product categories available.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Brand / Manufacturer */}

      {brandList.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-[#6F8A92] uppercase tracking-wider block">
            Brand / Manufacturer
          </span>

          <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => handleFilterChange("brand", "all")}
              className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center justify-between min-h-[34px] ${
                !normalizedFilters.brand || normalizedFilters.brand === "all"
                  ? "bg-[#E4EEF3] text-[#173885] font-bold"
                  : "text-[#282926] hover:bg-[#F4F6FA]"
              }`}
            >
              <span>All Brands</span>

              {(!normalizedFilters.brand ||
                normalizedFilters.brand === "all") && (
                <Check className="w-3.5 h-3.5 text-[#173885]" />
              )}
            </button>

            {brandList.map((brandName) => {
              const isSelected =
                normalizedFilters.brand.toLowerCase() ===
                brandName.toLowerCase();

              return (
                <button
                  key={brandName}
                  type="button"
                  onClick={() => handleFilterChange("brand", brandName)}
                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center justify-between min-h-[34px] ${
                    isSelected
                      ? "bg-[#E4EEF3] text-[#173885] font-bold"
                      : "text-[#282926] hover:bg-[#F4F6FA]"
                  }`}
                >
                  <span className="truncate">{brandName}</span>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 shrink-0 text-[#173885]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Unit */}

      {unitList.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-[#6F8A92] uppercase tracking-wider block">
            Unit
          </span>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleFilterChange("unit", "all")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition ${
                !normalizedFilters.unit || normalizedFilters.unit === "all"
                  ? "bg-[#E4EEF3] border-[#9AAED4]/40 text-[#173885] font-bold"
                  : "bg-white border-[#D9E2EA] text-[#606460] hover:bg-[#F4F6FA]"
              }`}
            >
              All
            </button>

            {unitList.map((unit) => {
              const isSelected =
                normalizedFilters.unit.toLowerCase() === unit.toLowerCase();

              return (
                <button
                  key={unit}
                  type="button"
                  onClick={() => handleFilterChange("unit", unit)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition ${
                    isSelected
                      ? "bg-[#E4EEF3] border-[#9AAED4]/40 text-[#173885] font-bold"
                      : "bg-white border-[#D9E2EA] text-[#606460] hover:bg-[#F4F6FA]"
                  }`}
                >
                  {unit}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Grade */}

      {gradeList.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-[#6F8A92] uppercase tracking-wider block">
            Grade / Specification
          </span>

          <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => handleFilterChange("grade", "all")}
              className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center justify-between min-h-[34px] ${
                !normalizedFilters.grade || normalizedFilters.grade === "all"
                  ? "bg-[#E4EEF3] text-[#173885] font-bold"
                  : "text-[#282926] hover:bg-[#F4F6FA]"
              }`}
            >
              <span>All Grades</span>

              {(!normalizedFilters.grade ||
                normalizedFilters.grade === "all") && (
                <Check className="w-3.5 h-3.5 text-[#173885]" />
              )}
            </button>

            {gradeList.map((grade) => {
              const isSelected =
                normalizedFilters.grade.toLowerCase() === grade.toLowerCase();

              return (
                <button
                  key={grade}
                  type="button"
                  onClick={() => handleFilterChange("grade", grade)}
                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center justify-between min-h-[34px] ${
                    isSelected
                      ? "bg-[#E4EEF3] text-[#173885] font-bold"
                      : "text-[#282926] hover:bg-[#F4F6FA]"
                  }`}
                >
                  <span className="truncate">{grade}</span>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 shrink-0 text-[#173885]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. In-Stock Availability */}

      <div className="p-3 rounded-2xl bg-[#E4EEF3]/60 border border-[#D9E2EA]">
        <label className="flex items-center justify-between cursor-pointer select-none min-h-[28px]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#3F7D20]" />

            <div>
              <span className="text-xs font-bold text-[#282926] block">
                In-Stock Only
              </span>

              <span className="text-[10px] text-[#6F8A92]">
                Hide products with no available inventory
              </span>
            </div>
          </div>

          <input
            type="checkbox"
            checked={normalizedFilters.inStockOnly}
            onChange={(event) =>
              handleBooleanFilterChange("inStockOnly", event.target.checked)
            }
            className="w-4 h-4 rounded accent-[#3C7DDA] cursor-pointer"
            aria-label="Filter in-stock construction products only"
          />
        </label>
      </div>

      {/* 8. Maximum Price */}

      <div className="space-y-2.5">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-[#606460] uppercase tracking-wider text-[11px]">
            Max Price per Unit
          </span>

          <span className="font-black text-[#173885] font-mono">
            ₹{formatPrice(selectedMaxPrice)}
          </span>
        </div>

        <input
          type="range"
          min={minPrice}
          max={maxPrice}
          step={50}
          value={Math.min(Math.max(selectedMaxPrice, minPrice), maxPrice)}
          onChange={(event) =>
            handleFilterChange("maxPrice", event.target.value)
          }
          className="w-full accent-[#3C7DDA] cursor-pointer"
          aria-label="Maximum unit price filter"
        />

        <div className="flex justify-between text-[10px] text-[#6F8A92] font-mono">
          <span>₹{formatPrice(minPrice)}</span>

          <span>₹{formatPrice(maxPrice)}</span>
        </div>
      </div>

      {/* Active Filter Summary */}

      {hasActiveFilters && (
        <div className="pt-2 border-t border-[#D9E2EA]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#6F8A92]">
              Active Filters
            </span>

            <span className="text-[10px] font-bold text-[#173885]">
              {
                [
                  normalizedFilters.category &&
                    normalizedFilters.category !== "all" &&
                    selectedCategory,

                  normalizedFilters.brand && normalizedFilters.brand !== "all",

                  normalizedFilters.unit && normalizedFilters.unit !== "all",

                  normalizedFilters.grade && normalizedFilters.grade !== "all",

                  normalizedFilters.inStockOnly,

                  normalizedFilters.maxPrice,

                  normalizedFilters.minPrice,

                  normalizedFilters.expressOnly,

                  normalizedFilters.pincode,
                ].filter(Boolean).length
              }
            </span>
          </div>

          <button
            type="button"
            onClick={onClearFilters}
            className="w-full py-2.5 rounded-xl bg-[#FBE3DE] hover:bg-[#FBE3DE]/80 text-[#B43D20] border border-[#B43D20]/30 text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />

            <span>Clear All Product Filters</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
