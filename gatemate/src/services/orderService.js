import { addressService } from "./addressService";
import { paymentService, PAYMENT_MODES } from "./payment/paymentService";

export const PAYMENT_METHODS = PAYMENT_MODES;

export const DELIVERY_OPTIONS = [
  {
    id: "express_30min",
    name: "⚡ 30-Minute Priority Express",
    description: "Direct courier dispatch within Pune, PCMC zones",
    sla: "Within 30 Minutes",
    baseFee: 0,
    cutoffTime: "Available 08:00 AM – 10:00 PM",
    requiresEligibleZone: true,
  },
  {
    id: "standard_scheduled",
    name: "Standard Doorstep Delivery",
    description:
      "Safe scheduled ground courier delivery with tamper-proof packaging",
    sla: "Within 24–48 Hours",
    baseFee: 0,
    cutoffTime: "All day",
    requiresEligibleZone: false,
  },
];

export const orderService = {
  /**
   * Authoritative calculation layer simulating server response.
   * Grand totals and taxes are calculated authoritatively here.
   */
  async calculateCheckoutTotals({
    items = [],
    address,
    deliveryOptionId,
    paymentMethod,
  }) {
    await new Promise((resolve) => setTimeout(resolve, 80));

    const itemSubtotal = items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );

    const zoneAssessment = address
      ? addressService.evaluateDeliveryEligibility(address.pincode)
      : null;
    const selectedDelivery =
      DELIVERY_OPTIONS.find((d) => d.id === deliveryOptionId) ||
      DELIVERY_OPTIONS[1];

    const deliveryFee = selectedDelivery.baseFee;
    const expressServiceable = zoneAssessment?.isExpress30Min || false;
    const packagingFee = itemSubtotal > 0 ? 29 : 0;
    const codConvenienceFee =
      paymentMethod === PAYMENT_MODES.PAY_ON_DELIVERY ? 49 : 0;
    const grandTotal =
      itemSubtotal + deliveryFee + packagingFee + codConvenienceFee;

    return {
      itemSubtotal,
      deliveryFee,
      packagingFee,
      codConvenienceFee,
      grandTotal,
      isZoneServiceable: zoneAssessment?.isServiceable ?? false,
      isExpressEligible: expressServiceable,
      zoneName:
        zoneAssessment?.area || zoneAssessment?.city || "Selected Region",
    };
  },

  /**
   * Dispatches order placement to the payment service layer
   */
  async placeOrder({
    items,
    address,
    deliveryOptionId,
    paymentMethod,
    totals,
    user,
  }) {
    return await paymentService.processOrderCheckout({
      mode: paymentMethod,
      items,
      address,
      deliveryOptionId,
      totals,
      user,
    });
  },
};
