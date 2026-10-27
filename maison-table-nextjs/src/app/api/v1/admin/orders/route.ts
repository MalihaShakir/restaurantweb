/**
 * GET /api/v1/admin/orders
 *
 * List all orders for the authenticated staff member's restaurant.
 * Supports pagination and status filtering.
 *
 * Protected: staff | admin | superadmin only.
 */
import { type NextRequest } from "next/server";
import { connectDB } from "@/server/lib/db";
import { Order } from "@/server/models";
import { requireStaff } from "@/server/middleware/requireAuth";
import { ok, serverError } from "@/server/lib/apiResponse";

export async function GET(request: NextRequest) {
  const auth = await requireStaff();
  if (auth instanceof Response) return auth;
  const { restaurantId } = auth;

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit  = Math.min(100, parseInt(searchParams.get("limit") ?? "50", 10));
    const skip   = (page - 1) * limit;

    const filter: Record<string, unknown> = { restaurantId };
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-__v")
        .lean(),
      Order.countDocuments(filter),
    ]);

    return ok({
      orders: orders.map((o) => ({
        ...o,
        subtotal:    o.subtotalCents    / 100,
        deliveryFee: o.deliveryFeeCents / 100,
        discount:    o.discountCents    / 100,
        total:       o.totalCents       / 100,
        lines: o.lines.map((l) => ({
          ...l,
          price:     l.priceCents     / 100,
          lineTotal: l.lineTotalCents / 100,
        })),
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return serverError(err);
  }
}
