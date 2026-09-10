/**
 * GateMate Delivery & Serviceability Architecture
 *
 * Future Backend Contract:
 * Endpoint: POST /functions/v1/check-delivery-serviceability
 * Factors Evaluated:
 * - Seller Origin & Dispatch Hub
 * - Product Dimensions, Weight, and Delivery Class (Heavy Gate Hardware, Fragile Pottery, Standard)
 * - Pincode / Hyper-local Zone Geofence
 * - Ground-level placement & unloading limitation
 * - Real-time Courier Capacity & Inventory Status
 */

// Initial Launch Geography: Pune Municipal Corporation (PMC) + Pimpri-Chinchwad (PCMC)
export const LAUNCH_GEO_HUBS = {
  PUNE_CENTRAL: "Pune Central Hub (Shivajinagar/Koregaon Park)",
  PCMC_NORTH: "PCMC Hub (Pimple Saudagar/Chinchwad)",
};

export const DELIVERY_CLASSES = {
  FRAGILE_POTTERY: "FRAGILE_POTTERY",
  HEAVY_HARDWARE: "HEAVY_HARDWARE",
  STANDARD_PARCEL: "STANDARD_PARCEL",
  BULKY_WOODCRAFT: "BULKY_WOODCRAFT",
};

const SERVICEABLE_PINCODES_DB = {
  // Pune Municipal Corporation (PMC)
  411001: {
    area: "Pune Station / Camp",
    city: "Pune",
    hub: LAUNCH_GEO_HUBS.PUNE_CENTRAL,
    express30Min: true,
    sameDay: true,
    baseKm: 4,
  },
  411004: {
    area: "Deccan Gymkhana / FC Road",
    city: "Pune",
    hub: LAUNCH_GEO_HUBS.PUNE_CENTRAL,
    express30Min: true,
    sameDay: true,
    baseKm: 3,
  },
  411005: {
    area: "Shivajinagar",
    city: "Pune",
    hub: LAUNCH_GEO_HUBS.PUNE_CENTRAL,
    express30Min: true,
    sameDay: true,
    baseKm: 2,
  },
  411006: {
    area: "Yerawada / Koregaon Park",
    city: "Pune",
    hub: LAUNCH_GEO_HUBS.PUNE_CENTRAL,
    express30Min: true,
    sameDay: true,
    baseKm: 3,
  },
  411014: {
    area: "Viman Nagar / Wadgaon Sheri",
    city: "Pune",
    hub: LAUNCH_GEO_HUBS.PUNE_CENTRAL,
    express30Min: true,
    sameDay: true,
    baseKm: 6,
  },
  411016: {
    area: "Model Colony / SB Road",
    city: "Pune",
    hub: LAUNCH_GEO_HUBS.PUNE_CENTRAL,
    express30Min: true,
    sameDay: true,
    baseKm: 4,
  },
  411028: {
    area: "Hadapsar / Magarpatta",
    city: "Pune",
    hub: LAUNCH_GEO_HUBS.PUNE_CENTRAL,
    express30Min: true,
    sameDay: true,
    baseKm: 8,
  },
  411038: {
    area: "Kothrud",
    city: "Pune",
    hub: LAUNCH_GEO_HUBS.PUNE_CENTRAL,
    express30Min: true,
    sameDay: true,
    baseKm: 5,
  },
  411045: {
    area: "Baner / Balewadi",
    city: "Pune",
    hub: LAUNCH_GEO_HUBS.PUNE_CENTRAL,
    express30Min: true,
    sameDay: true,
    baseKm: 7,
  },
  411057: {
    area: "Wakad / Hinjawadi Phase 1",
    city: "Pune",
    hub: LAUNCH_GEO_HUBS.PUNE_CENTRAL,
    express30Min: true,
    sameDay: true,
    baseKm: 9,
  },

  // Pimpri-Chinchwad Municipal Corporation (PCMC)
  411017: {
    area: "Pimpri Colony",
    city: "Pimpri-Chinchwad",
    hub: LAUNCH_GEO_HUBS.PCMC_NORTH,
    express30Min: true,
    sameDay: true,
    baseKm: 4,
  },
  411018: {
    area: "PCMC Bhavan / Pimpri",
    city: "Pimpri-Chinchwad",
    hub: LAUNCH_GEO_HUBS.PCMC_NORTH,
    express30Min: true,
    sameDay: true,
    baseKm: 3,
  },
  411019: {
    area: "Chinchwad Station",
    city: "Pimpri-Chinchwad",
    hub: LAUNCH_GEO_HUBS.PCMC_NORTH,
    express30Min: true,
    sameDay: true,
    baseKm: 5,
  },
  411027: {
    area: "Sangvi / Pimple Gurav",
    city: "Pimpri-Chinchwad",
    hub: LAUNCH_GEO_HUBS.PCMC_NORTH,
    express30Min: true,
    sameDay: true,
    baseKm: 4,
  },
  411033: {
    area: "Thergaon / Kalewadi",
    city: "Pimpri-Chinchwad",
    hub: LAUNCH_GEO_HUBS.PCMC_NORTH,
    express30Min: true,
    sameDay: true,
    baseKm: 6,
  },
  411061: {
    area: "Pimple Saudagar",
    city: "Pimpri-Chinchwad",
    hub: LAUNCH_GEO_HUBS.PCMC_NORTH,
    express30Min: true,
    sameDay: true,
    baseKm: 3,
  },
};

export const deliveryService = {
  /**
   * Public guest/customer serviceability inquiry.
   * Does NOT require user authentication.
   */
  async evaluateServiceability({
    pincode,
    productWeightKg = 2.0,
    dimensions = null,
    deliveryClass = DELIVERY_CLASSES.STANDARD_PARCEL,
    sellerHubId = null,
  }) {
    // Simulated micro delay representing Edge Function round-trip
    await new Promise((resolve) => setTimeout(resolve, 150));

    const cleanPin = (pincode || "").trim();

    // 1. PIN Code Validation Check
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      return {
        isValid: false,
        isServiceable: false,
        error: "Please enter a valid 6-digit Indian Postal Code.",
      };
    }

    // 2. Zone Database Lookup
    const zoneData = SERVICEABLE_PINCODES_DB[cleanPin];

    // Out of primary launch network
    if (!zoneData) {
      return {
        isValid: true,
        isServiceable: false,
        pincode: cleanPin,
        message: `Pincode ${cleanPin} is currently outside our Pune, Pimpri-Chinchwad direct dispatch corridors. Standard national cargo dispatch will apply at checkout.`,
        deliveryOptions: [],
      };
    }

    // 3. Multi-Variable Method Computation
    const deliveryOptions = [];

    // Option A: 30-Minute Hyper-Local Express (Distance < 10km & Stock Ready)
    if (zoneData.express30Min) {
      const expressFee = productWeightKg > 10 ? 99 : 0; // Free promo for standard weight
      deliveryOptions.push({
        id: "opt-express-30min",
        name: "⚡ 30-Minute Priority Express",
        sla: "Within 30 Minutes",
        fee: expressFee,
        feeLabel: expressFee === 0 ? "FREE" : `₹${expressFee}`,
        badge: "FASTEST",
        description: `Dispatched directly from ${zoneData.hub} to ${zoneData.area}.`,
        cutoff: "Available 08:00 AM – 10:00 PM",
      });
    }

    // Option B: Same-Day / Next-Day Scheduled Ground Delivery
    if (zoneData.sameDay) {
      deliveryOptions.push({
        id: "opt-standard-scheduled",
        name: "Scheduled Ground Courier",
        sla: "Today / Next Morning",
        fee: 0,
        feeLabel: "FREE",
        badge: "POPULAR",
        description:
          "Enclosed in reinforced honeycomb cushioning with safe transit handling.",
        cutoff: "All Day",
      });
    }

    return {
      isValid: true,
      isServiceable: true,
      pincode: cleanPin,
      area: zoneData.area,
      city: zoneData.city,
      hub: zoneData.hub,
      deliveryOptions,
      unloadingPolicy:
        "Unloading and ground-level placement included. Upper-floor shifting excluded.",
      message: `Delivering to ${zoneData.area}, ${zoneData.city}`,
    };
  },
};
