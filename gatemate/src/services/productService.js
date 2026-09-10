import { catalogRepository } from "./catalogRepository";

export const productService = {
  async getProductBySlug(slug) {
    return await catalogRepository.getProductBySlug(slug);
  },

  async queryProducts(params) {
    return await catalogRepository.queryCatalog(params);
  },

  async getFilterFacets() {
    return await catalogRepository.getFilterFacets();
  },

  async getCategories() {
    return await catalogRepository.getCategories();
  },

  async getPromotionalBanners() {
    return await catalogRepository.getPromotionalBanners();
  },

  async getFeaturedProducts() {
    return await catalogRepository.getFeaturedProducts();
  },
};
