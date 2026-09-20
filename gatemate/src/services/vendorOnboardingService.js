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

    if (!data) {
      return null;
    }

    // Convert database snake_case into the camelCase structure
    // expected by VendorOnboarding.jsx.
    return {
      ...data,

      businessDetails: data.business_details || {},
      ownerDetails: data.owner_details || {},
      businessAddress: data.business_address || {},
      productCategories: Array.isArray(data.product_categories)
        ? data.product_categories
        : [],
      verificationDocuments: data.verification_documents || {},
      bankDetails: data.bank_details || {},
      currentStep: data.current_step || 1,
    };
  },

  /**
   * Save or update an onboarding draft application.
   */
  async saveDraft(userId, formData, step) {
    if (!userId) {
      throw new Error(
        "A valid Supabase Auth user ID is required to save a draft.",
      );
    }

    const existing = await this.getApplication(userId);

    const payload = {
      user_id: userId,

      current_step: Number(step) || 1,

      business_details: formData.businessDetails || {},
      owner_details: formData.ownerDetails || {},
      business_address: formData.businessAddress || {},
      product_categories: Array.isArray(formData.productCategories)
        ? formData.productCategories
        : [],
      verification_documents: formData.verificationDocuments || {},
      bank_details: formData.bankDetails || {},

      status:
        existing?.status === VENDOR_APPLICATION_STATUS.SUBMITTED
          ? VENDOR_APPLICATION_STATUS.SUBMITTED
          : VENDOR_APPLICATION_STATUS.DRAFT,

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
        .insert(payload)
        .select()
        .single();
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to save vendor application draft:", error);
      throw new Error(`Unable to save draft: ${error.message}`);
    }

    return this.normalizeApplication(data);
  },

  /**
   * Submit the vendor application for admin review.
   */
  async submitApplication(userId, formData) {
    if (!userId) {
      throw new Error(
        "A valid Supabase Auth user ID is required to submit an application.",
      );
    }

    const existing = await this.getApplication(userId);

    const payload = {
      user_id: userId,

      current_step: 6,

      business_details: formData.businessDetails || {},
      owner_details: formData.ownerDetails || {},
      business_address: formData.businessAddress || {},
      product_categories: Array.isArray(formData.productCategories)
        ? formData.productCategories
        : [],
      verification_documents: formData.verificationDocuments || {},
      bank_details: formData.bankDetails || {},

      status: VENDOR_APPLICATION_STATUS.SUBMITTED,

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
        .insert(payload)
        .select()
        .single();
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to submit vendor application:", error);
      throw new Error(`Unable to submit application: ${error.message}`);
    }

    return this.normalizeApplication(data);
  },

  /**
   * Update verification review state.
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

    return this.normalizeApplication(data);
  },

  /**
   * Convert Supabase database format to the format
   * used by the React onboarding component.
   */
  normalizeApplication(data) {
    if (!data) {
      return null;
    }

    return {
      ...data,

      businessDetails: data.business_details || {},
      ownerDetails: data.owner_details || {},
      businessAddress: data.business_address || {},
      productCategories: Array.isArray(data.product_categories)
        ? data.product_categories
        : [],
      verificationDocuments: data.verification_documents || {},
      bankDetails: data.bank_details || {},

      currentStep: data.current_step || 1,
    };
  },

  /**
   * Generate a short-lived signed URL for the vendor's
   * own verification document.
   *
   * Supports both:
   *
   * 1. Existing files:
   *    vendor-verification-docs/{vendorId}/{documentType}/{file}
   *
   * 2. Future/standard files:
   *    {vendorId}/{documentType}/{file}
   */
  async getVerificationDocumentUrl(userId, documentPath) {
    if (!userId) {
      throw new Error("Authenticated vendor is required.");
    }

    if (!documentPath) {
      throw new Error("Verification document is not available.");
    }

    const bucket = "vendor-verification-docs";

    let storedPath = String(documentPath).trim();

    /*
     * Remove accidental full Storage URL prefixes.
     */
    const publicMarker = `/storage/v1/object/public/${bucket}/`;
    const signMarker = `/storage/v1/object/sign/${bucket}/`;

    if (storedPath.includes(publicMarker)) {
      storedPath = storedPath.split(publicMarker)[1];
    } else if (storedPath.includes(signMarker)) {
      storedPath = storedPath.split(signMarker)[1];
    }

    /*
     * Decode URL encoding if the database contains
     * an encoded storage path.
     */
    try {
      storedPath = decodeURIComponent(storedPath);
    } catch {
      // Keep original path if decoding is unnecessary/invalid.
    }

    /*
     * IMPORTANT:
     *
     * The current uploadService stores existing files as:
     *
     * vendor-verification-docs/{userId}/{documentType}/{file}
     *
     * Therefore we must NOT remove the bucket prefix
     * before createSignedUrl().
     */

    const bucketPrefix = `${bucket}/`;

    let ownershipPath = storedPath;

    if (ownershipPath.startsWith(bucketPrefix)) {
      ownershipPath = ownershipPath.substring(bucketPrefix.length);
    }

    /*
     * Security check.
     *
     * The actual vendor-owned portion must begin with
     * the authenticated user's ID.
     */
    const expectedPrefix = `${userId}/`;

    if (!ownershipPath.startsWith(expectedPrefix)) {
      console.error("Verification document ownership check failed:", {
        userId,
        documentPath,
        storedPath,
        ownershipPath,
      });

      throw new Error("You are not authorized to view this document.");
    }

    /*
     * Use the ORIGINAL stored path for existing files.
     */
    const pathsToTry = [storedPath];

    /*
     * Also support correctly stored future paths without
     * the bucket prefix.
     */
    if (storedPath.startsWith(bucketPrefix)) {
      const relativePath = storedPath.substring(bucketPrefix.length);

      if (relativePath !== storedPath) {
        pathsToTry.push(relativePath);
      }
    } else {
      pathsToTry.push(`${bucketPrefix}${storedPath}`);
    }

    let lastError = null;

    for (const path of pathsToTry) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 300);

      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }

      lastError = error;
    }

    console.error("Failed to generate verification document URL:", lastError);

    throw new Error(
      `Unable to open verification document: ${
        lastError?.message || "Object not found"
      }`,
    );
  },
};
