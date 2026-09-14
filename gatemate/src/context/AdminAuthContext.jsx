import React, { createContext, useContext } from "react";
import { useAuth } from "./AuthContext";

const AdminAuthContext = createContext({});

export const AdminAuthProvider = ({ children }) => {
  const { user, role, loading, logout, isAdmin } = useAuth();

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser: isAdmin ? user : null,
        loading,
        logoutAdmin: logout,
        isAdminAuthenticated: isAdmin,
        role,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
