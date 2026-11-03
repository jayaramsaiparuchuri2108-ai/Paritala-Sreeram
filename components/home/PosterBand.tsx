"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/animations/Reveal";
import { useLang } from "@/components/shared/Providers";
import { pick } from "@/lib/i18n";
import type { Poster } from "@/types";

const tilt = [
  { rotate: -5, x: "-30%", y: 14, z: 1 },
  { rotate: 2, x: "0%", y: -6, z: 3 },
  { rotate: 7, x: "30%", y: 20, z: 2 },
];

/** Bold yellow call-to-action for the poster library, previewing the latest published posters. */
export function PosterBand({ posters }: { posters: Poster[] }) {
  const { t, lang } = useLang();
  const shown = posters.slice(0, 3);
  const order = shown.length === 1 ? [tilt[1]] : shown.length === 2 ? [tilt[0], tilt[2]] : tilt;

  return (
    <section className="on-brand overflow-hidden bg-brand py-20 text-ink md:py-28">
      <div className="container-x grid items-center gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Reveal>
            <p className="eyebrow mb-6">{t.home.postersLabel}</p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="font-display text-5xl font-bold leading-[1.02] md:text-7xl">{t.home.postersCta}</h2>
          </Reveal>
          <Reveal delay={0.16}>
            <div className="my-8 h-1 w-20 bg-ink" />
            <p className="max-w-md text-base leading-relaxed text-ink/80 md:text-lg">{t.home.postersCtaLead}</p>
          </Reveal>
          <Reveal delay={0.24}>
            <Link href="/posters" className="group mt-9 inline-flex items-center gap-3 bg-ink px-7 py-4 text-[13px] font-bold uppercase tracking-[0.14em] text-brand transition-colors hover:bg-white hover:text-ink">
              {t.home.openPosters} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" aria-hidden />
            </Link>
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          {shown.length > 0 ? (
            <div className="relative mx-auto h-[400px] w-full max-w-[560px] sm:h-[500px] md:h-[560px]">
              {shown.map((p, i) => {
                const pos = order[i];
                return (
                  <div key={p.id} className="absolute top-1/2 w-[46%] -translate-x-1/2 -translate-y-1/2" style={{ left: `calc(50% + ${pos.x})`, zIndex: pos.z }}>
                    <motion.div
                      initial={{ opacity: 0, y: 60, rotate: 0 }}
                      whileInView={{ opacity: 1, y: pos.y, rotate: pos.rotate }}
                      whileHover={{ scale: 1.04, rotate: 0 }}
                      viewport={{ once: true, margin: "0px 0px -15% 0px" }}
                      transition={{ duration: 0.9, delay: 0.1 + i * 0.12, ease: [0.2, 0.7, 0.2, 1] }}
                    >
                      <Link href={`/posters/${p.id}`} className="block border-[6px] border-white bg-white shadow-[0_24px_48px_-16px_rgba(8,8,8,0.55)]" aria-label={pick(p.title, lang)}>
                        <span className="relative block aspect-[4/5]">
                          <Image src={p.image} alt={pick(p.alt, lang) || pick(p.title, lang)} fill sizes="(max-width: 768px) 45vw, 260px" className="object-cover" />
                        </span>
                      </Link>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Reveal>
              <div aria-hidden className="relative mx-auto aspect-[4/5] w-[62%] max-w-[340px] rotate-3 border-[6px] border-white bg-ink shadow-[0_24px_48px_-16px_rgba(8,8,8,0.55)]">
                <div className="absolute -right-[18%] -top-[10%] aspect-square w-[70%] rounded-full bg-brand" />
                <div className="absolute inset-4 border border-white/20" />
                <span className="absolute bottom-6 left-6 grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-white">
                  <Image src="/logos/tdp-logo.png" alt="" width={48} height={48} className="h-full w-full object-contain" />
                </span>
                <span className="absolute bottom-7 right-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">1080 × 1350</span>
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
