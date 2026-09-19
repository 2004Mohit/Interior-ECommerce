/**
 * GateMate Customer Catalogue Repository
 *
 * LIVE SUPABASE CATALOGUE
 *
 * Customer catalogue sources:
 *   - vendor_products
 *   - vendor_profiles
 *   - product_categories
 *   - vendor_inventory
 *   - customer_product_reviews
 *
 * Public catalogue rule:
 *   Only PUBLISHED products are visible.
 *
 * IMPORTANT:
 *   - No demoProducts.js
 *   - No categories.js
 *   - No mockData.js
 *   - No banners
 *   - No promotions
 *   - No localStorage catalogue
 */

import { supabase } from "../lib/supabaseClient";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const PUBLISHED_STATUS = "PUBLISHED";

const DEFAULT_PAGE_SIZE = 50;

const DEFAULT_MIN_PRICE = 0;

const DEFAULT_MAX_PRICE = 1000000;

/* -------------------------------------------------------------------------- */
/* Generic helpers                                                            */
/* -------------------------------------------------------------------------- */

const cleanText = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

const normalizeText = (value) => {
  return cleanText(value).toLowerCase();
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};

const toNullableNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
};

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === null || value === undefined) {
    return [];
  }

  return [value];
};

const uniqueValues = (values) => {
  return [...new Set(values.filter(Boolean))];
};

/* -------------------------------------------------------------------------- */
/* Database relation helpers                                                  */
/* -------------------------------------------------------------------------- */

const getVendorRecord = (row) => {
  if (!row) {
    return null;
  }

  if (Array.isArray(row.vendor_profiles)) {
    return row.vendor_profiles[0] || null;
  }

  return row.vendor_profiles || null;
};

const getCategoryRecord = (row) => {
  if (!row) {
    return null;
  }

  if (Array.isArray(row.product_categories)) {
    return row.product_categories[0] || null;
  }

  return row.product_categories || null;
};

const getInventoryRecord = (row) => {
  if (!row) {
    return null;
  }

  if (Array.isArray(row.vendor_inventory)) {
    return row.vendor_inventory[0] || null;
  }

  return row.vendor_inventory || null;
};

/* -------------------------------------------------------------------------- */
/* Image helpers                                                              */
/* -------------------------------------------------------------------------- */

const getImageUrls = (row) => {
  const imageUrls = toArray(row?.image_urls).filter(Boolean);

  const coverImage = cleanText(row?.cover_image_url);

  if (coverImage && !imageUrls.includes(coverImage)) {
    imageUrls.unshift(coverImage);
  }

  return uniqueValues(imageUrls);
};

const getPrimaryImage = (row) => {
  const images = getImageUrls(row);

  return images[0] || "";
};

/* -------------------------------------------------------------------------- */
/* Inventory                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Available stock:
 *
 * on_hand_stock - reserved_stock
 *
 * Negative availability is never exposed.
 */
const getAvailableStock = (row) => {
  const inventory = getInventoryRecord(row);

  if (!inventory) {
    return 0;
  }

  const onHand = toNumber(inventory.on_hand_stock, 0);

  const reserved = toNumber(inventory.reserved_stock, 0);

  return Math.max(0, onHand - reserved);
};

const isInStock = (row) => {
  return getAvailableStock(row) > 0;
};

/* -------------------------------------------------------------------------- */
/* Dynamic attributes                                                         */
/* -------------------------------------------------------------------------- */

const normalizeDynamicAttributes = (value) => {
  if (!value) {
    return {};
  }

  if (Array.isArray(value)) {
    return value.reduce((result, item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return result;
      }

      Object.entries(item).forEach(([key, val]) => {
        result[key] = val;
      });

      return result;
    }, {});
  }

  if (typeof value === "object") {
    return value;
  }

  return {};
};

/* -------------------------------------------------------------------------- */
/* Reviews                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Reviews are loaded separately because the current database schema
 * stores customer ratings in customer_product_reviews.
 *
 * Only PUBLISHED reviews are considered.
 */
const getReviewStats = async (productIds = []) => {
  const ids = uniqueValues(productIds);

  if (!ids.length) {
    return {};
  }

  const { data, error } = await supabase
    .from("customer_product_reviews")
    .select(
      `
        product_id,
        customer_product_rating
      `,
    )
    .in("product_id", ids)
    .eq("status", "PUBLISHED");

  if (error) {
    throw new Error(`Unable to load product reviews: ${error.message}`);
  }

  const stats = {};

  (data || []).forEach((review) => {
    const productId = review.product_id;

    if (!productId) {
      return;
    }

    if (!stats[productId]) {
      stats[productId] = {
        total: 0,
        sum: 0,
        average: 0,
      };
    }

    const rating = toNumber(review.customer_product_rating, 0);

    if (rating >= 1 && rating <= 5) {
      stats[productId].total += 1;

      stats[productId].sum += rating;
    }
  });

  Object.keys(stats).forEach((productId) => {
    const item = stats[productId];

    item.average =
      item.total > 0 ? Number((item.sum / item.total).toFixed(1)) : 0;
  });

  return stats;
};

/* -------------------------------------------------------------------------- */
/* Product search text                                                        */
/* -------------------------------------------------------------------------- */

const buildSearchText = (row) => {
  const category = getCategoryRecord(row);

  const vendor = getVendorRecord(row);

  const dynamicAttributes = normalizeDynamicAttributes(row?.dynamic_attributes);

  const dynamicText = Object.entries(dynamicAttributes)
    .map(([key, value]) => `${key} ${value}`)
    .join(" ");

  return [
    row?.name,
    row?.brand,
    row?.sku,
    row?.description,
    row?.category_slug,
    row?.unit,
    ...toArray(row?.features),
    dynamicText,

    category?.name,
    category?.descriptor,

    vendor?.business_name,
    vendor?.trade_name,
    vendor?.city,
    vendor?.locality,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

const matchesSearch = (row, search) => {
  const query = normalizeText(search);

  if (!query) {
    return true;
  }

  const searchableText = buildSearchText(row);

  const terms = query.split(/\s+/).filter(Boolean);

  return terms.every((term) => searchableText.includes(term));
};

/* -------------------------------------------------------------------------- */
/* Category filter                                                            */
/* -------------------------------------------------------------------------- */

const matchesCategory = (row, categorySlug) => {
  if (!categorySlug || categorySlug === "ALL") {
    return true;
  }

  return normalizeText(row?.category_slug) === normalizeText(categorySlug);
};

/* -------------------------------------------------------------------------- */
/* Brand filter                                                               */
/* -------------------------------------------------------------------------- */

const matchesBrand = (row, brand) => {
  if (!brand || brand === "ALL") {
    return true;
  }

  if (Array.isArray(brand)) {
    const selectedBrands = brand.map(normalizeText).filter(Boolean);

    if (!selectedBrands.length) {
      return true;
    }

    return selectedBrands.includes(normalizeText(row?.brand));
  }

  return normalizeText(row?.brand) === normalizeText(brand);
};

/* -------------------------------------------------------------------------- */
/* Unit filter                                                                */
/* -------------------------------------------------------------------------- */

const matchesUnit = (row, unit) => {
  if (!unit || unit === "ALL") {
    return true;
  }

  if (Array.isArray(unit)) {
    const selectedUnits = unit.map(normalizeText).filter(Boolean);

    if (!selectedUnits.length) {
      return true;
    }

    return selectedUnits.includes(normalizeText(row?.unit));
  }

  return normalizeText(row?.unit) === normalizeText(unit);
};

/* -------------------------------------------------------------------------- */
/* Grade filter                                                               */
/* -------------------------------------------------------------------------- */

const matchesGrade = (row, grade) => {
  if (!grade || grade === "ALL") {
    return true;
  }

  const attributes = normalizeDynamicAttributes(row?.dynamic_attributes);

  const possibleValues = [
    attributes.grade,
    attributes.Grade,
    attributes.grade_name,
    attributes.gradeName,
    attributes.strength,
    attributes.strength_grade,
    attributes.steel_grade,
    attributes.tmt_grade,
  ]
    .filter(Boolean)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map(normalizeText);

  if (Array.isArray(grade)) {
    const selectedGrades = grade.map(normalizeText).filter(Boolean);

    if (!selectedGrades.length) {
      return true;
    }

    return selectedGrades.some((selected) => possibleValues.includes(selected));
  }

  return possibleValues.includes(normalizeText(grade));
};

/* -------------------------------------------------------------------------- */
/* Price filter                                                               */
/* -------------------------------------------------------------------------- */

const matchesPrice = (row, minPrice, maxPrice) => {
  const price = toNumber(row?.price, 0);

  if (minPrice !== "" && minPrice !== null && minPrice !== undefined) {
    if (price < Number(minPrice)) {
      return false;
    }
  }

  if (maxPrice !== "" && maxPrice !== null && maxPrice !== undefined) {
    if (price > Number(maxPrice)) {
      return false;
    }
  }

  return true;
};

/* -------------------------------------------------------------------------- */
/* Pincode filter                                                             */
/* -------------------------------------------------------------------------- */

const matchesPincode = (row, pincode) => {
  const requestedPincode = cleanText(pincode);

  if (!requestedPincode) {
    return true;
  }

  const vendor = getVendorRecord(row);

  const serviceablePincodes = toArray(vendor?.serviceable_pincodes).map(
    cleanText,
  );

  /*
   * If vendor serviceability is not configured,
   * don't incorrectly hide the product.
   */
  if (!serviceablePincodes.length) {
    return true;
  }

  return serviceablePincodes.includes(requestedPincode);
};

/* -------------------------------------------------------------------------- */
/* Express delivery filter                                                    */
/* -------------------------------------------------------------------------- */

const matchesExpress = (row, expressOnly) => {
  if (!expressOnly) {
    return true;
  }

  const productExpress = Boolean(row?.is_express_30min_available);

  const vendor = getVendorRecord(row);

  const vendorExpress = Boolean(vendor?.is_express_30min_enabled);

  return productExpress && vendorExpress;
};

/* -------------------------------------------------------------------------- */
/* Product mapper                                                             */
/* -------------------------------------------------------------------------- */

const mapProductRow = (row, reviewStats = {}) => {
  if (!row) {
    return null;
  }

  const vendor = getVendorRecord(row);

  const category = getCategoryRecord(row);

  const inventory = getInventoryRecord(row);

  const images = getImageUrls(row);

  const availableStock = getAvailableStock(row);

  const dynamicAttributes = normalizeDynamicAttributes(row.dynamic_attributes);

  const review = reviewStats[row.id] || {
    total: 0,
    average: 0,
  };

  const price = toNumber(row.price, 0);

  const originalPrice = toNullableNumber(row.original_price);

  const isExpress = Boolean(row.is_express_30min_available);

  return {
    /* ---------------------------------------------------------------------- */
    /* Core identity                                                           */
    /* ---------------------------------------------------------------------- */

    id: row.id,

    slug: row.slug,

    /* ---------------------------------------------------------------------- */
    /* Product information                                                     */
    /* ---------------------------------------------------------------------- */

    name: row.name || "",

    brand: row.brand || "",

    category: row.category_slug || "",

    categorySlug: row.category_slug || "",

    categoryName: category?.name || row.category_slug || "",

    unit: row.unit || "",

    sku: row.sku || "",

    description: row.description || "",

    features: toArray(row.features),

    dynamicAttributes,

    /* ---------------------------------------------------------------------- */
    /* Pricing                                                                 */
    /* ---------------------------------------------------------------------- */

    price,

    originalPrice,

    /* ---------------------------------------------------------------------- */
    /* Minimum order quantity                                                  */
    /* ---------------------------------------------------------------------- */

    moq: Math.max(1, Math.floor(toNumber(row.moq, 1))),

    /* ---------------------------------------------------------------------- */
    /* Images                                                                  */
    /* ---------------------------------------------------------------------- */

    img: getPrimaryImage(row),

    image: getPrimaryImage(row),

    coverImageUrl: row.cover_image_url || getPrimaryImage(row),

    images,

    gallery: images,

    imageUrls: images,

    /* ---------------------------------------------------------------------- */
    /* Inventory                                                               */
    /* ---------------------------------------------------------------------- */

    stock: availableStock,

    availableStock,

    isInStock: availableStock > 0,

    inventory: inventory
      ? {
          productId: inventory.product_id || row.id,

          vendorId: inventory.vendor_id || row.vendor_id,

          onHandStock: toNumber(inventory.on_hand_stock, 0),

          reservedStock: toNumber(inventory.reserved_stock, 0),

          availableStock,

          lowStockThreshold: toNumber(inventory.low_stock_threshold, 0),

          updatedAt: inventory.updated_at || null,
        }
      : null,

    /* ---------------------------------------------------------------------- */
    /* Express delivery                                                       */
    /* ---------------------------------------------------------------------- */

    isExpress30MinAvailable: isExpress,

    express: isExpress,

    /* ---------------------------------------------------------------------- */
    /* Vendor                                                                  */
    /* ---------------------------------------------------------------------- */

    vendorId: row.vendor_id || null,

    vendor: vendor
      ? {
          id: vendor.id || row.vendor_id || null,

          businessName: vendor.business_name || "",

          tradeName: vendor.trade_name || "",

          contactPerson: vendor.contact_person || "",

          designation: vendor.designation || "",

          city: vendor.city || "",

          locality: vendor.locality || "",

          state: vendor.state || "",

          pincode: vendor.pincode || "",

          serviceablePincodes: toArray(vendor.serviceable_pincodes),
        }
      : null,

    vendorName: vendor?.business_name || vendor?.trade_name || "",

    /* ---------------------------------------------------------------------- */
    /* Ratings                                                                 */
    /* ---------------------------------------------------------------------- */

    rating: review.average || null,

    reviews: review.total,

    reviewCount: review.total,

    /* ---------------------------------------------------------------------- */
    /* Serviceability                                                          */
    /* ---------------------------------------------------------------------- */

    serviceablePincodes: toArray(vendor?.serviceable_pincodes),

    /* ---------------------------------------------------------------------- */
    /* Publication                                                             */
    /* ---------------------------------------------------------------------- */

    status: row.status,

    isPublished: row.status === PUBLISHED_STATUS,

    /* ---------------------------------------------------------------------- */
    /* Dates                                                                   */
    /* ---------------------------------------------------------------------- */

    createdAt: row.created_at || null,

    updatedAt: row.updated_at || null,

    publishedAt: row.published_at || null,

    /* ---------------------------------------------------------------------- */
    /* Existing frontend compatibility                                         */
    /* ---------------------------------------------------------------------- */

    tag: isExpress ? "30 Min Delivery" : "",

    /* ---------------------------------------------------------------------- */
    /* Original database row                                                   */
    /* ---------------------------------------------------------------------- */

    originalRow: row,
  };
};

/* -------------------------------------------------------------------------- */
/* Supabase select                                                             */
/* -------------------------------------------------------------------------- */

/**
 * IMPORTANT:
 *
 * product_categories actual columns from project SQL:
 *
 *   id
 *   slug
 *   name
 *   descriptor
 *   image_url
 *   display_order
 *   is_active
 *
 * vendor_profiles actual columns used here:
 *
 *   id
 *   business_name
 *   trade_name
 *   contact_person
 *   designation
 *   city
 *   state
 *   locality
 *   pincode
 *   serviceable_pincodes
 *   is_express_30min_enabled
 *
 * vendor_inventory actual columns:
 *
 *   product_id
 *   vendor_id
 *   on_hand_stock
 *   reserved_stock
 *   low_stock_threshold
 *   updated_at
 */

const PRODUCT_SELECT = `
  *,
  product_categories:category_slug (
    id,
    slug,
    name,
    descriptor,
    image_url,
    display_order,
    is_active
  ),
  vendor_profiles:vendor_id (
    id,
    business_name,
    trade_name,
    contact_person,
    designation,
    city,
    state,
    locality,
    pincode,
    serviceable_pincodes,
    is_express_30min_enabled
  ),
  vendor_inventory (
    product_id,
    vendor_id,
    on_hand_stock,
    reserved_stock,
    low_stock_threshold,
    updated_at
  )
`;

/* -------------------------------------------------------------------------- */
/* Sorting                                                                    */
/* -------------------------------------------------------------------------- */

const sortProducts = (products, sort = "relevance", search = "") => {
  const sorted = [...products];

  switch (sort) {
    case "price-asc":
    case "priceAsc":
    case "price_low_high":
      return sorted.sort((a, b) => toNumber(a.price) - toNumber(b.price));

    case "price-desc":
    case "priceDesc":
    case "price_high_low":
      return sorted.sort((a, b) => toNumber(b.price) - toNumber(a.price));

    case "rating":
    case "rating-desc":
      return sorted.sort((a, b) => toNumber(b.rating) - toNumber(a.rating));

    case "newest":
    case "new":
      return sorted.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );

    case "relevance":
    default: {
      const query = normalizeText(search);

      if (!query) {
        return sorted.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        );
      }

      const terms = query.split(/\s+/).filter(Boolean);

      const scoreProduct = (product) => {
        let score = 0;

        const name = normalizeText(product.name);

        const brand = normalizeText(product.brand);

        const category = normalizeText(
          product.categoryName || product.categorySlug,
        );

        const sku = normalizeText(product.sku);

        terms.forEach((term) => {
          if (name === term) {
            score += 100;
          } else if (name.includes(term)) {
            score += 50;
          }

          if (brand.includes(term)) {
            score += 20;
          }

          if (category.includes(term)) {
            score += 15;
          }

          if (sku.includes(term)) {
            score += 10;
          }
        });

        if (product.isInStock) {
          score += 5;
        }

        if (product.isExpress30MinAvailable) {
          score += 2;
        }

        if (product.rating) {
          score += product.rating;
        }

        return score;
      };

      return sorted.sort((a, b) => scoreProduct(b) - scoreProduct(a));
    }
  }
};

/* -------------------------------------------------------------------------- */
/* Repository                                                                 */
/* -------------------------------------------------------------------------- */

export const catalogRepository = {
  /**
   * ------------------------------------------------------------------------
   * Get active categories
   * ------------------------------------------------------------------------
   */
  async getCategories() {
    const { data, error } = await supabase
      .from("product_categories")
      .select(
        `
          id,
          slug,
          name,
          descriptor,
          image_url,
          display_order,
          is_active
        `,
      )
      .eq("is_active", true)
      .order("display_order", {
        ascending: true,
      });

    if (error) {
      throw new Error(`Unable to load product categories: ${error.message}`);
    }

    return (data || []).map((category) => ({
      id: category.id,

      slug: category.slug,

      name: category.name,

      descriptor: category.descriptor || "",

      image: category.image_url || "",

      imageUrl: category.image_url || "",

      displayOrder: category.display_order ?? 0,

      isActive: category.is_active !== false,
    }));
  },

  /**
   * ------------------------------------------------------------------------
   * Get category by slug
   * ------------------------------------------------------------------------
   */
  async getCategoryBySlug(slug) {
    if (!slug) {
      return null;
    }

    const { data, error } = await supabase
      .from("product_categories")
      .select(
        `
          id,
          slug,
          name,
          descriptor,
          image_url,
          display_order,
          is_active
        `,
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to load product category: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,

      slug: data.slug,

      name: data.name,

      descriptor: data.descriptor || "",

      image: data.image_url || "",

      imageUrl: data.image_url || "",

      displayOrder: data.display_order ?? 0,

      isActive: data.is_active !== false,
    };
  },

  /**
   * ------------------------------------------------------------------------
   * Get product by slug
   * ------------------------------------------------------------------------
   */
  async getProductBySlug(slug) {
    if (!slug) {
      return null;
    }

    const { data, error } = await supabase
      .from("vendor_products")
      .select(PRODUCT_SELECT)
      .eq("slug", slug)
      .eq("status", PUBLISHED_STATUS)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to load product: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    const reviewStats = await getReviewStats([data.id]);

    return mapProductRow(data, reviewStats);
  },

  /**
   * ------------------------------------------------------------------------
   * Query customer catalogue
   * ------------------------------------------------------------------------
   */
  async queryCatalog({
    search = "",
    category = "",
    categorySlug = "",
    brand = "",
    unit = "",
    grade = "",
    inStockOnly = false,
    minPrice = "",
    maxPrice = "",
    expressOnly = false,
    pincode = "",
    sort = "relevance",
    limit = DEFAULT_PAGE_SIZE,
    offset = 0,
  } = {}) {
    let query = supabase
      .from("vendor_products")
      .select(PRODUCT_SELECT, {
        count: "exact",
      })
      .eq("status", PUBLISHED_STATUS)
      .order("created_at", {
        ascending: false,
      });

    const selectedCategory = categorySlug || category;

    /*
     * Database-level filters
     */

    if (selectedCategory && selectedCategory !== "ALL") {
      query = query.eq("category_slug", selectedCategory);
    }

    if (brand && brand !== "ALL" && !Array.isArray(brand)) {
      query = query.eq("brand", brand);
    }

    if (unit && unit !== "ALL" && !Array.isArray(unit)) {
      query = query.eq("unit", unit);
    }

    if (minPrice !== "" && minPrice !== null && minPrice !== undefined) {
      query = query.gte("price", Number(minPrice));
    }

    if (maxPrice !== "" && maxPrice !== null && maxPrice !== undefined) {
      query = query.lte("price", Number(maxPrice));
    }

    /*
     * Do not paginate at Supabase level yet.
     *
     * Some filters are evaluated after the joined inventory,
     * vendor serviceability and dynamic attributes are loaded.
     *
     * Pagination is therefore applied after filtering.
     */

    const { data, error } = await query;

    if (error) {
      throw new Error(`Unable to load product catalogue: ${error.message}`);
    }

    let rows = Array.isArray(data) ? data : [];

    /* ---------------------------------------------------------------------- */
    /* Search                                                                  */
    /* ---------------------------------------------------------------------- */

    rows = rows.filter((row) => matchesSearch(row, search));

    /* ---------------------------------------------------------------------- */
    /* Category                                                                */
    /* ---------------------------------------------------------------------- */

    rows = rows.filter((row) => matchesCategory(row, selectedCategory));

    /* ---------------------------------------------------------------------- */
    /* Brand                                                                   */
    /* ---------------------------------------------------------------------- */

    rows = rows.filter((row) => matchesBrand(row, brand));

    /* ---------------------------------------------------------------------- */
    /* Unit                                                                    */
    /* ---------------------------------------------------------------------- */

    rows = rows.filter((row) => matchesUnit(row, unit));

    /* ---------------------------------------------------------------------- */
    /* Grade                                                                   */
    /* ---------------------------------------------------------------------- */

    rows = rows.filter((row) => matchesGrade(row, grade));

    /* ---------------------------------------------------------------------- */
    /* Price                                                                   */
    /* ---------------------------------------------------------------------- */

    rows = rows.filter((row) => matchesPrice(row, minPrice, maxPrice));

    /* ---------------------------------------------------------------------- */
    /* Pincode                                                                 */
    /* ---------------------------------------------------------------------- */

    rows = rows.filter((row) => matchesPincode(row, pincode));

    /* ---------------------------------------------------------------------- */
    /* Express                                                                 */
    /* ---------------------------------------------------------------------- */

    rows = rows.filter((row) => matchesExpress(row, expressOnly));

    /* ---------------------------------------------------------------------- */
    /* Inventory                                                               */
    /* ---------------------------------------------------------------------- */

    if (inStockOnly) {
      rows = rows.filter((row) => isInStock(row));
    }

    /* ---------------------------------------------------------------------- */
    /* Reviews                                                                 */
    /* ---------------------------------------------------------------------- */

    const reviewStats = await getReviewStats(rows.map((row) => row.id));

    /* ---------------------------------------------------------------------- */
    /* Map                                                                     */
    /* ---------------------------------------------------------------------- */

    let products = rows
      .map((row) => mapProductRow(row, reviewStats))
      .filter(Boolean);

    /* ---------------------------------------------------------------------- */
    /* Sort                                                                    */
    /* ---------------------------------------------------------------------- */

    products = sortProducts(products, sort, search);

    /* ---------------------------------------------------------------------- */
    /* Pagination                                                              */
    /* ---------------------------------------------------------------------- */

    const totalFiltered = products.length;

    const safeOffset = Math.max(0, Number(offset) || 0);

    const safeLimit = Math.max(1, Number(limit) || DEFAULT_PAGE_SIZE);

    const paginatedProducts = products.slice(
      safeOffset,
      safeOffset + safeLimit,
    );

    return {
      products: paginatedProducts,

      items: paginatedProducts,

      totalCount: totalFiltered,

      total: totalFiltered,

      count: totalFiltered,

      offset: safeOffset,

      limit: safeLimit,

      hasMore: safeOffset + paginatedProducts.length < totalFiltered,
    };
  },

  /**
   * ------------------------------------------------------------------------
   * Search products
   * ------------------------------------------------------------------------
   */
  async searchProducts(search, options = {}) {
    return this.queryCatalog({
      ...options,

      search: search || "",
    });
  },

  /**
   * ------------------------------------------------------------------------
   * Products by category
   * ------------------------------------------------------------------------
   */
  async getProductsByCategory(categorySlug, options = {}) {
    if (!categorySlug) {
      return {
        products: [],
        items: [],
        totalCount: 0,
        total: 0,
        count: 0,
        hasMore: false,
      };
    }

    return this.queryCatalog({
      ...options,

      categorySlug,
    });
  },

  /**
   * ------------------------------------------------------------------------
   * Express products
   * ------------------------------------------------------------------------
   */
  async getExpressProducts(options = {}) {
    return this.queryCatalog({
      ...options,

      expressOnly: true,
    });
  },

  /**
   * ------------------------------------------------------------------------
   * In-stock products
   * ------------------------------------------------------------------------
   */
  async getInStockProducts(options = {}) {
    return this.queryCatalog({
      ...options,

      inStockOnly: true,
    });
  },

  /**
   * ------------------------------------------------------------------------
   * Featured products
   * ------------------------------------------------------------------------
   *
   * There is no featured flag in the supplied schema.
   *
   * Therefore this uses published products ordered by
   * current catalogue relevance rather than inventing
   * a database column.
   */
  async getFeaturedProducts(limit = 12) {
    const result = await this.queryCatalog({
      sort: "newest",

      limit: Math.max(1, Number(limit) || 12),

      offset: 0,
    });

    const products = result.products || [];

    /*
     * Prefer products that are actually available.
     */
    const inStock = products.filter((product) => product.isInStock);

    const outOfStock = products.filter((product) => !product.isInStock);

    return [...inStock, ...outOfStock].slice(
      0,
      Math.max(1, Number(limit) || 12),
    );
  },

  /**
   * ------------------------------------------------------------------------
   * Filter facets
   * ------------------------------------------------------------------------
   */
  async getFilterFacets() {
    const { data, error } = await supabase
      .from("vendor_products")
      .select(
        `
          brand,
          unit,
          price,
          category_slug,
          dynamic_attributes,
          is_express_30min_available,
          vendor_inventory (
            product_id,
            vendor_id,
            on_hand_stock,
            reserved_stock
          )
        `,
      )
      .eq("status", PUBLISHED_STATUS);

    if (error) {
      throw new Error(`Unable to load product filters: ${error.message}`);
    }

    const rows = data || [];

    /* ---------------------------------------------------------------------- */
    /* Brands                                                                  */
    /* ---------------------------------------------------------------------- */

    const brands = uniqueValues(
      rows.map((row) => cleanText(row.brand)).filter(Boolean),
    ).sort((a, b) => a.localeCompare(b));

    /* ---------------------------------------------------------------------- */
    /* Units                                                                   */
    /* ---------------------------------------------------------------------- */

    const units = uniqueValues(
      rows.map((row) => cleanText(row.unit)).filter(Boolean),
    ).sort((a, b) => a.localeCompare(b));

    /* ---------------------------------------------------------------------- */
    /* Categories                                                              */
    /* ---------------------------------------------------------------------- */

    const categories = uniqueValues(
      rows.map((row) => cleanText(row.category_slug)).filter(Boolean),
    ).sort((a, b) => a.localeCompare(b));

    /* ---------------------------------------------------------------------- */
    /* Grades                                                                  */
    /* ---------------------------------------------------------------------- */

    const gradeSet = new Set();

    rows.forEach((row) => {
      const attributes = normalizeDynamicAttributes(row.dynamic_attributes);

      const values = [
        attributes.grade,
        attributes.Grade,
        attributes.grade_name,
        attributes.gradeName,
        attributes.strength,
        attributes.strength_grade,
        attributes.steel_grade,
        attributes.tmt_grade,
      ];

      values
        .filter(Boolean)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .forEach((value) => gradeSet.add(String(value)));
    });

    const grades = [...gradeSet].sort((a, b) => a.localeCompare(b));

    /* ---------------------------------------------------------------------- */
    /* Prices                                                                  */
    /* ---------------------------------------------------------------------- */

    const prices = rows
      .map((row) => toNumber(row.price, 0))
      .filter((price) => price > 0);

    const minPrice = prices.length ? Math.min(...prices) : DEFAULT_MIN_PRICE;

    const maxPrice = prices.length ? Math.max(...prices) : DEFAULT_MAX_PRICE;

    /* ---------------------------------------------------------------------- */
    /* Express count                                                           */
    /* ---------------------------------------------------------------------- */

    const expressCount = rows.filter((row) =>
      Boolean(row.is_express_30min_available),
    ).length;

    /* ---------------------------------------------------------------------- */
    /* In-stock count                                                          */
    /* ---------------------------------------------------------------------- */

    const inStockCount = rows.filter(
      (row) => getAvailableStock(row) > 0,
    ).length;

    return {
      brands,

      units,

      categories,

      grades,

      minPrice,

      maxPrice,

      expressCount,

      inStockCount,

      totalProducts: rows.length,
    };
  },

  /**
   * ------------------------------------------------------------------------
   * Verify product is publicly available
   * ------------------------------------------------------------------------
   */
  async isProductPublished(productId) {
    if (!productId) {
      return false;
    }

    const { data, error } = await supabase
      .from("vendor_products")
      .select("id,status")
      .eq("id", productId)
      .eq("status", PUBLISHED_STATUS)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to verify product status: ${error.message}`);
    }

    return Boolean(data);
  },
};

/* -------------------------------------------------------------------------- */
/* Named exports                                                              */
/* -------------------------------------------------------------------------- */

export { mapProductRow, getAvailableStock, isInStock };

export default catalogRepository;
