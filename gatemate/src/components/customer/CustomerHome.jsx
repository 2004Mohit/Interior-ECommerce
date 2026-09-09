import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Tag,
  ChevronRight,
  ArrowRight,
  Layers,
  Zap,
  ShieldCheck,
  ThumbsUp,
  Clock,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  QUICK_CATEGORIES,
  HERO_BANNERS,
  PRODUCTS_DATA,
} from "../../data/mockData";
import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "../ProductCardSkeleton";

export const CustomerHome = () => {
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [homeSearch, setHomeSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const bannerInterval = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % HERO_BANNERS.length);
    }, 6000);
    return () => clearInterval(bannerInterval);
  }, []);

  const handleHomeSearch = (e) => {
    e.preventDefault();
    if (homeSearch.trim()) {
      navigate(`/search?q=${encodeURIComponent(homeSearch.trim())}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 pb-24">
      {/* 1. Value statement & Search */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          Direct Master Artisans & Verified Hardware Hub
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Heritage Craftsmanship Meets Modern Security
        </h1>
        <p className="text-sm sm:text-base text-slate-300 font-normal">
          Direct-from-source Jodhpur handcrafted home decor and premium
          automated gate systems with 30-minute priority delivery.
        </p>

        {/* Home Search Input */}
        <form
          onSubmit={handleHomeSearch}
          className="relative w-full max-w-2xl mx-auto pt-2"
        >
          <Search className="absolute left-4 top-4 w-5 h-5 text-amber-400" />
          <input
            type="text"
            placeholder="Search gate latches, blue pottery, woodcraft, brassware..."
            value={homeSearch}
            onChange={(e) => setHomeSearch(e.target.value)}
            className="w-full premium-input pl-12 pr-28 py-3.5 rounded-2xl text-sm placeholder-slate-400 shadow-2xl"
          />
          <button
            type="submit"
            className="absolute right-2 top-3 gold-gradient-btn px-4 py-2 rounded-xl text-xs font-bold"
          >
            Search
          </button>
        </form>
      </div>

      {/* 2. Hero banner carousel */}
      <div className="relative overflow-hidden rounded-3xl premium-panel border border-amber-400/20 p-6 sm:p-10 shadow-2xl bg-gradient-to-r from-[#0c182b] via-[#10223d] to-[#0c182b]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeBannerIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            <div className="space-y-3.5 text-left max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-400/15 text-amber-400 text-xs font-bold uppercase tracking-wider border border-amber-400/30">
                <Tag className="w-3.5 h-3.5" />
                {HERO_BANNERS[activeBannerIdx].badge}
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                {HERO_BANNERS[activeBannerIdx].title}
              </h2>
              <p className="text-sm text-slate-300">
                {HERO_BANNERS[activeBannerIdx].subtitle}
              </p>
              <div className="pt-2 flex items-center gap-4">
                <Link
                  to={HERO_BANNERS[activeBannerIdx].link}
                  className="gold-gradient-btn px-6 py-3 rounded-xl text-sm flex items-center gap-2 transition"
                >
                  <span>{HERO_BANNERS[activeBannerIdx].cta}</span>
                  <ChevronRight className="w-4 h-4 text-slate-950" />
                </Link>
                <span className="text-amber-300 font-extrabold text-sm sm:text-base bg-[#070e1a] px-3.5 py-2 rounded-xl border border-amber-400/30">
                  {HERO_BANNERS[activeBannerIdx].discount}
                </span>
              </div>
            </div>

            <div className="flex gap-2 self-center md:self-end">
              {HERO_BANNERS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveBannerIdx(idx)}
                  className={`h-2.5 rounded-full transition-all ${
                    activeBannerIdx === idx
                      ? "w-8 bg-amber-400"
                      : "w-2.5 bg-slate-700"
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 3. Specialty Categories */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white tracking-wide">
              Browse by Specialty
            </h3>
          </div>
          <Link
            to="/products"
            className="text-xs text-amber-400 hover:underline font-semibold"
          >
            View All Catalog
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {QUICK_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="relative group p-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-200 border premium-card hover:border-amber-400/40 text-slate-200"
            >
              {cat.isNew && (
                <span className="absolute top-1.5 right-1.5 bg-emerald-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                  NEW
                </span>
              )}
              {cat.isHot && (
                <span className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                  HOT
                </span>
              )}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-[#070e1a] border border-white/5 group-hover:border-amber-400/40 transition">
                {cat.icon}
              </div>
              <span className="text-xs font-semibold text-center line-clamp-1">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 4. Assurance Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="premium-card p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">30-Min Express</h4>
            <p className="text-[11px] text-slate-400">Hyper-Local Dispatch</p>
          </div>
        </div>
        <div className="premium-card p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">100% Certified</h4>
            <p className="text-[11px] text-slate-400">
              Pure Brass & Solid Wood
            </p>
          </div>
        </div>
        <div className="premium-card p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
            <ThumbsUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Artisan Direct</h4>
            <p className="text-[11px] text-slate-400">Zero Middleman Markup</p>
          </div>
        </div>
        <div className="premium-card p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-400/10 border border-sky-400/20 flex items-center justify-center text-sky-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Dedicated Support</h4>
            <p className="text-[11px] text-slate-400">
              Instant Help Resolution
            </p>
          </div>
        </div>
      </div>

      {/* 5. Featured Masterpieces */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white">
              Featured Masterpieces
            </h2>
            <p className="text-xs text-slate-400">
              Curated collection from verified regional sellers
            </p>
          </div>
          <Link
            to="/products"
            className="text-xs font-bold text-amber-400 hover:underline"
          >
            Explore All
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {PRODUCTS_DATA.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* 6. Vendor Banner */}
      <div className="premium-panel p-8 rounded-3xl border border-amber-400/20 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-[#091526] to-[#0e213d]">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">
            Vendor Partnership Program
          </span>
          <h3 className="text-2xl font-black text-white">
            Are you an artisan or hardware manufacturer?
          </h3>
          <p className="text-xs text-slate-300">
            Join GateMate Hub with zero onboarding friction and automated daily
            payouts.
          </p>
        </div>
        <Link
          to="/products"
          className="gold-gradient-btn px-6 py-3.5 rounded-xl text-sm flex items-center gap-2 shrink-0 transition"
        >
          <span>Explore Partner Benefits</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
