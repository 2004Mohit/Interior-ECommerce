import React from "react";
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

export const AdminProtectedRoute = ({ children }) => {
  const { adminUser, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6FA] text-xs text-[#606460]">
        Verifying administrator authorization...
      </div>
    );
  }

  if (!adminUser || adminUser.role !== "ADMIN") {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};
