/**
 * POST /api/v1/admin/orders/[id]/assign-rider
 *
 * Assign a rider to an order. Order must be in "ready" status.
 * Body: { riderId: string } — use "auto" for automatic assignment.
 * Protected: staff | admin | superadmin.
 */
import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "@/server/lib/db";
import { Order, User, AuditEvent } from "@/server/models";
import { requireStaff } from "@/server/middleware/requireAuth";
import { ok, badRequest, notFound, serverError, zodError } from "@/server/lib/apiResponse";

const BodySchema = z.object({
  riderId: z.string().min(1), // ObjectId string or "auto"
});

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireStaff();
  if (auth instanceof NextResponse) return auth;
  const { session, restaurantId } = auth;
  const user = session.user;

  const { id } = await params;

  try {
    const raw  = await request.json();
    const body = BodySchema.parse(raw);

    await connectDB();

    const order = await Order.findOne({ _id: id, restaurantId });
    if (!order) return notFound("Order not found");

    if (order.status !== "ready") {
      return badRequest(
        `Rider can only be assigned when order is "ready" (current: "${order.status}")`,
      );
    }

    let riderId: mongoose.Types.ObjectId;
    let riderName: string;

    if (body.riderId === "auto") {
      // Auto-assign: find an active rider for this restaurant
      const rider = await User.findOne({
        restaurantId,
        role: "rider",
        active: true,
      }).lean();
      if (!rider) return badRequest("No available riders found. Please assign manually.");
      riderId   = rider._id as mongoose.Types.ObjectId;
      riderName = String(rider.name);
    } else {
      // Manual assignment — verify the rider belongs to this restaurant
      const rider = await User.findOne({
        _id: body.riderId,
        restaurantId,
        role: "rider",
        active: true,
      }).lean();
      if (!rider) return notFound("Rider not found or not active for this restaurant");
      riderId   = rider._id as mongoose.Types.ObjectId;
      riderName = String(rider.name);
    }

    const now = new Date();
    order.riderId     = riderId;
    order.riderName   = riderName;
    order.assignedAt  = now;
    order.statusHistory.push({
      status:    "ready",
      at:        now,
      actor:     user.id,
      actorName: `${user.name ?? ""} (assigned rider: ${riderName})`,
    });

    await order.save();

    await AuditEvent.create({
      restaurantId,
      actor:       new mongoose.Types.ObjectId(user.id),
      actorEmail:  user.email,
      action:      "order.rider_assigned",
      targetId:    order._id,
      targetModel: "Order",
      details:     { orderNumber: order.orderNumber, riderId: String(riderId), riderName },
    }).catch(console.error);

    return ok({
      id:         String(order._id),
      riderId:    String(riderId),
      riderName,
      assignedAt: now,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") {
      const { ZodError } = await import("zod");
      if (err instanceof ZodError) return zodError(err);
    }
    return serverError(err);
  }
}
