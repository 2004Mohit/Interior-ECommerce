import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { productService } from "../../services/productService";
import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "../ProductCardSkeleton";
import { FilterPanel } from "./FilterPanel";
import { SortSelect } from "./SortSelect";

export const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "all";
  const brand = searchParams.get("brand") || "all";
  const material = searchParams.get("material") || "all";
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

  // Sync debounced search input with URL
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
    }, 400); // 400ms debounce
    return () => clearTimeout(handler);
  }, [inputVal, query, searchParams, setSearchParams]);

  // Fetch results based on query params
  const fetchSearchResults = useCallback(() => {
    setLoading(true);
    setError(null);

    productService
      .queryProducts({
        query,
        category,
        brand,
        material,
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
    material,
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

  const currentFilters = {
    category,
    brand,
    material,
    minPrice,
    maxPrice,
    expressOnly,
    pincode,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Search Bar with live debounce */}
      <div className="premium-panel p-4 sm:p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="relative w-full max-w-3xl mx-auto">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-amber-400" />
          <input
            type="text"
            placeholder="Search keywords: 'brass latch', 'cobalt urn', 'wood jharokha', 'curtain'..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="w-full premium-input pl-12 pr-4 py-3 rounded-2xl text-sm placeholder-slate-400 shadow-xl"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/5 text-xs">
          <div>
            <span className="text-slate-400">Search results for: </span>
            <span className="font-bold text-amber-400 text-sm">
              "{query || "All Items"}"
            </span>
            <span className="text-slate-400 ml-2">
              ({results.length} found)
            </span>
          </div>

          <div className="flex items-center gap-3 justify-between sm:justify-end">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden premium-card px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 border border-white/10"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
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
        <div className="hidden lg:block premium-panel p-5 rounded-3xl sticky top-24">
          <FilterPanel
            filters={currentFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Mobile Filter Drawer */}
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
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Search Results Display */}
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
              <h3 className="text-base font-bold text-white">Search Error</h3>
              <p className="text-xs text-slate-400">{error}</p>
              <button
                onClick={fetchSearchResults}
                className="gold-gradient-btn px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Search</span>
              </button>
            </div>
          ) : results.length === 0 ? (
            <div className="premium-panel p-16 rounded-3xl text-center space-y-4 max-w-lg mx-auto">
              <Search className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-white">
                No products found
              </h3>
              <p className="text-xs text-slate-400">
                We couldn't find matches for{" "}
                <span className="text-amber-400">"{query}"</span>. Try checking
                spelling, clearing filters, or searching for terms like "gate",
                "brass", or "pottery".
              </p>
              <button
                onClick={handleClearFilters}
                className="gold-gradient-btn px-5 py-2.5 rounded-xl text-xs font-bold"
              >
                Clear Search & Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
