import React, { useState, useEffect } from "react";
import { Filter, X, Zap, RotateCcw, MapPin, Check } from "lucide-react";
import { productService } from "../../services/productService";

export const FilterPanel = ({
  filters,
  onFilterChange,
  onClearFilters,
  isMobileDrawer = false,
  onCloseMobileDrawer,
}) => {
  const [categories, setCategories] = useState([]);
  const [facets, setFacets] = useState({
    brands: [],
    materials: [],
    minPrice: 40,
    maxPrice: 8000,
  });

  useEffect(() => {
    productService.getCategories().then(setCategories);
    productService.getFilterFacets().then(setFacets);
  }, []);

  const hasActiveFilters = Boolean(
    (filters.category && filters.category !== "all") ||
    (filters.brand && filters.brand !== "all") ||
    (filters.material && filters.material !== "all") ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.expressOnly ||
    filters.pincode,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">Filter & Refine</h3>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-xs font-black text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 px-2.5 py-1 rounded-lg border border-amber-400/30 flex items-center gap-1.5 transition"
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
              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-[#0c182b] text-slate-400 hover:text-white border border-white/5"
              aria-label="Close Filter Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 1. 30-Min Priority Express Toggle */}
      <div className="p-3.5 rounded-2xl bg-[#091526] border border-amber-400/20">
        <label className="flex items-center justify-between cursor-pointer select-none min-h-[32px]">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-xs font-bold text-white">
              30-Min Priority Express
            </span>
          </div>
          <input
            type="checkbox"
            checked={Boolean(filters.expressOnly)}
            onChange={(e) =>
              onFilterChange("expressOnly", e.target.checked ? "true" : "")
            }
            className="w-5 h-5 rounded accent-amber-400 cursor-pointer"
            aria-label="Filter 30-minute priority delivery only"
          />
        </label>
      </div>

      {/* 2. Pincode Verification */}
      <div className="space-y-1.5">
        <label
          htmlFor="filter-pincode-input"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-300"
        >
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span>Delivery PIN Code</span>
        </label>
        <div className="flex gap-2">
          <input
            id="filter-pincode-input"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 411006, 411061"
            maxLength={6}
            value={filters.pincode || ""}
            onChange={(e) =>
              onFilterChange("pincode", e.target.value.replace(/\D/g, ""))
            }
            className="w-full premium-input px-3 py-2.5 rounded-xl text-xs font-mono font-bold"
            aria-label="Enter 6-digit PIN code"
          />
          {filters.pincode && (
            <button
              type="button"
              onClick={() => onFilterChange("pincode", "")}
              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              aria-label="Clear PIN filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Category Facets with Photography Thumbnails */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Category
        </span>
        <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => onFilterChange("category", "all")}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-between min-h-[38px] ${
              !filters.category || filters.category === "all"
                ? "bg-[#172a4d] text-amber-300 border border-amber-400/30 font-bold"
                : "text-slate-300 hover:bg-white/5"
            }`}
          >
            <span>All Categories</span>
            {(!filters.category || filters.category === "all") && (
              <Check className="w-3.5 h-3.5" />
            )}
          </button>
          {categories.map((cat) => {
            const isSelected = filters.category === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onFilterChange("category", cat.slug)}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center justify-between min-h-[38px] ${
                  isSelected
                    ? "bg-[#172a4d] text-amber-300 border border-amber-400/30 font-bold"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <img
                    src={cat.image}
                    alt=""
                    className="w-6 h-6 rounded-md object-cover bg-slate-800 shrink-0"
                  />
                  <span className="truncate">{cat.name}</span>
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 shrink-0 text-amber-400 ml-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Brand Facets */}
      {facets.brands.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Brand / Manufacturer
          </span>
          <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => onFilterChange("brand", "all")}
              className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center justify-between min-h-[34px] ${
                !filters.brand || filters.brand === "all"
                  ? "bg-[#172a4d] text-amber-300 font-bold"
                  : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <span>All Brands</span>
              {(!filters.brand || filters.brand === "all") && (
                <Check className="w-3.5 h-3.5 text-amber-400" />
              )}
            </button>
            {facets.brands.map((brandName) => {
              const isSelected =
                filters.brand?.toLowerCase() === brandName.toLowerCase();
              return (
                <button
                  key={brandName}
                  type="button"
                  onClick={() => onFilterChange("brand", brandName)}
                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center justify-between min-h-[34px] ${
                    isSelected
                      ? "bg-[#172a4d] text-amber-300 font-bold"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <span className="truncate">{brandName}</span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Price Slider */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
            Max Price
          </span>
          <span className="font-black text-amber-400 font-mono">
            ₹{filters.maxPrice || facets.maxPrice}
          </span>
        </div>
        <input
          type="range"
          min={facets.minPrice || 40}
          max={facets.maxPrice || 8000}
          step={50}
          value={filters.maxPrice || facets.maxPrice}
          onChange={(e) => onFilterChange("maxPrice", e.target.value)}
          className="w-full accent-amber-400 cursor-pointer"
          aria-label="Maximum price filter"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>₹{facets.minPrice}</span>
          <span>₹{facets.maxPrice}</span>
        </div>
      </div>

      {/* Bottom Clear All Filters Button */}
      {hasActiveFilters && (
        <div className="pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClearFilters}
            className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear All Filters</span>
          </button>
        </div>
      )}
    </div>
  );
};
