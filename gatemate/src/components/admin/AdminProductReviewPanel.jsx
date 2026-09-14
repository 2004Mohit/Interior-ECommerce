import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Send,
  Package,
  Eye,
  Clock,
  RotateCcw,
  X,
  Check,
} from "lucide-react";
import {
  vendorProductService,
  PRODUCT_APPROVAL_STATUS,
} from "../../services/vendorProductService";
import { AdminPermissionGuard } from "./AdminPermissionGuard";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";

export const AdminProductReviewPanel = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [decision, setDecision] = useState(PRODUCT_APPROVAL_STATUS.APPROVED);
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [notice, setNotice] = useState(null);

  const loadProducts = async () => {
    setLoading(true);
    const data = await vendorProductService.getAllProductsForAdminReview();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleOpenReview = (prod) => {
    setSelectedProduct(prod);
    setDecision(
      prod.status === PRODUCT_APPROVAL_STATUS.SUBMITTED
        ? PRODUCT_APPROVAL_STATUS.APPROVED
        : prod.status,
    );
    setReviewerNotes(prod.reviewerNotes || "");
  };

  const handleSubmitDecision = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setUpdating(true);
    setNotice(null);

    try {
      // If approved, automatically published to storefront
      const finalStatus =
        decision === PRODUCT_APPROVAL_STATUS.APPROVED
          ? PRODUCT_APPROVAL_STATUS.PUBLISHED
          : decision;

      await vendorProductService.updateAdminProductModeration(
        selectedProduct.id,
        {
          status: finalStatus,
          reviewerNotes,
        },
      );

      setNotice(
        `Product "${selectedProduct.name}" transitioned to ${finalStatus}.`,
      );
      setSelectedProduct(null);
      loadProducts();
      setTimeout(() => setNotice(null), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-xs text-[#606460]">
        Loading admin product moderation queue...
      </div>
    );

  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.REVIEW_PRODUCTS}>
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
        <div className="border-b border-[#D9E2EA] pb-4">
          <h1 className="text-2xl font-black text-[#173885]">
            Admin Product Moderation Console
          </h1>
          <p className="text-xs text-[#606460]">
            Inspect technical attributes, verify BIS/ISI certifications, request
            revisions, or approve products for customer storefront publishing.
          </p>
        </div>

        {notice && (
          <div className="p-3.5 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#3F7D20]" />
            <span>{notice}</span>
          </div>
        )}

        {/* Product Review Modal / Drawer */}
        {selectedProduct && (
          <div className="gm-panel p-6 sm:p-8 rounded-3xl border border-[#3C7DDA] space-y-5 bg-[#FEFEFE] shadow-md">
            <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-3">
              <div>
                <span className="badge-gm-info px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">
                  Reviewing Product ID: {selectedProduct.id}
                </span>
                <h2 className="text-lg font-bold text-[#173885] mt-1">
                  {selectedProduct.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 rounded-lg text-[#606460] hover:bg-[#E4EEF3]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#606460]">
              <div>
                <strong className="text-[#282926]">Category:</strong>{" "}
                {selectedProduct.category}
              </div>
              <div>
                <strong className="text-[#282926]">Brand:</strong>{" "}
                {selectedProduct.brand}
              </div>
              <div>
                <strong className="text-[#282926]">Price:</strong> ₹
                {selectedProduct.price} / {selectedProduct.unit}
              </div>
              <div>
                <strong className="text-[#282926]">Stock:</strong>{" "}
                {selectedProduct.stock} (MOQ: {selectedProduct.moq})
              </div>
            </div>

            <form
              onSubmit={handleSubmitDecision}
              className="space-y-4 pt-3 border-t border-[#D9E2EA]"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Moderation Decision *
                  </label>
                  <select
                    value={decision}
                    onChange={(e) => setDecision(e.target.value)}
                    className="w-full gm-input px-3 py-2.5 rounded-xl text-xs font-bold"
                  >
                    <option value={PRODUCT_APPROVAL_STATUS.APPROVED}>
                      APPROVED (Publish to Storefront)
                    </option>
                    <option value={PRODUCT_APPROVAL_STATUS.CHANGES_REQUESTED}>
                      CHANGES REQUESTED (Return to Vendor)
                    </option>
                    <option value={PRODUCT_APPROVAL_STATUS.REJECTED}>
                      REJECTED (Decline Listing)
                    </option>
                    <option value={PRODUCT_APPROVAL_STATUS.UNDER_REVIEW}>
                      KEEP UNDER REVIEW
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#282926] block mb-1">
                    Reviewer Remarks / Feedback for Vendor
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Please clarify test batch certificate or correct packaging photo."
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="btn-gm-secondary px-4 py-2.5 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="btn-gm-primary px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {updating
                      ? "Saving Decision..."
                      : "Commit Moderation Decision"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Queue Table */}
        <div className="gm-panel rounded-2xl overflow-hidden border border-[#D9E2EA]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#E4EEF3] text-[#173885] font-bold border-b border-[#D9E2EA]">
              <tr>
                <th className="p-3.5">Product Title</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Unit Price</th>
                <th className="p-3.5">Current Status</th>
                <th className="p-3.5 text-right">Moderation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9E2EA]">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-[#F4F6FA] transition">
                  <td className="p-3.5 font-bold text-[#282926]">{p.name}</td>
                  <td className="p-3.5 text-[#606460]">{p.category}</td>
                  <td className="p-3.5 font-mono font-bold text-[#173885]">
                    ₹{p.price} / {p.unit}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === PRODUCT_APPROVAL_STATUS.PUBLISHED ||
                        p.status === PRODUCT_APPROVAL_STATUS.APPROVED
                          ? "bg-[#E1F2D9] text-[#3F7D20]"
                          : p.status ===
                              PRODUCT_APPROVAL_STATUS.CHANGES_REQUESTED
                            ? "bg-[#FFF0D5] text-[#A66A08]"
                            : p.status === PRODUCT_APPROVAL_STATUS.REJECTED
                              ? "bg-[#FBE3DE] text-[#B43D20]"
                              : "bg-[#E3EBFA] text-[#173885]"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleOpenReview(p)}
                      className="btn-gm-primary px-3 py-1.5 rounded-xl text-xs font-bold"
                    >
                      Moderate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPermissionGuard>
  );
};
