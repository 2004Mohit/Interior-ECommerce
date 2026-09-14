import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  PlusCircle,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { AccountNav } from "./AccountNav";
import { SeoHead } from "../common/SeoHead";

export const Complaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("DELIVERY_DELAY");
  const [orderId, setOrderId] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadComplaints = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("customer_complaints")
        .select("*")
        .order("created_at", { ascending: false });

      if (err) throw err;
      setComplaints(data || []);
    } catch (err) {
      setError(err.message || "Failed to load support inquiries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError("Subject and description are required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.rpc(
        "customer_submit_complaint",
        {
          p_subject: subject.trim(),
          p_description: description.trim(),
          p_category: category,
          p_order_id: orderId.trim() || null,
        },
      );

      if (err) throw err;
      setActionSuccess(
        "Support ticket registered. Our operations team is investigating.",
      );
      setIsModalOpen(false);
      setSubject("");
      setDescription("");
      setOrderId("");
      loadComplaints();
    } catch (err) {
      setError(err.message || "Failed to submit complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24 font-sans">
      <SeoHead
        title="Help & Inquiries | GateMate Customer Support"
        description="Register and track construction order inquiries, delivery delay investigations, and site disputes."
        canonicalUrl="/account/complaints"
        noIndex={true}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#173885]">
            Help & Dispute Inquiries
          </h1>
          <p className="text-xs text-[#606460]">
            Track investigations for site deliveries, damage reports, and
            invoice inquiries.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-gm-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
        >
          <PlusCircle className="w-4 h-4 text-[#FEFEFE]" />
          <span>Register New Inquiry</span>
        </button>
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        <div className="md:col-span-1">
          <AccountNav />
        </div>

        <div className="md:col-span-3 space-y-4">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-[#FEFEFE] rounded-2xl border border-[#D9E2EA]"
                />
              ))}
            </div>
          ) : complaints.length === 0 ? (
            <div className="gm-panel p-12 rounded-3xl text-center space-y-2 border border-[#D9E2EA] bg-[#FEFEFE]">
              <MessageSquare className="w-10 h-10 text-[#6F8A92] mx-auto" />
              <h2 className="text-base font-bold text-[#173885]">
                No Support Inquiries Logged
              </h2>
              <p className="text-xs text-[#606460]">
                If you encounter site offloading or order discrepancies, file a
                ticket above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.map((c) => (
                <div
                  key={c.id}
                  className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-[#D9E2EA] pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[#173885]">
                        {c.subject}
                      </span>
                      <span className="badge-gm-info px-2 py-0.5 rounded-md text-[10px] font-bold">
                        {c.category}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          c.status === "RESOLVED"
                            ? "bg-[#E1F2D9] text-[#3F7D20]"
                            : "bg-[#FFF0D5] text-[#A66A08]"
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#6F8A92]">
                      {new Date(c.created_at).toLocaleDateString("en-IN")}
                    </span>
                  </div>

                  <p className="text-xs text-[#606460] bg-[#F4F6FA] p-3 rounded-xl border border-[#D9E2EA]">
                    {c.description}
                  </p>

                  {c.resolution_notes && (
                    <div className="p-3 rounded-xl bg-[#E1F2D9]/40 border border-[#3F7D20]/20 text-xs text-[#3F7D20]">
                      <strong>Resolution:</strong> {c.resolution_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-md p-6 sm:p-8 rounded-3xl relative shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#D9E2EA] pb-3">
              <h3 className="text-lg font-black text-[#173885]">
                Register Support Inquiry
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#606460] hover:text-[#282926]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#282926] block mb-1">
                  Issue Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full gm-input px-3 py-2 rounded-xl font-bold"
                >
                  <option value="DELIVERY_DELAY">
                    Delivery Delay / SLA Issue
                  </option>
                  <option value="DAMAGED_PRODUCT">
                    Damaged / Substandard Product
                  </option>
                  <option value="INCORRECT_QUANTITY">
                    Quantity Mismatch at Site
                  </option>
                  <option value="INVOICE_BILLING">
                    GST Invoice & Billing Dispute
                  </option>
                  <option value="OTHER">General Inquiry</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#282926] block mb-1">
                  Subject Headline *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50kg Cement Bags delivery delayed by 2 hours"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-[#282926] block mb-1">
                  Order ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ORD-20260914-..."
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full gm-input px-3.5 py-2.5 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-[#282926] block mb-1">
                  Detailed Explanation *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the issue encountered at your construction site..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full gm-input p-3 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="btn-gm-secondary px-4 py-2 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-gm-primary px-5 py-2 rounded-xl font-bold shadow-xs disabled:opacity-50"
                >
                  <span>
                    {submitting ? "Submitting..." : "Register Ticket"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
