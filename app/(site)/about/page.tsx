import { Reveal } from "@/components/animations/Reveal";
import { Timeline } from "@/components/about/Timeline";
import { PageHero } from "@/components/shared/PageHero";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { SourceChips } from "@/components/shared/SourceChips";
import { publicList } from "@/lib/database/content";
import { getDict, pick } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";
import { pageMetadata } from "@/lib/seo";
import type { BioSection, ElectoralRow, TimelineEvent } from "@/types";

export async function generateMetadata() {
  return pageMetadata({ path: "/about", navKey: "about" });
}

export default async function AboutPage() {
  const lang = await getLang();
  const t = getDict(lang);
  const [bio, timeline, electoral] = await Promise.all([
    publicList<BioSection>("bio"),
    publicList<TimelineEvent>("timeline"),
    publicList<ElectoralRow>("electoral"),
  ]);

  return (
    <>
      <PageHero title={t.about.title} lead={t.about.lead} eyebrow={t.brand.name} />

      <section className="container-x py-16 md:py-24">
        <div className="space-y-14 md:space-y-20">
          {bio.map((section, i) => (
            <Reveal key={section.id}>
              <article id={section.key} className="grid gap-4 md:grid-cols-[260px_1fr] md:gap-12">
                <h2 className="font-display text-3xl uppercase leading-tight md:text-4xl">
                  <span className="mb-2 block text-sm font-sans font-bold text-brand-deep">0{i + 1}</span>
                  {pick(section.title, lang)}
                </h2>
                <div className="border-l-[6px] border-brand pl-5 md:pl-8">
                  {pick(section.body, lang)
                    .split(/\n\n+/)
                    .map((para, k) => (
                      <p key={k} className="mb-4 max-w-3xl text-lg leading-relaxed text-ink/85 last:mb-0">
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

      <section className="bg-cream py-20 md:py-28">
        <div className="container-x">
          <SectionHeading eyebrow={t.about.timelineTitle} title={t.about.timelineTitle} />
          <Timeline events={timeline} />
        </div>
      </section>

      <section className="container-x py-20 md:py-28">
        <SectionHeading eyebrow={t.about.colYear} title={t.about.electoralTitle} lead={t.about.electoralLead} />
        <div className="hidden overflow-hidden rounded-2xl border-[3px] border-ink md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink text-brand">
              <tr>
                {[t.about.colYear, t.about.colElection, t.about.colParty, t.about.colOutcome, t.about.colDetail].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-line bg-white">
              {electoral.map((row) => (
                <tr key={row.id} className="align-top">
                  <td className="px-4 py-4 font-display text-2xl">{row.year}</td>
                  <td className="px-4 py-4 font-bold">{pick(row.election, lang)}</td>
                  <td className="px-4 py-4">{row.party}</td>
                  <td className="px-4 py-4"><span className="rounded-full bg-brand px-3 py-1 font-bold">{pick(row.outcome, lang)}</span></td>
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
            <li key={row.id} className="rounded-2xl border-2 border-ink bg-white p-5">
              <p className="font-display text-3xl">{row.year}</p>
              <p className="mt-1 font-bold">{pick(row.election, lang)}</p>
              <p className="mt-2 text-sm"><span className="rounded-full bg-brand px-3 py-1 font-bold">{pick(row.outcome, lang)}</span> · {row.party}</p>
              <p className="mt-3 text-sm text-ink/80">{pick(row.detail, lang)}</p>
              <SourceChips ids={row.sourceIds} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
