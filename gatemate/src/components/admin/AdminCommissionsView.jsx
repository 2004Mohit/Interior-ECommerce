import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Percent,
  Search,
  Filter,
  RotateCcw,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  DollarSign,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { adminFinanceService } from "../../services/adminFinanceService";
import { AdminPermissionGuard } from "./AdminPermissionGuard";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";
import { SeoHead } from "../common/SeoHead";

export const AdminCommissionsView = () => {
  const [commissions, setCommissions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFinanceService.getCommissionLedger({
        search,
        status: statusFilter,
        limit: 100,
      });
      setCommissions(res.commissions);
      setTotalCount(res.totalCount);
    } catch (err) {
      setError(err.message || "Failed to load platform commission records.");
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

  const totalEarnedCommission = commissions.reduce(
    (sum, c) => sum + Number(c.commission_amount || 0),
    0,
  );
  const totalEligibleSubtotal = commissions.reduce(
    (sum, c) => sum + Number(c.product_subtotal || 0),
    0,
  );

  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.MANAGE_COMMISSIONS}>
      <div className="space-y-6 pb-20 font-sans">
        <SeoHead
          title="5% Platform Commission Ledger | GateMate Admin"
          description="Auditable marketplace revenue ledger strictly computing 5% platform fees on net product subtotals."
          canonicalUrl="/admin/commissions"
          noIndex={true}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
          <div>
            <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Marketplace Revenue Model
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
              5% Platform Commission Ledger
            </h1>
            <p className="text-xs text-[#606460]">
              Commission is strictly 5% of Product subtotal only (excludes
              taxes, delivery charges, refunds, and cancelled items).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/settlements"
              className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <span>Bank Settlements Disbursals</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#3C7DDA]" />
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

        {/* Summary Telemetry */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-1">
            <span className="text-[10px] font-bold text-[#6F8A92] uppercase tracking-wider">
              Eligible Material Subtotal
            </span>
            <p className="text-2xl font-black text-[#173885] font-mono">
              {formatCurrency(totalEligibleSubtotal)}
            </p>
            <span className="text-[10px] text-[#606460] block">
              Excludes GST & delivery charges
            </span>
          </div>

          <div className="gm-panel p-5 rounded-2xl border border-[#3F7D20]/40 bg-[#E1F2D9] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#3F7D20] uppercase tracking-wider">
                5% Platform Revenue
              </span>
              <Percent className="w-4 h-4 text-[#3F7D20]" />
            </div>
            <p className="text-2xl font-black text-[#3F7D20] font-mono">
              {formatCurrency(totalEarnedCommission)}
            </p>
            <span className="text-[10px] text-[#3F7D20] font-semibold block">
              5.00% fixed fee applied
            </span>
          </div>

          <div className="gm-panel p-5 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-1">
            <span className="text-[10px] font-bold text-[#6F8A92] uppercase tracking-wider">
              Commission Records
            </span>
            <p className="text-2xl font-black text-[#282926] font-mono">
              {totalCount}
            </p>
            <span className="text-[10px] text-[#606460] block">
              Audited transactions
            </span>
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
              placeholder="Search Order ID or vendor name..."
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

          <div className="flex items-center gap-2 text-xs">
            {["ALL", "EARNED", "SETTLED", "CANCELLED"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  statusFilter === st
                    ? "bg-[#173885] text-[#FEFEFE] shadow-xs"
                    : "bg-[#F4F6FA] text-[#606460] hover:bg-[#E4EEF3] hover:text-[#173885]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Commission Table */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-[#FEFEFE] rounded-2xl border border-[#D9E2EA]"
              />
            ))}
          </div>
        ) : commissions.length === 0 ? (
          <div className="gm-panel p-12 rounded-3xl border border-[#D9E2EA] text-center space-y-2 bg-[#FEFEFE]">
            <Percent className="w-10 h-10 text-[#6F8A92] mx-auto" />
            <h2 className="text-base font-bold text-[#173885]">
              No Commission Records Found
            </h2>
            <p className="text-xs text-[#606460]">
              Commission ledger will populate as customer site orders are
              confirmed.
            </p>
          </div>
        ) : (
          <div className="gm-panel rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F6FA] border-b border-[#D9E2EA] text-[10px] font-bold uppercase text-[#6F8A92]">
                <tr>
                  <th className="p-4">Order Reference</th>
                  <th className="p-4">Vendor</th>
                  <th className="p-4">Product Subtotal (Eligible Base)</th>
                  <th className="p-4">Rate</th>
                  <th className="p-4">5% Commission Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Recorded Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E2EA]">
                {commissions.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F4F6FA]/50 transition">
                    <td className="p-4">
                      <Link
                        to={`/admin/orders/${c.order_id}`}
                        className="font-mono font-bold text-[#173885] hover:underline"
                      >
                        {c.order_id}
                      </Link>
                    </td>

                    <td className="p-4">
                      <span className="font-semibold text-[#282926] block">
                        {c.vendor?.business_name || "Vendor Depot"}
                      </span>
                      <span className="text-[10px] text-[#6F8A92]">
                        {c.vendor?.city || "Pune"}
                      </span>
                    </td>

                    <td className="p-4 font-mono font-bold text-[#282926]">
                      {formatCurrency(c.product_subtotal)}
                    </td>

                    <td className="p-4 font-mono font-bold text-[#3C7DDA]">
                      {c.applied_commission_rate}%
                    </td>

                    <td className="p-4 font-mono font-black text-sm text-[#3F7D20]">
                      {formatCurrency(c.commission_amount)}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          c.status === "EARNED"
                            ? "bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30"
                            : c.status === "SETTLED"
                              ? "bg-[#E4EEF3] text-[#3C7DDA] border border-[#3C7DDA]/30"
                              : "bg-[#FBE3DE] text-[#B43D20] border border-[#B43D20]/30"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>

                    <td className="p-4 font-mono text-[11px] text-[#6F8A92]">
                      {new Date(c.created_at).toLocaleDateString("en-IN")}
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
