import React, { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { Menu, ShieldCheck, ExternalLink } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";
import { useAdminAuth } from "../../context/AdminAuthContext";

export const AdminLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { adminUser } = useAdminAuth();

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-[#282926] flex font-sans">
      {/* Sidebar Component */}
      <AdminSidebar
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Administrative Viewport */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Status Bar */}
        <header className="sticky top-0 z-30 bg-[#FEFEFE] border-b border-[#D9E2EA] px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#606460] hover:bg-[#E4EEF3] hover:text-[#173885] transition"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[#173885] uppercase tracking-wider hidden sm:inline">
                GateMate Console:
              </span>
              <span className="text-xs font-bold text-[#282926] truncate max-w-[220px] sm:max-w-md">
                Pune & PCMC Hyperlocal Marketplace Oversight
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-[#606460] hover:text-[#173885] hover:underline"
            >
              <span>View Storefront</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#B43D20] bg-[#FBE3DE] border border-[#B43D20]/30 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-[#B43D20]" />
              <span>Super Admin Active</span>
            </div>
          </div>
        </header>

        {/* Nested Workspaces */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
