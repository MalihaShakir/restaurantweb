/**
 * GET  /api/v1/admin/menu — list all menu items (including unavailable)
 * POST /api/v1/admin/menu — create a new menu item
 *
 * Protected: admin | superadmin.
 */
import { type NextRequest } from "next/server";
import { ZodError } from "zod";
import { connectDB } from "@/server/lib/db";
import { MenuItem, Category } from "@/server/models";
import { requireAdmin } from "@/server/middleware/requireAuth";
import { MenuItemBodySchema } from "@/server/lib/validation";
import { ok, created, zodError, serverError } from "@/server/lib/apiResponse";
import { toCents } from "@/server/services/orderService";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;
  const { restaurantId } = auth;

  try {
    await connectDB();
    const items = await MenuItem.find({ restaurantId, deletedAt: null })
      .sort({ sortOrder: 1 })
      .lean();

    return ok(items.map((m) => ({ ...m, price: m.priceCents / 100 })));
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;
  const { restaurantId } = auth;

  try {
    const raw    = await request.json();
    const body   = MenuItemBodySchema.parse(raw);

    await connectDB();

    // Verify category belongs to this restaurant.
    const cat = await Category.findOne({ _id: body.categoryId, restaurantId }).lean();
    if (!cat) {
      const { unprocessable } = await import("@/server/lib/apiResponse");
      return unprocessable("Category not found for this restaurant");
    }

    const item = await MenuItem.create({
      ...body,
      priceCents:   toCents(body.price),
      restaurantId,
    });

    return created({ ...item.toObject(), price: item.priceCents / 100 });
  } catch (err) {
    if (err instanceof ZodError) return zodError(err);
    return serverError(err);
  }
}
