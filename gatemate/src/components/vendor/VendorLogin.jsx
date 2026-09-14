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
  const { loginVendor, isVendorAuthenticated } = useVendorAuth();

  const [email, setEmail] = useState("depot@punemegaconstruct.in");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isNotRegistered, setIsNotRegistered] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIsNotRegistered(false);

    try {
      const { error: err, destination } = await loginVendor(email, password);
      if (err) {
        setError(err.message);
        if (err.code === "VENDOR_NOT_REGISTERED") {
          setIsNotRegistered(true);
        }
      } else if (destination) {
        navigate(destination);
      }
    } catch (e) {
      setError("Unable to sign into vendor terminal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <SeoHead
        title="Vendor Sign In | GateMate Stockist Terminal"
        description="Sign in to your isolated GateMate vendor terminal to manage products, site orders, and commercial bids."
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
            Vendor & Stockist Portal
          </span>
        </Link>
        <h2 className="text-xl font-black text-[#173885]">
          Vendor Terminal Sign In
        </h2>
        <p className="text-xs text-[#606460]">
          Separate authentication for stockists, dealers, and depot managers.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="gm-panel p-6 sm:p-8 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-5 shadow-xs">
          {/* Unregistered Alert with Actionable Registration Link */}
          {isNotRegistered ? (
            <div className="p-4 rounded-2xl bg-[#FFF0D5] border border-[#A66A08]/30 space-y-3">
              <div className="flex items-start gap-2.5 text-[#A66A08] text-xs">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block text-[#173885]">
                    No Vendor Account Found
                  </strong>
                  <p className="text-[11px] text-[#606460] mt-0.5 leading-relaxed">
                    You do not have a registered vendor account yet. Please
                    create your vendor account first.
                  </p>
                </div>
              </div>
              <Link
                to="/vendor/register"
                className="w-full btn-gm-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#FEFEFE]" />
                <span>Register as Vendor</span>
              </Link>
            </div>
          ) : error ? (
            <div className="p-3.5 rounded-xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#282926] block mb-1">
                Registered Vendor Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[#6F8A92]" />
                <input
                  type="email"
                  required
                  placeholder="depot@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full gm-input pl-10 pr-3.5 py-2.5 rounded-xl text-xs"
                />
              </div>
              <p className="text-[10px] text-[#6F8A92] mt-1">
                Demo Account:{" "}
                <button
                  type="button"
                  onClick={() => {
                    setEmail("depot@punemegaconstruct.in");
                    setPassword("password123");
                  }}
                  className="text-[#3C7DDA] hover:underline font-bold font-mono"
                >
                  depot@punemegaconstruct.in
                </button>
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-[#282926]">
                  Terminal Password *
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full gm-input pl-10 pr-10 py-2.5 rounded-xl text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#6F8A92] hover:text-[#282926]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
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
              className="w-full btn-gm-primary py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <span>
                {loading ? "Authenticating..." : "Sign In to Vendor Terminal"}
              </span>
              <ArrowRight className="w-4 h-4 text-[#FEFEFE]" />
            </button>
          </form>

          <div className="pt-4 border-t border-[#D9E2EA] flex flex-col gap-2 text-center text-xs text-[#606460]">
            <span>
              New stockist?{" "}
              <Link
                to="/vendor/register"
                className="text-[#3C7DDA] font-bold hover:underline"
              >
                Register as Vendor
              </Link>
            </span>

            {/* Show Customer Store option ONLY if user is NOT logged in as vendor */}
            {!isVendorAuthenticated && (
              <span>
                Looking to purchase?{" "}
                <Link
                  to="/"
                  className="text-[#173885] font-bold hover:underline"
                >
                  Go to Customer Store
                </Link>
              </span>
            )}
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
