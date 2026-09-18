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
    setSuccess(false);

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
      setError("Please enter a valid business email.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please retype carefully.");
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

      if (!result) {
        throw new Error("Registration failed. Please try again.");
      }

      if (result.error) {
        throw result.error;
      }

      setSuccess(true);

      setTimeout(() => {
        navigate("/vendor/login");
      }, 1500);
    } catch (err) {
      console.error("Vendor registration failed:", err);

      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <SeoHead
        title="Register as Vendor | GateMate"
        description="Create your GateMate vendor account to list construction products and manage orders."
        canonicalUrl="/vendor/register"
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

        <h2 className="text-xl font-black text-[#173885]">
          Register Your Business
        </h2>

        <p className="text-xs text-[#606460]">
          Create a vendor account to submit your business details and
          verification documents.
        </p>
      </div>

      {/* Registration Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="gm-panel p-6 sm:p-8 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-5 shadow-xs">
          {/* Error */}
          {error && (
            <div className="p-3.5 rounded-xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />

              <span className="break-words">{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="p-3.5 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />

              <span>
                Vendor account created successfully! Redirecting to sign in...
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Business Name */}
            <div>
              <label className="text-xs font-bold text-[#282926] block mb-1">
                Business Name *
              </label>

              <div className="relative">
                <Building2 className="absolute left-3.5 top-3.5 w-4 h-4 text-[#6F8A92]" />

                <input
                  type="text"
                  required
                  autoComplete="organization"
                  placeholder="e.g. Pune Infrastructure Supplies Pvt Ltd"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full gm-input pl-10 pr-3.5 py-2.5 rounded-xl text-xs"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Contact Person */}
            <div>
              <label className="text-xs font-bold text-[#282926] block mb-1">
                Contact Person Name *
              </label>

              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-[#6F8A92]" />

                <input
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="e.g. Suresh Patil"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full gm-input pl-10 pr-3.5 py-2.5 rounded-xl text-xs"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-bold text-[#282926] block mb-1">
                Business Email *
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
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Password */}
              <div>
                <label className="text-xs font-bold text-[#282926] block mb-1">
                  Password *
                </label>

                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-3.5 h-3.5 text-[#6F8A92]" />

                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="Min. 6 chars"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full gm-input pl-9 pr-10 py-2.5 rounded-xl text-xs"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6F8A92] hover:text-[#173885] transition-colors"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
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

              {/* Confirm Password */}
              <div>
                <label className="text-xs font-bold text-[#282926] block mb-1">
                  Confirm Password *
                </label>

                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-3.5 h-3.5 text-[#6F8A92]" />

                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full gm-input pl-9 pr-10 py-2.5 rounded-xl text-xs"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((previous) => !previous)
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6F8A92] hover:text-[#173885] transition-colors"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
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
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full btn-gm-primary py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>
                {loading
                  ? "Creating Account..."
                  : success
                    ? "Account Created"
                    : "Register as Vendor"}
              </span>

              {!loading && !success && (
                <ArrowRight className="w-4 h-4 text-[#FEFEFE]" />
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="pt-4 border-t border-[#D9E2EA] text-center text-xs text-[#606460]">
            Already registered?{" "}
            <Link
              to="/vendor/login"
              className="text-[#3C7DDA] font-bold hover:underline"
            >
              Sign In to Vendor Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorRegister;
