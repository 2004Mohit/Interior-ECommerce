import React, { useState } from "react";
import { X, Mail, Phone, Lock, KeyRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const [authMode, setAuthMode] = useState("password"); // 'password' or 'otp'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { loginWithPassword, loginWithOtp, verifyOtp } = useAuth();

  if (!isOpen) return null;

  const handlePasswordAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await loginWithPassword(email, password);
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      onSuccess?.();
      onClose();
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-white/20 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-white mb-2">
          Welcome to GateMate
        </h3>
        <p className="text-xs text-blue-200 mb-6">
          Log in to complete your checkout and track orders.
        </p>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 gap-1 bg-white/10 p-1 rounded-xl mb-5">
          <button
            onClick={() => setAuthMode("password")}
            className={`py-2 rounded-lg text-xs font-semibold transition ${
              authMode === "password"
                ? "bg-sky-500 text-slate-950 shadow"
                : "text-blue-200 hover:text-white"
            }`}
          >
            Email & Password
          </button>
          <button
            onClick={() => setAuthMode("otp")}
            className={`py-2 rounded-lg text-xs font-semibold transition ${
              authMode === "otp"
                ? "bg-sky-500 text-slate-950 shadow"
                : "text-blue-200 hover:text-white"
            }`}
          >
            Phone & OTP
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs mb-4">
            {error}
          </div>
        )}

        {authMode === "password" ? (
          <form onSubmit={handlePasswordAuth} className="space-y-3.5">
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-blue-300" />
              <input
                type="email"
                required
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-input pl-10 pr-3.5 py-2.5 rounded-xl text-sm"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-blue-300" />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input pl-10 pr-3.5 py-2.5 rounded-xl text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-slate-950 font-bold text-sm shadow transition"
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        ) : (
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-3.5">
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-blue-300" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 Mobile Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full glass-input pl-10 pr-3.5 py-2.5 rounded-xl text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm shadow transition"
                >
                  {loading ? "Sending Code..." : "Send OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-blue-300" />
                  <input
                    type="text"
                    required
                    placeholder="6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full glass-input pl-10 pr-3.5 py-2.5 rounded-xl text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm shadow transition"
                >
                  {loading ? "Verifying..." : "Verify & Log In"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
