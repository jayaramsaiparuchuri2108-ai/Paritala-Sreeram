import { fail, json, requireAdmin } from "@/lib/auth/guard";
import { destroySession } from "@/lib/auth/session";

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;
  await destroySession();
  return json({ ok: true });
}

export async function GET() {
  return fail("Method not allowed", 405);
}
