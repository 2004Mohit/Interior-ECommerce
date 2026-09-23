import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { AccountNav } from "./AccountNav";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Zap,
  AlertCircle,
  Lock,
  Package,
  Truck,
  XCircle,
  PackageCheck,
  Loader2,
  MapPin,
  CreditCard,
  ReceiptText,
} from "lucide-react";
import { AuthModal } from "../AuthModal";

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

const LIFECYCLE_ORDER = [
  "NEW",
  "ACCEPTED",
  "PREPARING",
  "READY_FOR_DISPATCH",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const formatStatus = (status) => {
  return STATUS_LABELS[status] || String(status || "").replace(/_/g, " ");
};

const formatCurrency = (value) => {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
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
    case "NEW":
      return Clock3;

    case "ACCEPTED":
      return CheckCircle2;

    case "PREPARING":
      return Package;

    case "READY_FOR_DISPATCH":
      return PackageCheck;

    case "OUT_FOR_DELIVERY":
      return Truck;

    case "DELIVERED":
      return CheckCircle2;

    case "REJECTED":
    case "CANCELLED":
      return XCircle;

    default:
      return Clock3;
  }
};

const normalizeAddress = (address) => {
  if (!address || typeof address !== "object") {
    return {
      name: "",
      phone: "",
      line1: "",
      locality: "",
      city: "",
      state: "",
      pincode: "",
      landmark: "",
    };
  }

  return {
    name:
      address.fullName ||
      address.full_name ||
      address.recipientName ||
      address.recipient_name ||
      "",
    phone: address.phone || "",
    line1: address.line1 || address.address_line1 || "",
    locality: address.locality || "",
    city: address.city || "",
    state: address.state || "",
    pincode: address.pincode || "",
    landmark: address.landmark || "",
  };
};

export const OrderDetails = () => {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [timeline, setTimeline] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const fetchOrderDetail = useCallback(async () => {
    if (!user?.id || !id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      /*
       * ---------------------------------------------------------
       * 1. Load the order.
       *
       * customer_id = user.id guarantees that the customer
       * can only request their own order.
       * ---------------------------------------------------------
       */
      const { data: orderData, error: orderError } = await supabase
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
        .eq("id", id)
        .eq("customer_id", user.id)
        .eq("order_type", "NORMAL_ORDER")
        .maybeSingle();

      if (orderError) {
        throw orderError;
      }

      if (!orderData) {
        throw new Error(
          "This order does not exist or you do not have access to it.",
        );
      }

      /*
       * ---------------------------------------------------------
       * 2. Load order items.
       * ---------------------------------------------------------
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
        .eq("order_id", id)
        .order("created_at", {
          ascending: true,
        });

      if (itemError) {
        throw itemError;
      }

      /*
       * ---------------------------------------------------------
       * 3. Load product images.
       *
       * If a product was deleted later, the order itself still
       * remains usable.
       * ---------------------------------------------------------
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
          console.warn("Unable to load order product images:", productError);
        } else {
          productMap = (productRows || []).reduce((map, product) => {
            map[product.id] = product;
            return map;
          }, {});
        }
      }

      const normalizedItems = (itemRows || []).map((item) => ({
        id: item.id,
        productId: item.product_id,
        name: item.product_name,
        unit: item.unit,
        sku: item.sku || "",
        quantity: Number(item.quantity || 0),
        price: Number(item.unit_price || 0),
        subtotal: Number(item.subtotal || 0),
        img: getProductImage(productMap[item.product_id]),
      }));

      /*
       * ---------------------------------------------------------
       * 4. Load the real order timeline.
       * ---------------------------------------------------------
       */
      const { data: timelineRows, error: timelineError } = await supabase
        .from("vendor_order_timeline")
        .select(
          `
            id,
            order_id,
            status,
            label,
            notes,
            created_at
          `,
        )
        .eq("order_id", id)
        .order("created_at", {
          ascending: true,
        });

      if (timelineError) {
        throw timelineError;
      }

      setOrder({
        ...orderData,
        address: normalizeAddress(orderData.shipping_address),
      });

      setItems(normalizedItems);
      setTimeline(timelineRows || []);
    } catch (err) {
      console.error("Failed to load customer order details:", err);

      setOrder(null);
      setItems([]);
      setTimeline([]);

      setError(err?.message || "Unable to locate order details.");
    } finally {
      setLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    if (!authLoading) {
      fetchOrderDetail();
    }
  }, [authLoading, fetchOrderDetail]);

  /*
   * -----------------------------------------------------------
   * Authentication state
   * -----------------------------------------------------------
   */
  if (!authLoading && !user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          <div className="md:col-span-1">
            <AccountNav />
          </div>

          <div className="md:col-span-3">
            <div className="gm-panel p-12 rounded-3xl text-center space-y-4">
              <Lock className="w-10 h-10 text-[#173885] mx-auto" />

              <h2 className="text-lg font-bold text-[#173885]">
                Sign In to View Order
              </h2>

              <p className="text-xs text-[#606460]">
                Authentication is required to view your order details and
                delivery timeline.
              </p>

              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="btn-gm-primary px-6 py-3 rounded-xl text-xs font-bold"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => {
            setAuthModalOpen(false);
            fetchOrderDetail();
          }}
        />
      </div>
    );
  }

  /*
   * -----------------------------------------------------------
   * Loading state
   * -----------------------------------------------------------
   */
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          <div className="md:col-span-1">
            <AccountNav />
          </div>

          <div className="md:col-span-3 space-y-4">
            <div className="gm-panel p-8 rounded-3xl h-20 animate-pulse bg-[#E4EEF3]" />

            <div className="gm-panel p-8 rounded-3xl h-80 animate-pulse bg-[#E4EEF3]" />

            <div className="gm-panel p-8 rounded-3xl h-56 animate-pulse bg-[#E4EEF3]" />
          </div>
        </div>
      </div>
    );
  }

  /*
   * -----------------------------------------------------------
   * Error / not found
   * -----------------------------------------------------------
   */
  if (error || !order) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          <div className="md:col-span-1">
            <AccountNav />
          </div>

          <div className="md:col-span-3">
            <div className="gm-panel p-10 rounded-3xl text-center space-y-4 border border-[#D9E2EA]">
              <div className="w-14 h-14 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/20 text-[#B43D20] flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>

              <h2 className="text-2xl font-black text-[#173885]">
                Order Not Found
              </h2>

              <p className="text-xs text-[#606460] max-w-md mx-auto">
                {error || "The requested order could not be found."}
              </p>

              <div className="flex items-center justify-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={fetchOrderDetail}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold border border-[#D9E2EA] bg-[#FEFEFE] text-[#173885] hover:border-[#3C7DDA] transition"
                >
                  Try Again
                </button>

                <Link
                  to="/account/orders"
                  className="btn-gm-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Order History</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentStatus = order.status;

  const currentLifecycleIndex = LIFECYCLE_ORDER.indexOf(currentStatus);

  const isException =
    currentStatus === "REJECTED" || currentStatus === "CANCELLED";

  const isTerminal =
    currentStatus === "DELIVERED" ||
    currentStatus === "REJECTED" ||
    currentStatus === "CANCELLED";

  const statusStyle = STATUS_STYLES[currentStatus] || STATUS_STYLES.NEW;

  /*
   * Create a lookup from actual timeline records.
   */
  const timelineByStatus = timeline.reduce((map, entry) => {
    if (!map[entry.status]) {
      map[entry.status] = [];
    }

    map[entry.status].push(entry);

    return map;
  }, {});

  const getTimelineEntry = (status) => {
    const entries = timelineByStatus[status];

    if (!entries || entries.length === 0) {
      return null;
    }

    return entries[entries.length - 1];
  };

  const isStatusReached = (status) => {
    if (isException) {
      return status === "NEW";
    }

    const index = LIFECYCLE_ORDER.indexOf(status);

    if (index === -1 || currentLifecycleIndex === -1) {
      return false;
    }

    return index <= currentLifecycleIndex;
  };

  const address = order.address;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-24">
      {/* =====================================================
          HEADER
      ====================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/account/orders"
            className="p-2 rounded-xl bg-[#FEFEFE] text-[#606460] hover:text-[#282926] border border-[#D9E2EA] transition"
            title="Back to Orders"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-[#173885]">
                Order {order.id}
              </h1>

              {order.is_express_30min && (
                <span className="bg-[#3C7DDA] text-[#FEFEFE] text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-current" />
                  30-MIN PRIORITY
                </span>
              )}
            </div>

            <p className="text-xs text-[#606460] mt-1">
              Placed on {formatDateTime(order.created_at)}
            </p>
          </div>
        </div>

        <span
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border self-start sm:self-auto ${statusStyle}`}
        >
          Status: {formatStatus(currentStatus)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* ===================================================
            ACCOUNT NAV
        ==================================================== */}
        <div className="md:col-span-1">
          <AccountNav />
        </div>

        {/* ===================================================
            CONTENT
        ==================================================== */}
        <div className="md:col-span-3 space-y-6">
          {/* =================================================
              EXCEPTION NOTICE
          ================================================== */}
          {isException && (
            <div
              className={`rounded-3xl border p-5 ${
                currentStatus === "REJECTED"
                  ? "bg-[#FFF1ED] border-[#B43D20]/25"
                  : "bg-[#FFF1ED] border-[#B43D20]/25"
              }`}
            >
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-[#B43D20] shrink-0 mt-0.5" />

                <div>
                  <h3 className="text-sm font-black text-[#B43D20]">
                    Order {formatStatus(currentStatus)}
                  </h3>

                  <p className="text-xs text-[#606460] mt-1">
                    {currentStatus === "REJECTED"
                      ? "This order was rejected and will not proceed to delivery."
                      : "This order was cancelled and will not proceed to delivery."}
                  </p>

                  {timelineByStatus[currentStatus]?.length > 0 && (
                    <p className="text-[10px] text-[#8A9298] mt-2">
                      {timelineByStatus[currentStatus].at(-1)?.notes || ""}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              DELAY NOTICE
          ================================================== */}
          {order.is_delayed && (
            <div className="rounded-3xl border border-[#E8C77A] bg-[#FFF7E7] p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#8A6A22] shrink-0" />

                <div>
                  <h3 className="text-sm font-black text-[#765817]">
                    Delivery Delay
                  </h3>

                  <p className="text-xs text-[#8A6A22] mt-1">
                    {order.delay_reason ||
                      "This order is currently experiencing a delivery delay."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              LIVE TIMELINE
          ================================================== */}
          <div className="gm-panel p-6 rounded-3xl space-y-5 border border-[#D9E2EA]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-[#173885] flex items-center gap-2">
                <Clock3 className="w-4 h-4 text-[#3C7DDA]" />
                <span>Order Timeline</span>
              </h3>

              {isTerminal && (
                <span className="text-[10px] text-[#606460]">Final status</span>
              )}
            </div>

            <div className="relative space-y-5">
              {LIFECYCLE_ORDER.map((status, index) => {
                const reached = isStatusReached(status);
                const timelineEntry = getTimelineEntry(status);

                const isCurrent = status === currentStatus;

                const StatusIcon = getStatusIcon(status);

                const isLast = index === LIFECYCLE_ORDER.length - 1;

                return (
                  <div key={status} className="relative flex items-start gap-3">
                    {!isLast && (
                      <div
                        className={`absolute left-[11px] top-7 w-px h-[calc(100%+0.5rem)] ${
                          reached && isStatusReached(LIFECYCLE_ORDER[index + 1])
                            ? "bg-[#173885]"
                            : "bg-[#D9E2EA]"
                        }`}
                      />
                    )}

                    <div
                      className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        reached
                          ? "bg-[#173885] text-[#FEFEFE]"
                          : "bg-[#E9EEF2] text-[#8A9298]"
                      } ${isCurrent ? "ring-4 ring-[#3C7DDA]/15" : ""}`}
                    >
                      {reached ? (
                        <StatusIcon className="w-3.5 h-3.5" />
                      ) : (
                        <span className="text-[9px] font-bold">
                          {index + 1}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <h4
                          className={`text-xs font-bold ${
                            reached ? "text-[#282926]" : "text-[#8A9298]"
                          }`}
                        >
                          {formatStatus(status)}
                        </h4>

                        {timelineEntry?.created_at && (
                          <span className="text-[9px] text-[#8A9298]">
                            {formatDateTime(timelineEntry.created_at)}
                          </span>
                        )}
                      </div>

                      {timelineEntry?.label && (
                        <p className="text-[10px] text-[#606460] mt-0.5">
                          {timelineEntry.label}
                        </p>
                      )}

                      {timelineEntry?.notes && (
                        <p className="text-[10px] text-[#8A9298] mt-0.5">
                          {timelineEntry.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Exception timeline status */}
              {isException && (
                <div className="relative flex items-start gap-3">
                  <div className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-[#B43D20] text-[#FEFEFE]">
                    <XCircle className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <h4 className="text-xs font-bold text-[#B43D20]">
                        {formatStatus(currentStatus)}
                      </h4>

                      {getTimelineEntry(currentStatus)?.created_at && (
                        <span className="text-[9px] text-[#8A9298]">
                          {formatDateTime(
                            getTimelineEntry(currentStatus).created_at,
                          )}
                        </span>
                      )}
                    </div>

                    {getTimelineEntry(currentStatus)?.notes && (
                      <p className="text-[10px] text-[#606460] mt-0.5">
                        {getTimelineEntry(currentStatus).notes}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* =================================================
              ORDERED PRODUCTS
          ================================================== */}
          <div className="gm-panel p-6 rounded-3xl space-y-4 border border-[#D9E2EA]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#173885] uppercase tracking-wider">
                Ordered Products
              </h3>

              <span className="text-[10px] text-[#8A9298]">
                {items.length} {items.length === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="text-xs text-[#8A9298] py-4">
                  No product items were found for this order.
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8FAFB] border border-[#E3E9ED]"
                  >
                    {item.img ? (
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-14 h-14 rounded-xl object-cover bg-[#F4F6FA] shrink-0 border border-[#D9E2EA]"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-[#F4F6FA] border border-[#D9E2EA] flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-[#9AA0A5]" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#282926]">
                        {item.name}
                      </h4>

                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <span className="text-[10px] text-[#606460]">
                          Qty: {item.quantity}
                        </span>

                        <span className="text-[10px] text-[#9AA0A5]">×</span>

                        <span className="text-[10px] text-[#606460]">
                          ₹{formatCurrency(item.price)}
                        </span>

                        {item.unit && (
                          <span className="text-[10px] text-[#8A9298]">
                            / {item.unit}
                          </span>
                        )}
                      </div>

                      {item.sku && (
                        <p className="text-[9px] text-[#9AA0A5] font-mono mt-1">
                          SKU: {item.sku}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-[#173885]">
                        ₹{formatCurrency(item.subtotal)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* =================================================
              ADDRESS + PAYMENT
          ================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Delivery Address */}
            <div className="gm-panel p-6 rounded-3xl space-y-4 border border-[#D9E2EA]">
              <h3 className="text-xs font-bold text-[#173885] uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#3C7DDA]" />
                Delivery Destination
              </h3>

              <div className="space-y-2 text-xs">
                <p className="text-[#282926] font-bold">
                  {address.name || order.customer_name || "—"}
                </p>

                {(address.phone || order.customer_phone) && (
                  <p className="text-[#606460]">
                    {address.phone || order.customer_phone}
                  </p>
                )}

                <p className="text-[#606460] leading-relaxed">
                  {address.line1}
                  {address.locality ? `, ${address.locality}` : ""}
                  {address.city ? `, ${address.city}` : ""}
                  {address.state ? `, ${address.state}` : ""}
                </p>

                {address.pincode && (
                  <p className="font-mono font-bold text-[#173885]">
                    PIN: {address.pincode}
                  </p>
                )}

                {address.landmark && (
                  <p className="text-[10px] text-[#8A9298]">
                    Landmark: {address.landmark}
                  </p>
                )}
              </div>
            </div>

            {/* Payment */}
            <div className="gm-panel p-6 rounded-3xl space-y-4 border border-[#D9E2EA]">
              <h3 className="text-xs font-bold text-[#173885] uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#3C7DDA]" />
                Payment
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between gap-4 text-xs">
                  <span className="text-[#606460]">Method</span>

                  <span className="font-bold text-[#282926] text-right">
                    {order.payment_method || "—"}
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-xs">
                  <span className="text-[#606460]">Status</span>

                  <span
                    className={`font-bold ${
                      order.payment_status === "SUCCESS"
                        ? "text-[#3F7D20]"
                        : order.payment_status === "FAILED"
                          ? "text-[#B43D20]"
                          : "text-[#8A6A22]"
                    }`}
                  >
                    {order.payment_status || "PENDING"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              ORDER SUMMARY
          ================================================== */}
          <div className="gm-panel p-6 rounded-3xl border border-[#D9E2EA]">
            <h3 className="text-xs font-bold text-[#173885] uppercase tracking-wider flex items-center gap-2 mb-5">
              <ReceiptText className="w-4 h-4 text-[#3C7DDA]" />
              Order Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-[#606460]">Product Subtotal</span>

                <span className="font-medium text-[#282926]">
                  ₹{formatCurrency(order.item_subtotal)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-[#606460]">Delivery Fee</span>

                <span className="font-medium text-[#282926]">
                  ₹{formatCurrency(order.delivery_fee)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-[#606460]">Packaging Fee</span>

                <span className="font-medium text-[#282926]">
                  ₹{formatCurrency(order.packaging_fee)}
                </span>
              </div>

              {Number(order.tax_amount || 0) > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-[#606460]">Tax</span>

                  <span className="font-medium text-[#282926]">
                    ₹{formatCurrency(order.tax_amount)}
                  </span>
                </div>
              )}

              <div className="border-t border-[#D9E2EA] pt-4 mt-4 flex justify-between items-center gap-4">
                <span className="text-sm font-black text-[#282926]">
                  Grand Total
                </span>

                <span className="text-xl font-black font-mono text-[#173885]">
                  ₹{formatCurrency(order.grand_total)}
                </span>
              </div>
            </div>
          </div>

          {/* =================================================
              DELIVERY INFORMATION
          ================================================== */}
          {order.estimated_dispatch_minutes && (
            <div className="rounded-3xl border border-[#D9E2EA] bg-[#F8FAFB] p-5">
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-[#3C7DDA] shrink-0" />

                <div>
                  <h3 className="text-xs font-bold text-[#173885]">
                    Estimated Dispatch
                  </h3>

                  <p className="text-[11px] text-[#606460] mt-1">
                    Estimated dispatch time:{" "}
                    <strong>{order.estimated_dispatch_minutes} minutes</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              DELIVERED INFORMATION
          ================================================== */}
          {order.delivered_at && (
            <div className="rounded-3xl border border-[#3F7D20]/20 bg-[#F1F8ED] p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#3F7D20] shrink-0" />

                <div>
                  <h3 className="text-xs font-bold text-[#3F7D20]">
                    Order Delivered
                  </h3>

                  <p className="text-[11px] text-[#606460] mt-1">
                    Delivered on{" "}
                    <strong>{formatDateTime(order.delivered_at)}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              ORDER REFERENCES
          ================================================== */}
          <div className="text-[9px] text-[#9AA0A5] space-y-1 px-1">
            <p>
              Order ID: <span className="font-mono">{order.id}</span>
            </p>

            {order.checkout_reference && (
              <p>
                Checkout Reference:{" "}
                <span className="font-mono">{order.checkout_reference}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
