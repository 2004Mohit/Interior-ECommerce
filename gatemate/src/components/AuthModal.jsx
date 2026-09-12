import React, { useState } from "react";
import {
  X,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ForgotPasswordModal } from "./common/ForgotPasswordModal";

export const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const { loginWithOtp, verifyOtp, loginWithPassword } = useAuth();

  const [authMode, setAuthMode] = useState("PASSWORD"); // 'PASSWORD' | 'OTP'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  if (!isOpen) return null;

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await loginWithPassword(email, password);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(phone.trim())) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await loginWithOtp(phone.trim());
      setOtpSent(true);
    } catch (err) {
      setError(err.message || "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await verifyOtp(phone.trim(), otp.trim());
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-md p-6 sm:p-8 rounded-3xl relative shadow-2xl">
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute top-5 right-5 text-[#606460] hover:text-[#282926]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center space-y-1 mb-6">
            <h3 className="text-2xl font-black text-[#173885]">
              Sign In to GateMate
            </h3>
            <p className="text-xs text-[#606460]">
              Access your saved project addresses, orders, and 30-min dispatches
              in Pune & PCMC.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex rounded-xl bg-[#F4F6FA] p-1 border border-[#D9E2EA] mb-5">
            <button
              type="button"
              onClick={() => {
                setAuthMode("PASSWORD");
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                authMode === "PASSWORD"
                  ? "bg-[#FEFEFE] text-[#173885] shadow-xs"
                  : "text-[#606460]"
              }`}
            >
              Email & Password
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("OTP");
                setError(null);
                setOtpSent(false);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                authMode === "OTP"
                  ? "bg-[#FEFEFE] text-[#173885] shadow-xs"
                  : "text-[#606460]"
              }`}
            >
              Mobile OTP
            </button>
          </div>

          {authMode === "PASSWORD" ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
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
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full gm-input pl-10 pr-3.5 py-2.5 rounded-xl text-xs"
                  />
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
            </form>
          ) : !otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-gm-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                <span>
                  {loading ? "Sending OTP..." : "Send Verification Code"}
                </span>
                <ArrowRight className="w-4 h-4 text-[#FEFEFE]" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#282926] block mb-1">
                  Enter 6-Digit OTP *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold text-center tracking-widest text-base"
                />
                <span className="text-[10px] text-[#6F8A92] mt-1 block text-center">
                  Code sent to +91 {phone}
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-gm-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                <span>{loading ? "Verifying..." : "Verify & Sign In"}</span>
                <ArrowRight className="w-4 h-4 text-[#FEFEFE]" />
              </button>
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
