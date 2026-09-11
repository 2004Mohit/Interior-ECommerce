import React, { useState, useEffect } from "react";
import { AccountNav } from "./AccountNav";
import { b2bService } from "../../services/b2bService";
import { useAuth } from "../../context/AuthContext";
import { AuthModal } from "../AuthModal";
import {
  Building2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Send,
  Plus,
  Clock,
  ShieldCheck,
  Lock,
} from "lucide-react";

export const B2BQuotations = () => {
  const { user, loading: authLoading } = useAuth();

  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Form State
  const [rfqForm, setRfqForm] = useState({
    projectName: "",
    gstin: "",
    productName: "",
    quantity: 100,
    siteLocation: "",
    notes: "",
  });

  const [gstValidation, setGstValidation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  const fetchQuotations = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await b2bService.getQuotations(user.id);
      setQuotations(data);
    } catch (err) {
      console.error("Error loading RFQs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchQuotations();
    }
  }, [user, authLoading]);

  const handleGstChange = (e) => {
    const val = e.target.value.toUpperCase();
    setRfqForm({ ...rfqForm, gstin: val });
    if (val.length === 15) {
      setGstValidation(b2bService.validateGSTIN(val));
    } else {
      setGstValidation(null);
    }
  };

  const handleRfqSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (rfqForm.gstin && (!gstValidation || !gstValidation.isValid)) {
      alert(
        "Please enter a valid 15-character GSTIN or leave blank for residential estimate.",
      );
      return;
    }

    setSubmitting(true);
    setNotice(null);

    try {
      const result = await b2bService.submitQuotation(user.id, rfqForm);
      if (result.success) {
        setNotice(result.message);
        setIsFormOpen(false);
        setRfqForm({
          projectName: "",
          gstin: "",
          productName: "",
          quantity: 100,
          siteLocation: "",
          notes: "",
        });
        fetchQuotations();
      }
    } catch (err) {
      console.error("Failed to submit RFQ", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <h1 className="text-2xl font-black text-[#173885]">
          Commercial B2B Quotes
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <AccountNav />
          </div>
          <div className="md:col-span-3">
            <div className="gm-panel p-12 rounded-3xl text-center space-y-4 max-w-md mx-auto">
              <Lock className="w-10 h-10 text-[#173885] mx-auto" />
              <h2 className="text-lg font-bold text-[#173885]">
                Authentication Required
              </h2>
              <p className="text-xs text-[#606460]">
                Sign in to manage volume project estimates and GST billing.
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div>
          <h1 className="text-2xl font-black text-[#173885]">
            Commercial B2B Quotations
          </h1>
          <p className="text-xs text-[#606460]">
            Direct bulk truckload pricing on Cement, TMT Rebars, and AAC Blocks
            for developers & contractors.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="btn-gm-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
        >
          {isFormOpen ? "Close Form" : "+ Request Bulk Project RFQ"}
        </button>
      </div>

      {notice && (
        <div className="p-3.5 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* RFQ Form Box */}
      {isFormOpen && (
        <div className="gm-panel p-6 sm:p-8 rounded-3xl border border-[#3C7DDA]/30 space-y-4 bg-[#FEFEFE]">
          <div className="flex items-center gap-2 border-b border-[#D9E2EA] pb-3">
            <Building2 className="w-5 h-5 text-[#3C7DDA]" />
            <h3 className="text-sm font-bold text-[#173885]">
              New Project Bill of Quantities (BOQ) Quote
            </h3>
          </div>

          <form onSubmit={handleRfqSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#282926] block mb-1">
                  Project / Site Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Baner Commercial Tower Foundation"
                  value={rfqForm.projectName}
                  onChange={(e) =>
                    setRfqForm({ ...rfqForm, projectName: e.target.value })
                  }
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#282926] block mb-1">
                  Company GSTIN (Optional for ITC Credit)
                </label>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="27AAAAA0000A1Z5"
                  value={rfqForm.gstin}
                  onChange={handleGstChange}
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold"
                />
                {gstValidation && (
                  <span
                    className={`text-[10px] mt-1 block font-semibold ${gstValidation.isValid ? "text-[#3F7D20]" : "text-[#B43D20]"}`}
                  >
                    {gstValidation.message}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#282926] block mb-1">
                  Required Construction Product *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tata Tiscon 550D Rebars 12mm / 16mm or UltraTech PPC Bags"
                  value={rfqForm.productName}
                  onChange={(e) =>
                    setRfqForm({ ...rfqForm, productName: e.target.value })
                  }
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#282926] block mb-1">
                  Estimated Quantity *
                </label>
                <input
                  type="number"
                  required
                  min={10}
                  value={rfqForm.quantity}
                  onChange={(e) =>
                    setRfqForm({ ...rfqForm, quantity: Number(e.target.value) })
                  }
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#282926] block mb-1">
                Construction Site Location & Drop Access *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Balewadi High Street, Pune (Trailer access available)"
                value={rfqForm.siteLocation}
                onChange={(e) =>
                  setRfqForm({ ...rfqForm, siteLocation: e.target.value })
                }
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#282926] block mb-1">
                Project Technical Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Specify test certificates required, staggered delivery dates, or unloading preferences..."
                value={rfqForm.notes}
                onChange={(e) =>
                  setRfqForm({ ...rfqForm, notes: e.target.value })
                }
                className="w-full gm-input p-3 rounded-xl text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-gm-primary px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {submitting
                  ? "Submitting Estimate..."
                  : "Submit Commercial Quote Request"}
              </span>
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1">
          <AccountNav />
        </div>

        {/* Existing RFQs List */}
        <div className="md:col-span-3 space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="gm-panel p-6 rounded-3xl h-36 animate-pulse bg-[#E4EEF3]"
                />
              ))}
            </div>
          ) : quotations.length === 0 ? (
            <div className="gm-panel p-16 rounded-3xl text-center space-y-4 max-w-md mx-auto">
              <FileText className="w-12 h-12 text-[#6F8A92] mx-auto" />
              <h3 className="text-lg font-bold text-[#173885]">
                No Commercial RFQs Submitted
              </h3>
              <p className="text-xs text-[#606460] leading-relaxed">
                Need wholesale truckloads for your project? Submit a quotation
                request above for tiered bulk pricing.
              </p>
            </div>
          ) : (
            quotations.map((rfq) => (
              <div
                key={rfq.id}
                className="gm-panel p-5 rounded-3xl space-y-3 border border-[#D9E2EA]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9E2EA] pb-3">
                  <div>
                    <span className="font-mono text-xs font-black text-[#173885]">
                      {rfq.id}
                    </span>
                    <h4 className="text-sm font-bold text-[#282926] mt-0.5">
                      {rfq.projectName}
                    </h4>
                  </div>
                  <span className="badge-gm-info px-3 py-1 rounded-full text-xs self-start sm:self-auto">
                    {rfq.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#606460]">
                  <div>
                    <span className="text-[#6F8A92]">Requested Product: </span>
                    <strong className="text-[#282926]">
                      {rfq.productName}
                    </strong>{" "}
                    ({rfq.quantity} units)
                  </div>
                  <div>
                    <span className="text-[#6F8A92]">Site Destination: </span>
                    <span className="text-[#282926]">{rfq.siteLocation}</span>
                  </div>
                </div>

                {rfq.estimatedTotal && (
                  <div className="pt-2 border-t border-[#D9E2EA] flex items-center justify-between text-xs">
                    <span className="text-emerald-700 font-semibold">
                      {rfq.gstBreakdown}
                    </span>
                    <span className="font-mono text-[#173885] font-black text-sm">
                      ₹{rfq.estimatedTotal} Estimated
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
