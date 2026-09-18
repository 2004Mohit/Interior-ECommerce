import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Building2,
  User,
  MapPin,
  Layers,
  FileCheck2,
  CreditCard,
  Check,
  ArrowRight,
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
  RotateCcw,
  Lock,
} from "lucide-react";
import { useVendorAuth } from "../../context/VendorAuthContext";
import { uploadService } from "../../services/uploadService";
import { fileOptimizer } from "../../utils/fileOptimizer";
import {
  vendorOnboardingService,
  VENDOR_APPLICATION_STATUS,
} from "../../services/vendorOnboardingService";
import { CATALOGUE_CATEGORIES } from "../../data/categories";
import { SeoHead } from "../common/SeoHead";

export const VendorOnboarding = () => {
  const { vendorUser, loading: authLoading } = useVendorAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [formError, setFormError] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);

  const [formData, setFormData] = useState({
    businessDetails: {
      legalBusinessName: "",
      tradeName: "",
      businessType: "Proprietorship",
      gstin: "",
      panNumber: "",
      establishedYear: "2020",
    },
    ownerDetails: {
      primaryContactName: "",
      designation: "Proprietor / Managing Partner",
      email: "",
      mobileNumber: "",
      alternatePhone: "",
    },
    businessAddress: {
      depotAddressLine1: "",
      locality: "",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411028",
      serviceablePincodes: [
        "411001",
        "411004",
        "411006",
        "411014",
        "411028",
        "411061",
      ],
      hasHeavyTrailerAccess: true,
    },
    productCategories: [],
    verificationDocuments: {
      gstCertificateUrl: "",
      gstCertificateName: "",
      panCardUrl: "",
      panCardName: "",
      cancelledChequeUrl: "",
      cancelledChequeName: "",
    },
    bankDetails: {
      bankAccountName: "",
      accountNumber: "",
      confirmAccountNumber: "",
      ifscCode: "",
      bankName: "",
      branchName: "",
    },
  });

  useEffect(() => {
    if (!authLoading && vendorUser) {
      vendorOnboardingService.getApplication(vendorUser.id).then((app) => {
        setApplication(app);
        setFormData({
          businessDetails: {
            ...app.businessDetails,
            legalBusinessName:
              app.businessDetails.legalBusinessName ||
              vendorUser.businessName ||
              "",
          },
          ownerDetails: {
            ...app.ownerDetails,
            primaryContactName:
              app.ownerDetails.primaryContactName ||
              vendorUser.contactPerson ||
              "",
            email: app.ownerDetails.email || vendorUser.email || "",
          },
          businessAddress: app.businessAddress,
          productCategories: app.productCategories,
          verificationDocuments: app.verificationDocuments,
          bankDetails: app.bankDetails,
        });
        setCurrentStep(app.currentStep || 1);
        setLoading(false);
      });
    } else if (!authLoading && !vendorUser) {
      setLoading(false);
    }
  }, [vendorUser, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-6 animate-pulse">
        <div className="h-6 bg-[#E4EEF3] rounded w-1/3" />
        <div className="h-64 bg-[#FEFEFE] rounded-3xl border border-[#D9E2EA]" />
      </div>
    );
  }

  // Intercept unauthenticated vendors
  if (!vendorUser) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#E4EEF3] text-[#173885] flex items-center justify-center mx-auto border border-[#D9E2EA]">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-[#173885]">
          Vendor Account Required
        </h2>
        <p className="text-xs text-[#606460] max-w-md mx-auto leading-relaxed">
          Please create a vendor account to submit your depot onboarding
          credentials and verification documents.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            to="/vendor/register"
            className="btn-gm-primary px-6 py-2.5 rounded-xl text-xs font-bold"
          >
            Register as Vendor
          </Link>
          <Link
            to="/vendor/login"
            className="btn-gm-secondary px-6 py-2.5 rounded-xl text-xs font-bold"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const steps = [
    { num: 1, label: "Business Details", icon: Building2 },
    { num: 2, label: "Owner & Contact", icon: User },
    { num: 3, label: "Depot Address", icon: MapPin },
    { num: 4, label: "Product Categories", icon: Layers },
    { num: 5, label: "Documents", icon: FileCheck2 },
    { num: 6, label: "Bank & Review", icon: CreditCard },
  ];

  const validateStep = (stepNum) => {
    setFormError(null);
    if (stepNum === 1) {
      const { legalBusinessName, gstin, panNumber } = formData.businessDetails;
      if (!legalBusinessName.trim())
        return "Please enter your Legal Business / Depot Name.";
      if (!gstin.trim() || gstin.trim().length !== 15)
        return "Please enter a valid 15-character Indian GSTIN.";
      if (!panNumber.trim() || panNumber.trim().length !== 10)
        return "Please enter a valid 10-character Company / Proprietor PAN.";
    } else if (stepNum === 2) {
      const { primaryContactName, mobileNumber } = formData.ownerDetails;
      if (!primaryContactName.trim())
        return "Please enter the primary contact / managing partner name.";
      if (!/^\d{10}$/.test(mobileNumber.trim()))
        return "Please enter a valid 10-digit mobile phone number.";
    } else if (stepNum === 3) {
      const { depotAddressLine1, locality, pincode } = formData.businessAddress;
      if (!depotAddressLine1.trim() || !locality.trim())
        return "Please provide your physical depot/yard address details.";
      if (!/^\d{6}$/.test(pincode.trim()))
        return "Please enter a valid 6-digit PIN code.";
    } else if (stepNum === 4) {
      if (formData.productCategories.length === 0)
        return "Please select at least 1 construction product category.";
    } else if (stepNum === 5) {
      const { gstCertificateName, panCardName } =
        formData.verificationDocuments;
      if (!gstCertificateName)
        return "Please upload your GST Registration Certificate.";
      if (!panCardName)
        return "Please upload your Business / Proprietor PAN Card copy.";
    } else if (stepNum === 6) {
      const { bankAccountName, accountNumber, confirmAccountNumber, ifscCode } =
        formData.bankDetails;
      if (!bankAccountName.trim() || !accountNumber.trim() || !ifscCode.trim())
        return "Please fill in complete bank account details.";
      if (accountNumber !== confirmAccountNumber)
        return "Bank Account Numbers do not match.";
      if (ifscCode.trim().length !== 11)
        return "Please enter a valid 11-character Bank IFSC Code.";
    }
    return null;
  };

  const handleNextStep = async () => {
    const error = validateStep(currentStep);
    if (error) {
      setFormError(error);
      return;
    }

    setSaving(true);
    try {
      const next = Math.min(6, currentStep + 1);
      const updated = await vendorOnboardingService.saveDraft(
        vendorUser.id,
        formData,
        next,
      );
      setApplication(updated);
      setCurrentStep(next);
      setSuccessNotice(`Draft progress saved.`);
      setTimeout(() => setSuccessNotice(null), 2500);
    } catch (err) {
      setFormError(err.message || "Failed to save progress.");
    } finally {
      setSaving(false);
    }
  };

  const handlePreviousStep = () => {
    setFormError(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleCategoryToggle = (slug) => {
    setFormData((prev) => {
      const exists = prev.productCategories.includes(slug);
      return {
        ...prev,
        productCategories: exists
          ? prev.productCategories.filter((c) => c !== slug)
          : [...prev.productCategories, slug],
      };
    });
  };

  const handleFileUpload = async (docType, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(docType);
    setFormError(null);

    try {
      // 1. Enforce 5 MB original limit and 1 MB final limit with readability checks
      await fileOptimizer.validateVerificationDocument(file);

      // 2. Upload securely to private Supabase Storage bucket 'vendor-verification-docs'
      const result = await uploadService.uploadVendorDocument(
        vendorUser.id,
        docType,
        file,
        (status) => {
          // Optional status tracking if needed
          console.log(status);
        },
      );

      setFormData((prev) => ({
        ...prev,
        verificationDocuments: {
          ...prev.verificationDocuments,
          [`${docType}Url`]: result.path,
          [`${docType}Name`]: file.name,
        },
      }));
    } catch (err) {
      setFormError(err.message || "Failed to upload document.");
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    const error = validateStep(6);
    if (error) {
      setFormError(error);
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const finalized = await vendorOnboardingService.submitApplication(
        vendorUser.id,
        formData,
      );
      setApplication(finalized);
      setSuccessNotice(
        "Your vendor application has been submitted for verification review.",
      );

      // Route directly to the Verification Status Page to show review state
      setTimeout(() => {
        navigate("/vendor/verification");
      }, 1000);
    } catch (err) {
      setFormError(err.message || "Submission failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 pb-28 font-sans">
      <SeoHead
        title="Vendor Onboarding & Verification | GateMate"
        description="Register your construction depot or stockist dealership. Multi-step credentials, category mappings, and bank settlement setup."
        canonicalUrl="/vendor/onboarding"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9E2EA] pb-5">
        <div>
          <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Stockist Partner Registration
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
            V
          </h1>
          <p className="text-xs text-[#606460]">
            Complete your depot profile to list construction products and
            receive site dispatches in Pune & PCMC.
          </p>
        </div>

        <Link
          to="/sell"
          className="text-xs font-bold text-[#3C7DDA] hover:underline self-start sm:self-auto"
        >
          Back to Overview
        </Link>
      </div>

      {/* Stepper Progress Bar */}
      <div className="gm-panel p-4 sm:p-5 rounded-3xl border border-[#D9E2EA] overflow-x-auto">
        <div className="flex items-center justify-between min-w-[540px] gap-2">
          {steps.map((s) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div
                key={s.num}
                onClick={() => setCurrentStep(s.num)}
                className={`flex items-center gap-2 cursor-pointer transition ${
                  isCurrent ? "opacity-100" : "opacity-70 hover:opacity-100"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 transition ${
                    isCompleted
                      ? "bg-[#3F7D20] text-[#FEFEFE]"
                      : isCurrent
                        ? "bg-[#173885] text-[#FEFEFE] ring-2 ring-[#3C7DDA]"
                        : "bg-[#E4EEF3] text-[#606460] border border-[#D9E2EA]"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    s.num
                  )}
                </div>
                <span
                  className={`text-xs font-bold whitespace-nowrap ${isCurrent ? "text-[#173885]" : "text-[#606460]"}`}
                >
                  {s.label}
                </span>
                {s.num < 6 && (
                  <div className="w-4 h-px bg-[#D9E2EA] mx-1 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error & Success Feedback Alerts */}
      {formError && (
        <div className="p-3.5 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#B43D20] shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {successNotice && (
        <div className="p-3.5 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#3F7D20] shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Step Forms */}
      <div className="gm-panel p-6 sm:p-8 rounded-3xl border border-[#D9E2EA] space-y-6 bg-[#FEFEFE]">
        {/* STEP 1: BUSINESS DETAILS */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="border-b border-[#D9E2EA] pb-3">
              <h2 className="text-base font-bold text-[#173885]">
                1. Business & Tax Identity
              </h2>
              <p className="text-xs text-[#606460]">
                Enter your registered firm name and taxation identifiers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#282926] block mb-1">
                  Legal Business Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune Infrastructure Supplies Pvt Ltd"
                  value={formData.businessDetails.legalBusinessName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      businessDetails: {
                        ...formData.businessDetails,
                        legalBusinessName: e.target.value,
                      },
                    })
                  }
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#282926] block mb-1">
                  Trade / Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pune Mega Depot"
                  value={formData.businessDetails.tradeName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      businessDetails: {
                        ...formData.businessDetails,
                        tradeName: e.target.value,
                      },
                    })
                  }
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#282926] block mb-1">
                  Business Structure *
                </label>
                <select
                  value={formData.businessDetails.businessType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      businessDetails: {
                        ...formData.businessDetails,
                        businessType: e.target.value,
                      },
                    })
                  }
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
                >
                  <option value="Proprietorship">Proprietorship</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Private Limited">Private Limited</option>
                  <option value="LLP">LLP</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#282926] block mb-1">
                  15-Digit GSTIN *
                </label>
                <input
                  type="text"
                  required
                  maxLength={15}
                  placeholder="27AAAAA0000A1Z5"
                  value={formData.businessDetails.gstin}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      businessDetails: {
                        ...formData.businessDetails,
                        gstin: e.target.value.toUpperCase(),
                      },
                    })
                  }
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#282926] block mb-1">
                  Company / Proprietor PAN *
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="AAAAA0000A"
                  value={formData.businessDetails.panNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      businessDetails: {
                        ...formData.businessDetails,
                        panNumber: e.target.value.toUpperCase(),
                      },
                    })
                  }
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: OWNER / CONTACT DETAILS */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="border-b border-[#D9E2EA] pb-3">
              <h2 className="text-base font-bold text-[#173885]">
                2. Managing Contact & Escalations
              </h2>
              <p className="text-xs text-[#606460]">
                Details of the proprietor, director, or authorized dispatch
                manager.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#282926] block mb-1">
                  Primary Contact Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Patil"
                  value={formData.ownerDetails.primaryContactName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ownerDetails: {
                        ...formData.ownerDetails,
                        primaryContactName: e.target.value,
                      },
                    })
                  }
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#282926] block mb-1">
                  Designation *
                </label>
                <input
                  type="text"
                  required
                  value={formData.ownerDetails.designation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ownerDetails: {
                        ...formData.ownerDetails,
                        designation: e.target.value,
                      },
                    })
                  }
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#282926] block mb-1">
                  Official Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.ownerDetails.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ownerDetails: {
                        ...formData.ownerDetails,
                        email: e.target.value,
                      },
                    })
                  }
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#282926] block mb-1">
                  Primary Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10-digit number"
                  value={formData.ownerDetails.mobileNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ownerDetails: {
                        ...formData.ownerDetails,
                        mobileNumber: e.target.value.replace(/\D/g, ""),
                      },
                    })
                  }
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: BUSINESS ADDRESS */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="border-b border-[#D9E2EA] pb-3">
              <h2 className="text-base font-bold text-[#173885]">
                3. Physical Depot Yard & Logistics Access
              </h2>
              <p className="text-xs text-[#606460]">
                Warehouse location where vehicle dispatches and offloading take
                place.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#282926] block mb-1">
                Depot Plot / Street Address *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Plot #48, Hadapsar Industrial Estate"
                value={formData.businessAddress.depotAddressLine1}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    businessAddress: {
                      ...formData.businessAddress,
                      depotAddressLine1: e.target.value,
                    },
                  })
                }
                className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#282926] block mb-1">
                  Locality / Industrial Area *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hadapsar / Bhosari"
                  value={formData.businessAddress.locality}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      businessAddress: {
                        ...formData.businessAddress,
                        locality: e.target.value,
                      },
                    })
                  }
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#282926] block mb-1">
                  City
                </label>
                <input
                  type="text"
                  disabled
                  value="Pune"
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs bg-[#F4F6FA]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#282926] block mb-1">
                  PIN Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={formData.businessAddress.pincode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      businessAddress: {
                        ...formData.businessAddress,
                        pincode: e.target.value.replace(/\D/g, ""),
                      },
                    })
                  }
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.businessAddress.hasHeavyTrailerAccess}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      businessAddress: {
                        ...formData.businessAddress,
                        hasHeavyTrailerAccess: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 rounded accent-[#3C7DDA]"
                />
                <span className="text-xs text-[#282926]">
                  Depot has wide road access for 40-ton trailer trucks
                </span>
              </label>
            </div>
          </div>
        )}

        {/* STEP 4: CATEGORIES */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="border-b border-[#D9E2EA] pb-3">
              <h2 className="text-base font-bold text-[#173885]">
                4. Construction Product Categories
              </h2>
              <p className="text-xs text-[#606460]">
                Select the product lines your depot stocks and distributes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {CATALOGUE_CATEGORIES.map((cat) => {
                const isSelected = formData.productCategories.includes(
                  cat.slug,
                );
                return (
                  <div
                    key={cat.id}
                    onClick={() => handleCategoryToggle(cat.slug)}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-[#E4EEF3] border-[#3C7DDA] shadow-xs"
                        : "gm-card hover:border-[#9AAED4]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={cat.image}
                        alt=""
                        className="w-8 h-8 rounded-lg object-cover bg-[#F4F6FA] shrink-0"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-[#282926]">
                          {cat.name}
                        </h4>
                        <p className="text-[10px] text-[#606460] line-clamp-1">
                          {cat.descriptor}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-[#3C7DDA] border-[#3C7DDA] text-[#FEFEFE]"
                          : "border-[#D9E2EA]"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: VERIFICATION DOCUMENTS */}
        {currentStep === 5 && (
          <div className="space-y-5">
            <div className="border-b border-[#D9E2EA] pb-3">
              <h2 className="text-base font-bold text-[#173885]">
                5. Verification Documents
              </h2>
              <p className="text-xs text-[#606460]">
                Upload clear PDF or PNG/JPG copies. Documents are stored in
                secure private storage.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* GST Cert */}
              <div className="p-4 rounded-2xl border border-[#D9E2EA] bg-[#F4F6FA] space-y-3">
                <span className="text-xs font-bold text-[#173885] block">
                  GST Certificate (Form REG-06) *
                </span>
                {formData.verificationDocuments.gstCertificateName ? (
                  <div className="p-2.5 rounded-xl bg-[#FEFEFE] border border-[#D9E2EA] text-[11px] text-[#3F7D20] font-semibold flex items-center gap-1.5 truncate">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {formData.verificationDocuments.gstCertificateName}
                    </span>
                  </div>
                ) : (
                  <p className="text-[10px] text-[#606460]">
                    Official Maharashtra GST registration cert.
                  </p>
                )}

                <label className="btn-gm-secondary w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {uploadingDoc === "gstCertificate"
                      ? "Uploading..."
                      : "Upload PDF/Image"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,image/png,image/jpeg"
                    onChange={(e) => handleFileUpload("gstCertificate", e)}
                    className="hidden"
                  />
                </label>
              </div>

              {/* PAN Card */}
              <div className="p-4 rounded-2xl border border-[#D9E2EA] bg-[#F4F6FA] space-y-3">
                <span className="text-xs font-bold text-[#173885] block">
                  Firm / Proprietor PAN Card *
                </span>
                {formData.verificationDocuments.panCardName ? (
                  <div className="p-2.5 rounded-xl bg-[#FEFEFE] border border-[#D9E2EA] text-[11px] text-[#3F7D20] font-semibold flex items-center gap-1.5 truncate">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {formData.verificationDocuments.panCardName}
                    </span>
                  </div>
                ) : (
                  <p className="text-[10px] text-[#606460]">
                    Copy of company or proprietor PAN card.
                  </p>
                )}

                <label className="btn-gm-secondary w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {uploadingDoc === "panCard"
                      ? "Uploading..."
                      : "Upload PDF/Image"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,image/png,image/jpeg"
                    onChange={(e) => handleFileUpload("panCard", e)}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Cancelled Cheque */}
              <div className="p-4 rounded-2xl border border-[#D9E2EA] bg-[#F4F6FA] space-y-3">
                <span className="text-xs font-bold text-[#173885] block">
                  Cancelled Cheque / Bank Letter
                </span>
                {formData.verificationDocuments.cancelledChequeName ? (
                  <div className="p-2.5 rounded-xl bg-[#FEFEFE] border border-[#D9E2EA] text-[11px] text-[#3F7D20] font-semibold flex items-center gap-1.5 truncate">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {formData.verificationDocuments.cancelledChequeName}
                    </span>
                  </div>
                ) : (
                  <p className="text-[10px] text-[#606460]">
                    Verification of settlement bank account.
                  </p>
                )}

                <label className="btn-gm-secondary w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {uploadingDoc === "cancelledCheque"
                      ? "Uploading..."
                      : "Upload PDF/Image"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,image/png,image/jpeg"
                    onChange={(e) => handleFileUpload("cancelledCheque", e)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: BANK DETAILS & FINAL REVIEW */}
        {currentStep === 6 && (
          <div className="space-y-5">
            <div className="border-b border-[#D9E2EA] pb-3">
              <h2 className="text-base font-bold text-[#173885]">
                6. Bank Account for Weekly Settlements
              </h2>
              <p className="text-xs text-[#606460]">
                Direct NEFT/RTGS bank destination for order payouts.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#282926] block mb-1">
                  Beneficiary Account Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune Infrastructure Supplies Pvt Ltd"
                  value={formData.bankDetails.bankAccountName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: {
                        ...formData.bankDetails,
                        bankAccountName: e.target.value,
                      },
                    })
                  }
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#282926] block mb-1">
                  Bank Name & Branch *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Bank, Hadapsar Branch"
                  value={formData.bankDetails.bankName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: {
                        ...formData.bankDetails,
                        bankName: e.target.value,
                      },
                    })
                  }
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#282926] block mb-1">
                  Account Number *
                </label>
                <input
                  type="password"
                  required
                  value={formData.bankDetails.accountNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: {
                        ...formData.bankDetails,
                        accountNumber: e.target.value,
                      },
                    })
                  }
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#282926] block mb-1">
                  Confirm Account Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.bankDetails.confirmAccountNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: {
                        ...formData.bankDetails,
                        confirmAccountNumber: e.target.value,
                      },
                    })
                  }
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#282926] block mb-1">
                  11-Character IFSC Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength={11}
                  placeholder="HDFC0001234"
                  value={formData.bankDetails.ifscCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: {
                        ...formData.bankDetails,
                        ifscCode: e.target.value.toUpperCase(),
                      },
                    })
                  }
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* Stepper Navigation Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#D9E2EA]">
          <button
            type="button"
            disabled={currentStep === 1 || saving}
            onClick={handlePreviousStep}
            className="btn-gm-secondary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-40"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          {currentStep < 6 ? (
            <button
              type="button"
              disabled={saving}
              onClick={handleNextStep}
              className="btn-gm-primary px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <span>{saving ? "Saving..." : "Save & Continue"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={handleSubmitApplication}
              className="btn-gm-primary px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              <span>
                {saving
                  ? "Submitting..."
                  : "Submit Application & Open Dashboard"}
              </span>
              <Check className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
