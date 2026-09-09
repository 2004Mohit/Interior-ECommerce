import React from "react";
import { useAuth } from "../../context/AuthContext";
import { AccountNav } from "../../components/customer/AccountNav";
import { User, Shield, Mail, Phone, Calendar } from "lucide-react";

export const Account = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <h1 className="text-2xl font-black text-white">Customer Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <AccountNav />
        </div>

        <div className="md:col-span-3 space-y-6">
          <div className="premium-panel p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 text-2xl font-black">
                {user?.email?.[0]?.toUpperCase() || "G"}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {user?.user_metadata?.full_name || "GateMate Customer"}
                </h2>
                <p className="text-xs text-slate-400">
                  Member since August 2026
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div className="premium-card p-3.5 rounded-xl flex items-center gap-3">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="text-xs">
                  <div className="text-slate-400">Email Address</div>
                  <div className="text-white font-semibold">
                    {user?.email || "Not verified"}
                  </div>
                </div>
              </div>
              <div className="premium-card p-3.5 rounded-xl flex items-center gap-3">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="text-xs">
                  <div className="text-slate-400">Mobile Phone</div>
                  <div className="text-white font-semibold">
                    {user?.phone || "+91 98290 12345"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
