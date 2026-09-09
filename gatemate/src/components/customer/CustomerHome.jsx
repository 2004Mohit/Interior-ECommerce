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
  Bell,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { productService } from "../../services/productService";
import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "../ProductCardSkeleton";
import { useAuth } from "../../context/AuthContext";
import { notificationService } from "../../services/notificationService";
import { SeoHead } from "../common/SeoHead";
import { SITE_CONFIG } from "../../services/seoService";

export const CustomerHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [homeSearch, setHomeSearch] = useState("");
  const [unreadAlerts, setUnreadAlerts] = useState([]);

  const loadHomeCatalog = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, bans, prods] = await Promise.all([
        productService.getCategories(),
        productService.getPromotionalBanners(),
        productService.getFeaturedProducts(),
      ]);
      setCategories(cats);
      setBanners(bans);
      setFeaturedProducts(prods);
    } catch (err) {
      setError("Unable to load catalog. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomeCatalog();
  }, []);

  useEffect(() => {
    if (user?.id) {
      notificationService.getNotifications(user.id).then((list) => {
        setUnreadAlerts(list.filter((n) => !n.isRead));
      });
    }
  }, [user]);

  useEffect(() => {
    if (banners.length > 0) {
      const bannerInterval = setInterval(() => {
        setActiveBannerIdx((prev) => (prev + 1) % banners.length);
      }, 6000);
      return () => clearInterval(bannerInterval);
    }
  }, [banners.length]);

  const handleHomeSearch = (e) => {
    e.preventDefault();
    if (homeSearch.trim()) {
      navigate(`/search?q=${encodeURIComponent(homeSearch.trim())}`);
    }
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_CONFIG.siteName,
    url: SITE_CONFIG.siteUrl,
    logo: `${SITE_CONFIG.siteUrl}/logo.png`,
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-9829012345",
      contactType: "Customer Service",
      areaServed: ["Pune", "Pimpri-Chinchwad"],
      availableLanguage: ["English", "Hindi", "Marathi"],
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 pb-24">
      {/* Dynamic SEO Meta */}
      <SeoHead
        title="GateMate | Architectural Gates, Hardware & Decor Hub in Pune & PCMC"
        description="Shop authentic handcrafted home decor, blue pottery, and heavy-duty gate automation with 30-minute express priority delivery across Pune and Pimpri-Chinchwad."
        canonicalUrl="/"
        structuredData={organizationSchema}
      />

      {/* 1. Value statement & Search */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          Pune & PCMC Verified Hardware & Artisan Hub
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Heritage Craftsmanship Meets Modern Security
        </h1>
        <p className="text-sm sm:text-base text-slate-300 font-normal">
          Direct-from-source handcrafted home decor and premium automated gate
          systems with 30-minute priority delivery in Pune & PCMC.
        </p>

        {/* Live Notification Bar */}
        {user && unreadAlerts.length > 0 && (
          <div className="pt-1">
            <Link
              to="/account/notifications"
              className="inline-flex items-center justify-between gap-3 px-4 py-2 rounded-2xl bg-[#09182e] border border-amber-400/40 text-xs text-white hover:border-amber-400 transition shadow-lg max-w-lg w-full text-left"
            >
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 font-bold">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <span className="truncate text-slate-200">
                  <strong className="text-amber-400">
                    {unreadAlerts.length} New Alert
                    {unreadAlerts.length > 1 ? "s" : ""}:{" "}
                  </strong>
                  {unreadAlerts[0].title}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
            </Link>
          </div>
        )}

        {/* Home Search Input */}
        <form
          onSubmit={handleHomeSearch}
          className="relative w-full max-w-2xl mx-auto pt-2"
        >
          <Search className="absolute left-4 top-4 w-5 h-5 text-amber-400" />
          <input
            type="text"
            placeholder="Search gate latches, ceramics, automated security, hardware..."
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

      {error && (
        <div className="premium-panel p-6 rounded-3xl text-center space-y-3 max-w-md mx-auto">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-xs text-slate-300">{error}</p>
          <button
            onClick={loadHomeCatalog}
            className="gold-gradient-btn px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 2. Dynamic Promotional Banners */}
      {banners.length > 0 && (
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
                  {banners[activeBannerIdx].badge}
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                  {banners[activeBannerIdx].title}
                </h2>
                <p className="text-sm text-slate-300">
                  {banners[activeBannerIdx].subtitle}
                </p>
                <div className="pt-2 flex items-center gap-4">
                  <Link
                    to={banners[activeBannerIdx].link}
                    className="gold-gradient-btn px-6 py-3 rounded-xl text-sm flex items-center gap-2 transition"
                  >
                    <span>{banners[activeBannerIdx].cta}</span>
                    <ChevronRight className="w-4 h-4 text-slate-950" />
                  </Link>
                  <span className="text-amber-300 font-extrabold text-sm sm:text-base bg-[#070e1a] px-3.5 py-2 rounded-xl border border-amber-400/30">
                    {banners[activeBannerIdx].discount}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 self-center md:self-end">
                {banners.map((_, idx) => (
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
      )}

      {/* 3. Dynamic Categories Grid */}
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

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="premium-card h-24 rounded-2xl animate-pulse bg-white/5"
                />
              ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {categories.map((cat) => (
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
        )}
      </div>

      {/* 4. Assurance Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="premium-card p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">30-Min Express</h4>
            <p className="text-[11px] text-slate-400">Pune / PCMC Corridor</p>
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

      {/* 5. Dynamic Featured Masterpieces */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white">
              Featured Masterpieces
            </h2>
            <p className="text-xs text-slate-400">
              Curated collection from verified regional sellers in Pune & PCMC
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
        ) : featuredProducts.length === 0 ? (
          <div className="premium-panel p-12 rounded-3xl text-center text-xs text-slate-400">
            No featured products found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
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
            Join GateMate Hub in Pune & PCMC with zero onboarding friction.
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
