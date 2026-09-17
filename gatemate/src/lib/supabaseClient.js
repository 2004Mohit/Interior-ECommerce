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
    } catch (error) {
      console.warn("Unable to write to sessionStorage:", error);
    }
  },

  removeItem: (key) => {
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(key);
      }
    } catch {
      return null;
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: tabScopedStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
