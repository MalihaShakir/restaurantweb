/**
 * POST /api/v1/orders — Create a new order (checkout)
 *
 * Authentication: optional (guests can order; logged-in customers get order linked to account)
 *
 * The server:
 * 1. Validates all fields via Zod
 * 2. Loads current prices from the DB — never trusts client-submitted prices
 * 3. Recalculates totals
 * 4. Validates the promo code (if any)
 * 5. Creates the order atomically
 * 6. Returns a safe confirmation (no DB internals, no sensitive data)
 */
import { type NextRequest } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/server/lib/auth";
import { CheckoutBodySchema } from "@/server/lib/validation";
import { createOrder } from "@/server/services/orderService";
import { created, zodError, serverError, serviceUnavailable } from "@/server/lib/apiResponse";

const RESTAURANT_ID = process.env.RESTAURANT_ID ?? "";

export async function POST(request: NextRequest) {
  if (!RESTAURANT_ID) {
    return serviceUnavailable("RESTAURANT_ID environment variable is not set");
  }

  try {
    const raw     = await request.json();
    const body    = CheckoutBodySchema.parse(raw);
    const session = await auth();
    const userId  = session?.user?.id ?? null;

    const result = await createOrder(RESTAURANT_ID, userId, body);

    if ("error" in result) {
      const { NextResponse } = await import("next/server");
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return created({
      orderId:     result.orderId,
      orderNumber: result.orderNumber,
      totalCents:  result.totalCents,
      total:       result.totalCents / 100,
      status:      result.status,
    });
  } catch (err) {
    if (err instanceof ZodError) return zodError(err);
    return serverError(err);
  }
}
