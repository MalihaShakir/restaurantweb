/**
 * GET  /api/v1/admin/riders — list riders for this restaurant
 * POST /api/v1/admin/riders — create a new rider account
 * Protected: admin | superadmin.
 */
import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/server/lib/db";
import { User } from "@/server/models";
import { requireAdmin } from "@/server/middleware/requireAuth";
import { ok, created, conflict, serverError } from "@/server/lib/apiResponse";

const CreateRiderSchema = z.object({
  name:     z.string().trim().min(2).max(120),
  email:    z.string().trim().email().max(255),
  password: z.string().min(6).max(100),
  phone:    z.string().trim().optional(),
});

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { restaurantId } = auth;

  try {
    await connectDB();
    const riders = await User.find({ restaurantId, role: "rider", deletedAt: null })
      .select("-passwordHash")
      .lean();
    return ok(riders);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { restaurantId } = auth;

  try {
    const raw  = await request.json();
    const body = CreateRiderSchema.parse(raw);

    await connectDB();

    const exists = await User.findOne({ email: body.email }).lean();
    if (exists) return conflict("A user with this email already exists");

    const passwordHash = await bcrypt.hash(body.password, 12);
    const rider = await User.create({
      name:         body.name,
      email:        body.email,
      passwordHash,
      phone:        body.phone ?? null,
      role:         "rider",
      restaurantId,
      active:       true,
    });

    const { passwordHash: _ph, ...safe } = rider.toObject();
    void _ph;
    return created(safe);
  } catch (err) {
    return serverError(err);
  }
}
