import { supabase } from "../lib/supabaseClient";

export const VENDOR_APPLICATION_STATUS = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CHANGES_REQUESTED: "CHANGES_REQUESTED",
};

export const vendorOnboardingService = {
  /**
   * Fetch the vendor application for a specific Supabase Auth user UUID.
   * @param {string} userId - The Supabase Auth user UUID (auth.users.id)
   */
  async getApplication(userId) {
    if (!userId) {
      throw new Error(
        "A valid Supabase Auth user ID is required to fetch the application.",
      );
    }

    const { data, error } = await supabase
      .from("vendor_applications")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Failed to load vendor application:", error);
      throw new Error(`Unable to load vendor application: ${error.message}`);
    }

    return data;
  },

  /**
   * Save or update an onboarding draft application for a user.
   * @param {string} userId - The Supabase Auth user UUID (auth.users.id)
   * @param {Object} formData - The current onboarding form data state
   * @param {number|string} step - Current onboarding step
   */
  async saveDraft(userId, formData, step) {
    if (!userId) {
      throw new Error(
        "A valid Supabase Auth user ID is required to save a draft.",
      );
    }

    // Check if an application already exists for this user
    const existing = await this.getApplication(userId).catch(() => null);

    const payload = {
      user_id: userId,
      form_data: formData,
      current_step: step,
      status:
        existing?.status === APPLICATION_STATUS.SUBMITTED
          ? APPLICATION_STATUS.SUBMITTED
          : APPLICATION_STATUS.DRAFT,
      updated_at: new Date().toISOString(),
    };

    let query;
    if (existing?.id) {
      query = supabase
        .from("vendor_applications")
        .update(payload)
        .eq("id", existing.id)
        .select()
        .single();
    } else {
      query = supabase
        .from("vendor_applications")
        .insert([payload])
        .select()
        .single();
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to save vendor application draft:", error);
      throw new Error(`Unable to save draft: ${error.message}`);
    }

    return data;
  },

  /**
   * Submit the vendor application for admin review.
   * @param {string} userId - The Supabase Auth user UUID (auth.users.id)
   * @param {Object} formData - Finalized form data for submission
   */
  async submitApplication(userId, formData) {
    if (!userId) {
      throw new Error(
        "A valid Supabase Auth user ID is required to submit an application.",
      );
    }

    const existing = await this.getApplication(userId).catch(() => null);

    const payload = {
      user_id: userId,
      form_data: formData,
      status: APPLICATION_STATUS.SUBMITTED,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let query;
    if (existing?.id) {
      query = supabase
        .from("vendor_applications")
        .update(payload)
        .eq("id", existing.id)
        .select()
        .single();
    } else {
      query = supabase
        .from("vendor_applications")
        .insert([payload])
        .select()
        .single();
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to submit vendor application:", error);
      throw new Error(`Unable to submit application: ${error.message}`);
    }

    return data;
  },

  /**
   * Update verification review state (typically used in admin workflows, but preserved if called here).
   * @param {string} userId - The Supabase Auth user UUID (auth.users.id)
   * @param {string} status - New application status
   * @param {string} reviewerNotes - Notes from reviewer
   */
  async updateVerificationReviewState(userId, status, reviewerNotes = "") {
    if (!userId) {
      throw new Error("A valid Supabase Auth user ID is required.");
    }

    const payload = {
      status,
      reviewer_notes: reviewerNotes,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("vendor_applications")
      .update(payload)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Failed to update verification review state:", error);
      throw new Error(
        `Unable to update verification review state: ${error.message}`,
      );
    }

    return data;
  },
};
