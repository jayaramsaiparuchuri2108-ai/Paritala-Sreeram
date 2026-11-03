import { PageHero } from "@/components/shared/PageHero";
import { VideoGrid } from "@/components/videos/VideoGrid";
import { publicList } from "@/lib/database/content";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";
import { pageMetadata } from "@/lib/seo";
import type { VideoEntry } from "@/types";

export async function generateMetadata() {
  return pageMetadata({ path: "/videos", navKey: "videos" });
}

export default async function VideosPage() {
  const t = getDict(await getLang());
  const videos = await publicList<VideoEntry>("videos");
  return (
    <>
      <PageHero title={t.videos.title} lead={t.videos.lead} />
      <section className="container-x py-16 md:py-24">
        <VideoGrid videos={videos} />
      </section>
    </>
  );
}
