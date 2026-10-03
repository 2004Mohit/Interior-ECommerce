import React, { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useVendorAuth } from "../../context/VendorAuthContext";
import {
  vendorOnboardingService,
  VENDOR_APPLICATION_STATUS,
} from "../../services/vendorOnboardingService";
import { Lock, UserPlus, LogIn } from "lucide-react";

export const VendorProtectedRoute = ({ children, allowUnapproved = false }) => {
  const { vendorUser, loading: authLoading } = useVendorAuth();

  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState(null);
  const [applicationError, setApplicationError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadApplication = async () => {
      if (authLoading) {
        return;
      }

      if (!vendorUser) {
        if (mounted) {
          setApplication(null);
          setApplicationError(null);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setApplicationError(null);

        const currentApplication = await vendorOnboardingService.getApplication(
          vendorUser.id,
        );

        if (mounted) {
          setApplication(currentApplication);
        }
      } catch (error) {
        console.error("Failed to load vendor application:", error);

        if (mounted) {
          setApplication(null);
          setApplicationError(
            error?.message || "Unable to load vendor verification status.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadApplication();

    return () => {
      mounted = false;
    };
  }, [vendorUser, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center">
        <div className="gm-panel p-8 rounded-3xl h-48 animate-pulse bg-[#E4EEF3]" />
      </div>
    );
  }

  if (!vendorUser) {
    return (
      <div className="max-w-2xl mx-auto my-16 px-4 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-[#E4EEF3] text-[#173885] flex items-center justify-center mx-auto border border-[#D9E2EA]">
          <Lock className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-[#173885]">
            Vendor Account Required
          </h2>

          <p className="text-xs text-[#606460] max-w-md mx-auto mt-1 leading-relaxed">
            Please sign in to your vendor account to continue.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/vendor/login"
            className="w-full sm:w-auto btn-gm-primary px-6 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4 text-[#FEFEFE]" />
            <span>Sign In to Vendor Terminal</span>
          </Link>

          <Link
            to="/vendor/register"
            className="w-full sm:w-auto btn-gm-secondary px-6 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4 text-[#173885]" />
            <span>Register as Vendor</span>
          </Link>
        </div>
      </div>
    );
  }

  /*
   * Verification Status and other explicitly allowed routes must remain
   * accessible before vendor approval.
   */
  if (allowUnapproved) {
    return children;
  }

  /*
   * A vendor application is required before entering the protected
   * vendor terminal.
   */
  if (!application) {
    return <Navigate to="/vendor/onboarding" replace />;
  }

  /*
   * Only APPROVED vendors may enter the protected vendor portal.
   */
  if (application.status !== VENDOR_APPLICATION_STATUS.APPROVED) {
    return <Navigate to="/vendor/verification" replace />;
  }

  /*
   * Application is approved.
   */
  return children;
};
