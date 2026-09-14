import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { roleService, USER_ROLES } from "../services/roleService";

const VendorAuthContext = createContext({});

const VENDOR_AUTH_STORAGE_KEY = "gatemate_vendor_session_user";
const VENDOR_ACCOUNTS_STORAGE_KEY = "gatemate_vendor_registered_accounts";
const VENDOR_APP_STORAGE_PREFIX = "gatemate_vendor_application_";

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

  /**
   * Dedicated Vendor Account Registration (Email + Password only, no mobile OTP)
   */
  const registerVendor = async ({
    businessName,
    contactPerson,
    email,
    password,
  }) => {
    setLoading(true);
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail || !password || password.length < 6) {
      setLoading(false);
      return {
        user: null,
        error: {
          message:
            "Please provide a valid email and password of at least 6 characters.",
        },
      };
    }

    // Check if account already exists
    const accounts = JSON.parse(
      localStorage.getItem(VENDOR_ACCOUNTS_STORAGE_KEY) || "[]",
    );
    const existing = accounts.find((a) => a.email === cleanEmail);
    if (existing) {
      setLoading(false);
      return {
        user: null,
        error: {
          message:
            "A vendor account is already registered with this email address. Please sign in.",
        },
      };
    }

    const newAccount = {
      id: `vnd-${Date.now()}`,
      email: cleanEmail,
      password, // Mock storage authentication
      businessName: businessName.trim() || "Construction Depot Partner",
      contactPerson: contactPerson.trim() || "Depot Manager",
      role: "VENDOR",
      createdAt: new Date().toISOString(),
    };

    accounts.push(newAccount);
    localStorage.setItem(VENDOR_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));

    setLoading(false);
    return { user: newAccount, error: null };
  };

  /**
   * Vendor Terminal Sign In with dynamic routing decisions
   */
  const loginVendor = async (email, password) => {
    setLoading(true);
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail || !password) {
      setLoading(false);
      return {
        user: null,
        error: {
          message:
            "Please enter both your registered vendor email and password.",
        },
      };
    }

    // =========================================================================
    // ADMIN CHECK: Authenticate with Supabase to check for ADMIN role
    // =========================================================================
    try {
      const { data: supaData, error: supaError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (!supaError && supaData?.user) {
        const detectedRole = await roleService.resolveUserRole(supaData.user);
        if (detectedRole === USER_ROLES.ADMIN) {
          setLoading(false);
          return {
            user: supaData.user,
            error: null,
            destination: "/admin",
          };
        }
      }
    } catch {
      // If Supabase check fails or user is not in Supabase, continue with vendor login flow
    }

    // Demo account whitelist fallback
    if (
      cleanEmail === "depot@punemegaconstruct.in" &&
      password === "password123"
    ) {
      const demoUser = {
        id: "vnd-pune-001",
        email: cleanEmail,
        role: "VENDOR",
        businessName: "Pune Mega Infrastructure Depot",
        isOnboardingComplete: true,
        status: "APPROVED",
        loggedInAt: new Date().toISOString(),
      };
      localStorage.setItem(VENDOR_AUTH_STORAGE_KEY, JSON.stringify(demoUser));
      setVendorUser(demoUser);
      setLoading(false);
      return { user: demoUser, error: null, destination: "/vendor/dashboard" };
    }

    // 1. Check registered vendor accounts repository
    const accounts = JSON.parse(
      localStorage.getItem(VENDOR_ACCOUNTS_STORAGE_KEY) || "[]",
    );
    const account = accounts.find((a) => a.email === cleanEmail);

    if (!account) {
      setLoading(false);
      return {
        user: null,
        error: {
          code: "VENDOR_NOT_REGISTERED",
          message:
            "No registered vendor account found with this email. Please register as a vendor first.",
        },
        destination: "/vendor/register",
      };
    }

    if (account.password !== password) {
      setLoading(false);
      return {
        user: null,
        error: { message: "Invalid password. Please check your credentials." },
      };
    }

    // 2. Check if onboarding application has been submitted/approved
    let application = null;
    try {
      const localApp = localStorage.getItem(
        `${VENDOR_APP_STORAGE_PREFIX}${account.id}`,
      );
      if (localApp) {
        application = JSON.parse(localApp);
      }
    } catch (e) {
      console.error("App lookup error", e);
    }

    const isOnboardingComplete = Boolean(
      application && application.status === "APPROVED",
    );
    const userSession = {
      id: account.id,
      email: cleanEmail,
      role: "VENDOR",
      businessName: account.businessName,
      isOnboardingComplete,
      status: application?.status || "DRAFT",
      loggedInAt: new Date().toISOString(),
    };

    localStorage.setItem(VENDOR_AUTH_STORAGE_KEY, JSON.stringify(userSession));
    setVendorUser(userSession);
    setLoading(false);

    // Destination guidance
    let destination = "/vendor/onboarding";
    if (application) {
      if (application.status === "APPROVED") {
        destination = "/vendor/dashboard";
      } else {
        destination = "/vendor/verification";
      }
    }

    return { user: userSession, error: null, destination };
  };

  /**
   * Complete Vendor Logout and Redirect
   */
  const logoutVendor = () => {
    localStorage.removeItem(VENDOR_AUTH_STORAGE_KEY);
    setVendorUser(null);
    window.location.href = "/sell";
  };

  return (
    <VendorAuthContext.Provider
      value={{
        vendorUser,
        loading,
        registerVendor,
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
