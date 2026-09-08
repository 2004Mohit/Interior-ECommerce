import React from "react";

export const ProductCardSkeleton = () => (
  <div className="glass-card rounded-2xl p-4 flex flex-col gap-3 animate-pulse border border-white/10">
    <div className="w-full h-44 bg-white/10 rounded-xl"></div>
    <div className="h-4 bg-white/20 rounded w-3/4"></div>
    <div className="h-3 bg-white/10 rounded w-1/2"></div>
    <div className="flex items-center justify-between mt-auto pt-2">
      <div className="h-5 bg-white/20 rounded w-1/3"></div>
      <div className="h-8 bg-white/20 rounded w-20"></div>
    </div>
  </div>
);
