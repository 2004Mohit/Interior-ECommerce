/**
 * GateMate Customer Product Service
 *
 * Customer-facing product catalogue service.
 *
 * Data source:
 *   catalogRepository -> Supabase
 *
 * The customer catalogue must never use demoProducts,
 * mockData, static categories, or localStorage.
 *
 * Public catalogue rule:
 *   Only PUBLISHED vendor products are visible.
 */

import { catalogRepository } from "./catalogRepository";

/* -------------------------------------------------------------------------- */
/* Product Service                                                            */
/* -------------------------------------------------------------------------- */

export const productService = {
  /**
   * ------------------------------------------------------------------------
   * Get a single published product by slug
   * ------------------------------------------------------------------------
   *
   * Used by:
   *   - ProductDetails
   *   - ProductCard links
   *   - Product SEO pages
   */
  async getProductBySlug(slug) {
    if (!slug) {
      return null;
    }

    return catalogRepository.getProductBySlug(slug);
  },

  /**
   * ------------------------------------------------------------------------
   * Query customer product catalogue
   * ------------------------------------------------------------------------
   *
   * Supported filters:
   *
   *   search
   *   category
   *   categorySlug
   *   brand
   *   unit
   *   grade
   *   inStockOnly
   *   minPrice
   *   maxPrice
   *   expressOnly
   *   pincode
   *   sort
   *   limit
   *   offset
   */
  async queryProducts(params = {}) {
    return catalogRepository.queryCatalog({
      search: params.search || "",

      category: params.category || "",

      categorySlug: params.categorySlug || "",

      brand: params.brand || "",

      unit: params.unit || "",

      grade: params.grade || "",

      inStockOnly: Boolean(params.inStockOnly),

      minPrice: params.minPrice ?? "",

      maxPrice: params.maxPrice ?? "",

      expressOnly: Boolean(params.expressOnly),

      pincode: params.pincode || "",

      sort: params.sort || "relevance",

      limit: params.limit ?? 50,

      offset: params.offset ?? 0,
    });
  },

  /**
   * ------------------------------------------------------------------------
   * Search products
   * ------------------------------------------------------------------------
   */
  async searchProducts(search, options = {}) {
    return catalogRepository.searchProducts(search, options);
  },

  /**
   * ------------------------------------------------------------------------
   * Get products by category
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
      };
    }

    return catalogRepository.getProductsByCategory(categorySlug, options);
  },

  /**
   * ------------------------------------------------------------------------
   * Get active product categories
   * ------------------------------------------------------------------------
   *
   * Categories come directly from:
   *
   *   public.product_categories
   *
   * Static categories.js is not used.
   */
  async getCategories() {
    return catalogRepository.getCategories();
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

    return catalogRepository.getCategoryBySlug(slug);
  },

  /**
   * ------------------------------------------------------------------------
   * Get customer filter facets
   * ------------------------------------------------------------------------
   *
   * Returns:
   *
   *   brands
   *   units
   *   categories
   *   grades
   *   minPrice
   *   maxPrice
   *   expressCount
   *   inStockCount
   *   totalProducts
   */
  async getFilterFacets() {
    return catalogRepository.getFilterFacets();
  },

  /**
   * ------------------------------------------------------------------------
   * Get featured products
   * ------------------------------------------------------------------------
   *
   * There is currently no "featured" column in vendor_products.
   *
   * The repository therefore determines featured products from
   * currently published products rather than using demo data.
   */
  async getFeaturedProducts(limit = 12) {
    return catalogRepository.getFeaturedProducts(limit);
  },

  /**
   * ------------------------------------------------------------------------
   * Get products eligible for 30-minute delivery
   * ------------------------------------------------------------------------
   */
  async getExpressProducts(options = {}) {
    return catalogRepository.getExpressProducts(options);
  },

  /**
   * ------------------------------------------------------------------------
   * Get products currently in stock
   * ------------------------------------------------------------------------
   */
  async getInStockProducts(options = {}) {
    return catalogRepository.getInStockProducts(options);
  },

  /**
   * ------------------------------------------------------------------------
   * Check whether a product is publicly available
   * ------------------------------------------------------------------------
   */
  async isProductPublished(productId) {
    if (!productId) {
      return false;
    }

    return catalogRepository.isProductPublished(productId);
  },
};

export default productService;
