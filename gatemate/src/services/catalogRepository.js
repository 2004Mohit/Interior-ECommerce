/**
 * GateMate Centralized Construction Catalogue Repository Architecture
 * Consumes standardized construction products and categories without emojis.
 */

import { CATALOGUE_CATEGORIES } from "../data/categories";
import { DEMO_PRODUCTS } from "../data/demoProducts";

const PROMOTIONAL_BANNERS = [
  {
    id: "ban-pn-1",
    badge: "PUNE & PCMC 30-MIN SITE DISPATCH",
    title: "Certified Cement, Steel TMT & Sand Direct Delivery",
    subtitle:
      "UltraTech PPC Cement, Tata Tiscon 550D Rebars, M-Sand & Dr. Fixit chemicals at wholesale rates.",
    cta: "Explore Products",
    discount: "Bulk Contractor Rates",
    link: "/products",
    order: 1,
    isActive: true,
  },
  {
    id: "ban-pn-2",
    badge: "COMMERCIAL B2B SUPPLY",
    title: "Siporex AAC Blocks & Structural Rebars",
    subtitle:
      "Direct truckload deliveries to residential and commercial construction sites in Pune & PCMC.",
    cta: "View Structural Steel",
    discount: "GST Invoicing Available",
    link: "/products?category=steel-tmt",
    order: 2,
    isActive: true,
  },
];

export const catalogRepository = {
  async getCategories() {
    await new Promise((resolve) => setTimeout(resolve, 60));
    return CATALOGUE_CATEGORIES;
  },

  async getPromotionalBanners() {
    await new Promise((resolve) => setTimeout(resolve, 60));
    return PROMOTIONAL_BANNERS;
  },

  async getFeaturedProducts() {
    await new Promise((resolve) => setTimeout(resolve, 80));
    return DEMO_PRODUCTS;
  },

  async getProductBySlug(slug) {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const match = DEMO_PRODUCTS.find((p) => p.slug === slug);
    return match || null;
  },

  async queryCatalog({
    query = "",
    category = "",
    brand = "",
    unit = "",
    grade = "",
    inStockOnly = false,
    minPrice,
    maxPrice,
    expressOnly = false,
    pincode = "",
    sort = "relevance",
  } = {}) {
    await new Promise((resolve) => setTimeout(resolve, 100));

    let items = [...DEMO_PRODUCTS];

    // Construction Terminology & Keyword Search
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      items = items.filter((item) => {
        const nameMatch = item.name.toLowerCase().includes(q);
        const descMatch = (item.description || "").toLowerCase().includes(q);
        const catMatch = item.category.toLowerCase().includes(q);
        const brandMatch = (item.brand || "").toLowerCase().includes(q);
        const skuMatch = (item.sku || "").toLowerCase().includes(q);
        const unitMatch = (item.unit || "").toLowerCase().includes(q);
        const attrMatch = item.dynamicAttributes?.some(
          (a) =>
            a.key.toLowerCase().includes(q) ||
            a.value.toLowerCase().includes(q),
        );
        const featuresMatch = item.features?.some((f) =>
          f.toLowerCase().includes(q),
        );

        // Construction synonym mapping helpers
        const isSteelQuery =
          (q === "tmt" || q === "steel" || q === "rebar") &&
          item.categorySlug === "steel-tmt";
        const isCementQuery =
          (q === "cement" || q === "ppc" || q === "opc") &&
          item.categorySlug === "cement";
        const isBlocksQuery =
          (q === "brick" ||
            q === "bricks" ||
            q === "block" ||
            q === "blocks" ||
            q === "aac") &&
          item.categorySlug === "bricks-blocks";
        const isSandQuery =
          (q === "sand" ||
            q === "aggregate" ||
            q === "aggregates" ||
            q === "grit" ||
            q === "m-sand") &&
          item.categorySlug === "sand-aggregates";
        const isPlumbingQuery =
          (q === "pipe" ||
            q === "pipes" ||
            q === "cpvc" ||
            q === "pvc pipe" ||
            q === "plumbing") &&
          (item.categorySlug === "plumbing" ||
            item.categorySlug === "pipes-fittings");
        const isChemicalsQuery =
          (q === "waterproofing" ||
            q === "paint" ||
            q === "putty" ||
            q === "chemical" ||
            q === "sealant" ||
            q === "adhesive") &&
          (item.categorySlug === "waterproofing" ||
            item.categorySlug === "paints-construction-chemicals");
        const isElectricalQuery =
          (q === "cable" ||
            q === "wire" ||
            q === "wires" ||
            q === "switch" ||
            q === "switches" ||
            q === "mcb") &&
          (item.categorySlug === "electrical" ||
            item.categorySlug === "switches-sockets");
        const isHardwareQuery =
          (q === "hardware" ||
            q === "fastener" ||
            q === "bolt" ||
            q === "anchor" ||
            q === "hinge" ||
            q === "channel") &&
          (item.categorySlug === "hardware" ||
            item.categorySlug === "hinges-channels");
        const isPlywoodQuery =
          (q === "plywood" ||
            q === "ply" ||
            q === "board" ||
            q === "boards" ||
            q === "hdhmr" ||
            q === "mdf") &&
          item.categorySlug === "plywood-boards";

        return (
          nameMatch ||
          descMatch ||
          catMatch ||
          brandMatch ||
          skuMatch ||
          unitMatch ||
          attrMatch ||
          featuresMatch ||
          isSteelQuery ||
          isCementQuery ||
          isBlocksQuery ||
          isSandQuery ||
          isPlumbingQuery ||
          isChemicalsQuery ||
          isElectricalQuery ||
          isHardwareQuery ||
          isPlywoodQuery
        );
      });
    }

    // Category Filter
    if (category && category !== "all") {
      items = items.filter(
        (item) =>
          item.categorySlug === category ||
          item.category.toLowerCase() === category.toLowerCase(),
      );
    }

    // Brand Filter
    if (brand && brand !== "all") {
      items = items.filter(
        (item) => item.brand.toLowerCase() === brand.toLowerCase(),
      );
    }

    // Unit of Measurement Filter (Bag, Piece, Bundle, Brass, Can, Coil, Sheet, Box)
    if (unit && unit !== "all") {
      items = items.filter((item) =>
        item.unit?.toLowerCase().includes(unit.toLowerCase()),
      );
    }

    // Grade / Technical Spec Filter
    if (grade && grade !== "all") {
      items = items.filter((item) =>
        item.dynamicAttributes?.some(
          (a) =>
            (a.key.toLowerCase().includes("grade") ||
              a.key.toLowerCase().includes("material") ||
              a.key.toLowerCase().includes("type")) &&
            a.value.toLowerCase().includes(grade.toLowerCase()),
        ),
      );
    }

    // Availability / Stock Filter
    if (inStockOnly) {
      items = items.filter((item) => item.stock > 0);
    }

    // Price Bounds
    if (minPrice !== undefined && minPrice !== null && !isNaN(minPrice)) {
      items = items.filter((item) => item.price >= Number(minPrice));
    }
    if (maxPrice !== undefined && maxPrice !== null && !isNaN(maxPrice)) {
      items = items.filter((item) => item.price <= Number(maxPrice));
    }

    // Express Priority Dispatch Filter
    if (expressOnly) {
      items = items.filter((item) => item.isExpress30MinAvailable);
    }

    // Pincode Delivery Geofence Eligibility
    if (pincode && /^\d{6}$/.test(pincode.trim())) {
      items = items.filter((item) =>
        item.serviceablePincodes?.includes(pincode.trim()),
      );
    }

    // Sorting
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

  async getFilterFacets() {
    const all = DEMO_PRODUCTS;
    const brands = Array.from(new Set(all.map((p) => p.brand).filter(Boolean)));
    const units = Array.from(new Set(all.map((p) => p.unit).filter(Boolean)));

    // Extract real construction grades (OPC 53, PPC, Fe 550D, BWP IS:710, CPVC SDR 11, etc.)
    const grades = [
      "PPC (Portland Pozzolana Cement)",
      "OPC 53 Grade",
      "Fe 550D (High Ductility)",
      "SDR 11 (28.1 kg/cm²)",
      "BWP (Boiling Water Proof IS:710)",
      "Grade 304 Stainless Steel",
    ];

    const prices = all.map((p) => p.price);
    const minPrice = Math.min(...prices, 40);
    const maxPrice = Math.max(...prices, 8000);

    return {
      brands,
      units,
      grades,
      minPrice,
      maxPrice,
    };
  },
};
