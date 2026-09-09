import React, { useState, useEffect } from "react";
import {
  mediaService,
  DEFAULT_PRODUCT_FALLBACK,
} from "../../services/mediaService";
import { ImageOff, Sparkles } from "lucide-react";

export const ProductImage = ({
  src,
  alt = "GateMate product",
  aspectRatio = "aspect-square", // 'aspect-square' | 'aspect-4/3' | 'aspect-video' | 'aspect-16/9'
  className = "",
  imageClassName = "",
  width = 800,
  height = null,
  priority = false, // If true, eager load with higher fetchpriority
  showShimmer = true,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const resolvedUrl = mediaService.getOptimizedImageUrl(src, { width, height });

  useEffect(() => {
    // Reset state when src changes
    setLoaded(false);
    setError(false);
  }, [src]);

  return (
    <div
      className={`relative overflow-hidden bg-[#060e1a] ${aspectRatio} ${className}`}
    >
      {/* Loading Skeleton / Shimmer */}
      {!loaded && !error && showShimmer && (
        <div className="absolute inset-0 bg-slate-900/80 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border border-amber-400/20 flex items-center justify-center text-amber-400/40">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Rendered Optimized Image */}
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
          className={`w-full h-full object-cover transition-all duration-500 ${
            loaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
          } ${imageClassName}`}
        />
      ) : (
        /* Graceful Fallback Container on Broken/Unreachable Image */
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070e1a] text-slate-500 p-3 text-center border border-white/5">
          <ImageOff className="w-6 h-6 mb-1 text-slate-600" />
          <span className="text-[10px] font-semibold text-slate-400">
            Image Unavailable
          </span>
        </div>
      )}
    </div>
  );
};
