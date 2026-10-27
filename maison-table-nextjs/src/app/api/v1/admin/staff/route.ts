/**
 * GET  /api/v1/admin/staff  — list all staff (kitchen + admin, not riders/customers)
 * POST /api/v1/admin/staff  — create a new staff account
 * Protected: admin | superadmin
 */
import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/server/lib/db";
import { User } from "@/server/models";
import { requireAdmin } from "@/server/middleware/requireAuth";
import { ok, created, conflict, serverError, zodError } from "@/server/lib/apiResponse";
import { ZodError } from "zod";

const CreateSchema = z.object({
  name:     z.string().trim().min(2).max(120),
  email:    z.string().trim().email().max(255),
  password: z.string().min(6).max(100),
  phone:    z.string().trim().optional(),
  role:     z.enum(["staff", "admin"]).default("staff"),
});

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { restaurantId } = auth;

  try {
    await connectDB();
    const staff = await User.find({
      restaurantId,
      role: { $in: ["staff", "admin"] },
      deletedAt: null,
    }).select("-passwordHash").sort({ createdAt: -1 }).lean();
    return ok(staff);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { restaurantId } = auth;

  try {
    const body = CreateSchema.parse(await request.json());
    await connectDB();

    const exists = await User.findOne({ email: body.email }).lean();
    if (exists) return conflict("A user with this email already exists");

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await User.create({
      name: body.name, email: body.email, passwordHash,
      phone: body.phone ?? null, role: body.role,
      restaurantId, active: true, deletedAt: null,
    });

    const obj = user.toObject() as Record<string, unknown>;
    delete obj.passwordHash;
    return created(obj);
  } catch (err) {
    if (err instanceof ZodError) return zodError(err);
    return serverError(err);
  }
}
