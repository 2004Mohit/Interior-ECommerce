import React, { useCallback, useEffect, useState } from "react";
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
  Truck,
  PackageCheck,
  Building2,
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

/*
 * =============================================================================
 * STATIC HERO BANNER
 * =============================================================================
 *
 * This is intentionally static.
 * GateMate does not use a banner/promotion management system.
 */
const STATIC_HERO_BANNER = {
  badge: "FERRADO CONSTRUCTION MARKETPLACE",

  title: "Construction Products. Nearby Vendors. Faster Delivery.",

  subtitle:
    "Source verified construction products from vendors across Pune & PCMC with 30-minute delivery available on eligible products and orders.",

  ctaText: "Explore Products",

  targetUrl: "/products",

  secondaryText: "Browse Categories",

  secondaryUrl: "/products",

  highlight: "Pune & PCMC",
};

/*
 * =============================================================================
 * ANIMATION CONFIG
 * =============================================================================
 */

const pageContainerVariants = {
  hidden: {
    opacity: 0,
  },

  visible: {
    opacity: 1,

    transition: {
      duration: 0.45,
      staggerChildren: 0.08,
    },
  },
};

const sectionVariants = {
  hidden: {
    opacity: 0,
    y: 24,
  },

  visible: {
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.55,
      ease: "easeOut",
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 18,
    scale: 0.98,
  },

  visible: {
    opacity: 1,
    y: 0,
    scale: 1,

    transition: {
      duration: 0.45,
      ease: "easeOut",
    },
  },
};

/*
 * =============================================================================
 * CUSTOMER HOME
 * =============================================================================
 */

export const CustomerHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  /*
   * ---------------------------------------------------------------------------
   * STATE
   * ---------------------------------------------------------------------------
   */

  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [homeSearch, setHomeSearch] = useState("");

  const [unreadAlerts, setUnreadAlerts] = useState([]);

  /*
   * ---------------------------------------------------------------------------
   * LOAD CUSTOMER HOME CATALOGUE
   * ---------------------------------------------------------------------------
   *
   * IMPORTANT:
   *
   * productService.getCategories()
   * now returns ONLY active categories from product_categories.
   *
   * Therefore Customer Home does not maintain its own hard-coded category
   * filtering. The database/service remains the source of truth.
   */

  const loadHomeCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [cats, products] = await Promise.all([
        productService.getCategories(),
        productService.getFeaturedProducts(),
      ]);

      /*
       * Defensive filtering:
       *
       * Even though getCategories() already filters inactive categories,
       * keep this small safeguard here so Customer Home never renders a
       * category explicitly marked inactive by the service response.
       *
       * This also supports both:
       *   isActive
       *   is_active
       *
       * depending on the normalized service response.
       */

      const activeCategories = (Array.isArray(cats) ? cats : [])
        .filter((category) => {
          if (!category) {
            return false;
          }

          if (category.isActive === false) {
            return false;
          }

          if (category.is_active === false) {
            return false;
          }

          return Boolean(category.slug && category.name);
        })
        .sort((a, b) => {
          const aOrder = Number(a.displayOrder ?? a.display_order ?? 999999);

          const bOrder = Number(b.displayOrder ?? b.display_order ?? 999999);

          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }

          return String(a.name || "").localeCompare(String(b.name || ""));
        });

      setCategories(activeCategories);

      setFeaturedProducts(Array.isArray(products) ? products : []);
    } catch (err) {
      console.error("CustomerHome: failed to load catalogue:", err);

      setCategories([]);
      setFeaturedProducts([]);

      setError(
        "The construction product catalogue could not be loaded. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * ---------------------------------------------------------------------------
   * INITIAL LOAD
   * ---------------------------------------------------------------------------
   */

  useEffect(() => {
    loadHomeCatalog();
  }, [loadHomeCatalog]);

  /*
   * ---------------------------------------------------------------------------
   * CUSTOMER NOTIFICATIONS
   * ---------------------------------------------------------------------------
   */

  useEffect(() => {
    let mounted = true;

    if (!user?.id) {
      setUnreadAlerts([]);
      return undefined;
    }

    notificationService
      .getNotifications(user.id)
      .then((list) => {
        if (!mounted) {
          return;
        }

        const notifications = Array.isArray(list) ? list : [];

        setUnreadAlerts(
          notifications.filter((notification) => !notification.isRead),
        );
      })
      .catch((err) => {
        console.error("CustomerHome: notification loading failed:", err);

        if (mounted) {
          setUnreadAlerts([]);
        }
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  /*
   * ---------------------------------------------------------------------------
   * SEARCH
   * ---------------------------------------------------------------------------
   */

  const handleHomeSearch = (event) => {
    event.preventDefault();

    const searchTerm = homeSearch.trim();

    if (!searchTerm) {
      navigate("/products");
      return;
    }

    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

  /*
   * ---------------------------------------------------------------------------
   * SEO STRUCTURED DATA
   * ---------------------------------------------------------------------------
   */

  const organizationSchema = {
    "@context": "https://schema.org",

    "@type": "Organization",

    name: SITE_CONFIG.siteName,

    url: SITE_CONFIG.siteUrl,

    logo: `${SITE_CONFIG.siteUrl}/logo.png`,

    contactPoint: {
      "@type": "ContactPoint",

      telephone: "+91-9829012345",

      contactType: "Customer Support",

      areaServed: ["Pune", "Pimpri-Chinchwad"],

      availableLanguage: ["English", "Hindi", "Marathi"],
    },
  };

  /*
   * ---------------------------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------------------------
   */

  return (
    <motion.div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 pb-24 font-sans"
      variants={pageContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* =====================================================================
          SEO
          ===================================================================== */}

      <SeoHead
        title="GateMate | Hyperlocal Construction Products Marketplace in Pune & PCMC"
        description="Find construction products from nearby verified vendors with 30-minute delivery on eligible products and orders across Pune and Pimpri-Chinchwad."
        canonicalUrl="/"
        structuredData={organizationSchema}
      />

      {/* =====================================================================
          1. SEARCH + HERO INTRO
          ===================================================================== */}

      <motion.section
        variants={sectionVariants}
        className="text-center space-y-5 max-w-4xl mx-auto"
      >
        <motion.div
          initial={{
            opacity: 0,
            y: -12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.6,
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E4EEF3] border border-[#9AAED4]/40 text-[#173885] text-xs font-bold tracking-wide"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#3C7DDA]" />
          Pune & PCMC Verified Construction Marketplace
        </motion.div>

        <motion.h1
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.7,
            delay: 0.08,
          }}
          className="text-3xl sm:text-5xl font-black text-[#173885] tracking-tight leading-tight"
        >
          Find Construction Products from Nearby Verified Vendors
        </motion.h1>

        <motion.p
          initial={{
            opacity: 0,
            y: 14,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.65,
            delay: 0.16,
          }}
          className="text-sm sm:text-base text-[#606460] font-normal max-w-2xl mx-auto leading-relaxed"
        >
          Source Cement, TMT Steel, AAC Blocks, M-Sand, Plumbing, Electrical,
          Waterproofing and other construction products from verified vendors.
          Eligible products and orders can be delivered within 30 minutes.
        </motion.p>

        {/* NOTIFICATION BAR */}

        {user && unreadAlerts.length > 0 && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.96,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              duration: 0.4,
            }}
            className="pt-1"
          >
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
                    {unreadAlerts.length} New Alert
                    {unreadAlerts.length > 1 ? "s" : ""}:{" "}
                  </strong>

                  {unreadAlerts[0]?.title}
                </span>
              </div>

              <ChevronRight className="w-4 h-4 text-[#3C7DDA] shrink-0" />
            </Link>
          </motion.div>
        )}

        {/* SEARCH BAR */}

        <motion.form
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.65,
            delay: 0.24,
          }}
          onSubmit={handleHomeSearch}
          className="relative w-full max-w-2xl mx-auto pt-2 flex items-center"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6F8A92] pointer-events-none" />

          <input
            type="text"
            placeholder="Search Cement, TMT Steel, AAC Blocks, M-Sand, CPVC, Waterproofing..."
            value={homeSearch}
            onChange={(event) => setHomeSearch(event.target.value)}
            className="w-full gm-input pl-12 pr-28 py-3.5 rounded-2xl text-sm shadow-xs"
            aria-label="Search construction products"
          />

          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 btn-gm-primary px-5 py-2 rounded-xl text-xs font-bold transition-transform hover:scale-105 active:scale-95"
          >
            Search
          </button>
        </motion.form>
      </motion.section>

      {/* =====================================================================
          2. STATIC ANIMATED HERO BANNER
          ===================================================================== */}

      <motion.section
        variants={sectionVariants}
        className="relative overflow-hidden rounded-3xl bg-[#173885] text-[#FEFEFE] p-6 sm:p-10 shadow-lg border border-[#173885]"
      >
        <motion.div
          animate={{
            x: [0, 35, 0],
            y: [0, -15, 0],
            opacity: [0.18, 0.3, 0.18],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#3C7DDA] blur-3xl pointer-events-none"
        />

        <motion.div
          animate={{
            x: [0, -25, 0],
            y: [0, 15, 0],
            opacity: [0.12, 0.24, 0.12],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-24 -left-20 w-72 h-72 rounded-full bg-[#8CD0FA] blur-3xl pointer-events-none"
        />

        <AnimatePresence mode="wait">
          <motion.div
            key="static-gatemate-banner"
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.65,
            }}
            className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8"
          >
            <div className="space-y-3.5 text-left max-w-2xl">
              <motion.div
                initial={{
                  opacity: 0,
                  x: -12,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  duration: 0.5,
                  delay: 0.15,
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#3C7DDA]/30 text-[#A5D6FA] text-xs font-bold uppercase tracking-wider border border-[#A5D6FA]/30"
              >
                <Tag className="w-3.5 h-3.5" />

                {STATIC_HERO_BANNER.badge}
              </motion.div>

              <motion.h2
                initial={{
                  opacity: 0,
                  y: 12,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.55,
                  delay: 0.2,
                }}
                className="text-2xl sm:text-4xl font-extrabold text-[#FEFEFE] leading-tight"
              >
                {STATIC_HERO_BANNER.title}
              </motion.h2>

              <motion.p
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.5,
                  delay: 0.28,
                }}
                className="text-sm text-[#E4EEF3] leading-relaxed"
              >
                {STATIC_HERO_BANNER.subtitle}
              </motion.p>

              <motion.div
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.5,
                  delay: 0.36,
                }}
                className="pt-2 flex flex-wrap items-center gap-3"
              >
                <Link
                  to={STATIC_HERO_BANNER.targetUrl}
                  className="btn-gm-primary px-6 py-3 rounded-xl text-sm flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
                >
                  <span>{STATIC_HERO_BANNER.ctaText}</span>

                  <ChevronRight className="w-4 h-4 text-[#FEFEFE]" />
                </Link>

                <Link
                  to={STATIC_HERO_BANNER.secondaryUrl}
                  className="px-5 py-3 rounded-xl text-sm font-bold text-[#E4EEF3] border border-[#9AAED4]/40 hover:bg-[#FFFFFF]/10 transition"
                >
                  {STATIC_HERO_BANNER.secondaryText}
                </Link>

                <span className="text-[#A5D6FA] font-extrabold text-sm sm:text-base bg-[#0F255C] px-3.5 py-2 rounded-xl border border-[#3C7DDA]/30">
                  {STATIC_HERO_BANNER.highlight}
                </span>
              </motion.div>
            </div>

            <motion.div
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="hidden md:flex relative shrink-0 w-44 h-44 rounded-3xl bg-[#0F255C]/70 border border-[#A5D6FA]/20 items-center justify-center"
            >
              <motion.div
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 18,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute inset-5 rounded-full border border-dashed border-[#8CD0FA]/40"
              />

              <div className="relative w-20 h-20 rounded-2xl bg-[#3C7DDA] flex items-center justify-center shadow-xl">
                <HardHat className="w-10 h-10 text-[#FEFEFE]" />
              </div>

              <motion.div
                animate={{
                  scale: [1, 1.12, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute top-5 right-5 w-3 h-3 rounded-full bg-[#8CD0FA]"
              />

              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.4,
                }}
                className="absolute bottom-7 left-7 w-2.5 h-2.5 rounded-full bg-[#FEFEFE]"
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </motion.section>

      {/* =====================================================================
          ERROR STATE
          ===================================================================== */}

      {error && (
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="gm-panel p-8 rounded-3xl border border-[#D9E2EA] text-center space-y-4 max-w-lg mx-auto bg-[#FEFEFE] shadow-sm"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#E4EEF3] text-[#173885] flex items-center justify-center mx-auto border border-[#D9E2EA]">
            <HardHat className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#173885]">
              Catalogue Temporarily Unavailable
            </h3>

            <p className="text-xs text-[#606460] leading-relaxed max-w-md mx-auto">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={loadHomeCatalog}
            className="btn-gm-primary px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-transform hover:scale-105 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#FEFEFE]" />

            <span>Reconnect to Catalogue</span>
          </button>
        </motion.div>
      )}

      {/* =====================================================================
          3. CONSTRUCTION PRODUCT CATEGORIES
          ===================================================================== */}

      <motion.section variants={sectionVariants}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#173885]" />

            <h2 className="text-xl font-bold text-[#173885] tracking-wide">
              Construction Product Categories
            </h2>
          </div>

          <Link
            to="/products"
            className="text-xs text-[#3C7DDA] hover:underline font-bold flex items-center gap-1"
          >
            View All
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <motion.div
                key={index}
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                transition={{
                  delay: index * 0.04,
                }}
                className="aspect-[4/3] rounded-2xl bg-[#E4EEF3] border border-[#D9E2EA] animate-pulse"
              />
            ))}
          </div>
        ) : categories.length > 0 ? (
          <motion.div
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.06,
                },
              },
            }}
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              amount: 0.15,
            }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
          >
            {categories.map((category) => (
              <motion.div
                key={category.id || category.slug}
                variants={cardVariants}
                whileHover={{
                  y: -6,
                  scale: 1.02,
                }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 20,
                }}
              >
                <CategoryCard category={category} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="gm-panel p-8 rounded-3xl text-center">
            <p className="text-sm text-[#606460]">
              No construction product categories are currently available.
            </p>
          </div>
        )}
      </motion.section>

      {/* =====================================================================
          4. FEATURED CONSTRUCTION PRODUCTS
          ===================================================================== */}

      <motion.section variants={sectionVariants}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-[#173885]">
              Featured Construction Products
            </h2>

            <p className="text-xs text-[#606460] mt-1">
              Products currently available from verified vendors in Pune &
              Pimpri-Chinchwad
            </p>
          </div>

          <Link
            to="/products"
            className="text-xs font-bold text-[#3C7DDA] hover:underline flex items-center gap-1"
          >
            Explore All
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <ProductCardSkeleton key={`product-skeleton-${index}`} />
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <motion.div
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.08,
                },
              },
            }}
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              amount: 0.1,
            }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {featuredProducts.map((product) => (
              <motion.div
                key={product.id || product.slug}
                variants={cardVariants}
                whileHover={{
                  y: -7,
                }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="gm-panel p-10 rounded-3xl text-center">
            <PackageCheck className="w-10 h-10 text-[#3C7DDA] mx-auto mb-3" />

            <h3 className="text-base font-bold text-[#173885]">
              Products Coming Soon
            </h3>

            <p className="text-xs text-[#606460] mt-1">
              Verified construction products will appear here as vendors publish
              their listings.
            </p>

            <Link
              to="/products"
              className="btn-gm-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold mt-5"
            >
              Browse Catalogue
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </motion.section>

      {/* =====================================================================
          5. TRUST + DELIVERY STANDARDS
          ===================================================================== */}

      <motion.section variants={sectionVariants} className="space-y-6 pt-2">
        <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-3">
          <div>
            <h3 className="text-lg font-bold text-[#173885]">
              Hyperlocal Delivery & Verified Vendor Standards
            </h3>

            <p className="text-xs text-[#606460] mt-1">
              Marketplace standards for contractors, builders and site engineers
              in Pune & PCMC
            </p>
          </div>
        </div>

        <motion.div
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.08,
              },
            },
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.15,
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* 30 MINUTE DELIVERY */}

          <motion.div
            variants={cardVariants}
            whileHover={{
              y: -5,
              scale: 1.015,
            }}
            className="gm-card p-5 rounded-2xl space-y-2"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E4EEF3] border border-[#9AAED4]/30 flex items-center justify-center text-[#173885]">
              <Zap className="w-5 h-5 fill-[#3C7DDA] text-[#3C7DDA]" />
            </div>

            <h4 className="text-xs font-bold text-[#282926]">
              30-Minute Delivery
            </h4>

            <p className="text-[11px] text-[#606460] leading-relaxed">
              Eligible products and orders can be delivered within 30 minutes
              based on vendor location, inventory and pincode.
            </p>
          </motion.div>

          {/* VERIFIED VENDORS */}

          <motion.div
            variants={cardVariants}
            whileHover={{
              y: -5,
              scale: 1.015,
            }}
            className="gm-card p-5 rounded-2xl space-y-2"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E1F2D9] border border-[#3F7D20]/20 flex items-center justify-center text-[#3F7D20]">
              <ShieldCheck className="w-5 h-5" />
            </div>

            <h4 className="text-xs font-bold text-[#282926]">
              Verified Vendors
            </h4>

            <p className="text-[11px] text-[#606460] leading-relaxed">
              Products are supplied by vendors who complete the GateMate
              onboarding and verification process.
            </p>
          </motion.div>

          {/* PRODUCT PRICING */}

          <motion.div
            variants={cardVariants}
            whileHover={{
              y: -5,
              scale: 1.015,
            }}
            className="gm-card p-5 rounded-2xl space-y-2"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E4EEF3] border border-[#9AAED4]/30 flex items-center justify-center text-[#173885]">
              <ThumbsUp className="w-5 h-5" />
            </div>

            <h4 className="text-xs font-bold text-[#282926]">
              Competitive Product Pricing
            </h4>

            <p className="text-[11px] text-[#606460] leading-relaxed">
              Compare construction products from nearby vendors and select
              products based on price, availability and specifications.
            </p>
          </motion.div>

          {/* CUSTOMER SUPPORT */}

          <motion.div
            variants={cardVariants}
            whileHover={{
              y: -5,
              scale: 1.015,
            }}
            className="gm-card p-5 rounded-2xl space-y-2"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E3EBFA] border border-[#2E4D94]/20 flex items-center justify-center text-[#2E4D94]">
              <Clock className="w-5 h-5" />
            </div>

            <h4 className="text-xs font-bold text-[#282926]">
              Customer Support
            </h4>

            <p className="text-[11px] text-[#606460] leading-relaxed">
              Get support for product orders, delivery coordination and
              marketplace-related questions.
            </p>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* =====================================================================
          6. DELIVERY NETWORK HIGHLIGHT
          ===================================================================== */}

      <motion.section
        variants={sectionVariants}
        className="relative overflow-hidden rounded-3xl bg-[#E4EEF3]/60 border border-[#D9E2EA] p-7 sm:p-9"
      >
        <motion.div
          animate={{
            x: [0, 20, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -right-20 -top-20 w-56 h-56 rounded-full bg-[#8CD0FA]/20 blur-3xl"
        />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FEFEFE] border border-[#D9E2EA] text-[#173885] text-xs font-bold">
              <Truck className="w-3.5 h-3.5 text-[#3C7DDA]" />
              Hyperlocal Delivery Network
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-[#173885]">
              Find products closer to your construction site.
            </h3>

            <p className="text-xs sm:text-sm text-[#606460] leading-relaxed max-w-2xl">
              GateMate connects customers with nearby vendors so product
              availability, delivery distance and eligible 30-minute delivery
              can be considered before placing an order.
            </p>
          </div>

          <motion.div
            animate={{
              y: [0, -7, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="flex justify-center md:justify-end"
          >
            <div className="w-28 h-28 rounded-3xl bg-[#173885] flex items-center justify-center shadow-lg">
              <Truck className="w-12 h-12 text-[#FEFEFE]" />
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* =====================================================================
          7. BULK ORDERS & PROJECT RFQ
          ===================================================================== */}

      <motion.section
        variants={sectionVariants}
        className="gm-panel p-8 rounded-3xl border border-[#D9E2EA] flex flex-col md:flex-row items-center justify-between gap-6 bg-[#E4EEF3]/60"
      >
        <div className="space-y-2 text-center md:text-left">
          <span className="badge-gm-info px-3 py-1 rounded-full text-xs uppercase tracking-wider">
            Commercial Bulk Orders & Project Estimates
          </span>

          <h3 className="text-2xl font-black text-[#173885]">
            Need larger quantities for your project?
          </h3>

          <p className="text-xs text-[#606460] max-w-2xl leading-relaxed">
            Submit your project requirements for volume product quotations and
            vendor responses across Pune & PCMC.
          </p>
        </div>

        <Link
          to="/account/b2b"
          className="btn-gm-primary px-6 py-3.5 rounded-xl text-sm flex items-center gap-2 shrink-0 transition shadow-md hover:scale-105 active:scale-95"
        >
          <span>Request Project RFQ</span>

          <ArrowRight className="w-4 h-4 text-[#FEFEFE]" />
        </Link>
      </motion.section>

      {/* =====================================================================
          8. VENDOR ENTRY
          ===================================================================== */}

      {!user && (
        <motion.section
          variants={sectionVariants}
          className="gm-panel p-8 rounded-3xl border border-[#9AAED4]/40 flex flex-col md:flex-row items-center justify-between gap-6 bg-[#FEFEFE]"
        >
          <div className="space-y-1.5 text-center md:text-left">
            <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Vendor Marketplace
            </span>

            <h3 className="text-2xl font-black text-[#173885]">
              Are you a construction products vendor?
            </h3>

            <p className="text-xs text-[#606460] max-w-2xl leading-relaxed">
              Register your business on GateMate to list construction products,
              manage inventory and receive customer orders from your serviceable
              locations.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 shrink-0">
            <Link
              to="/sell"
              className="btn-gm-primary px-6 py-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
            >
              <Building2 className="w-4 h-4 text-[#FEFEFE]" />

              <span>Become a Vendor</span>

              <ArrowRight className="w-4 h-4 text-[#FEFEFE]" />
            </Link>

            <Link
              to="/vendor/login"
              className="btn-gm-secondary px-5 py-3.5 rounded-xl text-xs font-bold transition-transform hover:scale-105 active:scale-95"
            >
              Vendor Sign In
            </Link>
          </div>
        </motion.section>
      )}
    </motion.div>
  );
};

export default CustomerHome;
