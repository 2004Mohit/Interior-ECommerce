import React, { useState, useEffect } from "react";
import {
  Filter,
  X,
  Zap,
  RotateCcw,
  MapPin,
  Check,
<<<<<<< HEAD
=======
  Layers,
  Tag,
  Package,
  Wrench,
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
  ShieldCheck,
} from "lucide-react";
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
    units: [],
    grades: [],
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
    (filters.unit && filters.unit !== "all") ||
    (filters.grade && filters.grade !== "all") ||
    filters.inStockOnly ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.expressOnly ||
    filters.pincode,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-3">
        <div className="flex items-center gap-2">
<<<<<<< HEAD
          <Filter className="w-4 h-4 text-[#173885]" />
          <h3 className="text-sm font-bold text-[#173885]">Filter Products</h3>
=======
          <Filter className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">Filter Products</h3>
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
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
              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-[#E4EEF3] text-[#606460] hover:text-[#282926]"
              aria-label="Close Filter Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 1. 30-Min Site Priority Express Toggle */}
<<<<<<< HEAD
      <div className="p-3.5 rounded-2xl bg-[#E4EEF3] border border-[#9AAED4]/40">
        <label className="flex items-center justify-between cursor-pointer select-none min-h-[32px]">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#3C7DDA] fill-[#3C7DDA]" />
            <span className="text-xs font-bold text-[#173885]">
=======
      <div className="p-3.5 rounded-2xl bg-[#091526] border border-amber-400/20">
        <label className="flex items-center justify-between cursor-pointer select-none min-h-[32px]">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-xs font-bold text-white">
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
              30-Min Site Priority Dispatch
            </span>
          </div>
          <input
            type="checkbox"
            checked={Boolean(filters.expressOnly)}
            onChange={(e) =>
              onFilterChange("expressOnly", e.target.checked ? "true" : "")
            }
<<<<<<< HEAD
            className="w-5 h-5 rounded accent-[#3C7DDA] cursor-pointer"
=======
            className="w-5 h-5 rounded accent-amber-400 cursor-pointer"
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
            aria-label="Filter 30-minute priority site delivery only"
          />
        </label>
      </div>

      {/* 2. Construction Site PIN Code Geofence */}
      <div className="space-y-1.5">
        <label
          htmlFor="filter-pincode-input"
          className="flex items-center gap-1.5 text-xs font-bold text-[#282926]"
        >
<<<<<<< HEAD
          <MapPin className="w-3.5 h-3.5 text-[#3C7DDA]" />
=======
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
          <span>Construction Site PIN Code</span>
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
            className="w-full gm-input px-3 py-2 rounded-xl text-xs font-mono font-bold"
            aria-label="Enter 6-digit PIN code"
          />
          {filters.pincode && (
            <button
              type="button"
              onClick={() => onFilterChange("pincode", "")}
              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-[#E4EEF3] text-[#606460] hover:text-[#282926]"
              aria-label="Clear PIN filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

<<<<<<< HEAD
      {/* 3. Categories Facet */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-[#6F8A92] uppercase tracking-wider block">
=======
      {/* 3. Categories Facet with Photography */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
          Product Category
        </span>
        <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => onFilterChange("category", "all")}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-between min-h-[38px] ${
              !filters.category || filters.category === "all"
                ? "bg-[#E4EEF3] text-[#173885] border border-[#9AAED4]/40 font-bold"
                : "text-[#282926] hover:bg-[#F4F6FA]"
            }`}
          >
            <span>All Categories</span>
            {(!filters.category || filters.category === "all") && (
              <Check className="w-3.5 h-3.5 text-[#173885]" />
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
                    ? "bg-[#E4EEF3] text-[#173885] border border-[#9AAED4]/40 font-bold"
                    : "text-[#282926] hover:bg-[#F4F6FA]"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <img
                    src={cat.image}
                    alt=""
                    className="w-6 h-6 rounded-md object-cover bg-[#D9E2EA] shrink-0"
                  />
                  <span className="truncate">{cat.name}</span>
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 shrink-0 text-[#173885] ml-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

<<<<<<< HEAD
      {/* 4. Brand / Manufacturer Facet */}
=======
      {/* 4. Construction Brand / Manufacturer Facet */}
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
      {facets.brands.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-[#6F8A92] uppercase tracking-wider block">
            Brand / Manufacturer
          </span>
          <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => onFilterChange("brand", "all")}
              className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center justify-between min-h-[34px] ${
                !filters.brand || filters.brand === "all"
                  ? "bg-[#E4EEF3] text-[#173885] font-bold"
                  : "text-[#282926] hover:bg-[#F4F6FA]"
              }`}
            >
              <span>All Brands</span>
              {(!filters.brand || filters.brand === "all") && (
                <Check className="w-3.5 h-3.5 text-[#173885]" />
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

<<<<<<< HEAD
      {/* 5. In-Stock Availability Toggle */}
      <div className="p-3 rounded-2xl bg-[#E4EEF3]/60 border border-[#D9E2EA]">
        <label className="flex items-center justify-between cursor-pointer select-none min-h-[28px]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#3F7D20]" />
            <span className="text-xs font-bold text-[#282926]">
              In-Stock Only
            </span>
=======
      {/* 5. Unit of Measurement Facet (Bag, Piece, Brass, Can, Sheet, Coil) */}
      {facets.units && facets.units.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Unit of Supply
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onFilterChange("unit", "all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
                !filters.unit || filters.unit === "all"
                  ? "bg-[#172a4d] text-amber-300 border-amber-400/40 font-bold"
                  : "premium-card text-slate-400 hover:text-white border-white/5"
              }`}
            >
              All Units
            </button>
            {facets.units.map((u) => {
              const isSelected = filters.unit === u;
              return (
                <button
                  key={u}
                  type="button"
                  onClick={() => onFilterChange("unit", u)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
                    isSelected
                      ? "bg-[#172a4d] text-amber-300 border-amber-400/40 font-bold"
                      : "premium-card text-slate-400 hover:text-white border-white/5"
                  }`}
                >
                  {u}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Material Grade / Specification Facet */}
      {facets.grades && facets.grades.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Grade & Specification
          </span>
          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => onFilterChange("grade", "all")}
              className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center justify-between min-h-[34px] ${
                !filters.grade || filters.grade === "all"
                  ? "bg-[#172a4d] text-amber-300 font-bold"
                  : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <span>All Grades</span>
              {(!filters.grade || filters.grade === "all") && (
                <Check className="w-3.5 h-3.5 text-amber-400" />
              )}
            </button>
            {facets.grades.map((grd) => {
              const isSelected = filters.grade === grd;
              return (
                <button
                  key={grd}
                  type="button"
                  onClick={() => onFilterChange("grade", grd)}
                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center justify-between min-h-[34px] ${
                    isSelected
                      ? "bg-[#172a4d] text-amber-300 font-bold"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <span className="truncate">{grd}</span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. In-Stock Availability Toggle */}
      <div className="p-3 rounded-2xl bg-[#091526] border border-white/10">
        <label className="flex items-center justify-between cursor-pointer select-none min-h-[28px]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white">In-Stock Only</span>
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
          </div>
          <input
            type="checkbox"
            checked={Boolean(filters.inStockOnly)}
            onChange={(e) =>
              onFilterChange("inStockOnly", e.target.checked ? "true" : "")
            }
<<<<<<< HEAD
            className="w-4 h-4 rounded accent-[#3C7DDA] cursor-pointer"
=======
            className="w-4 h-4 rounded accent-amber-400 cursor-pointer"
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
            aria-label="Filter in-stock construction products only"
          />
        </label>
      </div>

<<<<<<< HEAD
      {/* 6. Price Slider */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-[#606460] uppercase tracking-wider text-[11px]">
=======
      {/* 8. Price Slider */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
            Max Price per Unit
          </span>
          <span className="font-black text-[#173885] font-mono">
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
<<<<<<< HEAD
          className="w-full accent-[#3C7DDA] cursor-pointer"
=======
          className="w-full accent-amber-400 cursor-pointer"
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
          aria-label="Maximum unit price filter"
        />
        <div className="flex justify-between text-[10px] text-[#6F8A92] font-mono">
          <span>₹{facets.minPrice}</span>
          <span>₹{facets.maxPrice}</span>
        </div>
      </div>

      {/* Clear All Filters Button */}
      {hasActiveFilters && (
        <div className="pt-2 border-t border-[#D9E2EA]">
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
