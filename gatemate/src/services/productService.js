import { PRODUCTS_DATA } from "../data/mockData";

const EXTENDED_PRODUCT_DETAILS = {
  "handcrafted-blue-pottery-royal-urn": {
    brand: "Marwar Heritage Crafts",
    sku: "GM-POT-URN-001",
    createdAt: "2026-08-15",
    isExpress30MinAvailable: true,
    serviceablePincodes: ["342001", "342006", "342011", "411045", "411028"],
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
      { key: "Origin", value: "Jodhpur, Rajasthan" },
      { key: "Weight", value: "2.4 kg" },
      { key: "Dimensions", value: "30 cm x 18 cm x 18 cm" },
    ],
    seller: {
      id: "sel-101",
      name: "Rathore Clayworks Studio",
      rating: 4.9,
      totalSales: "1,400+ orders",
      location: "Old City, Jodhpur",
      badge: "Master Verified Artisan",
      joinedDate: "2024",
    },
    faqs: [
      {
        q: "Can this urn hold water for fresh flower arrangements?",
        a: "Yes, this pottery is triple-glazed with natural glass enamel and is fully waterproof.",
      },
      {
        q: "Is it eligible for 30-minute express doorstep delivery?",
        a: "Yes, within select Jodhpur and Pune central operational zones, 30-min delivery is prioritized.",
      },
      {
        q: "How is fragile pottery packaged for shipment?",
        a: "Every piece is enclosed in custom high-density honeycomb thermocol and corrugated royal packaging.",
      },
    ],
    reviewsList: [
      {
        id: "r1",
        author: "Vikramaditya S.",
        rating: 5,
        date: "2 days ago",
        comment:
          "Authentic cobalt shade and exceptional glaze quality. Delivered within 30 mins in Jodhpur!",
        verified: true,
      },
      {
        id: "r2",
        author: "Pooja Mehta",
        rating: 5,
        date: "1 week ago",
        comment:
          "Stunning centerpiece for our living room. Truly royal heritage craftsmanship.",
        verified: true,
      },
    ],
  },
  "heavy-duty-sheesham-automatic-gate-latch": {
    brand: "GateMate Forge Works",
    sku: "GM-HDW-LAT-002",
    createdAt: "2026-09-01",
    isExpress30MinAvailable: true,
    serviceablePincodes: ["342001", "342006", "342011", "411045", "411028"],
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
      { key: "Lock Compatibility", value: "Euro-Profile and Smart Padlocks" },
    ],
    seller: {
      id: "sel-102",
      name: "Marwar Architectural Hardware Ltd.",
      rating: 4.8,
      totalSales: "4,200+ units",
      location: "Industrial Estate, Jodhpur",
      badge: "Certified Manufacturer",
      joinedDate: "2023",
    },
    faqs: [
      {
        q: "Are mounting bolts and hardware included?",
        a: "Yes, heavy-duty through-bolts and anchor brackets are included in the package.",
      },
      {
        q: "Can this be hooked with automatic gate motor arms?",
        a: "Yes, standard mechanical linkage slots are pre-machined.",
      },
    ],
    reviewsList: [
      {
        id: "r1",
        author: "Col. Rajesh Ranawat",
        rating: 5,
        date: "3 days ago",
        comment: "Very sturdy latch. Heavy feel and smooth locking mechanism.",
        verified: true,
      },
    ],
  },
  "indigo-block-print-heritage-curtain": {
    brand: "Marwar Heritage Crafts",
    sku: "GM-FUR-CUR-003",
    createdAt: "2026-07-20",
    isExpress30MinAvailable: false,
    serviceablePincodes: ["342001", "342006", "342011", "411045", "411028"],
    dynamicAttributes: [
      { key: "Material", value: "Organic Cotton" },
      { key: "Origin", value: "Jodhpur, Rajasthan" },
    ],
  },
  "cobalt-floral-glazed-dining-set": {
    brand: "Marwar Heritage Crafts",
    sku: "GM-POT-DIN-004",
    createdAt: "2026-08-25",
    isExpress30MinAvailable: true,
    serviceablePincodes: ["342001", "342006", "342011", "411045", "411028"],
    dynamicAttributes: [
      { key: "Material", value: "Ground Quartz" },
      { key: "Origin", value: "Jodhpur, Rajasthan" },
    ],
  },
  "antique-imperial-door-knocker": {
    brand: "GateMate Forge Works",
    sku: "GM-HDW-KNO-005",
    createdAt: "2026-06-10",
    isExpress30MinAvailable: true,
    serviceablePincodes: ["342001", "342006", "342011", "411045", "411028"],
    dynamicAttributes: [
      { key: "Material", value: "Solid Brass" },
      { key: "Origin", value: "Jodhpur, Rajasthan" },
    ],
  },
  "carved-lattice-window-panel-wall-art": {
    brand: "Royal Sheesham Guild",
    sku: "GM-WOD-JHA-006",
    createdAt: "2026-09-05",
    isExpress30MinAvailable: false,
    serviceablePincodes: ["342001", "342006", "342011", "411045", "411028"],
    dynamicAttributes: [
      { key: "Material", value: "Seasoned Sheesham" },
      { key: "Origin", value: "Jodhpur, Rajasthan" },
    ],
  },
};

const getMergedProduct = (p) => {
  const extra = EXTENDED_PRODUCT_DETAILS[p.slug] || {
    brand: "GateMate Heritage",
    sku: `GM-SKU-${p.id}00`,
    createdAt: "2026-08-01",
    isExpress30MinAvailable: false,
    serviceablePincodes: ["342001", "342006", "342011", "411045", "411028"],
    dynamicAttributes: [{ key: "Material", value: "Artisanal Blend" }],
  };
  return {
    ...p,
    ...extra,
    gallery: p.gallery && p.gallery.length > 0 ? p.gallery : [p.img],
  };
};

export const productService = {
  async getProductBySlug(slug) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const baseProduct = PRODUCTS_DATA.find((p) => p.slug === slug);
    if (!baseProduct) return null;
    return getMergedProduct(baseProduct);
  },

  async queryProducts({
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
    // Simulated async micro-delay for realistic UI loading states
    await new Promise((resolve) => setTimeout(resolve, 200));

    let items = PRODUCTS_DATA.map(getMergedProduct);

    // 1. Text Search (Name, Description, Category, Brand, Attribute Values)
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

    // 2. Category Filter
    if (category && category !== "all") {
      items = items.filter(
        (item) => item.categorySlug === category || item.category === category,
      );
    }

    // 3. Brand Filter
    if (brand && brand !== "all") {
      items = items.filter((item) => item.brand === brand);
    }

    // 4. Material / Dynamic Attribute Filter
    if (material && material !== "all") {
      items = items.filter((item) =>
        item.dynamicAttributes?.some(
          (a) => a.key === "Material" && a.value === material,
        ),
      );
    }

    // 5. Price Range Filter
    if (minPrice !== undefined && minPrice !== null && !isNaN(minPrice)) {
      items = items.filter((item) => item.price >= Number(minPrice));
    }
    if (maxPrice !== undefined && maxPrice !== null && !isNaN(maxPrice)) {
      items = items.filter((item) => item.price <= Number(maxPrice));
    }

    // 6. 30-Minute Express Only
    if (expressOnly) {
      items = items.filter((item) => item.isExpress30MinAvailable);
    }

    // 7. Pincode Availability Filter
    if (pincode && /^\d{6}$/.test(pincode.trim())) {
      items = items.filter((item) =>
        item.serviceablePincodes?.includes(pincode.trim()),
      );
    }

    // 8. Sorting
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
        // Keep default curated score
        break;
    }

    return items;
  },

  async getFilterFacets() {
    const all = PRODUCTS_DATA.map(getMergedProduct);
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
    const maxPrice = Math.max(...prices, 10000);

    return {
      brands,
      materials,
      minPrice,
      maxPrice,
    };
  },

  checkDeliveryPincode(pincode, isExpress30MinAvailable) {
    const cleanPin = (pincode || "").trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      return {
        valid: false,
        message: "Please enter a valid 6-digit Indian PIN code.",
      };
    }

    const expressPincodes = ["342001", "342006", "342011", "411045", "411028"];
    if (expressPincodes.includes(cleanPin)) {
      return {
        valid: true,
        isExpress: isExpress30MinAvailable,
        deliveryTime: isExpress30MinAvailable
          ? "⚡ Express 30-Minute Priority Delivery"
          : "Standard 24-Hour Dispatch",
        cost: "Free Delivery",
      };
    }

    return {
      valid: true,
      isExpress: false,
      deliveryTime: "Standard Courier Delivery (2-3 Business Days)",
      cost: "Free Delivery",
    };
  },
};
