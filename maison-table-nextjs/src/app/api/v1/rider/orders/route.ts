/**
 * GET /api/v1/rider/orders
 *
 * Returns orders assigned to the authenticated rider.
 * Only shows: ready, out_for_delivery (active deliveries).
 * Protected: rider | staff | admin | superadmin.
 */
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/server/lib/db";
import { Order } from "@/server/models";
import { requireStaff } from "@/server/middleware/requireAuth";
import { ok, serverError } from "@/server/lib/apiResponse";

export async function GET() {
  const auth = await requireStaff();
  if (auth instanceof NextResponse) return auth;
  const { session, restaurantId } = auth;

  try {
    await connectDB();

    const query: Record<string, unknown> = {
      restaurantId,
      status: { $in: ["ready", "out_for_delivery", "delivered"] },
    };

    // Riders only see their own orders; admins/staff see all
    if (session.user.role === "rider") {
      query.riderId = new mongoose.Types.ObjectId(session.user.id);
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .select("orderNumber customer lines paymentMethod paymentStatus totalCents status riderId riderName assignedAt statusHistory deliveryNotes createdAt codCollection")
      .lean();

    return ok(orders.map((o) => ({
      ...o,
      total:       o.totalCents / 100,
      lines: o.lines.map((l) => ({
        name: l.name,
        qty:  l.qty,
        note: l.note,
      })),
    })));
  } catch (err) {
    return serverError(err);
  }
}
