import { createClient } from "@supabase/supabase-js";

/*
 * ============================================================
 * ENVIRONMENT
 * ============================================================
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing Supabase environment variables. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  );
}

/*
 * ============================================================
 * BROWSER SESSION STORAGE
 * ============================================================
 *
 * sessionStorage is intentionally used so authentication is
 * scoped to the current browser tab.
 *
 * This allows different tabs to maintain different portal
 * sessions.
 */

const browserSessionStorage =
  typeof window !== "undefined" ? window.sessionStorage : undefined;

/*
 * ============================================================
 * ROLE-SPECIFIC STORAGE KEYS
 * ============================================================
 *
 * Each portal gets its own authentication storage key.
 *
 * Customer:
 *   gatemate-customer-auth
 *
 * Vendor:
 *   gatemate-vendor-auth
 *
 * Admin:
 *   gatemate-admin-auth
 */

export const ROLE_STORAGE_KEYS = {
  CUSTOMER: "gatemate-customer-auth",
  VENDOR: "gatemate-vendor-auth",
  ADMIN: "gatemate-admin-auth",
};

/*
 * ============================================================
 * CURRENT PORTAL DETECTION
 * ============================================================
 *
 * The generic `supabase` client is used by many existing
 * services in the application.
 *
 * Its storage key is selected according to the current route.
 *
 * /admin/*  -> Admin storage
 * /vendor/* -> Vendor storage
 * /sell/*   -> Vendor storage
 * everything else -> Customer storage
 */

export const getCurrentPortalRole = () => {
  if (typeof window === "undefined") {
    return "CUSTOMER";
  }

  const pathname = window.location.pathname.toLowerCase();

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return "ADMIN";
  }

  if (
    pathname === "/vendor" ||
    pathname.startsWith("/vendor/") ||
    pathname === "/sell" ||
    pathname.startsWith("/sell/")
  ) {
    return "VENDOR";
  }

  return "CUSTOMER";
};

/*
 * ============================================================
 * PORTAL-SCOPED STORAGE ADAPTER
 * ============================================================
 *
 * Supabase expects a storage object with:
 *
 *   getItem()
 *   setItem()
 *   removeItem()
 *
 * The adapter dynamically chooses the correct storage key
 * according to the current portal.
 */

const portalScopedStorage = {
  getItem: (key) => {
    if (!browserSessionStorage) {
      return null;
    }

    const role = getCurrentPortalRole();

    const storageKey = ROLE_STORAGE_KEYS[role] || key;

    return browserSessionStorage.getItem(storageKey);
  },

  setItem: (key, value) => {
    if (!browserSessionStorage) {
      return;
    }

    const role = getCurrentPortalRole();

    const storageKey = ROLE_STORAGE_KEYS[role] || key;

    browserSessionStorage.setItem(storageKey, value);
  },

  removeItem: (key) => {
    if (!browserSessionStorage) {
      return;
    }

    const role = getCurrentPortalRole();

    const storageKey = ROLE_STORAGE_KEYS[role] || key;

    browserSessionStorage.removeItem(storageKey);
  },
};

/*
 * ============================================================
 * CUSTOMER SUPABASE CLIENT
 * ============================================================
 *
 * Customer authentication is isolated from Vendor and Admin
 * authentication.
 */

export const supabaseCustomer = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: browserSessionStorage,
    storageKey: ROLE_STORAGE_KEYS.CUSTOMER,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

/*
 * ============================================================
 * VENDOR SUPABASE CLIENT
 * ============================================================
 *
 * Vendor authentication is isolated from Customer and Admin
 * authentication.
 */

export const supabaseVendor = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: browserSessionStorage,
    storageKey: ROLE_STORAGE_KEYS.VENDOR,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

/*
 * ============================================================
 * ADMIN SUPABASE CLIENT
 * ============================================================
 *
 * Admin authentication is isolated from Customer and Vendor
 * authentication.
 */

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: browserSessionStorage,
    storageKey: ROLE_STORAGE_KEYS.ADMIN,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

/*
 * ============================================================
 * TRANSFER AUTH SESSION
 * ============================================================
 *
 * Used when authentication happens through one portal but the
 * authenticated account belongs to another portal.
 *
 * Example:
 *
 * Vendor Sign In
 *      ↓
 * supabaseVendor.signInWithPassword()
 *      ↓
 * Detect app_metadata.role === ADMIN
 *      ↓
 * transferAuthSession()
 *      ↓
 * supabaseAdmin
 *      ↓
 * /admin/dashboard
 *
 * This allows Admin accounts to use the Vendor Sign In page
 * while keeping the actual Admin session inside the Admin
 * storage key.
 */

export const transferAuthSession = async (session, targetClient) => {
  if (!session?.access_token || !session?.refresh_token) {
    throw new Error(
      "Unable to transfer authentication session. Missing authentication tokens.",
    );
  }

  if (!targetClient?.auth?.setSession) {
    throw new Error(
      "Unable to transfer authentication session. Invalid Supabase client.",
    );
  }

  const { data, error } = await targetClient.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  if (error) {
    console.error("Failed to transfer authentication session:", error);
    throw error;
  }

  return data;
};

/*
 * ============================================================
 * GENERIC SUPABASE CLIENT
 * ============================================================
 *
 * IMPORTANT:
 *
 * Keep this export because many existing GateMate services
 * already import:
 *
 *   import { supabase } from "../lib/supabaseClient";
 *
 * Its storage automatically follows the current portal route.
 *
 * Do NOT replace all existing service imports just because
 * role-specific clients were introduced.
 */

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: portalScopedStorage,
    storageKey: "gatemate-portal-auth",
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
