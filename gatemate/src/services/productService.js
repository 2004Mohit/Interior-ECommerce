import catalogRepository from "./catalogRepository";

/*
 * =============================================================================
 * PRODUCT SERVICE
 * =============================================================================
 *
 * Customer-facing product service.
 *
 * Responsibilities:
 *
 * - Normalize customer search/filter parameters
 * - Pass them to catalogRepository
 * - Keep the response shape consistent for the UI
 * - Avoid demo/mock catalogue data
 *
 * The actual catalogue/search/filter logic lives in catalogRepository.js.
 */

/*
 * =============================================================================
 * HELPERS
 * =============================================================================
 */

const cleanText = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

const normalizeSearch = (value) => {
  return cleanText(value).replace(/\s+/g, " ").trim();
};

const normalizeOption = (value) => {
  const normalized = cleanText(value);

  if (!normalized || normalized.toLowerCase() === "all") {
    return "";
  }

  return normalized;
};

const normalizeBoolean = (value) => {
  return value === true || String(value).toLowerCase() === "true";
};

const normalizeNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : undefined;
};

const normalizeLimit = (value, fallback = 50) => {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return fallback;
  }

  return Math.min(Math.floor(number), 200);
};

const normalizeOffset = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  return Math.floor(number);
};

/*
 * =============================================================================
 * EMPTY RESPONSE
 * =============================================================================
 */

const emptyCatalogueResponse = () => ({
  products: [],
  items: [],
  totalCount: 0,
  total: 0,
  count: 0,
  offset: 0,
  limit: 50,
  hasMore: false,
});

/*
 * =============================================================================
 * PRODUCT SERVICE
 * =============================================================================
 */

export const productService = {
  /*
   * ---------------------------------------------------------------------------
   * QUERY PRODUCTS
   * ---------------------------------------------------------------------------
   *
   * Main method used by Customer Search Results.
   *
   * Supported parameters:
   *
   * search
   * category
   * categorySlug
   * brand
   * unit
   * grade
   * inStockOnly
   * minPrice
   * maxPrice
   * sort
   * expressOnly
   * pincode
   * limit
   * offset
   */

  async queryProducts(params = {}) {
    const normalizedParams = {
      search: normalizeSearch(params.search),

      category: normalizeOption(params.category),

      categorySlug: normalizeOption(params.categorySlug),

      brand: normalizeOption(params.brand),

      unit: normalizeOption(params.unit),

      grade: normalizeOption(params.grade),

      inStockOnly: normalizeBoolean(params.inStockOnly),

      minPrice: normalizeNumber(params.minPrice),

      maxPrice: normalizeNumber(params.maxPrice),

      expressOnly: normalizeBoolean(params.expressOnly),

      pincode: cleanText(params.pincode),

      sort: normalizeOption(params.sort) || "relevance",

      limit: normalizeLimit(params.limit, 50),

      offset: normalizeOffset(params.offset),
    };

    /*
     * If both category and categorySlug are provided,
     * catalogRepository decides which one takes precedence.
     */

    const result = await catalogRepository.queryCatalog(normalizedParams);

    /*
     * Defensive response normalization.
     */

    if (!result || typeof result !== "object") {
      return emptyCatalogueResponse();
    }

    const products = Array.isArray(result.products)
      ? result.products
      : Array.isArray(result.items)
        ? result.items
        : [];

    const totalCount =
      Number(
        result.totalCount ?? result.total ?? result.count ?? products.length,
      ) || 0;

    return {
      ...result,

      products,

      items: products,

      totalCount,

      total:
        Number(
          result.total ?? result.totalCount ?? result.count ?? products.length,
        ) || 0,

      count:
        Number(
          result.count ?? result.totalCount ?? result.total ?? products.length,
        ) || 0,

      offset: normalizedParams.offset,

      limit: normalizedParams.limit,

      hasMore:
        typeof result.hasMore === "boolean"
          ? result.hasMore
          : normalizedParams.offset + products.length < totalCount,
    };
  },

  /*
   * ---------------------------------------------------------------------------
   * SEARCH PRODUCTS
   * ---------------------------------------------------------------------------
   */

  async searchProducts(search, options = {}) {
    const normalizedSearch = normalizeSearch(search);

    return catalogRepository.searchProducts(normalizedSearch, {
      ...options,
      search: normalizedSearch,
    });
  },

  /*
   * ---------------------------------------------------------------------------
   * GET PRODUCT BY SLUG
   * ---------------------------------------------------------------------------
   *
   * Used by:
   *
   * Customer Product Details page
   * Product card navigation
   * Direct product URLs
   *
   * Example:
   *
   * productService.getProductBySlug(
   *   "ultratech-cement-ppc"
   * )
   */

  async getProductBySlug(slug) {
    const normalizedSlug = cleanText(slug);

    if (!normalizedSlug) {
      return null;
    }

    return catalogRepository.getProductBySlug(normalizedSlug);
  },

  /*
   * ---------------------------------------------------------------------------
   * GET PRODUCTS BY CATEGORY
   * ---------------------------------------------------------------------------
   */

  async getProductsByCategory(categorySlug, options = {}) {
    const normalizedCategory = normalizeOption(categorySlug);

    if (!normalizedCategory) {
      return emptyCatalogueResponse();
    }

    return catalogRepository.getProductsByCategory(normalizedCategory, options);
  },

  /*
   * ---------------------------------------------------------------------------
   * GET CATEGORIES
   * ---------------------------------------------------------------------------
   */

  async getCategories() {
    const categories = await catalogRepository.getCategories();

    return Array.isArray(categories) ? categories : [];
  },

  /*
   * ---------------------------------------------------------------------------
   * GET CATEGORY BY SLUG
   * ---------------------------------------------------------------------------
   */

  async getCategoryBySlug(slug) {
    const normalizedSlug = normalizeOption(slug);

    if (!normalizedSlug) {
      return null;
    }

    return catalogRepository.getCategoryBySlug(normalizedSlug);
  },

  /*
   * ---------------------------------------------------------------------------
   * GET FILTER FACETS
   * ---------------------------------------------------------------------------
   */

  async getFilterFacets() {
    const facets = await catalogRepository.getFilterFacets();

    if (!facets || typeof facets !== "object") {
      return {
        brands: [],
        units: [],
        categories: [],
        grades: [],
        minPrice: 0,
        maxPrice: 0,
        expressCount: 0,
        inStockCount: 0,
        totalProducts: 0,
      };
    }

    return {
      brands: Array.isArray(facets.brands) ? facets.brands : [],

      units: Array.isArray(facets.units) ? facets.units : [],

      categories: Array.isArray(facets.categories) ? facets.categories : [],

      grades: Array.isArray(facets.grades) ? facets.grades : [],

      minPrice: Number.isFinite(Number(facets.minPrice))
        ? Number(facets.minPrice)
        : 0,

      maxPrice: Number.isFinite(Number(facets.maxPrice))
        ? Number(facets.maxPrice)
        : 0,

      expressCount: Number(facets.expressCount) || 0,

      inStockCount: Number(facets.inStockCount) || 0,

      totalProducts: Number(facets.totalProducts) || 0,
    };
  },

  /*
   * ---------------------------------------------------------------------------
   * GET FEATURED PRODUCTS
   * ---------------------------------------------------------------------------
   */

  async getFeaturedProducts(limit = 12) {
    const normalizedLimit = normalizeLimit(limit, 12);

    const products =
      await catalogRepository.getFeaturedProducts(normalizedLimit);

    return Array.isArray(products) ? products : [];
  },

  /*
   * ---------------------------------------------------------------------------
   * GET EXPRESS PRODUCTS
   * ---------------------------------------------------------------------------
   */

  async getExpressProducts(options = {}) {
    const result = await catalogRepository.getExpressProducts(options);

    return result || emptyCatalogueResponse();
  },

  /*
   * ---------------------------------------------------------------------------
   * GET IN-STOCK PRODUCTS
   * ---------------------------------------------------------------------------
   */

  async getInStockProducts(options = {}) {
    const result = await catalogRepository.getInStockProducts(options);

    return result || emptyCatalogueResponse();
  },

  /*
   * ---------------------------------------------------------------------------
   * CHECK PRODUCT PUBLISHED STATUS
   * ---------------------------------------------------------------------------
   */

  async isProductPublished(productId) {
    const id = cleanText(productId);

    if (!id) {
      return false;
    }

    return catalogRepository.isProductPublished(id);
  },
};

export default productService;
