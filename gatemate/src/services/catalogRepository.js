/**
 * GateMate Centralized Catalog Repository Architecture
 *
 * Prepares support for future Supabase tables:
 * - categories (id, slug, name, icon, is_new, is_hot, display_order)
 * - brands (id, slug, name, logo_url)
 * - products (id, slug, name, brand_id, category_id, base_price, original_price, stock_quantity, delivery_class, is_active)
 * - product_variants (id, product_id, variant_type, option_value, price_modifier, stock)
 * - product_attributes (id, product_id, attribute_key, attribute_value, display_type)
 * - promotional_banners (id, badge, title, subtitle, cta_label, cta_link, discount_text, display_order, is_active)
 */

import { supabase } from "../lib/supabaseClient";

const FALLBACK_CATEGORIES = [
  {
    id: "gate-automation",
    slug: "gate-automation",
    name: "Gate Automation",
    icon: "⚡",
    isNew: true,
    isHot: false,
    order: 1,
  },
  {
    id: "royal-pottery",
    slug: "royal-pottery",
    name: "Royal Pottery",
    icon: "🏺",
    isNew: false,
    isHot: false,
    order: 2,
  },
  {
    id: "brass-hardware",
    slug: "brass-hardware",
    name: "Brass Hardware",
    icon: "🔑",
    isNew: false,
    isHot: false,
    order: 3,
  },
  {
    id: "home-furnishing",
    slug: "home-furnishing",
    name: "Home Furnishing",
    icon: "🛋️",
    isNew: false,
    isHot: false,
    order: 4,
  },
  {
    id: "carved-wood",
    slug: "carved-wood",
    name: "Carved Wood",
    icon: "🪵",
    isNew: false,
    isHot: false,
    order: 5,
  },
  {
    id: "wall-decor",
    slug: "wall-decor",
    name: "Wall Decor",
    icon: "🎨",
    isNew: false,
    isHot: true,
    order: 6,
  },
  {
    id: "smart-security",
    slug: "smart-security",
    name: "Smart Security",
    icon: "🛡️",
    isNew: false,
    isHot: false,
    order: 7,
  },
  {
    id: "lighting-lamps",
    slug: "lighting-lamps",
    name: "Lighting & Lamps",
    icon: "💡",
    isNew: false,
    isHot: false,
    order: 8,
  },
];

const FALLBACK_BANNERS = [
  {
    id: "ban-pn-1",
    badge: "PUNE & PCMC FAST DISPATCH",
    title: "Architectural Gates & Premium Home Decor",
    subtitle:
      "Hand-forged brassware, luxury ceramics, and heavy-duty automatic gate systems.",
    cta: "Explore Catalog",
    discount: "Up to 35% OFF",
    link: "/products",
    order: 1,
    isActive: true,
  },
  {
    id: "ban-pn-2",
    badge: "COMMERCIAL GRADE SECURITY",
    title: "Heavy Duty Automated Sliding Latches",
    subtitle:
      "Engineered for residential gates and housing societies with 3-year mechanical guarantee.",
    cta: "View Hardware",
    discount: "Flat ₹500 OFF",
    link: "/products?category=brass-hardware",
    order: 2,
    isActive: true,
  },
];

const FALLBACK_PRODUCTS = [
  {
    id: "1",
    slug: "handcrafted-blue-pottery-royal-urn",
    name: "Handcrafted Blue Pottery Royal Urn",
    brand: "Marwar Heritage Crafts",
    brandSlug: "marwar-heritage-crafts",
    category: "Royal Pottery",
    categorySlug: "royal-pottery",
    price: 1899,
    originalPrice: 2499,
    rating: 4.9,
    reviews: 142,
    stock: 12,
    tag: "Bestseller",
    isExpress30MinAvailable: true,
    serviceablePincodes: [
      "411001",
      "411004",
      "411005",
      "411006",
      "411014",
      "411016",
      "411028",
      "411038",
      "411045",
      "411057",
      "411017",
      "411018",
      "411019",
      "411027",
      "411033",
      "411061",
    ],
    description:
      "Traditional handcrafted pottery rendered with quartz powder and natural raw cobalt dye. Lead-free glazed finish.",
    features: [
      "Handcrafted Ceramic Art",
      "Authentic Quartz Pottery",
      "Weather-resistant glaze",
    ],
    img: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80",
    ],
    variants: [
      {
        id: "v1",
        name: "Size",
        options: ["Small (8 inch)", "Medium (12 inch)", "Large (16 inch)"],
      },
      {
        id: "v2",
        name: "Finish",
        options: ["Classic Cobalt Blue", "Turquoise Teal"],
      },
    ],
    dynamicAttributes: [
      { key: "Material", value: "Ground Quartz" },
      { key: "Craft Technique", value: "Wheel Turned" },
      { key: "Lead Content", value: "100% Lead-Free" },
      { key: "Weight", value: "2.4 kg" },
      { key: "Dimensions", value: "30 cm x 18 cm x 18 cm" },
    ],
    seller: {
      id: "sel-101",
      name: "Rathore Clayworks Studio",
      rating: 4.9,
      totalSales: "1,400+ orders",
      location: "Pune / PCMC Corridor",
      badge: "Master Verified Artisan",
      joinedDate: "2024",
    },
    createdAt: "2026-08-15",
  },
  {
    id: "2",
    slug: "heavy-duty-sheesham-automatic-gate-latch",
    name: "Heavy Duty Sheesham Automatic Gate Latch",
    brand: "GateMate Forge Works",
    brandSlug: "gatemate-forge-works",
    category: "Brass Hardware",
    categorySlug: "brass-hardware",
    price: 2999,
    originalPrice: 3800,
    rating: 4.8,
    reviews: 89,
    stock: 5,
    tag: "Top Rated",
    isExpress30MinAvailable: true,
    serviceablePincodes: [
      "411001",
      "411004",
      "411005",
      "411006",
      "411014",
      "411016",
      "411028",
      "411038",
      "411045",
      "411057",
      "411017",
      "411018",
      "411019",
      "411027",
      "411033",
      "411061",
    ],
    description:
      "High-tensile forged brass gate latch reinforced with solid Indian rosewood for residential swing and slide gates.",
    features: [
      "Rust-resistant alloy",
      "Includes high-torque mounting bolts",
      "Dual locking cylinder support",
    ],
    img: "https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?auto=format&fit=crop&w=800&q=80",
    ],
    variants: [
      {
        id: "v1",
        name: "Material Grade",
        options: ["Solid Antique Brass", "Matte Black Carbon Steel"],
      },
      {
        id: "v2",
        name: "Gate Type",
        options: ["Single Swing", "Double Sliding"],
      },
    ],
    dynamicAttributes: [
      { key: "Material", value: "Solid Brass" },
      { key: "Tensile Strength", value: "1,800 kg load capacity" },
      { key: "Wood Inlay", value: "Seasoned Sheesham" },
      { key: "Corrosion Resistance", value: "Grade 5 Salt-Spray" },
    ],
    seller: {
      id: "sel-102",
      name: "Marwar Architectural Hardware Ltd.",
      rating: 4.8,
      totalSales: "4,200+ units",
      location: "Industrial Estate, Pune",
      badge: "Certified Manufacturer",
      joinedDate: "2023",
    },
    createdAt: "2026-09-01",
  },
  {
    id: "3",
    slug: "indigo-block-print-heritage-curtain",
    name: "Indigo Block-Print Heritage Curtain (Pair)",
    brand: "Marwar Heritage Crafts",
    brandSlug: "marwar-heritage-crafts",
    category: "Home Furnishing",
    categorySlug: "home-furnishing",
    price: 1450,
    originalPrice: 2100,
    rating: 4.7,
    reviews: 215,
    stock: 20,
    tag: "Trending",
    isExpress30MinAvailable: false,
    serviceablePincodes: [
      "411001",
      "411004",
      "411005",
      "411006",
      "411014",
      "411016",
      "411028",
      "411038",
      "411045",
      "411057",
      "411017",
      "411018",
      "411019",
      "411027",
      "411033",
      "411061",
    ],
    description:
      "100% Cotton hand-block printed drapes rendered in organic indigo pigments using Marwar geometric patterns.",
    features: [
      "Natural organic indigo",
      "Shrink-proof cotton",
      "Dual loop & rod pocket header",
    ],
    img: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
    ],
    dynamicAttributes: [{ key: "Material", value: "Organic Cotton" }],
    createdAt: "2026-07-20",
  },
  {
    id: "4",
    slug: "cobalt-floral-glazed-dining-set",
    name: "Cobalt Floral Glazed Dining Set (6 pcs)",
    brand: "Marwar Heritage Crafts",
    brandSlug: "marwar-heritage-crafts",
    category: "Royal Pottery",
    categorySlug: "royal-pottery",
    price: 3499,
    originalPrice: 4500,
    rating: 4.9,
    reviews: 96,
    stock: 8,
    tag: "Artisan Choice",
    isExpress30MinAvailable: true,
    serviceablePincodes: [
      "411001",
      "411004",
      "411005",
      "411006",
      "411014",
      "411016",
      "411028",
      "411038",
      "411045",
      "411057",
      "411017",
      "411018",
      "411019",
      "411027",
      "411033",
      "411061",
    ],
    description:
      "Six piece artisanal royal ceramic dinner plates painted with flora and fired in traditional kilns.",
    features: [
      "Microwave safe",
      "Dishwasher safe",
      "Chip-resistant fired finish",
    ],
    img: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80",
    ],
    dynamicAttributes: [{ key: "Material", value: "Ground Quartz" }],
    createdAt: "2026-08-25",
  },
  {
    id: "5",
    slug: "antique-imperial-door-knocker",
    name: "Antique Imperial Door Knocker with Studs",
    brand: "GateMate Forge Works",
    brandSlug: "gatemate-forge-works",
    category: "Brass Hardware",
    categorySlug: "brass-hardware",
    price: 1199,
    originalPrice: 1799,
    rating: 4.6,
    reviews: 64,
    stock: 15,
    tag: "Sale",
    isExpress30MinAvailable: true,
    serviceablePincodes: [
      "411001",
      "411004",
      "411005",
      "411006",
      "411014",
      "411016",
      "411028",
      "411038",
      "411045",
      "411057",
      "411017",
      "411018",
      "411019",
      "411027",
      "411033",
      "411061",
    ],
    description:
      "Solid brass door knocker with lion head motif and anti-tarnish patina finish.",
    features: [
      "Solid cast brass",
      "Includes through-door fasteners",
      "Antique bronze tone",
    ],
    img: "https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?auto=format&fit=crop&w=800&q=80",
    ],
    dynamicAttributes: [{ key: "Material", value: "Solid Brass" }],
    createdAt: "2026-06-10",
  },
  {
    id: "6",
    slug: "carved-lattice-window-panel-wall-art",
    name: "Carved Lattice Window Panel Wall Art",
    brand: "Royal Sheesham Guild",
    brandSlug: "royal-sheesham-guild",
    category: "Carved Wood",
    categorySlug: "carved-wood",
    price: 4200,
    originalPrice: 5900,
    rating: 4.9,
    reviews: 52,
    stock: 4,
    tag: "Bestseller",
    isExpress30MinAvailable: false,
    serviceablePincodes: [
      "411001",
      "411004",
      "411005",
      "411006",
      "411014",
      "411016",
      "411028",
      "411038",
      "411045",
      "411057",
      "411017",
      "411018",
      "411019",
      "411027",
      "411033",
      "411061",
    ],
    description:
      "Intricately hand-chiseled Jharokha window panel crafted from seasoned Sheesham hardwood.",
    features: [
      "Pre-installed heavy wall brackets",
      "Hand-rubbed wax finish",
      "Authentic heritage woodwork",
    ],
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    ],
    dynamicAttributes: [{ key: "Material", value: "Seasoned Sheesham" }],
    createdAt: "2026-09-05",
  },
];

export const catalogRepository = {
  /**
   * Fetches Categories
   * [Supabase Target: SELECT * FROM categories WHERE is_active = true ORDER BY display_order ASC]
   */
  async getCategories() {
    await new Promise((resolve) => setTimeout(resolve, 80));
    return FALLBACK_CATEGORIES;
  },

  /**
   * Fetches Promotional Hero Banners
   * [Supabase Target: SELECT * FROM promotional_banners WHERE is_active = true ORDER BY display_order ASC]
   */
  async getPromotionalBanners() {
    await new Promise((resolve) => setTimeout(resolve, 80));
    return FALLBACK_BANNERS;
  },

  /**
   * Fetches Featured Products
   * [Supabase Target: SELECT * FROM products WHERE is_featured = true AND is_active = true LIMIT 6]
   */
  async getFeaturedProducts() {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return FALLBACK_PRODUCTS;
  },

  /**
   * Retrieves single product by slug
   */
  async getProductBySlug(slug) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const match = FALLBACK_PRODUCTS.find((p) => p.slug === slug);
    return match || null;
  },

  /**
   * Core multi-attribute & parametric query engine
   */
  async queryCatalog({
    query = "",
    category = "",
    brand = "",
    material = "",
    minPrice,
    maxPrice,
    expressOnly = false,
    pincode = "",
    sort = "relevance",
  } = {}) {
    await new Promise((resolve) => setTimeout(resolve, 120));

    let items = [...FALLBACK_PRODUCTS];

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      items = items.filter((item) => {
        const nameMatch = item.name.toLowerCase().includes(q);
        const descMatch = (item.description || "").toLowerCase().includes(q);
        const catMatch = item.category.toLowerCase().includes(q);
        const brandMatch = (item.brand || "").toLowerCase().includes(q);
        const attrMatch = item.dynamicAttributes?.some((a) =>
          a.value.toLowerCase().includes(q),
        );
        return nameMatch || descMatch || catMatch || brandMatch || attrMatch;
      });
    }

    if (category && category !== "all") {
      items = items.filter(
        (item) => item.categorySlug === category || item.category === category,
      );
    }

    if (brand && brand !== "all") {
      items = items.filter(
        (item) => item.brand === brand || item.brandSlug === brand,
      );
    }

    if (material && material !== "all") {
      items = items.filter((item) =>
        item.dynamicAttributes?.some(
          (a) => a.key === "Material" && a.value === material,
        ),
      );
    }

    if (minPrice !== undefined && minPrice !== null && !isNaN(minPrice)) {
      items = items.filter((item) => item.price >= Number(minPrice));
    }
    if (maxPrice !== undefined && maxPrice !== null && !isNaN(maxPrice)) {
      items = items.filter((item) => item.price <= Number(maxPrice));
    }

    if (expressOnly) {
      items = items.filter((item) => item.isExpress30MinAvailable);
    }

    if (pincode && /^\d{6}$/.test(pincode.trim())) {
      items = items.filter((item) =>
        item.serviceablePincodes?.includes(pincode.trim()),
      );
    }

    switch (sort) {
      case "price_asc":
        items.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        items.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        items.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        items.sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        );
        break;
      case "relevance":
      default:
        break;
    }

    return items;
  },

  /**
   * Dynamically aggregates filter facets from catalog attributes without hard-coding
   */
  async getFilterFacets() {
    const all = FALLBACK_PRODUCTS;
    const brands = Array.from(new Set(all.map((p) => p.brand).filter(Boolean)));
    const materials = Array.from(
      new Set(
        all.flatMap(
          (p) =>
            p.dynamicAttributes
              ?.filter((a) => a.key === "Material")
              .map((a) => a.value) || [],
        ),
      ),
    );
    const prices = all.map((p) => p.price);
    const minPrice = Math.min(...prices, 500);
    const maxPrice = Math.max(...prices, 6000);

    return {
      brands,
      materials,
      minPrice,
      maxPrice,
    };
  },
};
