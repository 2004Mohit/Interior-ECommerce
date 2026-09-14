import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Truck,
  AlertTriangle,
  Clock,
  RotateCcw,
  CheckCircle2,
  MapPin,
  Eye,
  Building2,
  ShieldAlert,
} from "lucide-react";
import { adminOrderService } from "../../services/adminOrderService";
import { AdminPermissionGuard } from "./AdminPermissionGuard";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";
import { SeoHead } from "../common/SeoHead";

export const AdminDeliveryConsoleView = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminOrderService.getOrders({
        status: "ALL",
        limit: 100,
      });
      setOrders(res.orders);
    } catch (err) {
      setError(err.message || "Failed to load delivery telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const expressOrders = orders.filter(
    (o) =>
      o.is_express_30min &&
      !["DELIVERED", "CANCELLED", "REJECTED"].includes(o.status),
  );
  const delayedOrders = orders.filter(
    (o) =>
      o.isSlaBreached &&
      !["DELIVERED", "CANCELLED", "REJECTED"].includes(o.status),
  );
  const deliveredToday = orders.filter((o) => o.status === "DELIVERED");

  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.MANAGE_DELIVERY}>
      <div className="space-y-6 pb-20 font-sans">
        <SeoHead
          title="Delivery & 30-Min SLA Operations | GateMate Admin"
          description="Live Pune & PCMC dispatch radar, 30-minute priority delivery monitoring, and fleet exception handling."
          canonicalUrl="/admin/delivery"
          noIndex={true}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
          <div>
            <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Hyperlocal Dispatch Radar
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
              Delivery Operations & SLA Radar
            </h1>
            <p className="text-xs text-[#606460]">
              Monitor eligible 30-minute express dispatches across Pune & PCMC
              zones and mitigate contractor site exceptions.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RotateCcw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        {/* Telemetry Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="gm-panel p-5 rounded-2xl border border-[#3C7DDA]/40 bg-[#E4EEF3] space-y-1">
            <span className="text-[10px] font-bold text-[#173885] uppercase tracking-wider">
              Active 30-Min Priority Orders
            </span>
            <p className="text-3xl font-black text-[#3C7DDA]">
              {expressOrders.length}
            </p>
            <span className="text-[10px] text-[#606460] block">
              Target turnaround &lt; 30 minutes
            </span>
          </div>

          <div className="gm-panel p-5 rounded-2xl border border-[#B43D20]/40 bg-[#FBE3DE] space-y-1">
            <span className="text-[10px] font-bold text-[#B43D20] uppercase tracking-wider">
              SLA Exceptions / Delayed
            </span>
            <p className="text-3xl font-black text-[#B43D20]">
              {delayedOrders.length}
            </p>
            <span className="text-[10px] text-[#B43D20] block">
              Requires dispatcher intervention
            </span>
          </div>

          <div className="gm-panel p-5 rounded-2xl border border-[#3F7D20]/40 bg-[#E1F2D9] space-y-1">
            <span className="text-[10px] font-bold text-[#3F7D20] uppercase tracking-wider">
              Delivered Platform Orders
            </span>
            <p className="text-3xl font-black text-[#3F7D20]">
              {deliveredToday.length}
            </p>
            <span className="text-[10px] text-[#3F7D20] block">
              Successfully fulfilled
            </span>
          </div>
        </div>

        {/* Active Dispatch & Delay Watchlist */}
        <div className="gm-panel p-6 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#B43D20]" />
              <h2 className="text-sm font-bold text-[#173885]">
                Priority Dispatch & Exception Watchlist
              </h2>
            </div>
            <span className="text-xs font-mono text-[#6F8A92]">
              {delayedOrders.length + expressOrders.length} Monitored Deliveries
            </span>
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 bg-[#F4F6FA] rounded-2xl border border-[#D9E2EA]"
                />
              ))}
            </div>
          ) : delayedOrders.length === 0 && expressOrders.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-[#3F7D20] mx-auto" />
              <h3 className="text-sm font-bold text-[#173885]">
                All Delivery SLAs Healthy
              </h3>
              <p className="text-xs text-[#606460]">
                No delays or SLA breaches reported across active site
                deliveries.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                ...delayedOrders,
                ...expressOrders.filter(
                  (e) => !delayedOrders.some((d) => d.id === e.id),
                ),
              ].map((o) => (
                <div
                  key={o.id}
                  className="p-4 rounded-2xl border border-[#D9E2EA] bg-[#F4F6FA] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-[#173885]">
                        {o.id}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#E4EEF3] text-[#173885]">
                        {o.status}
                      </span>
                      {o.is_express_30min && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#E1F2D9] text-[#3F7D20]">
                          30-MIN EXPRESS
                        </span>
                      )}
                      {o.isSlaBreached && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FBE3DE] text-[#B43D20]">
                          ELAPSED: {o.elapsedMinutes} MINS
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 text-[#606460]">
                      <span>
                        Vendor:{" "}
                        <strong className="text-[#282926]">
                          {o.vendor?.business_name}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Site:{" "}
                        <strong className="text-[#282926]">
                          {o.shipping_address?.locality || "Pune"}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Contractor:{" "}
                        <strong className="text-[#282926]">
                          {o.shipping_address?.fullName}
                        </strong>
                      </span>
                    </div>

                    {o.delay_reason && (
                      <p className="text-[11px] text-[#B43D20] bg-[#FBE3DE]/60 px-2 py-0.5 rounded-md inline-block">
                        <strong>Delay Cause:</strong> {o.delay_reason}
                      </p>
                    )}
                  </div>

                  <Link
                    to={`/admin/orders/${o.id}`}
                    className="btn-gm-primary px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 shadow-xs shrink-0 self-end md:self-auto"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#FEFEFE]" />
                    <span>Manage Dispatch</span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminPermissionGuard>
  );
};
