import { InstagramGrid } from "@/components/gallery/InstagramGrid";
import { PhotoGallery } from "@/components/gallery/PhotoGallery";
import { PageHero } from "@/components/shared/PageHero";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { publicList } from "@/lib/database/content";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";
import { pageMetadata } from "@/lib/seo";
import type { GalleryPhoto, InstagramPost } from "@/types";

export async function generateMetadata() {
  return pageMetadata({ path: "/gallery", navKey: "gallery" });
}

export default async function GalleryPage() {
  const t = getDict(await getLang());
  const [instagram, photos] = await Promise.all([publicList<InstagramPost>("instagram"), publicList<GalleryPhoto>("gallery")]);
  return (
    <>
      <PageHero title={t.gallery.title} lead={t.gallery.lead} />
      <section className="container-x py-16 md:py-24">
        <SectionHeading eyebrow={t.gallery.instagram} title={t.gallery.instagram} />
        <InstagramGrid posts={instagram} />
      </section>
      <section className="container-x pb-16 md:pb-24">
        <SectionHeading eyebrow={t.gallery.photos} title={t.gallery.photos} />
        <PhotoGallery photos={photos} />
      </section>
    </>
  );
}
