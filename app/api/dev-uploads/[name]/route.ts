import fs from "node:fs/promises";
import path from "node:path";
import { DEV_UPLOAD_NAME } from "@/lib/storage/images";

// Serves locally stored uploads during development only. Disabled in production (Vercel Blob is used there).
export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  const { name } = await ctx.params;
  if (!DEV_UPLOAD_NAME.test(name)) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(path.join(process.cwd(), ".data", "uploads", name));
    const type = name.endsWith(".png") ? "image/png" : name.endsWith(".webp") ? "image/webp" : "image/jpeg";
    return new Response(new Uint8Array(data), { headers: { "Content-Type": type, "Cache-Control": "public, max-age=3600" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
