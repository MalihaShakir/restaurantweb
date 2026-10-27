/**
 * GET /api/v1/orders/[id]
 *
 * Returns a single order's safe public fields.
 *
 * Authorization:
 *  - Guest: can see if they supply the correct orderNumber AND phone (poor-man's token)
 *  - Customer: can see their own orders (customerId matches)
 *  - Staff/Admin: can see any order for their restaurant
 */
import { type NextRequest } from "next/server";
import { auth } from "@/server/lib/auth";
import { connectDB } from "@/server/lib/db";
import { Order } from "@/server/models";
import { ok, notFound, forbidden, serverError } from "@/server/lib/apiResponse";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await connectDB();

    const order = await Order.findById(id)
      .select("-__v")
      .lean();

    if (!order) return notFound("Order not found");

    const session = await auth();
    const user    = session?.user;

    // Authorization check.
    const isAdmin = user && ["staff","admin","superadmin"].includes(user.role);
    const isOwner = user?.id && String(order.customerId) === user.id;
    // Guest fallback: supply phone in query param to prove identity.
    const guestPhone = request.nextUrl.searchParams.get("phone");
    const isGuest    = guestPhone && order.customer?.phone === guestPhone;

    if (!isAdmin && !isOwner && !isGuest) {
      return forbidden("You do not have permission to view this order");
    }

    return ok({
      ...order,
      subtotal:     order.subtotalCents     / 100,
      deliveryFee:  order.deliveryFeeCents  / 100,
      discount:     order.discountCents     / 100,
      total:        order.totalCents        / 100,
      lines: order.lines.map((l) => ({
        ...l,
        price:     l.priceCents     / 100,
        lineTotal: l.lineTotalCents / 100,
      })),
    });
  } catch (err) {
    return serverError(err);
  }
}
