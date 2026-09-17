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
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      const user = session?.user;

      if (!user) {
        setAdminUser(null);
        setPermissions([]);
        return;
      }

      /*
       * IMPORTANT:
       * Admin status is determined by the database RPC.
       *
       * We do NOT trust:
       * - user_metadata
       * - app_metadata
       * - email address
       * - frontend hardcoded values
       */
      const { data: role, error: roleError } =
        await supabase.rpc("get_auth_role");

      if (roleError) {
        throw roleError;
      }

      if (role !== "ADMIN") {
        setAdminUser(null);
        setPermissions([]);
        return;
      }

      const permList = await adminPermissionService.getMyPermissions();

      setAdminUser(user);
      setPermissions(permList);
    } catch (error) {
      console.error("Admin session verification failed:", error);

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
    } = supabase.auth.onAuthStateChange((_event, _session) => {
      loadAdminSession();
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [loadAdminSession]);

  const loginAdmin = async (email, password) => {
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        return { error };
      }

      /*
       * Verify that the authenticated account is actually
       * registered as an active GateMate Admin.
       */
      const { data: role, error: roleError } =
        await supabase.rpc("get_auth_role");

      if (roleError) {
        await supabase.auth.signOut();

        return {
          error: {
            message: "Unable to verify administrator access.",
          },
        };
      }

      if (role !== "ADMIN") {
        await supabase.auth.signOut();

        return {
          error: {
            message:
              "This account does not have GateMate administrator access.",
          },
        };
      }

      const permList = await adminPermissionService.getMyPermissions();

      setAdminUser(data.user);
      setPermissions(permList);

      return { data };
    } finally {
      setLoading(false);
    }
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

      return (
        permissions.includes("MANAGE_ALL") ||
        permissions.includes("ALL") ||
        permissions.includes(permCode)
      );
    },
    [adminUser, permissions],
  );

  const hasAnyPermission = useCallback(
    (permCodes = []) => {
      if (!adminUser) return false;

      if (permissions.includes("MANAGE_ALL") || permissions.includes("ALL")) {
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
