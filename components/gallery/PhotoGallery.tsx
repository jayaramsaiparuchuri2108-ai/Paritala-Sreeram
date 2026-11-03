"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Lightbox } from "@/components/shared/Lightbox";
import { useLang } from "@/components/shared/Providers";
import { pick } from "@/lib/i18n";
import type { ActivityCategory, GalleryPhoto } from "@/types";

const PAGE = 12;
const ratios = ["aspect-[4/5]", "aspect-square", "aspect-[3/4]", "aspect-[5/4]"];

export function PhotoGallery({ photos }: { photos: GalleryPhoto[] }) {
  const { lang, t } = useLang();
  const [category, setCategory] = useState("all");
  const [count, setCount] = useState(PAGE);
  const [active, setActive] = useState<number | null>(null);

  const categories = useMemo(() => Array.from(new Set(photos.map((p) => p.category))), [photos]);
  const filtered = useMemo(() => photos.filter((p) => category === "all" || p.category === category), [photos, category]);
  const shown = filtered.slice(0, count);
  const label = (c: string) => t.activities.cat[c as ActivityCategory] ?? c;

  if (photos.length === 0) return <EmptyState>{t.gallery.emptyPhotos}</EmptyState>;

  const current = active !== null ? filtered[active] : null;

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2" role="tablist" aria-label={t.posters.category}>
        {["all", ...categories].map((c) => (
          <button
            key={c}
            role="tab"
            aria-selected={category === c}
            onClick={() => {
              setCategory(c);
              setCount(PAGE);
            }}
            className="relative rounded-full border-2 border-ink px-4 py-2 text-sm font-bold"
          >
            {category === c && <motion.span layoutId="photo-chip" className="absolute inset-0 -z-10 rounded-full bg-brand" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <span className="relative">{c === "all" ? t.common.all : label(c)}</span>
          </button>
        ))}
      </div>

      <motion.ul layout className="columns-2 gap-4 md:columns-3 lg:gap-6">
        <AnimatePresence mode="popLayout">
          {shown.map((p, i) => (
            <motion.li
              key={p.id}
              layout
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.45, delay: (i % PAGE) * 0.04 }}
              className="mb-4 break-inside-avoid lg:mb-6"
            >
              <button type="button" onClick={() => setActive(i)} className="zoom-img group relative block w-full overflow-hidden rounded-xl border-2 border-ink text-left">
                <div className={`relative w-full ${ratios[i % ratios.length]}`}>
                  <Image src={p.image} alt={pick(p.alt, lang)} fill loading="lazy" sizes="(max-width: 768px) 50vw, 33vw" className="object-cover" />
                </div>
                <span className="absolute inset-x-0 bottom-0 translate-y-full bg-ink/85 p-3 text-sm font-bold text-white transition-transform duration-300 group-hover:translate-y-0">
                  {pick(p.title, lang)}
                </span>
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      {filtered.length === 0 && <EmptyState>{t.common.noResults}</EmptyState>}
      {count < filtered.length && (
        <div className="mt-10 text-center">
          <button onClick={() => setCount((c) => c + PAGE)} className="rounded-full bg-ink px-8 py-3 font-bold text-brand transition-transform hover:scale-105">
            {t.common.loadMore}
          </button>
        </div>
      )}

      <Lightbox
        open={current !== null}
        onClose={() => setActive(null)}
        label={current ? pick(current.title, lang) : ""}
        onPrev={() => setActive((a) => (a === null ? a : (a - 1 + filtered.length) % filtered.length))}
        onNext={() => setActive((a) => (a === null ? a : (a + 1) % filtered.length))}
      >
        {current && (
          <figure className="flex flex-col">
            <div className="relative flex items-center justify-center bg-ink">
              <Image src={current.image} alt={pick(current.alt, lang)} width={1600} height={1600} sizes="100vw" className="h-auto max-h-[75vh] w-auto max-w-full object-contain" />
              <button onClick={() => setActive((a) => (a === null ? a : (a - 1 + filtered.length) % filtered.length))} aria-label={t.common.previous} className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-brand">
                <ChevronLeft />
              </button>
              <button onClick={() => setActive((a) => (a === null ? a : (a + 1) % filtered.length))} aria-label={t.common.next} className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-brand">
                <ChevronRight />
              </button>
            </div>
            <figcaption className="p-4 text-sm">
              <strong>{pick(current.title, lang)}</strong>
              {current.credit && <span className="ml-2 text-stone">{t.gallery.credit}: {current.credit}</span>}
            </figcaption>
          </figure>
        )}
      </Lightbox>
    </div>
  );
}
