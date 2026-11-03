"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { ActivityCard } from "@/components/activities/ActivityExplorer";
import { Reveal } from "@/components/animations/Reveal";
import { EmptyState } from "@/components/shared/EmptyState";
import { useLang } from "@/components/shared/Providers";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { formatDate, pick } from "@/lib/i18n";
import type { Activity, UpdateItem } from "@/types";

/** Newspaper-inspired band: public activities on the left, press coverage on the right. */
export function NewsSection({ activities, updates }: { activities: Activity[]; updates: UpdateItem[] }) {
  const { t, lang } = useLang();
  const shownActivities = activities.slice(0, 2);
  const shownUpdates = updates.slice(0, 4);
  return (
    <section id="updates" className="scroll-mt-16 bg-cream py-20 md:py-28">
      <div className="container-x">
        <SectionHeading eyebrow={t.home.newsLabel} title={t.home.newsTitle} lead={t.home.newsLead} href="/activities" linkLabel={t.home.allUpdates} />

        <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-6 text-stone">{t.activities.title}</p>
            {shownActivities.length === 0 ? (
              <EmptyState>{t.common.comingSoon}</EmptyState>
            ) : (
              <div className={`grid gap-6 ${shownActivities.length > 1 ? "sm:grid-cols-2" : "max-w-xl"}`}>
                {shownActivities.map((a, i) => (
                  <Reveal key={a.id} delay={i * 0.08}>
                    <ActivityCard activity={a} />
                  </Reveal>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <p className="eyebrow mb-6 text-stone">{t.home.inTheNews}</p>
            {shownUpdates.length === 0 ? (
              <EmptyState>{t.common.comingSoon}</EmptyState>
            ) : (
              <ul className="border-b border-ink/15">
                {shownUpdates.map((u, i) => (
                  <Reveal as="li" key={u.id} delay={i * 0.07} className="border-t border-ink/15">
                    <article className="group flex gap-5 py-6">
                      {u.image && (
                        <div className="zoom-img relative hidden h-24 w-24 shrink-0 overflow-hidden bg-ink sm:block">
                          <Image src={u.image} alt={pick(u.imageAlt, lang) || pick(u.title, lang)} fill sizes="96px" className="object-cover" />
                        </div>
                      )}
                      <div>
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-stone">{formatDate(u.date, lang)}</p>
                        <h3 className="font-display text-lg font-bold leading-snug md:text-xl">{pick(u.title, lang)}</h3>
                        {pick(u.body, lang) && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-stone">{pick(u.body, lang)}</p>}
                        {u.sourceUrl && (
                          <a href={u.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold">
                            <span className="link-line">
                              {t.common.reported}: {u.sourceName}
                            </span>
                            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                          </a>
                        )}
                      </div>
                    </article>
                  </Reveal>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
