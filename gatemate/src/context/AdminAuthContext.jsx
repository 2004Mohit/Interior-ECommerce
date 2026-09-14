import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import {
  adminPermissionService,
  ADMIN_PERMISSIONS,
} from "../services/adminPermissionService";

const AdminAuthContext = createContext({});

export const AdminAuthProvider = ({ children }) => {
  const { user, isAdmin, loading: authLoading, logout } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [loadingPerms, setLoadingPerms] = useState(true);

  const loadPermissions = useCallback(async () => {
    if (isAdmin && user) {
      setLoadingPerms(true);
      try {
        const permList = await adminPermissionService.getMyPermissions();
        setPermissions(permList || []);
      } catch {
        setPermissions(Object.values(ADMIN_PERMISSIONS));
      } finally {
        setLoadingPerms(false);
      }
    } else {
      setPermissions([]);
      setLoadingPerms(false);
    }
  }, [isAdmin, user]);

  useEffect(() => {
    if (!authLoading) {
      loadPermissions();
    }
  }, [authLoading, loadPermissions]);

  /**
   * Verifies if the authenticated admin has a specific permission
   */
  const hasPermission = useCallback(
    (permCode) => {
      if (!isAdmin) return false;
      // Super admin or full wildcard access
      if (
        permissions.includes("MANAGE_ALL") ||
        permissions.includes("ALL") ||
        permissions.length === 0
      ) {
        return true;
      }
      return permissions.includes(permCode);
    },
    [isAdmin, permissions],
  );

  /**
   * Verifies if the admin has AT LEAST ONE of the requested permissions
   */
  const hasAnyPermission = useCallback(
    (permCodes = []) => {
      if (!isAdmin) return false;
      if (
        permissions.includes("MANAGE_ALL") ||
        permissions.includes("ALL") ||
        permissions.length === 0
      ) {
        return true;
      }
      return permCodes.some((code) => permissions.includes(code));
    },
    [isAdmin, permissions],
  );

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser: isAdmin ? user : null,
        loading: authLoading || loadingPerms,
        permissions,
        hasPermission,
        hasAnyPermission,
        logoutAdmin: logout,
        isAdminAuthenticated: isAdmin,
        ADMIN_PERMISSIONS,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
