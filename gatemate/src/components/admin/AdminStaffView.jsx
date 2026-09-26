import React, { useState, useEffect } from "react";
import {
  UserPlus,
  ShieldCheck,
  Mail,
  Lock,
  User,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  X,
  Clock,
  Ban,
  Check,
} from "lucide-react";
import { adminStaffService } from "../../services/adminStaffService";
import { SeoHead } from "../common/SeoHead";

export const AdminStaffView = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminStaffService.getStaffMembers();
      setStaffList(data);
    } catch (err) {
      setError(err.message || "Failed to load admin staff list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) {
      setError("All fields are required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await adminStaffService.createStaffMember({
        email,
        password,
        fullName,
      });

      setActionSuccess(`Admin credentials created for ${fullName} (${email}).`);
      setIsModalOpen(false);
      setFullName("");
      setEmail("");
      setPassword("");
      loadStaff();
    } catch (err) {
      setError(err.message || "Failed to create staff account.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (staff) => {
    const nextState = !staff.is_active;
    const actionName = nextState ? "reactivate" : "deactivate";

    if (
      !window.confirm(
        `Are you sure you want to ${actionName} admin account "${staff.full_name || staff.email}"?`,
      )
    ) {
      return;
    }

    try {
      await adminStaffService.toggleStaffStatus(staff.id, nextState);
      setActionSuccess(
        `Admin account ${nextState ? "reactivated" : "deactivated"}.`,
      );
      loadStaff();
    } catch (err) {
      setError(err.message || "Failed to update admin account state.");
    }
  };

  return (
    <div className="space-y-6 pb-20 font-sans">
      <SeoHead
        title="Admin Staff Management | Ferrado Operations"
        description="Provision new administrator credentials, manage operations staff access, and control console permissions."
        canonicalUrl="/admin/staff"
        noIndex={true}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div>
          <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Governance & Staff Access
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
            Admin Staff & Member Management
          </h1>
          <p className="text-xs text-[#606460]">
            Provision staff accounts, configure console operators, and manage
            administrative privileges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsModalOpen(true);
              setError(null);
              setActionSuccess(null);
            }}
            className="btn-gm-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <UserPlus className="w-4 h-4 text-[#FEFEFE]" />
            <span>Add Staff Admin</span>
          </button>
          <button
            onClick={loadStaff}
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

      {/* Staff Table */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-[#FEFEFE] rounded-2xl border border-[#D9E2EA]"
            />
          ))}
        </div>
      ) : (
        <div className="gm-panel rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F6FA] border-b border-[#D9E2EA] text-[10px] font-bold uppercase text-[#6F8A92]">
              <tr>
                <th className="p-4">Staff Member</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Role / Scope</th>
                <th className="p-4">Access State</th>
                <th className="p-4">Created Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9E2EA]">
              {staffList.map((staff) => (
                <tr key={staff.id} className="hover:bg-[#F4F6FA]/50 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#E4EEF3] text-[#173885] flex items-center justify-center font-bold text-xs">
                        {(staff.full_name || staff.email || "A")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-[#173885] block">
                          {staff.full_name || "Platform Staff"}
                        </span>
                        <span className="text-[10px] font-mono text-[#6F8A92]">
                          ID: {staff.id.slice(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="p-4 text-[#282926] font-mono">
                    {staff.email}
                  </td>

                  <td className="p-4">
                    <span className="badge-gm-info px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                      ADMINISTRATOR
                    </span>
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        staff.is_active
                          ? "bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30"
                          : "bg-[#FBE3DE] text-[#B43D20] border border-[#B43D20]/30"
                      }`}
                    >
                      {staff.is_active ? "ACTIVE" : "SUSPENDED"}
                    </span>
                  </td>

                  <td className="p-4 font-mono text-[11px] text-[#6F8A92]">
                    {new Date(staff.created_at).toLocaleDateString("en-IN")}
                  </td>

                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(staff)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition inline-flex items-center gap-1 ${
                        staff.is_active
                          ? "border-[#B43D20]/30 text-[#B43D20] hover:bg-[#FBE3DE]"
                          : "border-[#3F7D20]/30 text-[#3F7D20] hover:bg-[#E1F2D9]"
                      }`}
                    >
                      {staff.is_active ? (
                        <>
                          <Ban className="w-3.5 h-3.5" />
                          <span>Deactivate</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Activate</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#173885]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-md p-6 sm:p-8 rounded-3xl relative shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#D9E2EA] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#3C7DDA]" />
                <h3 className="text-lg font-black text-[#173885]">
                  Add New Staff Administrator
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#606460] hover:text-[#282926]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#606460]">
              Create an administrative account with sign-in credentials for
              Ferrado Operations.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#282926] block mb-1">
                  Full Name / Operator Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-[#6F8A92]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anand Deshmukh"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full gm-input pl-10 pr-3.5 py-2.5 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#282926] block mb-1">
                  Official Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[#6F8A92]" />
                  <input
                    type="email"
                    required
                    placeholder="name@ferrado.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full gm-input pl-10 pr-3.5 py-2.5 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#282926] block mb-1">
                  Initial Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#6F8A92]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full gm-input pl-10 pr-10 py-2.5 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#6F8A92] hover:text-[#282926]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#D9E2EA]">
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
                    {submitting ? "Provisioning..." : "Create Admin Account"}
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
