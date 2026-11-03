import { ArrowUpRight } from "lucide-react";
import { PhotoGallery } from "@/components/gallery/PhotoGallery";
import { PageHero } from "@/components/shared/PageHero";
import { getSettings, publicList } from "@/lib/database/content";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";
import { pageMetadata } from "@/lib/seo";
import type { GalleryPhoto } from "@/types";

export async function generateMetadata() {
  return pageMetadata({ path: "/gallery", navKey: "gallery" });
}

export default async function GalleryPage({ searchParams }: { searchParams: Promise<{ photo?: string }> }) {
  const { photo } = await searchParams;
  const t = getDict(await getLang());
  const [photos, settings] = await Promise.all([publicList<GalleryPhoto>("gallery"), getSettings()]);
  const instagram = settings.social.instagram;
  return (
    <>
      <PageHero title={t.gallery.title} lead={t.gallery.lead} eyebrow={t.gallery.eyebrow} />
      <section className="container-x py-14 md:py-20">
        <PhotoGallery photos={photos} initialId={typeof photo === "string" ? photo : undefined} />
        {instagram && (
          <p className="mt-16 border-t border-ink/15 pt-8 text-sm">
            <a href={instagram} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2 font-semibold">
              <span className="link-line">{t.gallery.followInstagram}</span>
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
            </a>
          </p>
        )}
      </section>
    </>
  );
}
