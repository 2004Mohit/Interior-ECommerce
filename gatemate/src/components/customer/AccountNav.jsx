import React from "react";
import { NavLink } from "react-router-dom";
import {
  User,
  Package,
  MapPin,
  Bell,
  Heart,
  Building2,
  MessageSquare,
} from "lucide-react";

export const AccountNav = () => {
  const navItems = [
    { label: "Account Profile", path: "/account", icon: User },
    { label: "Order History", path: "/account/orders", icon: Package },
    { label: "Delivery Addresses", path: "/account/addresses", icon: MapPin },
    { label: "Saved Products", path: "/account/wishlist", icon: Heart },
    { label: "Commercial B2B RFQs", path: "/account/b2b", icon: Building2 },
    {
      label: "Customer Reviews",
      path: "/account/reviews",
      icon: MessageSquare,
    },
    { label: "Notifications", path: "/account/notifications", icon: Bell },
  ];

  return (
    <nav className="gm-panel p-3 rounded-2xl space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/account"}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? "bg-[#173885] text-[#FEFEFE] font-bold shadow-xs"
                  : "text-[#606460] hover:text-[#173885] hover:bg-[#E4EEF3]"
              }`
            }
          >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
