import { catalogRepository } from "../services/catalogRepository";

export const QUICK_CATEGORIES = [
  {
    id: "gate-automation",
    slug: "gate-automation",
    name: "Gate Automation",
    icon: "⚡",
    isNew: true,
  },
  {
    id: "royal-pottery",
    slug: "royal-pottery",
    name: "Royal Pottery",
    icon: "🏺",
  },
  {
    id: "brass-hardware",
    slug: "brass-hardware",
    name: "Brass Hardware",
    icon: "🔑",
  },
  {
    id: "home-furnishing",
    slug: "home-furnishing",
    name: "Home Furnishing",
    icon: "🛋️",
  },
  { id: "carved-wood", slug: "carved-wood", name: "Carved Wood", icon: "🪵" },
  {
    id: "wall-decor",
    slug: "wall-decor",
    name: "Wall Decor",
    icon: "🎨",
    isHot: true,
  },
  {
    id: "smart-security",
    slug: "smart-security",
    name: "Smart Security",
    icon: "🛡️",
  },
  {
    id: "lighting-lamps",
    slug: "lighting-lamps",
    name: "Lighting & Lamps",
    icon: "💡",
  },
];

export const HERO_BANNERS = [
  {
    id: "ban-1",
    badge: "PUNE & PCMC FAST DISPATCH",
    title: "Architectural Gates & Premium Home Decor",
    subtitle:
      "Hand-forged brassware, luxury ceramics, and heavy-duty automatic gate systems.",
    cta: "Explore Catalog",
    discount: "Up to 35% OFF",
    link: "/products",
  },
];

export const PRODUCTS_DATA = [
  {
    id: "1",
    slug: "handcrafted-blue-pottery-royal-urn",
    name: "Handcrafted Blue Pottery Royal Urn",
    category: "Royal Pottery",
    categorySlug: "royal-pottery",
    price: 1899,
    originalPrice: 2499,
    rating: 4.9,
    reviews: 142,
    stock: 12,
    tag: "Bestseller",
    img: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "2",
    slug: "heavy-duty-sheesham-automatic-gate-latch",
    name: "Heavy Duty Sheesham Automatic Gate Latch",
    category: "Brass Hardware",
    categorySlug: "brass-hardware",
    price: 2999,
    originalPrice: 3800,
    rating: 4.8,
    reviews: 89,
    stock: 5,
    tag: "Top Rated",
    img: "https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?auto=format&fit=crop&w=800&q=80",
  },
];
