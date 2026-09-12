import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  User,
} from "lucide-react";

export const VendorMobileNav = () => {
  const items = [
    { label: "Dashboard", path: "/vendor/dashboard", icon: LayoutDashboard },
    { label: "Products", path: "/vendor/products", icon: Package },
    { label: "Orders", path: "/vendor/orders", icon: ShoppingCart },
    { label: "RFQs", path: "/vendor/rfqs", icon: FileText },
    { label: "Profile", path: "/vendor/profile", icon: User },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FEFEFE]/95 border-t border-[#D9E2EA] px-2 py-2 shadow-lg backdrop-blur-md flex items-center justify-around"
      aria-label="Vendor Mobile Navigation"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-xl transition ${
                isActive ? "text-[#173885] font-bold" : "text-[#606460]"
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
