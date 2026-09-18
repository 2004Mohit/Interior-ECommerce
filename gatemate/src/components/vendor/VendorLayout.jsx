import React, { useState } from "react";
import { Outlet } from "react-router-dom";

import { VendorSidebar } from "./VendorSidebar";
import { VendorHeader } from "./VendorHeader";

export const VendorLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-[#282926] flex font-sans">
      <VendorSidebar
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <VendorHeader onOpenMobileNav={() => setIsMobileOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
