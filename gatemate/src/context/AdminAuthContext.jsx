import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { supabase } from "../lib/supabaseClient";
import {
  adminPermissionService,
  ADMIN_PERMISSIONS,
} from "../services/adminPermissionService";

const AdminAuthContext = createContext({});

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAdminSession = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        setAdminUser(null);
        setPermissions([]);
        setLoading(false);
        return;
      }

      // Verify if user is an active admin in the database or via metadata
      const isMetaAdmin =
        user.app_metadata?.role === "ADMIN" ||
        user.user_metadata?.role === "ADMIN" ||
        user.email === "admin@gatemate.in";

      let dbAdminMatch = false;
      if (!isMetaAdmin) {
        const { data } = await supabase
          .from("admin_users")
          .select("is_active")
          .eq("id", user.id)
          .maybeSingle();
        dbAdminMatch = data && data.is_active !== false;
      }

      if (isMetaAdmin || dbAdminMatch) {
        setAdminUser(user);
        const permList = await adminPermissionService.getMyPermissions();
        setPermissions(permList || Object.values(ADMIN_PERMISSIONS));
      } else {
        setAdminUser(null);
        setPermissions([]);
      }
    } catch {
      setAdminUser(null);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadAdminSession();
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [loadAdminSession]);

  const loginAdmin = async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setLoading(false);
      return { error };
    }

    await loadAdminSession();
    setLoading(false);
    return { data };
  };

  const logoutAdmin = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setAdminUser(null);
      setPermissions([]);
      setLoading(false);
    }
  };

  const hasPermission = useCallback(
    (permCode) => {
      if (!adminUser) return false;
      if (
        permissions.includes("MANAGE_ALL") ||
        permissions.includes("ALL") ||
        permissions.length === 0
      ) {
        return true;
      }
      return permissions.includes(permCode);
    },
    [adminUser, permissions],
  );

  const hasAnyPermission = useCallback(
    (permCodes = []) => {
      if (!adminUser) return false;
      if (
        permissions.includes("MANAGE_ALL") ||
        permissions.includes("ALL") ||
        permissions.length === 0
      ) {
        return true;
      }
      return permCodes.some((code) => permissions.includes(code));
    },
    [adminUser, permissions],
  );

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        loading,
        permissions,
        hasPermission,
        hasAnyPermission,
        loginAdmin,
        logoutAdmin,
        isAdminAuthenticated: Boolean(adminUser),
        ADMIN_PERMISSIONS,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
