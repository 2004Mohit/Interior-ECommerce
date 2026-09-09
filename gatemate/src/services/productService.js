import { PRODUCTS_DATA } from "../data/mockData";

// Extended mock details with full specifications, variants, reviews, and seller profile
const EXTENDED_PRODUCT_DETAILS = {
  "handcrafted-blue-pottery-royal-urn": {
    brand: "Marwar Heritage Crafts",
    sku: "GM-POT-URN-001",
    isExpress30MinAvailable: true, // 30-minute hyper-local delivery flag
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
      { key: "Material", value: "Ground Quartz Powder & Natural Resin Glass" },
      { key: "Craft Technique", value: "Marwar Wheel Turned & Low-Fire Kiln" },
      { key: "Lead Content", value: "100% Lead-Free Organic Glaze" },
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
      { key: "Tensile Strength", value: "1,800 kg load capacity" },
      { key: "Wood Inlay", value: "Kiln-seasoned Indian Sheesham Hardwood" },
      { key: "Corrosion Resistance", value: "Grade 5 Salt-Spray Tested Brass" },
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
};

export const productService = {
  async getProductBySlug(slug) {
    // Simulated network delay for realistic loading skeleton states
    await new Promise((resolve) => setTimeout(resolve, 250));

    const baseProduct = PRODUCTS_DATA.find((p) => p.slug === slug);
    if (!baseProduct) return null;

    const extra = EXTENDED_PRODUCT_DETAILS[slug] || {
      brand: "GateMate Heritage",
      sku: `GM-SKU-${baseProduct.id}00`,
      isExpress30MinAvailable: true,
      serviceablePincodes: ["342001", "342006", "342011", "411045", "411028"],
      variants: [
        {
          id: "v1",
          name: "Option",
          options: ["Standard Edition", "Heritage Edition"],
        },
      ],
      dynamicAttributes: [
        { key: "Material", value: "Artisanal Blend" },
        { key: "Origin", value: "Jodhpur, Rajasthan" },
      ],
      seller: {
        id: "sel-default",
        name: "GateMate Verified Vendor Hub",
        rating: 4.7,
        totalSales: "850+ orders",
        location: "Jodhpur",
        badge: "Verified Seller",
        joinedDate: "2025",
      },
      faqs: [
        {
          q: "What is the return policy?",
          a: "We provide a 7-day hassle-free replacement on all verified items.",
        },
      ],
      reviewsList: [
        {
          id: "r1",
          author: "Customer",
          rating: 5,
          date: "Recently",
          comment: "Excellent quality and prompt delivery.",
          verified: true,
        },
      ],
    };

    return {
      ...baseProduct,
      ...extra,
      gallery:
        baseProduct.gallery && baseProduct.gallery.length > 0
          ? baseProduct.gallery
          : [baseProduct.img],
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
