import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, User, Menu, ShieldCheck, Zap, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { vendorService } from "../../services/vendorService";

export const VendorHeader = ({ onOpenMobileNav }) => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    vendorService.getProfile(user?.id).then(setProfile);
  }, [user]);

  return (
    <header className="sticky top-0 z-30 w-full bg-[#FEFEFE]/95 border-b border-[#D9E2EA] px-4 sm:px-6 py-3 shadow-xs backdrop-blur-md">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Nav Trigger & Page Context */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="lg:hidden p-2 rounded-xl bg-[#E4EEF3] text-[#173885] hover:bg-[#D9E2EA] transition"
            aria-label="Open vendor navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-[#173885]">
              {profile?.businessName || "GateMate Vendor Portal"}
            </h1>
            <p className="text-[11px] text-[#606460]">
              Pune & PCMC Verified Stockist Terminal
            </p>
          </div>
        </div>

        {/* Right: 30-Min Status & Account */}
        <div className="flex items-center gap-2 sm:gap-3">
          {profile?.isExpress30MinEnabled && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E4EEF3] border border-[#9AAED4]/40 text-[#173885] text-xs font-bold">
              <Zap className="w-3.5 h-3.5 fill-[#3C7DDA] text-[#3C7DDA]" />
              <span>30-Min Dispatch Active</span>
            </span>
          )}

          <Link
            to="/vendor/notifications"
            className="relative p-2.5 rounded-xl bg-[#FEFEFE] border border-[#D9E2EA] hover:border-[#3C7DDA] text-[#606460] hover:text-[#173885] transition"
            title="Vendor Notifications"
          >
            <Bell className="w-4 h-4 text-[#3C7DDA]" />
            <span className="absolute -top-1 -right-1 bg-[#B43D20] text-[#FEFEFE] text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
              2
            </span>
          </Link>

          <Link
            to="/vendor/profile"
            className="px-3 py-1.5 rounded-xl bg-[#E4EEF3] border border-[#9AAED4]/40 text-[#173885] hover:bg-[#D9E2EA] transition flex items-center gap-2 text-xs font-bold"
          >
            <User className="w-4 h-4 text-[#173885]" />
            <span className="hidden sm:inline">
              {profile?.contactPerson || "Vendor"}
            </span>
          </Link>

          {user && (
            <button
              onClick={logout}
              className="p-2 rounded-xl bg-[#FEFEFE] border border-[#D9E2EA] text-[#606460] hover:text-[#B43D20] hover:border-[#FBE3DE] transition text-xs"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
