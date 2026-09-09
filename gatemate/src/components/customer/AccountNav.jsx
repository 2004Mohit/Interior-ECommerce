import React from "react";
import { NavLink } from "react-router-dom";
import {
  User,
  MapPin,
  Package,
  Heart,
  MessageSquare,
  Bell,
  Sliders,
  Building2,
} from "lucide-react";
import { useWishlist } from "../../context/WishlistContext";

export const AccountNav = () => {
  const { wishlistCount } = useWishlist();

  const NAV_ITEMS = [
    { name: "Profile Overview", path: "/account", icon: User, end: true },
    {
      name: "Saved Wishlist",
      path: "/account/wishlist",
      icon: Heart,
      count: wishlistCount,
    },
    { name: "My Orders", path: "/account/orders", icon: Package },
    { name: "Delivery Addresses", path: "/account/addresses", icon: MapPin },
    { name: "Architect / B2B Hub", path: "/account/b2b", icon: Building2 },
    { name: "My Reviews", path: "/account/reviews", icon: MessageSquare },
    { name: "Notifications", path: "/account/notifications", icon: Bell },
    { name: "Preferences", path: "/account/preferences", icon: Sliders },
  ];

  return (
    <div className="premium-panel p-3 rounded-3xl border border-white/10 space-y-1">
      <div className="px-3 py-2 text-[10px] font-black tracking-widest text-amber-400 uppercase hidden md:block">
        Customer Hub
      </div>

      <div className="flex md:flex-col gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? "bg-[#172a4d] text-amber-300 border border-amber-400/30 shadow-md font-bold"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{item.name}</span>
              </div>
              {item.count > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full hidden md:inline">
                  {item.count}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
