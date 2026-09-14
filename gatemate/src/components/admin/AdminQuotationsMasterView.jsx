import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Search,
  Filter,
  RotateCcw,
  Building2,
  DollarSign,
  Calendar,
  Eye,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { adminRfqService } from "../../services/adminRfqService";
import { AdminPermissionGuard } from "./AdminPermissionGuard";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";
import { SeoHead } from "../common/SeoHead";

export const AdminQuotationsMasterView = () => {
  const [quotations, setQuotations] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminRfqService.getAllQuotations({
        status: statusFilter,
        search,
        limit: 100,
      });
      setQuotations(res.quotations);
      setTotalCount(res.totalCount);
    } catch (err) {
      setError(err.message || "Failed to load quotations ledger.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const formatCurrency = (val) =>
    `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.MANAGE_RFQ}>
      <div className="space-y-6 pb-20 font-sans">
        <SeoHead
          title="Quotations Master Ledger | GateMate Admin"
          description="Platform-wide ledger of vendor commercial quotations, proposal pricing, and acceptance metrics."
          canonicalUrl="/admin/quotations"
          noIndex={true}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
          <div>
            <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              B2B Pricing Ledger
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
              Vendor Quotations Master Ledger
            </h1>
            <p className="text-xs text-[#606460]">
              Audit commercial quotations submitted across regional contractor
              project inquiries.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/rfqs"
              className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-[#3C7DDA]" />
              <span>View RFQ Queue</span>
            </Link>
            <button
              onClick={loadData}
              disabled={loading}
              className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <RotateCcw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="gm-panel p-4 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-2xs">
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1 max-w-md"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92]" />
            <input
              type="text"
              placeholder="Search quotation ID, project name, or vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full gm-input pl-10 pr-20 py-2 rounded-xl text-xs"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 btn-gm-primary px-3 py-1 rounded-lg text-xs font-bold"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2">
            {["ALL", "SUBMITTED", "ACCEPTED", "REJECTED", "EXPIRED"].map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    statusFilter === st
                      ? "bg-[#173885] text-[#FEFEFE] shadow-xs"
                      : "bg-[#F4F6FA] text-[#606460] hover:bg-[#E4EEF3] hover:text-[#173885]"
                  }`}
                >
                  {st}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Master Table */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-[#FEFEFE] rounded-2xl border border-[#D9E2EA]"
              />
            ))}
          </div>
        ) : quotations.length === 0 ? (
          <div className="gm-panel p-12 rounded-3xl border border-[#D9E2EA] text-center space-y-2 bg-[#FEFEFE]">
            <FileText className="w-10 h-10 text-[#6F8A92] mx-auto" />
            <h2 className="text-base font-bold text-[#173885]">
              No Quotations Recorded
            </h2>
            <p className="text-xs text-[#606460]">
              No vendor proposals match the specified filters.
            </p>
          </div>
        ) : (
          <div className="gm-panel rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F6FA] border-b border-[#D9E2EA] text-[10px] font-bold uppercase text-[#6F8A92]">
                <tr>
                  <th className="p-4">Project & RFQ Ref</th>
                  <th className="p-4">Quoting Vendor</th>
                  <th className="p-4">Quoted Amount</th>
                  <th className="p-4">Delivery Lead Time</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Submitted Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E2EA]">
                {quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-[#F4F6FA]/50 transition">
                    <td className="p-4">
                      <span className="font-bold text-[#173885] block">
                        {q.rfq?.project_name || "Commercial Inquiry"}
                      </span>
                      <span className="text-[10px] font-mono text-[#6F8A92]">
                        RFQ ID: {q.rfq_id?.slice(0, 8)}...
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="font-semibold text-[#282926] block">
                        {q.vendor?.business_name || "Vendor Depot"}
                      </span>
                      <span className="text-[10px] text-[#6F8A92]">
                        {q.vendor?.city || "Pune"}
                      </span>
                    </td>

                    <td className="p-4 font-mono font-black text-sm text-[#173885]">
                      {formatCurrency(q.total_quoted_amount)}
                    </td>

                    <td className="p-4 text-[#606460]">
                      {q.delivery_timeline || "3 Working Days"}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          q.status === "ACCEPTED"
                            ? "bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30"
                            : q.status === "REJECTED"
                              ? "bg-[#FBE3DE] text-[#B43D20] border border-[#B43D20]/30"
                              : "bg-[#E4EEF3] text-[#3C7DDA] border border-[#3C7DDA]/30"
                        }`}
                      >
                        {q.status}
                      </span>
                    </td>

                    <td className="p-4 font-mono text-[11px] text-[#6F8A92]">
                      {new Date(q.created_at).toLocaleDateString("en-IN")}
                    </td>

                    <td className="p-4 text-right">
                      <Link
                        to={`/admin/rfqs/${q.rfq_id}`}
                        className="btn-gm-primary px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#FEFEFE]" />
                        <span>Inspect RFQ</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminPermissionGuard>
  );
};
