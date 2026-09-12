import React from "react";

export const ProductCardSkeleton = () => {
  return (
    <div className="gm-card rounded-2xl overflow-hidden animate-pulse flex flex-col justify-between">
      <div className="aspect-[4/3] bg-[#E4EEF3] w-full" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-[#D9E2EA] rounded w-1/3" />
        <div className="h-4 bg-[#E4EEF3] rounded w-3/4" />
        <div className="h-3 bg-[#D9E2EA] rounded w-1/4" />
        <div className="pt-3 border-t border-[#D9E2EA] flex items-center justify-between">
          <div className="h-5 bg-[#E4EEF3] rounded w-1/3" />
          <div className="h-8 bg-[#D9E2EA] rounded-xl w-16" />
        </div>
      </div>
    </div>
  );
};
