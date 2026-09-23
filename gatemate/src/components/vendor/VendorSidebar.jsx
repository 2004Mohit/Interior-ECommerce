import React from "react";
import { NavLink } from "react-router-dom";
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
  User,
  ShieldCheck,
  Award,
  BookOpen,
  X,
} from "lucide-react";

export const VendorSidebar = ({ isMobileOpen, onCloseMobile }) => {
  const navigationSections = [
    {
      title: "Operations",
      links: [
        {
          to: "/vendor/dashboard",
          label: "Terminal Dashboard",
          icon: LayoutDashboard,
        },
        { to: "/vendor/products", label: "Products Catalogue", icon: Package },
        { to: "/vendor/inventory", label: "Depot Inventory", icon: Boxes },
        {
          to: "/vendor/orders",
          label: "Normal Site Orders",
          icon: ShoppingCart,
        },
        { to: "/vendor/rfqs", label: "Bulk Orders & RFQs", icon: FileText },
        {
          to: "/vendor/quotations",
          label: "Quotations Tracker",
          icon: Receipt,
        },
      ],
    },
    {
      title: "Payouts & Feedback",
      links: [
        {
          to: "/vendor/payments",
          label: "Transactions & 5%",
          icon: CreditCard,
        },
        { to: "/vendor/settlements", label: "Bank Disbursals", icon: Banknote },
        { to: "/vendor/reviews", label: "Customer Reviews", icon: Star },
        { to: "/vendor/notifications", label: "Notifications", icon: Bell },
      ],
    },
    {
      title: "Compliance & Program",
      links: [
        {
          to: "/vendor/verification",
          label: "Verification Status",
          icon: ShieldCheck,
        },
        {
          to: "/vendor/guidelines",
          label: "Vendor Guidelines",
          icon: BookOpen,
        },
        { to: "/vendor/benefits", label: "Partner Benefits", icon: Award },
        { to: "/vendor/profile", label: "Depot Profile", icon: User },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-[#173885]/60 backdrop-blur-xs lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Fixed Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 h-screen bg-[#FEFEFE] border-r border-[#D9E2EA] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Top Header - Fixed */}
        <div className="p-3.5 sm:p-4 border-b border-[#D9E2EA] flex items-center justify-between shrink-0 bg-[#FEFEFE]">
          <NavLink to="/vendor/dashboard" className="flex flex-col select-none">
            <span className="text-xl font-black tracking-tight leading-none">
              <span className="text-[#173885]">FERRA</span>
              <span className="text-[#3C7DDA]">DO</span>
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#6F8A92] mt-0.5">
              Vendor Terminal
            </span>
          </NavLink>

          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-[#606460] hover:bg-[#E4EEF3] transition"
            aria-label="Close navigation sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <nav className="p-2.5 space-y-4 flex-1 overflow-y-auto min-h-0 overscroll-contain">
          {navigationSections.map((section, idx) => (
            <div key={idx} className="space-y-0.5">
              <span className="text-[10px] font-bold text-[#6F8A92] uppercase tracking-wider px-2.5 block mb-1">
                {section.title}
              </span>
              {section.links.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold transition ${
                        isActive
                          ? "bg-[#173885] text-[#FEFEFE] shadow-xs"
                          : "text-[#606460] hover:text-[#173885] hover:bg-[#E4EEF3]"
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{link.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};
