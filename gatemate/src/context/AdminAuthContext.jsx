import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const AdminAuthContext = createContext({});
const ADMIN_STORAGE_KEY = "gatemate_admin_session_user";

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (stored) {
      try {
        setAdminUser(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse admin session", e);
      }
    }
    setLoading(false);
  }, []);

  const loginAdmin = async (email, password) => {
    setLoading(true);
    const cleanEmail = (email || "").trim().toLowerCase();

    // Whitelist check for authorized admin operators
    if (cleanEmail === "admin@gatemate.in" && password === "admin123") {
      const user = {
        id: "adm-pune-hq-01",
        email: cleanEmail,
        name: "GateMate Operations Head (Pune Depot)",
        role: "ADMIN",
        permissions: [
          "MODERATE_VENDORS",
          "MODERATE_PRODUCTS",
          "MERGE_ATTRIBUTES",
          "OVERSEE_SETTLEMENTS",
        ],
        loggedInAt: new Date().toISOString(),
      };

      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(user));
      setAdminUser(user);
      setLoading(false);
      return { user, error: null };
    }

    setLoading(false);
    return {
      user: null,
      error: {
        message:
          "Invalid administrator credentials. Access restricted to GateMate staff.",
      },
    };
  };

  const logoutAdmin = () => {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    setAdminUser(null);
    window.location.href = "/admin/login";
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        loading,
        loginAdmin,
        logoutAdmin,
        isAdminAuthenticated: Boolean(adminUser),
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
