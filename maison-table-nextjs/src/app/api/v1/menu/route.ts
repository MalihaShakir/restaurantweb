/**
 * GET /api/v1/menu
 *
 * Returns all active categories and available menu items for a restaurant.
 * Public endpoint — no authentication required.
 *
 * Query params:
 *   restaurantId  (optional) — defaults to the env RESTAURANT_ID if set.
 */
import { type NextRequest } from "next/server";
import { connectDB } from "@/server/lib/db";
import { Category, MenuItem, Restaurant } from "@/server/models";
import { ok, notFound, serverError } from "@/server/lib/apiResponse";

const DEFAULT_RESTAURANT_ID = process.env.RESTAURANT_ID ?? "";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId") || DEFAULT_RESTAURANT_ID;

    if (!restaurantId) {
      return notFound("Restaurant not configured — set RESTAURANT_ID in environment");
    }

    const restaurant = await Restaurant.findById(restaurantId)
      .select("name slug address phone etaMinutes deliveryFeeCents freeDeliveryOverCents minOrderCents acceptingOrders hours")
      .lean();

    if (!restaurant || !restaurant.active) return notFound("Restaurant not found");

    const [categories, items] = await Promise.all([
      Category.find({ restaurantId, active: true })
        .sort({ sort: 1 })
        .select("name slug description image sort")
        .lean(),
      MenuItem.find({ restaurantId, available: true, deletedAt: null })
        .sort({ sortOrder: 1 })
        .select("name slug description image priceCents categoryId dietary available featured bestSeller chefPick")
        .lean(),
    ]);

    return ok({
      restaurant: {
        ...restaurant,
        // Convert cents to dollars for the client.
        deliveryFee:      restaurant.deliveryFeeCents      / 100,
        freeDeliveryOver: restaurant.freeDeliveryOverCents / 100,
        minOrder:         restaurant.minOrderCents          / 100,
      },
      categories,
      menu: items.map((m) => ({
        ...m,
        price: m.priceCents / 100,
      })),
    });
  } catch (err) {
    return serverError(err);
  }
}
