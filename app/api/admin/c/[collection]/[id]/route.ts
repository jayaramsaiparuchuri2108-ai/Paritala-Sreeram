import { fail, json, requireAdmin } from "@/lib/auth/guard";
import { adminList, isImageInUse, removeDoc, updateDoc } from "@/lib/database/content";
import { deleteImage } from "@/lib/storage/images";
import { collectionSchemas, isCollectionName, postProcess } from "@/lib/validation/schemas";

type Ctx = { params: Promise<{ collection: string; id: string }> };

const IMAGE_COLLECTIONS = ["posters", "gallery", "activities"];

export async function PUT(req: Request, ctx: Ctx) {
  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;
  const { collection, id } = await ctx.params;
  if (!isCollectionName(collection)) return fail("Unknown collection", 404);

  const parsed = collectionSchemas[collection].safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Validation failed", 422, { issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) });

  const before = IMAGE_COLLECTIONS.includes(collection)
    ? ((await adminList<{ id: string; image?: string }>(collection)).find((d) => d.id === id) ?? null)
    : null;
  const doc = await updateDoc(collection, id, postProcess(collection, parsed.data as Record<string, unknown>));
  if (!doc) return fail("Not found", 404);
  const newImage = (doc as { image?: string }).image;
  if (before?.image && before.image !== newImage && !(await isImageInUse(before.image))) await deleteImage(before.image);
  return json({ item: doc });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;
  const { collection, id } = await ctx.params;
  if (!isCollectionName(collection)) return fail("Unknown collection", 404);

  const removed = await removeDoc(collection, id);
  if (!removed) return fail("Not found", 404);
  const image = (removed as { image?: string }).image;
  if (IMAGE_COLLECTIONS.includes(collection) && image && !(await isImageInUse(image))) await deleteImage(image);
  return json({ ok: true });
}
