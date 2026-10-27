/**
 * PATCH /api/v1/admin/riders/[id] — toggle active status
 * DELETE /api/v1/admin/riders/[id] — soft-delete rider
 * Protected: admin | superadmin
 */
import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/server/lib/db";
import { User } from "@/server/models";
import { requireAdmin } from "@/server/middleware/requireAuth";
import { ok, notFound, serverError } from "@/server/lib/apiResponse";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { restaurantId } = auth;
  const { id } = await params;

  try {
    const body = await request.json();
    await connectDB();

    const rider = await User.findOneAndUpdate(
      { _id: id, restaurantId, role: "rider" },
      { $set: { active: body.active } },
      { new: true },
    ).select("-passwordHash").lean();

    if (!rider) return notFound("Rider not found");
    return ok(rider);
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { restaurantId } = auth;
  const { id } = await params;

  try {
    await connectDB();
    const rider = await User.findOneAndUpdate(
      { _id: id, restaurantId, role: "rider" },
      { $set: { deletedAt: new Date(), active: false } },
    ).lean();
    if (!rider) return notFound("Rider not found");
    return ok({ success: true });
  } catch (err) {
    return serverError(err);
  }
}
