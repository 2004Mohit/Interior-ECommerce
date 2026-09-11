import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Boxes,
  ShoppingCart,
  FileText,
  Banknote,
  Zap,
  ArrowRight,
  Package,
  ShieldCheck,
} from "lucide-react";
import { vendorService } from "../../services/vendorService";

export const VendorDashboard = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [finances, setFinances] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      vendorService.getProducts(),
      vendorService.getOrders(),
      vendorService.getRfqs(),
      vendorService.getFinancialOverview(),
    ]).then(([p, o, r, f]) => {
      setProducts(p);
      setOrders(o);
      setRfqs(r);
      setFinances(f);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="gm-panel p-6 rounded-2xl h-28 bg-[#E4EEF3]"
            />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Active Products",
      val: products.length,
      icon: Package,
      path: "/vendor/products",
    },
    {
      label: "Pending Site Orders",
      val: orders.filter((o) => o.orderStatus !== "DELIVERED").length,
      icon: ShoppingCart,
      path: "/vendor/orders",
    },
    {
      label: "Active Project RFQs",
      val: rfqs.length,
      icon: FileText,
      path: "/vendor/rfqs",
    },
    {
      label: "Settled Earnings",
      val: `₹${finances?.settledPayout?.toLocaleString("en-IN")}`,
      icon: Banknote,
      path: "/vendor/settlements",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9E2EA] pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#173885]">
            Vendor Terminal Dashboard
          </h1>
          <p className="text-xs text-[#606460]">
            Live overview of your product inventory, incoming dispatches, and
            commercial bids.
          </p>
        </div>
        <Link
          to="/vendor/products/new"
          className="btn-gm-primary px-4 py-2 rounded-xl text-xs font-bold self-start sm:self-auto"
        >
          + Add New Product
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <Link
              key={i}
              to={c.path}
              className="gm-card gm-card-hover p-5 rounded-2xl flex items-center justify-between"
            >
              <div>
                <span className="text-[11px] font-bold text-[#6F8A92] uppercase tracking-wider">
                  {c.label}
                </span>
                <div className="text-2xl font-black text-[#173885] mt-1 font-mono">
                  {c.val}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#E4EEF3] flex items-center justify-center text-[#173885]">
                <Icon className="w-5 h-5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Orders & Incoming RFQs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders */}
        <div className="gm-panel p-5 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-3">
            <h3 className="text-sm font-bold text-[#173885]">
              Recent Site Orders
            </h3>
            <Link
              to="/vendor/orders"
              className="text-xs text-[#3C7DDA] hover:underline font-bold"
            >
              View All
            </Link>
          </div>
          <div className="space-y-2.5">
            {orders.slice(0, 3).map((o) => (
              <div
                key={o.id}
                className="p-3.5 rounded-xl bg-[#F4F6FA] border border-[#D9E2EA] flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-[#173885]">
                    {o.id}
                  </span>
                  <p className="text-[11px] text-[#606460] mt-0.5">
                    {o.shippingAddress.locality} ({o.items.length} items)
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-[#173885]">
                    ₹{o.totals.grandTotal}
                  </span>
                  <div className="text-[10px] text-[#3F7D20] font-semibold">
                    {o.orderStatus}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Commercial RFQs */}
        <div className="gm-panel p-5 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#D9E2EA] pb-3">
            <h3 className="text-sm font-bold text-[#173885]">
              Incoming Commercial RFQs
            </h3>
            <Link
              to="/vendor/rfqs"
              className="text-xs text-[#3C7DDA] hover:underline font-bold"
            >
              View All
            </Link>
          </div>
          <div className="space-y-2.5">
            {rfqs.slice(0, 3).map((r) => (
              <div
                key={r.id}
                className="p-3.5 rounded-xl bg-[#F4F6FA] border border-[#D9E2EA] flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-[#282926]">{r.projectName}</h4>
                  <p className="text-[11px] text-[#606460] mt-0.5">
                    {r.productName} ({r.quantity} {r.unit}s)
                  </p>
                </div>
                <Link
                  to={`/vendor/rfqs/${r.id}`}
                  className="btn-gm-secondary px-3 py-1 rounded-lg text-xs font-bold"
                >
                  View RFQ
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
