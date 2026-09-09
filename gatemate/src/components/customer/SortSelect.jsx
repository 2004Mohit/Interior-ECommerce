import React from "react";
import { ArrowUpDown } from "lucide-react";

export const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Customer Rating" },
  { value: "newest", label: "Newest Arrivals" },
];

export const SortSelect = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <select
        value={value || "relevance"}
        onChange={(e) => onChange(e.target.value)}
        className="premium-input px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer"
        aria-label="Sort products"
      >
        {SORT_OPTIONS.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            className="bg-[#0c182b] text-white"
          >
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
