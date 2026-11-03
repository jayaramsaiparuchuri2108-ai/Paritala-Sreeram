import fs from "node:fs/promises";
import path from "node:path";
import { publicGet } from "@/lib/database/content";
import { DEV_UPLOAD_NAME, slugifyName } from "@/lib/storage/images";
import { isAllowedAssetUrl } from "@/lib/validation/urls";
import type { GalleryPhoto } from "@/types";

const TYPES: Record<string, string> = { ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

async function loadBytes(url: string): Promise<Buffer | null> {
  if (url.startsWith("/api/dev-uploads/")) {
    const name = path.basename(url);
    if (!DEV_UPLOAD_NAME.test(name)) return null;
    return fs.readFile(path.join(process.cwd(), ".data", "uploads", name));
  }
  if (url.startsWith("/images/")) {
    const root = path.join(process.cwd(), "public", "images");
    const file = path.resolve(process.cwd(), "public", url.slice(1));
    if (!file.startsWith(root + path.sep)) return null;
    return fs.readFile(file);
  }
  const res = await fetch(url); // already restricted to our Blob host by isAllowedAssetUrl
  return res.ok ? Buffer.from(await res.arrayBuffer()) : null;
}

/** Public download - only for published, authorised photographs the admin has marked as downloadable. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const photo = await publicGet<GalleryPhoto>("gallery", id);
  if (!photo || !photo.allowDownload || !isAllowedAssetUrl(photo.image)) return new Response("Not found", { status: 404 });

  try {
    const bytes = await loadBytes(photo.image);
    if (!bytes) return new Response("Not found", { status: 404 });
    const ext = path.extname(new URL(photo.image, "http://x").pathname).toLowerCase() || ".jpg";
    const filename = `${slugifyName(photo.title.en || photo.title.te || "paritala-sreeram-photo")}${ext}`;
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": TYPES[ext] ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
