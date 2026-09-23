import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  Package,
  Layers,
  Boxes,
  ShoppingCart,
  Truck,
  FileText,
  CreditCard,
  Percent,
  Banknote,
  Users,
  Star,
  MessageSquareWarning,
  Bell,
  ShieldAlert,
  UserPlus,
  LogOut,
  X,
} from "lucide-react";
import { useAdminAuth } from "../../context/AdminAuthContext";

export const AdminSidebar = ({ isMobileOpen, onCloseMobile }) => {
  const { adminUser, logoutAdmin, hasPermission, ADMIN_PERMISSIONS } =
    useAdminAuth();

  const navigationSections = [
    {
      title: "Operations & Moderation",
      links: [
        {
          to: "/admin/dashboard",
          label: "Operations Console",
          icon: LayoutDashboard,
          permission: ADMIN_PERMISSIONS.VIEW_DASHBOARD,
        },
        {
          to: "/admin/vendors",
          label: "Vendor Onboarding",
          icon: Store,
          permission: ADMIN_PERMISSIONS.REVIEW_VENDOR_APPLICATIONS,
        },
        {
          to: "/admin/products",
          label: "Product Approvals",
          icon: Package,
          permission: ADMIN_PERMISSIONS.REVIEW_PRODUCTS,
        },
        {
          to: "/admin/categories",
          label: "Category Management",
          icon: Layers,
          permission: ADMIN_PERMISSIONS.MANAGE_CATEGORIES,
        },
        {
          to: "/admin/attributes",
          label: "Category Attributes",
          icon: Layers,
          permission: ADMIN_PERMISSIONS.MANAGE_ATTRIBUTES,
        },
        {
          to: "/admin/inventory",
          label: "Depot Stock Control",
          icon: Boxes,
          permission: ADMIN_PERMISSIONS.MANAGE_INVENTORY,
        },
        {
          to: "/admin/orders",
          label: "Site Orders Oversight",
          icon: ShoppingCart,
          permission: ADMIN_PERMISSIONS.MANAGE_ORDERS,
        },
        {
          to: "/admin/delivery",
          label: "30-Min Dispatch Zones",
          icon: Truck,
          permission: ADMIN_PERMISSIONS.MANAGE_DELIVERY,
        },
        {
          to: "/admin/rfqs",
          label: "Commercial Project RFQs",
          icon: FileText,
          permission: ADMIN_PERMISSIONS.MANAGE_RFQ,
        },
      ],
    },
    {
      title: "Finance & Ledger",
      links: [
        {
          to: "/admin/payments",
          label: "Payment Transactions",
          icon: CreditCard,
          permission: ADMIN_PERMISSIONS.MANAGE_PAYMENTS,
        },
        {
          to: "/admin/commissions",
          label: "5% Platform Fees",
          icon: Percent,
          permission: ADMIN_PERMISSIONS.MANAGE_COMMISSIONS,
        },
        {
          to: "/admin/settlements",
          label: "Bank Disbursals",
          icon: Banknote,
          permission: ADMIN_PERMISSIONS.MANAGE_SETTLEMENTS,
        },
      ],
    },
    {
      title: "Reputation & Governance",
      links: [
        {
          to: "/admin/staff",
          label: "Admin Staff & Members",
          icon: UserPlus,
        },
        {
          to: "/admin/customers",
          label: "Customer Accounts",
          icon: Users,
          permission: ADMIN_PERMISSIONS.MANAGE_CUSTOMERS,
        },
        {
          to: "/admin/reviews",
          label: "Product Reviews",
          icon: Star,
          permission: ADMIN_PERMISSIONS.MODERATE_REVIEWS,
        },
        {
          to: "/admin/complaints",
          label: "Contractor Disputes",
          icon: MessageSquareWarning,
          permission: ADMIN_PERMISSIONS.MANAGE_COMPLAINTS,
        },
        {
          to: "/admin/audit-logs",
          label: "Platform Audit Logs",
          icon: ShieldAlert,
          permission: ADMIN_PERMISSIONS.VIEW_AUDIT_LOGS,
        },
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

      {/* Fixed Admin Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 h-screen bg-[#FEFEFE] border-r border-[#D9E2EA] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Top Header */}
        <div className="p-3.5 sm:p-4 border-b border-[#D9E2EA] flex items-center justify-between shrink-0 bg-[#FEFEFE]">
          <NavLink to="/admin/dashboard" className="flex flex-col select-none">
            <span className="text-xl font-black tracking-tight leading-none">
              <span className="text-[#173885]">FERRA</span>
              <span className="text-[#3C7DDA]">DO</span>
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#B43D20] mt-0.5">
              Admin Operations Desk
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

        {/* Dynamic Permission-Filtered Nav Links */}
        <nav className="p-2.5 space-y-4 flex-1 overflow-y-auto min-h-0 overscroll-contain">
          {navigationSections.map((section, idx) => {
            const authorizedLinks = section.links.filter(
              (link) => !link.permission || hasPermission(link.permission),
            );

            if (authorizedLinks.length === 0) return null;

            return (
              <div key={idx} className="space-y-0.5">
                <span className="text-[10px] font-bold text-[#6F8A92] uppercase tracking-wider px-2.5 block mb-1">
                  {section.title}
                </span>
                {authorizedLinks.map((link) => {
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
            );
          })}
        </nav>

        {/* Bottom Operator Identity & Sign Out */}
        <div className="p-3 border-t border-[#D9E2EA] bg-[#F4F6FA]/50 shrink-0 space-y-2">
          <div className="px-2 py-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F8A92] block">
              Active Operator
            </span>
            <span className="text-xs font-bold text-[#173885] truncate block">
              {adminUser?.email || "Platform Administrator"}
            </span>
          </div>
          <button
            type="button"
            onClick={logoutAdmin}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-[#B43D20] hover:bg-[#FBE3DE] transition"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out Desk</span>
          </button>
        </div>
      </aside>
    </>
  );
};
