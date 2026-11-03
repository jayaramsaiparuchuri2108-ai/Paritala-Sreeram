"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { Reveal } from "@/components/animations/Reveal";
import { useLang } from "@/components/shared/Providers";
import { SourceChips } from "@/components/shared/SourceChips";
import { formatDate, pick } from "@/lib/i18n";
import type { TimelineEvent } from "@/types";

export function Timeline({ events }: { events: TimelineEvent[] }) {
  const { lang, t } = useLang();
  const wrap = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLDivElement>(null);

  // GSAP draws the spine as the section scrolls (skipped for reduced motion).
  useEffect(() => {
    if (!wrap.current || !line.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      line.current.style.transform = "scaleY(1)";
      return;
    }
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled || !wrap.current || !line.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const tween = gsap.fromTo(
        line.current,
        { scaleY: 0 },
        { scaleY: 1, ease: "none", scrollTrigger: { trigger: wrap.current, start: "top 70%", end: "bottom 70%", scrub: 0.5 } },
      );
      cleanup = () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    })();
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [events.length]);

  return (
    <div ref={wrap} className="relative mx-auto max-w-4xl" aria-label={t.about.timelineTitle}>
      <div aria-hidden className="absolute bottom-0 left-[19px] top-0 w-[3px] bg-line md:left-1/2 md:-translate-x-1/2" />
      <div ref={line} aria-hidden className="absolute bottom-0 left-[19px] top-0 w-[3px] origin-top bg-ink md:left-1/2 md:-translate-x-1/2" style={{ transform: "scaleY(0)" }} />

      <ol className="space-y-12">
        {events.map((e, i) => {
          const right = i % 2 === 1;
          return (
            <Reveal as="li" key={e.id} className="relative pl-14 md:pl-0">
              <motion.span
                aria-hidden
                className="absolute left-0 top-1 z-10 grid h-10 w-10 place-items-center rounded-full border-[3px] border-ink bg-brand md:left-1/2 md:-translate-x-1/2"
                whileInView={{ scale: [0.4, 1.15, 1] }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-ink" />
              </motion.span>
              <div className={`md:grid md:grid-cols-2 md:gap-16 ${right ? "" : ""}`}>
                <div className={right ? "md:col-start-2" : "md:text-right"}>
                  <p className="font-display text-5xl leading-none text-ink md:text-6xl">{e.year}</p>
                  {e.date && <p className="mt-1 text-xs font-bold uppercase tracking-wider text-stone">{formatDate(e.date, lang)}</p>}
                  <h3 className="mt-3 text-xl font-extrabold leading-snug">{pick(e.title, lang)}</h3>
                  <p className="mt-2 text-ink/75">{pick(e.body, lang)}</p>
                  <div className={right ? "" : "md:flex md:justify-end"}>
                    <SourceChips ids={e.sourceIds} label={t.common.source} />
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </ol>
    </div>
  );
}
