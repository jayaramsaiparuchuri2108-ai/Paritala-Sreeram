import { fail, json, requireAdmin } from "@/lib/auth/guard";
import { adminList, createDoc } from "@/lib/database/content";
import { collectionSchemas, isCollectionName, postProcess } from "@/lib/validation/schemas";

type Ctx = { params: Promise<{ collection: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;
  const { collection } = await ctx.params;
  if (!isCollectionName(collection)) return fail("Unknown collection", 404);
  return json({ items: await adminList(collection) });
}

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;
  const { collection } = await ctx.params;
  if (!isCollectionName(collection)) return fail("Unknown collection", 404);

  const parsed = collectionSchemas[collection].safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Validation failed", 422, { issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) });
  const doc = await createDoc(collection, postProcess(collection, parsed.data as Record<string, unknown>));
  return json({ item: doc }, 201);
}
