/**
 * GateMate Vendor Data & Operations Service
 *
 * Reusable architecture supporting:
 * - Vendor profile onboarding & GST verification
 * - Product inventory & pricing management
 * - Site order fulfillment & 30-min priority dispatching
 * - Commercial RFQ bids & quotation submission
 * - Payouts, settlements, and Product Customer Reviews
 */

import { DEMO_PRODUCTS } from "../data/demoProducts";
import { CATALOGUE_CATEGORIES } from "../data/categories";

const VENDOR_STORAGE_KEY = "gatemate_vendor_profile";
const VENDOR_PRODUCTS_KEY = "gatemate_vendor_products";
const VENDOR_ORDERS_KEY = "gatemate_vendor_orders";
const VENDOR_RFQS_KEY = "gatemate_vendor_rfqs";

const DEFAULT_VENDOR_PROFILE = {
  id: "vnd-pune-001",
  userId: "mock-user-1",
  businessName: "Pune Mega Infrastructure Depot",
  contactPerson: "Suresh Patil",
  email: "depot@punemegaconstruct.in",
  phone: "9829012345",
  gstin: "27AAAAA0000A1Z5",
  address: "Plot 48, Hadapsar Industrial Estate, Pune 411028",
  serviceablePincodes: [
    "411001",
    "411004",
    "411006",
    "411014",
    "411028",
    "411061",
  ],
  isVerified: true,
  isExpress30MinEnabled: true,
  bankDetails: {
    accountName: "Pune Mega Infrastructure Depot Pvt Ltd",
    accountNumber: "50200012345678",
    ifscCode: "HDFC0001234",
    bankName: "HDFC Bank, Hadapsar Branch",
  },
  joinedDate: "2023-11-15",
};

export const vendorService = {
  // 1. Profile & Onboarding
  async getProfile(userId) {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const stored = localStorage.getItem(VENDOR_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Error parsing vendor profile", e);
      }
    }
    return DEFAULT_VENDOR_PROFILE;
  },

  async saveProfile(userId, profileData) {
    await new Promise((resolve) => setTimeout(resolve, 120));
    const updated = {
      ...DEFAULT_VENDOR_PROFILE,
      ...profileData,
      userId: userId || DEFAULT_VENDOR_PROFILE.userId,
      isVerified: Boolean(profileData.gstin && profileData.gstin.length === 15),
    };
    localStorage.setItem(VENDOR_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  // 2. Products & Inventory
  async getProducts() {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const stored = localStorage.getItem(VENDOR_PRODUCTS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Error parsing vendor products", e);
      }
    }
    return DEMO_PRODUCTS;
  },

  async getProductById(id) {
    const products = await this.getProducts();
    return products.find((p) => p.id === id || p.slug === id) || null;
  },

  async saveProduct(productData) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const products = await this.getProducts();
    let updated;
    if (productData.id) {
      updated = products.map((p) =>
        p.id === productData.id ? { ...p, ...productData } : p,
      );
    } else {
      const newProduct = {
        ...productData,
        id: `prod-vnd-${Date.now()}`,
        slug: productData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
        rating: 5.0,
        reviews: 0,
        createdAt: new Date().toISOString(),
      };
      updated = [newProduct, ...products];
    }
    localStorage.setItem(VENDOR_PRODUCTS_KEY, JSON.stringify(updated));
    return updated;
  },

  async updateStock(productId, newStock) {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const products = await this.getProducts();
    const updated = products.map((p) =>
      p.id === productId ? { ...p, stock: Number(newStock) } : p,
    );
    localStorage.setItem(VENDOR_PRODUCTS_KEY, JSON.stringify(updated));
    return updated;
  },

  // 3. Vendor Orders
  async getOrders() {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const stored = localStorage.getItem(VENDOR_ORDERS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Error parsing vendor orders", e);
      }
    }
    return [
      {
        id: "GM-ORD-20260908-0192",
        createdAt: "2026-09-08T10:15:00Z",
        orderStatus: "OUT_FOR_DELIVERY",
        paymentStatus: "PENDING",
        paymentMethod: "Pay on Delivery",
        isExpress30Min: true,
        items: [
          {
            id: "prod-cem-001",
            name: "UltraTech Super Weather-Shield PPC Cement (50 kg Bag)",
            unit: "Bag",
            price: 385,
            quantity: 10,
            sku: "ULT-PPC-50KG",
          },
        ],
        shippingAddress: {
          fullName: "Aditya Rathore",
          phone: "9829012345",
          line1: "Site 402, Royal Palms, Lane 7",
          locality: "Koregaon Park",
          city: "Pune",
          pincode: "411006",
        },
        totals: {
          itemSubtotal: 3850,
          deliveryFee: 0,
          packagingFee: 49,
          codConvenienceFee: 49,
          grandTotal: 3948,
        },
      },
      {
        id: "GM-ORD-20260901-0844",
        createdAt: "2026-09-01T14:30:00Z",
        orderStatus: "DELIVERED",
        paymentStatus: "SUCCESS",
        paymentMethod: "Cashfree Online UPI",
        isExpress30Min: true,
        items: [
          {
            id: "prod-elec-001",
            name: "Polycab 1.5 sq mm FR Flame Retardant Copper House Wire (90m Red)",
            unit: "Coil (90m)",
            price: 1840,
            quantity: 2,
            sku: "POL-FR-15-RED",
          },
        ],
        shippingAddress: {
          fullName: "Aditya Rathore",
          phone: "9829012345",
          line1: "Commercial Wing 18, Rose Valley Infrastructure",
          locality: "Pimple Saudagar",
          city: "Pimpri-Chinchwad",
          pincode: "411061",
        },
        totals: {
          itemSubtotal: 3680,
          deliveryFee: 0,
          packagingFee: 29,
          codConvenienceFee: 0,
          grandTotal: 3709,
        },
      },
    ];
  },

  async updateOrderStatus(orderId, newStatus) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const orders = await this.getOrders();
    const updated = orders.map((o) =>
      o.id === orderId ? { ...o, orderStatus: newStatus } : o,
    );
    localStorage.setItem(VENDOR_ORDERS_KEY, JSON.stringify(updated));
    return updated;
  },

  // 4. Commercial RFQs & Quotations
  async getRfqs() {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const stored = localStorage.getItem(VENDOR_RFQS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Error parsing vendor RFQs", e);
      }
    }
    return [
      {
        id: "RFQ-PN-2026-089",
        projectName: "Balewadi Commercial Plaza Foundation",
        productName: "Tata Tiscon 550D High Ductility TMT Rebar (16mm)",
        quantity: 50,
        unit: "Piece",
        status: "QUOTATION_SUBMITTED",
        quotedRate: 1420,
        totalEstimate: 71000,
        gstBreakdown: "18% ITC Eligible (₹12,780)",
        siteLocation: "Balewadi High Street, Pune",
        notes:
          "Mill test certificates and 40-ton trailer direct unloading requested.",
        createdAt: "2026-09-02",
      },
      {
        id: "RFQ-PN-2026-094",
        projectName: "Hinjawadi Tech Park Phase 3 Boundary Masonry",
        productName: "Siporex AAC Lightweight Blocks (600x200x150mm)",
        quantity: 800,
        unit: "Piece",
        status: "PENDING_BID",
        quotedRate: null,
        totalEstimate: null,
        siteLocation: "Hinjawadi Phase 3, PCMC",
        notes: "Requires 2-day staggered delivery schedule.",
        createdAt: "2026-09-09",
      },
    ];
  },

  async submitRfqQuote(rfqId, { quotedRate, notes }) {
    await new Promise((resolve) => setTimeout(resolve, 120));
    const rfqs = await this.getRfqs();
    const updated = rfqs.map((r) => {
      if (r.id === rfqId) {
        const rate = Number(quotedRate);
        const subtotal = rate * r.quantity;
        return {
          ...r,
          status: "QUOTATION_SUBMITTED",
          quotedRate: rate,
          totalEstimate: subtotal,
          vendorNotes: notes,
        };
      }
      return r;
    });
    localStorage.setItem(VENDOR_RFQS_KEY, JSON.stringify(updated));
    return updated;
  },

  // 5. Settlements & Financials
  async getFinancialOverview() {
    await new Promise((resolve) => setTimeout(resolve, 80));
    return {
      netEarnings: 148560,
      pendingPayout: 18450,
      settledPayout: 130110,
      totalOrdersFulfilled: 42,
      activeRfqsWon: 5,
      recentSettlements: [
        {
          id: "SET-PN-20260901",
          amount: 34500,
          status: "PROCESSED",
          date: "2026-09-01",
          utr: "HDFCR5202609010091",
        },
        {
          id: "SET-PN-20260815",
          amount: 48200,
          status: "PROCESSED",
          date: "2026-08-15",
          utr: "HDFCR5202608150044",
        },
        {
          id: "SET-PN-20260801",
          amount: 47410,
          status: "PROCESSED",
          date: "2026-08-01",
          utr: "HDFCR5202608010012",
        },
      ],
    };
  },
};
