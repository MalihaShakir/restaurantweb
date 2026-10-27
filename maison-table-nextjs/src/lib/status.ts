import type { Order, OrderStatus, PaymentStatus } from "./types";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

export const FLOW: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered"];

const NEXT: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready"],
  ready: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
};

export const canTransition = (from: OrderStatus, to: OrderStatus) => NEXT[from].includes(to);
export const nextStatuses = (s: OrderStatus) => NEXT[s];

/** COD cash can be recorded once the order has left the kitchen and is unpaid. */
export const canCollectCod = (o: Order) =>
  o.paymentMethod === "cod" &&
  o.paymentStatus === "pending" &&
  (o.status === "out_for_delivery" || o.status === "delivered");

export const ACTION_LABEL: Record<OrderStatus, string> = {
  pending: "",
  confirmed: "Confirm order",
  preparing: "Start preparing",
  ready: "Mark ready",
  out_for_delivery: "Out for delivery",
  delivered: "Mark delivered",
  cancelled: "Reject order",
};
