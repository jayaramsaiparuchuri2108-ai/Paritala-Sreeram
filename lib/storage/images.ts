import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const UPLOAD_FOLDERS = ["posters", "gallery", "site", "editor"] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

const EXT: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

export class UploadError extends Error {}

/** Identify the real image type from magic bytes - the browser-supplied MIME type is never trusted alone. */
export function sniffImageType(b: Uint8Array): string | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return "image/png";
  if (
    b.length > 12 &&
    String.fromCharCode(...b.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...b.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export async function saveImage(file: File, folder: UploadFolder): Promise<{ url: string; contentType: string; size: number }> {
  if (!file || file.size === 0) throw new UploadError("No file received.");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("File is larger than 8 MB.");
  if (!EXT[file.type]) throw new UploadError("Only JPG, PNG or WebP images are allowed.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const real = sniffImageType(bytes);
  if (!real || real !== file.type) throw new UploadError("The file content does not match an allowed image type.");

  const name = `${randomUUID()}${EXT[real]}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`${folder}/${name}`, Buffer.from(bytes), {
      access: "public",
      contentType: real,
      addRandomSuffix: false,
    });
    return { url: blob.url, contentType: real, size: file.size };
  }

  if (process.env.NODE_ENV === "production") {
    throw new UploadError("Image storage is not configured (BLOB_READ_WRITE_TOKEN).");
  }
  const dir = path.join(process.cwd(), ".data", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), bytes);
  return { url: `/api/dev-uploads/${name}`, contentType: real, size: file.size };
}

/** Best-effort removal of a stored file when its record is deleted. */
export async function deleteImage(url: string | undefined): Promise<void> {
  if (!url) return;
  try {
    if (url.startsWith("/api/dev-uploads/")) {
      const name = path.basename(url);
      await fs.rm(path.join(process.cwd(), ".data", "uploads", name), { force: true });
    } else if (process.env.BLOB_READ_WRITE_TOKEN && url.includes(".public.blob.vercel-storage.com")) {
      await del(url);
    }
  } catch (error) {
    console.error("[storage] delete failed", error);
  }
}

export const DEV_UPLOAD_NAME = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;
