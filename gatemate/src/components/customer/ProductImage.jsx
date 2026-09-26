import React, { useState, useEffect } from "react";
import {
  mediaService,
  DEFAULT_PRODUCT_FALLBACK,
} from "../../services/mediaService";
import { ImageOff, Sparkles } from "lucide-react";

export const ProductImage = ({
  src,
  alt = "Ferrado construction product",
  aspectRatio = "aspect-square",
  className = "",
  imageClassName = "",
  width = 800,
  height = null,
  priority = false,
  showShimmer = true,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const resolvedUrl = mediaService.getOptimizedImageUrl(src, { width, height });

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  return (
    <div
      className={`relative overflow-hidden bg-[#F4F6FA] ${aspectRatio} ${className}`}
    >
      {!loaded && !error && showShimmer && (
        <div className="absolute inset-0 bg-[#E4EEF3] animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border border-[#9AAED4]/40 flex items-center justify-center text-[#3C7DDA]">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      )}

      {!error ? (
        <img
          src={resolvedUrl}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setError(true);
            setLoaded(true);
          }}
          className={`w-full h-full object-cover transition-all duration-300 ${
            loaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
          } ${imageClassName}`}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F4F6FA] text-[#6F8A92] p-3 text-center border border-[#D9E2EA]">
          <ImageOff className="w-6 h-6 mb-1 text-[#6F8A92]" />
          <span className="text-[10px] font-semibold">
            Product Image Unavailable
          </span>
        </div>
      )}
    </div>
  );
};
