import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  KeyRound,
} from "lucide-react";
import {
  supabaseAdmin,
  supabaseVendor,
  supabaseCustomer,
} from "../../lib/supabaseClient";
import { passwordRecoveryService } from "../../services/passwordRecoveryService";
import { SeoHead } from "./SeoHead";

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = (searchParams.get("role") || "CUSTOMER").toUpperCase();

  const authClient =
    role === "ADMIN"
      ? supabaseAdmin
      : role === "VENDOR"
        ? supabaseVendor
        : supabaseCustomer;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyingSession, setVerifyingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Listen for Supabase PASSWORD_RECOVERY auth event
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await authClient.auth.getSession();
        if (session) {
          setHasValidSession(true);
        } else {
          // Check URL hash/token for Supabase recovery redirect
          const hash = window.location.hash;
          if (hash && hash.includes("type=recovery")) {
            setHasValidSession(true);
          } else {
            setHasValidSession(true); // Allow setting new password
          }
        }
      } catch (err) {
        setHasValidSession(true);
      } finally {
        setVerifyingSession(false);
      }
    };

    checkSession();

    const { data: authListener } = authClient.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          setHasValidSession(true);
        }
      },
    );

    return () => {
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);

    try {
      await passwordRecoveryService.updatePasswordWithSession(password, role);
      setSuccess(true);

      setTimeout(() => {
        if (role === "VENDOR") {
          navigate("/vendor/login");
        } else if (role === "ADMIN") {
          navigate("/");
        } else {
          navigate("/");
        }
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  const getDestinationName = () => {
    if (role === "VENDOR") return "Vendor Terminal";
    if (role === "ADMIN") return "Admin Operations";
    return "Customer Store";
  };

  if (verifyingSession) {
    return (
      <div className="min-h-screen bg-[#F4F6FA] flex items-center justify-center p-4 font-sans text-xs text-[#606460]">
        Verifying secure email link...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6FA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <SeoHead
        title="Reset Account Password | GateMate"
        description="Set a new password for your verified GateMate account."
        canonicalUrl="/reset-password"
        noIndex={true}
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link to="/" className="inline-flex flex-col select-none">
          <span className="text-3xl font-black tracking-tight leading-none">
            <span className="text-[#173885]">GATE</span>
            <span className="text-[#3C7DDA]">MATE</span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#3C7DDA] mt-1">
            {getDestinationName()} Security
          </span>
        </Link>
        <h2 className="text-xl font-black text-[#173885]">Set New Password</h2>
        <p className="text-xs text-[#606460]">
          Your email has been verified. Enter your new password below.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="gm-panel p-6 sm:p-8 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-5 shadow-xs">
          {error && (
            <div className="p-3.5 rounded-xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <strong className="block font-bold">
                  Password Reset Successful!
                </strong>
                <span className="text-[11px] text-[#282926]">
                  Redirecting to {getDestinationName()} sign in...
                </span>
              </div>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#282926] block mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#6F8A92]" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full gm-input pl-10 pr-3.5 py-2.5 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#282926] block mb-1">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#6F8A92]" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full gm-input pl-10 pr-3.5 py-2.5 rounded-xl text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-gm-primary py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                <span>
                  {loading ? "Saving Password..." : "Save Password & Sign In"}
                </span>
                <ArrowRight className="w-4 h-4 text-[#FEFEFE]" />
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-[#D9E2EA] text-center text-xs text-[#606460]">
            <Link
              to={
                role === "VENDOR"
                  ? "/vendor/login"
                  : role === "ADMIN"
                    ? "/admin/login"
                    : "/"
              }
              className="text-[#173885] font-bold hover:underline"
            >
              Cancel and Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
