import fs from "node:fs/promises";
import path from "node:path";
import { rateLimit, clientIp } from "@/lib/auth/rate-limit";
import { incrementPosterDownloads, publicGet } from "@/lib/database/content";
import { isAllowedAssetUrl } from "@/lib/validation/urls";
import type { Poster } from "@/types";

// Streams the poster as an attachment (the `download` attribute is ignored for cross-origin Blob URLs).
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!(await rateLimit(`dl:${clientIp(req)}`, 60, 60))) return new Response("Too many requests", { status: 429 });

  const poster = await publicGet<Poster>("posters", id);
  if (!poster || !isAllowedAssetUrl(poster.image)) return new Response("Not found", { status: 404 });

  let data: Uint8Array;
  let type = "image/png";
  if (poster.image.startsWith("/api/dev-uploads/")) {
    const file = path.basename(poster.image);
    data = new Uint8Array(await fs.readFile(path.join(process.cwd(), ".data", "uploads", file)));
    type = file.endsWith(".jpg") ? "image/jpeg" : file.endsWith(".webp") ? "image/webp" : "image/png";
  } else if (poster.image.startsWith("/")) {
    return Response.redirect(new URL(poster.image, req.url), 302);
  } else {
    const upstream = await fetch(poster.image);
    if (!upstream.ok) return new Response("Not found", { status: 404 });
    type = upstream.headers.get("content-type") ?? type;
    data = new Uint8Array(await upstream.arrayBuffer());
  }

  void incrementPosterDownloads(id);
  const ext = type.includes("jpeg") ? "jpg" : type.includes("webp") ? "webp" : "png";
  return new Response(data as BodyInit, {
    headers: {
      "Content-Type": type,
      "Content-Disposition": `attachment; filename="paritala-sreeram-poster-${id}.${ext}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
