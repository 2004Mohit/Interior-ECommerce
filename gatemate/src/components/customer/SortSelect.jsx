import React from "react";
import { ArrowUpDown } from "lucide-react";

export const SortSelect = ({ value, onChange }) => {
  return (
    <div className="relative inline-flex items-center">
      <ArrowUpDown className="absolute left-3 w-3.5 h-3.5 text-[#3C7DDA] pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="gm-input pl-9 pr-8 py-2 rounded-xl text-xs font-bold appearance-none cursor-pointer bg-[#FEFEFE]"
        aria-label="Sort construction products"
      >
        <option value="relevance">Sort: Most Relevant</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
        <option value="rating">Customer Rating</option>
        <option value="newest">Recently Added</option>
      </select>
    </div>
  );
};
