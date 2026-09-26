import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

import { useVendorAuth } from "../../context/VendorAuthContext";
import { SeoHead } from "../common/SeoHead";

export const VendorEmailVerificationCallback = () => {
  const navigate = useNavigate();

  const { completeVendorEmailVerification } = useVendorAuth();

  const [status, setStatus] = useState("processing");
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const completeVerification = async () => {
      try {
        /*
         * Supabase has already processed the verification
         * link when this page is loaded.
         *
         * Remove the temporary authenticated session so
         * the customer auth system cannot treat this user
         * as a normal customer session.
         */
        await completeVendorEmailVerification();

        if (!mounted) return;

        setStatus("success");

        /*
         * Give the user a moment to see the confirmation
         * message, then send them specifically to the
         * vendor login page.
         */
        setTimeout(() => {
          if (mounted) {
            navigate("/vendor/login", {
              replace: true,
              state: {
                emailVerified: true,
                message:
                  "Your email has been verified. Please sign in to your vendor account.",
              },
            });
          }
        }, 1200);
      } catch (err) {
        console.error("Vendor email verification callback failed:", err);

        if (!mounted) return;

        setError(err?.message || "We could not complete email verification.");

        setStatus("error");
      }
    };

    completeVerification();

    return () => {
      mounted = false;
    };
  }, [completeVendorEmailVerification, navigate]);

  return (
    <div className="min-h-screen bg-[#F4F6FA] flex items-center justify-center px-4 font-sans">
      <SeoHead
        title="Email Verification | Ferrado Vendor"
        description="Ferrado vendor email verification."
        canonicalUrl="/vendor/auth/callback"
        noIndex={true}
      />

      <div className="w-full max-w-md">
        <div className="bg-[#FEFEFE] border border-[#D9E2EA] rounded-3xl shadow-sm p-8 text-center">
          {status === "processing" && (
            <>
              <div className="mx-auto w-16 h-16 rounded-2xl bg-[#E4EEF3] flex items-center justify-center mb-5">
                <Loader2 className="w-7 h-7 text-[#173885] animate-spin" />
              </div>

              <h1 className="text-xl font-black text-[#173885]">
                Verifying Your Email
              </h1>

              <p className="mt-3 text-sm text-[#606460]">
                Please wait while we complete your vendor account verification.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto w-16 h-16 rounded-2xl bg-[#E1F2D9] flex items-center justify-center mb-5">
                <CheckCircle2 className="w-7 h-7 text-[#3F7D20]" />
              </div>

              <h1 className="text-xl font-black text-[#173885]">
                Email Verified Successfully
              </h1>

              <p className="mt-3 text-sm leading-6 text-[#606460]">
                Your vendor email has been verified.
              </p>

              <p className="mt-2 text-xs text-[#606460]">
                Redirecting you to Vendor Sign In...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto w-16 h-16 rounded-2xl bg-[#FBE3DE] flex items-center justify-center mb-5">
                <AlertCircle className="w-7 h-7 text-[#B43D20]" />
              </div>

              <h1 className="text-xl font-black text-[#173885]">
                Verification Problem
              </h1>

              <p className="mt-3 text-sm leading-6 text-[#606460]">{error}</p>

              <button
                type="button"
                onClick={() =>
                  navigate("/vendor/login", {
                    replace: true,
                  })
                }
                className="mt-6 w-full btn-gm-primary py-3 rounded-xl text-sm font-bold"
              >
                Go to Vendor Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
