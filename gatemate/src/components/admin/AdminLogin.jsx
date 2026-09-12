import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { SeoHead } from "../common/SeoHead";

export const AdminLogin = () => {
  const navigate = useNavigate();
  const { loginAdmin } = useAdminAuth();

  const [email, setEmail] = useState("admin@gatemate.in");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: err } = await loginAdmin(email, password);
      if (err) {
        setError(err.message);
      } else {
        navigate("/admin/dashboard");
      }
    } catch (e) {
      setError("Admin authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <SeoHead
        title="Admin Console Sign In | GateMate Operations"
        description="GateMate administrative operations portal for contractor onboarding, product approvals, and commission oversight."
        canonicalUrl="/admin/login"
        noIndex={true}
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link to="/" className="inline-flex flex-col select-none">
          <span className="text-3xl font-black tracking-tight leading-none">
            <span className="text-[#173885]">GATE</span>
            <span className="text-[#3C7DDA]">MATE</span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#173885] mt-1">
            Operations & Moderation Console
          </span>
        </Link>
        <h2 className="text-xl font-black text-[#173885]">
          Staff Operations Sign In
        </h2>
        <p className="text-xs text-[#606460]">
          Restricted access for depot verifiers, product moderators, and
          platform managers.
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#282926] block mb-1">
                Admin Account Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[#6F8A92]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full gm-input pl-10 pr-3.5 py-2.5 rounded-xl text-xs"
                />
              </div>
              <span className="text-[10px] text-[#6F8A92] mt-1 block">
                Default Operator:{" "}
                <span className="font-mono font-bold text-[#173885]">
                  admin@gatemate.in
                </span>
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-[#282926] block mb-1">
                Terminal Key / Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#6F8A92]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                {loading
                  ? "Verifying Credentials..."
                  : "Sign In to Operations Console"}
              </span>
              <ArrowRight className="w-4 h-4 text-[#FEFEFE]" />
            </button>
          </form>

          <div className="pt-4 border-t border-[#D9E2EA] text-center text-xs text-[#606460]">
            <Link to="/" className="text-[#173885] font-bold hover:underline">
              Return to Customer Storefront
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
