import { fail, json, requireAdmin } from "@/lib/auth/guard";
import { rateLimit } from "@/lib/auth/rate-limit";
import { saveImage, UploadError, UPLOAD_FOLDERS, type UploadFolder } from "@/lib/storage/images";
import { GALLERY_CATEGORIES } from "@/types";

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;
  if (!(await rateLimit(`upload:${auth.id}`, 120, 60))) return fail("Too many uploads", 429);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("Invalid form data", 400);
  }
  const file = form.get("file");
  const folder = String(form.get("folder") ?? "gallery");
  const category = String(form.get("category") ?? "");
  const name = String(form.get("name") ?? "").slice(0, 120);
  if (!(file instanceof File)) return fail("No file received", 400);
  if (!(UPLOAD_FOLDERS as readonly string[]).includes(folder)) return fail("Invalid folder", 400);
  if (category && !(GALLERY_CATEGORIES as readonly string[]).includes(category)) return fail("Invalid category", 400);

  try {
    const saved = await saveImage(file, folder as UploadFolder, { category: category || undefined, name: name || undefined });
    return json(saved, 201);
  } catch (error) {
    if (error instanceof UploadError) return fail(error.message, 400);
    console.error("[upload] failed", error);
    return fail("Upload failed", 500);
  }
}
