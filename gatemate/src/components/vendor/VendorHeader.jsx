import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  User,
  Menu,
  ShieldCheck,
  Zap,
  LogOut,
  ShieldAlert,
  Clock,
} from "lucide-react";

import { useVendorAuth } from "../../context/VendorAuthContext";
import { supabase } from "../../lib/supabaseClient";

import {
  vendorOnboardingService,
  VENDOR_APPLICATION_STATUS,
} from "../../services/vendorOnboardingService";

export const VendorHeader = ({ onOpenMobileNav }) => {
  const navigate = useNavigate();
  const { vendorUser, logout } = useVendorAuth();

  const [profile, setProfile] = useState(null);
  const [appStatus, setAppStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadVendorData = async () => {
      if (!vendorUser?.id) {
        if (mounted) {
          setProfile(null);
          setAppStatus(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        /*
         * vendorUser.id = auth.users.id
         *
         * vendor_profiles.user_id = auth.users.id
         *
         * vendor_profiles.id is a different UUID.
         */

        const { data: vendorProfile, error: profileError } = await supabase
          .from("vendor_profiles")
          .select(
            `
              id,
              user_id,
              business_name,
              trade_name,
              business_type,
              contact_person,
              designation,
              email,
              phone,
              gstin,
              pan_number,
              yard_address_line1,
              locality,
              city,
              state,
              pincode,
              serviceable_pincodes,
              has_heavy_trailer_access,
              is_express_30min_enabled,
              verification_status,
              reviewer_notes,
              reviewed_at,
              reviewed_by,
              bank_details,
              created_at,
              updated_at
            `,
          )
          .eq("user_id", vendorUser.id)
          .maybeSingle();

        if (profileError) {
          throw new Error(
            `Unable to load vendor profile: ${profileError.message}`,
          );
        }

        /*
         * Load application status separately.
         */
        const application = await vendorOnboardingService.getApplication(
          vendorUser.id,
        );

        if (mounted) {
          setProfile(vendorProfile || null);
          setAppStatus(application?.status || null);
        }
      } catch (error) {
        console.error("Failed to load vendor header data:", error);

        if (mounted) {
          setProfile(null);
          setAppStatus(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadVendorData();

    return () => {
      mounted = false;
    };
  }, [vendorUser?.id]);

  const getStatusBadge = () => {
    /*
     * Prefer vendor_profiles.verification_status
     * because this is the current vendor profile state.
     *
     * Fall back to vendor_applications.status for
     * vendors still going through onboarding.
     */
    const status = profile?.verification_status || appStatus;

    if (status === VENDOR_APPLICATION_STATUS.APPROVED) {
      return (
        <span className="badge-gm-success px-2.5 py-0.5 rounded-full text-[10px] flex items-center gap-1 font-bold">
          <ShieldCheck className="w-3 h-3" />
          Approved
        </span>
      );
    }

    if (
      status === VENDOR_APPLICATION_STATUS.SUBMITTED ||
      status === VENDOR_APPLICATION_STATUS.UNDER_REVIEW
    ) {
      return (
        <Link
          to="/vendor/verification"
          className="bg-[#E3EBFA] text-[#173885] border border-[#2E4D94]/30 px-2.5 py-0.5 rounded-full text-[10px] flex items-center gap-1 font-bold hover:underline"
        >
          <Clock className="w-3 h-3 text-[#3C7DDA]" />
          Under Review
        </Link>
      );
    }

    if (status === VENDOR_APPLICATION_STATUS.CHANGES_REQUESTED) {
      return (
        <Link
          to="/vendor/verification"
          className="bg-[#FFF0D5] text-[#A66A08] border border-[#A66A08]/30 px-2.5 py-0.5 rounded-full text-[10px] flex items-center gap-1 font-bold hover:underline"
        >
          <ShieldAlert className="w-3 h-3" />
          Changes Requested
        </Link>
      );
    }

    if (status === VENDOR_APPLICATION_STATUS.REJECTED) {
      return (
        <Link
          to="/vendor/verification"
          className="bg-[#FBE3DE] text-[#B43D20] border border-[#B43D20]/30 px-2.5 py-0.5 rounded-full text-[10px] flex items-center gap-1 font-bold hover:underline"
        >
          Rejected
        </Link>
      );
    }

    return null;
  };

  /*
   * Real vendor business name.
   */
  const businessName =
    profile?.trade_name ||
    profile?.business_name ||
    vendorUser?.user_metadata?.businessName ||
    vendorUser?.user_metadata?.business_name ||
    "Vendor Portal";

  /*
   * Real contact person.
   */
  const contactPerson =
    profile?.contact_person ||
    vendorUser?.user_metadata?.contactPerson ||
    vendorUser?.user_metadata?.contact_person ||
    "Vendor";

  return (
    <header className="sticky top-0 z-30 w-full bg-[#FEFEFE]/95 border-b border-[#D9E2EA] px-4 sm:px-6 py-3 shadow-xs backdrop-blur-md">
      <div className="flex items-center justify-between gap-4">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="lg:hidden p-2 rounded-xl bg-[#E4EEF3] text-[#173885] hover:bg-[#D9E2EA] transition"
            aria-label="Open vendor navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-[#173885] truncate max-w-[320px]">
                {loading ? "Loading vendor..." : businessName}
              </h1>

              {getStatusBadge()}
            </div>

            <p className="text-[11px] text-[#606460]">
              {profile?.city && profile?.state
                ? `${profile.city}, ${profile.state}`
                : "Vendor Portal"}
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          {profile?.is_express_30min_enabled && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E4EEF3] border border-[#9AAED4]/40 text-[#173885] text-xs font-bold">
              <Zap className="w-3.5 h-3.5 fill-[#3C7DDA] text-[#3C7DDA]" />
              <span>30-Min Dispatch Active</span>
            </span>
          )}

          <Link
            to="/vendor/notifications"
            className="relative p-2.5 rounded-xl bg-[#FEFEFE] border border-[#D9E2EA] hover:border-[#3C7DDA] text-[#606460] hover:text-[#173885] transition"
            title="Vendor Notifications"
          >
            <Bell className="w-4 h-4 text-[#3C7DDA]" />

            <span className="absolute -top-1 -right-1 bg-[#B43D20] text-[#FEFEFE] text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
              2
            </span>
          </Link>

          <Link
            to="/vendor/profile"
            className="px-3 py-1.5 rounded-xl bg-[#E4EEF3] border border-[#9AAED4]/40 text-[#173885] hover:bg-[#D9E2EA] transition flex items-center gap-2 text-xs font-bold"
          >
            <User className="w-4 h-4 text-[#173885]" />

            <span className="hidden sm:inline">{contactPerson}</span>
          </Link>

          {vendorUser && (
            <button
              onClick={async () => {
                try {
                  await logout();
                  navigate("/sell", { replace: true });
                } catch (error) {
                  console.error("Vendor sign out failed:", error);
                }
              }}
              className="p-2 rounded-xl bg-[#FEFEFE] border border-[#D9E2EA] text-[#606460] hover:text-[#B43D20] hover:border-[#FBE3DE] transition text-xs"
              title="Sign Out of Vendor Portal"
              aria-label="Sign Out of Vendor Portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
