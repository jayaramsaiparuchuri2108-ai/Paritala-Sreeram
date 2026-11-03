import { fail, json, requireAdmin } from "@/lib/auth/guard";
import { reorderDocs } from "@/lib/database/content";
import { isCollectionName, reorderSchema } from "@/lib/validation/schemas";

export async function POST(req: Request, ctx: { params: Promise<{ collection: string }> }) {
  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;
  const { collection } = await ctx.params;
  if (!isCollectionName(collection)) return fail("Unknown collection", 404);

  const parsed = reorderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Validation failed", 422);
  await reorderDocs(collection, parsed.data.ids);
  return json({ ok: true });
}
