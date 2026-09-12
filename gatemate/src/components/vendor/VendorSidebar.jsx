import React from "react";
import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  FileText,
  Receipt,
  CreditCard,
  Banknote,
  Star,
  Bell,
  FileCode2,
  Award,
  User,
  ExternalLink,
  X,
} from "lucide-react";

export const VendorSidebar = ({ onCloseMobile }) => {
  const navSections = [
    {
      title: "Storefront & Inventory",
      items: [
        {
          label: "Dashboard",
          path: "/vendor/dashboard",
          icon: LayoutDashboard,
        },
        { label: "Products", path: "/vendor/products", icon: Package },
        { label: "Inventory & Stock", path: "/vendor/inventory", icon: Boxes },
        { label: "Site Orders", path: "/vendor/orders", icon: ShoppingCart },
      ],
    },
    {
      title: "Commercial B2B & RFQs",
      items: [
        { label: "Project RFQs", path: "/vendor/rfqs", icon: FileText },
        {
          label: "Active Quotations",
          path: "/vendor/quotations",
          icon: Receipt,
        },
      ],
    },
    {
      title: "Payouts & Feedback",
      items: [
        { label: "Payments", path: "/vendor/payments", icon: CreditCard },
        { label: "Settlements", path: "/vendor/settlements", icon: Banknote },
        { label: "Customer Reviews", path: "/vendor/reviews", icon: Star },
        { label: "Notifications", path: "/vendor/notifications", icon: Bell },
      ],
    },
    {
      title: "Vendor Hub & Policy",
      items: [
        { label: "Depot Profile", path: "/vendor/profile", icon: User },
        {
          label: "Vendor Guidelines",
          path: "/vendor/guidelines",
          icon: FileCode2,
        },
        { label: "Partner Benefits", path: "/vendor/benefits", icon: Award },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#FEFEFE] border-r border-[#D9E2EA] flex flex-col justify-between h-full overflow-y-auto">
      <div>
        {/* Brand Wordmark */}
        <div className="p-5 border-b border-[#D9E2EA] flex items-center justify-between">
          <Link
            to="/vendor/dashboard"
            className="flex flex-col select-none"
            onClick={onCloseMobile}
          >
            <span className="text-xl font-black tracking-tight leading-none">
              <span className="text-[#173885]">GATE</span>
              <span className="text-[#3C7DDA]">MATE</span>
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#3C7DDA] mt-0.5">
              Stockist & Vendor Portal
            </span>
          </Link>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-[#606460] hover:bg-[#E4EEF3]"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="p-3 space-y-5">
          {navSections.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#6F8A92] block">
                {sec.title}
              </span>
              {sec.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/vendor/dashboard"}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
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
            </div>
          ))}
        </div>
      </div>

      {/* Customer Store Link Footer */}
      <div className="p-4 border-t border-[#D9E2EA]">
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full btn-gm-secondary py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
        >
          <span>Customer Store</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </aside>
  );
};
