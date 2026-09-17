import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables in .env file.");
}

const tabScopedStorage = {
  getItem: (key) => {
    try {
      if (typeof window === "undefined") return null;
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn("Unable to write to sessionStorage:", e);
    }
  },
  removeItem: (key) => {
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(key);
      }
    } catch (e) {
      console.warn("Unable to remove from sessionStorage:", e);
    }
  },
};

// Standard Customer/Vendor Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: tabScopedStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Dedicated Isolated Admin Client (Prevents portal cross-contamination)
export const adminSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      getItem: (key) => tabScopedStorage.getItem(`admin_${key}`),
      setItem: (key, value) => tabScopedStorage.setItem(`admin_${key}`, value),
      removeItem: (key) => tabScopedStorage.removeItem(`admin_${key}`),
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
