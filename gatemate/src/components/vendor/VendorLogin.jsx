import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  UserPlus,
  Eye,
  EyeOff,
} from "lucide-react";
import { useVendorAuth } from "../../context/VendorAuthContext";
import { ForgotPasswordModal } from "../common/ForgotPasswordModal";
import { SeoHead } from "../common/SeoHead";

export const VendorLogin = () => {
  const navigate = useNavigate();

  const { login, vendorUser, loading: authLoading } = useVendorAuth();

  const [email, setEmail] = useState("depot@punemegaconstruct.in");

  const [password, setPassword] = useState("password123");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);

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
      const result = await login(cleanEmail, password);

      const authenticatedUser = result?.user;

      if (!authenticatedUser?.id) {
        throw new Error("Unable to identify the authenticated vendor.");
      }

      /*
       * Authentication is successful.
       *
       * At this stage the Auth user exists.
       * Vendor approval/profile status is handled
       * separately by the vendor onboarding flow.
       */

      navigate("/vendor/dashboard");
    } catch (err) {
      console.error("Vendor login failed:", err);

      /*
       * Show the REAL Supabase error instead of
       * hiding it behind a generic message.
       */
      setError(err?.message || "Unable to sign into vendor terminal.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccount = () => {
    setEmail("depot@punemegaconstruct.in");
    setPassword("password123");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <SeoHead
        title="Vendor Sign In | GateMate Vendor Portal"
        description="Sign in to your GateMate vendor portal to manage construction products, orders, inventory, and business operations."
        canonicalUrl="/vendor/login"
        noIndex={true}
      />

      {/* Header */}
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

      {/* Login Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="gm-panel p-6 sm:p-8 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-5 shadow-xs">
          {/* Error */}
          {error && (
            <div className="p-3.5 rounded-xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />

              <span className="break-words">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
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
                  disabled={loading}
                />
              </div>

              {/* Demo Account */}
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

            {/* Password */}
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
                  disabled={loading}
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

            {/* Submit */}
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

          {/* Registration */}
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

      {/* Forgot Password */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        role="VENDOR"
      />
    </div>
  );
};

export default VendorLogin;
