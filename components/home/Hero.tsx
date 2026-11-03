"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SplitText } from "@/components/animations/SplitText";
import { PhotoPanel } from "@/components/shared/PhotoPanel";
import { useLang } from "@/components/shared/Providers";
import { pick } from "@/lib/i18n";
import type { Bi } from "@/types";

interface HeroProps {
  name: Bi;
  designation: Bi;
  intro: Bi;
  images: string[];
  imageAlt: Bi;
}

function PortraitSlideshow({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (images.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % images.length), 6000);
    return () => window.clearInterval(id);
  }, [images.length]);

  return (
    <div className="absolute inset-0">
      <AnimatePresence mode="sync">
        <motion.div
          key={images[index]}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        >
          <Image src={images[index]} alt={alt} fill priority={index === 0} sizes="(max-width: 1024px) 90vw, 560px" className="object-cover object-top" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const ease = [0.2, 0.7, 0.2, 1] as const;

export function Hero({ name, designation, intro, images, imageAlt }: HeroProps) {
  const { lang, t } = useLang();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const portraitY = useTransform(scrollYProgress, [0, 1], [0, 50]);

  const primary = pick(name, lang);
  const secondary = lang === "en" ? name.te : name.en;
  const words = primary.split(" ");

  return (
    <section ref={ref} className="on-dark relative isolate overflow-hidden bg-ink text-white">
      {/* fine decorative frame lines */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px bg-white/[0.06] lg:block" />
      <div aria-hidden className="pointer-events-none absolute -left-24 bottom-0 hidden h-72 w-72 rounded-full border border-brand/20 lg:block" />

      <div className="container-x grid items-center gap-12 pb-16 pt-12 md:pb-24 md:pt-16 lg:min-h-[calc(100svh-60px)] lg:max-h-[860px] lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-20">
        <div>
          <motion.p className="eyebrow mb-7 text-brand" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.7, ease }}>
            {t.home.heroLabel}
          </motion.p>

          <h1 className="font-display text-[3.25rem] font-bold leading-[1.02] sm:text-7xl lg:text-[5.5rem] xl:text-[6.25rem]">
            {words.map((w, i) => (
              <span key={`${w}-${i}`} className="block">
                <SplitText text={w} delay={0.3 + i * 0.22} />
              </span>
            ))}
          </h1>

          <motion.div className="mt-7 h-1 w-24 bg-brand" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} style={{ originX: 0 }} transition={{ delay: 0.9, duration: 0.7, ease }} />

          <motion.p
            lang={lang === "en" ? "te" : "en"}
            className="mt-5 text-xl font-medium text-white/55 md:text-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            {secondary}
          </motion.p>

          <motion.div className="mt-9 space-y-5" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.8, ease }}>
            <div className="border-l-2 border-brand pl-4">
              <p className="font-display text-lg font-bold md:text-xl">{pick(designation, lang)}</p>
              <p className="mt-1 text-sm text-white/60">{t.home.factPartyValue}</p>
            </div>
            <p className="max-w-lg text-base leading-relaxed text-white/70">{pick(intro, lang)}</p>
          </motion.div>

          <motion.div className="mt-9 flex flex-wrap gap-3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.25, duration: 0.8, ease }}>
            <Link href="/about" className="group inline-flex items-center gap-2 bg-brand px-4 py-3.5 text-[12px] sm:gap-3 sm:px-6 sm:text-[13px] font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-white">
              {t.home.readProfile} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
            <Link href="/posters" className="inline-flex items-center gap-3 border border-white/40 px-4 py-3.5 text-[12px] sm:px-6 sm:text-[13px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:border-brand hover:text-brand">
              {t.home.viewPosters}
            </Link>
          </motion.div>
        </div>

        <motion.div style={{ y: portraitY }} className="relative mx-auto w-full max-w-[440px] lg:ml-auto lg:mr-0 lg:max-w-[540px]">
          <motion.div aria-hidden className="absolute -bottom-4 -right-4 h-[78%] w-[78%] bg-brand md:-bottom-6 md:-right-6" initial={{ opacity: 0, x: -20, y: -20 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ delay: 0.6, duration: 0.9, ease }} />
          <motion.div aria-hidden className="absolute -left-3 -top-3 h-24 w-24 border border-brand md:-left-5 md:-top-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 0.8 }} />
          <motion.div
            className="relative aspect-[4/5] overflow-hidden bg-ink-soft"
            initial={{ clipPath: "inset(100% 0 0 0)" }}
            animate={{ clipPath: "inset(0% 0 0 0)" }}
            transition={{ duration: 1.2, delay: 0.25, ease: [0.7, 0, 0.2, 1] }}
          >
            {images.length > 0 ? <PortraitSlideshow images={images} alt={pick(imageAlt, lang)} /> : <PhotoPanel alt={pick(imageAlt, lang)} monogram="PS" priority />}
          </motion.div>
          <motion.div
            className="absolute -left-3 bottom-8 flex items-center gap-3 bg-ink px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand shadow-[0_0_0_1px_rgba(255,214,0,0.5)] md:-left-8"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5, duration: 0.7, ease }}
          >
            <span className="grid h-6 w-6 place-items-center overflow-hidden rounded-full bg-white">
              <Image src="/logos/tdp-logo.png" alt="" width={24} height={24} className="h-full w-full object-contain" />
            </span>
            {lang === "te" ? "టీడీపీ · ధర్మవరం" : "TDP · Dharmavaram"}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
