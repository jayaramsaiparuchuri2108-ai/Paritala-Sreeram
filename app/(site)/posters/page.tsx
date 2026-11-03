import { PageHero } from "@/components/shared/PageHero";
import { PosterExplorer } from "@/components/posters/PosterExplorer";
import { publicList } from "@/lib/database/content";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";
import { pageMetadata } from "@/lib/seo";
import type { Poster, PosterCategory } from "@/types";

export async function generateMetadata() {
  return pageMetadata({ path: "/posters", navKey: "posters" });
}

export default async function PostersPage() {
  const t = getDict(await getLang());
  const [posters, categories] = await Promise.all([publicList<Poster>("posters"), publicList<PosterCategory>("posterCategories")]);
  return (
    <>
      <PageHero title={t.posters.title} lead={t.posters.lead} />
      <section className="container-x py-16 md:py-24">
        <PosterExplorer posters={posters} categories={categories} />
      </section>
    </>
  );
}
