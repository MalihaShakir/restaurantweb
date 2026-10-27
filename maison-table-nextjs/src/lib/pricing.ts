import type { Promotion } from "./types";

export interface Totals {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
}

const round = (n: number) => Math.round(n * 100) / 100;

export function computeTotals(
  lines: { price: number; qty: number }[],
  opts: { deliveryFee: number; freeDeliveryOver: number; promo?: Promotion | null },
): Totals {
  const subtotal = round(lines.reduce((s, l) => s + l.price * l.qty, 0));
  let deliveryFee = subtotal === 0 ? 0 : subtotal >= opts.freeDeliveryOver ? 0 : opts.deliveryFee;
  let discount = 0;
  const p = opts.promo;
  if (p && p.active && subtotal >= (p.minSubtotal ?? 0)) {
    if (p.type === "percent") discount = round((subtotal * p.value) / 100);
    if (p.type === "fixed") discount = Math.min(p.value, subtotal);
    if (p.type === "free_delivery") deliveryFee = 0;
  }
  return { subtotal, deliveryFee, discount, total: round(Math.max(0, subtotal - discount + deliveryFee)) };
}
