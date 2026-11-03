import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PosterActions } from "@/components/posters/PosterActions";
import { PosterCard } from "@/components/posters/PosterExplorer";
import { publicGet, publicList } from "@/lib/database/content";
import { formatDate, getDict, pick } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";
import { pageMetadata } from "@/lib/seo";
import type { Poster, PosterCategory } from "@/types";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const poster = await publicGet<Poster>("posters", id);
  if (!poster) return {};
  const lang = await getLang();
  return pageMetadata({ path: `/posters/${id}`, title: pick(poster.title, lang), image: poster.image });
}

export default async function PosterPage({ params }: Props) {
  const { id } = await params;
  const lang = await getLang();
  const t = getDict(lang);
  const [poster, all, categories] = await Promise.all([
    publicGet<Poster>("posters", id),
    publicList<Poster>("posters"),
    publicList<PosterCategory>("posterCategories"),
  ]);
  if (!poster) notFound();
  const category = categories.find((c) => c.id === poster.category);
  const related = all.filter((p) => p.id !== poster.id && p.category === poster.category).slice(0, 4);
  const title = pick(poster.title, lang);

  return (
    <section className="container-x pb-20 pt-10 md:pt-14">
      <Link href="/posters" className="link-line mb-8 inline-flex items-center gap-2 text-sm font-semibold">
        <ArrowLeft className="h-4 w-4" aria-hidden /> {t.nav.posters}
      </Link>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,520px)_1fr]">
        <div className="relative aspect-[4/5] overflow-hidden bg-ink shadow-[14px_14px_0_0_#ffd600]">
          <Image src={poster.image} alt={pick(poster.alt, lang) || title} fill priority sizes="(max-width: 1024px) 100vw, 520px" className="object-cover" />
        </div>
        <div className="flex flex-col gap-6">
          {category && <p className="eyebrow text-stone">{pick(category.name, lang)}</p>}
          <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">{title}</h1>
          <p className="text-sm text-stone">
            {t.posters.created}: {formatDate(poster.createdAt, lang)} · {poster.downloads} {t.posters.downloads}
          </p>
          <PosterActions id={poster.id} title={title} />
        </div>
      </div>
      {related.length > 0 && (
        <div className="mt-20">
          <h2 className="mb-6 font-display text-3xl font-bold">{t.posters.related}</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {related.map((p) => (
              <PosterCard key={p.id} poster={p} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
