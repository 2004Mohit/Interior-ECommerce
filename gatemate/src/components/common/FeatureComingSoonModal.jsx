import React from "react";
import { X, Clock3 } from "lucide-react";

export const FeatureComingSoonModal = ({
  isOpen,
  onClose,
  title = "Coming Soon",
  featureName = "Commercial B2B",
  description,
}) => {
  if (!isOpen) {
    return null;
  }

  const defaultDescription =
    "This feature is currently under development and will be available soon. You can continue using all currently available Ferrado features.";

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feature-coming-soon-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <X size={19} strokeWidth={2} />
        </button>

        {/* Content */}
        <div className="px-6 pb-6 pt-8 sm:px-8 sm:pb-8 sm:pt-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <Clock3 size={30} strokeWidth={1.8} />
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-600">
              {featureName}
            </p>

            <h2
              id="feature-coming-soon-title"
              className="mt-2 text-2xl font-bold tracking-tight text-slate-900"
            >
              {title}
            </h2>

            <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-slate-600">
              {description || defaultDescription}
            </p>
          </div>

          <div className="mt-6 rounded-xl border border-sky-100 bg-sky-50/70 px-4 py-3.5">
            <p className="text-center text-sm font-medium leading-5 text-slate-700">
              We are working on this feature and will make it available in a
              future Ferrado update.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99]"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeatureComingSoonModal;
