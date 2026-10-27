/**
 * PATCH /api/v1/admin/staff/[id] — toggle active / update role
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
  const { restaurantId, session } = auth;
  const { id } = await params;

  // Prevent disabling yourself
  if (id === session.user.id) {
    return NextResponse.json({ error: "You cannot modify your own account" }, { status: 400 });
  }

  try {
    const body = await request.json();
    await connectDB();

    const allowed: Record<string, unknown> = {};
    if (typeof body.active === "boolean") allowed.active = body.active;
    if (body.role && ["staff","admin"].includes(body.role)) allowed.role = body.role;

    const user = await User.findOneAndUpdate(
      { _id: id, restaurantId, role: { $in: ["staff","admin"] } },
      { $set: allowed },
      { new: true },
    ).select("-passwordHash").lean();

    if (!user) return notFound("Staff member not found");
    return ok(user);
  } catch (err) {
    return serverError(err);
  }
}
