import React from "react";
import { Link } from "react-router-dom";
import { ProductImage } from "./ProductImage";

export const CategoryCard = ({ category }) => {
  return (
    <Link
      to={`/products?category=${category.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] transition-all duration-200 hover:-translate-y-1 hover:border-[#3C7DDA] hover:shadow-md"
      aria-label={`Browse ${category.name}`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F4F6FA]">
        <ProductImage
          src={category.image}
          alt={category.name}
          aspectRatio="aspect-[4/3]"
          imageClassName="transition-transform duration-500 group-hover:scale-105"
          width={400}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#173885]/80 via-transparent to-transparent opacity-80" />

        {category.isHot && (
          <span className="absolute top-2.5 right-2.5 rounded-md bg-[#B43D20] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#FEFEFE]">
            Trending
          </span>
        )}
        {category.isNew && (
          <span className="absolute top-2.5 right-2.5 rounded-md bg-[#3C7DDA] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#FEFEFE]">
            New
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-3.5 bg-[#FEFEFE]">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-[#173885] transition-colors group-hover:text-[#3C7DDA] line-clamp-1">
            {category.name}
          </h3>
          {category.descriptor && (
            <p className="mt-1 text-[11px] text-[#606460] line-clamp-1">
              {category.descriptor}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};
