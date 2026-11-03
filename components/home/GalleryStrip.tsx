"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import { Reveal } from "@/components/animations/Reveal";
import { InstagramGrid } from "@/components/gallery/InstagramGrid";
import { useLang } from "@/components/shared/Providers";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { pick } from "@/lib/i18n";
import type { GalleryPhoto, InstagramPost } from "@/types";

/** Dark band: authorised event photographs in a horizontal strip, then the official Instagram embeds. */
export function GalleryStrip({ photos, instagram }: { photos: GalleryPhoto[]; instagram: InstagramPost[] }) {
  const { t, lang } = useLang();
  const row = useRef<HTMLUListElement>(null);
  const scrollBy = (dir: 1 | -1) => row.current?.scrollBy({ left: dir * 360, behavior: "smooth" });

  return (
    <section className="on-dark bg-ink py-20 text-white md:py-28">
      <div className="container-x">
        <SectionHeading tone="dark" eyebrow={t.home.picturesLabel} title={t.home.recentTitle} lead={t.home.galleryLead} href="/gallery" linkLabel={t.home.fullGallery} />
      </div>

      {photos.length > 0 && (
        <div className="relative mb-16 md:mb-24">
          <ul ref={row} className="scroll-row flex gap-5 overflow-x-auto px-5 pb-4 md:gap-6 md:px-10 xl:px-[max(2.5rem,calc((100vw-1280px)/2+2.5rem))]" aria-label={t.home.recentTitle}>
            {photos.slice(0, 10).map((p, i) => (
              <li key={p.id} className="w-[74vw] shrink-0 sm:w-[300px] md:w-[340px]">
                <Reveal delay={Math.min(i, 4) * 0.06}>
                  <figure className="group">
                    <div className="zoom-img relative aspect-[4/5] overflow-hidden bg-white/5">
                      <Image src={p.image} alt={pick(p.alt, lang)} fill loading="lazy" sizes="(max-width: 640px) 74vw, 340px" className="object-cover" />
                      <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-brand transition-transform duration-500 group-hover:scale-x-100" />
                    </div>
                    <figcaption className="mt-3">
                      <p className="font-display text-base font-semibold leading-snug">{pick(p.title, lang)}</p>
                      <p className="mt-1 text-xs text-white/50">
                        {t.gallery.credit}: {p.credit}
                      </p>
                    </figcaption>
                  </figure>
                </Reveal>
              </li>
            ))}
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

      <div className="container-x">
        <p className="eyebrow mb-8 text-brand">{t.gallery.instagram}</p>
        <InstagramGrid posts={instagram} limit={3} dark />
      </div>
    </section>
  );
}
