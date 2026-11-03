import type { Metadata } from "next";
import { getSettings } from "@/lib/database/content";
import { getDict, pick } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";
import { absoluteUrl } from "@/lib/site-url";
import type { Dict } from "@/data/translations/en";

type NavKey = keyof Dict["nav"];

/** Page metadata in the visitor's language, with canonical URL and Open Graph/Twitter cards. */
export async function pageMetadata(opts: {
  path: string;
  navKey?: NavKey;
  title?: string;
  description?: string;
  image?: string;
}): Promise<Metadata> {
  const lang = await getLang();
  const t = getDict(lang);
  const settings = await getSettings();
  const title = opts.title ?? (opts.navKey ? t.nav[opts.navKey] : pick(settings.seo.title, lang));
  const description = opts.description ?? pick(settings.seo.description, lang);
  const image = opts.image ?? (settings.seo.ogImage || undefined);
  const url = absoluteUrl(opts.path);
  return {
    // The home page uses the full SEO title as-is; other pages get the "· Site name" suffix from the root template.
    title: opts.path === "/" ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", images: image ? [{ url: image }] : undefined },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
  };
}

/** Safe JSON-LD serialisation (prevents </script> injection). */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
