import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  ShieldCheck,
  Zap,
  ArrowRight,
  Boxes,
  CreditCard,
  Star,
  FileText,
  ShoppingCart,
  FileCheck2,
  Check,
  LogIn,
  Clock,
  UserPlus,
} from "lucide-react";
import { VendorPublicHeader } from "./VendorPublicHeader";
import { Footer } from "../Footer";
import { useVendorAuth } from "../../context/VendorAuthContext";
import {
  vendorOnboardingService,
  VENDOR_APPLICATION_STATUS,
} from "../../services/vendorOnboardingService";
import { SeoHead } from "../common/SeoHead";

export const VendorLanding = () => {
  const { vendorUser, isVendorAuthenticated } = useVendorAuth();
  const navigate = useNavigate();
  const [applicationStatus, setApplicationStatus] = useState(null);

  useEffect(() => {
    if (vendorUser?.id) {
      vendorOnboardingService.getApplication(vendorUser.id).then((app) => {
        setApplicationStatus(app?.status);
      });
    }
  }, [vendorUser]);

  const handlePrimaryRegisterClick = (e) => {
    e.preventDefault();

    if (
      isVendorAuthenticated &&
      applicationStatus === VENDOR_APPLICATION_STATUS.APPROVED
    ) {
      navigate("/vendor/dashboard");
    } else if (
      isVendorAuthenticated &&
      (applicationStatus === VENDOR_APPLICATION_STATUS.SUBMITTED ||
        applicationStatus === VENDOR_APPLICATION_STATUS.UNDER_REVIEW ||
        applicationStatus === VENDOR_APPLICATION_STATUS.CHANGES_REQUESTED)
    ) {
      navigate("/vendor/verification");
    } else if (isVendorAuthenticated) {
      navigate("/vendor/onboarding");
    } else {
      navigate("/vendor/register");
    }
  };

  const getPrimaryButtonLabel = () => {
    if (
      isVendorAuthenticated &&
      applicationStatus === VENDOR_APPLICATION_STATUS.APPROVED
    ) {
      return "Open Vendor Dashboard";
    }
    if (
      applicationStatus === VENDOR_APPLICATION_STATUS.SUBMITTED ||
      applicationStatus === VENDOR_APPLICATION_STATUS.UNDER_REVIEW
    ) {
      return "Track Application (Under Review)";
    }
    return "Register as Vendor";
  };

  const marketplacePillars = [
    {
      title: "Digital Product Listings",
      desc: "Catalog your full inventory of Cement, TMT Steel, AAC Blocks, CPVC Pipes, Electrical Cables, and Hardware Products with technical specifications, packaging sizes, and units of supply.",
      icon: Boxes,
    },
    {
      title: "Real-Time Inventory Management",
      desc: "Update live warehouse and depot stock counts, set Minimum Order Quantities (MOQ), and toggle product availability for customer checkout.",
      icon: FileCheck2,
    },
    {
      title: "Normal Site Orders",
      desc: "Receive digital orders from nearby contractors, builders, and retail buyers in your local Pune & PCMC delivery radius with automated dispatch tickets.",
      icon: ShoppingCart,
    },
    {
      title: "Commercial Bulk Orders & Project RFQs",
      desc: "Review developer Bill of Quantities (BOQ) inquiries and submit competitive wholesale bids for full truckload dispatches without sales intermediaries.",
      icon: FileText,
    },
    {
      title: "Automated Payments & Weekly Settlements",
      desc: "Reconcile digital and Pay on Delivery collections with transparent accounting, GST invoice records, and direct weekly NEFT/RTGS bank payouts.",
      icon: CreditCard,
    },
    {
      title: "Customer Product Reviews & Ratings",
      desc: "Build buyer confidence through verified customer reviews and ratings on delivered product batches across construction job sites.",
      icon: Star,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-[#282926] flex flex-col font-sans">
      <SeoHead
        title="Sell Construction Products on Ferrado | Pune & PCMC Stockist Partner Network"
        description="Expand your building supplies and hardware business. Connect with nearby contractors, fulfill site dispatches, manage digital product listings, and receive weekly bank settlements."
        canonicalUrl="/sell"
      />

      <VendorPublicHeader />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-5 max-w-4xl mx-auto">
          <span className="badge-gm-info px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            Hyperlocal Construction Products Marketplace
          </span>

          <h1 className="text-3xl sm:text-5xl font-black text-[#173885] tracking-tight leading-tight">
            Sell Construction Products Directly to Nearby Buyers
          </h1>

          <p className="text-sm sm:text-base text-[#606460] leading-relaxed max-w-3xl mx-auto">
            Ferrado connects authorized stockists, manufacturers, and building
            supply depots in Pune and Pimpri-Chinchwad directly with active
            construction sites, contractors, and project engineers.
          </p>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            {/* Primary Action Button */}
            <button
              onClick={handlePrimaryRegisterClick}
              className="w-full sm:w-auto btn-gm-primary px-8 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md transition active:scale-98"
            >
              <UserPlus className="w-4 h-4 text-[#FEFEFE]" />
              <span>{getPrimaryButtonLabel()}</span>
            </button>

            {/* Vendor Sign In Button */}
            <Link
              to="/vendor/login"
              className="w-full sm:w-auto btn-gm-secondary px-6 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 text-[#173885]" />
              <span>Sign In to Vendor Terminal</span>
            </Link>
          </div>
        </div>

        {/* Capabilities Grid */}
        <div className="space-y-6">
          <div className="text-center space-y-1 max-w-2xl mx-auto">
            <h2 className="text-2xl font-black text-[#173885]">
              Complete Vendor Commerce Architecture
            </h2>
            <p className="text-xs text-[#606460]">
              Everything you need to digitize local construction product sales
              and project fulfillment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {marketplacePillars.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="gm-card p-6 rounded-3xl space-y-3.5 border border-[#D9E2EA]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#E4EEF3] border border-[#9AAED4]/40 flex items-center justify-center text-[#173885]">
                    <Icon className="w-6 h-6 text-[#173885]" />
                  </div>
                  <h3 className="text-base font-bold text-[#173885]">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#606460] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
