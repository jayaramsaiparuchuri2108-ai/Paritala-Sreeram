"use client";

import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Reveal } from "@/components/animations/Reveal";
import { useLang } from "@/components/shared/Providers";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { formatDate, pick } from "@/lib/i18n";
import { ratioOf } from "@/lib/photos";
import type { GalleryPhoto } from "@/types";

/** Dark band: authorised photographs in a horizontal strip. Activity photographs lead; portraits follow. */
export function GalleryStrip({ photos, instagramUrl }: { photos: GalleryPhoto[]; instagramUrl?: string }) {
  const { t, lang } = useLang();
  const row = useRef<HTMLUListElement>(null);
  const scrollBy = (dir: 1 | -1) => row.current?.scrollBy({ left: dir * 420, behavior: "smooth" });

  const strip = [...photos.filter((p) => p.category !== "portraits"), ...photos.filter((p) => p.category === "portraits")].slice(0, 10);

  return (
    <section className="on-dark bg-ink py-20 text-white md:py-28">
      <div className="container-x">
        <SectionHeading tone="dark" eyebrow={t.home.picturesLabel} title={t.home.recentTitle} lead={t.home.galleryLead} href="/gallery" linkLabel={t.home.fullGallery} />
      </div>

      {strip.length === 0 ? (
        <p className="container-x text-white/60">{t.gallery.emptyPhotos}</p>
      ) : (
        <div className="relative">
          <ul ref={row} className="scroll-row flex items-start gap-5 overflow-x-auto px-5 pb-4 md:gap-6 md:px-10 xl:px-[max(2.5rem,calc((100vw-1280px)/2+2.5rem))]" aria-label={t.home.recentTitle}>
            {strip.map((p, i) => {
              const ratio = ratioOf(p);
              const wide = ratio > 1.1;
              const date = p.date ? formatDate(p.date, lang) : "";
              return (
                <li key={p.id} className={`shrink-0 ${wide ? "w-[86vw] sm:w-[480px] md:w-[560px]" : "w-[74vw] sm:w-[300px] md:w-[340px]"}`}>
                  <Reveal delay={Math.min(i, 4) * 0.06}>
                    <Link href={`/gallery?photo=${encodeURIComponent(p.id)}`} className="group block" aria-label={pick(p.title, lang)}>
                      <figure>
                        <div className="zoom-img relative overflow-hidden bg-white/5" style={{ aspectRatio: ratio }}>
                          <Image
                            src={p.image}
                            alt={pick(p.alt, lang) || pick(p.title, lang)}
                            fill
                            loading="lazy"
                            sizes={wide ? "(max-width: 640px) 86vw, 560px" : "(max-width: 640px) 74vw, 340px"}
                            className="object-cover"
                          />
                          <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-brand transition-transform duration-500 group-hover:scale-x-100" />
                        </div>
                        <figcaption className="mt-3">
                          <p className="font-display text-base font-semibold leading-snug">{pick(p.title, lang)}</p>
                          <p className="mt-1 text-xs text-white/50">
                            {t.gallery.cat[p.category]}
                            {date && ` · ${date}`}
                          </p>
                        </figcaption>
                      </figure>
                    </Link>
                  </Reveal>
                </li>
              );
            })}
          </ul>
          <div className="container-x mt-6 hidden justify-end gap-2 md:flex">
            <button type="button" onClick={() => scrollBy(-1)} aria-label={t.common.previous} className="grid h-11 w-11 place-items-center border border-white/30 transition-colors hover:border-brand hover:bg-brand hover:text-ink">
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button type="button" onClick={() => scrollBy(1)} aria-label={t.common.next} className="grid h-11 w-11 place-items-center border border-white/30 transition-colors hover:border-brand hover:bg-brand hover:text-ink">
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      )}

      {instagramUrl && (
        <div className="container-x mt-12">
          <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-brand">
            <span className="link-line">{t.gallery.followInstagram}</span>
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          </a>
        </div>
      )}
    </section>
  );
}
