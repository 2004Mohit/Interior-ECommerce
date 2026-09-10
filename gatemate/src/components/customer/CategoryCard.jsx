import React from "react";
import { Link } from "react-router-dom";
import { ProductImage } from "./ProductImage";

export const CategoryCard = ({ category }) => {
  return (
    <Link
      to={`/products?category=${category.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0c182b] transition-all duration-200 hover:-translate-y-1 hover:border-amber-400/40 hover:shadow-lg hover:shadow-black/60"
      aria-label={`Browse ${category.name}`}
    >
      {/* Category Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#060e1a]">
        <ProductImage
          src={category.image}
          alt={category.name}
          aspectRatio="aspect-[4/3]"
          imageClassName="transition-transform duration-500 group-hover:scale-105"
          width={400}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c182b] via-transparent to-transparent opacity-80" />

        {category.isHot && (
          <span className="absolute top-2.5 right-2.5 rounded-md bg-rose-500/90 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-sm">
            Trending
          </span>
        )}
        {category.isNew && (
          <span className="absolute top-2.5 right-2.5 rounded-md bg-amber-400 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-950">
            New
          </span>
        )}
      </div>

      {/* Category Details */}
      <div className="flex flex-1 flex-col justify-between p-3.5">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-white transition-colors group-hover:text-amber-300 line-clamp-1">
            {category.name}
          </h3>
          {category.descriptor && (
            <p className="mt-1 text-[11px] text-slate-400 line-clamp-1">
              {category.descriptor}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};
