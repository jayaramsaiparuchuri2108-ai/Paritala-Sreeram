import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/auth/rate-limit";
import { getSession, verifyCsrf, type AdminSession } from "@/lib/auth/session";
import { isStoreAvailable } from "@/lib/database/store";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function fail(message: string, status: number, extra?: Record<string, unknown>) {
  return json({ error: message, ...extra }, status);
}

export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * Server-side authorization for every admin API call.
 * - valid signed cookie + live server-side session
 * - for state-changing methods: same-origin check + CSRF token header
 * - per-admin rate limit
 * Usage: const auth = await requireAdmin(req); if (auth instanceof Response) return auth;
 */
export async function requireAdmin(req: Request): Promise<AdminSession | Response> {
  if (!isStoreAvailable()) return fail("Database is not configured.", 503);
  const session = await getSession();
  if (!session) return fail("Unauthorized", 401);

  const mutating = !["GET", "HEAD", "OPTIONS"].includes(req.method);
  if (mutating) {
    if (!sameOrigin(req)) return fail("Forbidden (origin)", 403);
    if (!verifyCsrf(session, req.headers.get("x-csrf-token"))) return fail("Forbidden (csrf)", 403);
  }
  const ok = await rateLimit(`admin:${session.id}:${mutating ? "w" : "r"}`, mutating ? 120 : 600, 60);
  if (!ok) return fail("Too many requests", 429);
  return session;
}

export { clientIp };
