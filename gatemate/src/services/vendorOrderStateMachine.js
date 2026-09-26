/**
 * Ferrado Vendor Order State Machine & Transition Rules
 *
 * Strict Vendor Normal Order Lifecycle:
 * - NEW -> ACCEPTED or REJECTED
 * - ACCEPTED -> PREPARING
 * - PREPARING -> READY_FOR_DISPATCH
 * - READY_FOR_DISPATCH -> OUT_FOR_DELIVERY
 * - OUT_FOR_DELIVERY -> DELIVERED
 *
 * Terminal States:
 * - DELIVERED (Completed)
 * - REJECTED (Vendor Declined)
 * - CANCELLED (Customer / Admin Cancelled)
 */

export const VENDOR_ORDER_STATUS = {
  NEW: "NEW",
  ACCEPTED: "ACCEPTED",
  PREPARING: "PREPARING",
  READY_FOR_DISPATCH: "READY_FOR_DISPATCH",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
};

export const ORDER_LIFECYCLE_SEQUENCE = [
  VENDOR_ORDER_STATUS.NEW,
  VENDOR_ORDER_STATUS.ACCEPTED,
  VENDOR_ORDER_STATUS.PREPARING,
  VENDOR_ORDER_STATUS.READY_FOR_DISPATCH,
  VENDOR_ORDER_STATUS.OUT_FOR_DELIVERY,
  VENDOR_ORDER_STATUS.DELIVERED,
];

// Strict transition graph
export const ALLOWED_TRANSITIONS = {
  [VENDOR_ORDER_STATUS.NEW]: [
    VENDOR_ORDER_STATUS.ACCEPTED,
    VENDOR_ORDER_STATUS.REJECTED,
  ],
  [VENDOR_ORDER_STATUS.ACCEPTED]: [
    VENDOR_ORDER_STATUS.PREPARING,
    VENDOR_ORDER_STATUS.CANCELLED,
  ],
  [VENDOR_ORDER_STATUS.PREPARING]: [
    VENDOR_ORDER_STATUS.READY_FOR_DISPATCH,
    VENDOR_ORDER_STATUS.CANCELLED,
  ],
  [VENDOR_ORDER_STATUS.READY_FOR_DISPATCH]: [
    VENDOR_ORDER_STATUS.OUT_FOR_DELIVERY,
    VENDOR_ORDER_STATUS.CANCELLED,
  ],
  [VENDOR_ORDER_STATUS.OUT_FOR_DELIVERY]: [VENDOR_ORDER_STATUS.DELIVERED],
  // Terminal states allow no further vendor transitions
  [VENDOR_ORDER_STATUS.DELIVERED]: [],
  [VENDOR_ORDER_STATUS.REJECTED]: [],
  [VENDOR_ORDER_STATUS.CANCELLED]: [],
};

// State metadata configuration
export const ORDER_STATUS_CONFIG = {
  [VENDOR_ORDER_STATUS.NEW]: {
    key: VENDOR_ORDER_STATUS.NEW,
    label: "New Order",
    stageNumber: 1,
    badgeClass:
      "bg-[#E4EEF3] text-[#173885] border border-[#9AAED4]/40 font-black",
    description:
      "New site order received. Awaiting depot acceptance or rejection.",
    isTerminal: false,
  },
  [VENDOR_ORDER_STATUS.ACCEPTED]: {
    key: VENDOR_ORDER_STATUS.ACCEPTED,
    label: "Accepted",
    stageNumber: 2,
    badgeClass:
      "bg-[#E3EBFA] text-[#2E4D94] border border-[#2E4D94]/30 font-bold",
    description:
      "Order confirmed by depot. Next step: start bundling & preparing products.",
    isTerminal: false,
  },
  [VENDOR_ORDER_STATUS.PREPARING]: {
    key: VENDOR_ORDER_STATUS.PREPARING,
    label: "Preparing & Staging",
    stageNumber: 3,
    badgeClass:
      "bg-[#FFF0D5] text-[#A66A08] border border-[#A66A08]/30 font-bold",
    description:
      "Products are being picked, bagged, bundled, and staged in the yard.",
    isTerminal: false,
  },
  [VENDOR_ORDER_STATUS.READY_FOR_DISPATCH]: {
    key: VENDOR_ORDER_STATUS.READY_FOR_DISPATCH,
    label: "Ready for Dispatch",
    stageNumber: 4,
    badgeClass:
      "bg-[#E3EBFA] text-[#173885] border border-[#3C7DDA]/40 font-bold",
    description:
      "Consignment packaged with tax invoice and ready for vehicle loading.",
    isTerminal: false,
  },
  [VENDOR_ORDER_STATUS.OUT_FOR_DELIVERY]: {
    key: VENDOR_ORDER_STATUS.OUT_FOR_DELIVERY,
    label: "Out for Delivery",
    stageNumber: 5,
    badgeClass:
      "bg-[#E4EEF3] text-[#173885] border border-[#173885]/40 font-bold",
    description:
      "Delivery vehicle in transit to the customer construction site.",
    isTerminal: false,
  },
  [VENDOR_ORDER_STATUS.DELIVERED]: {
    key: VENDOR_ORDER_STATUS.DELIVERED,
    label: "Delivered",
    stageNumber: 6,
    badgeClass:
      "bg-[#E1F2D9] text-[#3F7D20] border border-[#3F7D20]/30 font-bold",
    description:
      "Products successfully unloaded and accepted at customer job site.",
    isTerminal: true,
  },
  [VENDOR_ORDER_STATUS.REJECTED]: {
    key: VENDOR_ORDER_STATUS.REJECTED,
    label: "Rejected by Depot",
    stageNumber: 0,
    badgeClass:
      "bg-[#FBE3DE] text-[#B43D20] border border-[#B43D20]/30 font-bold",
    description:
      "Order was declined by the depot (e.g. stock unavailable or distance exceeded).",
    isTerminal: true,
  },
  [VENDOR_ORDER_STATUS.CANCELLED]: {
    key: VENDOR_ORDER_STATUS.CANCELLED,
    label: "Cancelled",
    stageNumber: 0,
    badgeClass:
      "bg-[#FBE3DE] text-[#B43D20] border border-[#B43D20]/30 font-bold",
    description: "Order was cancelled prior to site delivery completion.",
    isTerminal: true,
  },
};

export const vendorOrderStateMachine = {
  /**
   * Validates whether a transition from currentStatus to nextStatus is permissible.
   */
  canTransition(currentStatus, nextStatus) {
    if (!currentStatus || !nextStatus) return false;
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    return allowed.includes(nextStatus);
  },

  /**
   * Asserts validity and returns sanitized payload or throws a structured validation error.
   */
  validateTransition(currentStatus, nextStatus) {
    if (currentStatus === nextStatus) {
      throw new Error(`Order is already in state: ${currentStatus}.`);
    }

    const config = ORDER_STATUS_CONFIG[currentStatus];
    if (config?.isTerminal) {
      throw new Error(
        `Cannot modify order in terminal state: ${currentStatus}.`,
      );
    }

    if (!this.canTransition(currentStatus, nextStatus)) {
      throw new Error(
        `Invalid transition from "${currentStatus}" to "${nextStatus}". Allowed target states: ${(ALLOWED_TRANSITIONS[currentStatus] || []).join(", ") || "None"}.`,
      );
    }

    return true;
  },

  /**
   * Returns actionable next status steps for the vendor UI.
   */
  getNextAvailableActions(currentStatus) {
    const nextStates = ALLOWED_TRANSITIONS[currentStatus] || [];
    return nextStates.map((st) => ({
      targetStatus: st,
      config: ORDER_STATUS_CONFIG[st],
      isDestructive:
        st === VENDOR_ORDER_STATUS.REJECTED ||
        st === VENDOR_ORDER_STATUS.CANCELLED,
    }));
  },

  /**
   * Helper to fetch state config safely.
   */
  getStatusConfig(status) {
    return (
      ORDER_STATUS_CONFIG[status] || {
        key: status,
        label: status || "Unknown",
        stageNumber: 0,
        badgeClass: "bg-[#F4F6FA] text-[#606460] border border-[#D9E2EA]",
        description: "Order status state",
        isTerminal: false,
      }
    );
  },
};
