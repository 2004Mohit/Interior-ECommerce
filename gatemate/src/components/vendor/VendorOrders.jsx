import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Zap,
  Search,
  RotateCcw,
  MapPin,
  ChevronRight,
  Package,
  AlertCircle,
} from "lucide-react";
import { useVendorAuth } from "../../context/VendorAuthContext";
import { vendorOrderService } from "../../services/vendorOrderService";
import {
  VENDOR_ORDER_STATUS,
  vendorOrderStateMachine,
} from "../../services/vendorOrderStateMachine";
import { SeoHead } from "../common/SeoHead";

export const VendorOrders = () => {
  const { vendorUser } = useVendorAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [error, setError] = useState("");

  /**
   * Convert the real Supabase vendor_orders row into
   * the shape expected by this existing UI.
   */
  const mapOrderForUI = useCallback((order, items = []) => {
    const shippingAddress = order?.shipping_address || {};

    const normalizedItems = (items || []).map((item) => ({
      id: item.id,
      productId: item.product_id,
      name: item.product_name || "Product",
      quantity: Number(item.quantity || 0),
      unit: item.unit || "unit",
      price: Number(item.unit_price || 0),
      subtotal: Number(item.subtotal || 0),
      sku: item.sku || "—",
      img: item.image_url || item.img || null,
    }));

    return {
      ...order,

      // Existing UI-compatible fields
      customerName:
        order.customer_name ||
        shippingAddress.fullName ||
        shippingAddress.name ||
        "Customer",

      customerPhone:
        order.customer_phone ||
        shippingAddress.phone ||
        shippingAddress.mobile ||
        "",

      customerRef: order.customer_ref || "—",

      isExpress30Min: Boolean(order.is_express_30min),

      paymentStatus: order.payment_status || "PENDING",

      paymentMethod: order.payment_method || "PAY_ON_DELIVERY",

      totals: {
        itemSubtotal: Number(order.item_subtotal || 0),
        deliveryFee: Number(order.delivery_fee || 0),
        packagingFee: Number(order.packaging_fee || 0),
        taxAmount: Number(order.tax_amount || 0),
        grandTotal: Number(order.grand_total || 0),
      },

      deliveryAddress: {
        line1:
          shippingAddress.line1 ||
          shippingAddress.addressLine1 ||
          shippingAddress.address ||
          "Address not provided",

        locality: shippingAddress.locality || shippingAddress.area || "",

        city: shippingAddress.city || "",

        pincode: shippingAddress.pincode || shippingAddress.postalCode || "",

        notes: shippingAddress.notes || shippingAddress.deliveryNotes || "",
      },

      createdAt: order.created_at,

      items: normalizedItems,
    };
  }, []);

  const loadOrders = useCallback(async () => {
    if (!vendorUser?.id) return;

    setLoading(true);
    setError("");

    try {
      /*
       * Get the vendor's real orders from Supabase.
       */
      const orderRows = await vendorOrderService.getVendorOrders();

      if (!orderRows?.length) {
        setOrders([]);
        return;
      }

      /*
       * Fetch all order items in one query.
       *
       * vendor_order_items is separate from vendor_orders.
       */
      const orderIds = orderRows.map((order) => order?.id).filter(Boolean);

      const { supabase } = await import("../../lib/supabaseClient");

      const { data: itemRows, error: itemError } = await supabase
        .from("vendor_order_items")
        .select("*")
        .in("order_id", orderIds);

      if (itemError) {
        throw new Error(`Unable to load order products: ${itemError.message}`);
      }

      /*
       * Group items by order ID.
       */
      const itemsByOrder = (itemRows || []).reduce((groups, item) => {
        if (!groups[item.order_id]) {
          groups[item.order_id] = [];
        }

        groups[item.order_id].push(item);

        return groups;
      }, {});

      /*
       * Build the UI-compatible order objects.
       */
      const mappedOrders = orderRows.map((order) =>
        mapOrderForUI(order, itemsByOrder[order.id] || []),
      );

      setOrders(mappedOrders);
    } catch (err) {
      console.error("[VendorOrders] Failed to load orders:", err);

      setOrders([]);

      setError(
        err?.message || "Unable to load vendor orders. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [vendorUser?.id, mapOrderForUI]);

  useEffect(() => {
    if (vendorUser?.id) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [vendorUser?.id, loadOrders]);

  const filteredOrders = orders.filter((o) => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return statusFilter === "ALL" || o.status === statusFilter;
    }

    const matchesSearch =
      String(o.id || "")
        .toLowerCase()
        .includes(query) ||
      String(o.customerName || "")
        .toLowerCase()
        .includes(query) ||
      (o.items || []).some((item) =>
        String(item.name || "")
          .toLowerCase()
          .includes(query),
      );

    const matchStatus = statusFilter === "ALL" || o.status === statusFilter;

    return matchesSearch && matchStatus;
  });

  return (
    <div className="space-y-6 pb-24 font-sans">
      <SeoHead
        title="Normal Site Orders | Ferrado Vendor Portal"
        description="Live normal site orders, 30-minute priority dispatch queue, and customer fulfillment tracking."
        canonicalUrl="/vendor/orders"
        noIndex={true}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div>
          <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Site Dispatch Terminal
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
            Normal Site Orders
          </h1>

          <p className="text-xs text-[#606460]">
            Manage incoming contractor site orders, staging, and 30-minute
            priority delivery commitments in Pune & PCMC.
          </p>
        </div>

        <button
          onClick={loadOrders}
          disabled={loading}
          className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-60"
        >
          <RotateCcw
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
          />

          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="gm-panel p-4 rounded-2xl border border-[#B43D20]/30 bg-[#FBE3DE] text-[#B43D20] text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />

          <div>
            <p className="font-bold">Unable to load orders</p>

            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="gm-panel p-4 rounded-2xl border border-[#D9E2EA] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92] pointer-events-none" />

          <input
            type="text"
            placeholder="Search by Order ID, customer, or product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full gm-input pl-10 pr-4 py-2 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { key: "ALL", label: "All Orders" },
            { key: VENDOR_ORDER_STATUS.NEW, label: "New" },
            {
              key: VENDOR_ORDER_STATUS.ACCEPTED,
              label: "Accepted",
            },
            {
              key: VENDOR_ORDER_STATUS.PREPARING,
              label: "Preparing",
            },
            {
              key: VENDOR_ORDER_STATUS.READY_FOR_DISPATCH,
              label: "Ready",
            },
            {
              key: VENDOR_ORDER_STATUS.OUT_FOR_DELIVERY,
              label: "Out for Delivery",
            },
            {
              key: VENDOR_ORDER_STATUS.DELIVERED,
              label: "Delivered",
            },
          ].map((pill) => (
            <button
              key={pill.key}
              onClick={() => setStatusFilter(pill.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                statusFilter === pill.key
                  ? "bg-[#173885] text-[#FEFEFE]"
                  : "bg-[#F4F6FA] text-[#606460] hover:bg-[#E4EEF3]"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="gm-panel p-6 rounded-3xl h-36 animate-pulse bg-[#E4EEF3]"
            />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="gm-panel p-16 rounded-3xl text-center space-y-3 border border-[#D9E2EA]">
          <ShoppingCart className="w-12 h-12 text-[#6F8A92] mx-auto" />

          <h3 className="text-base font-bold text-[#173885]">
            No Orders Found
          </h3>

          <p className="text-xs text-[#606460]">
            There are no normal site orders matching the selected filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((o) => {
            const items = Array.isArray(o.items) ? o.items : [];

            const totalQty = items.reduce(
              (sum, item) => sum + (Number(item.quantity) || 0),
              0,
            );

            const statusConfig = vendorOrderStateMachine.getStatusConfig(
              o.status,
            );

            return (
              <div
                key={o.id}
                className="gm-panel p-5 sm:p-6 rounded-3xl border border-[#D9E2EA] hover:border-[#3C7DDA] transition space-y-4 shadow-xs"
              >
                {/* Card Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9E2EA] pb-3.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-black text-[#173885] text-sm">
                        {o.id}
                      </span>

                      {o.isExpress30Min && (
                        <span className="bg-[#3C7DDA] text-[#FEFEFE] text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Zap className="w-3 h-3 fill-current" />
                          30-MIN PRIORITY
                        </span>
                      )}

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] ${statusConfig.badgeClass}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#606460]">
                      Ordered by:{" "}
                      <strong className="text-[#282926]">
                        {o.customerName}
                      </strong>{" "}
                      • Ref: {o.customerRef}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <div className="text-right sm:block hidden">
                      <div className="font-mono font-black text-[#173885] text-base">
                        ₹
                        {Number(o.totals?.grandTotal || 0).toLocaleString(
                          "en-IN",
                        )}
                      </div>

                      <span
                        className={`text-[10px] font-bold ${
                          o.paymentStatus === "SUCCESS"
                            ? "text-[#3F7D20]"
                            : "text-[#A66A08]"
                        }`}
                      >
                        {o.paymentStatus} ({o.paymentMethod})
                      </span>
                    </div>

                    <Link
                      to={`/vendor/orders/${o.id}`}
                      className="btn-gm-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Manage Order</span>

                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Products & Delivery Location Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                  {/* Products */}
                  <div className="md:col-span-7 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F8A92] block">
                      Ordered Products ({totalQty} total units)
                    </span>

                    <div className="space-y-2">
                      {items.length === 0 ? (
                        <div className="bg-[#F4F6FA] p-3 rounded-2xl border border-[#D9E2EA] text-[11px] text-[#6F8A92]">
                          No product lines found for this order.
                        </div>
                      ) : (
                        items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 bg-[#F4F6FA] p-2.5 rounded-2xl border border-[#D9E2EA]"
                          >
                            {item.img ? (
                              <img
                                src={item.img}
                                alt=""
                                className="w-10 h-10 rounded-lg object-cover bg-[#FEFEFE] border border-[#D9E2EA] shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-[#FEFEFE] border border-[#D9E2EA] shrink-0 flex items-center justify-center">
                                <Package className="w-5 h-5 text-[#6F8A92]" />
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-[#282926] truncate">
                                {item.name}
                              </h4>

                              <div className="text-[10px] text-[#6F8A92] font-mono">
                                Qty: {item.quantity} {item.unit}s × ₹
                                {item.price} • SKU: {item.sku}
                              </div>
                            </div>

                            <span className="font-mono font-bold text-[#173885] text-xs shrink-0">
                              ₹
                              {Number(item.subtotal || 0).toLocaleString(
                                "en-IN",
                              )}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Delivery Location & Timeline Date */}
                  <div className="md:col-span-5 bg-[#F4F6FA] p-3.5 rounded-2xl border border-[#D9E2EA] space-y-2 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[#173885] font-bold">
                        <MapPin className="w-3.5 h-3.5 text-[#3C7DDA]" />

                        <span>Site Destination</span>
                      </div>

                      <p className="text-[11px] text-[#282926] font-semibold leading-relaxed">
                        {o.deliveryAddress?.line1 || "Address not provided"}
                        {o.deliveryAddress?.locality
                          ? `, ${o.deliveryAddress.locality}`
                          : ""}
                        {o.deliveryAddress?.city
                          ? `, ${o.deliveryAddress.city}`
                          : ""}
                        {o.deliveryAddress?.pincode
                          ? ` - ${o.deliveryAddress.pincode}`
                          : ""}
                      </p>

                      {o.deliveryAddress?.notes && (
                        <p className="text-[10px] text-[#606460] italic">
                          "{o.deliveryAddress.notes}"
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#D9E2EA] flex items-center justify-between text-[10px] text-[#6F8A92] font-mono">
                      <span>
                        Placed:{" "}
                        {o.createdAt
                          ? new Date(o.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </span>

                      <span className="text-[#173885] font-bold">
                        {items.length} Product Line(s)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
