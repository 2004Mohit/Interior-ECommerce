import { supabase } from "../lib/supabaseClient";

const PUBLISHED_STATUS = "PUBLISHED";

const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_MIN_PRICE = 0;
const DEFAULT_MAX_PRICE = 1000000;

/*
 * =============================================================================
 * BASIC HELPERS
 * =============================================================================
 */

const cleanText = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

const normalizeText = (value) => {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const normalizeFilterValues = (value) => {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => String(item).split(","))
      .map(normalizeText)
      .filter(Boolean);
  }

  if (value === null || value === undefined) {
    return [];
  }

  return String(value).split(",").map(normalizeText).filter(Boolean);
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

/*
 * =============================================================================
 * RELATION HELPERS
 * =============================================================================
 */

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

/*
 * =============================================================================
 * IMAGE / INVENTORY HELPERS
 * =============================================================================
 */

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

const getAvailableStock = (row) => {
  const inventory = getInventoryRecord(row);

  if (!inventory) {
    return 0;
  }

  const onHand = Math.max(0, toNumber(inventory.on_hand_stock, 0));

  const reserved = Math.max(0, toNumber(inventory.reserved_stock, 0));

  return Math.max(0, onHand - reserved);
};

const getOnHandStock = (row) => {
  const inventory = getInventoryRecord(row);

  if (!inventory) {
    return 0;
  }

  return Math.max(0, toNumber(inventory.on_hand_stock, 0));
};

const getReservedStock = (row) => {
  const inventory = getInventoryRecord(row);

  if (!inventory) {
    return 0;
  }

  return Math.max(0, toNumber(inventory.reserved_stock, 0));
};

const getLowStockThreshold = (row) => {
  const inventory = getInventoryRecord(row);

  if (!inventory) {
    return 0;
  }

  return Math.max(0, toNumber(inventory.low_stock_threshold, 0));
};

const isInStock = (row) => {
  return getAvailableStock(row) > 0;
};

const isLowStock = (row) => {
  const availableStock = getAvailableStock(row);

  const threshold = getLowStockThreshold(row);

  return availableStock > 0 && threshold > 0 && availableStock <= threshold;
};

const isOutOfStock = (row) => {
  return getAvailableStock(row) <= 0;
};

/*
 * =============================================================================
 * DYNAMIC ATTRIBUTES
 * =============================================================================
 */

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

/*
 * =============================================================================
 * REVIEW STATS
 * =============================================================================
 */

const getReviewStats = async (productIds = []) => {
  const ids = uniqueValues(productIds);

  if (!ids.length) {
    return {};
  }

  try {
    const { data, error } = await supabase
      .from("product_reviews")
      .select(
        `
          product_id,
          rating
        `,
      )
      .in("product_id", ids)
      .eq("moderation_status", "PUBLISHED");

    if (error) {
      console.warn(
        "Unable to load product reviews. Catalogue will continue without review stats:",
        error,
      );

      return {};
    }

    const stats = {};

    (data || []).forEach((review) => {
      const productId = review?.product_id;

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

      const rating = toNumber(review.rating, 0);

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
  } catch (error) {
    console.warn(
      "Product review loading failed. Catalogue will continue without review stats:",
      error,
    );

    return {};
  }
};

/*
 * =============================================================================
 * SEARCH
 * =============================================================================
 *
 * Customer search is intentionally performed after loading the published
 * catalogue rows.
 *
 * This supports:
 *
 *   cem
 *   ceme
 *   cement
 *   ultra
 *   ultratech
 *   ultratech ppc
 *   ppc cement
 *   steel
 *   tmt
 *
 * Search is:
 *
 * - case insensitive
 * - punctuation tolerant
 * - whitespace tolerant
 * - partial-word matching
 * - multi-term matching
 *
 * A query containing multiple terms requires every term to occur somewhere
 * in the searchable product information.
 */

const buildSearchText = (row) => {
  const category = getCategoryRecord(row);

  const vendor = getVendorRecord(row);

  const dynamicAttributes = normalizeDynamicAttributes(row?.dynamic_attributes);

  const dynamicText = Object.entries(dynamicAttributes)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key} ${value.join(" ")}`;
      }

      if (value && typeof value === "object") {
        return `${key} ${JSON.stringify(value)}`;
      }

      return `${key} ${value}`;
    })
    .join(" ");

  const featuresText = toArray(row?.features)
    .map((feature) => {
      if (feature && typeof feature === "object") {
        return JSON.stringify(feature);
      }

      return String(feature || "");
    })
    .join(" ");

  return [
    row?.name,
    row?.brand,
    row?.sku,
    row?.description,
    row?.category_slug,
    row?.unit,
    featuresText,
    dynamicText,

    category?.name,
    category?.descriptor,
    category?.slug,

    vendor?.business_name,
    vendor?.trade_name,
    vendor?.contact_person,
    vendor?.city,
    vendor?.state,
    vendor?.locality,
    vendor?.pincode,
  ]
    .filter(Boolean)
    .join(" ");
};

const matchesSearch = (row, search) => {
  const query = normalizeText(search);

  if (!query) {
    return true;
  }

  const searchableText = normalizeText(buildSearchText(row));

  const terms = query.split(" ").filter(Boolean);

  /*
   * Every search term must exist somewhere in the product's searchable text.
   *
   * Example:
   *
   * "ultra ppc"
   *
   * matches:
   *
   * "UltraTech PPC Cement"
   */

  return terms.every((term) => searchableText.includes(term));
};

/*
 * =============================================================================
 * FILTER MATCHING
 * =============================================================================
 */

const matchesCategory = (row, categorySlug) => {
  const normalizedCategory = normalizeText(categorySlug);

  if (!normalizedCategory || normalizedCategory === "all") {
    return true;
  }

  return normalizeText(row?.category_slug) === normalizedCategory;
};

const matchesBrand = (row, brand) => {
  const selectedBrands = normalizeFilterValues(brand).filter(
    (value) => value !== "all",
  );

  if (!selectedBrands.length) {
    return true;
  }

  const productBrand = normalizeText(row?.brand);

  return selectedBrands.some(
    (selectedBrand) =>
      productBrand === selectedBrand || productBrand.includes(selectedBrand),
  );
};

const matchesUnit = (row, unit) => {
  const selectedUnits = normalizeFilterValues(unit).filter(
    (value) => value !== "all",
  );

  if (!selectedUnits.length) {
    return true;
  }

  const productUnit = normalizeText(row?.unit);

  return selectedUnits.some(
    (selectedUnit) =>
      productUnit === selectedUnit || productUnit.includes(selectedUnit),
  );
};

const matchesGrade = (row, grade) => {
  const selectedGrades = normalizeFilterValues(grade).filter(
    (value) => value !== "all",
  );

  if (!selectedGrades.length) {
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
    .map(normalizeText)
    .filter(Boolean);

  return selectedGrades.some((selected) =>
    possibleValues.some(
      (possible) =>
        possible === selected ||
        possible.includes(selected) ||
        selected.includes(possible),
    ),
  );
};

const matchesPrice = (row, minPrice, maxPrice) => {
  const price = toNumber(row?.price, 0);

  const minimum = toNullableNumber(minPrice);

  const maximum = toNullableNumber(maxPrice);

  if (minimum !== null && price < minimum) {
    return false;
  }

  if (maximum !== null && price > maximum) {
    return false;
  }

  return true;
};

const matchesPincode = (row, pincode) => {
  const requestedPincode = cleanText(pincode);

  if (!requestedPincode) {
    return true;
  }

  const vendor = getVendorRecord(row);

  const serviceablePincodes = toArray(vendor?.serviceable_pincodes)
    .map(cleanText)
    .filter(Boolean);

  /*
   * If vendor has no explicit serviceable-pincode list, do not hide the
   * product. The pincode filter only restricts vendors that actually define
   * serviceable pincodes.
   */

  if (!serviceablePincodes.length) {
    return true;
  }

  return serviceablePincodes.includes(requestedPincode);
};

const matchesExpress = (row, expressOnly) => {
  if (!expressOnly) {
    return true;
  }

  const productExpress = Boolean(row?.is_express_30min_available);

  const vendor = getVendorRecord(row);

  const vendorExpress = Boolean(vendor?.is_express_30min_enabled);

  return productExpress && vendorExpress;
};

/*
 * =============================================================================
 * PRODUCT MAPPING
 * =============================================================================
 */

const mapProductRow = (row, reviewStats = {}) => {
  if (!row) {
    return null;
  }

  const vendor = getVendorRecord(row);

  const category = getCategoryRecord(row);

  const inventory = getInventoryRecord(row);

  const images = getImageUrls(row);

  const availableStock = getAvailableStock(row);

  const onHandStock = getOnHandStock(row);

  const reservedStock = getReservedStock(row);

  const lowStockThreshold = getLowStockThreshold(row);

  const dynamicAttributes = normalizeDynamicAttributes(row.dynamic_attributes);

  const review = reviewStats[row.id] || {
    total: 0,
    average: 0,
  };

  const price = toNumber(row.price, 0);

  const minimumOrderQuantity = Math.max(1, Math.floor(toNumber(row.moq, 1)));

  const product = {
    id: row.id,

    name: row.name || "",

    slug: row.slug || "",

    sku: row.sku || "",

    brand: row.brand || "",

    description: row.description || "",

    categorySlug: row.category_slug || "",

    category: row.category_slug || "",

    categoryName: category?.name || "",

    categoryDescriptor: category?.descriptor || "",

    unit: row.unit || "",

    price,

    moq: minimumOrderQuantity,

    minimumOrderQuantity,

    minOrderQuantity: minimumOrderQuantity,

    availableQuantity: availableStock,

    availableStock,

    stock: availableStock,

    onHandStock,

    reservedStock,

    lowStockThreshold,

    isInStock: availableStock > 0,

    isLowStock: isLowStock(row),

    isOutOfStock: availableStock <= 0,

    stockStatus:
      availableStock <= 0
        ? "OUT_OF_STOCK"
        : isLowStock(row)
          ? "LOW_STOCK"
          : "IN_STOCK",

    images,

    imageUrls: images,

    image: getPrimaryImage(row),

    primaryImage: getPrimaryImage(row),

    coverImageUrl: row.cover_image_url || getPrimaryImage(row),

    features: toArray(row.features),

    dynamicAttributes,

    isExpress30MinAvailable: Boolean(row.is_express_30min_available),

    express30MinAvailable: Boolean(row.is_express_30min_available),

    vendor: vendor
      ? {
          id: vendor.id || row.vendor_id || null,

          businessName: vendor.business_name || "",

          tradeName: vendor.trade_name || "",

          contactPerson: vendor.contact_person || "",

          designation: vendor.designation || "",

          city: vendor.city || "",

          state: vendor.state || "",

          locality: vendor.locality || "",

          pincode: vendor.pincode || "",

          serviceablePincodes: toArray(vendor.serviceable_pincodes),

          isExpress30MinEnabled: Boolean(vendor.is_express_30min_enabled),
        }
      : null,

    vendorId: row.vendor_id || vendor?.id || null,

    vendorName: vendor?.business_name || vendor?.trade_name || "",

    rating: review.average || 0,

    averageRating: review.average || 0,

    reviewCount: review.total || 0,

    reviewsCount: review.total || 0,

    createdAt: row.created_at || null,

    updatedAt: row.updated_at || null,

    status: row.status || "",

    isPublished: row.status === PUBLISHED_STATUS,
  };

  return product;
};

/*
 * =============================================================================
 * SORTING
 * =============================================================================
 */

const sortProducts = (products, sort = "relevance", search = "") => {
  const normalizedSort = normalizeText(sort || "relevance");

  const result = [...products];

  if (
    normalizedSort === "price low to high" ||
    normalizedSort === "price asc"
  ) {
    return result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  }

  if (
    normalizedSort === "price high to low" ||
    normalizedSort === "price desc"
  ) {
    return result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  }

  if (
    normalizedSort === "rating" ||
    normalizedSort === "rating high to low" ||
    normalizedSort === "top rated"
  ) {
    return result.sort(
      (a, b) =>
        Number(b.rating || 0) - Number(a.rating || 0) ||
        Number(b.reviewCount || 0) - Number(a.reviewCount || 0),
    );
  }

  if (
    normalizedSort === "newest" ||
    normalizedSort === "latest" ||
    normalizedSort === "new"
  ) {
    return result.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;

      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      return dateB - dateA;
    });
  }

  /*
   * Default = relevance.
   *
   * Search relevance gives preference to:
   *
   * 1. Exact product name
   * 2. Product-name starts-with match
   * 3. Product-name contains the query
   * 4. Brand match
   * 5. Category match
   * 6. SKU match
   * 7. In-stock products
   * 8. Express products
   * 9. Rating
   */

  const query = normalizeText(search);

  if (!query) {
    return result.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;

      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      return dateB - dateA;
    });
  }

  const terms = query.split(" ").filter(Boolean);

  const scoreProduct = (product) => {
    const name = normalizeText(product.name);

    const brand = normalizeText(product.brand);

    const category = normalizeText(
      `${product.categorySlug} ${product.categoryName}`,
    );

    const sku = normalizeText(product.sku);

    const description = normalizeText(product.description);

    let score = 0;

    if (name === query) {
      score += 1000;
    }

    if (name.startsWith(query)) {
      score += 500;
    }

    if (name.includes(query)) {
      score += 300;
    }

    terms.forEach((term) => {
      if (name.includes(term)) {
        score += 100;
      }

      if (brand.includes(term)) {
        score += 50;
      }

      if (category.includes(term)) {
        score += 30;
      }

      if (sku.includes(term)) {
        score += 25;
      }

      if (description.includes(term)) {
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
      score += Number(product.rating);
    }

    return score;
  };

  return result.sort((a, b) => {
    const scoreDifference = scoreProduct(b) - scoreProduct(a);

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;

    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

    return dateB - dateA;
  });
};

/*
 * =============================================================================
 * SUPABASE SELECT
 * =============================================================================
 */

const PRODUCT_SELECT = `
  *,
  product_categories:category_slug!inner (
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

/*
 * =============================================================================
 * CATALOGUE REPOSITORY
 * =============================================================================
 */

export const catalogRepository = {
  /*
   * ---------------------------------------------------------------------------
   * GET CATEGORIES
   * ---------------------------------------------------------------------------
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

  /*
   * ---------------------------------------------------------------------------
   * GET CATEGORY BY SLUG
   * ---------------------------------------------------------------------------
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

  /*
   * ---------------------------------------------------------------------------
   * GET PRODUCT BY SLUG
   * ---------------------------------------------------------------------------
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
      .eq("product_categories.is_active", true)
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

  /*
   * ---------------------------------------------------------------------------
   * QUERY CATALOGUE
   * ---------------------------------------------------------------------------
   *
   * This is the main customer catalogue function.
   *
   * IMPORTANT:
   *
   * There is intentionally ONE Supabase query here.
   *
   * The previous implementation built one filtered query and then created
   * another query, which could cause the actual executed query to lose the
   * earlier filters.
   *
   * We now:
   *
   * 1. Fetch only PUBLISHED products.
   * 2. Fetch only products belonging to ACTIVE categories.
   * 3. Apply customer search and filters consistently.
   * 4. Map products.
   * 5. Sort.
   * 6. Paginate.
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
    const rawSelectedCategory = categorySlug || category;

    const selectedCategory = normalizeText(rawSelectedCategory);

    const normalizedSearch = cleanText(search).replace(/\s+/g, " ").trim();

    const safeLimit = Math.max(1, Number(limit) || DEFAULT_PAGE_SIZE);

    const safeOffset = Math.max(0, Number(offset) || 0);

    /*
     * Load the current published catalogue.
     *
     * product_categories uses an inner relation so inactive categories are
     * automatically excluded.
     */

    const { data, error } = await supabase
      .from("vendor_products")
      .select(PRODUCT_SELECT)
      .eq("status", PUBLISHED_STATUS)
      .eq("product_categories.is_active", true)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw new Error(`Unable to load product catalogue: ${error.message}`);
    }

    let rows = Array.isArray(data) ? data : [];

    /*
     * CATEGORY
     */

    if (selectedCategory && selectedCategory !== "all") {
      rows = rows.filter((row) => matchesCategory(row, selectedCategory));
    }

    /*
     * SEARCH
     */

    if (normalizedSearch) {
      rows = rows.filter((row) => matchesSearch(row, normalizedSearch));
    }

    /*
     * BRAND
     */

    rows = rows.filter((row) => matchesBrand(row, brand));

    /*
     * UNIT
     */

    rows = rows.filter((row) => matchesUnit(row, unit));

    /*
     * GRADE
     */

    rows = rows.filter((row) => matchesGrade(row, grade));

    /*
     * PRICE
     */

    rows = rows.filter((row) => matchesPrice(row, minPrice, maxPrice));

    /*
     * PINCODE
     */

    rows = rows.filter((row) => matchesPincode(row, pincode));

    /*
     * EXPRESS / 30 MINUTE
     */

    rows = rows.filter((row) => matchesExpress(row, Boolean(expressOnly)));

    /*
     * STOCK
     */

    if (Boolean(inStockOnly)) {
      rows = rows.filter((row) => isInStock(row));
    }

    /*
     * REVIEW STATS
     */

    const reviewStats = await getReviewStats(rows.map((row) => row.id));

    /*
     * MAP DATABASE ROWS INTO CUSTOMER PRODUCT OBJECTS
     */

    let products = rows
      .map((row) => mapProductRow(row, reviewStats))
      .filter(Boolean);

    /*
     * SORT
     */

    products = sortProducts(products, sort, normalizedSearch);

    /*
     * TOTAL BEFORE PAGINATION
     */

    const totalFiltered = products.length;

    /*
     * PAGINATION
     */

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

  /*
   * ---------------------------------------------------------------------------
   * SEARCH PRODUCTS
   * ---------------------------------------------------------------------------
   */

  async searchProducts(search, options = {}) {
    return this.queryCatalog({
      ...options,

      search: search || "",
    });
  },

  /*
   * ---------------------------------------------------------------------------
   * PRODUCTS BY CATEGORY
   * ---------------------------------------------------------------------------
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

  /*
   * ---------------------------------------------------------------------------
   * EXPRESS PRODUCTS
   * ---------------------------------------------------------------------------
   */

  async getExpressProducts(options = {}) {
    return this.queryCatalog({
      ...options,

      expressOnly: true,
    });
  },

  /*
   * ---------------------------------------------------------------------------
   * IN-STOCK PRODUCTS
   * ---------------------------------------------------------------------------
   */

  async getInStockProducts(options = {}) {
    return this.queryCatalog({
      ...options,

      inStockOnly: true,
    });
  },

  /*
   * ---------------------------------------------------------------------------
   * FEATURED PRODUCTS
   * ---------------------------------------------------------------------------
   */

  async getFeaturedProducts(limit = 12) {
    const requestedLimit = Math.max(1, Number(limit) || 12);

    const result = await this.queryCatalog({
      sort: "newest",

      limit: Math.max(requestedLimit, 50),

      offset: 0,
    });

    const products = result.products || [];

    const inStock = products.filter((product) => product.isInStock);

    const outOfStock = products.filter((product) => !product.isInStock);

    return [...inStock, ...outOfStock].slice(0, requestedLimit);
  },

  /*
   * ---------------------------------------------------------------------------
   * FILTER FACETS
   * ---------------------------------------------------------------------------
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
          product_categories:category_slug!inner (
            slug,
            is_active
          ),
          vendor_inventory (
            product_id,
            vendor_id,
            on_hand_stock,
            reserved_stock
          )
        `,
      )
      .eq("status", PUBLISHED_STATUS)
      .eq("product_categories.is_active", true);

    if (error) {
      throw new Error(`Unable to load product filters: ${error.message}`);
    }

    const rows = data || [];

    /*
     * BRANDS
     */

    const brands = uniqueValues(
      rows.map((row) => cleanText(row.brand)).filter(Boolean),
    ).sort((a, b) => a.localeCompare(b));

    /*
     * UNITS
     */

    const units = uniqueValues(
      rows.map((row) => cleanText(row.unit)).filter(Boolean),
    ).sort((a, b) => a.localeCompare(b));

    /*
     * CATEGORIES
     */

    const categories = uniqueValues(
      rows.map((row) => cleanText(row.category_slug)).filter(Boolean),
    ).sort((a, b) => a.localeCompare(b));

    /*
     * GRADES
     */

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
        .forEach((value) => {
          const normalizedValue = cleanText(value);

          if (normalizedValue) {
            gradeSet.add(normalizedValue);
          }
        });
    });

    const grades = [...gradeSet].sort((a, b) => a.localeCompare(b));

    /*
     * PRICE RANGE
     */

    const prices = rows
      .map((row) => toNumber(row.price, 0))
      .filter((price) => price > 0);

    const minPrice = prices.length ? Math.min(...prices) : DEFAULT_MIN_PRICE;

    const maxPrice = prices.length ? Math.max(...prices) : DEFAULT_MAX_PRICE;

    /*
     * EXPRESS COUNT
     */

    const expressCount = rows.filter((row) =>
      Boolean(row.is_express_30min_available),
    ).length;

    /*
     * IN-STOCK COUNT
     */

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

  /*
   * ---------------------------------------------------------------------------
   * CHECK PUBLISHED STATUS
   * ---------------------------------------------------------------------------
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

/*
 * =============================================================================
 * EXPORTS
 * =============================================================================
 */

export {
  mapProductRow,
  getAvailableStock,
  isInStock,
  isOutOfStock,
  isLowStock,
};

export default catalogRepository;
