import React from "react";
import {
  RotateCcw,
  Lock,
  PackageX,
  CreditCard,
  Ban,
  WifiOff,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

/**
 * 1. Error State
 */
export const ErrorStateView = ({
  title = "Something went wrong",
  description = "Unable to complete this request. Please verify your connection and try again.",
  onRetry,
  actionLabel = "Try Again",
}) => (
  <div className="gm-panel p-8 sm:p-12 rounded-3xl text-center space-y-4 max-w-md mx-auto my-6">
    <div className="w-14 h-14 rounded-2xl bg-[#FBE3DE] text-[#B43D20] flex items-center justify-center mx-auto border border-[#B43D20]/20">
      <WifiOff className="w-7 h-7" />
    </div>
    <div>
      <h3 className="text-base font-bold text-[#173885]">{title}</h3>
      <p className="text-xs text-[#606460] mt-1 leading-relaxed">
        {description}
      </p>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="btn-gm-primary px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 active:scale-95"
      >
        <RotateCcw className="w-3.5 h-3.5 text-[#FEFEFE]" />
        <span>{actionLabel}</span>
      </button>
    )}
  </div>
);

/**
 * 2. Empty State
 */
export const EmptyStateView = ({
  icon: Icon = PackageX,
  title = "No products found",
  description = "Try adjusting your filters, searching for a different keyword, or explore all categories.",
  actionLink = "/products",
  actionLabel = "Browse Catalogue",
  onActionClick,
}) => (
  <div className="gm-panel p-8 sm:p-14 rounded-3xl text-center space-y-4 max-w-md mx-auto my-6">
    <div className="w-14 h-14 rounded-2xl bg-[#E4EEF3] text-[#173885] flex items-center justify-center mx-auto border border-[#D9E2EA]">
      <Icon className="w-7 h-7" />
    </div>
    <div>
      <h3 className="text-base font-bold text-[#173885]">{title}</h3>
      <p className="text-xs text-[#606460] mt-1 leading-relaxed">
        {description}
      </p>
    </div>
    {onActionClick ? (
      <button
        onClick={onActionClick}
        className="btn-gm-primary px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 active:scale-95"
      >
        <span>{actionLabel}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    ) : actionLink ? (
      <Link
        to={actionLink}
        className="btn-gm-primary px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 active:scale-95 shadow-xs"
      >
        <span>{actionLabel}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    ) : null}
  </div>
);

/**
 * 3. Auth-Required State
 */
export const AuthRequiredStateView = ({
  title = "Authentication Required",
  description = "Please sign in to access your personal dashboard, saved addresses, and verified orders.",
  onOpenAuth,
}) => (
  <div className="gm-panel p-8 sm:p-14 rounded-3xl text-center space-y-4 max-w-md mx-auto my-8">
    <div className="w-14 h-14 rounded-2xl bg-[#E4EEF3] text-[#173885] flex items-center justify-center mx-auto border border-[#9AAED4]/40">
      <Lock className="w-7 h-7" />
    </div>
    <div>
      <h3 className="text-base font-bold text-[#173885]">{title}</h3>
      <p className="text-xs text-[#606460] mt-1 leading-relaxed">
        {description}
      </p>
    </div>
    <button
      onClick={onOpenAuth}
      className="btn-gm-primary px-6 py-3 rounded-xl text-xs font-bold inline-flex items-center gap-2 active:scale-95 shadow-sm"
    >
      <Lock className="w-3.5 h-3.5 text-[#FEFEFE]" />
      <span>Sign In / Create Account</span>
    </button>
  </div>
);

/**
 * 4. Payment Status Card
 */
export const PaymentStatusCard = ({
  status,
  onRetryPayment,
  onSwitchToCod,
}) => {
  if (status === "PENDING") {
    return (
      <div className="p-4 rounded-2xl bg-[#E3EBFA] border border-[#2E4D94]/30 text-[#2E4D94] text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-[#173885]">
          <CreditCard className="w-4 h-4 text-[#3C7DDA] animate-pulse" />
          <span>Payment Pending Confirmation</span>
        </div>
        <p className="text-[11px] leading-relaxed text-[#606460]">
          Your payment is currently being verified with the bank gateway. Your
          order will auto-confirm once verified.
        </p>
      </div>
    );
  }

  if (status === "FAILED" || status === "CANCELLED") {
    return (
      <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs space-y-3">
        <div className="flex items-center gap-2 font-bold text-[#B43D20]">
          <Ban className="w-4 h-4 text-[#B43D20]" />
          <span>
            {status === "CANCELLED"
              ? "Payment Cancelled by User"
              : "Payment Transaction Failed"}
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-[#606460]">
          The transaction could not be authorized. No funds were debited, or any
          temporary bank hold will reverse within 2-4 hours.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {onRetryPayment && (
            <button
              onClick={onRetryPayment}
              className="btn-gm-primary px-3.5 py-2 rounded-xl text-xs font-bold"
            >
              Retry Payment
            </button>
          )}
          {onSwitchToCod && (
            <button
              onClick={onSwitchToCod}
              className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold"
            >
              Pay on Delivery Instead
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
};
