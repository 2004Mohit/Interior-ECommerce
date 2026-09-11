import React, { useState } from "react";
import {
  X,
  Mail,
  Phone,
  Lock,
  KeyRound,
  User,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [authMethod, setAuthMethod] = useState("password");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const { loginWithPassword, signUpWithPassword, loginWithOtp, verifyOtp } =
    useAuth();

  if (!isOpen) return null;

  const resetForm = () => {
    setError(null);
    setSuccessMsg(null);
    setOtpSent(false);
    setEmail("");
    setPassword("");
    setPhone("");
    setFullName("");
    setOtp("");
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (isSignUp) {
      const { data, error: err } = await signUpWithPassword(
        email,
        password,
        fullName,
      );
      setLoading(false);
      if (err) {
        setError(err.message);
      } else {
        if (data.session) {
          onSuccess?.();
          onClose();
        } else {
          setSuccessMsg(
            "Verification sent. Please check your email to activate your account.",
          );
        }
      }
    } else {
      const { error: err } = await loginWithPassword(email, password);
      setLoading(false);
      if (err) {
        setError(err.message);
      } else {
        onSuccess?.();
        onClose();
      }
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await loginWithOtp(phone);
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setOtpSent(true);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await verifyOtp(phone, otp);
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      onSuccess?.();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-md p-6 sm:p-8 rounded-3xl relative shadow-2xl">
        <button
          onClick={() => {
            resetForm();
            onClose();
          }}
          className="absolute top-5 right-5 text-[#606460] hover:text-[#282926]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Wordmark in Auth Modal */}
        <div className="mb-2">
          <span className="text-2xl font-black tracking-tight leading-none">
            <span className="text-[#173885]">GATE</span>
            <span className="text-[#3C7DDA]">MATE</span>
          </span>
        </div>

        <h3 className="text-xl font-bold text-[#173885] mb-1">
          {isSignUp ? "Create Customer Account" : "Sign In to Account"}
        </h3>
        <p className="text-xs text-[#606460] mb-6">
          {isSignUp
            ? "Create an account to order construction supplies with priority site delivery."
            : "Access your account to checkout and track site deliveries."}
        </p>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-1 bg-[#F4F6FA] p-1 rounded-xl mb-5 border border-[#D9E2EA]">
          <button
            type="button"
            onClick={() => {
              setAuthMethod("password");
              setError(null);
            }}
            className={`py-2 rounded-lg text-xs font-bold transition ${
              authMethod === "password"
                ? "bg-[#173885] text-[#FEFEFE] shadow-xs"
                : "text-[#606460] hover:text-[#282926]"
            }`}
          >
            Email & Password
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod("otp");
              setError(null);
            }}
            className={`py-2 rounded-lg text-xs font-bold transition ${
              authMethod === "otp"
                ? "bg-[#173885] text-[#FEFEFE] shadow-xs"
                : "text-[#606460] hover:text-[#282926]"
            }`}
          >
            Mobile & OTP
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs mb-4">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#3F7D20]" />
            <span>{successMsg}</span>
          </div>
        )}

        {authMethod === "password" ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
            {isSignUp && (
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-[#6F8A92]" />
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full gm-input pl-10 pr-3.5 py-3 rounded-xl text-sm"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[#6F8A92]" />
              <input
                type="email"
                required
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full gm-input pl-10 pr-3.5 py-3 rounded-xl text-sm"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#6F8A92]" />
              <input
                type="password"
                required
                placeholder="Password (min. 6 characters)"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full gm-input pl-10 pr-3.5 py-3 rounded-xl text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl btn-gm-primary text-sm mt-2 transition active:scale-95 disabled:opacity-50"
            >
              {loading
                ? "Please wait..."
                : isSignUp
                  ? "Create Account"
                  : "Sign In"}
            </button>
          </form>
        ) : (
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-3.5">
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-[#6F8A92]" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 Mobile Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full gm-input pl-10 pr-3.5 py-3 rounded-xl text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl btn-gm-primary text-sm transition active:scale-95 disabled:opacity-50"
                >
                  {loading ? "Sending Code..." : "Send Verification OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-[#6F8A92]" />
                  <input
                    type="text"
                    required
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full gm-input pl-10 pr-3.5 py-3 rounded-xl text-sm text-center tracking-widest font-mono text-lg font-bold"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl btn-gm-primary text-sm transition active:scale-95 disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify OTP & Log In"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Toggle */}
        <div className="mt-6 pt-4 border-t border-[#D9E2EA] text-center text-xs text-[#606460]">
          {isSignUp ? (
            <span>
              Already registered?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  resetForm();
                }}
                className="text-[#3C7DDA] font-bold hover:underline ml-1"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              New to GateMate?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  resetForm();
                }}
                className="text-[#3C7DDA] font-bold hover:underline ml-1"
              >
                Create Account
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
