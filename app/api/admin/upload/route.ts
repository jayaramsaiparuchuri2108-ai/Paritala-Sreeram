import { fail, json, requireAdmin } from "@/lib/auth/guard";
import { rateLimit } from "@/lib/auth/rate-limit";
import { saveImage, UploadError, UPLOAD_FOLDERS, type UploadFolder } from "@/lib/storage/images";

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;
  if (!(await rateLimit(`upload:${auth.id}`, 40, 60))) return fail("Too many uploads", 429);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("Invalid form data", 400);
  }
  const file = form.get("file");
  const folder = String(form.get("folder") ?? "gallery");
  if (!(file instanceof File)) return fail("No file received", 400);
  if (!(UPLOAD_FOLDERS as readonly string[]).includes(folder)) return fail("Invalid folder", 400);

  try {
    const saved = await saveImage(file, folder as UploadFolder);
    return json({ url: saved.url, size: saved.size, contentType: saved.contentType }, 201);
  } catch (error) {
    if (error instanceof UploadError) return fail(error.message, 400);
    console.error("[upload] failed", error);
    return fail("Upload failed", 500);
  }
}
