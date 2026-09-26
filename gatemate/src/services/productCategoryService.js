/**
 * Ferrado Product Category Service
 *
 * Categories are loaded from the Supabase product_categories table.
 *
 * Do NOT use the static frontend categories file for product creation,
 * because vendor_products.category_slug has a foreign key to
 * product_categories.slug.
 */

import { supabase } from "../lib/supabaseClient";

export const productCategoryService = {
  /**
   * Fetch active product categories from Supabase.
   *
   * Expected database table:
   * public.product_categories
   *
   * Expected important columns:
   * - slug
   * - name
   * - is_active
   *
   * If your table does not have is_active, remove that filter.
   */
  async getCategories() {
    const { data, error } = await supabase
      .from("product_categories")
      .select("*")
      .order("display_order", {
        ascending: true,
      });

    if (error) {
      throw new Error(`Unable to load product categories: ${error.message}`);
    }

    return (data || []).filter(
      (category) =>
        category &&
        category.slug &&
        category.name &&
        category.is_active !== false,
    );
  },

  /**
   * Get one category by its database slug.
   */
  async getCategoryBySlug(slug) {
    if (!slug) {
      return null;
    }

    const { data, error } = await supabase
      .from("product_categories")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to load product category: ${error.message}`);
    }

    return data || null;
  },

  /**
   * Verify that a category slug actually exists
   * in the database.
   */
  async categoryExists(slug) {
    if (!slug) {
      return false;
    }

    const { data, error } = await supabase
      .from("product_categories")
      .select("slug")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to verify product category: ${error.message}`);
    }

    return Boolean(data?.slug);
  },
};
