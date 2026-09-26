import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Building2,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";

import { useVendorAuth } from "../../context/VendorAuthContext";
import { SeoHead } from "../common/SeoHead";

export const VendorRegister = () => {
  const navigate = useNavigate();

  const { registerVendor } = useVendorAuth();

  const [businessName, setBusinessName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);

    const cleanBusinessName = businessName.trim();
    const cleanContactPerson = contactPerson.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanBusinessName) {
      setError("Please enter your business name.");
      return;
    }

    if (!cleanContactPerson) {
      setError("Please enter the contact person's name.");
      return;
    }

    if (!cleanEmail) {
      setError("Please enter your business email.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please retype your password.");
      return;
    }

    setLoading(true);

    try {
      const result = await registerVendor({
        businessName: cleanBusinessName,
        contactPerson: cleanContactPerson,
        email: cleanEmail,
        password,
      });

      /*
       * Supabase email confirmation is enabled.
       *
       * There is no active session yet.
       *
       * DO NOT redirect to any dashboard.
       */
      if (result?.needsEmailConfirmation) {
        setSuccess(true);
        return;
      }

      /*
       * Development case:
       * Email confirmation may be disabled in Supabase.
       *
       * Still keep the vendor inside the vendor portal.
       */
      setSuccess(true);

      setTimeout(() => {
        navigate("/vendor/verification", {
          replace: true,
        });
      }, 1200);
    } catch (err) {
      console.error("Vendor registration failed:", err);

      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /*
   * EMAIL VERIFICATION MESSAGE
   */
  if (success) {
    return (
      <div className="min-h-screen bg-[#F4F6FA] flex items-center justify-center px-4 font-sans">
        <SeoHead
          title="Verify Your Email | Ferrado Vendor"
          description="Verify your Ferrado vendor account email address."
          canonicalUrl="/vendor/register"
          noIndex={true}
        />

        <div className="w-full max-w-md">
          <div className="bg-[#FEFEFE] border border-[#D9E2EA] rounded-3xl shadow-sm p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-[#E4EEF3] flex items-center justify-center mb-5">
              <Mail className="w-7 h-7 text-[#173885]" />
            </div>

            <h1 className="text-xl font-black text-[#173885]">
              Verify Your Email
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#606460]">
              We have sent a verification email to:
            </p>

            <p className="mt-2 text-sm font-bold text-[#173885] break-all">
              {email.trim().toLowerCase()}
            </p>

            <div className="mt-6 p-4 rounded-2xl bg-[#E4EEF3] border border-[#8CD0FA] text-left">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#173885] shrink-0 mt-0.5" />

                <div>
                  <p className="text-sm font-bold text-[#173885]">
                    Verification email sent
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#606460]">
                    Open the email and click the verification link to activate
                    your vendor account.
                  </p>

                  <p className="mt-2 text-xs leading-5 text-[#606460]">
                    After verification, Ferrado will bring you back to the
                    Vendor Sign In page. You will not be signed into the
                    customer portal.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-5 text-xs text-[#606460]">
              Check your spam or junk folder if you do not see the email.
            </p>

            <button
              type="button"
              onClick={() => navigate("/vendor/login")}
              className="mt-6 w-full btn-gm-primary py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            >
              Go to Vendor Sign In
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6FA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <SeoHead
        title="Register as Vendor | Ferrado Vendor Portal"
        description="Create your Ferrado vendor account to list construction products."
        canonicalUrl="/vendor/register"
        noIndex={true}
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link to="/sell" className="inline-flex flex-col select-none">
          <span className="text-3xl font-black tracking-tight leading-none">
            <span className="text-[#173885]">FERRA</span>
            <span className="text-[#3C7DDA]">DO</span>
          </span>

          <span className="text-[10px] font-bold uppercase tracking-widest text-[#3C7DDA] mt-1">
            Vendor Portal
          </span>
        </Link>

        <h2 className="text-xl font-black text-[#173885]">
          Create Vendor Account
        </h2>

        <p className="text-xs text-[#606460]">
          Register your business to sell construction products on Ferrado.
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#FEFEFE] border border-[#D9E2EA] rounded-3xl shadow-sm p-6 sm:p-8">
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/20 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#B43D20] shrink-0 mt-0.5" />

              <p className="text-xs font-semibold text-[#B43D20] leading-5">
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* BUSINESS NAME */}
            <div>
              <label className="block text-xs font-bold text-[#173885] mb-2">
                Business Name
              </label>

              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#606460]" />

                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Enter registered business name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D9E2EA] bg-[#FEFEFE] text-sm outline-none focus:border-[#33B2FF] focus:ring-2 focus:ring-[#33B2FF]/10"
                  disabled={loading}
                />
              </div>
            </div>

            {/* CONTACT PERSON */}
            <div>
              <label className="block text-xs font-bold text-[#173885] mb-2">
                Contact Person
              </label>

              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#606460]" />

                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Owner / authorized person"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D9E2EA] bg-[#FEFEFE] text-sm outline-none focus:border-[#33B2FF] focus:ring-2 focus:ring-[#33B2FF]/10"
                  disabled={loading}
                />
              </div>
            </div>

            {/* EMAIL */}
            <div>
              <label className="block text-xs font-bold text-[#173885] mb-2">
                Business Email
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#606460]" />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="business@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D9E2EA] bg-[#FEFEFE] text-sm outline-none focus:border-[#33B2FF] focus:ring-2 focus:ring-[#33B2FF]/10"
                  disabled={loading}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-xs font-bold text-[#173885] mb-2">
                Password
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#606460]" />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-[#D9E2EA] bg-[#FEFEFE] text-sm outline-none focus:border-[#33B2FF] focus:ring-2 focus:ring-[#33B2FF]/10"
                  disabled={loading}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#606460] hover:text-[#173885]"
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

            {/* CONFIRM PASSWORD */}
            <div>
              <label className="block text-xs font-bold text-[#173885] mb-2">
                Confirm Password
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#606460]" />

                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-[#D9E2EA] bg-[#FEFEFE] text-sm outline-none focus:border-[#33B2FF] focus:ring-2 focus:ring-[#33B2FF]/10"
                  disabled={loading}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#606460] hover:text-[#173885]"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gm-primary py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                "Creating Account..."
              ) : (
                <>
                  Create Vendor Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#D9E2EA] text-center">
            <p className="text-xs text-[#606460]">
              Already have a vendor account?
            </p>

            <Link
              to="/vendor/login"
              className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-[#173885] hover:text-[#3C7DDA]"
            >
              Sign in to Vendor Portal
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorRegister;
