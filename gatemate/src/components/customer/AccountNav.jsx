import React from "react";
import { NavLink } from "react-router-dom";
import {
  User,
  Package,
  MapPin,
  Heart,
  Building2,
  Bell,
  Star,
  Settings,
  MessageSquare,
} from "lucide-react";

export const AccountNav = () => {
  const navItems = [
    {
      title: "Account Profile",
      path: "/account",
      icon: User,
      end: true,
    },
    {
      title: "My Orders",
      path: "/account/orders",
      icon: Package,
    },
    {
      title: "Delivery Addresses",
      path: "/account/addresses",
      icon: MapPin,
    },
    {
      title: "Saved Products",
      path: "/account/wishlist",
      icon: Heart,
    },
    {
      title: "Commercial B2B RFQs",
      path: "/account/b2b",
      icon: Building2,
    },
    {
      title: "Dispatch Notifications",
      path: "/account/notifications",
      icon: Bell,
    },
    {
      title: "Product Reviews",
      path: "/account/reviews",
      icon: Star,
    },
    {
      title: "Help & Inquiries",
      path: "/account/complaints",
      icon: MessageSquare,
    },
    {
      title: "Account Preferences",
      path: "/account/preferences",
      icon: Settings,
    },
  ];

  return (
    <nav className="gm-panel p-3 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-1 shadow-2xs font-sans">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                isActive
                  ? "bg-[#173885] text-[#FEFEFE] shadow-xs"
                  : "text-[#606460] hover:bg-[#E4EEF3] hover:text-[#173885]"
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{item.title}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
