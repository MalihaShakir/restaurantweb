/**
 * PATCH  /api/v1/admin/menu/[id] — update a menu item
 * DELETE /api/v1/admin/menu/[id] — soft-delete a menu item
 *
 * Protected: admin | superadmin.
 */
import { type NextRequest } from "next/server";
import { ZodError } from "zod";
import { connectDB } from "@/server/lib/db";
import { MenuItem } from "@/server/models";
import { requireAdmin } from "@/server/middleware/requireAuth";
import { MenuItemBodySchema } from "@/server/lib/validation";
import { ok, notFound, zodError, serverError, noContent } from "@/server/lib/apiResponse";
import { toCents } from "@/server/services/orderService";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;
  const { restaurantId } = auth;

  const { id } = await params;

  try {
    const raw  = await request.json();
    const body = MenuItemBodySchema.partial().parse(raw);

    await connectDB();

    const update: Record<string, unknown> = { ...body };
    if (body.price !== undefined) update.priceCents = toCents(body.price);
    delete update.price;

    const item = await MenuItem.findOneAndUpdate(
      { _id: id, restaurantId, deletedAt: null },
      { $set: update },
      { new: true },
    ).lean();

    if (!item) return notFound("Menu item not found");

    return ok({ ...item, price: item.priceCents / 100 });
  } catch (err) {
    if (err instanceof ZodError) return zodError(err);
    return serverError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;
  const { restaurantId } = auth;

  const { id } = await params;

  try {
    await connectDB();

    const item = await MenuItem.findOneAndUpdate(
      { _id: id, restaurantId, deletedAt: null },
      { $set: { deletedAt: new Date(), available: false } },
    ).lean();

    if (!item) return notFound("Menu item not found");

    return noContent();
  } catch (err) {
    return serverError(err);
  }
}
