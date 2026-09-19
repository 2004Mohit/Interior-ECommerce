import React from "react";
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

export const AdminProtectedRoute = ({ children }) => {
  const { adminUser, loading, isAdminAuthenticated } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6FA] text-xs font-bold text-[#173885] font-sans">
        Verifying administrator privileges...
      </div>
    );
  }

  if (!adminUser || !isAdminAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminProtectedRoute;
