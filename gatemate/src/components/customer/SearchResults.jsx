import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
<<<<<<< HEAD
import { Search, SlidersHorizontal, X, PackageX } from "lucide-react";
=======
import {
  Search,
  SlidersHorizontal,
  AlertCircle,
  RotateCcw,
  X,
  PackageX,
} from "lucide-react";
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
import { productService } from "../../services/productService";
import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "../ProductCardSkeleton";
import { FilterPanel } from "./FilterPanel";
import { SortSelect } from "./SortSelect";
import { SeoHead } from "../common/SeoHead";
import { ErrorStateView, EmptyStateView } from "../common/StateViews";

export const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();

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

  const [inputVal, setInputVal] = useState(query);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    setInputVal(query);
  }, [query]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (inputVal !== query) {
        const updated = new URLSearchParams(searchParams);
        if (inputVal.trim()) {
          updated.set("q", inputVal.trim());
        } else {
          updated.delete("q");
        }
        setSearchParams(updated);
      }
    }, 350);
    return () => clearTimeout(handler);
  }, [inputVal, query, searchParams, setSearchParams]);

  const fetchSearchResults = useCallback(() => {
    setLoading(true);
    setError(null);

    productService
      .queryProducts({
        query,
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
      .then((data) => setResults(data))
      .catch(() =>
        setError("Search service is temporarily unavailable. Please retry."),
      )
      .finally(() => setLoading(false));
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

  useEffect(() => {
    fetchSearchResults();
  }, [fetchSearchResults]);

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
    const updated = new URLSearchParams();
    if (query) updated.set("q", query);
    setSearchParams(updated);
  };

  const handleClearSearch = () => {
    setInputVal("");
    const updated = new URLSearchParams(searchParams);
    updated.delete("q");
    setSearchParams(updated);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-24">
      <SeoHead
        title={`Search results for "${query || "Construction Products"}" | GateMate`}
        description={`Browse construction products for "${query}" across cement, steel TMT, bricks, sand, plumbing, electrical, and hardware in Pune & PCMC.`}
        canonicalUrl={`/search?q=${encodeURIComponent(query)}`}
      />

<<<<<<< HEAD
      {/* Distinct Separating Search Box with GateMate Palette */}
      <div className="bg-[#FEFEFE] p-5 sm:p-7 rounded-3xl border border-[#D9E2EA] shadow-xs space-y-4">
        <div className="relative w-full max-w-3xl mx-auto flex items-center">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#173885] pointer-events-none" />
=======
      {/* Construction Search Input Bar with Cross Button */}
      <div className="premium-panel p-4 sm:p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="relative w-full max-w-3xl mx-auto flex items-center">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400 pointer-events-none" />
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
          <input
            type="text"
            placeholder="Search keywords: 'UltraTech cement', '12mm TMT rebar', 'Siporex AAC blocks', 'M-Sand', 'CPVC pipe'..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
<<<<<<< HEAD
            className="w-full bg-[#F4F6FA] border border-[#D9E2EA] focus:border-[#3C7DDA] focus:bg-[#FEFEFE] focus:ring-3 focus:ring-[#A5D6FA]/50 text-[#282926] placeholder-[#6F8A92] pl-12 pr-12 py-3.5 rounded-2xl text-sm transition outline-none shadow-inner"
=======
            className="w-full premium-input pl-12 pr-10 py-3 rounded-2xl text-sm placeholder-slate-400 shadow-xl"
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
            aria-label="Search construction products"
          />
          {inputVal && (
            <button
              type="button"
              onClick={handleClearSearch}
<<<<<<< HEAD
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-[#E4EEF3] text-[#173885] hover:bg-[#D9E2EA] transition"
=======
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition"
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
              aria-label="Clear search input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#D9E2EA] text-xs">
          <div>
<<<<<<< HEAD
            <span className="text-[#606460]">Search results for: </span>
            <span className="font-bold text-[#173885] text-sm">
              "{query || "All Construction Products"}"
            </span>
            <span className="text-[#6F8A92] ml-2 font-semibold">
=======
            <span className="text-slate-400">Search results for: </span>
            <span className="font-bold text-amber-400 text-sm">
              "{query || "All Construction Products"}"
            </span>
            <span className="text-slate-400 ml-2">
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
              ({results.length} products found)
            </span>
          </div>

          <div className="flex items-center gap-3 justify-between sm:justify-end">
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
<<<<<<< HEAD
              className="lg:hidden btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 min-h-[38px]"
=======
              className="lg:hidden premium-card px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 border border-white/10 min-h-[38px]"
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#173885]" />
              <span>Filters</span>
            </button>
            <SortSelect
              value={sort}
              onChange={(val) => handleFilterChange("sort", val)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Filters */}
        <div className="hidden lg:block gm-panel p-5 rounded-3xl sticky top-24">
          <FilterPanel
            filters={currentFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Mobile Filter Drawer */}
        {mobileFilterOpen && (
<<<<<<< HEAD
          <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs lg:hidden flex justify-end">
            <div className="w-full max-w-xs bg-[#FEFEFE] h-full p-5 overflow-y-auto border-l border-[#D9E2EA] shadow-2xl flex flex-col justify-between">
=======
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden flex justify-end">
            <div className="w-full max-w-xs bg-[#0a1424] h-full p-5 overflow-y-auto border-l border-white/10 shadow-2xl flex flex-col justify-between">
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
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
<<<<<<< HEAD
                className="w-full mt-6 btn-gm-primary min-h-[44px] py-3 rounded-xl text-xs font-bold"
=======
                className="w-full mt-6 gold-gradient-btn min-h-[44px] py-3 rounded-xl text-xs font-bold"
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
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
              title="Search Error"
              description={error}
              onRetry={fetchSearchResults}
            />
          ) : results.length === 0 ? (
            <EmptyStateView
              icon={PackageX}
              title="No Construction Products Found"
              description={`We couldn't find any construction products matching "${query}". Try adjusting keywords, brand name, or clear applied filters.`}
              actionLabel="Clear Search & Filters"
              onActionClick={handleClearFilters}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
