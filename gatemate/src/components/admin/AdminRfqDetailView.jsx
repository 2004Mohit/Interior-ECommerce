import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  User,
  Building2,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Package,
  Clock,
  ShoppingCart,
  ShieldAlert,
  X,
} from "lucide-react";
import { adminRfqService } from "../../services/adminRfqService";
import { AdminPermissionGuard } from "./AdminPermissionGuard";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";
import { SeoHead } from "../common/SeoHead";

export const AdminRfqDetailView = () => {
  const { id } = useParams();
  const [rfqData, setRfqData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Status Override Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState("OPEN");
  const [adminNotes, setAdminNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminRfqService.getRfqDetail(id);
      setRfqData(data);
      setTargetStatus(data.rfq.status);
    } catch (err) {
      setError(err.message || "Failed to load RFQ details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!adminNotes.trim()) {
      setError("Administrative notes are strictly required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await adminRfqService.updateRfqStatus(id, targetStatus, adminNotes);
      setActionSuccess(`RFQ status successfully updated to ${targetStatus}.`);
      setIsModalOpen(false);
      setAdminNotes("");
      loadData();
    } catch (err) {
      setError(err.message || "Failed to update RFQ status.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val) =>
    `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-10 space-y-4 animate-pulse font-sans">
        <div className="h-6 bg-[#E4EEF3] rounded w-1/4" />
        <div className="h-64 bg-[#FEFEFE] rounded-3xl border border-[#D9E2EA]" />
      </div>
    );
  }

  if (!rfqData) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-3 font-sans">
        <AlertCircle className="w-12 h-12 text-[#B43D20] mx-auto" />
        <h2 className="text-lg font-bold text-[#173885]">
          Commercial RFQ Not Found
        </h2>
        <Link
          to="/admin/rfqs"
          className="btn-gm-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4 text-[#FEFEFE]" />
          <span>Back to RFQs Queue</span>
        </Link>
      </div>
    );
  }

  const { rfq, quotations } = rfqData;
  const requestedItems = rfq.items || rfq.requested_products || [];

  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.MANAGE_RFQ}>
      <div className="max-w-5xl mx-auto space-y-6 pb-24 font-sans">
        <SeoHead
          title={`RFQ: ${rfq.project_name || "Inquiry"} | GateMate Admin`}
          description="Detailed commercial RFQ inspection, technical product specifications, vendor bid submissions, and order conversions."
          canonicalUrl={`/admin/rfqs/${id}`}
          noIndex={true}
        />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/rfqs"
              className="p-2 rounded-xl bg-[#FEFEFE] border border-[#D9E2EA] text-[#606460] hover:text-[#173885] hover:bg-[#E4EEF3] transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-[#173885]">
                  {rfq.project_name || "Commercial RFQ"}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#E4EEF3] text-[#173885] border border-[#3C7DDA]/30">
                  {rfq.status}
                </span>
              </div>
              <span className="text-xs text-[#606460]">RFQ ID: {rfq.id}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {rfq.converted_order_id && (
              <Link
                to={`/admin/orders/${rfq.converted_order_id}`}
                className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-[#3F7D20]" />
                <span>View Generated Order</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="btn-gm-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <ShieldAlert className="w-4 h-4 text-[#FEFEFE]" />
              <span>Override RFQ Status</span>
            </button>
          </div>
        </div>

        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Project & Contractor Specifications */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-2.5">
            <div className="flex items-center gap-2 text-[#173885] font-bold border-b border-[#D9E2EA] pb-2">
              <User className="w-4 h-4 text-[#3C7DDA]" />
              <span>Contractor & Contact Person</span>
            </div>
            <div className="space-y-1 text-[#606460]">
              <div>
                <strong className="text-[#282926]">Representative:</strong>{" "}
                {rfq.contact_name || "Site Engineer"}
              </div>
              <div>
                <strong className="text-[#282926]">Phone:</strong>{" "}
                <span className="font-mono font-bold text-[#173885]">
                  {rfq.contact_phone || "—"}
                </span>
              </div>
              <div>
                <strong className="text-[#282926]">Email:</strong>{" "}
                {rfq.contact_email || "—"}
              </div>
              <div>
                <strong className="text-[#282926]">Company:</strong>{" "}
                {rfq.company_name || "B2B Client"}
              </div>
            </div>
          </div>

          <div className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-2.5">
            <div className="flex items-center gap-2 text-[#173885] font-bold border-b border-[#D9E2EA] pb-2">
              <MapPin className="w-4 h-4 text-[#3C7DDA]" />
              <span>Project Site & Logistics</span>
            </div>
            <div className="space-y-1 text-[#606460]">
              <div>
                <strong className="text-[#282926]">Project Site:</strong>{" "}
                {rfq.delivery_location || "Pune Construction Zone"}
              </div>
              <div>
                <strong className="text-[#282926]">Target Delivery:</strong>{" "}
                <span className="font-mono font-bold text-[#173885]">
                  {rfq.required_delivery_date || "Standard Logistics"}
                </span>
              </div>
              <div>
                <strong className="text-[#282926]">Special Logistics:</strong>{" "}
                Heavy Transit / Crane Offloading Required
              </div>
              <div>
                <strong className="text-[#282926]">SLA Policy:</strong>{" "}
                <span className="text-[#3F7D20] font-semibold">
                  Bulk Project SLA (Non-30min)
                </span>
              </div>
            </div>
          </div>

          <div className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-2.5">
            <div className="flex items-center gap-2 text-[#173885] font-bold border-b border-[#D9E2EA] pb-2">
              <Clock className="w-4 h-4 text-[#3C7DDA]" />
              <span>Inquiry Lifecycle & Bidding</span>
            </div>
            <div className="space-y-1 text-[#606460]">
              <div>
                <strong className="text-[#282926]">Inquiry Created:</strong>{" "}
                {new Date(rfq.created_at).toLocaleDateString("en-IN")}
              </div>
              <div>
                <strong className="text-[#282926]">Bidding Expiry:</strong>{" "}
                {rfq.expiry_date
                  ? new Date(rfq.expiry_date).toLocaleDateString("en-IN")
                  : "Open"}
              </div>
              <div>
                <strong className="text-[#282926]">Quotations Received:</strong>{" "}
                <span className="font-bold text-[#173885]">
                  {quotations.length} Vendor Bids
                </span>
              </div>
              <div>
                <strong className="text-[#282926]">Status:</strong>{" "}
                <span className="font-bold text-[#3C7DDA]">{rfq.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Requested Products Table */}
        <div className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-[#D9E2EA] pb-3 text-xs font-bold text-[#173885]">
            <Package className="w-4 h-4 text-[#3C7DDA]" />
            <span>Requested Construction Products & Specifications</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F6FA] text-[10px] font-bold uppercase text-[#6F8A92]">
                <tr>
                  <th className="p-3">Material / Product Description</th>
                  <th className="p-3">Required Quantity</th>
                  <th className="p-3">Technical Specifications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E2EA]">
                {Array.isArray(requestedItems) && requestedItems.length > 0 ? (
                  requestedItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-bold text-[#173885]">
                        {item.name || item.product_name || `Item #${idx + 1}`}
                      </td>
                      <td className="p-3 font-mono font-bold text-[#282926]">
                        {item.quantity} {item.unit || "Units"}
                      </td>
                      <td className="p-3 text-[#606460]">
                        {item.specifications ||
                          item.notes ||
                          "Standard IS Grade"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-3 font-bold text-[#173885]">
                      {rfq.product_name || "Bulk Concrete Mix & Rebar Supplies"}
                    </td>
                    <td className="p-3 font-mono font-bold text-[#282926]">
                      {rfq.quantity || 1} {rfq.unit || "Lots"}
                    </td>
                    <td className="p-3 text-[#606460]">
                      {rfq.specifications ||
                        "As per project architectural BOQ specifications"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vendor Quotations / Bids Received */}
        <div className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#173885]">
              <FileText className="w-4 h-4 text-[#3C7DDA]" />
              <span>Submitted Vendor Quotations ({quotations.length})</span>
            </div>
          </div>

          {quotations.length === 0 ? (
            <p className="text-xs text-[#606460] py-6 text-center">
              No vendor bids submitted for this RFQ yet.
            </p>
          ) : (
            <div className="space-y-3">
              {quotations.map((q) => {
                const isAccepted =
                  q.status === "ACCEPTED" || q.id === rfq.accepted_quotation_id;

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-2xl border transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs ${
                      isAccepted
                        ? "border-[#3F7D20]/50 bg-[#E1F2D9]/40"
                        : "border-[#D9E2EA] bg-[#F4F6FA]"
                    }`}
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#173885]">
                          {q.vendor?.business_name || "Vendor Depot Partner"}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            isAccepted
                              ? "bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30"
                              : q.status === "REJECTED"
                                ? "bg-[#FBE3DE] text-[#B43D20]"
                                : "bg-[#E4EEF3] text-[#3C7DDA]"
                          }`}
                        >
                          {isAccepted ? "ACCEPTED BID" : q.status}
                        </span>
                        <span className="text-[10px] font-mono text-[#6F8A92]">
                          Submitted:{" "}
                          {new Date(q.created_at).toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 text-[#606460]">
                        <span>
                          Delivery Timeline:{" "}
                          <strong className="text-[#282926]">
                            {q.delivery_timeline || "3 Working Days"}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Validity:{" "}
                          <strong className="text-[#282926]">
                            {q.validity_period || "7 Days"}
                          </strong>
                        </span>
                        {q.terms_and_conditions && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-xs">
                              {q.terms_and_conditions}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-[#6F8A92] uppercase block">
                        Total Quoted Amount
                      </span>
                      <span className="text-base font-black font-mono text-[#173885]">
                        {formatCurrency(q.total_quoted_amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Override Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-md p-6 sm:p-8 rounded-3xl relative shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-[#D9E2EA] pb-3">
                <h3 className="text-lg font-black text-[#173885]">
                  Override Commercial RFQ Status
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#606460] hover:text-[#282926]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleStatusSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Target Lifecycle State *
                  </label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="w-full gm-input px-3 py-2 rounded-xl text-xs font-bold"
                  >
                    <option value="OPEN">OPEN (Open for Bidding)</option>
                    <option value="QUOTATIONS_RECEIVED">
                      QUOTATIONS_RECEIVED
                    </option>
                    <option value="QUOTATION_ACCEPTED">
                      QUOTATION_ACCEPTED
                    </option>
                    <option value="CONVERTED_TO_ORDER">
                      CONVERTED_TO_ORDER
                    </option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="EXPIRED">EXPIRED</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Administrative Reason & Audit Notes *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter justification recorded in the platform audit log and notified to vendors..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full gm-input p-3 rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={submitting}
                    className="btn-gm-secondary px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-gm-primary px-5 py-2 rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
                  >
                    <span>
                      {submitting ? "Applying..." : "Apply Status Update"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminPermissionGuard>
  );
};
