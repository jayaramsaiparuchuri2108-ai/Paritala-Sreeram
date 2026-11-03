"use client";

import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/animations/Reveal";
import { EmptyState } from "@/components/shared/EmptyState";
import { useLang } from "@/components/shared/Providers";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { pick } from "@/lib/i18n";
import type { FocusArea } from "@/types";

/** Numbered rows of informational focus areas. Not promises — descriptions appear only once approved in the admin. */
export function FocusAreas({ areas }: { areas: FocusArea[] }) {
  const { t, lang } = useLang();
  return (
    <section id="focus" className="scroll-mt-16 bg-white py-20 md:py-28">
      <div className="container-x">
        <SectionHeading eyebrow={t.home.focusLabel} title={t.home.focusTitle} lead={t.home.focusLead} />
        {areas.length === 0 ? (
          <EmptyState>{t.common.comingSoon}</EmptyState>
        ) : (
          <ol className="border-b border-ink/15">
            {areas.map((a, i) => {
              const description = pick(a.description, lang);
              return (
                <Reveal as="li" key={a.id} delay={Math.min(i, 5) * 0.05} className="group relative border-t border-ink/15">
                  <div className="grid grid-cols-[3.25rem_1fr_auto] items-baseline gap-x-4 py-6 transition-[padding] duration-500 group-hover:pl-3 md:grid-cols-[6rem_1fr_auto] md:py-9 md:group-hover:pl-6">
                    <span className="font-display text-xl font-semibold text-stone transition-colors group-hover:text-ink md:text-3xl">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <h3 className="font-display text-2xl font-bold leading-snug md:text-4xl">{pick(a.title, lang)}</h3>
                      {description && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone md:text-base">{description}</p>}
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-ink/30 transition-all duration-500 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-ink md:h-7 md:w-7" aria-hidden />
                  </div>
                  <span aria-hidden className="absolute inset-x-0 -top-px h-px origin-left scale-x-0 bg-ink transition-transform duration-700 group-hover:scale-x-100" />
                </Reveal>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
