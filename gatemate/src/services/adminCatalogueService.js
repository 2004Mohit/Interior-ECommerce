import { supabase } from "../lib/supabaseClient";

export const adminCatalogueService = {
  /**
   * Fetches all products across vendors with granular construction filtering
   */
  async getProducts({
    search = "",
    categorySlug = "ALL",
    status = "ALL",
    vendorId = "ALL",
    minPrice = null,
    maxPrice = null,
    inStockOnly = false,
    limit = 50,
    offset = 0,
  } = {}) {
    let query = supabase
      .from("vendor_products")
      .select(
        `
        *,
        vendor_profiles:vendor_id (
          id,
          business_name,
          city,
          locality
        ),
        vendor_inventory (
          on_hand_stock,
          reserved_stock,
          low_stock_threshold
        )
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "ALL") {
      query = query.eq("status", status);
    }
    if (categorySlug && categorySlug !== "ALL") {
      query = query.eq("category_slug", categorySlug);
    }
    if (vendorId && vendorId !== "ALL") {
      query = query.eq("vendor_id", vendorId);
    }
    if (minPrice !== null && minPrice !== "") {
      query = query.gte("price", Number(minPrice));
    }
    if (maxPrice !== null && maxPrice !== "") {
      query = query.lte("price", Number(maxPrice));
    }

    const { data, count, error } = await query;
    if (error) throw error;

    let filtered = data || [];

    if (inStockOnly) {
      filtered = filtered.filter((p) => {
        const stock = p.vendor_inventory;
        return stock && stock.on_hand_stock - stock.reserved_stock > 0;
      });
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        const name = String(p.name || "").toLowerCase();
        const brand = String(p.brand || "").toLowerCase();
        const vendor = String(
          p.vendor_profiles?.business_name || "",
        ).toLowerCase();
        const sku = String(p.sku || "").toLowerCase();
        return (
          name.includes(q) ||
          brand.includes(q) ||
          vendor.includes(q) ||
          sku.includes(q)
        );
      });
    }

    return {
      products: filtered,
      totalCount: count || filtered.length,
    };
  },

  /**
   * Fetches all product categories with associated product counts
   */
  async getCategories() {
    const [catRes, prodRes] = await Promise.all([
      supabase
        .from("product_categories")
        .select("*")
        .order("display_order", { ascending: true }),
      supabase.from("vendor_products").select("category_slug"),
    ]);

    if (catRes.error) throw catRes.error;

    const counts = (prodRes.data || []).reduce((acc, p) => {
      acc[p.category_slug] = (acc[p.category_slug] || 0) + 1;
      return acc;
    }, {});

    return (catRes.data || []).map((cat) => ({
      ...cat,
      productCount: counts[cat.slug] || 0,
    }));
  },

  /**
   * Fetches category details by slug
   */
  async getCategoryBySlug(slug) {
    const { data, error } = await supabase
      .from("product_categories")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Saves or updates a category via RPC
   */
  async saveCategory(payload) {
    const { data, error } = await supabase.rpc("admin_save_category", {
      p_slug: payload.slug.trim().toLowerCase(),
      p_name: payload.name.trim(),
      p_descriptor: payload.descriptor?.trim() || null,
      p_image_url: payload.image_url?.trim() || null,
      p_display_order: Number(payload.display_order) || 0,
      p_is_active: Boolean(payload.is_active),
      p_meta_title: payload.meta_title?.trim() || null,
      p_meta_description: payload.meta_description?.trim() || null,
      p_meta_keywords: Array.isArray(payload.meta_keywords)
        ? payload.meta_keywords
        : [],
    });

    if (error) throw error;
    return data;
  },

  /**
   * Deletes or deactivates category with dependent product validation
   */
  async deleteCategory(slug, forceDeactivate = true) {
    const { data, error } = await supabase.rpc("admin_delete_category", {
      p_slug: slug,
      p_force_deactivate: forceDeactivate,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Toggles product publish/unpublish status
   */
  async toggleProductStatus(productId, newStatus, reason = "") {
    const { data, error } = await supabase.rpc("admin_toggle_product_status", {
      p_product_id: productId,
      p_new_status: newStatus,
      p_reason: reason,
    });

    if (error) throw error;
    return data;
  },
};
