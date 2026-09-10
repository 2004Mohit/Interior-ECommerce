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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0a1424] border border-white/10 w-full max-w-md p-6 sm:p-8 rounded-3xl relative shadow-2xl">
        <button
          onClick={() => {
            resetForm();
            onClose();
          }}
          className="absolute top-5 right-5 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-2xl font-black text-white mb-1">
          {isSignUp ? "Join GateMate" : "Sign In to GateMate"}
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          {isSignUp
            ? "Register to place orders and manage your deliveries."
            : "Access your account to checkout and track shipments."}
        </p>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-1 bg-[#050b14] p-1 rounded-xl mb-5 border border-white/5">
          <button
            type="button"
            onClick={() => {
              setAuthMethod("password");
              setError(null);
            }}
            className={`py-2 rounded-lg text-xs font-bold transition ${
              authMethod === "password"
                ? "bg-[#172a4d] text-amber-400 border border-amber-400/30"
                : "text-slate-400 hover:text-white"
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
                ? "bg-[#172a4d] text-amber-400 border border-amber-400/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Mobile & OTP
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs mb-4">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {authMethod === "password" ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
            {isSignUp && (
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full premium-input pl-10 pr-3.5 py-3 rounded-xl text-sm"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full premium-input pl-10 pr-3.5 py-3 rounded-xl text-sm"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="Password (min. 6 characters)"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full premium-input pl-10 pr-3.5 py-3 rounded-xl text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl gold-gradient-btn text-sm mt-2 transition active:scale-95 disabled:opacity-50"
            >
              {loading
                ? "Please wait..."
                : isSignUp
                  ? "Create GateMate Account"
                  : "Sign In"}
            </button>
          </form>
        ) : (
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-3.5">
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 Mobile Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full premium-input pl-10 pr-3.5 py-3 rounded-xl text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl gold-gradient-btn text-sm transition active:scale-95 disabled:opacity-50"
                >
                  {loading ? "Sending Code..." : "Send Verification OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full premium-input pl-10 pr-3.5 py-3 rounded-xl text-sm text-center tracking-widest font-mono text-lg font-bold"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-sm transition active:scale-95 disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify OTP & Log In"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Toggle Sign Up / Sign In */}
        <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs text-slate-400">
          {isSignUp ? (
            <span>
              Already registered?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  resetForm();
                }}
                className="text-amber-400 font-bold hover:underline ml-1"
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
                className="text-amber-400 font-bold hover:underline ml-1"
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
