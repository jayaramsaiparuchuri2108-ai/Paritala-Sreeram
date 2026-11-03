"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/animations/Reveal";
import { useLang } from "@/components/shared/Providers";
import { pick } from "@/lib/i18n";
import type { Bi, BioSection } from "@/types";

interface Props {
  intro?: BioSection;
  education?: BioSection;
  designation: Bi;
}

/** White editorial introduction: a large statement drawn from the sourced biography, plus a facts column. */
export function Intro({ intro, education, designation }: Props) {
  const { t, lang } = useLang();
  const facts = [
    { label: t.home.factParty, value: t.home.factPartyValue },
    { label: t.home.factPosition, value: pick(designation, lang) },
    { label: t.home.factConstituency, value: t.home.factConstituencyValue },
    ...(education ? [{ label: t.home.factEducation, value: pick(education.body, lang) }] : []),
  ];

  return (
    <section className="bg-white py-20 md:py-28">
      <div className="container-x grid gap-14 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-7">
          <Reveal>
            <p className="eyebrow mb-8 text-stone">{t.home.introLabel}</p>
          </Reveal>
          {intro && (
            <Reveal delay={0.08}>
              <p className="font-display text-[1.65rem] font-semibold leading-[1.28] md:text-4xl lg:text-[2.6rem]">{pick(intro.body, lang)}</p>
            </Reveal>
          )}
          <Reveal delay={0.16}>
            <div className="mt-10 flex items-start gap-4">
              <span className="mt-2 h-px w-10 shrink-0 bg-ink" />
              <p className="max-w-md text-sm leading-relaxed text-stone">{t.home.introNote}</p>
            </div>
            <Link href="/about" className="group mt-9 inline-flex items-center gap-3 text-[13px] font-bold uppercase tracking-[0.14em]">
              <span className="link-line pb-1">{t.home.readFullBio}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" aria-hidden />
            </Link>
          </Reveal>
        </div>

        <Reveal delay={0.2} className="lg:col-span-5">
          <p className="eyebrow mb-8 text-stone">{t.home.factsTitle}</p>
          <dl className="border-b border-ink/15">
            {facts.map((f) => (
              <div key={f.label} className="group grid grid-cols-[1.25rem_1fr] gap-x-4 border-t border-ink/15 py-5">
                <ArrowRight className="mt-1 h-4 w-4 text-ink/40 transition-all duration-300 group-hover:translate-x-1 group-hover:text-ink" aria-hidden />
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone">{f.label}</dt>
                  <dd className="mt-1.5 text-base font-medium leading-snug md:text-lg">{f.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
