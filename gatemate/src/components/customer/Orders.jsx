import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { AccountNav } from "./AccountNav";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { AuthModal } from "../AuthModal";
import {
  ChevronRight,
  Zap,
  PackageX,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock3,
  XCircle,
  Truck,
  PackageCheck,
} from "lucide-react";
import {
  AuthRequiredStateView,
  ErrorStateView,
  EmptyStateView,
} from "../common/StateViews";

const STATUS_LABELS = {
  NEW: "New",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  READY_FOR_DISPATCH: "Ready for Dispatch",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

const STATUS_STYLES = {
  NEW: "bg-[#E3EBFA] text-[#2E4D94] border-[#2E4D94]/30",
  ACCEPTED: "bg-[#E4EEF3] text-[#173885] border-[#9AAED4]/40",
  PREPARING: "bg-[#E4EEF3] text-[#173885] border-[#9AAED4]/40",
  READY_FOR_DISPATCH: "bg-[#E4EEF3] text-[#173885] border-[#9AAED4]/40",
  OUT_FOR_DELIVERY: "bg-[#E4EEF3] text-[#173885] border-[#9AAED4]/40",
  DELIVERED: "bg-[#E1F2D9] text-[#3F7D20] border-[#3F7D20]/30",
  REJECTED: "bg-[#FBE3DE] text-[#B43D20] border-[#B43D20]/30",
  CANCELLED: "bg-[#FBE3DE] text-[#B43D20] border-[#B43D20]/30",
};

const formatStatus = (status) => {
  return STATUS_LABELS[status] || String(status || "").replace(/_/g, " ");
};

const formatDate = (dateValue) => {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (dateValue) => {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);

  return amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const getProductImage = (product) => {
  if (!product) return "";

  if (product.cover_image_url) {
    return product.cover_image_url;
  }

  if (Array.isArray(product.image_urls) && product.image_urls.length > 0) {
    return product.image_urls[0];
  }

  return "";
};

const getStatusIcon = (status) => {
  switch (status) {
    case "DELIVERED":
      return CheckCircle2;

    case "OUT_FOR_DELIVERY":
      return Truck;

    case "READY_FOR_DISPATCH":
      return PackageCheck;

    case "CANCELLED":
    case "REJECTED":
      return XCircle;

    case "PREPARING":
    case "ACCEPTED":
      return PackageCheck;

    default:
      return Clock3;
  }
};

const normalizeOrder = (order, items = [], productMap = {}) => {
  const normalizedItems = items.map((item) => {
    const product = productMap[item.product_id];

    return {
      id: item.id,
      productId: item.product_id,
      name: item.product_name,
      unit: item.unit,
      sku: item.sku || "",
      price: Number(item.unit_price || 0),
      quantity: Number(item.quantity || 0),
      subtotal: Number(item.subtotal || 0),
      img: getProductImage(product),
    };
  });

  return {
    id: order.id,
    vendorId: order.vendor_id,
    customerId: order.customer_id,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    customerRef: order.customer_ref,

    checkoutReference: order.checkout_reference,

    orderType: order.order_type,
    isExpress30Min: Boolean(order.is_express_30min),

    status: order.status,

    paymentStatus: order.payment_status,
    paymentMethod: order.payment_method,

    shippingAddress: order.shipping_address || {},

    itemSubtotal: Number(order.item_subtotal || 0),
    deliveryFee: Number(order.delivery_fee || 0),
    packagingFee: Number(order.packaging_fee || 0),
    taxAmount: Number(order.tax_amount || 0),
    grandTotal: Number(order.grand_total || 0),

    estimatedDispatchMinutes: order.estimated_dispatch_minutes ?? null,

    deliveredAt: order.delivered_at || null,

    isDelayed: Boolean(order.is_delayed),
    delayReason: order.delay_reason || null,

    createdAt: order.created_at,
    updatedAt: order.updated_at,

    items: normalizedItems,
  };
};

export const Orders = () => {
  const { user, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!user?.id) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      /*
       * Fetch only orders belonging to the authenticated customer.
       */
      const { data: orderRows, error: orderError } = await supabase
        .from("vendor_orders")
        .select(
          `
            id,
            vendor_id,
            customer_id,
            customer_name,
            customer_phone,
            customer_ref,
            checkout_reference,
            order_type,
            is_express_30min,
            status,
            payment_status,
            payment_method,
            shipping_address,
            item_subtotal,
            delivery_fee,
            packaging_fee,
            tax_amount,
            grand_total,
            estimated_dispatch_minutes,
            delivered_at,
            created_at,
            updated_at,
            is_delayed,
            delay_reason
          `,
        )
        .eq("customer_id", user.id)
        .eq("order_type", "NORMAL_ORDER")
        .order("created_at", { ascending: false });

      if (orderError) {
        throw orderError;
      }

      if (!orderRows || orderRows.length === 0) {
        setOrders([]);
        return;
      }

      const orderIds = orderRows.map((order) => order.id);

      /*
       * Fetch all items for these orders in one query.
       */
      const { data: itemRows, error: itemError } = await supabase
        .from("vendor_order_items")
        .select(
          `
            id,
            order_id,
            product_id,
            product_name,
            unit,
            sku,
            unit_price,
            quantity,
            subtotal,
            created_at
          `,
        )
        .in("order_id", orderIds)
        .order("created_at", { ascending: true });

      if (itemError) {
        throw itemError;
      }

      /*
       * Fetch product images separately.
       *
       * Historical order items remain usable even if a product
       * is no longer available.
       */
      const productIds = [
        ...new Set(
          (itemRows || []).map((item) => item.product_id).filter(Boolean),
        ),
      ];

      let productMap = {};

      if (productIds.length > 0) {
        const { data: productRows, error: productError } = await supabase
          .from("vendor_products")
          .select(
            `
                id,
                image_urls,
                cover_image_url
              `,
          )
          .in("id", productIds);

        if (productError) {
          /*
           * Product image failure should not prevent the customer
           * from seeing their order history.
           */
          console.warn(
            "Unable to load product images for orders:",
            productError,
          );
        } else {
          productMap = (productRows || []).reduce((map, product) => {
            map[product.id] = product;
            return map;
          }, {});
        }
      }

      const itemsByOrder = (itemRows || []).reduce((map, item) => {
        if (!map[item.order_id]) {
          map[item.order_id] = [];
        }

        map[item.order_id].push(item);

        return map;
      }, {});

      const normalizedOrders = orderRows.map((order) =>
        normalizeOrder(order, itemsByOrder[order.id] || [], productMap),
      );

      setOrders(normalizedOrders);
    } catch (err) {
      console.error("Failed to load customer orders:", err);

      setError(
        err?.message || "Unable to retrieve your orders. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading) {
      fetchOrders();
    }
  }, [authLoading, fetchOrders]);

  if (!authLoading && !user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24">
        <h1 className="text-xl sm:text-2xl font-black text-[#173885]">
          My Orders
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          <div className="md:col-span-1">
            <AccountNav />
          </div>

          <div className="md:col-span-3">
            <AuthRequiredStateView
              title="Sign In to View Orders"
              description="Personal order history and 30-minute priority delivery tracking are private to your account."
              onOpenAuth={() => setAuthModalOpen(true)}
            />
          </div>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => {
            setAuthModalOpen(false);
            fetchOrders();
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-24">
      {/* Header */}
      <div className="border-b border-[#D9E2EA] pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-[#173885]">
          My Orders
        </h1>

        <p className="text-xs text-[#606460]">
          Track live dispatch status, delivery timelines, and order information
          in Pune & PCMC.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Navigation */}
        <div className="md:col-span-1">
          <AccountNav />
        </div>

        {/* Orders */}
        <div className="md:col-span-3 space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="gm-panel p-6 rounded-3xl h-44 animate-pulse bg-[#E4EEF3]"
                />
              ))}
            </div>
          ) : error ? (
            <ErrorStateView
              title="Error Loading Orders"
              description={error}
              onRetry={fetchOrders}
            />
          ) : orders.length === 0 ? (
            <EmptyStateView
              icon={PackageX}
              title="No Orders Found"
              description="You haven't placed any orders yet. Discover our construction products catalogue."
              actionLink="/products"
              actionLabel="Discover Products"
            />
          ) : (
            orders.map((order) => {
              const StatusIcon = getStatusIcon(order.status);

              const isExpanded = expandedOrderId === order.id;

              return (
                <div
                  key={order.id}
                  className="gm-panel p-4 sm:p-5 rounded-3xl space-y-4 border border-[#D9E2EA] hover:border-[#3C7DDA] transition"
                >
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9E2EA] pb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black text-[#173885]">
                          {order.id}
                        </span>

                        {order.isExpress30Min && (
                          <span className="bg-[#3C7DDA] text-[#FEFEFE] text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5 fill-current" />
                            30-MIN PRIORITY
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-[#606460] mt-1">
                        Placed on {formatDateTime(order.createdAt)}
                      </p>

                      {order.checkoutReference && (
                        <p className="text-[9px] text-[#8A9298] font-mono mt-0.5 truncate">
                          Checkout: {order.checkoutReference}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${
                          STATUS_STYLES[order.status] || STATUS_STYLES.NEW
                        }`}
                      >
                        <StatusIcon className="w-3 h-3" />

                        {formatStatus(order.status)}
                      </span>

                      <Link
                        to={`/account/orders/${order.id}`}
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl bg-[#F4F6FA] text-[#282926] hover:text-[#3C7DDA] border border-[#D9E2EA] transition"
                        title="View Order Details"
                        aria-label={`View details for order ${order.id}`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-2.5">
                    {order.items.length === 0 ? (
                      <p className="text-xs text-[#8A9298]">
                        Order item details are unavailable.
                      </p>
                    ) : (
                      order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          {item.img ? (
                            <img
                              src={item.img}
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded-xl bg-[#F4F6FA] shrink-0 border border-[#D9E2EA]"
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-[#F4F6FA] border border-[#D9E2EA] flex items-center justify-center shrink-0">
                              <PackageX className="w-5 h-5 text-[#9AA0A5]" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-[#282926] truncate">
                              {item.name}
                            </h4>

                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] text-[#606460]">
                                Qty: {item.quantity}
                              </span>

                              <span className="text-[11px] text-[#8A9298]">
                                ×
                              </span>

                              <span className="text-[11px] text-[#606460]">
                                ₹{formatCurrency(item.price)}
                                {item.unit ? ` / ${item.unit}` : ""}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-xs font-black text-[#173885]">
                              ₹{formatCurrency(item.subtotal)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Delayed Order Notice */}
                  {order.isDelayed && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-[#FFF4DC] border border-[#E8C77A]">
                      <AlertCircle className="w-4 h-4 text-[#8A6A22] shrink-0 mt-0.5" />

                      <div>
                        <p className="text-[10px] font-bold text-[#765817]">
                          Delivery Delay
                        </p>

                        {order.delayReason && (
                          <p className="text-[10px] text-[#8A6A22] mt-0.5">
                            {order.delayReason}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Expand Summary */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedOrderId(isExpanded ? null : order.id)
                    }
                    className="text-[10px] font-bold text-[#3C7DDA] hover:text-[#173885] transition"
                  >
                    {isExpanded ? "Hide Order Summary" : "View Order Summary"}
                  </button>

                  {isExpanded && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#F7F9FA] border border-[#D9E2EA]">
                      {/* Payment */}
                      <div>
                        <p className="text-[9px] uppercase tracking-wide font-bold text-[#8A9298]">
                          Payment
                        </p>

                        <p className="text-xs font-bold text-[#282926] mt-1">
                          {order.paymentMethod || "—"}
                        </p>

                        <p
                          className={`text-[10px] mt-0.5 font-bold ${
                            order.paymentStatus === "SUCCESS"
                              ? "text-[#3C7D5A]"
                              : order.paymentStatus === "FAILED"
                                ? "text-[#B43D20]"
                                : "text-[#8A6A22]"
                          }`}
                        >
                          {order.paymentStatus || "PENDING"}
                        </p>
                      </div>

                      {/* Delivery */}
                      <div>
                        <p className="text-[9px] uppercase tracking-wide font-bold text-[#8A9298]">
                          Delivery Address
                        </p>

                        <p className="text-xs text-[#282926] mt-1 leading-relaxed">
                          {order.shippingAddress?.fullName ||
                            order.customerName ||
                            "—"}
                          {order.shippingAddress?.line1
                            ? `, ${order.shippingAddress.line1}`
                            : ""}
                          {order.shippingAddress?.locality
                            ? `, ${order.shippingAddress.locality}`
                            : ""}
                          {order.shippingAddress?.city
                            ? `, ${order.shippingAddress.city}`
                            : ""}
                          {order.shippingAddress?.pincode
                            ? ` - ${order.shippingAddress.pincode}`
                            : ""}
                        </p>
                      </div>

                      {/* Charges */}
                      <div>
                        <p className="text-[9px] uppercase tracking-wide font-bold text-[#8A9298]">
                          Order Charges
                        </p>

                        <div className="mt-1 space-y-1 text-[11px]">
                          <div className="flex justify-between gap-4">
                            <span className="text-[#606460]">Items</span>

                            <span className="font-medium text-[#282926]">
                              ₹{formatCurrency(order.itemSubtotal)}
                            </span>
                          </div>

                          <div className="flex justify-between gap-4">
                            <span className="text-[#606460]">Delivery</span>

                            <span className="font-medium text-[#282926]">
                              ₹{formatCurrency(order.deliveryFee)}
                            </span>
                          </div>

                          <div className="flex justify-between gap-4">
                            <span className="text-[#606460]">Packaging</span>

                            <span className="font-medium text-[#282926]">
                              ₹{formatCurrency(order.packagingFee)}
                            </span>
                          </div>

                          {order.taxAmount > 0 && (
                            <div className="flex justify-between gap-4">
                              <span className="text-[#606460]">Tax</span>

                              <span className="font-medium text-[#282926]">
                                ₹{formatCurrency(order.taxAmount)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Total */}
                      <div>
                        <p className="text-[9px] uppercase tracking-wide font-bold text-[#8A9298]">
                          Grand Total
                        </p>

                        <p className="text-lg font-black text-[#173885] mt-1">
                          ₹{formatCurrency(order.grandTotal)}
                        </p>

                        {order.deliveredAt && (
                          <p className="text-[10px] text-[#3C7D5A] mt-1">
                            Delivered on {formatDateTime(order.deliveredAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bottom Summary */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#D9E2EA]">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#606460]">
                      <span>Payment:</span>

                      <strong className="text-[#282926]">
                        {order.paymentStatus || "PENDING"}
                      </strong>

                      <span>({order.paymentMethod || "—"})</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[#606460] text-xs">Total:</span>

                      <span className="font-mono text-[#173885] font-black text-sm">
                        ₹{formatCurrency(order.grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
