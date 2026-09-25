import { supabase } from "../lib/supabaseClient";

// Initial Launch Operational Geography (Pune Municipal Corporation + PCMC)
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
  {
    pincode: "411038",
    area: "Kothrud",
    city: "Pune",
    isExpress30Min: true,
  },
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
];

/**
 * Convert Supabase customer_addresses row
 * into the address object expected by the frontend.
 */
const normalizeAddress = (row) => ({
  id: row.id,
  fullName: row.recipient_name || "",
  phone: row.phone || "",
  line1: row.address_line1 || "",
  locality: row.locality || "",
  landmark: row.landmark || "",
  city: row.city || "Pune",
  state: row.state || "Maharashtra",
  pincode: row.pincode || "",
  addressType: row.address_type || "SITE",
  isDefault: Boolean(row.is_default),
  createdAt: row.created_at || null,
  updatedAt: row.updated_at || null,
});

/**
 * Common SELECT used for all address queries.
 *
 * DB columns:
 * recipient_name
 * address_line1
 * is_default
 *
 * Frontend fields:
 * fullName
 * line1
 * isDefault
 */
const ADDRESS_SELECT = `
  id,
  user_id,
  recipient_name,
  phone,
  address_line1,
  locality,
  city,
  state,
  pincode,
  landmark,
  address_type,
  is_default,
  created_at,
  updated_at
`;

export const addressService = {
  /**
   * Check whether a pincode is serviceable.
   */
  evaluateDeliveryEligibility(pincode) {
    const pin = String(pincode || "").trim();

    if (!/^[1-9][0-9]{5}$/.test(pin)) {
      return {
        isValidFormat: false,
        isServiceable: false,
        isExpress30Min: false,
        message: "Enter a valid 6-digit Indian Postal Code.",
      };
    }

    const match = SUPPORTED_DELIVERY_ZONES.find((zone) => zone.pincode === pin);

    if (match) {
      return {
        isValidFormat: true,
        isServiceable: true,
        isExpress30Min: match.isExpress30Min,
        area: match.area,
        city: match.city,
        message: match.isExpress30Min
          ? `Serviceable in ${match.area}, ${match.city} (30-Minute Priority Express Dispatch Available)`
          : `Serviceable in ${match.city} (Standard 24-48h Delivery)`,
      };
    }

    return {
      isValidFormat: true,
      isServiceable: false,
      isExpress30Min: false,
      message:
        "Currently outside Pune, Pimpri-Chinchwad instant delivery zones. Standard courier fulfillment will apply.",
    };
  },

  /**
   * Get all addresses for the logged-in customer.
   *
   * IMPORTANT:
   * This now reads directly from Supabase.
   * No localStorage/mock address fallback is used.
   */
  async getAddresses(userId) {
    if (!userId) {
      return [];
    }

    const { data, error } = await supabase
      .from("customer_addresses")
      .select(ADDRESS_SELECT)
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load customer addresses:", error);
      throw error;
    }

    return (data || []).map(normalizeAddress);
  },

  /**
   * Save a new address or update an existing address.
   */
  async saveAddress(userId, addressData) {
    if (!userId) {
      throw new Error("You must be signed in to save an address.");
    }

    const cleanPhone = String(addressData.phone || "")
      .replace(/\D/g, "")
      .slice(0, 10);

    const cleanPincode = String(addressData.pincode || "")
      .replace(/\D/g, "")
      .slice(0, 6);

    const recipientName = String(addressData.fullName || "").trim();
    const addressLine1 = String(addressData.line1 || "").trim();
    const locality = String(addressData.locality || "").trim();
    const city = String(addressData.city || "Pune").trim();
    const state = String(addressData.state || "Maharashtra").trim();
    const landmark = String(addressData.landmark || "").trim();

    // Validation
    if (!recipientName) {
      throw new Error("Please enter the contact name or site engineer name.");
    }

    if (!/^\d{10}$/.test(cleanPhone)) {
      throw new Error("Please enter a valid 10-digit mobile number.");
    }

    if (!addressLine1) {
      throw new Error("Please enter the site address.");
    }

    if (!locality) {
      throw new Error("Please enter the locality.");
    }

    if (!/^\d{6}$/.test(cleanPincode)) {
      throw new Error("Please enter a valid 6-digit pincode.");
    }

    /*
     * Check existing addresses.
     *
     * If this is the customer's first address,
     * automatically make it default.
     */
    const existingAddresses = await this.getAddresses(userId);

    const shouldBeDefault =
      existingAddresses.length === 0 || Boolean(addressData.isDefault);

    /*
     * If this address is going to be default,
     * remove default from all other addresses first.
     */
    if (shouldBeDefault) {
      const { error: clearDefaultError } = await supabase
        .from("customer_addresses")
        .update({
          is_default: false,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("is_default", true);

      if (clearDefaultError) {
        throw clearDefaultError;
      }
    }

    const payload = {
      user_id: userId,
      recipient_name: recipientName,
      phone: cleanPhone,
      address_line1: addressLine1,
      locality,
      city,
      state,
      pincode: cleanPincode,
      landmark: landmark || null,
      address_type: addressData.addressType || "SITE",
      is_default: shouldBeDefault,
      updated_at: new Date().toISOString(),
    };

    let savedAddress;

    /*
     * UPDATE EXISTING ADDRESS
     */
    if (addressData.id) {
      const { data, error } = await supabase
        .from("customer_addresses")
        .update(payload)
        .eq("id", addressData.id)
        .eq("user_id", userId)
        .select(ADDRESS_SELECT)
        .single();

      if (error) {
        throw error;
      }

      savedAddress = data;
    } else {
      /*
       * INSERT NEW ADDRESS
       */
      const { data, error } = await supabase
        .from("customer_addresses")
        .insert({
          ...payload,
          is_default: shouldBeDefault,
        })
        .select(ADDRESS_SELECT)
        .single();

      if (error) {
        throw error;
      }

      savedAddress = data;
    }

    /*
     * Safety check:
     * if saved address is default, make sure every
     * other address is NOT default.
     */
    if (savedAddress?.is_default) {
      const { error: clearOthersError } = await supabase
        .from("customer_addresses")
        .update({
          is_default: false,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .neq("id", savedAddress.id)
        .eq("is_default", true);

      if (clearOthersError) {
        throw clearOthersError;
      }

      /*
       * Re-assert saved address as default.
       */
      const { error: restoreDefaultError } = await supabase
        .from("customer_addresses")
        .update({
          is_default: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", savedAddress.id)
        .eq("user_id", userId);

      if (restoreDefaultError) {
        throw restoreDefaultError;
      }
    }

    /*
     * Return fresh DB data instead of returning
     * local/form data.
     */
    return this.getAddresses(userId);
  },

  /**
   * Set an address as the customer's default address.
   */
  async setDefaultAddress(userId, addressId) {
    if (!userId || !addressId) {
      return [];
    }

    /*
     * Remove default from existing default address.
     */
    const { error: clearError } = await supabase
      .from("customer_addresses")
      .update({
        is_default: false,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("is_default", true);

    if (clearError) {
      throw clearError;
    }

    /*
     * Set selected address as default.
     */
    const { error: setError } = await supabase
      .from("customer_addresses")
      .update({
        is_default: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", addressId)
      .eq("user_id", userId);

    if (setError) {
      throw setError;
    }

    return this.getAddresses(userId);
  },

  /**
   * Delete an address.
   */
  async deleteAddress(userId, addressId) {
    if (!userId || !addressId) {
      return [];
    }

    /*
     * Check whether the address being deleted
     * is currently the default address.
     */
    const { data: targetAddress, error: targetError } = await supabase
      .from("customer_addresses")
      .select("id, is_default")
      .eq("id", addressId)
      .eq("user_id", userId)
      .single();

    if (targetError) {
      throw targetError;
    }

    /*
     * Delete address.
     */
    const { error: deleteError } = await supabase
      .from("customer_addresses")
      .delete()
      .eq("id", addressId)
      .eq("user_id", userId);

    if (deleteError) {
      throw deleteError;
    }

    /*
     * If deleted address was default,
     * promote the oldest remaining address.
     */
    if (targetAddress?.is_default) {
      const { data: remaining, error: remainingError } = await supabase
        .from("customer_addresses")
        .select("id")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(1);

      if (remainingError) {
        throw remainingError;
      }

      if (remaining?.[0]?.id) {
        const { error: promoteError } = await supabase
          .from("customer_addresses")
          .update({
            is_default: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", remaining[0].id)
          .eq("user_id", userId);

        if (promoteError) {
          throw promoteError;
        }
      }
    }

    /*
     * Always return fresh addresses from DB.
     */
    return this.getAddresses(userId);
  },
};
