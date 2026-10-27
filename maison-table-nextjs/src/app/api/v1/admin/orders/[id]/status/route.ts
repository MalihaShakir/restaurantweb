/**
 * PATCH /api/v1/admin/orders/[id]/status
 *
 * Update order status with valid transition enforcement.
 * Protected: staff | admin | superadmin.
 *
 * Body: { status: OrderStatus }
 */
import { type NextRequest } from "next/server";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { connectDB } from "@/server/lib/db";
import { Order, AuditEvent } from "@/server/models";
import { requireStaff } from "@/server/middleware/requireAuth";
import { UpdateOrderStatusBodySchema } from "@/server/lib/validation";
import { canTransition } from "@/server/services/orderService";
import { ok, notFound, badRequest, zodError, serverError } from "@/server/lib/apiResponse";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const authResult = await requireStaff();
  if (authResult instanceof Response) return authResult;
  const { session, restaurantId } = authResult;
  const user = session.user;

  const { id } = await params;

  try {
    const raw  = await request.json();
    const body = UpdateOrderStatusBodySchema.parse(raw);

    await connectDB();

    const order = await Order.findOne({ _id: id, restaurantId });
    if (!order) return notFound("Order not found");

    if (!canTransition(order.status, body.status)) {
      return badRequest(
        `Cannot transition from "${order.status}" to "${body.status}"`,
        { from: order.status, to: body.status },
      );
    }

    const now = new Date();

    // If cancelling a paid online order, flag for refund (but do not auto-refund).
    let paymentStatus = order.paymentStatus;
    if (
      body.status === "cancelled" &&
      order.paymentStatus === "paid" &&
      order.paymentMethod === "online"
    ) {
      paymentStatus = "refunded";
    }

    order.status        = body.status;
    order.paymentStatus = paymentStatus;
    order.statusHistory.push({
      status:    body.status,
      at:        now,
      actor:     user.id,
      actorName: user.name ?? "",
    });

    await order.save();

    await AuditEvent.create({
      restaurantId,
      actor:       new mongoose.Types.ObjectId(user.id),
      actorEmail:  user.email,
      action:      "order.status_changed",
      targetId:    order._id,
      targetModel: "Order",
      details:     { from: order.status, to: body.status, orderNumber: order.orderNumber },
    }).catch((err) => console.error("Audit write failed:", err));

    return ok({
      id:            String(order._id),
      status:        order.status,
      paymentStatus: order.paymentStatus,
    });
  } catch (err) {
    if (err instanceof ZodError) return zodError(err);
    return serverError(err);
  }
}
