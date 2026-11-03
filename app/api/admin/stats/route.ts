import { json, requireAdmin } from "@/lib/auth/guard";
import { adminList } from "@/lib/database/content";
import { COLLECTION_NAMES } from "@/lib/validation/schemas";
import type { GalleryPhoto, Poster, PosterCategory } from "@/types";

type Stamped = { id: string; title?: unknown; published?: boolean; createdAt?: string; updatedAt?: string };

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  const counts: Record<string, { total: number; published: number }> = {};
  const recent: { collection: string; id: string; title: unknown; published: boolean; at: string; created: boolean }[] = [];
  for (const name of COLLECTION_NAMES) {
    const items = await adminList<Stamped>(name);
    counts[name] = { total: items.length, published: items.filter((i) => i.published).length };
    // Only items edited since the stamps were introduced carry a time — nothing is back-dated or invented.
    for (const i of items) {
      const at = i.updatedAt ?? i.createdAt;
      if (at && name !== "posterTemplates") recent.push({ collection: name, id: i.id, title: i.title, published: Boolean(i.published), at, created: i.updatedAt === i.createdAt });
    }
  }
  recent.sort((a, b) => b.at.localeCompare(a.at));

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

  const photos = await adminList<GalleryPhoto>("gallery");
  const live = (p: GalleryPhoto) => p.published && p.permission === "authorised";
  const card = (p: GalleryPhoto) => ({ id: p.id, title: p.title, image: p.image, category: p.category, published: p.published, permission: p.permission, at: p.updatedAt ?? p.createdAt ?? null });
  const gallery = {
    total: photos.length,
    live: photos.filter(live).length,
    drafts: photos.filter((p) => !p.published).length,
    awaitingPermission: photos.filter((p) => p.permission !== "authorised").length,
    // Published but held back because permission is not authorised yet.
    held: photos.filter((p) => p.published && p.permission !== "authorised").length,
    featured: photos.filter((p) => p.featured).length,
    byCategory: Object.entries(
      photos.reduce<Record<string, number>>((acc, p) => {
        acc[p.category] = (acc[p.category] ?? 0) + 1;
        return acc;
      }, {}),
    ).map(([category, count]) => ({ category, count })),
    // Newest uploads first; photographs that predate upload timestamps follow in gallery order.
    recent: [
      ...photos.filter((p) => p.createdAt).sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")),
      ...photos.filter((p) => !p.createdAt),
    ]
      .slice(0, 8)
      .map(card),
    pending: photos.filter((p) => p.permission !== "authorised").slice(0, 8).map(card),
  };

  return json({ counts, postersByCategory, topPosters, totalDownloads, gallery, recent: recent.slice(0, 10) });
}
