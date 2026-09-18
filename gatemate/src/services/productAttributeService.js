/**
 * GateMate Category Product Attribute & Vendor Suggestion Engine
 */

import { supabase } from "../lib/supabaseClient";

export const ATTRIBUTE_TYPES = {
  TEXT: "text",
  NUMBER: "number",
  SELECT: "select",
};

export const ATTRIBUTE_SUGGESTION_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

// Fixed System-Defined Category Attributes
const SYSTEM_CATEGORY_ATTRIBUTES = {
  cement: [
    {
      id: "attr-cem-01",
      name: "Grade",
      type: ATTRIBUTE_TYPES.SELECT,
      required: true,
      allowedValues: [
        "PPC (Portland Pozzolana Cement)",
        "OPC 53 Grade",
        "OPC 43 Grade",
        "Composite Cement",
        "White Cement",
      ],
      isSystem: true,
    },
    {
      id: "attr-cem-02",
      name: "Bag Weight",
      type: ATTRIBUTE_TYPES.SELECT,
      required: true,
      allowedValues: ["50 kg", "25 kg", "1 kg"],
      isSystem: true,
    },
    {
      id: "attr-cem-03",
      name: "Initial Setting Time",
      type: ATTRIBUTE_TYPES.TEXT,
      required: false,
      placeholder: "e.g. 110 Minutes",
      isSystem: true,
    },
    {
      id: "attr-cem-04",
      name: "28-Day Compressive Strength",
      type: ATTRIBUTE_TYPES.TEXT,
      required: false,
      placeholder: "e.g. 53+ MPa",
      isSystem: true,
    },
    {
      id: "attr-cem-05",
      name: "Standard Compliance",
      type: ATTRIBUTE_TYPES.TEXT,
      required: true,
      placeholder: "e.g. IS 1489 (Part 1) Certified",
      isSystem: true,
    },
  ],
  "steel-tmt": [
    {
      id: "attr-tmt-01",
      name: "Steel Grade",
      type: ATTRIBUTE_TYPES.SELECT,
      required: true,
      allowedValues: [
        "Fe 550D (High Ductility)",
        "Fe 500D",
        "Fe 600",
        "CRS (Corrosion Resistant)",
      ],
      isSystem: true,
    },
    {
      id: "attr-tmt-02",
      name: "Bar Diameter",
      type: ATTRIBUTE_TYPES.SELECT,
      required: true,
      allowedValues: [
        "8 mm",
        "10 mm",
        "12 mm",
        "16 mm",
        "20 mm",
        "25 mm",
        "32 mm",
      ],
      isSystem: true,
    },
    {
      id: "attr-tmt-03",
      name: "Standard Length",
      type: ATTRIBUTE_TYPES.TEXT,
      required: true,
      placeholder: "e.g. 12 Metres (40 Feet)",
      isSystem: true,
    },
    {
      id: "attr-tmt-04",
      name: "Unit Weight per Bar",
      type: ATTRIBUTE_TYPES.TEXT,
      required: false,
      placeholder: "e.g. 10.65 kg per bar",
      isSystem: true,
    },
    {
      id: "attr-tmt-05",
      name: "Standard Compliance",
      type: ATTRIBUTE_TYPES.TEXT,
      required: true,
      placeholder: "e.g. IS 1786 Certified",
      isSystem: true,
    },
  ],
  "bricks-blocks": [
    {
      id: "attr-blk-01",
      name: "Block / Brick Type",
      type: ATTRIBUTE_TYPES.SELECT,
      required: true,
      allowedValues: [
        "AAC Lightweight Block",
        "Red Clay Wire-Cut Brick",
        "Fly Ash Brick",
        "Solid Concrete Block",
      ],
      isSystem: true,
    },
    {
      id: "attr-blk-02",
      name: "Block Dimensions (L x H x W)",
      type: ATTRIBUTE_TYPES.TEXT,
      required: true,
      placeholder: "e.g. 600 x 200 x 150 mm (6 Inch)",
      isSystem: true,
    },
    {
      id: "attr-blk-03",
      name: "Compressive Strength",
      type: ATTRIBUTE_TYPES.TEXT,
      required: false,
      placeholder: "e.g. 3.5 to 4.5 N/mm²",
      isSystem: true,
    },
    {
      id: "attr-blk-04",
      name: "Dry Density",
      type: ATTRIBUTE_TYPES.TEXT,
      required: false,
      placeholder: "e.g. 550 to 650 kg/m³",
      isSystem: true,
    },
  ],
  "sand-aggregates": [
    {
      id: "attr-snd-01",
      name: "Material Type",
      type: ATTRIBUTE_TYPES.SELECT,
      required: true,
      allowedValues: [
        "Manufactured Sand (M-Sand)",
        "Plastering Sand (P-Sand)",
        "20mm Coarse Aggregate Grit",
        "10mm Down Aggregate",
        "River Sand",
      ],
      isSystem: true,
    },
    {
      id: "attr-snd-02",
      name: "Grading Sieve Zone",
      type: ATTRIBUTE_TYPES.SELECT,
      required: true,
      allowedValues: ["IS 383 Zone II", "IS 383 Zone III", "IS 383 Zone I"],
      isSystem: true,
    },
    {
      id: "attr-snd-03",
      name: "Silt Content",
      type: ATTRIBUTE_TYPES.TEXT,
      required: false,
      placeholder: "e.g. < 3% Washed",
      isSystem: true,
    },
  ],
  plumbing: [
    {
      id: "attr-plm-01",
      name: "Pipe Material",
      type: ATTRIBUTE_TYPES.SELECT,
      required: true,
      allowedValues: [
        "CPVC (Hot & Cold)",
        "UPVC (Cold Water)",
        "SWR Drainage PVC",
        "PEX",
        "GI Galvanised",
      ],
      isSystem: true,
    },
    {
      id: "attr-plm-02",
      name: "Nominal Diameter",
      type: ATTRIBUTE_TYPES.TEXT,
      required: true,
      placeholder: "e.g. 1 Inch (25 mm NB)",
      isSystem: true,
    },
    {
      id: "attr-plm-03",
      name: "Pressure Class",
      type: ATTRIBUTE_TYPES.TEXT,
      required: true,
      placeholder: "e.g. SDR 11 (28.1 kg/cm²)",
      isSystem: true,
    },
    {
      id: "attr-plm-04",
      name: "Standard Length",
      type: ATTRIBUTE_TYPES.TEXT,
      required: false,
      placeholder: "e.g. 3 Metres (10 Feet)",
      isSystem: true,
    },
  ],
  electrical: [
    {
      id: "attr-el-01",
      name: "Cross Section / Size",
      type: ATTRIBUTE_TYPES.SELECT,
      required: true,
      allowedValues: [
        "1.0 sq mm",
        "1.5 sq mm",
        "2.5 sq mm",
        "4.0 sq mm",
        "6.0 sq mm",
        "10.0 sq mm",
      ],
      isSystem: true,
    },
    {
      id: "attr-el-02",
      name: "Core Configuration",
      type: ATTRIBUTE_TYPES.SELECT,
      required: true,
      allowedValues: [
        "Single Core Multi-Strand",
        "2-Core Flat",
        "3-Core Round",
        "4-Core Heavy Power",
      ],
      isSystem: true,
    },
    {
      id: "attr-el-03",
      name: "Insulation Grade",
      type: ATTRIBUTE_TYPES.SELECT,
      required: true,
      allowedValues: [
        "FR (Flame Retardant)",
        "FRLS (Low Smoke)",
        "ZHFR (Zero Halogen)",
        "Standard PVC",
      ],
      isSystem: true,
    },
    {
      id: "attr-el-04",
      name: "Voltage Rating",
      type: ATTRIBUTE_TYPES.TEXT,
      required: false,
      placeholder: "e.g. 1100 V",
      isSystem: true,
    },
  ],
  "plywood-boards": [
    {
      id: "attr-ply-01",
      name: "Board Grade",
      type: ATTRIBUTE_TYPES.SELECT,
      required: true,
      allowedValues: [
        "BWP (Boiling Water Proof IS:710)",
        "BWR (Boiling Water Resistant)",
        "MR Commercial (IS:303)",
        "Marine Grade",
        "HDHMR Moisture Proof",
      ],
      isSystem: true,
    },
    {
      id: "attr-ply-02",
      name: "Thickness",
      type: ATTRIBUTE_TYPES.SELECT,
      required: true,
      allowedValues: [
        "6 mm",
        "9 mm",
        "12 mm",
        "16 mm",
        "18 mm",
        "19 mm",
        "25 mm",
      ],
      isSystem: true,
    },
    {
      id: "attr-ply-03",
      name: "Sheet Dimensions",
      type: ATTRIBUTE_TYPES.TEXT,
      required: true,
      placeholder: "e.g. 8x4 Feet (2440x1220 mm)",
      isSystem: true,
    },
    {
      id: "attr-ply-04",
      name: "Core Composition",
      type: ATTRIBUTE_TYPES.TEXT,
      required: false,
      placeholder: "e.g. 100% Selected Hardwood Core",
      isSystem: true,
    },
  ],
  waterproofing: [
    {
      id: "attr-wp-01",
      name: "Chemical Formulation",
      type: ATTRIBUTE_TYPES.SELECT,
      required: true,
      allowedValues: [
        "Integral Liquid Waterproofer",
        "SBR Latex Polymer Bonding Agent",
        "Acrylic Cementitious Membrane",
        "Silicone Joint Sealant",
        "Bituminous Membrane",
      ],
      isSystem: true,
    },
    {
      id: "attr-wp-02",
      name: "Standard Dosage",
      type: ATTRIBUTE_TYPES.TEXT,
      required: true,
      placeholder: "e.g. 200 ml per 50 kg cement bag",
      isSystem: true,
    },
    {
      id: "attr-wp-03",
      name: "Application Area",
      type: ATTRIBUTE_TYPES.TEXT,
      required: false,
      placeholder: "e.g. Slabs, Roof Terraces, Sunken Bathrooms",
      isSystem: true,
    },
  ],
};

const SUGGESTIONS_STORAGE_KEY = "gatemate_vendor_attribute_suggestions";

export const productAttributeService = {
  async _resolveVendorId() {
    const { data: vendorId, error } = await supabase.rpc(
      "get_vendor_id_for_auth_user",
    );
    if (error) {
      throw new Error(`Unable to resolve vendor profile: ${error.message}`);
    }
    if (!vendorId) {
      throw new Error(
        "Vendor profile not found. The vendor may not be approved yet.",
      );
    }
    return vendorId;
  },

  /**
   * Fetches the merged category attributes.
   */
  async getCategoryAttributes(categorySlug) {
    const baseAttrs = SYSTEM_CATEGORY_ATTRIBUTES[categorySlug] || [
      {
        id: "attr-gen-01",
        name: "Material Grade / Spec",
        type: ATTRIBUTE_TYPES.TEXT,
        required: true,
        placeholder: "e.g. Standard Grade",
        isSystem: true,
      },
      {
        id: "attr-gen-02",
        name: "Standard Dimensions",
        type: ATTRIBUTE_TYPES.TEXT,
        required: false,
        placeholder: "e.g. Standard Size",
        isSystem: true,
      },
    ];

    const approvedSuggestions =
      await this.getApprovedSuggestionsForCategory(categorySlug);

    return [...baseAttrs, ...approvedSuggestions];
  },

  /**
   * Submits a vendor's custom attribute suggestion into the PENDING review state.
   */
  async submitVendorSuggestion({
    categorySlug,
    attributeName,
    type = ATTRIBUTE_TYPES.TEXT,
    allowedValues = [],
    required = false,
    reason = "",
  }) {
    const vendorId = await this._resolveVendorId();

    if (!categorySlug || !attributeName?.trim()) {
      throw new Error("Please provide category and attribute name.");
    }

    const cleanName = attributeName.trim();
    const newSuggestion = {
      id: `sug-${Date.now()}`,
      vendorId,
      categorySlug,
      name: cleanName,
      type,
      allowedValues: type === ATTRIBUTE_TYPES.SELECT ? allowedValues : [],
      required: Boolean(required),
      reason,
      status: ATTRIBUTE_SUGGESTION_STATUS.PENDING,
      reviewerNotes: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await supabase.from("product_attribute_suggestions").insert({
        id: newSuggestion.id,
        vendor_id: vendorId,
        category_slug: categorySlug,
        name: cleanName,
        type,
        allowed_values: newSuggestion.allowedValues,
        is_required: newSuggestion.required,
        reason,
        status: ATTRIBUTE_SUGGESTION_STATUS.PENDING,
        created_at: newSuggestion.createdAt,
      });
    } catch (e) {
      console.warn("Persisted suggestion locally", e);
    }

    const all = this._getLocalSuggestions();
    localStorage.setItem(
      SUGGESTIONS_STORAGE_KEY,
      JSON.stringify([newSuggestion, ...all]),
    );

    return newSuggestion;
  },

  /**
   * Get suggestions submitted by the authenticated vendor.
   */
  async getVendorSuggestions() {
    const vendorId = await this._resolveVendorId();
    const all = this._getLocalSuggestions();
    return all.filter((s) => s.vendorId === vendorId);
  },

  /**
   * Get all suggestions (for Admin approval workflow).
   */
  async getAllSuggestions() {
    return this._getLocalSuggestions();
  },

  /**
   * Admin: Approve or Reject a suggested attribute.
   */
  async updateSuggestionReviewState(
    suggestionId,
    { status, reviewerNotes = "" },
  ) {
    const all = this._getLocalSuggestions();
    const updated = all.map((s) =>
      s.id === suggestionId
        ? {
            ...s,
            status,
            reviewerNotes,
            updatedAt: new Date().toISOString(),
          }
        : s,
    );

    localStorage.setItem(SUGGESTIONS_STORAGE_KEY, JSON.stringify(updated));

    try {
      await supabase
        .from("product_attribute_suggestions")
        .update({
          status,
          reviewer_notes: reviewerNotes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", suggestionId);
    } catch (e) {
      console.warn("Updated review state", e);
    }

    return updated.find((s) => s.id === suggestionId);
  },

  async getApprovedSuggestionsForCategory(categorySlug) {
    const all = this._getLocalSuggestions();
    return all
      .filter(
        (s) =>
          s.categorySlug === categorySlug &&
          s.status === ATTRIBUTE_SUGGESTION_STATUS.APPROVED,
      )
      .map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        required: false,
        allowedValues: s.allowedValues,
        placeholder: `e.g. ${s.name} specification`,
        isSystem: false,
        isCommunityApproved: true,
      }));
  },

  _getLocalSuggestions() {
    const raw = localStorage.getItem(SUGGESTIONS_STORAGE_KEY);
    if (!raw) {
      const seed = [
        {
          id: "sug-seed-01",
          vendorId: "legacy-demo-seed",
          categorySlug: "electrical",
          name: "Wire Gauge (AWG / SWG)",
          type: ATTRIBUTE_TYPES.TEXT,
          allowedValues: [],
          required: false,
          reason:
            "Industrial contractors specifically query gauge standard alongside sq mm.",
          status: ATTRIBUTE_SUGGESTION_STATUS.APPROVED,
          reviewerNotes: "Approved for electrical wires & cables.",
          createdAt: "2026-08-15T10:00:00Z",
          updatedAt: "2026-08-16T10:00:00Z",
        },
      ];
      localStorage.setItem(SUGGESTIONS_STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  },
};
