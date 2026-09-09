import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, SlidersHorizontal } from "lucide-react";
import { PRODUCTS_DATA, QUICK_CATEGORIES } from "../../data/mockData";
import { ProductCard } from "../../components/customer/ProductCard";

export const ProductListing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategorySlug = searchParams.get("category") || "all";
  const [sortBy, setSortBy] = useState("popular");
  const [priceMax, setPriceMax] = useState(6000);

  const filteredProducts = useMemo(() => {
    let result = [...PRODUCTS_DATA];

    if (selectedCategorySlug !== "all") {
      result = result.filter((p) => p.categorySlug === selectedCategorySlug);
    }

    result = result.filter((p) => p.price <= priceMax);

    if (sortBy === "price-low") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [selectedCategorySlug, priceMax, sortBy]);

  const handleCategorySelect = (slug) => {
    if (slug === "all") {
      searchParams.delete("category");
      setSearchParams(searchParams);
    } else {
      setSearchParams({ category: slug });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Product Catalog</h1>
          <p className="text-xs text-slate-400">
            Discover all {filteredProducts.length} verified listings
          </p>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <SlidersHorizontal className="w-4 h-4 text-amber-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="premium-input px-3 py-2 rounded-xl text-xs font-semibold"
          >
            <option value="popular">Most Popular</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="space-y-6">
          <div className="premium-panel p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Filter className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Categories</h3>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => handleCategorySelect("all")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  selectedCategorySlug === "all"
                    ? "bg-[#172a4d] text-amber-400 border border-amber-400/30"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                All Categories
              </button>
              {QUICK_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.slug)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-between ${
                    selectedCategorySlug === cat.slug
                      ? "bg-[#172a4d] text-amber-400 border border-amber-400/30"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <span>{cat.name}</span>
                  <span>{cat.icon}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="premium-panel p-5 rounded-2xl space-y-3">
            <h3 className="text-sm font-bold text-white border-b border-white/10 pb-3">
              Max Price: ₹{priceMax}
            </h3>
            <input
              type="range"
              min="1000"
              max="6000"
              step="200"
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>₹1,000</span>
              <span>₹6,000</span>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="lg:col-span-3">
          {filteredProducts.length === 0 ? (
            <div className="premium-panel p-12 rounded-3xl text-center space-y-3">
              <h3 className="text-lg font-bold text-white">
                No products found
              </h3>
              <p className="text-xs text-slate-400">
                Try adjusting your filters or price range to find items.
              </p>
              <button
                onClick={() => {
                  handleCategorySelect("all");
                  setPriceMax(6000);
                }}
                className="gold-gradient-btn px-4 py-2 rounded-xl text-xs"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
