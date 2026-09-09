import React from "react";
import { NavLink } from "react-router-dom";
import { User, MapPin, Package, Bell } from "lucide-react";

const NAV_ITEMS = [
  { name: "Profile Overview", path: "/account", icon: User, end: true },
  { name: "My Orders", path: "/account/orders", icon: Package },
  { name: "Saved Addresses", path: "/account/addresses", icon: MapPin },
  { name: "Notifications", path: "/account/notifications", icon: Bell },
];

export const AccountNav = () => {
  return (
    <div className="premium-card p-3 rounded-2xl flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                isActive
                  ? "bg-[#172a4d] text-amber-400 border border-amber-400/30 shadow"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Icon className="w-4 h-4" />
            <span>{item.name}</span>
          </NavLink>
        );
      })}
    </div>
  );
};
