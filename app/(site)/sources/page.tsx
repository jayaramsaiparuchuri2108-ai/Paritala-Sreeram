import { ExternalLink } from "lucide-react";
import { Reveal } from "@/components/animations/Reveal";
import { PageHero } from "@/components/shared/PageHero";
import { sources } from "@/data/sources";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const t = getDict(await getLang());
  return pageMetadata({ path: "/sources", title: t.sources.title });
}

export default async function SourcesPage() {
  const t = getDict(await getLang());
  return (
    <>
      <PageHero title={t.sources.title} lead={t.sources.lead} />
      <section className="container-x py-16 md:py-24">
        <ul className="grid gap-4 md:grid-cols-2">
          {sources.map((s, i) => (
            <Reveal as="li" key={s.id} delay={(i % 2) * 0.06}>
              <div className="h-full rounded-2xl border-2 border-ink bg-white p-5">
                <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone">
                  <span className="rounded bg-brand px-2 py-0.5 text-ink">{s.id}</span> {s.publisher}
                </p>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-2 text-lg font-extrabold leading-snug hover:underline">
                  {s.title} <ExternalLink className="mt-1.5 h-4 w-4 shrink-0" />
                </a>
                <p className="mt-2 text-sm text-stone">
                  {t.sources.published}: {s.published} · {t.sources.accessed}: {s.accessed}
                </p>
                {s.note && <p className="mt-2 text-sm text-ink/75">{s.note}</p>}
              </div>
            </Reveal>
          ))}
        </ul>
        <p className="mt-10 rounded-2xl border-2 border-dashed border-ink bg-cream p-5 text-sm">{t.sources.note}</p>
      </section>
    </>
  );
}
