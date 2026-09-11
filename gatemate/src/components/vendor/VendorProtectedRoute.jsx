import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AuthRequiredStateView } from "../common/StateViews";

export const VendorProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center">
        <div className="gm-panel p-8 rounded-3xl h-48 animate-pulse bg-[#E4EEF3]" />
      </div>
    );
  }

  // If visitor is unauthenticated, allow graceful prompt / onboarding
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <AuthRequiredStateView
          title="Sign In to Access Vendor Portal"
          description="Stockist operations, product inventory, and site dispatch schedules are restricted to verified vendor partners."
          onOpenAuth={() => {
            // Trigger login modal or redirect to /vendor/onboarding
            window.location.href = "/sell";
          }}
        />
      </div>
    );
  }

  return children;
};
