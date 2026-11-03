"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { ArrowDown, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatedShapes } from "@/components/animations/AnimatedShapes";
import { SplitText } from "@/components/animations/SplitText";
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
    const id = window.setInterval(() => setIndex((i) => (i + 1) % images.length), 5500);
    return () => window.clearInterval(id);
  }, [images.length]);

  return (
    <div className="absolute inset-0">
      <AnimatePresence mode="sync">
        <motion.div
          key={images[index]}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        >
          <Image src={images[index]} alt={alt} fill priority={index === 0} sizes="(max-width: 1024px) 90vw, 520px" className="object-cover object-top" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function MonogramPortrait({ letters }: { letters: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center overflow-hidden bg-ink">
      <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand" />
      <div aria-hidden className="absolute -bottom-6 -left-6 h-40 w-40 opacity-30 [background-image:repeating-linear-gradient(-45deg,#f5d51c_0_6px,transparent_6px_18px)]" />
      <span className="relative font-display text-[9rem] leading-none text-brand md:text-[11rem]">{letters}</span>
      <span className="absolute bottom-6 left-6 grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-white ring-4 ring-brand">
        <Image src="/logos/tdp-logo.png" alt="" width={64} height={64} className="h-full w-full object-contain" />
      </span>
    </div>
  );
}

export function Hero({ name, designation, intro, images, imageAlt }: HeroProps) {
  const { lang, t } = useLang();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const portraitY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -50]);

  const primary = pick(name, lang);
  const secondary = lang === "en" ? name.te : name.en;
  const words = primary.split(" ");

  return (
    <section ref={ref} className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-cream pt-24 pb-24 md:pt-28">
      <AnimatedShapes />

      <div className="container-x relative z-10 grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-6">
        <motion.div style={{ y: textY }}>
          <motion.p
            className="mb-5 inline-flex items-center gap-3 rounded-full border-2 border-ink bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand-deep" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-ink" />
            </span>
            {t.home.eyebrow}
          </motion.p>

          <h1 className="font-display text-[3.4rem] uppercase leading-[0.95] sm:text-7xl lg:text-[6.5rem]">
            {words.map((w, i) => (
              <span key={`${w}-${i}`} className="block">
                <SplitText text={w} delay={0.35 + i * 0.25} />
              </span>
            ))}
          </h1>

          <motion.p
            lang={lang === "en" ? "te" : "en"}
            className={`mt-3 text-2xl font-extrabold text-ink/80 md:text-4xl ${lang === "en" ? "font-sans" : "font-display uppercase"}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 0.7 }}
          >
            {secondary}
          </motion.p>

          <motion.div className="mt-6 flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
            <span className="h-1.5 w-14 bg-ink" />
            <p className="text-sm font-bold uppercase tracking-wider">{pick(designation, lang)}</p>
          </motion.div>

          <motion.p className="mt-5 max-w-lg text-base text-ink/75 md:text-lg" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }}>
            {pick(intro, lang)}
          </motion.p>

          <motion.div className="mt-8 flex flex-wrap gap-3" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.45 }}>
            <Link href="/about" className="group inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 font-bold text-brand transition-transform hover:scale-[1.03]">
              {t.nav.about} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/posters" className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-brand px-7 py-3.5 font-bold transition-transform hover:scale-[1.03]">
              {t.nav.posters}
            </Link>
          </motion.div>
        </motion.div>

        <motion.div style={{ y: portraitY }} className="relative mx-auto w-full max-w-[420px] lg:max-w-[500px]">
          <motion.div
            className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border-[3px] border-ink shadow-[12px_12px_0_0_#171717]"
            initial={{ opacity: 0, y: 60, rotate: 3 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
          >
            {images.length > 0 ? <PortraitSlideshow images={images} alt={pick(imageAlt, lang)} /> : <MonogramPortrait letters="PS" />}
          </motion.div>
          <motion.div
            aria-hidden
            className="absolute -bottom-5 -left-5 hidden rounded-xl border-[3px] border-ink bg-brand px-4 py-3 font-display text-xl uppercase md:block"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.4, type: "spring", stiffness: 260, damping: 18 }}
          >
            {lang === "te" ? "టీడీపీ · ధర్మవరం" : "TDP · Dharmavaram"}
          </motion.div>
        </motion.div>
      </div>

      <motion.a
        href="#updates"
        aria-label={t.common.scrollDown}
        className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-xs font-bold uppercase tracking-[0.2em]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
      >
        {t.common.scrollDown}
        <motion.span animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }} className="grid h-9 w-9 place-items-center rounded-full border-2 border-ink">
          <ArrowDown className="h-4 w-4" />
        </motion.span>
      </motion.a>
    </section>
  );
}
