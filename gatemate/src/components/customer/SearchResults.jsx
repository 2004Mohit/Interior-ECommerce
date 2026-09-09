import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search } from "lucide-react";
import { PRODUCTS_DATA } from "../../data/mockData";
import { ProductCard } from "../../components/customer/ProductCard";

export const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const results = PRODUCTS_DATA.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase()) ||
      p.description.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Search className="w-6 h-6 text-amber-400" />
        <div>
          <h1 className="text-2xl font-black text-white">Search Results</h1>
          <p className="text-xs text-slate-400">
            Showing results for{" "}
            <span className="text-amber-400 font-bold">"{query}"</span> (
            {results.length} found)
          </p>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="premium-panel p-16 rounded-3xl text-center space-y-4 max-w-xl mx-auto">
          <h3 className="text-lg font-bold text-white">No matching products</h3>
          <p className="text-xs text-slate-400">
            We couldn't find any products matching your search term. Try
            checking for spelling errors or searching general terms like
            "brass", "pottery", or "gate".
          </p>
          <Link
            to="/products"
            className="gold-gradient-btn inline-block px-5 py-2.5 rounded-xl text-xs"
          >
            Browse All Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
