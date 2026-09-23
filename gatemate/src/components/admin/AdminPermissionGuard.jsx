import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useAdminAuth } from "../../context/AdminAuthContext";

export const AdminPermissionGuard = ({
  permission,
  permissions = [],
  children,
}) => {
  const { hasPermission, hasAnyPermission, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="p-8 text-center text-xs font-bold text-[#173885] animate-pulse">
        Verifying administrative authorization...
      </div>
    );
  }

  const isAuthorized = permission
    ? hasPermission(permission)
    : permissions.length > 0
      ? hasAnyPermission(permissions)
      : true;

  if (!isAuthorized) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-3xl bg-[#FEFEFE] border border-[#D9E2EA] text-center space-y-4 shadow-sm font-sans">
        <div className="w-12 h-12 rounded-2xl bg-[#FBE3DE] text-[#B43D20] flex items-center justify-center mx-auto border border-[#B43D20]/20">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-black text-[#173885]">
            403 - Unauthorized Module Access
          </h3>
          <p className="text-xs text-[#606460]">
            Your administrator account lacks the required privilege (
            <code>{permission || permissions.join(", ")}</code>) to view or
            manage this section.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/admin/dashboard"
            className="btn-gm-secondary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Admin Console</span>
          </Link>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminPermissionGuard;
