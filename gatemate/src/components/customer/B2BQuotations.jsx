import React, { useState, useEffect } from "react";
import { AccountNav } from "./AccountNav";
import { useAuth } from "../../context/AuthContext";
import { profileService } from "../../services/profileService";
import { b2bService } from "../../services/b2bService";
import { PRODUCTS_DATA } from "../../data/mockData";
import {
  Building2,
  ShieldCheck,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  Sparkles,
  Lock,
} from "lucide-react";
import { AuthModal } from "../AuthModal";

export const B2BQuotations = () => {
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);

  // GST Registration Form
  const [gstInput, setGstInput] = useState("");
  const [companyInput, setCompanyInput] = useState("");
  const [businessType, setBusinessType] = useState(
    "Architectural / Interior Contractor",
  );
  const [isVerifyingGst, setIsVerifyingGst] = useState(false);

  // New RFQ Modal Form
  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  const [rfqForm, setRfqForm] = useState({
    projectName: "",
    productId: "2",
    quantity: 10,
    siteLocation: "Pune / PCMC",
    notes: "",
  });
  const [isSubmittingRfq, setIsSubmittingRfq] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const p = await profileService.getProfile(user.id, user);
      setProfile(p);
      if (p.b2bProfile) {
        setGstInput(p.b2bProfile.gstNumber || "");
        setCompanyInput(p.b2bProfile.companyName || "");
        setBusinessType(
          p.b2bProfile.businessType || "Architectural / Interior Contractor",
        );
      }

      const qList = await b2bService.getQuotations(user.id);
      setQuotations(qList);
    } catch (e) {
      setError("Error loading business records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [user, authLoading]);

  if (!authLoading && !user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <h1 className="text-2xl font-black text-white">B2B Commercial Hub</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <AccountNav />
          </div>
          <div className="md:col-span-3">
            <div className="premium-panel p-12 rounded-3xl text-center space-y-4 max-w-md mx-auto">
              <Building2 className="w-12 h-12 text-amber-400 mx-auto" />
              <h2 className="text-lg font-bold text-white">
                Sign In for B2B Pricing
              </h2>
              <p className="text-xs text-slate-400">
                Architects & contractors can access GST invoicing and commercial
                quotation tools upon signing in.
              </p>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="gold-gradient-btn px-6 py-3 rounded-xl text-xs font-bold shadow-lg"
              >
                Sign In to B2B Hub
              </button>
            </div>
          </div>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => {
            setAuthModalOpen(false);
            loadData();
          }}
        />
      </div>
    );
  }

  const handleVerifyAndSaveGST = async (e) => {
    e.preventDefault();
    setIsVerifyingGst(true);
    setError(null);

    const validation = b2bService.validateGSTIN(gstInput);
    if (!validation.isValid) {
      setError(validation.message);
      setIsVerifyingGst(false);
      return;
    }

    if (!companyInput.trim()) {
      setError("Please provide your registered legal company name.");
      setIsVerifyingGst(false);
      return;
    }

    const updatedProfile = {
      ...profile,
      b2bProfile: {
        isB2BRegistered: true,
        companyName: companyInput.trim(),
        gstNumber: validation.formattedGst,
        businessType,
        stateCode: validation.stateCode,
      },
    };

    try {
      await profileService.updateProfile(user.id, updatedProfile);
      setProfile(updatedProfile);
      setNotice(`${validation.message}. Your B2B partner account is active!`);
      setTimeout(() => setNotice(null), 4000);
    } catch (err) {
      setError("Failed to save business credentials.");
    } finally {
      setIsVerifyingGst(false);
    }
  };

  const handleSubmitRfq = async (e) => {
    e.preventDefault();
    setIsSubmittingRfq(true);
    setError(null);

    const selectedProduct = PRODUCTS_DATA.find(
      (p) => p.id === rfqForm.productId,
    );

    try {
      const res = await b2bService.submitQuotation(user.id, {
        projectName: rfqForm.projectName,
        productName: selectedProduct?.name || "Gate Hardware Selection",
        quantity: Number(rfqForm.quantity),
        siteLocation: rfqForm.siteLocation,
        notes: rfqForm.notes,
      });

      if (res.success) {
        setIsRfqModalOpen(false);
        setNotice(res.message);
        loadData();
        setTimeout(() => setNotice(null), 4000);
      }
    } catch (err) {
      setError("Failed to submit RFQ.");
    } finally {
      setIsSubmittingRfq(false);
    }
  };

  const isB2BActive = Boolean(profile?.b2bProfile?.isB2BRegistered);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24">
      {/* Header */}
      <div className="border-b border-white/10 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-black text-white">
              Architect & Contractor Hub
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Commercial bulk quotes, GST input tax credits (ITC), and Pune / PCMC
            architectural procurement.
          </p>
        </div>

        {isB2BActive && (
          <button
            onClick={() => setIsRfqModalOpen(true)}
            className="gold-gradient-btn px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Request Bulk Quote (RFQ)</span>
          </button>
        )}
      </div>

      {notice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1">
          <AccountNav />
        </div>

        {/* Content Body */}
        <div className="md:col-span-3 space-y-6">
          {/* Section 1: Business Profile / GST Registration */}
          <div className="premium-panel p-6 sm:p-8 rounded-3xl space-y-5 border border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Business Verification & GSTIN
                </h3>
                <p className="text-xs text-slate-400">
                  Enter your business details for GST tax invoicing in
                  Maharashtra[cite: 1].
                </p>
              </div>
              {isB2BActive && (
                <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED B2B
                </span>
              )}
            </div>

            <form onSubmit={handleVerifyAndSaveGST} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Registered Company / Firm Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Skyline Architecture & Hardware LLP"
                    value={companyInput}
                    onChange={(e) => setCompanyInput(e.target.value)}
                    className="w-full premium-input px-3.5 py-2.5 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    15-Digit GSTIN Number *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    placeholder="27AAAAA0000A1Z5"
                    value={gstInput}
                    onChange={(e) => setGstInput(e.target.value.toUpperCase())}
                    className="w-full premium-input px-3.5 py-2.5 rounded-xl text-xs font-mono uppercase font-bold tracking-wider"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Trade Category
                </label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full premium-input px-3.5 py-2.5 rounded-xl text-xs font-semibold"
                >
                  <option value="Architectural / Interior Contractor">
                    Architectural / Interior Contractor
                  </option>
                  <option value="Civil Gate Fabricator & Builder">
                    Civil Gate Fabricator & Builder
                  </option>
                  <option value="Society Facility Manager">
                    Society Facility Manager (PMC / PCMC)
                  </option>
                  <option value="Hardware Reseller & Wholesaler">
                    Hardware Reseller & Wholesaler
                  </option>
                </select>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isVerifyingGst}
                  className="gold-gradient-btn px-6 py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  {isVerifyingGst
                    ? "Validating GSTIN..."
                    : isB2BActive
                      ? "Update GST Credentials"
                      : "Verify & Activate B2B Partner"}
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Active Quotations List */}
          <div className="premium-panel p-6 sm:p-8 rounded-3xl space-y-4 border border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Commercial RFQs & Bulk Quotations
                </h3>
                <p className="text-xs text-slate-400">
                  Track quotes generated for projects across Pune & PCMC[cite:
                  1].
                </p>
              </div>
            </div>

            {quotations.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-300">
                  No quotation requests logged yet.
                </p>
                {isB2BActive && (
                  <button
                    onClick={() => setIsRfqModalOpen(true)}
                    className="gold-gradient-btn px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Submit Your First RFQ
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {quotations.map((q) => (
                  <div
                    key={q.id}
                    className="premium-card p-4 rounded-2xl space-y-3 border border-white/5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                      <div>
                        <span className="text-[10px] font-mono text-amber-400 font-bold">
                          {q.id}
                        </span>
                        <h4 className="text-xs font-bold text-white">
                          {q.projectName}
                        </h4>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 self-start sm:self-auto">
                        {q.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">
                          Product
                        </span>
                        <span className="font-semibold text-white">
                          {q.productName}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">
                          Quantity
                        </span>
                        <span className="font-semibold text-amber-300">
                          {q.quantity} units
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">
                          Site Location
                        </span>
                        <span className="font-semibold text-white">
                          {q.siteLocation}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">
                          Estimated Cost
                        </span>
                        <span className="font-mono text-white font-bold">
                          {q.estimatedTotal
                            ? `₹${q.estimatedTotal}`
                            : "Pending Quote"}
                        </span>
                      </div>
                    </div>

                    {q.notes && (
                      <p className="text-[11px] text-slate-400 bg-[#070e1a] p-2.5 rounded-xl border border-white/5">
                        <strong className="text-slate-300">Spec Note: </strong>
                        {q.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RFQ Creation Modal */}
      {isRfqModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a1424] border border-white/10 w-full max-w-lg p-6 sm:p-8 rounded-3xl relative shadow-2xl">
            <button
              onClick={() => setIsRfqModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <h3 className="text-lg font-black text-white mb-1">
              New Commercial RFQ (Bulk Quote)
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Direct factory procurement for estate gates & architectural
              hardware[cite: 1].
            </p>

            <form onSubmit={handleSubmitRfq} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Project / Site Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune CyberCity Gate Automated Access"
                  value={rfqForm.projectName}
                  onChange={(e) =>
                    setRfqForm({ ...rfqForm, projectName: e.target.value })
                  }
                  className="w-full premium-input px-3.5 py-2.5 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Select Hardware Item
                  </label>
                  <select
                    value={rfqForm.productId}
                    onChange={(e) =>
                      setRfqForm({ ...rfqForm, productId: e.target.value })
                    }
                    className="w-full premium-input px-3 py-2 rounded-xl text-xs font-semibold"
                  >
                    {PRODUCTS_DATA.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Required Quantity (Units) *
                  </label>
                  <input
                    type="number"
                    min={5}
                    required
                    value={rfqForm.quantity}
                    onChange={(e) =>
                      setRfqForm({ ...rfqForm, quantity: e.target.value })
                    }
                    className="w-full premium-input px-3.5 py-2 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Delivery Destination / Site (Pune / PCMC) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Baner / Balewadi Road, Pune - 411045"
                  value={rfqForm.siteLocation}
                  onChange={(e) =>
                    setRfqForm({ ...rfqForm, siteLocation: e.target.value })
                  }
                  className="w-full premium-input px-3.5 py-2.5 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Technical Specs & Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Include motor arm linkages, heavy duty bolts, or custom dimensions required..."
                  value={rfqForm.notes}
                  onChange={(e) =>
                    setRfqForm({ ...rfqForm, notes: e.target.value })
                  }
                  className="w-full premium-input p-3 rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRfqModalOpen(false)}
                  className="flex-1 premium-card py-2.5 rounded-xl text-xs font-bold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRfq}
                  className="flex-1 gold-gradient-btn py-2.5 rounded-xl text-xs font-bold"
                >
                  {isSubmittingRfq ? "Submitting..." : "Send RFQ to Vendors"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
