import { getStore } from "@/lib/database/store";

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
}

/** Fixed-window limiter. Returns true when the request is allowed. */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  try {
    const count = await getStore().incr(key, windowSeconds);
    return count <= limit;
  } catch (error) {
    // If the limiter backend is down, fail closed for safety on auth endpoints.
    console.error("[rate-limit] backend error", error);
    return false;
  }
}
