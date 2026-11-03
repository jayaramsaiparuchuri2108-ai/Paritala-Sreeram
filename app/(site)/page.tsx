import { ArrowRight, CalendarDays, ExternalLink } from "lucide-react";
import Link from "next/link";
import { ActivityCard } from "@/components/activities/ActivityExplorer";
import { Reveal } from "@/components/animations/Reveal";
import { InstagramGrid } from "@/components/gallery/InstagramGrid";
import { Hero } from "@/components/home/Hero";
import { PosterCard } from "@/components/posters/PosterExplorer";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { EmptyState } from "@/components/shared/EmptyState";
import { VideoGrid } from "@/components/videos/VideoGrid";
import { getSettings, publicList } from "@/lib/database/content";
import { formatDate, getDict, pick } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";
import { jsonLd, pageMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site-url";
import type { Activity, BioSection, InstagramPost, Poster, UpdateItem, VideoEntry } from "@/types";

export async function generateMetadata() {
  return pageMetadata({ path: "/" });
}

export default async function HomePage() {
  const lang = await getLang();
  const t = getDict(lang);
  const [settings, updates, bio, activities, instagram, videos, posters] = await Promise.all([
    getSettings(),
    publicList<UpdateItem>("updates"),
    publicList<BioSection>("bio"),
    publicList<Activity>("activities"),
    publicList<InstagramPost>("instagram"),
    publicList<VideoEntry>("videos"),
    publicList<Poster>("posters"),
  ]);
  const intro = bio.find((b) => b.key === "intro") ?? bio[0];
  const latestPosters = [...posters].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);

  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: settings.site.name.en,
    alternateName: settings.site.name.te,
    url: absoluteUrl("/"),
    jobTitle: settings.site.designation.en,
    affiliation: { "@type": "Organization", name: "Telugu Desam Party" },
    sameAs: [settings.social.instagram, settings.social.telegram].filter(Boolean),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(personLd) }} />
      <Hero
        name={settings.site.name}
        designation={settings.site.designation}
        intro={settings.home.heroIntro}
        images={settings.home.heroImages}
        imageAlt={settings.home.heroImageAlt}
      />

      {/* Latest public updates */}
      <section id="updates" className="container-x scroll-mt-24 py-20 md:py-28">
        <SectionHeading eyebrow={t.common.latest} title={t.home.updatesTitle} lead={t.home.updatesLead} />
        {updates.length === 0 ? (
          <EmptyState>{t.common.comingSoon}</EmptyState>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {updates.slice(0, 4).map((u, i) => (
              <Reveal key={u.id} delay={i * 0.08}>
                <article className="relative h-full overflow-hidden rounded-2xl border-2 border-ink bg-white p-6 shadow-[6px_6px_0_0_#f5d51c] transition-transform hover:-translate-y-1">
                  <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-ink px-3 py-1 text-xs font-bold text-brand">
                    <CalendarDays className="h-3.5 w-3.5" /> {formatDate(u.date, lang)}
                  </p>
                  <h3 className="text-xl font-extrabold leading-snug">{pick(u.title, lang)}</h3>
                  <p className="mt-2 text-ink/75">{pick(u.body, lang)}</p>
                  {u.sourceUrl && (
                    <a href={u.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-bold underline decoration-brand decoration-2 underline-offset-4">
                      {t.common.reported}: {u.sourceName} <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* Biography preview */}
      <section className="bg-brand py-20 md:py-28">
        <div className="container-x grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <p className="mb-3 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em]">
              <span className="h-[3px] w-10 bg-ink" /> {t.home.bioTitle}
            </p>
            <h2 className="font-display text-4xl uppercase leading-[1.05] md:text-6xl">{pick(settings.site.name, lang)}</h2>
            {intro && <p className="mt-5 max-w-xl text-lg text-ink/85">{pick(intro.body, lang)}</p>}
            <Link href="/about" className="group mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 font-bold text-brand">
              {t.common.readMore} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
          <Reveal delay={0.15}>
            <dl className="divide-y-2 divide-ink rounded-2xl border-[3px] border-ink bg-white shadow-[10px_10px_0_0_#171717]">
              {bio
                .filter((b) => ["education", "roles", "family"].includes(b.key))
                .map((b) => (
                  <div key={b.id} className="p-5">
                    <dt className="text-xs font-bold uppercase tracking-[0.2em] text-stone">{pick(b.title, lang)}</dt>
                    <dd className="mt-1 line-clamp-3 text-sm text-ink/85">{pick(b.body, lang).split("\n")[0]}</dd>
                  </div>
                ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* Public activities */}
      <section className="container-x py-20 md:py-28">
        <SectionHeading eyebrow={t.nav.activities} title={t.home.activitiesTitle} lead={t.home.activitiesLead} href="/activities" linkLabel={t.common.viewAll} />
        {activities.length === 0 ? (
          <EmptyState>{t.common.comingSoon}</EmptyState>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activities.slice(0, 3).map((a, i) => (
              <Reveal key={a.id} delay={i * 0.08}>
                <ActivityCard activity={a} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* Instagram preview */}
      <section className="bg-ink py-20 md:py-28">
        <div className="container-x">
          <SectionHeading dark eyebrow="Instagram" title={t.home.galleryTitle} lead={t.home.galleryLead} href="/gallery" linkLabel={t.common.viewAll} />
          <InstagramGrid posts={instagram} limit={3} />
        </div>
      </section>

      {/* Videos */}
      <section className="container-x py-20 md:py-28">
        <SectionHeading eyebrow={t.nav.videos} title={t.home.videosTitle} lead={t.home.videosLead} href="/videos" linkLabel={t.common.viewAll} />
        <VideoGrid videos={videos} limit={3} />
      </section>

      {/* Posters preview */}
      <section className="bg-cream py-20 md:py-28">
        <div className="container-x">
          <SectionHeading eyebrow={t.nav.posters} title={t.home.postersTitle} lead={t.home.postersLead} href="/posters" linkLabel={t.common.viewAll} />
          {latestPosters.length === 0 ? (
            <EmptyState>{t.posters.empty}</EmptyState>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
              {latestPosters.map((p, i) => (
                <Reveal key={p.id} delay={i * 0.07}>
                  <PosterCard poster={p} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
