"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ImageReveal } from "@/components/animations/ImageReveal";
import { Reveal } from "@/components/animations/Reveal";
import { PhotoPanel } from "@/components/shared/PhotoPanel";

interface Props {
  id?: string;
  tone: "dark" | "brand";
  imageSide: "left" | "right";
  eyebrow: string;
  title: string;
  body: string;
  image?: string;
  imageAlt: string;
  monogram: string;
  cta?: { href: string; label: string };
  meta?: string;
}

/** Half-bleed photograph beside an editorial text column, on a black or yellow field. */
export function SplitSection({ id, tone, imageSide, eyebrow, title, body, image, imageAlt, monogram, cta, meta }: Props) {
  const dark = tone === "dark";
  const paragraphs = body.split(/\n{2,}/).filter(Boolean);
  const imageFirst = imageSide === "left";

  return (
    <section id={id} className={`${dark ? "on-dark bg-ink text-white" : "on-brand bg-brand text-ink"} scroll-mt-16`}>
      <div className="grid lg:min-h-[680px] lg:grid-cols-2">
        <div className={`relative aspect-[4/5] overflow-hidden sm:aspect-[16/11] lg:aspect-auto ${imageFirst ? "lg:order-1" : "lg:order-2"}`}>
          <ImageReveal className="absolute inset-0" from={imageFirst ? "left" : "right"}>
            <PhotoPanel src={image} alt={imageAlt} tone={dark ? "dark" : "brand"} monogram={monogram} sizes="(max-width: 1024px) 100vw, 50vw" />
          </ImageReveal>
          <div aria-hidden className={`pointer-events-none absolute inset-4 z-10 border md:inset-6 ${dark ? "border-brand/50" : "border-ink/40"}`} />
          {meta && (
            <p className={`absolute bottom-6 left-6 z-10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] md:bottom-8 md:left-8 ${dark ? "bg-brand text-ink" : "bg-ink text-brand"}`}>{meta}</p>
          )}
        </div>

        <div className={`flex items-center px-5 py-16 md:px-12 md:py-24 lg:px-16 xl:px-24 ${imageFirst ? "lg:order-2" : "lg:order-1"}`}>
          <div className="max-w-xl">
            <Reveal>
              <p className="eyebrow mb-6">{eyebrow}</p>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="font-display text-4xl font-bold leading-[1.08] md:text-5xl xl:text-[3.5rem]">{title}</h2>
            </Reveal>
            <Reveal delay={0.16}>
              <div className={`my-7 h-1 w-16 ${dark ? "bg-brand" : "bg-ink"}`} />
            </Reveal>
            <div className="space-y-4">
              {paragraphs.map((p, i) => (
                <Reveal key={i} delay={0.22 + i * 0.08}>
                  <p className={`text-base leading-relaxed md:text-lg ${dark ? "text-white/72" : "text-ink/80"}`}>{p}</p>
                </Reveal>
              ))}
            </div>
            {cta && (
              <Reveal delay={0.4}>
                <Link href={cta.href} className="group mt-9 inline-flex items-center gap-3 text-[13px] font-bold uppercase tracking-[0.14em]">
                  <span className="link-line pb-1">{cta.label}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" aria-hidden />
                </Link>
              </Reveal>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
