/**
 * Order creation service.
 *
 * This is the authoritative checkout logic.
 * The client submits item IDs and quantities; we look up every price ourselves.
 * Client-submitted prices and totals are NEVER trusted.
 *
 * Checkout flow:
 *  1. Validate request fields (done by Zod in the route handler before calling this)
 *  2. Load restaurant — verify it's active and accepting orders
 *  3. Load and validate each menu item — reject unavailable items
 *  4. Compute totals on the server (subtotal, delivery fee, promo discount)
 *  5. Validate promo code if provided
 *  6. Check idempotency key — return existing order if this is a retry
 *  7. Generate a unique human-readable order number
 *  8. Create the Order document
 *  9. Increment promo usage counter
 * 10. Return the safe confirmation payload
 */
import type { Types } from "mongoose";
import { connectDB } from "@/server/lib/db";
import { Order, MenuItem, Restaurant, Promotion } from "@/server/models";
import type { CheckoutBody } from "@/server/lib/validation";

// ─── Valid order status transitions ───────────────────────────────────────────
const TRANSITIONS: Record<string, string[]> = {
  pending:          ["confirmed", "cancelled"],
  confirmed:        ["preparing", "cancelled"],
  preparing:        ["ready"],
  ready:            ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered:        [],
  cancelled:        [],
};

export function canTransition(from: string, to: string): boolean {
  return (TRANSITIONS[from] ?? []).includes(to);
}

// ─── Cents helpers ─────────────────────────────────────────────────────────────
/** Convert dollars (float) to integer cents. */
export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Convert integer cents to dollar-formatted string. */
export function fromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

// ─── Order number ──────────────────────────────────────────────────────────────
/**
 * Generates a unique order number like "MT-001042".
 * Uses the current order count for the restaurant — not perfectly sequential
 * under high concurrency but acceptable for a single-restaurant deployment.
 * For strict sequential numbers, use a separate counter collection.
 */
async function generateOrderNumber(restaurantId: string): Promise<string> {
  const count = await Order.countDocuments({ restaurantId });
  const seq   = String(count + 1001).padStart(6, "0");
  return `MT-${seq}`;
}

// ─── Promotion validation ─────────────────────────────────────────────────────

interface AppliedPromo {
  code:          string;
  discountCents: number;
  freeDelivery:  boolean;
}

async function applyPromo(
  restaurantId: string,
  code: string,
  subtotalCents: number,
): Promise<AppliedPromo | { error: string }> {
  const promo = await Promotion.findOne({
    restaurantId,
    code: code.toUpperCase().trim(),
    active: true,
  }).lean();

  if (!promo) return { error: "Promo code not found or inactive" };

  const now = new Date();
  if (promo.startsAt  && promo.startsAt  > now) return { error: "Promo code is not yet active" };
  if (promo.expiresAt && promo.expiresAt < now) return { error: "Promo code has expired" };
  if (promo.maxUses !== null && promo.usageCount >= (promo.maxUses ?? Infinity)) {
    return { error: "Promo code usage limit reached" };
  }
  if (subtotalCents < promo.minSubtotalCents) {
    const min = fromCents(promo.minSubtotalCents);
    return { error: `Minimum order of $${min} required for this code` };
  }

  let discountCents = 0;
  let freeDelivery  = false;

  if (promo.type === "percent") {
    // discountValue is stored as basis points (e.g. 10% = 1000 bps)
    discountCents = Math.round((subtotalCents * promo.discountValue) / 10000);
  } else if (promo.type === "fixed") {
    discountCents = Math.min(promo.discountValue, subtotalCents);
  } else if (promo.type === "free_delivery") {
    freeDelivery = true;
  }

  return { code: promo.code, discountCents, freeDelivery };
}

// ─── Main service ─────────────────────────────────────────────────────────────

export interface CreateOrderResult {
  orderId:     string;
  orderNumber: string;
  totalCents:  number;
  status:      string;
}

export async function createOrder(
  restaurantId: string,
  customerId: string | null,
  body: CheckoutBody,
): Promise<CreateOrderResult | { error: string; status: number }> {
  await connectDB();

  // 1. Load restaurant.
  const restaurant = await Restaurant.findById(restaurantId).lean();
  if (!restaurant) return { error: "Restaurant not found",        status: 404 };
  if (!restaurant.active)         return { error: "Restaurant is not active",       status: 503 };
  if (!restaurant.acceptingOrders) return { error: "Restaurant is not accepting orders", status: 503 };

  // 2. Idempotency check.
  if (body.idempotencyKey) {
    const existing = await Order.findOne({ restaurantId, idempotencyKey: body.idempotencyKey }).lean();
    if (existing) {
      return {
        orderId:     String(existing._id),
        orderNumber: existing.orderNumber,
        totalCents:  existing.totalCents,
        status:      existing.status,
      };
    }
  }

  // 3. Load and validate every menu item.
  const menuItemIds = [...new Set(body.lines.map((l) => l.menuItemId))];
  const menuItems   = await MenuItem.find({
    _id:          { $in: menuItemIds },
    restaurantId,
    deletedAt:    null,
  }).lean();

  const menuMap = new Map(menuItems.map((m) => [String(m._id), m]));

  type BuiltLine = {
    menuItemId:     Types.ObjectId;
    name:           string;
    priceCents:     number;
    qty:            number;
    note:           string;
    lineTotalCents: number;
  };

  const lines: BuiltLine[] = [];

  for (const reqLine of body.lines) {
    const item = menuMap.get(reqLine.menuItemId);
    if (!item) {
      return { error: `Menu item not found: ${reqLine.menuItemId}`, status: 422 };
    }
    if (!item.available) {
      return { error: `"${item.name}" is not available`, status: 422 };
    }
    lines.push({
      menuItemId:     item._id as Types.ObjectId,
      name:           item.name,
      priceCents:     item.priceCents,
      qty:            reqLine.qty,
      note:           reqLine.note ?? "",
      lineTotalCents: item.priceCents * reqLine.qty,
    });
  }

  // 4. Compute totals.
  const subtotalCents = lines.reduce((s, l) => s + l.lineTotalCents, 0);

  if (subtotalCents < restaurant.minOrderCents) {
    const min = fromCents(restaurant.minOrderCents);
    return { error: `Minimum order is $${min}`, status: 422 };
  }

  let deliveryFeeCents = restaurant.deliveryFeeCents;
  let discountCents    = 0;
  let usedPromoCode: string | null = null;

  // 5. Apply promo.
  if (body.promoCode) {
    const promoResult = await applyPromo(restaurantId, body.promoCode, subtotalCents);
    if ("error" in promoResult) return { error: promoResult.error, status: 422 };
    discountCents    = promoResult.discountCents;
    usedPromoCode    = promoResult.code;
    if (promoResult.freeDelivery) deliveryFeeCents = 0;
  }

  if (subtotalCents >= restaurant.freeDeliveryOverCents) {
    deliveryFeeCents = 0;
  }

  const totalCents = Math.max(0, subtotalCents - discountCents + deliveryFeeCents);

  // 6. Generate order number.
  const orderNumber = await generateOrderNumber(restaurantId);
  const now         = new Date();

  // 7. Create order.
  const [order] = await Order.create([
    {
      orderNumber,
      restaurantId,
      customerId:   customerId ?? null,
      customer:     body.customer,
      deliveryNotes: body.deliveryNotes ?? "",
      lines,
      subtotalCents,
      deliveryFeeCents,
      discountCents,
      totalCents,
      promoCode:      usedPromoCode,
      paymentMethod:  body.paymentMethod,
      paymentStatus:  "pending",
      status:         "pending",
      statusHistory:  [{ status: "pending", at: now, actor: customerId ?? "guest" }],
      idempotencyKey: body.idempotencyKey ?? null,
    },
  ]);

  // 8. Increment promo usage counter (non-fatal if it fails).
  if (usedPromoCode) {
    await Promotion.updateOne(
      { restaurantId, code: usedPromoCode },
      { $inc: { usageCount: 1 } },
    ).catch((err) => console.error("Failed to increment promo usage:", err));
  }

  return {
    orderId:     String(order._id),
    orderNumber: order.orderNumber,
    totalCents:  order.totalCents,
    status:      order.status,
  };
}
