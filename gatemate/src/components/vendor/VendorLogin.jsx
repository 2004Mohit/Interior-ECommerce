import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";

import {
  supabaseVendor,
  supabaseAdmin,
  transferAuthSession,
} from "../../lib/supabaseClient";
import { useVendorAuth } from "../../context/VendorAuthContext";
import { vendorIdentityService } from "../../services/vendorIdentityService";
import { ForgotPasswordModal } from "../common/ForgotPasswordModal";
import { SeoHead } from "../common/SeoHead";

export const VendorLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { login, loading: authLoading } = useVendorAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  useEffect(() => {
    if (location.state?.emailVerified) {
      setSuccess(
        location.state.message ||
          "Your email has been verified. Please sign in to your vendor account.",
      );

      navigate(location.pathname, {
        replace: true,
        state: {},
      });
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);
    setSuccess(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your registered vendor email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      /*
       * ---------------------------------------------------------
       * 1. AUTHENTICATE WITH SUPABASE
       * ---------------------------------------------------------
       */
      const result = await login(cleanEmail, password);

      const authenticatedUser = result?.user;

      if (!authenticatedUser?.id) {
        throw new Error("Unable to identify the authenticated account.");
      }

      /*
       * ---------------------------------------------------------
       * 2. CHECK ADMIN ROLE FIRST
       * ---------------------------------------------------------
       *
       * Admin authorization is stored in Supabase Auth
       * app_metadata.
       *
       * ADMIN accounts must be allowed to enter the Admin
       * Portal even when they do not have a vendor_profiles row.
       */
      const appRole =
        authenticatedUser.app_metadata?.role ||
        authenticatedUser.app_metadata?.ROLE;

      if (appRole === "ADMIN") {
        /*
         * The login happened through supabaseVendor.
         *
         * Move the authenticated session into the dedicated
         * Admin Supabase client before navigating to the Admin portal.
         */
        await transferAuthSession(result.session, supabaseAdmin);

        /*
         * Remove only the temporary Vendor-client session.
         * Do NOT use global signOut because we do not want to
         * invalidate the authenticated Supabase session.
         */
        await supabaseVendor.auth.signOut({
          scope: "local",
        });

        navigate("/admin/dashboard", {
          replace: true,
        });

        return;
      }

      /*
       * ---------------------------------------------------------
       * 3. VERIFY THAT THIS IS A VENDOR ACCOUNT
       * ---------------------------------------------------------
       */
      const accountType =
        authenticatedUser.user_metadata?.account_type ||
        authenticatedUser.user_metadata?.accountType;

      if (accountType !== "VENDOR") {
        setError(
          "This account is not registered as a vendor account. Please use the appropriate sign-in portal.",
        );

        return;
      }

      /*
       * ---------------------------------------------------------
       * 4. RESOLVE VENDOR PROFILE
       * ---------------------------------------------------------
       *
       * auth.users.id and vendor_profiles.id are different IDs.
       *
       * A newly registered vendor may not have a vendor profile
       * until the application has been processed/approved.
       */
      let vendorProfileId = null;

      try {
        vendorProfileId = await vendorIdentityService.getVendorProfileId();
      } catch (profileError) {
        const message = profileError?.message?.toLowerCase() || "";

        /*
         * No vendor profile is an expected state for a vendor
         * who has registered but has not yet been approved.
         */
        if (
          message.includes("vendor profile not found") ||
          message.includes("vendor may not be approved")
        ) {
          navigate("/vendor/verification", {
            replace: true,
          });

          return;
        }

        throw profileError;
      }

      /*
       * ---------------------------------------------------------
       * 5. VENDOR PROFILE DOES NOT EXIST
       * ---------------------------------------------------------
       */
      if (!vendorProfileId) {
        navigate("/vendor/verification", {
          replace: true,
        });

        return;
      }

      /*
       * ---------------------------------------------------------
       * 6. APPROVED/ACTIVE VENDOR
       * ---------------------------------------------------------
       */
      navigate("/vendor/dashboard", {
        replace: true,
      });
    } catch (err) {
      console.error("Vendor login failed:", err);

      const message =
        err?.message || "Unable to sign into your vendor account.";

      /*
       * Supabase returns this when email confirmation has
       * not been completed.
       */
      if (message.toLowerCase().includes("email not confirmed")) {
        setError(
          "Your email address has not been verified yet. Please open the verification email sent to your registered email address and click the verification link.",
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccount = () => {
    setEmail("depot@punemegaconstruct.in");
    setPassword("password123");
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <SeoHead
        title="Vendor Sign In | GateMate Vendor Portal"
        description="Sign in to your GateMate vendor portal to manage construction products, orders, inventory, and business operations."
        canonicalUrl="/vendor/login"
        noIndex={true}
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link to="/sell" className="inline-flex flex-col select-none">
          <span className="text-3xl font-black tracking-tight leading-none">
            <span className="text-[#173885]">GATE</span>
            <span className="text-[#3C7DDA]">MATE</span>
          </span>

          <span className="text-[10px] font-bold uppercase tracking-widest text-[#3C7DDA] mt-1">
            Vendor Portal
          </span>
        </Link>

        <h2 className="text-xl font-black text-[#173885]">Vendor Sign In</h2>

        <p className="text-xs text-[#606460]">
          Sign in to manage your construction products, inventory, and orders.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="gm-panel p-6 sm:p-8 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-5 shadow-xs">
          {success && (
            <div className="p-3.5 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/20 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#3F7D20] shrink-0 mt-0.5" />

              <span className="text-xs font-semibold text-[#3F7D20] leading-5">
                {success}
              </span>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />

              <span className="break-words">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* EMAIL */}
            <div>
              <label className="text-xs font-bold text-[#282926] block mb-1">
                Registered Vendor Email *
              </label>

              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[#6F8A92]" />

                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="business@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full gm-input pl-10 pr-3.5 py-2.5 rounded-xl text-xs"
                  disabled={loading || authLoading}
                />
              </div>

              <p className="text-[10px] text-[#6F8A92] mt-1">
                Demo Account:{" "}
                <button
                  type="button"
                  onClick={handleDemoAccount}
                  className="text-[#3C7DDA] hover:underline font-bold font-mono"
                >
                  depot@punemegaconstruct.in
                </button>
              </p>
            </div>

            {/* PASSWORD */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-[#282926]">
                  Vendor Password *
                </label>

                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-[11px] text-[#3C7DDA] font-semibold hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#6F8A92]" />

                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full gm-input pl-10 pr-11 py-2.5 rounded-xl text-xs"
                  disabled={loading || authLoading}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6F8A92] hover:text-[#173885] transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading || authLoading}
              className="w-full btn-gm-primary py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>
                {loading ? "Signing In..." : "Sign In to Vendor Portal"}
              </span>

              {!loading && <ArrowRight className="w-4 h-4 text-[#FEFEFE]" />}
            </button>
          </form>

          {/* REGISTRATION */}
          <div className="pt-4 border-t border-[#D9E2EA] flex flex-col gap-2 text-center text-xs text-[#606460]">
            <span>
              New vendor?{" "}
              <Link
                to="/vendor/register"
                className="text-[#3C7DDA] font-bold hover:underline"
              >
                Register as Vendor
              </Link>
            </span>

            <span>
              Looking to purchase?{" "}
              <Link to="/" className="text-[#173885] font-bold hover:underline">
                Go to Customer Store
              </Link>
            </span>
          </div>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        role="VENDOR"
      />
    </div>
  );
};

export default VendorLogin;
