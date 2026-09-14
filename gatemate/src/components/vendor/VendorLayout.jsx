import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, ShieldCheck, LogOut } from "lucide-react";
import { VendorSidebar } from "./VendorSidebar";
import { useVendorAuth } from "../../context/VendorAuthContext";

export const VendorLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { logoutVendor, vendorUser } = useVendorAuth();

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-[#282926] flex font-sans">
      {/* Sidebar Component */}
      <VendorSidebar
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Terminal Viewport Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Operational Status Bar */}
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
                Depot Terminal:
              </span>
              <span className="text-xs font-bold text-[#282926] truncate max-w-[220px] sm:max-w-md">
                {vendorUser?.businessName ||
                  "Pune Infrastructure Supplies Depot"}
              </span>
            </div>
          </div>

          {/* User Info & Sign Out - Fixed */}
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-[#3F7D20] bg-[#E1F2D9] border border-[#3F7D20]/30 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Verified Stockist</span>
            </div>
            <button
              onClick={logoutVendor}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-[#B43D20] hover:bg-[#FBE3DE] transition"
            >
              <LogOut className="w-22 h-4 shrink-0" />
            </button>
          </div>
        </header>

        {/* Nested Page Routes */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
