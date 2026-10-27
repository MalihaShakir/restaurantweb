/**
 * Server-side authorization helpers for Route Handlers.
 * Never import these in "use client" components.
 */
import { NextResponse } from "next/server";
import { auth } from "@/server/lib/auth";

// Explicit shape of our augmented session user (from jwt/session callbacks).
export interface AppUser {
  id:           string;
  email:        string | null | undefined;
  name:         string | null | undefined;
  role:         string;
  restaurantId: string | null;
}

export interface AppSession {
  user: AppUser;
}

type AuthedResult     = { session: AppSession };
type StaffAuthResult  = AuthedResult & { restaurantId: string };

function toUnauthorized(msg = "Unauthorized") {
  return NextResponse.json({ error: msg }, { status: 401 });
}
function toForbidden(msg: string) {
  return NextResponse.json({ error: msg }, { status: 403 });
}

/** Any authenticated user. */
export async function requireSession(): Promise<AuthedResult | NextResponse> {
  const raw = await auth();
  if (!raw?.user) return toUnauthorized();
  // Cast to our augmented type — the jwt/session callbacks populate these fields.
  const session: AppSession = {
    user: raw.user as AppUser,
  };
  return { session };
}

/** Staff, admin, rider, or superadmin — returns restaurantId as a convenience. */
export async function requireStaff(): Promise<StaffAuthResult | NextResponse> {
  const result = await requireSession();
  if (result instanceof NextResponse) return result;

  const { user } = result.session;

  if (!["staff", "admin", "superadmin", "rider"].includes(user.role)) {
    return toForbidden("Forbidden — staff access required");
  }
  if (!user.restaurantId && user.role !== "superadmin") {
    return toForbidden("Forbidden — no restaurant assigned to this account");
  }

  return { session: result.session, restaurantId: user.restaurantId! };
}

/** Rider, staff, admin, or superadmin — for delivery-related endpoints. */
export async function requireRider(): Promise<StaffAuthResult | NextResponse> {
  return requireStaff(); // riders are a subset of staff-level access
}

/** Admin or superadmin only. */
export async function requireAdmin(): Promise<StaffAuthResult | NextResponse> {
  const result = await requireSession();
  if (result instanceof NextResponse) return result;

  const { user } = result.session;

  if (!["admin", "superadmin"].includes(user.role)) {
    return toForbidden("Forbidden — admin access required");
  }
  if (!user.restaurantId && user.role !== "superadmin") {
    return toForbidden("Forbidden — no restaurant assigned to this account");
  }

  return { session: result.session, restaurantId: user.restaurantId! };
}
