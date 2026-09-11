/**
 * GateMate Vendor Products & Approval Workflow Service
 * Supports lifecycle stages:
 * DRAFT -> SUBMITTED -> UNDER_REVIEW -> (CHANGES_REQUESTED / REJECTED / APPROVED -> PUBLISHED)
 */

export const PRODUCT_APPROVAL_STATUS = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  CHANGES_REQUESTED: "CHANGES_REQUESTED",
  APPROVED: "APPROVED",
  PUBLISHED: "PUBLISHED",
  REJECTED: "REJECTED",
};

const VENDOR_PRODUCTS_KEY = "gatemate_vendor_products_list_";

const INITIAL_VENDOR_PRODUCTS = [
  {
    id: "vp-001",
    vendorId: "vnd-pune-001",
    slug: "ultratech-super-cement-50kg-ppc",
    name: "UltraTech Super Weather-Shield PPC Cement (50 kg Bag)",
    brand: "UltraTech",
    category: "Cement",
    categorySlug: "cement",
    unit: "Bag",
    sku: "ULT-PPC-50KG",
    price: 385,
    originalPrice: 420,
    stock: 500,
    moq: 10,
    status: PRODUCT_APPROVAL_STATUS.PUBLISHED,
    reviewerNotes: "Approved batch test verification.",
    img: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80",
    createdAt: "2026-08-01T10:00:00Z",
    updatedAt: "2026-08-01T12:00:00Z",
  },
  {
    id: "vp-002",
    vendorId: "vnd-pune-001",
    slug: "tata-tiscon-550d-tmt-rebar-12mm",
    name: "Tata Tiscon 550D High Ductility Earthquake Resistant TMT Rebar (12mm)",
    brand: "Tata Tiscon",
    category: "Steel & TMT",
    categorySlug: "steel-tmt",
    unit: "Piece",
    sku: "TAT-TMT-12MM-550D",
    price: 840,
    originalPrice: 960,
    stock: 220,
    moq: 5,
    status: PRODUCT_APPROVAL_STATUS.PUBLISHED,
    reviewerNotes: "Approved primary steel distributor compliance.",
    img: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80",
    createdAt: "2026-08-04T11:00:00Z",
    updatedAt: "2026-08-04T15:30:00Z",
  },
  {
    id: "vp-003",
    vendorId: "vnd-pune-001",
    slug: "siporex-aac-lightweight-block-600x200x150mm",
    name: "Siporex Lightweight Autoclaved Aerated Concrete AAC Block (600x200x150mm)",
    brand: "Siporex",
    category: "Bricks & Blocks",
    categorySlug: "bricks-blocks",
    unit: "Piece",
    sku: "SIP-AAC-150MM",
    price: 72,
    originalPrice: 88,
    stock: 1200,
    moq: 50,
    status: PRODUCT_APPROVAL_STATUS.UNDER_REVIEW,
    reviewerNotes: "Inspection in progress by technical reviewer.",
    img: "https://images.unsplash.com/photo-1584463623578-301147571343?auto=format&fit=crop&w=800&q=80",
    createdAt: "2026-09-08T09:00:00Z",
    updatedAt: "2026-09-08T09:30:00Z",
  },
  {
    id: "vp-004",
    vendorId: "vnd-pune-001",
    slug: "washed-manufactured-m-sand-for-concreting-1-brass",
    name: "Washed Manufactured Sand (M-Sand) for RCC Concreting (1 Brass / 100 Cu Ft)",
    brand: "Sahyadri Aggregates",
    category: "Sand & Aggregates",
    categorySlug: "sand-aggregates",
    unit: "Brass (100 Cu Ft)",
    sku: "SAH-MSAND-1BRS",
    price: 3600,
    originalPrice: 4200,
    stock: 40,
    moq: 1,
    status: PRODUCT_APPROVAL_STATUS.CHANGES_REQUESTED,
    reviewerNotes:
      "Please clarify sieve gradation report (IS 383 Zone II certificate).",
    img: "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=800&q=80",
    createdAt: "2026-09-09T14:00:00Z",
    updatedAt: "2026-09-09T16:00:00Z",
  },
  {
    id: "vp-005",
    vendorId: "vnd-pune-001",
    slug: "corrugated-galvanised-steel-roofing-sheet",
    name: "Heavy Galvanized Corrugated Steel Roofing Profile Sheet (10x3.5 ft)",
    brand: "JSW Colouron",
    category: "Roofing",
    categorySlug: "roofing",
    unit: "Sheet",
    sku: "JSW-ROOF-10FT",
    price: 980,
    originalPrice: 1200,
    stock: 0,
    moq: 10,
    status: PRODUCT_APPROVAL_STATUS.DRAFT,
    reviewerNotes: "",
    img: "https://images.unsplash.com/photo-1632759145351-1d592919f522?auto=format&fit=crop&w=800&q=80",
    createdAt: "2026-09-10T11:00:00Z",
    updatedAt: "2026-09-10T11:00:00Z",
  },
];

export const vendorProductService = {
  async getVendorProducts(vendorId = "vnd-pune-001") {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const stored = localStorage.getItem(`${VENDOR_PRODUCTS_KEY}${vendorId}`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse vendor products", e);
      }
    }
    localStorage.setItem(
      `${VENDOR_PRODUCTS_KEY}${vendorId}`,
      JSON.stringify(INITIAL_VENDOR_PRODUCTS),
    );
    return INITIAL_VENDOR_PRODUCTS;
  },

  async getVendorProductById(vendorId, productId) {
    const products = await this.getVendorProducts(vendorId);
    return (
      products.find((p) => p.id === productId || p.slug === productId) || null
    );
  },

  async saveProductDraft(vendorId, productData) {
    await new Promise((resolve) => setTimeout(resolve, 120));
    const products = await this.getVendorProducts(vendorId);
    let updated;
    if (productData.id) {
      updated = products.map((p) =>
        p.id === productData.id
          ? {
              ...p,
              ...productData,
              status: PRODUCT_APPROVAL_STATUS.DRAFT,
              updatedAt: new Date().toISOString(),
            }
          : p,
      );
    } else {
      const newProduct = {
        ...productData,
        id: `vp-${Date.now()}`,
        vendorId,
        slug: productData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
        status: PRODUCT_APPROVAL_STATUS.DRAFT,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updated = [newProduct, ...products];
    }
    localStorage.setItem(
      `${VENDOR_PRODUCTS_KEY}${vendorId}`,
      JSON.stringify(updated),
    );
    return updated;
  },

  async submitProductForReview(vendorId, productData) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const products = await this.getVendorProducts(vendorId);
    let updated;
    if (productData.id) {
      updated = products.map((p) =>
        p.id === productData.id
          ? {
              ...p,
              ...productData,
              status: PRODUCT_APPROVAL_STATUS.SUBMITTED,
              reviewerNotes: "",
              updatedAt: new Date().toISOString(),
            }
          : p,
      );
    } else {
      const newProduct = {
        ...productData,
        id: `vp-${Date.now()}`,
        vendorId,
        slug: productData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
        status: PRODUCT_APPROVAL_STATUS.SUBMITTED,
        reviewerNotes: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updated = [newProduct, ...products];
    }
    localStorage.setItem(
      `${VENDOR_PRODUCTS_KEY}${vendorId}`,
      JSON.stringify(updated),
    );
    return updated;
  },
};
