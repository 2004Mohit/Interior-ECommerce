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

export const ForgotPasswordModal = ({ isOpen, onClose, role = "CUSTOMER" }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await passwordRecoveryService.requestPasswordReset(email, role);
      setSentSuccess(true);
    } catch (err) {
      setError(err.message || "Unable to send password reset email.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSentSuccess(false);
    setEmail("");
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-md p-6 sm:p-8 rounded-3xl relative shadow-2xl">
        <button
          onClick={handleCloseModal}
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
          We will send a secure verification link to your registered email
          address.
        </p>

        {error && (
          <div className="p-3 rounded-xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {sentSuccess ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 space-y-2">
              <div className="flex items-center gap-2 text-[#3F7D20] text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Verification Email Dispatched!</span>
              </div>
              <p className="text-[11px] text-[#282926] leading-relaxed">
                We sent a secure password reset link to{" "}
                <strong className="text-[#173885]">{email}</strong>. Please
                check your inbox and click the link to verify your identity and
                set a new password.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCloseModal}
              className="w-full btn-gm-primary py-2.5 rounded-xl text-xs font-bold"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendResetEmail} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#282926] block mb-1">
                Registered Account Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[#6F8A92]" />
                <input
                  type="email"
                  required
                  placeholder="your-email@example.com"
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
                {loading
                  ? "Dispatching Email..."
                  : "Send Verification Email Link"}
              </span>
              <ArrowRight className="w-4 h-4 text-[#FEFEFE]" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
