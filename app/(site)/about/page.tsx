import Image from "next/image";
import { Reveal } from "@/components/animations/Reveal";
import { Timeline } from "@/components/about/Timeline";
import { PageHero } from "@/components/shared/PageHero";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { SourceChips } from "@/components/shared/SourceChips";
import { getSettings, publicList } from "@/lib/database/content";
import { getDict, pick } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";
import { photoFor, ratioOf } from "@/lib/photos";
import { pageMetadata } from "@/lib/seo";
import type { BioSection, ElectoralRow, GalleryPhoto, TimelineEvent } from "@/types";

export async function generateMetadata() {
  return pageMetadata({ path: "/about", navKey: "about" });
}

export default async function AboutPage() {
  const lang = await getLang();
  const t = getDict(lang);
  const [bio, timeline, electoral, photos, settings] = await Promise.all([
    publicList<BioSection>("bio"),
    publicList<TimelineEvent>("timeline"),
    publicList<ElectoralRow>("electoral"),
    publicList<GalleryPhoto>("gallery"),
    getSettings(),
  ]);
  const portrait = photoFor(photos, ["portraits"]);

  return (
    <>
      <PageHero title={t.about.title} lead={t.about.lead} eyebrow={t.brand.name} />

      {portrait && (
        <section className="container-x pt-16 md:pt-24">
          <Reveal>
            <figure className="grid items-end gap-8 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] md:gap-14">
              <div className="relative">
                <div aria-hidden className="absolute -bottom-3 -right-3 h-3/4 w-3/4 bg-brand md:-bottom-5 md:-right-5" />
                <div className="relative overflow-hidden bg-ink" style={{ aspectRatio: ratioOf(portrait) }}>
                  <Image
                    src={portrait.image}
                    alt={pick(portrait.alt, lang) || pick(portrait.title, lang)}
                    fill
                    sizes="(max-width: 767px) 100vw, 60vw"
                    className="object-cover"
                  />
                </div>
              </div>
              <figcaption className="pb-2">
                <p className="eyebrow mb-4 text-stone">{t.gallery.cat.portraits}</p>
                <p className="font-display text-3xl font-bold leading-tight md:text-4xl">{pick(settings.site.name, lang)}</p>
                <div className="my-5 h-1 w-14 bg-brand" />
                <p className="text-base leading-relaxed text-ink/80">{pick(settings.site.designation, lang)}</p>
                {portrait.credit && (
                  <p className="mt-4 text-xs text-stone">
                    {t.gallery.credit}: {portrait.credit}
                  </p>
                )}
              </figcaption>
            </figure>
          </Reveal>
        </section>
      )}

      <section className="container-x py-16 md:py-24">
        <div className="space-y-14 md:space-y-20">
          {bio.map((section, i) => (
            <Reveal key={section.id}>
              <article id={section.key} className="grid gap-4 md:grid-cols-[260px_1fr] md:gap-12">
                <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl">
                  <span className="mb-3 block font-sans text-xs font-bold tracking-[0.2em] text-stone">0{i + 1}</span>
                  {pick(section.title, lang)}
                </h2>
                <div className="border-l border-ink/20 pl-5 md:pl-10">
                  {pick(section.body, lang)
                    .split(/\n\n+/)
                    .map((para, k) => (
                      <p key={k} className="mb-4 max-w-3xl text-lg leading-relaxed text-ink/80 last:mb-0">
                        {para}
                      </p>
                    ))}
                  <SourceChips ids={section.sourceIds} label={t.about.sourcesNote} />
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="timeline" className="scroll-mt-16 bg-cream py-20 md:py-28">
        <div className="container-x">
          <SectionHeading eyebrow={t.about.timelineTitle} title={t.about.timelineTitle} />
          <Timeline events={timeline} />
        </div>
      </section>

      <section className="container-x py-20 md:py-28">
        <SectionHeading eyebrow={t.about.colYear} title={t.about.electoralTitle} lead={t.about.electoralLead} />
        <div className="hidden overflow-hidden border border-ink md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink text-brand">
              <tr>
                {[t.about.colYear, t.about.colElection, t.about.colParty, t.about.colOutcome, t.about.colDetail].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/15 bg-white">
              {electoral.map((row) => (
                <tr key={row.id} className="align-top">
                  <td className="px-4 py-4 font-display text-2xl font-bold">{row.year}</td>
                  <td className="px-4 py-4 font-bold">{pick(row.election, lang)}</td>
                  <td className="px-4 py-4">{row.party}</td>
                  <td className="px-4 py-4"><span className="bg-brand px-2.5 py-1 text-xs font-bold">{pick(row.outcome, lang)}</span></td>
                  <td className="px-4 py-4 text-ink/80">
                    {pick(row.detail, lang)}
                    <SourceChips ids={row.sourceIds} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="space-y-4 md:hidden">
          {electoral.map((row) => (
            <li key={row.id} className="border border-ink bg-white p-5">
              <p className="font-display text-3xl font-bold">{row.year}</p>
              <p className="mt-1 font-bold">{pick(row.election, lang)}</p>
              <p className="mt-2 text-sm"><span className="bg-brand px-2.5 py-1 text-xs font-bold">{pick(row.outcome, lang)}</span> · {row.party}</p>
              <p className="mt-3 text-sm text-ink/80">{pick(row.detail, lang)}</p>
              <SourceChips ids={row.sourceIds} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
