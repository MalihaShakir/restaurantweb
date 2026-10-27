/**
 * GET /api/v1/kitchen/orders
 *
 * Returns only orders relevant to the kitchen: confirmed and preparing.
 * Kitchen staff see no financial data.
 * Protected: staff | admin | superadmin.
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/server/lib/db";
import { Order } from "@/server/models";
import { requireStaff } from "@/server/middleware/requireAuth";
import { ok, serverError } from "@/server/lib/apiResponse";

export async function GET() {
  const auth = await requireStaff();
  if (auth instanceof NextResponse) return auth;
  const { restaurantId } = auth;

  try {
    await connectDB();

    const orders = await Order.find({
      restaurantId,
      status: { $in: ["pending", "confirmed", "preparing", "ready"] },
    })
      .sort({ createdAt: 1 }) // oldest first — FIFO for kitchen
      .select("orderNumber customer lines status statusHistory deliveryNotes createdAt")
      .lean();

    return ok(orders.map((o) => ({
      ...o,
      lines: o.lines.map((l) => ({
        menuItemId: String(l.menuItemId),
        name:  l.name,
        qty:   l.qty,
        note:  l.note,
      })),
    })));
  } catch (err) {
    return serverError(err);
  }
}
