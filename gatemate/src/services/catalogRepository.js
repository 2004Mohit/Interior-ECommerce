/**
 * GateMate Centralized Catalog Repository Architecture
 * Consumes standardized demo products and categories without emojis.
 */

import { CATALOGUE_CATEGORIES } from "../data/categories";
import { DEMO_PRODUCTS } from "../data/demoProducts";

const PROMOTIONAL_BANNERS = [
  {
    id: "ban-pn-1",
    badge: "PUNE & PCMC 30-MIN DISPATCH",
    title: "Certified Electrical, Hardware & Plywood Supplies",
    subtitle:
      "Direct contractor pricing for Polycab wires, Legrand switches, CenturyPly boards, and Astral pipes.",
    cta: "Explore Catalogue",
    discount: "Up to 35% OFF",
    link: "/products",
    order: 1,
    isActive: true,
  },
  {
    id: "ban-pn-2",
    badge: "COMMERCIAL CONTRACTOR HUB",
    title: "Heavy Duty Circuit Breakers & Switchgear",
    subtitle:
      "Schneider Electric, Havells & Legrand distribution boards for residential complexes.",
    cta: "View Switchgear",
    discount: "GST Invoicing Available",
    link: "/products?category=mcb-rccb-db",
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
    return DEMO_PRODUCTS.slice(0, 8);
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
    material = "",
    minPrice,
    maxPrice,
    expressOnly = false,
    pincode = "",
    sort = "relevance",
  } = {}) {
    await new Promise((resolve) => setTimeout(resolve, 100));

    let items = [...DEMO_PRODUCTS];

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      items = items.filter((item) => {
        const nameMatch = item.name.toLowerCase().includes(q);
        const descMatch = (item.description || "").toLowerCase().includes(q);
        const catMatch = item.category.toLowerCase().includes(q);
        const brandMatch = (item.brand || "").toLowerCase().includes(q);
        const skuMatch = (item.sku || "").toLowerCase().includes(q);
        const attrMatch = item.dynamicAttributes?.some((a) =>
          a.value.toLowerCase().includes(q),
        );
        return (
          nameMatch ||
          descMatch ||
          catMatch ||
          brandMatch ||
          skuMatch ||
          attrMatch
        );
      });
    }

    if (category && category !== "all") {
      items = items.filter(
        (item) => item.categorySlug === category || item.category === category,
      );
    }

    if (brand && brand !== "all") {
      items = items.filter(
        (item) => item.brand.toLowerCase() === brand.toLowerCase(),
      );
    }

    if (material && material !== "all") {
      items = items.filter((item) =>
        item.dynamicAttributes?.some(
          (a) =>
            a.key === "Material" &&
            a.value.toLowerCase() === material.toLowerCase(),
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

  async getFilterFacets() {
    const all = DEMO_PRODUCTS;
    const brands = Array.from(new Set(all.map((p) => p.brand).filter(Boolean)));
    const materials = Array.from(
      new Set(
        all.flatMap(
          (p) =>
            p.dynamicAttributes
              ?.filter(
                (a) => a.key === "Material" || a.key === "Conductor Material",
              )
              .map((a) => a.value) || [],
        ),
      ),
    );
    const prices = all.map((p) => p.price);
    const minPrice = Math.min(...prices, 40);
    const maxPrice = Math.max(...prices, 8000);

    return {
      brands,
      materials,
      minPrice,
      maxPrice,
    };
  },
};
