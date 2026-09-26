/**
 * Ferrado Customer Profile Service
 *
 * Responsibilities:
 * - Customer profile persistence through Supabase
 * - Customer communication preferences through customer_preferences
 * - No localStorage persistence
 * - No promotional preferences
 * - No phone verification flow
 */

import { supabase } from "../lib/supabaseClient";

const DEFAULT_PREFERENCES = {
  orderUpdates: true,
  invoiceEmails: true,
  expressDeliveryNotifications: true,
};

const normalizeProfile = (row, authUser = null) => {
  if (!row) {
    return {
      id: authUser?.id || null,
      fullName:
        authUser?.user_metadata?.full_name ||
        authUser?.user_metadata?.name ||
        "",
      email: authUser?.email || "",
      phone: authUser?.user_metadata?.phone || authUser?.phone || "",
      defaultPincode: "",
      preferredLanguage: "en",

      // Email verification is handled by Supabase Auth.
      isEmailVerified: Boolean(authUser?.email_confirmed_at),

      // Phone verification is intentionally NOT implemented yet.
      isPhoneVerified: false,

      phoneVerificationAvailable: false,

      createdAt: null,
      updatedAt: null,
    };
  }

  return {
    id: row.id,

    fullName: row.full_name || "",
    email: row.email || authUser?.email || "",
    phone: row.phone || "",

    defaultPincode: row.default_pincode || "",
    preferredLanguage: row.preferred_language || "en",

    // Supabase Auth is the source of truth for email verification.
    isEmailVerified: Boolean(authUser?.email_confirmed_at),

    // SMS/WhatsApp verification is not implemented yet.
    isPhoneVerified: false,

    phoneVerificationAvailable: false,

    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
};

const normalizePreferences = (row) => {
  if (!row) {
    return {
      ...DEFAULT_PREFERENCES,
    };
  }

  return {
    orderUpdates:
      typeof row.order_updates === "boolean"
        ? row.order_updates
        : DEFAULT_PREFERENCES.orderUpdates,

    invoiceEmails:
      typeof row.invoice_emails === "boolean"
        ? row.invoice_emails
        : DEFAULT_PREFERENCES.invoiceEmails,

    expressDeliveryNotifications:
      typeof row.express_delivery_notifications === "boolean"
        ? row.express_delivery_notifications
        : DEFAULT_PREFERENCES.expressDeliveryNotifications,
  };
};

export const profileService = {
  /**
   * Fetch customer profile from public.customer_profiles.
   *
   * If a profile row does not exist yet, a baseline object is returned.
   */
  async getProfile(userId, authUser = null) {
    if (!userId) {
      throw new Error(
        "AUTH_REQUIRED: You must be logged in to view your profile.",
      );
    }

    const { data, error } = await supabase
      .from("customer_profiles")
      .select(
        `
          id,
          full_name,
          phone,
          email,
          default_pincode,
          preferred_language,
          created_at,
          updated_at
        `,
      )
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Failed to load customer profile:", error);
      throw error;
    }

    return normalizeProfile(data, authUser);
  },

  /**
   * Create or update customer profile.
   *
   * Only fields belonging to customer_profiles are persisted here.
   */
  async updateProfile(userId, profileData = {}, authUser = null) {
    if (!userId) {
      throw new Error("AUTH_REQUIRED");
    }

    const fullName = String(
      profileData.fullName ??
        profileData.full_name ??
        authUser?.user_metadata?.full_name ??
        "",
    ).trim();

    const phone = String(
      profileData.phone ??
        authUser?.user_metadata?.phone ??
        authUser?.phone ??
        "",
    ).trim();

    const email = String(profileData.email ?? authUser?.email ?? "")
      .trim()
      .toLowerCase();

    const defaultPincode = String(
      profileData.defaultPincode ?? profileData.default_pincode ?? "",
    ).trim();

    const preferredLanguage =
      String(
        profileData.preferredLanguage ?? profileData.preferred_language ?? "en",
      ).trim() || "en";

    const payload = {
      id: userId,
      full_name: fullName || null,
      phone: phone || null,
      email,
      default_pincode: defaultPincode || null,
      preferred_language: preferredLanguage,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("customer_profiles")
      .upsert(payload, {
        onConflict: "id",
      })
      .select(
        `
          id,
          full_name,
          phone,
          email,
          default_pincode,
          preferred_language,
          created_at,
          updated_at
        `,
      )
      .single();

    if (error) {
      console.error("Failed to update customer profile:", error);
      throw error;
    }

    return {
      success: true,
      data: normalizeProfile(data, authUser),
      message: "Profile details saved successfully.",
    };
  },

  /**
   * Fetch customer communication preferences.
   */
  async getPreferences(userId) {
    if (!userId) {
      throw new Error("AUTH_REQUIRED");
    }

    const { data, error } = await supabase
      .from("customer_preferences")
      .select(
        `
          user_id,
          order_updates,
          invoice_emails,
          express_delivery_notifications,
          created_at,
          updated_at
        `,
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Failed to load customer preferences:", error);
      throw error;
    }

    return normalizePreferences(data);
  },

  /**
   * Create or update customer communication preferences.
   */
  async updatePreferences(userId, preferences = {}) {
    if (!userId) {
      throw new Error("AUTH_REQUIRED");
    }

    const payload = {
      user_id: userId,

      order_updates:
        typeof preferences.orderUpdates === "boolean"
          ? preferences.orderUpdates
          : DEFAULT_PREFERENCES.orderUpdates,

      invoice_emails:
        typeof preferences.invoiceEmails === "boolean"
          ? preferences.invoiceEmails
          : DEFAULT_PREFERENCES.invoiceEmails,

      express_delivery_notifications:
        typeof preferences.expressDeliveryNotifications === "boolean"
          ? preferences.expressDeliveryNotifications
          : DEFAULT_PREFERENCES.expressDeliveryNotifications,

      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("customer_preferences")
      .upsert(payload, {
        onConflict: "user_id",
      })
      .select(
        `
          user_id,
          order_updates,
          invoice_emails,
          express_delivery_notifications,
          created_at,
          updated_at
        `,
      )
      .single();

    if (error) {
      console.error("Failed to update customer preferences:", error);
      throw error;
    }

    return {
      success: true,
      data: normalizePreferences(data),
      message: "Preferences saved successfully.",
    };
  },

  /**
   * Fetch profile and preferences together.
   */
  async getAccountData(userId, authUser = null) {
    if (!userId) {
      throw new Error("AUTH_REQUIRED");
    }

    const [profile, preferences] = await Promise.all([
      this.getProfile(userId, authUser),
      this.getPreferences(userId),
    ]);

    return {
      profile,
      preferences,
    };
  },
};
