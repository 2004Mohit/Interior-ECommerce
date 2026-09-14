import { supabase } from "../lib/supabaseClient";

export const adminContentService = {
  /**
   * Fetches marketing banners with optional banner_type filter
   */
  async getBanners({ bannerType = "ALL", limit = 50, offset = 0 } = {}) {
    let query = supabase
      .from("marketing_banners")
      .select("*", { count: "exact" })
      .order("display_order", { ascending: true })
      .range(offset, offset + limit - 1);

    if (bannerType && bannerType !== "ALL") {
      query = query.eq("banner_type", bannerType);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      banners: data || [],
      totalCount: count || 0,
    };
  },

  /**
   * Saves or updates a marketing banner
   */
  async saveBanner(payload) {
    const { data, error } = await supabase.rpc("admin_save_banner", {
      p_id: payload.id || null,
      p_banner_type: payload.banner_type || "HOMEPAGE",
      p_title: payload.title.trim(),
      p_subtitle: payload.subtitle?.trim() || null,
      p_image_url: payload.image_url.trim(),
      p_cta_text: payload.cta_text?.trim() || "Explore Now",
      p_target_url: payload.target_url.trim(),
      p_category_slug: payload.category_slug || null,
      p_display_order: Number(payload.display_order) || 0,
      p_is_active: Boolean(payload.is_active),
      p_start_at: payload.start_at || new Date().toISOString(),
      p_end_at: payload.end_at || null,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Deletes a banner
   */
  async deleteBanner(bannerId) {
    const { error } = await supabase
      .from("marketing_banners")
      .delete()
      .eq("id", bannerId);

    if (error) throw error;
    return { success: true };
  },

  /**
   * Fetches promotional campaigns
   */
  async getPromotions({ limit = 50, offset = 0 } = {}) {
    const { data, count, error } = await supabase
      .from("promotional_campaigns")
      .select(
        `
        *,
        marketing_banners:banner_id (
          title,
          image_url
        ),
        vendor_products:applicable_product_id (
          id,
          name,
          price
        )
      `,
        { count: "exact" },
      )
      .order("display_priority", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const processed = (data || []).map((p) => ({
      ...p,
      banner: Array.isArray(p.marketing_banners)
        ? p.marketing_banners[0]
        : p.marketing_banners,
      product: Array.isArray(p.vendor_products)
        ? p.vendor_products[0]
        : p.vendor_products,
    }));

    return {
      promotions: processed,
      totalCount: count || 0,
    };
  },

  /**
   * Saves or updates a promotional campaign
   */
  async savePromotion(payload) {
    const { data, error } = await supabase.rpc("admin_save_promotion", {
      p_id: payload.id || null,
      p_campaign_name: payload.campaign_name.trim(),
      p_title: payload.title.trim(),
      p_description: payload.description?.trim() || null,
      p_banner_id: payload.banner_id || null,
      p_applicable_category_slug: payload.applicable_category_slug || null,
      p_applicable_product_id: payload.applicable_product_id || null,
      p_display_priority: Number(payload.display_priority) || 0,
      p_is_active: Boolean(payload.is_active),
      p_start_at: payload.start_at || new Date().toISOString(),
      p_end_at: payload.end_at || null,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Dispatches operational broadcast notifications
   */
  async broadcastNotification({
    recipientType,
    recipientId = null,
    category = "SYSTEM",
    title,
    message,
    link = null,
  }) {
    const { data, error } = await supabase.rpc(
      "admin_broadcast_operational_notification",
      {
        p_recipient_type: recipientType,
        p_recipient_id: recipientId || null,
        p_category: category,
        p_title: title.trim(),
        p_message: message.trim(),
        p_link: link?.trim() || null,
      },
    );

    if (error) throw error;
    return data;
  },

  /**
   * Fetches operational notification history
   */
  async getOperationalNotificationsLedger() {
    const [vendorNotifs, custNotifs] = await Promise.all([
      supabase
        .from("vendor_notifications")
        .select(
          `
          id, category, title, message, link, is_read, created_at,
          vendor_profiles:vendor_id (
            business_name,
            locality
          )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("customer_notifications")
        .select("id, title, message, link, is_read, created_at, customer_id")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const combined = [
      ...(vendorNotifs.data || []).map((n) => ({
        ...n,
        targetType: "VENDOR",
        targetLabel: n.vendor_profiles?.business_name || "Vendor Depot",
      })),
      ...(custNotifs.data || []).map((n) => ({
        ...n,
        targetType: "CUSTOMER",
        targetLabel: `Customer #${n.customer_id.slice(0, 8)}`,
      })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return combined;
  },
};
