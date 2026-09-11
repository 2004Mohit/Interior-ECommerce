import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useVendorAuth } from "../../context/VendorAuthContext";
import {
  vendorOnboardingService,
  VENDOR_APPLICATION_STATUS,
} from "../../services/vendorOnboardingService";
import {
  Lock,
  Clock,
  AlertCircle,
  ArrowRight,
  FileText,
  UserPlus,
  LogIn,
} from "lucide-react";

export const VendorProtectedRoute = ({ children }) => {
  const { vendorUser, loading: authLoading } = useVendorAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && vendorUser) {
      vendorOnboardingService.getApplication(vendorUser.id).then((app) => {
        setApplication(app);
        setLoading(false);
      });
    } else if (!authLoading && !vendorUser) {
      setLoading(false);
    }
  }, [vendorUser, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center">
        <div className="gm-panel p-8 rounded-3xl h-48 animate-pulse bg-[#E4EEF3]" />
      </div>
    );
  }

  // 1. Unauthenticated Vendor Guard -> Prompts Vendor Sign In / Onboarding
  if (!vendorUser) {
    return (
      <div className="max-w-2xl mx-auto my-16 px-4 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-[#E4EEF3] text-[#173885] flex items-center justify-center mx-auto border border-[#D9E2EA]">
          <Lock className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-[#173885]">
            Vendor Terminal Authentication Required
          </h2>
          <p className="text-xs text-[#606460] max-w-md mx-auto mt-1 leading-relaxed">
            Please sign in to your vendor account or register your depot to
            access the stockist terminal.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/vendor/login"
            className="w-full sm:w-auto btn-gm-primary px-6 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
          >
            <LogIn className="w-4 h-4 text-[#FEFEFE]" />
            <span>Sign In to Vendor Terminal</span>
          </Link>

          <Link
            to="/vendor/onboarding"
            className="w-full sm:w-auto btn-gm-secondary px-6 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4 text-[#173885]" />
            <span>Register as Vendor</span>
          </Link>
        </div>
      </div>
    );
  }

  // 2. Draft / Unsubmitted Application Guard
  if (!application || application.status === VENDOR_APPLICATION_STATUS.DRAFT) {
    return (
      <div className="max-w-3xl mx-auto my-16 px-4 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#E4EEF3] text-[#173885] flex items-center justify-center mx-auto border border-[#D9E2EA]">
          <FileText className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-[#173885]">
          Complete Vendor Onboarding
        </h2>
        <p className="text-xs text-[#606460] max-w-md mx-auto leading-relaxed">
          Please complete and submit your depot registration form to enable
          listing construction products on GateMate.
        </p>
        <Link
          to="/vendor/onboarding"
          className="btn-gm-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold shadow-sm"
        >
          <span>Continue Onboarding Form</span>
          <ArrowRight className="w-4 h-4 text-[#FEFEFE]" />
        </Link>
      </div>
    );
  }

  // 3. Submitted / Under Review Guard
  if (
    application.status === VENDOR_APPLICATION_STATUS.SUBMITTED ||
    application.status === VENDOR_APPLICATION_STATUS.UNDER_REVIEW
  ) {
    return (
      <div className="max-w-3xl mx-auto my-16 px-4 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#E3EBFA] text-[#173885] flex items-center justify-center mx-auto border border-[#2E4D94]/30">
          <Clock className="w-7 h-7 text-[#3C7DDA]" />
        </div>
        <h2 className="text-2xl font-black text-[#173885]">
          Depot Verification in Progress
        </h2>
        <p className="text-xs text-[#606460] max-w-md mx-auto leading-relaxed">
          Your vendor application is currently under review by our contractor
          verification desk. Active listing and dispatch features will unlock
          upon approval.
        </p>
        <Link
          to="/vendor/verification"
          className="btn-gm-secondary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold"
        >
          <span>Inspect Application Status</span>
        </Link>
      </div>
    );
  }

  // 4. Changes Requested Guard
  if (application.status === VENDOR_APPLICATION_STATUS.CHANGES_REQUESTED) {
    return (
      <div className="max-w-3xl mx-auto my-16 px-4 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#FFF0D5] text-[#A66A08] flex items-center justify-center mx-auto border border-[#A66A08]/30">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-[#173885]">
          Updates Required on Application
        </h2>
        <p className="text-xs text-[#606460] max-w-md mx-auto leading-relaxed">
          {application.reviewerNotes ||
            "Please update your uploaded documents or business details to proceed with vendor approval."}
        </p>
        <Link
          to="/vendor/verification"
          className="btn-gm-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold"
        >
          <span>Review Feedback & Update</span>
          <ArrowRight className="w-4 h-4 text-[#FEFEFE]" />
        </Link>
      </div>
    );
  }

  // 5. Approved Vendor Allowed
  return children;
};
