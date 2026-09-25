import React, { useEffect, useMemo, useState } from "react";
import { AccountNav } from "./AccountNav";
import { AuthModal } from "../AuthModal";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";

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
  MapPin,
  Phone,
  User,
  IndianRupee,
  ChevronDown,
  RefreshCw,
  CalendarDays,
  Package,
  Eye,
  Check,
  X,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";

import {
  vendorQuotationService,
  QUOTATION_STATUS,
  QUOTATION_STATUS_CONFIG,
} from "../../services/vendorQuotationService";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const RFQ_STATUS_LABELS = {
  NEW: "New",
  RESPONDED: "Responded",
  QUOTATION_SENT: "Quotation Sent",
  NEGOTIATION: "Negotiation",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
  CONVERTED_TO_ORDER: "Converted to Order",
  COMPLETED: "Completed",
};

const RFQ_STATUS_CLASSES = {
  NEW: "bg-[#E3EBFA] text-[#2E4D94] border-[#2E4D94]/30",
  RESPONDED: "bg-[#E4EEF3] text-[#173885] border-[#9AAED4]/40",
  QUOTATION_SENT: "bg-[#E4EEF3] text-[#173885] border-[#3C7DDA]/30",
  NEGOTIATION: "bg-[#FFF0D5] text-[#A66A08] border-[#A66A08]/30",
  ACCEPTED: "bg-[#E1F2D9] text-[#3F7D20] border-[#3F7D20]/30",
  REJECTED: "bg-[#FBE3DE] text-[#B43D20] border-[#B43D20]/30",
  EXPIRED: "bg-[#F4F6FA] text-[#606460] border-[#D9E2EA]",
  CONVERTED_TO_ORDER: "bg-[#E1F2D9] text-[#173885] border-[#173885]/30",
  COMPLETED: "bg-[#E1F2D9] text-[#3F7D20] border-[#3F7D20]/30",
};

const createInitialForm = () => ({
  vendorId: "",
  projectName: "",
  gstin: "",
  buyerName: "",
  buyerPhone: "",
  productName: "",
  quantity: 10,
  unit: "piece",
  siteAddressLine1: "",
  locality: "",
  city: "Pune",
  state: "Maharashtra",
  pincode: "",
  notes: "",
  expiryDays: 7,
});

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (value) => {
  return Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
};

const normalizeRequestedProducts = (products) => {
  if (!Array.isArray(products)) {
    return [];
  }

  return products.map((product, index) => ({
    id: product?.id || product?.productId || `requested-product-${index + 1}`,

    name:
      product?.name ||
      product?.product_name ||
      product?.productName ||
      "Construction Product",

    quantity: Number(product?.quantity) || 0,

    unit: product?.unit || "piece",

    sku: product?.sku || null,
  }));
};

const normalizeQuotationItems = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item, index) => {
    const quantity = Number(
      item?.quantity ??
        item?.requestedQuantity ??
        item?.requested_quantity ??
        0,
    );

    const unitRate = Number(
      item?.unitRate ?? item?.unit_price ?? item?.unitPrice ?? item?.rate ?? 0,
    );

    const total =
      Number(item?.total ?? item?.lineTotal ?? item?.line_total ?? 0) ||
      quantity * unitRate;

    return {
      id:
        item?.id ||
        item?.productId ||
        item?.product_id ||
        `quotation-item-${index}`,

      productId: item?.productId || item?.product_id || null,

      productName:
        item?.productName || item?.product_name || item?.name || "Product",

      quantity,

      unit: item?.unit || item?.productUnit || item?.product_unit || "unit",

      unitRate,

      total,

      sku: item?.sku || item?.productSku || item?.product_sku || null,
    };
  });
};

const normalizeRfq = (rfq) => {
  const siteAddress =
    rfq?.site_address && typeof rfq.site_address === "object"
      ? rfq.site_address
      : {};

  const quotations = Array.isArray(rfq?.vendor_quotations)
    ? rfq.vendor_quotations
    : [];

  return {
    ...rfq,

    siteAddress,

    requestedProducts: normalizeRequestedProducts(rfq?.requested_products),

    vendor: rfq?.vendor_profiles || rfq?.vendor || null,

    quotations: quotations.map((quotation) => ({
      ...quotation,
      items: normalizeQuotationItems(quotation?.items),
    })),
  };
};

const getStatusLabel = (status) => {
  return (
    RFQ_STATUS_LABELS[status] ||
    String(status || "UNKNOWN")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
};

const getStatusClass = (status) => {
  return (
    RFQ_STATUS_CLASSES[status] || "bg-[#F4F6FA] text-[#606460] border-[#D9E2EA]"
  );
};

/* -------------------------------------------------------------------------- */
/* Status Badge                                                               */
/* -------------------------------------------------------------------------- */

const StatusBadge = ({ status }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wide ${getStatusClass(
        status,
      )}`}
    >
      {status === "ACCEPTED" ||
      status === "COMPLETED" ||
      status === "CONVERTED_TO_ORDER" ? (
        <CheckCircle2 className="w-3 h-3" />
      ) : status === "EXPIRED" ? (
        <Clock className="w-3 h-3" />
      ) : status === "REJECTED" ? (
        <X className="w-3 h-3" />
      ) : (
        <Clock className="w-3 h-3" />
      )}

      {getStatusLabel(status)}
    </span>
  );
};

/* -------------------------------------------------------------------------- */
/* Quotation Status Badge                                                     */
/* -------------------------------------------------------------------------- */

const QuotationStatusBadge = ({ status }) => {
  const config = QUOTATION_STATUS_CONFIG?.[status];

  const label =
    config?.label ||
    String(status || "UNKNOWN")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wide ${
        config?.badgeClass || "bg-[#F4F6FA] text-[#606460] border-[#D9E2EA]"
      }`}
    >
      {status === QUOTATION_STATUS.ACCEPTED ||
      status === QUOTATION_STATUS.CONVERTED_TO_ORDER ? (
        <CheckCircle2 className="w-3 h-3" />
      ) : status === QUOTATION_STATUS.REJECTED ? (
        <X className="w-3 h-3" />
      ) : (
        <Clock className="w-3 h-3" />
      )}

      {label}
    </span>
  );
};

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

export const B2BQuotations = () => {
  const { user, loading: authLoading } = useAuth();

  const [rfqs, setRfqs] = useState([]);
  const [vendors, setVendors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [form, setForm] = useState(createInitialForm());

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [gstValidation, setGstValidation] = useState(null);

  const [refreshing, setRefreshing] = useState(false);

  const [quotationActionId, setQuotationActionId] = useState(null);

  const [expandedQuotationId, setExpandedQuotationId] = useState(null);

  /* ------------------------------------------------------------------------ */
  /* Form                                                                     */
  /* ------------------------------------------------------------------------ */

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  /* ------------------------------------------------------------------------ */
  /* GST Validation                                                            */
  /* ------------------------------------------------------------------------ */

  const validateGSTIN = (gstin) => {
    const cleanGst = String(gstin || "")
      .trim()
      .toUpperCase();

    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (!gstRegex.test(cleanGst)) {
      return {
        isValid: false,
        message: "Enter a valid 15-character GSTIN.",
      };
    }

    return {
      isValid: true,
      message:
        cleanGst.slice(0, 2) === "27"
          ? "Valid Maharashtra GSTIN."
          : "Valid GSTIN.",
    };
  };

  /* ------------------------------------------------------------------------ */
  /* Customer Profile                                                         */
  /* ------------------------------------------------------------------------ */

  const loadCustomerProfile = async () => {
    if (!user?.id) {
      return;
    }

    setProfileLoading(true);

    try {
      const { data, error: profileError } = await supabase
        .from("customer_profiles")
        .select("id, full_name, phone, email")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      const metadata = user?.user_metadata || {};

      setForm((previous) => ({
        ...previous,

        buyerName:
          data?.full_name || metadata?.full_name || previous.buyerName || "",

        buyerPhone: data?.phone || metadata?.phone || previous.buyerPhone || "",
      }));

      setProfileLoaded(true);
    } catch (err) {
      console.error("Failed to load customer profile:", err);

      const metadata = user?.user_metadata || {};

      setForm((previous) => ({
        ...previous,

        buyerName: metadata?.full_name || previous.buyerName || "",

        buyerPhone: metadata?.phone || previous.buyerPhone || "",
      }));
    } finally {
      setProfileLoading(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Vendors                                                                  */
  /* ------------------------------------------------------------------------ */

  const loadVendors = async () => {
    setVendorsLoading(true);

    try {
      const { data, error: vendorError } = await supabase
        .from("vendor_profiles")
        .select(
          "id, business_name, contact_person, phone, email, city, locality, pincode",
        )
        .order("business_name", {
          ascending: true,
        });

      if (vendorError) {
        throw vendorError;
      }

      setVendors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load vendors:", err);

      setVendors([]);

      setError(
        "Unable to load available vendors. Please refresh and try again.",
      );
    } finally {
      setVendorsLoading(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* RFQs                                                                     */
  /* ------------------------------------------------------------------------ */

  const loadRfqs = async () => {
    if (!user?.id) {
      setRfqs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: rfqError } = await supabase
        .from("vendor_rfqs")
        .select(
          `
              *,
              vendor_profiles (
                id,
                business_name,
                contact_person,
                phone,
                email,
                city,
                locality,
                pincode
              ),
              vendor_quotations (
                id,
                rfq_id,
                vendor_id,
                buyer_name,
                buyer_phone,
                buyer_gstin,
                project_name,
                site_address,
                items,
                total_product_subtotal,
                delivery_charge,
                unloading_charge,
                taxes,
                grand_total,
                moq_conditions,
                estimated_delivery_schedule,
                valid_until,
                notes,
                status,
                converted_order_id,
                created_at,
                updated_at
              )
            `,
        )
        .eq("buyer_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (rfqError) {
        throw rfqError;
      }

      setRfqs((data || []).map(normalizeRfq));
    } catch (err) {
      console.error("Failed to load B2B RFQs:", err);

      setRfqs([]);

      setError(err?.message || "Unable to load your project RFQs.");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Initial Load                                                             */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (user?.id) {
      loadCustomerProfile();
      loadVendors();
      loadRfqs();
    } else {
      setLoading(false);
      setRfqs([]);
    }
  }, [user?.id, authLoading]);

  /* ------------------------------------------------------------------------ */
  /* Selected Vendor                                                          */
  /* ------------------------------------------------------------------------ */

  const selectedVendor = useMemo(() => {
    return vendors.find((vendor) => vendor.id === form.vendorId) || null;
  }, [vendors, form.vendorId]);

  /* ------------------------------------------------------------------------ */
  /* Reset Form                                                               */
  /* ------------------------------------------------------------------------ */

  const resetForm = () => {
    setForm((previous) => ({
      ...createInitialForm(),

      buyerName: previous.buyerName,

      buyerPhone: previous.buyerPhone,
    }));

    setGstValidation(null);
  };

  /* ------------------------------------------------------------------------ */
  /* Open Form                                                                */
  /* ------------------------------------------------------------------------ */

  const handleOpenForm = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setNotice("");
    setError("");

    if (!vendors.length) {
      await loadVendors();
    }

    if (!profileLoaded) {
      await loadCustomerProfile();
    }

    setIsFormOpen((previous) => !previous);
  };

  /* ------------------------------------------------------------------------ */
  /* GST                                                                      */
  /* ------------------------------------------------------------------------ */

  const handleGstChange = (event) => {
    const value = event.target.value.toUpperCase().replace(/\s/g, "");

    updateForm("gstin", value);

    if (!value) {
      setGstValidation(null);
      return;
    }

    if (value.length === 15) {
      setGstValidation(validateGSTIN(value));
    } else {
      setGstValidation({
        isValid: false,
        message: `${value.length}/15 characters`,
      });
    }
  };

  /* ------------------------------------------------------------------------ */
  /* RFQ Validation                                                           */
  /* ------------------------------------------------------------------------ */

  const validateForm = () => {
    if (!form.vendorId) {
      return "Please select a vendor.";
    }

    if (!form.projectName.trim()) {
      return "Please enter the project or site name.";
    }

    if (!form.buyerName.trim()) {
      return "Customer name is required.";
    }

    const phone = form.buyerPhone.replace(/\D/g, "");

    if (!/^\d{10}$/.test(phone)) {
      return "A valid 10-digit contact number is required.";
    }

    if (form.gstin) {
      const validation = validateGSTIN(form.gstin);

      if (!validation.isValid) {
        return "Please enter a valid GSTIN or leave it blank.";
      }
    }

    if (!form.productName.trim()) {
      return "Please enter the required Product.";
    }

    const quantity = Number(form.quantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return "Please enter a valid quantity.";
    }

    if (!form.siteAddressLine1.trim()) {
      return "Please enter the construction site address.";
    }

    if (!form.locality.trim()) {
      return "Please enter the site locality.";
    }

    if (!form.city.trim()) {
      return "Please enter the site city.";
    }

    if (!/^\d{6}$/.test(form.pincode)) {
      return "Please enter a valid 6-digit pincode.";
    }

    return null;
  };

  /* ------------------------------------------------------------------------ */
  /* Submit RFQ                                                               */
  /* ------------------------------------------------------------------------ */

  const handleRfqSubmit = async (event) => {
    event.preventDefault();

    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      setNotice("");
      return;
    }

    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const cleanPhone = form.buyerPhone.replace(/\D/g, "").slice(0, 10);

      const expiryDate = new Date(
        Date.now() + Number(form.expiryDays) * 24 * 60 * 60 * 1000,
      ).toISOString();

      const rfqId = `RFQ-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase()}`;

      const requestedProducts = [
        {
          id: `REQ-${Date.now()}`,
          name: form.productName.trim(),
          quantity: Number(form.quantity),
          unit: form.unit,
        },
      ];

      const siteAddress = {
        addressLine1: form.siteAddressLine1.trim(),

        locality: form.locality.trim(),

        city: form.city.trim(),

        state: form.state.trim(),

        pincode: form.pincode.trim(),
      };

      const { error: insertError } = await supabase.from("vendor_rfqs").insert({
        id: rfqId,

        vendor_id: form.vendorId,

        buyer_id: user.id,

        buyer_name: form.buyerName.trim(),

        buyer_phone: cleanPhone,

        buyer_gstin: form.gstin ? form.gstin.trim().toUpperCase() : null,

        project_name: form.projectName.trim(),

        site_address: siteAddress,

        requested_products: requestedProducts,

        buyer_project_notes: form.notes.trim() || null,

        status: "NEW",

        expiry_date: expiryDate,
      });

      if (insertError) {
        throw insertError;
      }

      setNotice(
        `Your project RFQ has been submitted to ${
          selectedVendor?.business_name || "the selected vendor"
        }.`,
      );

      setIsFormOpen(false);

      resetForm();

      await loadRfqs();
    } catch (err) {
      console.error("Failed to submit RFQ:", err);

      setError(err?.message || "Unable to submit the project RFQ.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Refresh                                                                  */
  /* ------------------------------------------------------------------------ */

  const handleRefresh = async () => {
    setRefreshing(true);
    setError("");

    try {
      await Promise.all([loadRfqs(), loadVendors()]);
    } finally {
      setRefreshing(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Quotation Actions                                                        */
  /* ------------------------------------------------------------------------ */

  const handleQuotationReview = async (quotation) => {
    if (!quotation?.id) {
      return;
    }

    setQuotationActionId(quotation.id);
    setError("");
    setNotice("");

    try {
      await vendorQuotationService.markQuotationUnderReview(quotation.id);

      setNotice("Quotation opened for review.");

      await loadRfqs();
    } catch (err) {
      console.error("Failed to mark quotation under review:", err);

      setError(err?.message || "Unable to update quotation review status.");
    } finally {
      setQuotationActionId(null);
    }
  };

  const handleQuotationAccept = async (quotation) => {
    if (!quotation?.id) {
      return;
    }

    const confirmed = window.confirm(
      "Accept this quotation? The quotation will be marked as accepted and can then be converted into a wholesale order.",
    );

    if (!confirmed) {
      return;
    }

    setQuotationActionId(quotation.id);
    setError("");
    setNotice("");

    try {
      await vendorQuotationService.acceptQuotationByCustomer(quotation.id);

      setNotice(
        "Quotation accepted successfully. It is now ready for wholesale order conversion.",
      );

      await loadRfqs();
    } catch (err) {
      console.error("Failed to accept quotation:", err);

      setError(err?.message || "Unable to accept this quotation.");
    } finally {
      setQuotationActionId(null);
    }
  };

  const handleQuotationReject = async (quotation) => {
    if (!quotation?.id) {
      return;
    }

    const confirmed = window.confirm(
      "Reject this quotation? This action will mark the quotation as rejected.",
    );

    if (!confirmed) {
      return;
    }

    setQuotationActionId(quotation.id);
    setError("");
    setNotice("");

    try {
      await vendorQuotationService.rejectQuotationByCustomer(quotation.id);

      setNotice("Quotation rejected successfully.");

      await loadRfqs();
    } catch (err) {
      console.error("Failed to reject quotation:", err);

      setError(err?.message || "Unable to reject this quotation.");
    } finally {
      setQuotationActionId(null);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* NEW: Convert Accepted Quotation to Wholesale Order                      */
  /* ------------------------------------------------------------------------ */

  const handleConvertQuotationToOrder = async (quotation) => {
    if (!quotation?.id) {
      return;
    }

    if (quotation.status !== QUOTATION_STATUS.ACCEPTED) {
      setError(
        "Only an accepted quotation can be converted into a wholesale order.",
      );
      return;
    }

    const confirmed = window.confirm(
      "Create a wholesale order from this accepted quotation? This will create the real GateMate wholesale order and order items.",
    );

    if (!confirmed) {
      return;
    }

    setQuotationActionId(quotation.id);
    setError("");
    setNotice("");

    try {
      const result =
        await vendorQuotationService.convertAcceptedQuotationToOrder(
          quotation.id,
        );

      if (!result?.orderId) {
        throw new Error(
          "The quotation was processed, but no wholesale order ID was returned.",
        );
      }

      setNotice(
        `Wholesale order ${result.orderId} has been created successfully.`,
      );

      setExpandedQuotationId(quotation.id);

      await loadRfqs();
    } catch (err) {
      console.error("Failed to convert quotation to wholesale order:", err);

      setError(err?.message || "Unable to create the wholesale order.");
    } finally {
      setQuotationActionId(null);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Quotation Action State                                                   */
  /* ------------------------------------------------------------------------ */

  const isQuotationActionRunning = (quotationId) => {
    return quotationActionId === quotationId;
  };

  const canReviewQuotation = (quotation) => {
    return quotation?.status === QUOTATION_STATUS.SUBMITTED;
  };

  const canAcceptQuotation = (quotation) => {
    return (
      quotation?.status === QUOTATION_STATUS.SUBMITTED ||
      quotation?.status === QUOTATION_STATUS.UNDER_REVIEW
    );
  };

  const canRejectQuotation = (quotation) => {
    return (
      quotation?.status === QUOTATION_STATUS.SUBMITTED ||
      quotation?.status === QUOTATION_STATUS.UNDER_REVIEW
    );
  };

  const canConvertQuotation = (quotation) => {
    return quotation?.status === QUOTATION_STATUS.ACCEPTED;
  };

  /* ------------------------------------------------------------------------ */
  /* Auth Loading                                                             */
  /* ------------------------------------------------------------------------ */

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F4F6FA] flex items-center justify-center">
        <div className="text-sm font-semibold text-[#173885]">Loading...</div>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Logged Out                                                               */
  /* ------------------------------------------------------------------------ */

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24">
        <div className="border-b border-[#D9E2EA] pb-4">
          <h1 className="text-xl sm:text-2xl font-black text-[#173885]">
            Commercial B2B RFQs
          </h1>

          <p className="text-xs text-[#606460] mt-1">
            Submit and track bulk project quotation requests.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          <div className="md:col-span-1">
            <AccountNav />
          </div>

          <div className="md:col-span-3">
            <div className="gm-panel p-12 rounded-3xl text-center space-y-4 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-[#E4EEF3] text-[#173885] flex items-center justify-center mx-auto border border-[#D9E2EA]">
                <Lock className="w-7 h-7" />
              </div>

              <h2 className="text-lg font-bold text-[#173885]">
                Sign In to Manage RFQs
              </h2>

              <p className="text-xs text-[#606460] leading-relaxed">
                Sign in to create and track your commercial B2B quotation
                requests.
              </p>

              <button
                type="button"
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

  /* ------------------------------------------------------------------------ */
  /* Main UI                                                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24">
      {/* PAGE HEADER */}

      <div className="border-b border-[#D9E2EA] pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#173885]">
              Commercial B2B RFQs
            </h1>

            <p className="text-xs text-[#606460] mt-1">
              Submit and track bulk project quotation requests.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-gm-secondary px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={handleOpenForm}
              className="btn-gm-primary px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2"
            >
              {isFormOpen ? (
                <>
                  <ChevronDown className="w-4 h-4 rotate-180" />
                  Close
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Request RFQ
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ACCOUNT LAYOUT */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        <div className="md:col-span-1">
          <AccountNav />
        </div>

        <div className="md:col-span-3 space-y-4">
          {/* NOTICES */}

          {notice && (
            <div className="p-4 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />

              <div>
                <p className="font-bold">Request completed</p>

                <p className="mt-0.5">{notice}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />

              <div>
                <p className="font-bold">Unable to complete request</p>

                <p className="mt-0.5 break-words">{error}</p>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* REQUEST FORM                                                      */}
          {/* ---------------------------------------------------------------- */}

          {isFormOpen && (
            <div className="gm-panel rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-[#D9E2EA]">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E4EEF3] border border-[#D9E2EA] flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-[#173885]" />
                  </div>

                  <div>
                    <h2 className="text-base font-black text-[#173885]">
                      New Project RFQ
                    </h2>

                    <p className="text-xs text-[#606460] mt-1 leading-5">
                      Provide your project requirement and select the vendor who
                      should receive the request.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleRfqSubmit} className="p-5 sm:p-6 space-y-6">
                {/* VENDOR */}

                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-4 h-4 text-[#3C7DDA]" />

                    <h3 className="text-sm font-bold text-[#173885]">Vendor</h3>
                  </div>

                  <label className="text-xs font-semibold text-[#282926] block mb-1.5">
                    Select Vendor *
                  </label>

                  <select
                    required
                    value={form.vendorId}
                    onChange={(event) =>
                      updateForm("vendorId", event.target.value)
                    }
                    disabled={vendorsLoading}
                    className="w-full gm-input px-3.5 py-3 rounded-xl text-xs bg-white disabled:opacity-60"
                  >
                    <option value="">
                      {vendorsLoading
                        ? "Loading vendors..."
                        : vendors.length
                          ? "Select a vendor"
                          : "No vendors available"}
                    </option>

                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.business_name}
                        {vendor.city ? ` — ${vendor.city}` : ""}
                      </option>
                    ))}
                  </select>

                  {selectedVendor && (
                    <div className="mt-3 rounded-2xl border border-[#D9E2EA] bg-[#F4F6FA] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-black text-[#173885]">
                            {selectedVendor.business_name}
                          </p>

                          {selectedVendor.contact_person && (
                            <p className="text-xs text-[#606460] mt-1 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5" />

                              {selectedVendor.contact_person}
                            </p>
                          )}
                        </div>

                        <ShieldCheck className="w-5 h-5 text-[#3F7D20]" />
                      </div>

                      <div className="flex flex-wrap gap-4 mt-3 text-[10px] text-[#606460]">
                        {selectedVendor.city && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />

                            {selectedVendor.city}
                          </span>
                        )}

                        {selectedVendor.phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" />

                            {selectedVendor.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </section>

                {/* PROJECT */}

                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-4 h-4 text-[#3C7DDA]" />

                    <h3 className="text-sm font-bold text-[#173885]">
                      Project Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-[#282926] block mb-1.5">
                        Project / Site Name *
                      </label>

                      <input
                        type="text"
                        required
                        value={form.projectName}
                        onChange={(event) =>
                          updateForm("projectName", event.target.value)
                        }
                        placeholder="e.g. Baner Commercial Tower"
                        className="w-full gm-input px-3.5 py-3 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#282926] block mb-1.5">
                        GSTIN
                      </label>

                      <input
                        type="text"
                        maxLength={15}
                        value={form.gstin}
                        onChange={handleGstChange}
                        placeholder="27AAAAA0000A1Z5"
                        className="w-full gm-input px-3.5 py-3 rounded-xl text-xs font-mono uppercase"
                      />

                      {gstValidation && (
                        <p
                          className={`text-[10px] mt-1.5 font-semibold ${
                            gstValidation.isValid
                              ? "text-[#3F7D20]"
                              : "text-[#B43D20]"
                          }`}
                        >
                          {gstValidation.message}
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {/* CONTACT */}

                <section>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-[#282926] block mb-1.5">
                        Customer Name *
                      </label>

                      <input
                        type="text"
                        required
                        value={form.buyerName}
                        onChange={(event) =>
                          updateForm("buyerName", event.target.value)
                        }
                        disabled={profileLoading}
                        className="w-full gm-input px-3.5 py-3 rounded-xl text-xs disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#282926] block mb-1.5">
                        Contact Number *
                      </label>

                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={form.buyerPhone}
                        onChange={(event) =>
                          updateForm(
                            "buyerPhone",
                            event.target.value.replace(/\D/g, "").slice(0, 10),
                          )
                        }
                        disabled={profileLoading}
                        placeholder="10-digit mobile number"
                        className="w-full gm-input px-3.5 py-3 rounded-xl text-xs disabled:opacity-60"
                      />
                    </div>
                  </div>
                </section>

                {/* PRODUCT */}

                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="w-4 h-4 text-[#3C7DDA]" />

                    <h3 className="text-sm font-bold text-[#173885]">
                      Required Product
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-[#282926] block mb-1.5">
                        Product *
                      </label>

                      <input
                        type="text"
                        required
                        value={form.productName}
                        onChange={(event) =>
                          updateForm("productName", event.target.value)
                        }
                        placeholder="e.g. TMT Rebar 16mm, PPC Cement"
                        className="w-full gm-input px-3.5 py-3 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#282926] block mb-1.5">
                        Quantity *
                      </label>

                      <input
                        type="number"
                        required
                        min={1}
                        value={form.quantity}
                        onChange={(event) =>
                          updateForm("quantity", event.target.value)
                        }
                        className="w-full gm-input px-3.5 py-3 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="mt-4 max-w-xs">
                    <label className="text-xs font-semibold text-[#282926] block mb-1.5">
                      Unit *
                    </label>

                    <select
                      value={form.unit}
                      onChange={(event) =>
                        updateForm("unit", event.target.value)
                      }
                      className="w-full gm-input px-3.5 py-3 rounded-xl text-xs"
                    >
                      <option value="piece">Piece</option>
                      <option value="bag">Bag</option>
                      <option value="kg">Kg</option>
                      <option value="ton">Ton</option>
                      <option value="meter">Meter</option>
                      <option value="box">Box</option>
                      <option value="bundle">Bundle</option>
                    </select>
                  </div>
                </section>

                {/* SITE ADDRESS */}

                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-4 h-4 text-[#3C7DDA]" />

                    <h3 className="text-sm font-bold text-[#173885]">
                      Construction Site
                    </h3>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#282926] block mb-1.5">
                      Site Address *
                    </label>

                    <input
                      type="text"
                      required
                      value={form.siteAddressLine1}
                      onChange={(event) =>
                        updateForm("siteAddressLine1", event.target.value)
                      }
                      placeholder="Building / road / site address"
                      className="w-full gm-input px-3.5 py-3 rounded-xl text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    <div>
                      <label className="text-xs font-semibold text-[#282926] block mb-1.5">
                        Locality *
                      </label>

                      <input
                        type="text"
                        required
                        value={form.locality}
                        onChange={(event) =>
                          updateForm("locality", event.target.value)
                        }
                        placeholder="Baner"
                        className="w-full gm-input px-3.5 py-3 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#282926] block mb-1.5">
                        City *
                      </label>

                      <input
                        type="text"
                        required
                        value={form.city}
                        onChange={(event) =>
                          updateForm("city", event.target.value)
                        }
                        className="w-full gm-input px-3.5 py-3 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#282926] block mb-1.5">
                        State *
                      </label>

                      <input
                        type="text"
                        required
                        value={form.state}
                        onChange={(event) =>
                          updateForm("state", event.target.value)
                        }
                        className="w-full gm-input px-3.5 py-3 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#282926] block mb-1.5">
                        PIN Code *
                      </label>

                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={form.pincode}
                        onChange={(event) =>
                          updateForm(
                            "pincode",
                            event.target.value.replace(/\D/g, "").slice(0, 6),
                          )
                        }
                        placeholder="411045"
                        className="w-full gm-input px-3.5 py-3 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>
                </section>

                {/* ADDITIONAL DETAILS */}

                <section>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-[#282926] block mb-1.5">
                        RFQ Validity *
                      </label>

                      <select
                        value={form.expiryDays}
                        onChange={(event) =>
                          updateForm("expiryDays", Number(event.target.value))
                        }
                        className="w-full gm-input px-3.5 py-3 rounded-xl text-xs"
                      >
                        <option value={3}>3 days</option>

                        <option value={7}>7 days</option>

                        <option value={14}>14 days</option>

                        <option value={30}>30 days</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#282926] block mb-1.5">
                        Project Notes
                      </label>

                      <input
                        type="text"
                        value={form.notes}
                        onChange={(event) =>
                          updateForm("notes", event.target.value)
                        }
                        placeholder="Delivery schedule, certificates, unloading requirements..."
                        className="w-full gm-input px-3.5 py-3 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </section>

                {/* FORM FOOTER */}

                <div className="pt-4 border-t border-[#D9E2EA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-2 text-[10px] text-[#606460] max-w-lg leading-4">
                    <ShieldCheck className="w-4 h-4 text-[#3F7D20] shrink-0 mt-0.5" />

                    <span>
                      Your RFQ will be submitted to the selected vendor for
                      commercial quotation.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || vendorsLoading}
                    className="btn-gm-primary px-6 py-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Project RFQ
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* RFQ LIST HEADER                                                   */}
          {/* ---------------------------------------------------------------- */}

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#173885]">
                Your Project RFQs
              </h2>

              <p className="text-xs text-[#606460] mt-1">
                Track quotation requests and vendor responses.
              </p>
            </div>

            <span className="px-3 py-1.5 rounded-full bg-[#E4EEF3] border border-[#D9E2EA] text-[10px] font-bold text-[#173885]">
              {rfqs.length} {rfqs.length === 1 ? "Request" : "Requests"}
            </span>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* LOADING                                                           */}
          {/* ---------------------------------------------------------------- */}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="gm-panel h-44 rounded-3xl animate-pulse bg-[#E4EEF3]"
                />
              ))}
            </div>
          ) : rfqs.length === 0 ? (
            <div className="bg-[#FEFEFE] border border-[#D9E2EA] rounded-3xl p-10 sm:p-14 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E4EEF3] border border-[#9AAED4]/30 flex items-center justify-center">
                <FileText className="w-7 h-7 text-[#173885]" />
              </div>

              <h2 className="mt-5 text-lg font-black text-[#173885]">
                No Project RFQs Yet
              </h2>

              <p className="mt-2 max-w-md mx-auto text-xs leading-5 text-[#606460]">
                Need larger quantities for your construction project? Create a
                project RFQ and send it to a GateMate vendor.
              </p>

              <button
                type="button"
                onClick={handleOpenForm}
                className="mt-6 btn-gm-primary px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Project RFQ
              </button>
            </div>
          ) : (
            /* RFQ CARDS */
            <div className="space-y-3">
              {rfqs.map((rfq) => {
                const quotations = Array.isArray(rfq.quotations)
                  ? rfq.quotations
                  : [];

                const latestQuotation =
                  quotations.length > 0
                    ? [...quotations].sort(
                        (a, b) =>
                          new Date(b.created_at) - new Date(a.created_at),
                      )[0]
                    : null;

                const quotationIsExpanded =
                  latestQuotation?.id === expandedQuotationId;

                const quotationRunning =
                  latestQuotation &&
                  isQuotationActionRunning(latestQuotation.id);

                return (
                  <article
                    key={rfq.id}
                    className="bg-[#FEFEFE] border border-[#D9E2EA] rounded-2xl overflow-hidden shadow-2xs"
                  >
                    {/* CARD HEADER */}

                    <div className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-[#6F8A92]">
                              {rfq.id}
                            </span>

                            <StatusBadge status={rfq.status} />
                          </div>

                          <h3 className="mt-2 text-sm sm:text-base font-black text-[#173885] break-words">
                            {rfq.project_name || "Construction Project"}
                          </h3>

                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#6F8A92]">
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="w-3 h-3" />
                              Submitted {formatDate(rfq.created_at)}
                            </span>

                            <span className="hidden sm:inline">•</span>

                            <span>Expires {formatDate(rfq.expiry_date)}</span>
                          </div>
                        </div>

                        <div className="sm:text-right shrink-0">
                          <p className="text-[10px] uppercase tracking-wide font-bold text-[#6F8A92]">
                            Vendor
                          </p>

                          <p className="text-sm font-black text-[#173885] mt-1">
                            {rfq.vendor?.business_name || "Assigned Vendor"}
                          </p>
                        </div>
                      </div>

                      {/* BASIC DETAILS */}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                        <div className="rounded-xl border border-[#D9E2EA] bg-[#F4F6FA] p-4">
                          <p className="text-[10px] font-black uppercase tracking-wide text-[#606460]">
                            Requested Product
                          </p>

                          <div className="mt-2 space-y-2">
                            {rfq.requestedProducts.length > 0 ? (
                              rfq.requestedProducts.map((product, index) => (
                                <div
                                  key={product.id || index}
                                  className="flex items-center justify-between gap-3"
                                >
                                  <span className="text-xs font-bold text-[#282926]">
                                    {product.name}
                                  </span>

                                  <span className="text-xs font-mono font-bold text-[#173885] whitespace-nowrap">
                                    {product.quantity} {product.unit}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-xs text-[#606460]">
                                No product details
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="rounded-xl border border-[#D9E2EA] bg-[#F4F6FA] p-4">
                          <p className="text-[10px] font-black uppercase tracking-wide text-[#606460]">
                            Construction Site
                          </p>

                          <div className="mt-2 flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-[#3C7DDA] shrink-0 mt-0.5" />

                            <div className="text-xs text-[#282926] leading-5">
                              {rfq.siteAddress?.addressLine1 && (
                                <div>{rfq.siteAddress.addressLine1}</div>
                              )}

                              <div>
                                {[
                                  rfq.siteAddress?.locality,
                                  rfq.siteAddress?.city,
                                  rfq.siteAddress?.state,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </div>

                              {rfq.siteAddress?.pincode && (
                                <div className="font-mono font-bold">
                                  {rfq.siteAddress.pincode}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* CUSTOMER DETAILS */}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        <div className="rounded-xl border border-[#D9E2EA] p-3">
                          <p className="text-[10px] text-[#6F8A92]">Customer</p>

                          <p className="text-xs font-bold text-[#282926] mt-1">
                            {rfq.buyer_name || "—"}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#D9E2EA] p-3">
                          <p className="text-[10px] text-[#6F8A92]">
                            Contact Number
                          </p>

                          <p className="text-xs font-bold text-[#282926] mt-1 flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-[#3C7DDA]" />

                            {rfq.buyer_phone || "—"}
                          </p>
                        </div>
                      </div>

                      {/* NOTES */}

                      {rfq.buyer_project_notes && (
                        <div className="mt-3 rounded-xl border border-[#D9E2EA] bg-[#F4F6FA] p-4">
                          <p className="text-[10px] font-black uppercase tracking-wide text-[#606460]">
                            Project Notes
                          </p>

                          <p className="mt-1 text-xs leading-5 text-[#282926] whitespace-pre-wrap">
                            {rfq.buyer_project_notes}
                          </p>
                        </div>
                      )}

                      {/* QUOTATION */}

                      {latestQuotation && (
                        <div className="mt-4 rounded-2xl border border-[#3F7D20]/30 bg-[#E1F2D9]/30 overflow-hidden">
                          <div className="p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-xl bg-[#FEFEFE] border border-[#3F7D20]/30 flex items-center justify-center">
                                  <FileText className="w-4 h-4 text-[#3F7D20]" />
                                </div>

                                <div>
                                  <h4 className="text-sm font-black text-[#173885]">
                                    Vendor Quotation
                                  </h4>

                                  <p className="text-[10px] text-[#606460] mt-0.5">
                                    Received{" "}
                                    {formatDateTime(latestQuotation.created_at)}
                                  </p>
                                </div>
                              </div>

                              <QuotationStatusBadge
                                status={latestQuotation.status}
                              />
                            </div>

                            {/* TOTALS */}

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                              <div>
                                <p className="text-[10px] text-[#6F8A92]">
                                  Products
                                </p>

                                <p className="text-sm font-black text-[#282926] mt-1">
                                  ₹
                                  {formatCurrency(
                                    latestQuotation.total_product_subtotal,
                                  )}
                                </p>
                              </div>

                              <div>
                                <p className="text-[10px] text-[#6F8A92]">
                                  Delivery
                                </p>

                                <p className="text-sm font-black text-[#282926] mt-1">
                                  ₹
                                  {formatCurrency(
                                    latestQuotation.delivery_charge,
                                  )}
                                </p>
                              </div>

                              <div>
                                <p className="text-[10px] text-[#6F8A92]">
                                  Unloading
                                </p>

                                <p className="text-sm font-black text-[#282926] mt-1">
                                  ₹
                                  {formatCurrency(
                                    latestQuotation.unloading_charge,
                                  )}
                                </p>
                              </div>

                              <div>
                                <p className="text-[10px] text-[#6F8A92]">
                                  Grand Total
                                </p>

                                <p className="text-base font-black text-[#173885] mt-1">
                                  ₹{formatCurrency(latestQuotation.grand_total)}
                                </p>
                              </div>
                            </div>

                            {/* VIEW DETAILS */}

                            <button
                              type="button"
                              onClick={() =>
                                setExpandedQuotationId(
                                  quotationIsExpanded
                                    ? null
                                    : latestQuotation.id,
                                )
                              }
                              className="mt-4 text-[11px] font-bold text-[#173885] inline-flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />

                              {quotationIsExpanded
                                ? "Hide quotation details"
                                : "View quotation details"}
                            </button>
                          </div>

                          {/* EXPANDED QUOTATION */}

                          {quotationIsExpanded && (
                            <div className="border-t border-[#3F7D20]/20 bg-[#FEFEFE] p-4 space-y-4">
                              {/* QUOTATION ITEMS */}

                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <Package className="w-4 h-4 text-[#3C7DDA]" />

                                  <h5 className="text-xs font-black text-[#173885]">
                                    Quotation Items
                                  </h5>
                                </div>

                                <div className="space-y-2">
                                  {latestQuotation.items?.length ? (
                                    latestQuotation.items.map((item, index) => (
                                      <div
                                        key={item.id || index}
                                        className="rounded-xl border border-[#D9E2EA] bg-[#F4F6FA] p-3"
                                      >
                                        <div className="flex items-start justify-between gap-4">
                                          <div className="min-w-0">
                                            <p className="text-xs font-bold text-[#282926]">
                                              {item.productName}
                                            </p>

                                            {item.sku && (
                                              <p className="text-[10px] text-[#6F8A92] mt-1">
                                                SKU: {item.sku}
                                              </p>
                                            )}
                                          </div>

                                          <div className="text-right shrink-0">
                                            <p className="text-xs font-mono font-bold text-[#173885]">
                                              {item.quantity} {item.unit}
                                            </p>

                                            <p className="text-[10px] text-[#606460] mt-1">
                                              ₹{formatCurrency(item.unitRate)} /{" "}
                                              {item.unit}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="mt-2 pt-2 border-t border-[#D9E2EA] flex items-center justify-between">
                                          <span className="text-[10px] text-[#606460]">
                                            Line Total
                                          </span>

                                          <span className="text-xs font-black text-[#173885]">
                                            ₹{formatCurrency(item.total)}
                                          </span>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="rounded-xl border border-[#D9E2EA] p-4 text-xs text-[#606460]">
                                      No quotation items available.
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* COMMERCIAL DETAILS */}

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="rounded-xl border border-[#D9E2EA] p-4">
                                  <p className="text-[10px] font-black uppercase tracking-wide text-[#606460]">
                                    Delivery Schedule
                                  </p>

                                  <p className="mt-1 text-xs font-bold text-[#282926]">
                                    {latestQuotation.estimated_delivery_schedule ||
                                      "—"}
                                  </p>
                                </div>

                                <div className="rounded-xl border border-[#D9E2EA] p-4">
                                  <p className="text-[10px] font-black uppercase tracking-wide text-[#606460]">
                                    Quotation Valid Until
                                  </p>

                                  <p className="mt-1 text-xs font-bold text-[#282926]">
                                    {formatDateTime(
                                      latestQuotation.valid_until,
                                    )}
                                  </p>
                                </div>
                              </div>

                              {latestQuotation.moq_conditions && (
                                <div className="rounded-xl border border-[#D9E2EA] p-4">
                                  <p className="text-[10px] font-black uppercase tracking-wide text-[#606460]">
                                    MOQ Conditions
                                  </p>

                                  <p className="mt-1 text-xs leading-5 text-[#282926] whitespace-pre-wrap">
                                    {latestQuotation.moq_conditions}
                                  </p>
                                </div>
                              )}

                              {latestQuotation.notes && (
                                <div className="rounded-xl border border-[#D9E2EA] p-4">
                                  <p className="text-[10px] font-black uppercase tracking-wide text-[#606460]">
                                    Vendor Notes
                                  </p>

                                  <p className="mt-1 text-xs leading-5 text-[#282926] whitespace-pre-wrap">
                                    {latestQuotation.notes}
                                  </p>
                                </div>
                              )}

                              {/* ------------------------------------------------ */}
                              {/* QUOTATION ACTIONS                               */}
                              {/* ------------------------------------------------ */}

                              <div className="pt-3 border-t border-[#D9E2EA]">
                                {canReviewQuotation(latestQuotation) && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleQuotationReview(latestQuotation)
                                    }
                                    disabled={quotationRunning}
                                    className="btn-gm-secondary px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 disabled:opacity-50"
                                  >
                                    {quotationRunning ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Eye className="w-3.5 h-3.5" />
                                    )}
                                    Review Quotation
                                  </button>
                                )}

                                {canAcceptQuotation(latestQuotation) ||
                                canRejectQuotation(latestQuotation) ? (
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    {canAcceptQuotation(latestQuotation) && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleQuotationAccept(latestQuotation)
                                        }
                                        disabled={quotationRunning}
                                        className="btn-gm-primary px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50"
                                      >
                                        {quotationRunning ? (
                                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <Check className="w-3.5 h-3.5" />
                                        )}
                                        Accept Quotation
                                      </button>
                                    )}

                                    {canRejectQuotation(latestQuotation) && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleQuotationReject(latestQuotation)
                                        }
                                        disabled={quotationRunning}
                                        className="px-4 py-2.5 rounded-xl border border-[#B43D20]/30 bg-[#FBE3DE] text-[#B43D20] text-xs font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50"
                                      >
                                        {quotationRunning ? (
                                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <X className="w-3.5 h-3.5" />
                                        )}
                                        Reject Quotation
                                      </button>
                                    )}
                                  </div>
                                ) : null}

                                {/* ------------------------------------------------ */}
                                {/* ACCEPTED → WHOLESALE ORDER                      */}
                                {/* ------------------------------------------------ */}

                                {canConvertQuotation(latestQuotation) && (
                                  <div className="mt-3 rounded-2xl border border-[#173885]/20 bg-[#E4EEF3] p-4">
                                    <div className="flex items-start gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-[#FEFEFE] border border-[#173885]/20 flex items-center justify-center shrink-0">
                                        <ShoppingBag className="w-5 h-5 text-[#173885]" />
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <h5 className="text-sm font-black text-[#173885]">
                                          Quotation Accepted
                                        </h5>

                                        <p className="text-xs text-[#606460] mt-1 leading-5">
                                          This quotation has been accepted.
                                          Create the real GateMate wholesale
                                          order to continue with vendor order
                                          processing.
                                        </p>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleConvertQuotationToOrder(
                                              latestQuotation,
                                            )
                                          }
                                          disabled={quotationRunning}
                                          className="mt-3 btn-gm-primary px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 disabled:opacity-50"
                                        >
                                          {quotationRunning ? (
                                            <>
                                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                              Creating Wholesale Order...
                                            </>
                                          ) : (
                                            <>
                                              <ShoppingBag className="w-3.5 h-3.5" />
                                              Create Wholesale Order
                                              <ArrowRight className="w-3.5 h-3.5" />
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* ------------------------------------------------ */}
                                {/* CONVERTED ORDER                                */}
                                {/* ------------------------------------------------ */}

                                {latestQuotation.status ===
                                  QUOTATION_STATUS.CONVERTED_TO_ORDER && (
                                  <div className="rounded-2xl border border-[#3F7D20]/30 bg-[#E1F2D9] p-4">
                                    <div className="flex items-start gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-[#FEFEFE] border border-[#3F7D20]/30 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-5 h-5 text-[#3F7D20]" />
                                      </div>

                                      <div>
                                        <h5 className="text-sm font-black text-[#173885]">
                                          Wholesale Order Created
                                        </h5>

                                        <p className="text-xs text-[#606460] mt-1">
                                          The accepted quotation has been
                                          converted into a real wholesale order.
                                        </p>

                                        {latestQuotation.converted_order_id && (
                                          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FEFEFE] border border-[#D9E2EA]">
                                            <span className="text-[10px] text-[#606460]">
                                              Order ID
                                            </span>

                                            <span className="text-xs font-mono font-black text-[#173885]">
                                              {
                                                latestQuotation.converted_order_id
                                              }
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* NO QUOTATION */}

                      {!latestQuotation && (
                        <div className="mt-4 rounded-2xl border border-dashed border-[#D9E2EA] bg-[#F4F6FA] p-4">
                          <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-[#6F8A92]" />

                            <div>
                              <p className="text-xs font-bold text-[#173885]">
                                Awaiting Vendor Quotation
                              </p>

                              <p className="text-[10px] text-[#606460] mt-0.5">
                                The selected vendor has not submitted a
                                quotation yet.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setAuthModalOpen(false)}
      />
    </div>
  );
};

export default B2BQuotations;
