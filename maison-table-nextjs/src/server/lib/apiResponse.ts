/**
 * Consistent API response helpers.
 *
 * Rules:
 * - Never include stack traces or internal error messages in production responses.
 * - Use specific HTTP status codes.
 * - All error bodies have the shape { error: string, details?: unknown }
 */
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

export function unprocessable(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 422 });
}

export function serviceUnavailable(message: string) {
  return NextResponse.json({ error: message }, { status: 503 });
}

export function serverError(err: unknown) {
  const isDev = process.env.NODE_ENV !== "production";
  console.error("[API Error]", err);
  return NextResponse.json(
    {
      error:   "An internal server error occurred.",
      details: isDev && err instanceof Error ? err.message : undefined,
    },
    { status: 500 },
  );
}

/** Parse a Zod error into a 400 response with field-level details. */
export function zodError(err: ZodError) {
  const details = err.issues.map((i) => ({
    path:    i.path.join("."),
    message: i.message,
  }));
  return NextResponse.json({ error: "Validation failed", details }, { status: 400 });
}
