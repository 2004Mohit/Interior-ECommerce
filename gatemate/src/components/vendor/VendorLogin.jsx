import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { useVendorAuth } from "../../context/VendorAuthContext";
import { SeoHead } from "../common/SeoHead";

export const VendorLogin = () => {
  const navigate = useNavigate();
  const { loginVendor } = useVendorAuth();

  const [email, setEmail] = useState("depot@punemegaconstruct.in");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await loginVendor(email, password);
      if (err) {
        setError(err.message);
      } else {
        navigate("/vendor/dashboard");
      }
    } catch (e) {
      setError("Unable to sign into vendor terminal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <SeoHead
        title="Vendor Sign In | GateMate Stockist Terminal"
        description="Sign in to your isolated GateMate vendor terminal to manage products, site orders, and commercial bids."
        canonicalUrl="/vendor/login"
        noIndex={true}
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link to="/" className="inline-flex flex-col select-none">
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
        <div className="gm-panel p-6 sm:p-8 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full gm-input pl-10 pr-3.5 py-2.5 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#282926] block mb-1">
                Terminal Password *
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
              className="w-full btn-gm-primary py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
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
                to="/vendor/onboarding"
                className="text-[#3C7DDA] font-bold hover:underline"
              >
                Register Your Depot
              </Link>
            </span>
            <span>
              Looking to buy?{" "}
              <Link to="/" className="text-[#173885] font-bold hover:underline">
                Go to Customer Store
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
