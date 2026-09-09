import React, { useState, useEffect } from "react";
import { Filter, X, Zap, RotateCcw, MapPin, Check } from "lucide-react";
import { QUICK_CATEGORIES } from "../../data/mockData";
import { productService } from "../../services/productService";

export const FilterPanel = ({
  filters,
  onFilterChange,
  onClearFilters,
  isMobileDrawer = false,
  onCloseMobileDrawer,
}) => {
  const [facets, setFacets] = useState({
    brands: [],
    materials: [],
    minPrice: 500,
    maxPrice: 6000,
  });

  useEffect(() => {
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
      {/* Header with Clear Filter Action */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">Filter & Refine</h3>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-[11px] font-semibold text-amber-400 hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
          {isMobileDrawer && (
            <button
              onClick={onCloseMobileDrawer}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 1. 30-Min Express Delivery Toggle */}
      <div className="premium-card p-3 rounded-xl border border-amber-400/20 bg-[#091526]">
        <label className="flex items-center justify-between cursor-pointer select-none">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-xs font-bold text-white">
              ⚡ 30-Min Express Only
            </span>
          </div>
          <input
            type="checkbox"
            checked={Boolean(filters.expressOnly)}
            onChange={(e) =>
              onFilterChange("expressOnly", e.target.checked ? "true" : "")
            }
            className="w-4 h-4 rounded accent-amber-400 cursor-pointer"
          />
        </label>
      </div>

      {/* 2. Pincode / Location Verification */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span>Delivery PIN Code</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. 342001, 411045"
            maxLength={6}
            value={filters.pincode || ""}
            onChange={(e) => onFilterChange("pincode", e.target.value.trim())}
            className="w-full premium-input px-3 py-2 rounded-xl text-xs placeholder-slate-500 font-mono"
          />
          {filters.pincode && (
            <button
              onClick={() => onFilterChange("pincode", "")}
              className="px-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Category Facet List */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          Category
        </span>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          <button
            onClick={() => onFilterChange("category", "all")}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-between ${
              !filters.category || filters.category === "all"
                ? "bg-[#172a4d] text-amber-400 border border-amber-400/30"
                : "text-slate-300 hover:bg-white/5"
            }`}
          >
            <span>All Categories</span>
            {(!filters.category || filters.category === "all") && (
              <Check className="w-3.5 h-3.5" />
            )}
          </button>
          {QUICK_CATEGORIES.map((cat) => {
            const isSelected = filters.category === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => onFilterChange("category", cat.slug)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-between ${
                  isSelected
                    ? "bg-[#172a4d] text-amber-400 border border-amber-400/30"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </span>
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Brand Facet */}
      {facets.brands.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Brand / Studio
          </span>
          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            <button
              onClick={() => onFilterChange("brand", "all")}
              className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center justify-between ${
                !filters.brand || filters.brand === "all"
                  ? "bg-[#172a4d] text-amber-400"
                  : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <span>All Brands</span>
              {(!filters.brand || filters.brand === "all") && (
                <Check className="w-3.5 h-3.5" />
              )}
            </button>
            {facets.brands.map((brandName) => {
              const isSelected = filters.brand === brandName;
              return (
                <button
                  key={brandName}
                  onClick={() => onFilterChange("brand", brandName)}
                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center justify-between ${
                    isSelected
                      ? "bg-[#172a4d] text-amber-400"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <span>{brandName}</span>
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Dynamic Material Attribute Facet */}
      {facets.materials.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Material
          </span>
          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            <button
              onClick={() => onFilterChange("material", "all")}
              className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center justify-between ${
                !filters.material || filters.material === "all"
                  ? "bg-[#172a4d] text-amber-400"
                  : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <span>All Materials</span>
              {(!filters.material || filters.material === "all") && (
                <Check className="w-3.5 h-3.5" />
              )}
            </button>
            {facets.materials.map((mat) => {
              const isSelected = filters.material === mat;
              return (
                <button
                  key={mat}
                  onClick={() => onFilterChange("material", mat)}
                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center justify-between ${
                    isSelected
                      ? "bg-[#172a4d] text-amber-400"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <span>{mat}</span>
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Price Range Slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-slate-300 uppercase tracking-wider">
            Max Price
          </span>
          <span className="font-black text-amber-400">
            ₹{filters.maxPrice || facets.maxPrice}
          </span>
        </div>
        <input
          type="range"
          min={facets.minPrice || 500}
          max={facets.maxPrice || 6000}
          step={100}
          value={filters.maxPrice || facets.maxPrice}
          onChange={(e) => onFilterChange("maxPrice", e.target.value)}
          className="w-full accent-amber-400 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>₹{facets.minPrice}</span>
          <span>₹{facets.maxPrice}</span>
        </div>
      </div>
    </div>
  );
};
