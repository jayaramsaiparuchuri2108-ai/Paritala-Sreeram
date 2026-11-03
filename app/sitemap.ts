import type { MetadataRoute } from "next";
import { publicList } from "@/lib/database/content";
import { absoluteUrl } from "@/lib/site-url";
import type { Poster } from "@/types";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const routes = ["/", "/about", "/activities", "/posters", "/gallery", "/videos", "/contact", "/sources"];
  const posters = await publicList<Poster>("posters");
  return [
    ...routes.map((r) => ({
      url: absoluteUrl(r),
      lastModified: now,
      changeFrequency: (r === "/" ? "weekly" : "monthly") as "weekly" | "monthly",
      priority: r === "/" ? 1 : 0.7,
    })),
    ...posters.map((p) => ({
      url: absoluteUrl(`/posters/${p.id}`),
      lastModified: new Date(p.createdAt),
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
  ];
}
