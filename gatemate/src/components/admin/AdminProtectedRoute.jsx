import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { USER_ROLES } from "../../services/roleService";

export const AdminProtectedRoute = ({ children }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6FA] text-xs font-bold text-[#173885] font-sans">
        Verifying administrator privileges...
      </div>
    );
  }

  // Not logged in or not admin
  if (!user || role !== USER_ROLES.ADMIN) {
    return <Navigate to="/" replace />;
  }

  return children;
};
