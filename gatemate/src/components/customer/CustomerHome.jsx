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
      setError(
        "Unable to load construction catalogue. Please check your connection.",
      );
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
    description:
      "Hyperlocal construction products and building materials marketplace in Pune and Pimpri-Chinchwad.",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-9829012345",
      contactType: "Contractor Desk",
      areaServed: ["Pune", "Pimpri-Chinchwad"],
      availableLanguage: ["English", "Hindi", "Marathi"],
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 pb-24">
      {/* Dynamic SEO Meta */}
      <SeoHead
        title="GateMate | Construction Products & Supplies Marketplace | Pune & PCMC"
        description="Source verified Cement, TMT Steel, AAC Blocks, Sand, Aggregates, Plumbing, and Electrical supplies with 30-minute delivery on eligible Products/orders in Pune & PCMC."
        canonicalUrl="/"
        structuredData={organizationSchema}
      />

      {/* 1. SEARCH & HERO CORE PROMISE */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          Pune & PCMC Verified Hyperlocal Construction Marketplace
        </span>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Find Construction Products from Nearby Verified Vendors
        </h1>

        <p className="text-sm sm:text-base text-slate-300 font-normal max-w-2xl mx-auto">
          Source certified Cement, TMT Steel, AAC Blocks, M-Sand, Plumbing,
          Electrical, and Waterproofing supplies with 30-minute delivery on
          eligible Products/orders.
        </p>

        {/* Live Notification Bar (When Logged in) */}
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
                    {unreadAlerts.length} New Dispatch Alert
                    {unreadAlerts.length > 1 ? "s" : ""}:{" "}
                  </strong>
                  {unreadAlerts[0].title}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
            </Link>
          </div>
        )}

        {/* Centered Search Bar */}
        <form
          onSubmit={handleHomeSearch}
          className="relative w-full max-w-2xl mx-auto pt-2 flex items-center"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search UltraTech cement, 12mm TMT rebar, Siporex AAC blocks, M-Sand, Astral CPVC..."
            value={homeSearch}
            onChange={(e) => setHomeSearch(e.target.value)}
            className="w-full premium-input pl-12 pr-28 py-3.5 rounded-2xl text-sm placeholder-slate-400 shadow-2xl"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 gold-gradient-btn px-4 py-2 rounded-xl text-xs font-bold"
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

      {/* PROMOTIONAL BANNERS */}
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

      {/* 2. CONSTRUCTION PRODUCT CATEGORIES */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              Construction Product Categories
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array(12)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="aspect-[4/3] rounded-2xl bg-[#0c182b] border border-white/5 animate-pulse"
                />
              ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        )}
      </div>

      {/* 3. FEATURED CONSTRUCTION PRODUCTS */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white">
              Featured Construction Products
            </h2>
            <p className="text-xs text-slate-400">
              Directly available from regional stockists in Pune &
              Pimpri-Chinchwad
            </p>
          </div>
          <Link
            to="/products"
            className="text-xs font-bold text-amber-400 hover:underline"
          >
            Explore All Products
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

      {/* 4. NEARBY / FAST DELIVERY & TRUSTED VENDOR BADGES */}
      <div className="space-y-6 pt-2">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-lg font-bold text-white">
              Hyperlocal Delivery & Verified Depot Standards
            </h3>
            <p className="text-xs text-slate-400">
              Guaranteed quality metrics for building contractors and site
              engineers in Pune & PCMC
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="premium-card p-5 rounded-2xl space-y-2 border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <h4 className="text-xs font-bold text-white">
              30-Minute Priority Dispatch
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              30-minute delivery on eligible Products/orders dispatched from
              local stockist hubs.
            </p>
          </div>

          <div className="premium-card p-5 rounded-2xl space-y-2 border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-white">
              Certified Primary Quality
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              100% genuine ISI/Fe 550D test batches with verifiable manufacturer
              mill test certificates.
            </p>
          </div>

          <div className="premium-card p-5 rounded-2xl space-y-2 border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <ThumbsUp className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-white">
              Wholesale Depot Pricing
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Direct-from-source wholesale prices on cement bags, rebar bundles,
              and aggregates.
            </p>
          </div>

          <div className="premium-card p-5 rounded-2xl space-y-2 border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-sky-400/10 border border-sky-400/20 flex items-center justify-center text-sky-400">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-white">
              Contractor Desk Support
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Dedicated technical help for material takeoffs, structural
              estimates, and scheduled site drops.
            </p>
          </div>
        </div>
      </div>

      {/* 6. BULK ORDERS & PROJECT RFQ */}
      <div className="premium-panel p-8 rounded-3xl border border-amber-400/20 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-[#091526] to-[#0e213d]">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">
            Commercial Bulk Orders & Project Estimates
          </span>
          <h3 className="text-2xl font-black text-white">
            Need full truckloads of Cement, TMT Steel or AAC Blocks?
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl">
            Submit your project Bill of Quantities (BOQ) for volume depot
            quotes, test certificates, and GST input tax credit across Pune &
            PCMC construction sites.
          </p>
        </div>
        <Link
          to="/account/b2b"
          className="gold-gradient-btn px-6 py-3.5 rounded-xl text-sm flex items-center gap-2 shrink-0 transition shadow-lg"
        >
          <span>Request Bulk Project RFQ</span>
          <ArrowRight className="w-4 h-4 text-slate-950" />
        </Link>
      </div>
    </div>
  );
};
