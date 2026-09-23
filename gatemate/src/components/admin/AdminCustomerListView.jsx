import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Search,
  RotateCcw,
  Building2,
  ShoppingCart,
  FileText,
  AlertTriangle,
  Eye,
  ArrowRight,
  ShieldCheck,
  Phone,
  Mail,
  Ban,
} from "lucide-react";
import { adminCustomerService } from "../../services/adminCustomerService";
import { AdminPermissionGuard } from "./AdminPermissionGuard";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";
import { SeoHead } from "../common/SeoHead";

export const AdminCustomerListView = () => {
  const [customers, setCustomers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminCustomerService.getCustomers({
        search,
        limit: 100,
      });
      setCustomers(res.customers);
      setTotalCount(res.totalCount);
    } catch (err) {
      setError(err.message || "Failed to load customer directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const formatCurrency = (val) =>
    `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.MANAGE_CUSTOMERS}>
      <div className="space-y-6 pb-20 font-sans">
        <SeoHead
          title="Customer Accounts & Contractor Directory | GateMate Admin"
          description="Inspect verified contractor buyer accounts, lifetime order spend, RFQ history, and account statuses."
          canonicalUrl="/admin/customers"
          noIndex={true}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
          <div>
            <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Contractor & Buyer Accounts
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
              Customer Accounts Directory
            </h1>
            <p className="text-xs text-[#606460]">
              Inspect registered contractor profiles, lifetime construction
              material purchases, RFQs, and support requests.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/customer-orders"
              className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-[#3C7DDA]" />
              <span>Customer Orders Ledger</span>
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

        {error && (
          <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Toolbar */}
        <div className="gm-panel p-4 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] flex items-center justify-between gap-4 shadow-2xs">
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1 max-w-md"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92]" />
            <input
              type="text"
              placeholder="Search by customer name, email, or phone number..."
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

          <span className="text-xs font-mono text-[#6F8A92] hidden sm:inline">
            {totalCount} Customer Accounts
          </span>
        </div>

        {/* Customers Master Table */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-[#FEFEFE] rounded-2xl border border-[#D9E2EA]"
              />
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="gm-panel p-12 rounded-3xl border border-[#D9E2EA] text-center space-y-2 bg-[#FEFEFE]">
            <Users className="w-10 h-10 text-[#6F8A92] mx-auto" />
            <h2 className="text-base font-bold text-[#173885]">
              No Customers Found
            </h2>
            <p className="text-xs text-[#606460]">
              No customer records match your search criteria.
            </p>
          </div>
        ) : (
          <div className="gm-panel rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F6FA] border-b border-[#D9E2EA] text-[10px] font-bold uppercase text-[#6F8A92]">
                <tr>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Contact Credentials</th>
                  <th className="p-4">Orders & Lifetime Spend</th>
                  <th className="p-4">Commercial RFQs</th>
                  <th className="p-4">Account State</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E2EA]">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F4F6FA]/50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#E4EEF3] text-[#173885] flex items-center justify-center font-bold text-xs">
                          {(c.full_name || "C").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-[#173885] block">
                            {c.full_name || "Contractor Customer"}
                          </span>
                          <span className="text-[10px] font-mono text-[#6F8A92]">
                            ID: {c.id.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-[#606460] space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#6F8A92]" />
                        <span>{c.email || "—"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-[#6F8A92]" />
                        <span>{c.phone || "—"}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="font-mono font-bold text-[#173885] block">
                        {formatCurrency(c.lifetime_spent)}
                      </span>
                      <span className="text-[10px] text-[#606460]">
                        {c.total_orders} Orders Fulfilled
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-[#282926]">
                        {c.total_rfqs || 0} RFQs
                      </span>
                    </td>

                    <td className="p-4">
                      {c.is_suspended ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FBE3DE] text-[#B43D20] border border-[#B43D20]/30">
                          SUSPENDED
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30">
                          ACTIVE
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      <Link
                        to={`/admin/customers/${c.id}`}
                        className="btn-gm-primary px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#FEFEFE]" />
                        <span>Inspect 360</span>
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
