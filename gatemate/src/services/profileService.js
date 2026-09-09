/**
 * GateMate Customer Profile & Preference Service
 * Separates raw Supabase Auth credentials from application profile data and B2B entities.
 */

const PROFILE_STORAGE_PREFIX = "gatemate_customer_profile_";

export const profileService = {
  /**
   * Fetches the application profile record for an authenticated user.
   */
  async getProfile(userId, authUser) {
    if (!userId) {
      throw new Error(
        "AUTH_REQUIRED: You must be logged in to view your profile.",
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 140));

    // [TODO: SUPABASE PERSISTENCE]
    // const { data, error } = await supabase
    //   .from('customer_profiles')
    //   .select('*, b2b_profiles(*)')
    //   .eq('id', userId)
    //   .single();
    // if (error && error.code !== 'PGRST116') throw error;
    // if (data) return data;

    const stored = localStorage.getItem(`${PROFILE_STORAGE_PREFIX}${userId}`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Error parsing stored profile", e);
      }
    }

    // Default profile baseline derived from Supabase Auth metadata
    return {
      id: userId,
      fullName: authUser?.user_metadata?.full_name || "GateMate Customer",
      email: authUser?.email || "",
      phone:
        authUser?.phone || authUser?.user_metadata?.phone || "+91 98290 12345",
      location: "Pune / PCMC Region",
      isPhoneVerified: Boolean(authUser?.phone_confirmed_at || authUser?.phone),
      isEmailVerified: Boolean(authUser?.email_confirmed_at || authUser?.email),

      // Notification & Delivery Communication Preferences
      preferences: {
        orderUpdatesWhatsApp: true,
        smsDispatchAlerts: true,
        promotionalEmails: false,
        priorityExpressNotice: true,
      },

      // B2B Architectural / Hardware Quotation Extension Contract
      b2bProfile: {
        isB2BRegistered: false,
        companyName: "",
        gstNumber: "",
        businessType: "Architect / Interior Contractor",
      },
    };
  },

  /**
   * Updates profile information.
   */
  async updateProfile(userId, profileData) {
    if (!userId) {
      throw new Error("AUTH_REQUIRED");
    }

    await new Promise((resolve) => setTimeout(resolve, 200));

    // [TODO: SUPABASE PERSISTENCE]
    // const { data, error } = await supabase
    //   .from('customer_profiles')
    //   .upsert({ id: userId, ...profileData, updated_at: new Date().toISOString() });
    // if (error) throw error;
    // return data;

    localStorage.setItem(
      `${PROFILE_STORAGE_PREFIX}${userId}`,
      JSON.stringify(profileData),
    );
    return {
      success: true,
      data: profileData,
      message: "Profile details saved successfully.",
    };
  },
};
