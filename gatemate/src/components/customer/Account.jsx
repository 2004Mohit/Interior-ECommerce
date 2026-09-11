import React from "react";
import { Link } from "react-router-dom";
import { AccountNav } from "./AccountNav";
import { useAuth } from "../../context/AuthContext";
import { AuthModal } from "../AuthModal";
import {
  User,
  Package,
  MapPin,
  Heart,
  Building2,
  Bell,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Lock,
  CheckCircle2,
} from "lucide-react";

export const Account = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = React.useState(false);

  if (!authLoading && !user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <h1 className="text-2xl font-black text-[#173885]">Account Profile</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <AccountNav />
          </div>
          <div className="md:col-span-3">
            <div className="gm-panel p-12 rounded-3xl text-center space-y-4 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-[#E4EEF3] text-[#173885] flex items-center justify-center mx-auto border border-[#D9E2EA]">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-[#173885]">
                Sign In to View Profile
              </h2>
              <p className="text-xs text-[#606460]">
                Access your construction order history, saved addresses, and
                commercial project RFQs.
              </p>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="btn-gm-primary px-6 py-3 rounded-xl text-xs font-bold"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => setAuthModalOpen(false)}
        />
      </div>
    );
  }

  const quickLinks = [
    {
      title: "My Orders",
      desc: "Track live dispatches and delivery timelines",
      path: "/account/orders",
      icon: Package,
    },
    {
      title: "Delivery Addresses",
      desc: "Manage your construction site drop points",
      path: "/account/addresses",
      icon: MapPin,
    },
    {
      title: "Saved Products",
      desc: "Products saved for upcoming project phases",
      path: "/account/wishlist",
      icon: Heart,
    },
    {
      title: "Commercial B2B RFQs",
      desc: "Submit and track bulk project estimates",
      path: "/account/b2b",
      icon: Building2,
    },
    {
      title: "Dispatch Notifications",
      desc: "Live alerts for 30-minute priority orders",
      path: "/account/notifications",
      icon: Bell,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24">
      {/* Header Profile Card */}
      <div className="gm-panel p-6 sm:p-8 rounded-3xl border border-[#D9E2EA] flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-[#FEFEFE]">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#E4EEF3] border border-[#9AAED4]/40 flex items-center justify-center text-[#173885] font-black text-xl">
            {user?.user_metadata?.full_name?.[0] ||
              user?.email?.[0]?.toUpperCase() ||
              "C"}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#173885]">
                {user?.user_metadata?.full_name || "Customer Account"}
              </h1>
              <span className="badge-gm-success px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Verified
              </span>
            </div>
            <p className="text-xs text-[#606460] font-mono">{user?.email}</p>
            {user?.phone && (
              <p className="text-xs text-[#6F8A92] font-mono">{user.phone}</p>
            )}
          </div>
        </div>

        <button
          onClick={logout}
          className="btn-gm-secondary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto text-[#B43D20] hover:bg-[#FBE3DE] hover:border-[#FBE3DE]"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1">
          <AccountNav />
        </div>

        {/* Quick Links Dashboard */}
        <div className="md:col-span-3 space-y-4">
          <h2 className="text-sm font-bold text-[#173885] uppercase tracking-wider">
            Account Dashboard
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="gm-card gm-card-hover p-5 rounded-2xl flex items-start justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#E4EEF3] border border-[#9AAED4]/40 flex items-center justify-center text-[#173885] shrink-0 group-hover:bg-[#173885] group-hover:text-[#FEFEFE] transition">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#282926] group-hover:text-[#173885] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-[#606460] mt-0.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#6F8A92] group-hover:text-[#3C7DDA] transition-transform group-hover:translate-x-0.5 shrink-0 mt-1" />
                </Link>
              );
            })}
          </div>

          {/* Regional Hub Info */}
          <div className="p-5 rounded-2xl bg-[#E4EEF3]/60 border border-[#D9E2EA] text-xs text-[#606460] space-y-1">
            <span className="font-bold text-[#173885]">
              Pune & PCMC Construction Logistics Support
            </span>
            <p className="text-[11px] leading-relaxed">
              For on-site offloading coordination, crane access inquiries, or
              mill test certificate batches, contact the Contractor Desk at
              +91-9829012345.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
