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

export const ErrorStateView = ({
  title = "Something went wrong",
  description = "Unable to complete this request. Please verify your connection and try again.",
  onRetry,
  actionLabel = "Try Again",
}) => (
  <div className="gm-panel p-8 sm:p-12 rounded-2xl text-center space-y-4 max-w-md mx-auto my-6 font-ui">
    <div className="w-12 h-12 rounded-lg bg-[#E8F8F8] dark:bg-[#081828] text-rose-600 flex items-center justify-center mx-auto border border-[#D8E8E8] dark:border-[#184858]">
      <WifiOff className="w-6 h-6" />
    </div>
    <div>
      <h3 className="font-display text-2xl text-[#082858] dark:text-[#D8F8F8]">
        {title}
      </h3>
      <p className="text-xs text-[#486878] dark:text-[#98C8D0] mt-1 leading-relaxed">
        {description}
      </p>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="btn-primary px-5 py-2.5 rounded-lg text-xs font-bold inline-flex items-center gap-2 active:scale-95"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>{actionLabel}</span>
      </button>
    )}
  </div>
);

export const EmptyStateView = ({
  icon: Icon = PackageX,
  title = "No items found",
  description = "Try adjusting your filters, searching for a different keyword, or explore all categories.",
  actionLink = "/products",
  actionLabel = "Browse Catalog",
  onActionClick,
}) => (
  <div className="gm-panel p-8 sm:p-14 rounded-2xl text-center space-y-4 max-w-md mx-auto my-6 font-ui">
    <div className="w-12 h-12 rounded-lg bg-[#E8F8F8] dark:bg-[#081828] text-[#2888E8] dark:text-[#48B8C8] flex items-center justify-center mx-auto border border-[#D8E8E8] dark:border-[#184858]">
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <h3 className="font-display text-2xl text-[#082858] dark:text-[#D8F8F8]">
        {title}
      </h3>
      <p className="text-xs text-[#486878] dark:text-[#98C8D0] mt-1 leading-relaxed">
        {description}
      </p>
    </div>
    {onActionClick ? (
      <button
        onClick={onActionClick}
        className="btn-primary px-5 py-2.5 rounded-lg text-xs font-bold inline-flex items-center gap-2 active:scale-95"
      >
        <span>{actionLabel}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    ) : actionLink ? (
      <Link
        to={actionLink}
        className="btn-primary px-5 py-2.5 rounded-lg text-xs font-bold inline-flex items-center gap-2 active:scale-95 shadow-xs"
      >
        <span>{actionLabel}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    ) : null}
  </div>
);

export const AuthRequiredStateView = ({
  title = "Authentication Required",
  description = "Please sign in to access your personal dashboard, saved addresses, and verified orders.",
  onOpenAuth,
}) => (
  <div className="gm-panel p-8 sm:p-14 rounded-2xl text-center space-y-4 max-w-md mx-auto my-8 font-ui">
    <div className="w-12 h-12 rounded-lg bg-[#E8F8F8] dark:bg-[#081828] text-[#2888E8] dark:text-[#48B8C8] flex items-center justify-center mx-auto border border-[#D8E8E8] dark:border-[#184858]">
      <Lock className="w-6 h-6" />
    </div>
    <div>
      <h3 className="font-display text-2xl text-[#082858] dark:text-[#D8F8F8]">
        {title}
      </h3>
      <p className="text-xs text-[#486878] dark:text-[#98C8D0] mt-1 leading-relaxed">
        {description}
      </p>
    </div>
    <button
      onClick={onOpenAuth}
      className="btn-primary px-6 py-3 rounded-lg text-xs font-bold inline-flex items-center gap-2 active:scale-95 shadow-xs"
    >
      <Lock className="w-3.5 h-3.5" />
      <span>SIGN IN / CREATE ACCOUNT</span>
    </button>
  </div>
);

export const PaymentStatusCard = ({
  status,
  onRetryPayment,
  onSwitchToCod,
}) => {
  if (status === "PENDING") {
    return (
      <div className="p-4 rounded-xl bg-[#E8F8F8] dark:bg-[#081828] border border-[#D8E8E8] dark:border-[#184858] text-[#082858] dark:text-[#D8F8F8] text-xs space-y-2 font-ui">
        <div className="flex items-center gap-2 font-bold">
          <CreditCard className="w-4 h-4 text-[#2888E8] dark:text-[#48B8C8] animate-pulse" />
          <span>Payment Pending Confirmation</span>
        </div>
        <p className="text-[11px] leading-relaxed text-[#486878] dark:text-[#98C8D0]">
          Your payment is currently being verified with the bank gateway. Your
          order will auto-confirm once verified.
        </p>
      </div>
    );
  }

  if (status === "FAILED" || status === "CANCELLED") {
    return (
      <div className="p-4 rounded-xl bg-rose-50 dark:bg-[#183848] border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 text-xs space-y-3 font-ui">
        <div className="flex items-center gap-2 font-bold">
          <Ban className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <span>
            {status === "CANCELLED"
              ? "Payment Cancelled by User"
              : "Payment Transaction Failed"}
          </span>
        </div>
        <p className="text-[11px] leading-relaxed">
          The transaction could not be authorized. No funds were debited, or any
          temporary bank hold will reverse within 2-4 hours.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {onRetryPayment && (
            <button
              onClick={onRetryPayment}
              className="btn-primary px-3.5 py-2 rounded-lg text-xs font-bold"
            >
              Retry Payment
            </button>
          )}
          {onSwitchToCod && (
            <button
              onClick={onSwitchToCod}
              className="btn-secondary px-3.5 py-2 rounded-lg text-xs font-bold"
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
