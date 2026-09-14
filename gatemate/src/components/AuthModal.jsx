import React, { useState } from "react";
import {
  X,
  Lock,
  Mail,
  Phone,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { USER_ROLES } from "../services/roleService";
import { ForgotPasswordModal } from "./common/ForgotPasswordModal";

export const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const { loginWithPassword, registerWithEmailPassword } = useAuth();

  const [authView, setAuthView] = useState("SIGN_IN");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmationNotice, setConfirmationNotice] = useState(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  if (!isOpen) return null;

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setConfirmationNotice(null);

    try {
      const result = await loginWithPassword(email, password);
      if (result?.user) {
        onSuccess?.();
        onClose();

        if (
          result.role === USER_ROLES.ADMIN ||
          result.user?.user_metadata?.role === "ADMIN"
        ) {
          window.location.href = "/admin";
        } else if (result.role === USER_ROLES.VENDOR) {
          window.location.href = result.destination || "/vendor/dashboard";
        }
      }
    } catch (err) {
      if (err?.message?.toLowerCase().includes("email not confirmed")) {
        setError(
          "Your email has not been verified yet. Please check your inbox and click the verification link.",
        );
      } else {
        setError(err?.message || "Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    setConfirmationNotice(null);

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (!/^\d{10}$/.test(cleanPhone)) {
      setError(
        "Please enter a valid 10-digit mobile number (e.g. 9829012345).",
      );
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);

    try {
      const result = await registerWithEmailPassword(
        fullName,
        email,
        cleanPhone,
        password,
      );

      if (
        result?.requiresEmailConfirmation ||
        (result?.user && !result?.session)
      ) {
        setConfirmationNotice(
          `Verification email sent to ${email}! Please check your inbox and click the confirmation link to activate your account before logging in.`,
        );
        setAuthView("SIGN_IN");
      } else if (result?.session) {
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      setError(
        err?.message || "Registration failed. Please check your details.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-md p-6 sm:p-8 rounded-3xl relative shadow-2xl max-h-[90vh] overflow-y-auto font-sans">
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute top-5 right-5 text-[#606460] hover:text-[#282926]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center space-y-1 mb-5">
            <h3 className="text-2xl font-black text-[#173885]">
              {authView === "SIGN_IN"
                ? "Sign In to GateMate"
                : "Create Customer Account"}
            </h3>
            <p className="text-xs text-[#606460]">
              {authView === "SIGN_IN"
                ? "Access saved site delivery addresses, live dispatches, and material orders."
                : "Register to source certified construction products across Pune & PCMC."}
            </p>
          </div>

          <div className="flex rounded-xl bg-[#F4F6FA] p-1 border border-[#D9E2EA] mb-5">
            <button
              type="button"
              onClick={() => {
                setAuthView("SIGN_IN");
                setError(null);
                setConfirmationNotice(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                authView === "SIGN_IN"
                  ? "bg-[#FEFEFE] text-[#173885] shadow-xs"
                  : "text-[#606460]"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthView("SIGN_UP");
                setError(null);
                setConfirmationNotice(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                authView === "SIGN_UP"
                  ? "bg-[#FEFEFE] text-[#173885] shadow-xs"
                  : "text-[#606460]"
              }`}
            >
              Create Account
            </button>
          </div>

          {confirmationNotice && (
            <div className="p-3.5 rounded-xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs mb-4 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{confirmationNotice}</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {authView === "SIGN_IN" ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#282926] block mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[#6F8A92]" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full gm-input pl-10 pr-3.5 py-2.5 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-[#282926]">
                    Password *
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
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
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
                className="w-full btn-gm-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                <span>{loading ? "Authenticating..." : "Sign In"}</span>
                <ArrowRight className="w-4 h-4 text-[#FEFEFE]" />
              </button>

              <div className="pt-2 text-center text-xs text-[#606460]">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setAuthView("SIGN_UP");
                    setError(null);
                    setConfirmationNotice(null);
                  }}
                  className="text-[#3C7DDA] font-bold hover:underline"
                >
                  Create one now
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#282926] block mb-1">
                  Full Name / Contractor Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-[#6F8A92]" />
                  <input
                    type="text"
                    required
                    placeholder="Vikramaditya Shinde"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full gm-input pl-10 pr-3.5 py-2.5 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#282926] block mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[#6F8A92]" />
                  <input
                    type="email"
                    required
                    placeholder="vikram@construct.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full gm-input pl-10 pr-3.5 py-2.5 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#282926] block mb-1">
                  10-Digit Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-[#6F8A92]" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9829012345"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, ""))
                    }
                    className="w-full gm-input pl-10 pr-3.5 py-2.5 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#282926] block mb-1">
                  Create Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#6F8A92]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full gm-input pl-10 pr-10 py-2.5 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#6F8A92] hover:text-[#282926]"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#282926] block mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#6F8A92]" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Re-type password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full gm-input pl-10 pr-10 py-2.5 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-[#6F8A92] hover:text-[#282926]"
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
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
                className="w-full btn-gm-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                <span>{loading ? "Registering..." : "Create Account"}</span>
                <ArrowRight className="w-4 h-4 text-[#FEFEFE]" />
              </button>

              <div className="pt-2 text-center text-xs text-[#606460]">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setAuthView("SIGN_IN");
                    setError(null);
                    setConfirmationNotice(null);
                  }}
                  className="text-[#3C7DDA] font-bold hover:underline"
                >
                  Sign in here
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        role="CUSTOMER"
      />
    </>
  );
};
