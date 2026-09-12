import React, { useState } from "react";
import {
  X,
  KeyRound,
  Mail,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { passwordRecoveryService } from "../../services/passwordRecoveryService";

export const ForgotPasswordModal = ({
  isOpen,
  onClose,
  role = "CUSTOMER",
  onResetCompleted,
}) => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1); // 1: Request, 2: New Password Form
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const handleRequestToken = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await passwordRecoveryService.requestPasswordReset(email, role);
      setStep(2);
      setSuccessMsg(
        `Reset instructions confirmed for ${email}. Set your new password below.`,
      );
    } catch (err) {
      setError(err.message || "Unable to request password reset.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await passwordRecoveryService.resetPassword({ email, newPassword, role });
      setSuccessMsg("Your password has been reset successfully!");
      setTimeout(() => {
        onResetCompleted?.();
        onClose();
        setStep(1);
        setEmail("");
        setNewPassword("");
        setSuccessMsg(null);
      }, 1500);
    } catch (err) {
      setError(err.message || "Password update failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
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

        <div className="flex items-center gap-2 mb-1">
          <div className="w-9 h-9 rounded-xl bg-[#E4EEF3] text-[#173885] flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-[#173885]">
            Reset {role.charAt(0) + role.slice(1).toLowerCase()} Password
          </h3>
        </div>
        <p className="text-xs text-[#606460] mb-4">
          Enter your registered email address to recover terminal credentials.
        </p>

        {error && (
          <div className="p-3 rounded-xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#3F7D20] shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestToken} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#282926] block mb-1">
                Account Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[#6F8A92]" />
                <input
                  type="email"
                  required
                  placeholder="your-account@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full gm-input pl-10 pr-3.5 py-2.5 rounded-xl text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gm-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              <span>
                {loading ? "Sending Request..." : "Continue to Password Reset"}
              </span>
              <ArrowRight className="w-4 h-4 text-[#FEFEFE]" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#282926] block mb-1">
                Enter New Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gm-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              <span>
                {loading
                  ? "Updating Password..."
                  : "Save New Password & Sign In"}
              </span>
              <ArrowRight className="w-4 h-4 text-[#FEFEFE]" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
