import { json, requireAdmin } from "@/lib/auth/guard";
import { adminList } from "@/lib/database/content";
import { COLLECTION_NAMES } from "@/lib/validation/schemas";
import type { Poster, PosterCategory } from "@/types";

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  const counts: Record<string, { total: number; published: number }> = {};
  for (const name of COLLECTION_NAMES) {
    const items = await adminList<{ published: boolean }>(name);
    counts[name] = { total: items.length, published: items.filter((i) => i.published).length };
  }
  const posters = await adminList<Poster>("posters");
  const categories = await adminList<PosterCategory>("posterCategories");
  const postersByCategory = categories.map((c) => ({
    id: c.id,
    name: c.name,
    count: posters.filter((p) => p.category === c.id).length,
  }));
  const topPosters = [...posters]
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, 5)
    .map((p) => ({ id: p.id, title: p.title, downloads: p.downloads }));
  const totalDownloads = posters.reduce((n, p) => n + p.downloads, 0);

  return json({ counts, postersByCategory, topPosters, totalDownloads });
}
