import { PRODUCTS_DATA } from "../data/mockData";

// Extended catalog definition matching the Supabase schema
export const EXTENDED_PRODUCTS = PRODUCTS_DATA.map((p) => ({
  ...p,
  brand: "Marwar Heritage Arts",
  sku: `GM-SKU-${p.id.padStart(4, "0")}`,
  inStock: p.stock > 0,
  inventoryCount: p.stock,
  seller: {
    id: `seller-${p.id}`,
    name: "Marwar Craft Guild",
    location: "Jodhpur, Rajasthan",
    rating: 4.9,
    ordersCompleted: 1420,
    verified: true,
  },
  variants: [
    {
      id: "v-1",
      name: "Standard Antique Polish",
      priceOffset: 0,
      stock: p.stock,
    },
    { id: "v-2", name: "Royal Matte Gold Finish", priceOffset: 350, stock: 3 },
  ],
  dynamicAttributes: [
    { label: "Material", value: "High-Grade Brass & Seasoned Sheesham Wood" },
    { label: "Origin", value: "Jodhpur, Rajasthan (GI Certified Region)" },
    { label: "Finish Type", value: "Hand-buffed Antique Patina" },
    { label: "Weather Proofing", value: "IP65 Rated Exterior Seal" },
    { label: "Weight", value: "1.85 kg" },
    { label: "Warranty", value: "2 Years Manufacturer Warranty" },
  ],
  reviewsList: [
    {
      id: "rev-1",
      author: "Vikramaditya Singh",
      rating: 5,
      date: "14 August 2026",
      comment:
        "Exceptional craftsmanship. The brass weight and fitting quality exceed industrial alternatives.",
      verifiedPurchase: true,
    },
    {
      id: "rev-2",
      author: "Meera Deshmukh",
      rating: 5,
      date: "02 August 2026",
      comment:
        "Delivered securely to Pune with zero scratches. Color matches the description perfectly.",
      verifiedPurchase: true,
    },
  ],
  faqs: [
    {
      q: "Is mounting hardware included in the package?",
      a: "Yes, heavy-duty stainless screws, wall anchors, and a template are included.",
    },
    {
      q: "Can this withstand exterior monsoons and direct sunlight?",
      a: "Yes, all exterior products are treated with weather-resistant anti-tarnish glaze.",
    },
    {
      q: "What is the return policy for this product?",
      a: "We provide a 7-day doorstep replacement if transit damage or manufacturing defects are present.",
    },
  ],
}));

export const productService = {
  async getBySlug(slug) {
    // Simulating async network delay for loaders
    await new Promise((resolve) => setTimeout(resolve, 250));
    const product = EXTENDED_PRODUCTS.find((item) => item.slug === slug);
    if (!product) throw new Error("Product not found in GateMate catalog.");
    return product;
  },

  async checkServiceability(pincode) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const cleanPin = String(pincode).trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      return { serviceable: false, message: "Invalid 6-digit PIN code." };
    }
    // Mock regional delivery rules (all Indian pincodes serviceable in mock)
    return {
      serviceable: true,
      estimatedDays: cleanPin.startsWith("342")
        ? "Next Day Delivery"
        : "3-4 Business Days",
      codAvailable: true,
      freeShipping: true,
    };
  },
};
