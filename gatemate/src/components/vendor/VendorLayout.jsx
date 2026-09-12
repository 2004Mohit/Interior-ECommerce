import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { VendorSidebar } from "./VendorSidebar";
import { VendorHeader } from "./VendorHeader";
import { VendorMobileNav } from "./VendorMobileNav";

export const VendorLayout = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-[#282926] flex flex-col font-sans">
      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block shrink-0 sticky top-0 h-screen">
          <VendorSidebar />
        </div>

        {/* Mobile Sidebar Modal Drawer */}
        {mobileNavOpen && (
          <div
            className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs lg:hidden flex"
            role="dialog"
            aria-modal="true"
          >
            <VendorSidebar onCloseMobile={() => setMobileNavOpen(false)} />
            <div className="flex-1" onClick={() => setMobileNavOpen(false)} />
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <VendorHeader onOpenMobileNav={() => setMobileNavOpen(true)} />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <VendorMobileNav />
    </div>
  );
};
