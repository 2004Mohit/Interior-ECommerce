import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables in .env file.");
}

/**
 * Custom Tab-Isolated Storage Adapter
 * Uses window.sessionStorage so login state is isolated strictly to the active browser tab.
 */
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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Isolate session persistence strictly to the active tab
    storage: tabScopedStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
