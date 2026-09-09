// Initial Launch Operational Geography (Pune Municipal Corporation + PCMC + Jodhpur Heritage Hub)
export const SUPPORTED_DELIVERY_ZONES = [
  // Pune Municipal Corporation (PMC)
  {
    pincode: "411001",
    area: "Pune Station / Camp",
    city: "Pune",
    isExpress30Min: true,
  },
  {
    pincode: "411004",
    area: "Deccan Gymkhana / FC Road",
    city: "Pune",
    isExpress30Min: true,
  },
  {
    pincode: "411005",
    area: "Shivajinagar",
    city: "Pune",
    isExpress30Min: true,
  },
  {
    pincode: "411006",
    area: "Yerawada / Koregaon Park",
    city: "Pune",
    isExpress30Min: true,
  },
  {
    pincode: "411014",
    area: "Viman Nagar / Wadgaon Sheri",
    city: "Pune",
    isExpress30Min: true,
  },
  {
    pincode: "411016",
    area: "Model Colony / SB Road",
    city: "Pune",
    isExpress30Min: true,
  },
  {
    pincode: "411028",
    area: "Hadapsar / Magarpatta",
    city: "Pune",
    isExpress30Min: true,
  },
  { pincode: "411038", area: "Kothrud", city: "Pune", isExpress30Min: true },
  {
    pincode: "411045",
    area: "Baner / Balewadi",
    city: "Pune",
    isExpress30Min: true,
  },
  {
    pincode: "411057",
    area: "Wakad / Hinjawadi Phase 1",
    city: "Pune",
    isExpress30Min: true,
  },

  // Pimpri-Chinchwad Municipal Corporation (PCMC)
  {
    pincode: "411017",
    area: "Pimpri Colony",
    city: "Pimpri-Chinchwad",
    isExpress30Min: true,
  },
  {
    pincode: "411018",
    area: "PCMC Bhavan / Pimpri",
    city: "Pimpri-Chinchwad",
    isExpress30Min: true,
  },
  {
    pincode: "411019",
    area: "Chinchwad Station",
    city: "Pimpri-Chinchwad",
    isExpress30Min: true,
  },
  {
    pincode: "411027",
    area: "Sangvi / Pimple Gurav",
    city: "Pimpri-Chinchwad",
    isExpress30Min: true,
  },
  {
    pincode: "411033",
    area: "Thergaon / Kalewadi",
    city: "Pimpri-Chinchwad",
    isExpress30Min: true,
  },
  {
    pincode: "411061",
    area: "Pimple Saudagar",
    city: "Pimpri-Chinchwad",
    isExpress30Min: true,
  },

  // Jodhpur Flagship Hub
  {
    pincode: "342001",
    area: "Old City Jodhpur",
    city: "Jodhpur",
    isExpress30Min: true,
  },
  {
    pincode: "342006",
    area: "Circuit House Road",
    city: "Jodhpur",
    isExpress30Min: true,
  },
  {
    pincode: "342011",
    area: "Umaid Heritage",
    city: "Jodhpur",
    isExpress30Min: true,
  },
];

const STORAGE_KEY = "gatemate_customer_addresses";

const INITIAL_MOCK_ADDRESSES = [
  {
    id: "addr-pune-1",
    fullName: "Aditya Rathore",
    phone: "9829012345",
    line1: "Flat 402, Royal Palms, Lane 7",
    locality: "Koregaon Park",
    landmark: "Near German Bakery",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411006",
    isDefault: true,
  },
  {
    id: "addr-pcmc-2",
    fullName: "Aditya Rathore",
    phone: "9829012345",
    line1: "Bungalow 18, Rose Valley Society",
    locality: "Pimple Saudagar",
    landmark: "Opposite Rosary School",
    city: "Pimpri-Chinchwad",
    state: "Maharashtra",
    pincode: "411061",
    isDefault: false,
  },
];

export const addressService = {
  // Check location eligibility independently from form rendering
  evaluateDeliveryEligibility(pincode) {
    const pin = (pincode || "").trim();
    if (!/^[1-9][0-9]{5}$/.test(pin)) {
      return {
        isValidFormat: false,
        isServiceable: false,
        isExpress30Min: false,
        message: "Enter a valid 6-digit Indian Postal Code.",
      };
    }

    const match = SUPPORTED_DELIVERY_ZONES.find((z) => z.pincode === pin);
    if (match) {
      return {
        isValidFormat: true,
        isServiceable: true,
        isExpress30Min: match.isExpress30Min,
        area: match.area,
        city: match.city,
        message: match.isExpress30Min
          ? `⚡ Serviceable in ${match.area}, ${match.city} (30-Minute Priority Express Dispatch Available)`
          : `Serviceable in ${match.city} (Standard 24-48h Delivery)`,
      };
    }

    return {
      isValidFormat: true,
      isServiceable: false,
      isExpress30Min: false,
      message:
        "Currently outside Pune, Pimpri-Chinchwad & Jodhpur instant delivery zones. Standard courier fulfillment will apply.",
    };
  },

  // Mock / LocalStorage Address Store (Supabase Drop-in Ready)
  async getAddresses(userId) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const saved = localStorage.getItem(`${STORAGE_KEY}_${userId || "guest"}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing stored addresses", e);
      }
    }
    return INITIAL_MOCK_ADDRESSES;
  },

  async saveAddress(userId, addressData) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    let addresses = await this.getAddresses(userId);

    if (addressData.isDefault) {
      addresses = addresses.map((a) => ({ ...a, isDefault: false }));
    }

    if (addressData.id) {
      // Edit existing
      addresses = addresses.map((a) =>
        a.id === addressData.id ? { ...addressData } : a,
      );
    } else {
      // Create new
      const newAddress = {
        ...addressData,
        id: `addr-${Date.now()}`,
        isDefault:
          addresses.length === 0 ? true : Boolean(addressData.isDefault),
      };
      addresses = [newAddress, ...addresses];
    }

    localStorage.setItem(
      `${STORAGE_KEY}_${userId || "guest"}`,
      JSON.stringify(addresses),
    );
    return addresses;
  },

  async setDefaultAddress(userId, addressId) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    let addresses = await this.getAddresses(userId);
    addresses = addresses.map((a) => ({
      ...a,
      isDefault: a.id === addressId,
    }));
    localStorage.setItem(
      `${STORAGE_KEY}_${userId || "guest"}`,
      JSON.stringify(addresses),
    );
    return addresses;
  },

  async deleteAddress(userId, addressId) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    let addresses = await this.getAddresses(userId);
    addresses = addresses.filter((a) => a.id !== addressId);
    if (addresses.length > 0 && !addresses.some((a) => a.isDefault)) {
      addresses[0].isDefault = true;
    }
    localStorage.setItem(
      `${STORAGE_KEY}_${userId || "guest"}`,
      JSON.stringify(addresses),
    );
    return addresses;
  },
};
