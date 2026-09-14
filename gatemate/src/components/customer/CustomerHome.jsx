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
  HardHat,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
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
      // 1. Fetch categories
      const catsPromise = productService.getCategories().catch(() => []);

      // 2. Fetch banners with fallback
      const bannersPromise = supabase
        .from("marketing_banners")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .then(async (res) => {
          if (res.data && res.data.length > 0) return res.data;
          return (
            (await productService.getPromotionalBanners().catch(() => [])) || []
          );
        })
        .catch(async () => {
          return (
            (await productService.getPromotionalBanners().catch(() => [])) || []
          );
        });

      // 3. Fetch featured products
      const prodsPromise = productService.getFeaturedProducts().catch(() => []);

      const [cats, bans, prods] = await Promise.all([
        catsPromise,
        bannersPromise,
        prodsPromise,
      ]);

      setCategories(cats || []);
      setBanners(bans || []);
      setFeaturedProducts(prods || []);
    } catch (err) {
      setError(
        "Site logistics link interrupted. Our dispatch network is synchronizing depot inventory across Pune & PCMC.",
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
      notificationService
        .getNotifications(user.id)
        .then((list) => {
          setUnreadAlerts((list || []).filter((n) => !n.isRead));
        })
        .catch(() => {});
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
      contactType: "Contractor Desk",
      areaServed: ["Pune", "Pimpri-Chinchwad"],
      availableLanguage: ["English", "Hindi", "Marathi"],
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 pb-24 font-sans">
      {/* SEO Meta */}
      <SeoHead
        title="GateMate | Hyperlocal Construction Products Marketplace in Pune & PCMC"
        description="Find construction Products from nearby verified vendors with 30-minute delivery on eligible Products/orders across Pune and Pimpri-Chinchwad."
        canonicalUrl="/"
        structuredData={organizationSchema}
      />

      {/* 1. SEARCH & HERO CORE PROMISE */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E4EEF3] border border-[#9AAED4]/40 text-[#173885] text-xs font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-[#3C7DDA]" />
          Pune & PCMC Verified Hyperlocal Construction Marketplace
        </span>

        <h1 className="text-3xl sm:text-5xl font-black text-[#173885] tracking-tight leading-tight">
          Find Construction Products from Nearby Verified Vendors
        </h1>

        <p className="text-sm sm:text-base text-[#606460] font-normal max-w-2xl mx-auto">
          Source certified Cement, TMT Steel, AAC Blocks, M-Sand, Plumbing,
          Electrical, and Waterproofing supplies with 30-minute delivery on
          eligible Products/orders.
        </p>

        {/* Live Notification Bar (When Logged in) */}
        {user && unreadAlerts.length > 0 && (
          <div className="pt-1">
            <Link
              to="/account/notifications"
              className="inline-flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-[#FEFEFE] border border-[#D9E2EA] hover:border-[#3C7DDA] text-xs text-[#282926] transition shadow-xs max-w-lg w-full text-left"
            >
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-6 h-6 rounded-lg bg-[#3C7DDA] text-[#FEFEFE] flex items-center justify-center shrink-0 font-bold">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <span className="truncate text-[#282926]">
                  <strong className="text-[#173885]">
                    {unreadAlerts.length} New Dispatch Alert
                    {unreadAlerts.length > 1 ? "s" : ""}:{" "}
                  </strong>
                  {unreadAlerts[0].title}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#3C7DDA] shrink-0" />
            </Link>
          </div>
        )}

        {/* Centered Search Bar */}
        <form
          onSubmit={handleHomeSearch}
          className="relative w-full max-w-2xl mx-auto pt-2 flex items-center"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6F8A92] pointer-events-none" />
          <input
            type="text"
            placeholder="Search UltraTech cement, 12mm TMT rebar, Siporex AAC blocks, M-Sand, Astral CPVC..."
            value={homeSearch}
            onChange={(e) => setHomeSearch(e.target.value)}
            className="w-full gm-input pl-12 pr-28 py-3.5 rounded-2xl text-sm shadow-xs"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 btn-gm-primary px-5 py-2 rounded-xl text-xs font-bold"
          >
            Search
          </button>
        </form>
      </div>

      {/* Structured Fallback State */}
      {error && (
        <div className="gm-panel p-8 rounded-3xl border border-[#D9E2EA] text-center space-y-4 max-w-lg mx-auto bg-[#FEFEFE] shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#E4EEF3] text-[#173885] flex items-center justify-center mx-auto border border-[#D9E2EA]">
            <HardHat className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#173885]">
              Depot Feed Temporarily Offline
            </h3>
            <p className="text-xs text-[#606460] leading-relaxed max-w-md mx-auto">
              {error}
            </p>
          </div>
          <button
            onClick={loadHomeCatalog}
            className="btn-gm-primary px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#FEFEFE]" />
            <span>Reconnect to Catalogue</span>
          </button>
        </div>
      )}

      {/* PROMOTIONAL PROJECT HIGHLIGHTS */}
      {banners.length > 0 && (
        <div className="relative overflow-hidden rounded-3xl bg-[#173885] text-[#FEFEFE] p-6 sm:p-10 shadow-lg border border-[#173885]">
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
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#3C7DDA]/30 text-[#A5D6FA] text-xs font-bold uppercase tracking-wider border border-[#A5D6FA]/30">
                  <Tag className="w-3.5 h-3.5" />
                  {banners[activeBannerIdx].badge ||
                    banners[activeBannerIdx].banner_type ||
                    "FEATURED"}
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-[#FEFEFE] leading-tight">
                  {banners[activeBannerIdx].title}
                </h2>
                <p className="text-sm text-[#E4EEF3]">
                  {banners[activeBannerIdx].subtitle}
                </p>
                <div className="pt-2 flex items-center gap-4">
                  <Link
                    to={
                      banners[activeBannerIdx].target_url ||
                      banners[activeBannerIdx].link ||
                      "/products"
                    }
                    className="btn-gm-primary px-6 py-3 rounded-xl text-sm flex items-center gap-2 transition"
                  >
                    <span>
                      {banners[activeBannerIdx].cta_text ||
                        banners[activeBannerIdx].cta ||
                        "Explore Now"}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#FEFEFE]" />
                  </Link>
                  {(banners[activeBannerIdx].discount ||
                    banners[activeBannerIdx].category_slug) && (
                    <span className="text-[#A5D6FA] font-extrabold text-sm sm:text-base bg-[#0F255C] px-3.5 py-2 rounded-xl border border-[#3C7DDA]/30">
                      {banners[activeBannerIdx].discount ||
                        `Category: ${banners[activeBannerIdx].category_slug}`}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 self-center md:self-end">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveBannerIdx(idx)}
                    className={`h-2.5 rounded-full transition-all ${
                      activeBannerIdx === idx
                        ? "w-8 bg-[#3C7DDA]"
                        : "w-2.5 bg-[#9AAED4]/40"
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
            <Layers className="w-5 h-5 text-[#173885]" />
            <h2 className="text-xl font-bold text-[#173885] tracking-wide">
              Construction Product Categories
            </h2>
          </div>
          <Link
            to="/products"
            className="text-xs text-[#3C7DDA] hover:underline font-bold"
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
                  className="aspect-[4/3] rounded-2xl bg-[#E4EEF3] border border-[#D9E2EA] animate-pulse"
                />
              ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <CategoryCard key={cat.id || cat.slug} category={cat} />
            ))}
          </div>
        )}
      </div>

      {/* 3. FEATURED CONSTRUCTION PRODUCTS */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-[#173885]">
              Featured Construction Products
            </h2>
            <p className="text-xs text-[#606460]">
              Directly available from regional stockists in Pune &
              Pimpri-Chinchwad
            </p>
          </div>
          <Link
            to="/products"
            className="text-xs font-bold text-[#3C7DDA] hover:underline"
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
        <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-3">
          <div>
            <h3 className="text-lg font-bold text-[#173885]">
              Hyperlocal Delivery & Verified Depot Standards
            </h3>
            <p className="text-xs text-[#606460]">
              Guaranteed quality metrics for building contractors and site
              engineers in Pune & PCMC
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="gm-card p-5 rounded-2xl space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#E4EEF3] border border-[#9AAED4]/30 flex items-center justify-center text-[#173885]">
              <Zap className="w-5 h-5 fill-[#3C7DDA] text-[#3C7DDA]" />
            </div>
            <h4 className="text-xs font-bold text-[#282926]">
              30-Minute Priority Dispatch
            </h4>
            <p className="text-[11px] text-[#606460] leading-relaxed">
              30-minute delivery on eligible Products/orders dispatched from
              local stockist hubs.
            </p>
          </div>

          <div className="gm-card p-5 rounded-2xl space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#E1F2D9] border border-[#3F7D20]/20 flex items-center justify-center text-[#3F7D20]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-[#282926]">
              Certified Primary Quality
            </h4>
            <p className="text-[11px] text-[#606460] leading-relaxed">
              100% genuine ISI/Fe 550D test batches with verifiable manufacturer
              mill test certificates.
            </p>
          </div>

          <div className="gm-card p-5 rounded-2xl space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#E4EEF3] border border-[#9AAED4]/30 flex items-center justify-center text-[#173885]">
              <ThumbsUp className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-[#282926]">
              Wholesale Depot Pricing
            </h4>
            <p className="text-[11px] text-[#606460] leading-relaxed">
              Direct-from-source wholesale prices on cement bags, rebar bundles,
              and aggregates.
            </p>
          </div>

          <div className="gm-card p-5 rounded-2xl space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#E3EBFA] border border-[#2E4D94]/20 flex items-center justify-center text-[#2E4D94]">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-[#282926]">
              Contractor Desk Support
            </h4>
            <p className="text-[11px] text-[#606460] leading-relaxed">
              Dedicated technical help for material takeoffs, structural
              estimates, and scheduled site drops.
            </p>
          </div>
        </div>
      </div>

      {/* 5. BULK ORDERS & PROJECT RFQ */}
      <div className="gm-panel p-8 rounded-3xl border border-[#D9E2EA] flex flex-col md:flex-row items-center justify-between gap-6 bg-[#E4EEF3]/60">
        <div className="space-y-2 text-center md:text-left">
          <span className="badge-gm-info px-3 py-1 rounded-full text-xs uppercase tracking-wider">
            Commercial Bulk Orders & Project Estimates
          </span>
          <h3 className="text-2xl font-black text-[#173885]">
            Need full truckloads of Cement, TMT Steel or AAC Blocks?
          </h3>
          <p className="text-xs text-[#606460] max-w-2xl">
            Submit your project Bill of Quantities (BOQ) for volume depot
            quotes, test certificates, and GST input tax credit across Pune &
            PCMC construction sites.
          </p>
        </div>
        <Link
          to="/account/b2b"
          className="btn-gm-primary px-6 py-3.5 rounded-xl text-sm flex items-center gap-2 shrink-0 transition shadow-md"
        >
          <span>Request Bulk Project RFQ</span>
          <ArrowRight className="w-4 h-4 text-[#FEFEFE]" />
        </Link>
      </div>

      {/* 6. VENDOR STOREFRONT ENTRY BANNER */}
      {!user && (
        <div className="gm-panel p-8 rounded-3xl border border-[#9AAED4]/40 flex flex-col md:flex-row items-center justify-between gap-6 bg-[#FEFEFE]">
          <div className="space-y-1.5 text-center md:text-left">
            <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Stockist & Dealer Hub
            </span>
            <h3 className="text-2xl font-black text-[#173885]">
              Are you a construction materials vendor or stockist?
            </h3>
            <p className="text-xs text-[#606460] max-w-2xl">
              Register your depot to receive direct site orders, fulfill
              30-minute priority dispatches, and bid on commercial builder RFQs.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              to="/sell"
              className="btn-gm-primary px-6 py-3.5 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <span>Sell on GateMate</span>
              <ArrowRight className="w-4 h-4 text-[#FEFEFE]" />
            </Link>
            <Link
              to="/vendor/login"
              className="btn-gm-secondary px-5 py-3.5 rounded-xl text-xs font-bold"
            >
              Vendor Sign In
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
