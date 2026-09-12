import React from "react";
import { NavLink, Link } from "react-router-dom";
import { ArrowRight, LogIn, ExternalLink } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const VendorPublicHeader = () => {
  const { user } = useAuth();

  const links = [
    { label: "Sell on GateMate", path: "/sell" },
    { label: "Vendor Guidelines", path: "/vendor/guidelines" },
    { label: "Partner Benefits", path: "/vendor/benefits" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FEFEFE]/95 border-b border-[#D9E2EA] px-4 sm:px-6 md:px-8 py-3.5 shadow-xs backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Wordmark with Vendor Portal Badge */}
        <Link
          to="/sell"
          className="flex items-center gap-3 select-none shrink-0"
          aria-label="GateMate Vendor Home"
        >
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tight leading-none">
              <span className="text-[#173885]">GATE</span>
              <span className="text-[#3C7DDA]">MATE</span>
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#3C7DDA] mt-0.5">
              Stockist & Vendor Portal
            </span>
          </div>
        </Link>

        {/* Public Vendor Links */}
        <nav
          className="hidden md:flex items-center gap-1 bg-[#F4F6FA] p-1 rounded-xl border border-[#D9E2EA]"
          aria-label="Vendor Public Navigation"
        >
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? "bg-[#173885] text-[#FEFEFE] shadow-xs"
                    : "text-[#606460] hover:text-[#173885] hover:bg-[#E4EEF3]"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-[#606460] hover:text-[#173885] px-3 py-2 rounded-xl hover:bg-[#E4EEF3] transition"
          >
            <span>Customer Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {user ? (
            <Link
              to="/vendor/dashboard"
              className="btn-gm-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <span>Vendor Terminal</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#FEFEFE]" />
            </Link>
          ) : (
            <Link
              to="/vendor/onboarding"
              className="btn-gm-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5 text-[#FEFEFE]" />
              <span>Register as Vendor</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
