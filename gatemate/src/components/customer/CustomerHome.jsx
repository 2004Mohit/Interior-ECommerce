import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
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
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { productService } from "../../services/productService";
import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "../ProductCardSkeleton";
import { CategoryCard } from "./CategoryCard";
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
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-9829012345",
      contactType: "Customer Service",
      areaServed: ["Pune", "Pimpri-Chinchwad"],
      availableLanguage: ["English", "Hindi", "Marathi"],
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 pb-24">
      {/* SEO Meta */}
      <SeoHead
        title="GateMate | Electrical, Plumbing, Hardware & Building Materials Hub"
        description="Shop Polycab wires, Legrand modular switches, CenturyPly plywood, Astral CPVC pipes and hardware with 30-minute priority delivery in Pune & PCMC."
        canonicalUrl="/"
        structuredData={organizationSchema}
      />

      {/* 1. SEARCH & HERO HEADER */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          Pune & PCMC Verified Hardware & Building Materials Hub
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Electrical, Hardware & Building Materials
        </h1>
        <p className="text-sm sm:text-base text-slate-300 font-normal">
          Direct contractor pricing on wires, switches, plywood, plumbing
          fittings, and architectural hardware with 30-minute express priority
          dispatch.
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
            placeholder="Search Polycab wires, MCB, 19mm Plywood, Astral CPVC, Hinges..."
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

      {/* 2. PROMOTIONAL BANNERS */}
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

      {/* 3. IMAGE-BASED CATALOGUE CATEGORIES */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              Browse by Category
            </h2>
          </div>
          <Link
            to="/products"
            className="text-xs text-amber-400 hover:underline font-semibold"
          >
            View All Categories
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array(10)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="aspect-[4/3] rounded-2xl bg-[#0c182b] border border-white/5 animate-pulse"
                />
              ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        )}
      </div>

      {/* 4. ASSURANCE BADGES */}
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
            <h4 className="text-xs font-bold text-white">100% Genuine</h4>
            <p className="text-[11px] text-slate-400">Certified Brands</p>
          </div>
        </div>
        <div className="premium-card p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
            <ThumbsUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Contractor Rates</h4>
            <p className="text-[11px] text-slate-400">Direct Wholesale</p>
          </div>
        </div>
        <div className="premium-card p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-400/10 border border-sky-400/20 flex items-center justify-center text-sky-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Local Support</h4>
            <p className="text-[11px] text-slate-400">Instant Technical Help</p>
          </div>
        </div>
      </div>

      {/* 5. FEATURED PRODUCTS */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white">
              Featured Hardware & Materials
            </h2>
            <p className="text-xs text-slate-400">
              Verified products from certified distributors in Pune & PCMC
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* 6. VENDOR & CONTRACTOR BANNER */}
      <div className="premium-panel p-8 rounded-3xl border border-amber-400/20 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-[#091526] to-[#0e213d]">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">
            B2B Contractor Program
          </span>
          <h3 className="text-2xl font-black text-white">
            Are you a contractor, electrician or builder?
          </h3>
          <p className="text-xs text-slate-300">
            Register your GST for volume discounts, project quotations, and
            consolidated monthly billing.
          </p>
        </div>
        <Link
          to="/account/b2b"
          className="gold-gradient-btn px-6 py-3.5 rounded-xl text-sm flex items-center gap-2 shrink-0 transition"
        >
          <span>Explore B2B Pricing</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
