/**
 * POST /api/v1/admin/orders/[id]/collect-cod
 *
 * Record that a staff member has physically collected cash for a COD order.
 * This is the ONLY action that sets paymentStatus = "paid" for a COD order.
 *
 * Requirements:
 *  - Order must be COD
 *  - Payment status must be "pending"
 *  - Order status must be "out_for_delivery" or "delivered"
 *
 * Protected: staff | admin | superadmin.
 */
import { type NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/server/lib/db";
import { Order, AuditEvent } from "@/server/models";
import { requireStaff } from "@/server/middleware/requireAuth";
import { ok, notFound, badRequest, serverError } from "@/server/lib/apiResponse";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const authResult = await requireStaff();
  if (authResult instanceof Response) return authResult;
  const { session, restaurantId } = authResult;
  const user = session.user;

  const { id } = await params;

  try {
    await connectDB();

    const order = await Order.findOne({ _id: id, restaurantId });
    if (!order) return notFound("Order not found");

    if (order.paymentMethod !== "cod") {
      return badRequest("This order is not a Cash on Delivery order");
    }
    if (order.paymentStatus !== "pending") {
      return badRequest(`Payment is already "${order.paymentStatus}" — cannot collect again`);
    }
    if (!["out_for_delivery", "delivered"].includes(order.status)) {
      return badRequest(
        `COD can only be collected when the order is "Out for Delivery" or "Delivered" (current: "${order.status}")`,
      );
    }

    const now = new Date();
    order.paymentStatus = "paid";
    order.codCollection = {
      collectedAt:     now,
      collectedBy:     new mongoose.Types.ObjectId(user.id),
      collectedByName: user.name ?? "",
    };

    await order.save();

    await AuditEvent.create({
      restaurantId,
      actor:       new mongoose.Types.ObjectId(user.id),
      actorEmail:  user.email,
      action:      "order.cod_collected",
      targetId:    order._id,
      targetModel: "Order",
      details:     { orderNumber: order.orderNumber, collectedAt: now },
    }).catch((err) => console.error("Audit write failed:", err));

    return ok({
      id:             String(order._id),
      paymentStatus:  order.paymentStatus,
      codCollectedAt: now,
    });
  } catch (err) {
    return serverError(err);
  }
}
