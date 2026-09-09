/**
 * GateMate B2B Architectural & Contractor Quotation Service
 * Pune & Pimpri-Chinchwad Commercial Procurement Engine
 */

const B2B_STORAGE_KEY = "gatemate_b2b_rfqs_";

export const b2bService = {
  /**
   * Validates Indian GSTIN Format (e.g. 27AAAAA0000A1Z5 for Maharashtra)
   */
  validateGSTIN(gstin) {
    const cleanGst = (gstin || "").trim().toUpperCase();
    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (!gstRegex.test(cleanGst)) {
      return {
        isValid: false,
        message:
          "Please enter a valid 15-character Indian GSTIN (e.g. 27AAAAA0000A1Z5 for Maharashtra).",
      };
    }

    const stateCode = cleanGst.slice(0, 2);
    return {
      isValid: true,
      stateCode,
      isMaharashtra: stateCode === "27",
      formattedGst: cleanGst,
      message:
        stateCode === "27"
          ? "Valid Maharashtra GSTIN (Eligible for CGST + SGST ITC credit in Pune & PCMC)"
          : "Valid Inter-State GSTIN (Eligible for IGST credit)",
    };
  },

  /**
   * Retrieves all B2B Quotations submitted by the user
   */
  async getQuotations(userId) {
    await new Promise((resolve) => setTimeout(resolve, 120));
    const stored = localStorage.getItem(`${B2B_STORAGE_KEY}${userId}`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Error parsing B2B RFQs", e);
      }
    }

    // Default mock RFQ for initial testing
    return [
      {
        id: "RFQ-PN-2026-089",
        projectName: "Balewadi High Street Commercial Gateways",
        productName: "Heavy Duty Sheesham Automatic Gate Latch",
        quantity: 16,
        status: "QUOTATION_READY",
        estimatedTotal: 38400,
        gstBreakdown: "₹5,856 (18% ITC Eligible)",
        createdAt: "2026-09-02",
        siteLocation: "Balewadi, Pune",
        notes: "Includes through-bolts & automated motor link brackets.",
      },
    ];
  },

  /**
   * Submits a new Bulk Quotation RFQ
   */
  async submitQuotation(userId, rfqData) {
    await new Promise((resolve) => setTimeout(resolve, 250));

    const newRfq = {
      id: `RFQ-PN-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString().split("T")[0],
      status: "UNDER_VENDOR_REVIEW",
      ...rfqData,
    };

    const existing = await this.getQuotations(userId);
    const updated = [newRfq, ...existing];
    localStorage.setItem(
      `${B2B_STORAGE_KEY}${userId}`,
      JSON.stringify(updated),
    );

    return {
      success: true,
      data: newRfq,
      message:
        "Bulk quotation request submitted. Regional manufacturers in Pune/PCMC will provide tiered pricing.",
    };
  },
};
