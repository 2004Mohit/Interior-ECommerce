import React, { createContext, useContext, useState, useEffect } from "react";

const VendorAuthContext = createContext({});

const VENDOR_AUTH_STORAGE_KEY = "gatemate_vendor_session_user";

export const VendorAuthProvider = ({ children }) => {
  const [vendorUser, setVendorUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(VENDOR_AUTH_STORAGE_KEY);
    if (stored) {
      try {
        setVendorUser(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse vendor session", e);
      }
    }
    setLoading(false);
  }, []);

  const loginVendor = async (email, password) => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Mock vendor authentication isolation
    const user = {
      id: "vnd-user-" + email.replace(/[^a-z0-9]/gi, ""),
      email,
      role: "VENDOR",
      businessName: "Pune Infrastructure Supplies Depot",
      loggedInAt: new Date().toISOString(),
    };

    localStorage.setItem(VENDOR_AUTH_STORAGE_KEY, JSON.stringify(user));
    setVendorUser(user);
    setLoading(false);
    return { user, error: null };
  };

  const logoutVendor = async () => {
    localStorage.removeItem(VENDOR_AUTH_STORAGE_KEY);
    setVendorUser(null);
  };

  return (
    <VendorAuthContext.Provider
      value={{
        vendorUser,
        loading,
        loginVendor,
        logoutVendor,
        isVendorAuthenticated: Boolean(vendorUser),
      }}
    >
      {children}
    </VendorAuthContext.Provider>
  );
};

export const useVendorAuth = () => useContext(VendorAuthContext);
