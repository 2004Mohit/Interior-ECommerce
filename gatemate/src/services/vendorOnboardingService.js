/**
 * GateMate Vendor Verification & State Transition Architecture
 *
 * Supports 6 vendor verification lifecycle states:
 * - DRAFT: Initial form completion in progress
 * - SUBMITTED: Application submitted by stockist
 * - UNDER_REVIEW: Manual inspection by GateMate depot onboarding team
 * - APPROVED: Active seller permissions enabled
 * - REJECTED: Application declined with formal rejection reason
 * - CHANGES_REQUESTED: Vendor prompted to update specific fields or documents
 */

import { supabase } from "../lib/supabaseClient";

export const VENDOR_APPLICATION_STATUS = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CHANGES_REQUESTED: "CHANGES_REQUESTED",
};

const STORAGE_PREFIX = "gatemate_vendor_application_";

const DEFAULT_APPLICATION_DATA = {
  id: null,
  userId: null,
  status: VENDOR_APPLICATION_STATUS.DRAFT,
  currentStep: 1,
  reviewerNotes: "",
  reviewedAt: null,
  reviewedBy: null,
  rejectionReason: "",
  changesRequestedItems: [],
  businessDetails: {
    legalBusinessName: "",
    tradeName: "",
    businessType: "Proprietorship",
    gstin: "",
    panNumber: "",
    establishedYear: "2020",
  },
  ownerDetails: {
    primaryContactName: "",
    designation: "Proprietor / Managing Partner",
    email: "",
    mobileNumber: "",
    alternatePhone: "",
  },
  businessAddress: {
    depotAddressLine1: "",
    locality: "",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411028",
    serviceablePincodes: [
      "411001",
      "411004",
      "411006",
      "411014",
      "411028",
      "411061",
    ],
    hasHeavyTrailerAccess: true,
  },
  productCategories: [],
  verificationDocuments: {
    gstCertificateUrl: "",
    gstCertificateName: "",
    panCardUrl: "",
    panCardName: "",
    cancelledChequeUrl: "",
    cancelledChequeName: "",
  },
  bankDetails: {
    bankAccountName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    bankName: "",
    branchName: "",
  },
  createdAt: null,
  updatedAt: null,
  submittedAt: null,
};

export const vendorOnboardingService = {
  async getApplication(userId) {
    if (!userId) {
      throw new Error(
        "AUTH_REQUIRED: Please sign in to access your vendor onboarding.",
      );
    }

    try {
      const { data, error } = await supabase
        .from("vendor_applications")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (data && !error) {
        return {
          id: data.id,
          userId: data.user_id,
          status: data.status,
          currentStep: data.current_step || 1,
          reviewerNotes: data.reviewer_notes || "",
          reviewedAt: data.reviewed_at,
          reviewedBy: data.reviewed_by,
          rejectionReason: data.rejection_reason || "",
          changesRequestedItems: data.changes_requested_items || [],
          businessDetails:
            data.business_details || DEFAULT_APPLICATION_DATA.businessDetails,
          ownerDetails:
            data.owner_details || DEFAULT_APPLICATION_DATA.ownerDetails,
          businessAddress:
            data.business_address || DEFAULT_APPLICATION_DATA.businessAddress,
          productCategories: data.product_categories || [],
          verificationDocuments:
            data.verification_documents ||
            DEFAULT_APPLICATION_DATA.verificationDocuments,
          bankDetails:
            data.bank_details || DEFAULT_APPLICATION_DATA.bankDetails,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          submittedAt: data.submitted_at,
        };
      }
    } catch (e) {
      console.warn("Supabase query fallback to local application cache", e);
    }

    const local = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (local) {
      try {
        return JSON.parse(local);
      } catch (err) {
        console.error("Error reading cached application", err);
      }
    }

    return {
      ...DEFAULT_APPLICATION_DATA,
      userId,
      createdAt: new Date().toISOString(),
    };
  },

  async uploadVerificationDocument(userId, docType, file) {
    if (!userId || !file)
      throw new Error("Valid user and document file are required.");

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "Please upload a valid PDF or high-resolution PNG/JPG document (Max 5MB).",
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error(
        "File size exceeds 5MB limit. Please compress the document before uploading.",
      );
    }

    const fileExt = file.name.split(".").pop();
    const filePath = `private_docs/${userId}/${docType}_${Date.now()}.${fileExt}`;

    try {
      const { data, error } = await supabase.storage
        .from("vendor-verification-docs")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        return {
          storagePath: filePath,
          fileName: file.name,
        };
      }

      return {
        storagePath: data.path,
        fileName: file.name,
      };
    } catch (e) {
      return {
        storagePath: filePath,
        fileName: file.name,
      };
    }
  },

  async saveDraft(userId, partialData, targetStep) {
    if (!userId) throw new Error("AUTH_REQUIRED");

    const currentApp = await this.getApplication(userId);
    const updatedApp = {
      ...currentApp,
      ...partialAppMerge(currentApp, partialData),
      currentStep: targetStep || currentApp.currentStep,
      updatedAt: new Date().toISOString(),
    };

    try {
      await supabase.from("vendor_applications").upsert({
        user_id: userId,
        status: updatedApp.status,
        current_step: updatedApp.currentStep,
        business_details: updatedApp.businessDetails,
        owner_details: updatedApp.ownerDetails,
        business_address: updatedApp.businessAddress,
        product_categories: updatedApp.productCategories,
        verification_documents: updatedApp.verificationDocuments,
        bank_details: updatedApp.bankDetails,
        updated_at: updatedApp.updatedAt,
      });
    } catch (e) {
      console.warn("Draft persisted locally", e);
    }

    localStorage.setItem(
      `${STORAGE_PREFIX}${userId}`,
      JSON.stringify(updatedApp),
    );
    return updatedApp;
  },

  async submitApplication(userId, finalData) {
    if (!userId) throw new Error("AUTH_REQUIRED");

    const currentApp = await this.getApplication(userId);
    const finalized = {
      ...currentApp,
      ...partialAppMerge(currentApp, finalData),
      status: VENDOR_APPLICATION_STATUS.SUBMITTED,
      reviewerNotes: "",
      rejectionReason: "",
      changesRequestedItems: [],
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await supabase.from("vendor_applications").upsert({
        user_id: userId,
        status: VENDOR_APPLICATION_STATUS.SUBMITTED,
        current_step: 6,
        reviewer_notes: "",
        rejection_reason: "",
        changes_requested_items: [],
        business_details: finalized.businessDetails,
        owner_details: finalized.ownerDetails,
        business_address: finalized.businessAddress,
        product_categories: finalized.productCategories,
        verification_documents: finalized.verificationDocuments,
        bank_details: finalized.bankDetails,
        submitted_at: finalized.submittedAt,
        updated_at: finalized.updatedAt,
      });
    } catch (e) {
      console.warn("Persisted submission locally", e);
    }

    localStorage.setItem(
      `${STORAGE_PREFIX}${userId}`,
      JSON.stringify(finalized),
    );
    return finalized;
  },

  async updateVerificationReviewState(
    userId,
    {
      status,
      reviewerNotes = "",
      rejectionReason = "",
      changesRequestedItems = [],
    },
  ) {
    const currentApp = await this.getApplication(userId);
    const updated = {
      ...currentApp,
      status,
      reviewerNotes,
      rejectionReason,
      changesRequestedItems,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await supabase.from("vendor_applications").upsert({
        user_id: userId,
        status,
        reviewer_notes: reviewerNotes,
        rejection_reason: rejectionReason,
        changes_requested_items: changesRequestedItems,
        reviewed_at: updated.reviewedAt,
        updated_at: updated.updatedAt,
      });
    } catch (e) {
      console.warn("Review status persisted locally", e);
    }

    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(updated));
    return updated;
  },
};

function partialAppMerge(base, incoming) {
  return {
    businessDetails: {
      ...base.businessDetails,
      ...(incoming.businessDetails || {}),
    },
    ownerDetails: { ...base.ownerDetails, ...(incoming.ownerDetails || {}) },
    businessAddress: {
      ...base.businessAddress,
      ...(incoming.businessAddress || {}),
    },
    productCategories: incoming.productCategories || base.productCategories,
    verificationDocuments: {
      ...base.verificationDocuments,
      ...(incoming.verificationDocuments || {}),
    },
    bankDetails: { ...base.bankDetails, ...(incoming.bankDetails || {}) },
  };
}
