import { supabase } from "../lib/supabaseClient";

export const VENDOR_APPLICATION_STATUS = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CHANGES_REQUESTED: "CHANGES_REQUESTED",
};

const mergeApplicationData = (currentApp, incomingData = {}) => ({
  businessDetails: {
    ...(currentApp?.businessDetails || {}),
    ...(incomingData.businessDetails || {}),
  },

  ownerDetails: {
    ...(currentApp?.ownerDetails || {}),
    ...(incomingData.ownerDetails || {}),
  },

  businessAddress: {
    ...(currentApp?.businessAddress || {}),
    ...(incomingData.businessAddress || {}),
  },

  productCategories: Array.isArray(incomingData.productCategories)
    ? incomingData.productCategories
    : Array.isArray(currentApp?.productCategories)
      ? currentApp.productCategories
      : [],

  verificationDocuments: {
    ...(currentApp?.verificationDocuments || {}),
    ...(incomingData.verificationDocuments || {}),
  },

  bankDetails: {
    ...(currentApp?.bankDetails || {}),
    ...(incomingData.bankDetails || {}),
  },
});

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

    return this.normalizeApplication(data);
  },

  /**
   * Save onboarding progress.
   *
   * DRAFT remains DRAFT.
   * CHANGES_REQUESTED remains CHANGES_REQUESTED while the vendor edits.
   *
   * It becomes SUBMITTED only when submitApplication() is called.
   */
  async saveDraft(userId, partialData, targetStep) {
    if (!userId) {
      throw new Error("AUTH_REQUIRED");
    }

    const currentApp = await this.getApplication(userId);

    if (!currentApp) {
      throw new Error(
        "Your vendor application could not be found. Please restart onboarding.",
      );
    }

    const editableStatuses = [
      VENDOR_APPLICATION_STATUS.DRAFT,
      VENDOR_APPLICATION_STATUS.CHANGES_REQUESTED,
    ];

    if (currentApp.status && !editableStatuses.includes(currentApp.status)) {
      throw new Error(
        "Your application is currently under review and cannot be edited.",
      );
    }

    const merged = mergeApplicationData(currentApp, partialData);

    const updatedAt = new Date().toISOString();

    const { data, error } = await supabase
      .from("vendor_applications")
      .update({
        current_step: targetStep || currentApp.currentStep || 1,
        business_details: merged.businessDetails,
        owner_details: merged.ownerDetails,
        business_address: merged.businessAddress,
        product_categories: merged.productCategories,
        verification_documents: merged.verificationDocuments,
        bank_details: merged.bankDetails,
        updated_at: updatedAt,
      })
      .eq("id", currentApp.id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Failed to save vendor onboarding changes:", error);
      throw new Error(`Unable to save onboarding changes: ${error.message}`);
    }

    return this.normalizeApplication(data);
  },

  /**
   * Submit the vendor application for admin review.
   *
   * This is the ONLY operation that changes an editable application
   * to SUBMITTED.
   */
  async submitApplication(userId, finalData) {
    if (!userId) {
      throw new Error("AUTH_REQUIRED");
    }

    const currentApp = await this.getApplication(userId);

    if (!currentApp) {
      throw new Error(
        "Your vendor application could not be found. Please restart onboarding.",
      );
    }

    const editableStatuses = [
      VENDOR_APPLICATION_STATUS.DRAFT,
      VENDOR_APPLICATION_STATUS.CHANGES_REQUESTED,
      VENDOR_APPLICATION_STATUS.REJECTED,
    ];

    if (currentApp.status && !editableStatuses.includes(currentApp.status)) {
      throw new Error(
        "Your application cannot be resubmitted while it is under review.",
      );
    }

    const merged = mergeApplicationData(currentApp, finalData);

    const submittedAt = new Date().toISOString();
    const updatedAt = submittedAt;

    const { data, error } = await supabase
      .from("vendor_applications")
      .update({
        status: VENDOR_APPLICATION_STATUS.SUBMITTED,
        current_step: 6,

        /*
         * Clear the previous review message after the vendor
         * has resubmitted the corrected application.
         */
        reviewer_notes: "",
        rejection_reason: "",
        changes_requested_items: [],

        business_details: merged.businessDetails,
        owner_details: merged.ownerDetails,
        business_address: merged.businessAddress,
        product_categories: merged.productCategories,
        verification_documents: merged.verificationDocuments,
        bank_details: merged.bankDetails,

        submitted_at: submittedAt,
        updated_at: updatedAt,
      })
      .eq("id", currentApp.id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Failed to resubmit vendor application:", error);
      throw new Error(`Unable to resubmit application: ${error.message}`);
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
   * Convert Supabase database format to the format used by React.
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

      reviewerNotes: data.reviewer_notes || "",
      rejectionReason: data.rejection_reason || "",

      requestedChanges: Array.isArray(data.changes_requested_items)
        ? data.changes_requested_items
        : [],

      updatedAt: data.updated_at || null,
      submittedAt: data.submitted_at || null,
    };
  },

  /**
   * Generate a short-lived signed URL for the vendor's own
   * verification document.
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

    const publicMarker = `/storage/v1/object/public/${bucket}/`;
    const signMarker = `/storage/v1/object/sign/${bucket}/`;

    if (storedPath.includes(publicMarker)) {
      storedPath = storedPath.split(publicMarker)[1];
    } else if (storedPath.includes(signMarker)) {
      storedPath = storedPath.split(signMarker)[1];
    }

    try {
      storedPath = decodeURIComponent(storedPath);
    } catch {
      // Keep the original path if decoding is unnecessary/invalid.
    }

    const bucketPrefix = `${bucket}/`;

    let ownershipPath = storedPath;

    if (ownershipPath.startsWith(bucketPrefix)) {
      ownershipPath = ownershipPath.substring(bucketPrefix.length);
    }

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

    const pathsToTry = [storedPath];

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
