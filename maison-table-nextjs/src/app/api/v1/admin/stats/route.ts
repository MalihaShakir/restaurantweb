/**
 * GET /api/v1/admin/stats
 *
 * Returns today's operational stats and recent orders for the dashboard.
 * Polled by the dashboard every 15 seconds.
 * Protected: staff | admin | superadmin.
 */
import { NextResponse } from "next/server";
import { startOfDay, subDays } from "date-fns";
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

    const todayStart = startOfDay(new Date());

    const [
      todayOrders,
      pendingOrders,
      preparingOrders,
      outForDelivery,
      deliveredToday,
      cancelledToday,
      recentOrders,
      weekRevenue,
    ] = await Promise.all([
      // Today's order count
      Order.countDocuments({ restaurantId, createdAt: { $gte: todayStart } }),
      // Pending count
      Order.countDocuments({ restaurantId, status: "pending" }),
      // In kitchen (confirmed + preparing)
      Order.countDocuments({ restaurantId, status: { $in: ["confirmed", "preparing"] } }),
      // Out for delivery
      Order.countDocuments({ restaurantId, status: "out_for_delivery" }),
      // Delivered today
      Order.countDocuments({ restaurantId, status: "delivered", createdAt: { $gte: todayStart } }),
      // Cancelled today
      Order.countDocuments({ restaurantId, status: "cancelled", createdAt: { $gte: todayStart } }),
      // Recent orders (last 20)
      Order.find({ restaurantId })
        .sort({ createdAt: -1 })
        .limit(20)
        .select("orderNumber customer lines paymentMethod paymentStatus totalCents status createdAt riderId riderName")
        .lean(),
      // Revenue for last 7 days
      Order.aggregate([
        {
          $match: {
            restaurantId: (await import("mongoose")).default.Types.ObjectId.createFromHexString(restaurantId),
            status: { $nin: ["cancelled"] },
            createdAt: { $gte: subDays(new Date(), 7) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$totalCents" },
            count:   { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Today's revenue
    const todayRevenueResult = await Order.aggregate([
      {
        $match: {
          restaurantId: (await import("mongoose")).default.Types.ObjectId.createFromHexString(restaurantId),
          status: { $nin: ["cancelled"] },
          createdAt: { $gte: todayStart },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalCents" } } },
    ]);
    const todayRevenueCents = todayRevenueResult[0]?.total ?? 0;

    return ok({
      stats: {
        todayOrders,
        todayRevenueCents,
        todayRevenue: todayRevenueCents / 100,
        pendingOrders,
        preparingOrders,
        outForDelivery,
        deliveredToday,
        cancelledToday,
      },
      recentOrders: recentOrders.map((o) => ({
        ...o,
        total:       o.totalCents / 100,
        lines: o.lines.map((l) => ({
          ...l,
          price:     l.priceCents     / 100,
          lineTotal: l.lineTotalCents / 100,
        })),
      })),
      weekRevenue: weekRevenue.map((d) => ({
        date:    d._id,
        revenue: d.revenue / 100,
        count:   d.count,
      })),
    });
  } catch (err) {
    return serverError(err);
  }
}
