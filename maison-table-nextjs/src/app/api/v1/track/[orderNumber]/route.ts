/**
 * GET /api/v1/track/[orderNumber]
 *
 * Public order tracking endpoint.
 * Requires phone number in query string to prove ownership (poor-man's token).
 * Returns safe order fields — no internal IDs, no other customer data.
 *
 * Usage: /api/v1/track/MT-001001?phone=+1415555...
 */
import { type NextRequest } from "next/server";
import { connectDB } from "@/server/lib/db";
import { Order, Restaurant } from "@/server/models";
import { ok, notFound, badRequest, serverError } from "@/server/lib/apiResponse";

const RESTAURANT_ID = process.env.RESTAURANT_ID ?? "";

type Params = { params: Promise<{ orderNumber: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { orderNumber } = await params;
  const phone = request.nextUrl.searchParams.get("phone")?.trim();

  if (!phone) {
    return badRequest("Phone number required to track this order");
  }

  try {
    await connectDB();

    const order = await Order.findOne({
      restaurantId: RESTAURANT_ID,
      orderNumber:  orderNumber.toUpperCase(),
    })
      .select("orderNumber customer lines status paymentMethod paymentStatus subtotalCents deliveryFeeCents discountCents totalCents promoCode deliveryNotes statusHistory riderName createdAt updatedAt codCollection")
      .lean();

    if (!order) return notFound("Order not found");

    // Security check — phone must match
    if (order.customer?.phone !== phone) {
      return notFound("Order not found");
    }

    const restaurant = await Restaurant.findById(RESTAURANT_ID)
      .select("name etaMinutes")
      .lean();

    return ok({
      orderNumber:    order.orderNumber,
      status:         order.status,
      paymentMethod:  order.paymentMethod,
      paymentStatus:  order.paymentStatus,
      subtotal:       (order.subtotalCents ?? 0)    / 100,
      deliveryFee:    (order.deliveryFeeCents ?? 0) / 100,
      discount:       (order.discountCents ?? 0)    / 100,
      total:          (order.totalCents ?? 0)        / 100,
      promoCode:      order.promoCode,
      deliveryNotes:  order.deliveryNotes,
      riderName:      order.riderName ?? null,
      createdAt:      order.createdAt,
      updatedAt:      order.updatedAt,
      customer: {
        name:    order.customer?.name,
        address: order.customer?.address,
        // Never return phone or email back to the client
      },
      lines: order.lines.map(l => ({
        name:      l.name,
        qty:       l.qty,
        note:      l.note,
        price:     l.priceCents     / 100,
        lineTotal: l.lineTotalCents / 100,
      })),
      statusHistory: order.statusHistory.map(h => ({
        status: h.status,
        at:     h.at,
      })),
      restaurant: {
        name:       restaurant?.name ?? "Maison Table",
        etaMinutes: restaurant?.etaMinutes ?? 40,
      },
    });
  } catch (err) {
    return serverError(err);
  }
}
