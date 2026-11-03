import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";
// Relative import with extension: unit tests load this file directly with Node's type stripping (no path aliases).
import { getStore } from "../database/store.ts";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
/** Guards the image optimiser against decompression bombs. */
export const MAX_IMAGE_SIDE = 12000;
export const MAX_IMAGE_PIXELS = 100_000_000;
export const UPLOAD_FOLDERS = ["posters", "gallery", "site", "editor"] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

const EXT: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

export class UploadError extends Error {}

export interface SavedImage {
  url: string;
  contentType: string;
  size: number;
  width: number;
  height: number;
  /** True when identical bytes were uploaded before and the existing file was reused. */
  duplicate: boolean;
}

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

/** Reads the pixel size from the file header (no image library needed). Returns null if it cannot be determined. */
export function readImageSize(b: Uint8Array, type: string): { width: number; height: number } | null {
  try {
    if (type === "image/png") {
      if (b.length < 24) return null;
      const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
      return { width: dv.getUint32(16), height: dv.getUint32(20) };
    }
    if (type === "image/webp") {
      const kind = String.fromCharCode(...b.slice(12, 16));
      if (kind === "VP8X" && b.length >= 30) {
        return { width: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)), height: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)) };
      }
      if (kind === "VP8 " && b.length >= 30) {
        return { width: (b[26] | (b[27] << 8)) & 0x3fff, height: (b[28] | (b[29] << 8)) & 0x3fff };
      }
      if (kind === "VP8L" && b.length >= 25) {
        return {
          width: 1 + (((b[22] & 0x3f) << 8) | b[21]),
          height: 1 + (((b[24] & 0x0f) << 10) | (b[23] << 2) | ((b[22] & 0xc0) >> 6)),
        };
      }
      return null;
    }
    if (type === "image/jpeg") {
      let i = 2;
      while (i + 9 < b.length) {
        if (b[i] !== 0xff) {
          i++;
          continue;
        }
        const marker = b[i + 1];
        if (marker === 0xff) {
          i++;
          continue;
        }
        const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
        if (isSof) return { height: (b[i + 5] << 8) | b[i + 6], width: (b[i + 7] << 8) | b[i + 8] };
        i += 2 + ((b[i + 2] << 8) | b[i + 3]);
      }
    }
  } catch {
    return null;
  }
  return null;
}

/** Lower-case ascii slug used in stored filenames, e.g. "Public Meeting 2024.JPG" -> "public-meeting-2024". */
export function slugifyName(input: string, max = 60): string {
  const base = input.replace(/\.[a-z0-9]{2,5}$/i, "");
  return (
    base
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, max)
      .replace(/-$/, "") || "photo"
  );
}

const HASH_IN_NAME = /-([0-9a-f]{16})\.(jpg|png|webp)$/;
const dupKey = (hash: string) => `imghash:${hash}`;

interface SaveOptions {
  /** Sub-folder (gallery category) used to organise stored files. */
  category?: string;
  /** Descriptive base name; defaults to the uploaded file's name. */
  name?: string;
}

export async function saveImage(file: File, folder: UploadFolder, options: SaveOptions = {}): Promise<SavedImage> {
  if (!file || file.size === 0) throw new UploadError("No file received.");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("File is larger than 8 MB.");
  if (!EXT[file.type]) throw new UploadError("Only JPG, PNG or WebP images are allowed.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const real = sniffImageType(bytes);
  if (!real || real !== file.type) throw new UploadError("The file content does not match an allowed image type.");

  const size = readImageSize(bytes, real);
  if (!size || size.width < 1 || size.height < 1) throw new UploadError("Could not read the image dimensions.");
  if (size.width > MAX_IMAGE_SIDE || size.height > MAX_IMAGE_SIDE || size.width * size.height > MAX_IMAGE_PIXELS) {
    throw new UploadError("Image dimensions are too large (maximum 12000 px on a side).");
  }

  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  const meta = { contentType: real, size: file.size, width: size.width, height: size.height };

  // Identical bytes uploaded before -> reuse the stored file instead of storing a second copy.
  try {
    const known = await getStore().kvGet<{ url: string }>(dupKey(hash));
    if (known?.url && (await stillExists(known.url))) return { ...meta, url: known.url, duplicate: true };
  } catch {
    /* duplicate detection is best-effort */
  }

  const slug = slugifyName(options.name || file.name);
  const category = options.category ? slugifyName(options.category, 40) : "";
  const filename = `${slug}-${hash}${EXT[real]}`;

  let url: string;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const key = [folder, category, filename].filter(Boolean).join("/");
    const blob = await put(key, Buffer.from(bytes), { access: "public", contentType: real, addRandomSuffix: false, allowOverwrite: true });
    url = blob.url;
  } else {
    if (process.env.NODE_ENV === "production") throw new UploadError("Image storage is not configured (BLOB_READ_WRITE_TOKEN).");
    const dir = path.join(process.cwd(), ".data", "uploads");
    await fs.mkdir(dir, { recursive: true });
    const localName = [category, filename].filter(Boolean).join("-");
    await fs.writeFile(path.join(dir, localName), bytes);
    url = `/api/dev-uploads/${localName}`;
  }

  try {
    await getStore().kvSet(dupKey(hash), { url });
  } catch {
    /* best-effort */
  }
  return { ...meta, url, duplicate: false };
}

async function stillExists(url: string): Promise<boolean> {
  if (url.startsWith("/api/dev-uploads/")) {
    try {
      await fs.access(path.join(process.cwd(), ".data", "uploads", path.basename(url)));
      return true;
    } catch {
      return false;
    }
  }
  return true; // Blob URLs are cleaned from the index when the file is deleted.
}

/** Best-effort removal of a stored file when its record is deleted. */
export async function deleteImage(url: string | undefined): Promise<void> {
  if (!url) return;
  try {
    const hash = HASH_IN_NAME.exec(url)?.[1];
    if (url.startsWith("/api/dev-uploads/")) {
      const name = path.basename(url);
      await fs.rm(path.join(process.cwd(), ".data", "uploads", name), { force: true });
    } else if (process.env.BLOB_READ_WRITE_TOKEN && url.includes(".public.blob.vercel-storage.com")) {
      await del(url);
    } else {
      return; // bundled assets under /images are never deleted
    }
    if (hash) await getStore().kvDel(dupKey(hash));
  } catch (error) {
    console.error("[storage] delete failed", error);
  }
}

export const DEV_UPLOAD_NAME = /^[a-z0-9][a-z0-9-]{0,140}\.(jpg|png|webp)$/;
