import { fail, json, sameOrigin } from "@/lib/auth/guard";
import { DUMMY_HASH, verifyPassword } from "@/lib/auth/password";
import { clientIp, rateLimit } from "@/lib/auth/rate-limit";
import { createSession } from "@/lib/auth/session";
import { getStore, isStoreAvailable } from "@/lib/database/store";
import { loginSchema } from "@/lib/validation/schemas";

export async function POST(req: Request) {
  if (!isStoreAvailable()) return fail("Database is not configured.", 503);

  // Same-origin only (cookies are SameSite=Strict as well).
  if (!sameOrigin(req)) return fail("Forbidden", 403);

  const ip = clientIp(req);
  if (!(await rateLimit(`login:ip:${ip}`, 20, 15 * 60))) return fail("Too many attempts", 429);

  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Invalid credentials", 401);
  const { email, password } = parsed.data;

  if (!(await rateLimit(`login:acct:${email}`, 8, 15 * 60))) return fail("Too many attempts", 429);

  const user = (await getStore().get("users", email)) as { passwordHash?: string } | null;
  // Always run a hash comparison so response time does not reveal whether the account exists.
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return fail("Invalid credentials", 401);

  await createSession(email);
  return json({ ok: true });
}
