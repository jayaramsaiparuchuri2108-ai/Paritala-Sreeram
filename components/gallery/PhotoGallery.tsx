"use client";

import { motion } from "motion/react";
import { Search, Star, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { Reveal } from "@/components/animations/Reveal";
import { PhotoViewer } from "@/components/gallery/PhotoViewer";
import { EmptyState } from "@/components/shared/EmptyState";
import { useLang } from "@/components/shared/Providers";
import { formatDate, pick } from "@/lib/i18n";
import { ratioOf } from "@/lib/photos";
import { GALLERY_CATEGORIES, type GalleryCategory, type GalleryPhoto } from "@/types";

const PAGE = 12;

export function PhotoGallery({ photos, initialId }: { photos: GalleryPhoto[]; /** Photograph to open straight away (from a shared ?photo= link). */ initialId?: string }) {
  const { lang, t } = useLang();
  const [category, setCategory] = useState<"all" | GalleryCategory>("all");
  const [query, setQuery] = useState("");
  const [count, setCount] = useState(PAGE);
  const [activeId, setActiveId] = useState<string | null>(() => (initialId && photos.some((p) => p.id === initialId) ? initialId : null));
  const opener = useRef<HTMLElement | null>(null);

  // Featured photographs lead; otherwise the admin's order is kept.
  const ordered = useMemo(() => [...photos].sort((a, b) => Number(b.featured) - Number(a.featured)), [photos]);

  const counts = useMemo(() => {
    const m = new Map<GalleryCategory, number>();
    for (const p of photos) m.set(p.category, (m.get(p.category) ?? 0) + 1);
    return m;
  }, [photos]);
  const categories = GALLERY_CATEGORIES.filter((c) => counts.has(c));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ordered.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!q) return true;
      const hay = [p.title.en, p.title.te, p.caption?.en, p.caption?.te, p.alt.en, p.alt.te, p.credit, t.gallery.cat[p.category]]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [ordered, category, query, t.gallery.cat]);

  const shown = filtered.slice(0, count);
  const activeIndex = activeId ? filtered.findIndex((p) => p.id === activeId) : -1;

  function open(id: string, el: HTMLElement | null) {
    opener.current = el;
    setActiveId(id);
    window.history.replaceState(null, "", `?photo=${encodeURIComponent(id)}`);
  }
  function close() {
    setActiveId(null);
    window.history.replaceState(null, "", window.location.pathname);
    opener.current?.focus();
  }
  function step(delta: number) {
    if (filtered.length === 0 || activeIndex < 0) return;
    const next = filtered[(activeIndex + delta + filtered.length) % filtered.length];
    setActiveId(next.id);
    window.history.replaceState(null, "", `?photo=${encodeURIComponent(next.id)}`);
  }

  if (photos.length === 0) return <EmptyState>{t.gallery.emptyPhotos}</EmptyState>;

  const chip = (value: "all" | GalleryCategory, label: string, n: number) => (
    <button
      key={value}
      type="button"
      role="tab"
      aria-selected={category === value}
      onClick={() => {
        setCategory(value);
        setCount(PAGE);
      }}
      className={`relative border border-ink px-4 py-2 text-[13px] font-semibold transition-colors ${category === value ? "text-brand" : "hover:bg-ink/5"}`}
    >
      {category === value && <motion.span layoutId="photo-chip" className="absolute inset-0 -z-10 bg-ink" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
      <span className="relative">
        {label} <span className={category === value ? "text-brand/70" : "text-stone"}>{n}</span>
      </span>
    </button>
  );

  return (
    <div>
      <div className="mb-8 grid gap-5 md:mb-10 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t.gallery.category}>
          {chip("all", t.common.all, photos.length)}
          {categories.map((c) => chip(c, t.gallery.cat[c], counts.get(c) ?? 0))}
        </div>
        <div role="search" className="relative">
          <label htmlFor="gallery-search" className="sr-only">
            {t.gallery.searchLabel}
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" aria-hidden />
          <input
            id="gallery-search"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCount(PAGE);
            }}
            placeholder={t.gallery.searchPlaceholder}
            className="w-full border border-ink bg-white py-2.5 pl-10 pr-10 text-sm outline-none focus:ring-4 focus:ring-brand [&::-webkit-search-cancel-button]:appearance-none"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label={t.nav.close} className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center hover:bg-brand">
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      </div>

      <p className="mb-6 text-[13px] font-semibold text-stone" role="status" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? t.gallery.countOne : t.gallery.count}
      </p>

      {filtered.length === 0 ? (
        <EmptyState>{t.common.noResults}</EmptyState>
      ) : (
        <ul className="columns-1 gap-5 min-[560px]:columns-2 lg:columns-3 lg:gap-6">
          {shown.map((p, i) => {
            const date = p.date ? formatDate(p.date, lang) : "";
            return (
              <Reveal as="li" key={p.id} delay={(i % 3) * 0.06} y={20} className="mb-5 break-inside-avoid lg:mb-6">
                <button
                  type="button"
                  onClick={(e) => open(p.id, e.currentTarget)}
                  aria-label={pick(p.title, lang)}
                  className="zoom-img group relative block w-full overflow-hidden bg-ink text-left focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  style={{ aspectRatio: ratioOf(p) }}
                >
                  <Image
                    src={p.image}
                    alt={pick(p.alt, lang) || pick(p.title, lang)}
                    fill
                    loading={i < 2 ? "eager" : "lazy"}
                    sizes="(max-width: 559px) 100vw, (max-width: 1023px) 50vw, 33vw"
                    className="object-cover"
                  />
                  {p.featured && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 bg-brand px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-ink">
                      <Star className="h-3 w-3 fill-ink" aria-hidden /> {t.gallery.featured}
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 translate-y-1 border-t-2 border-brand bg-gradient-to-t from-ink via-ink/90 to-ink/75 p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 max-md:translate-y-0 max-md:opacity-100 pointer-coarse:translate-y-0 pointer-coarse:opacity-100">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
                      {t.gallery.cat[p.category]}
                      {date && ` · ${date}`}
                    </span>
                    <span className="mt-1 block font-display text-lg font-semibold leading-snug text-white">{pick(p.title, lang)}</span>
                  </span>
                </button>
              </Reveal>
            );
          })}
        </ul>
      )}

      {count < filtered.length && (
        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={() => setCount((c) => c + PAGE)}
            className="bg-ink px-8 py-3.5 text-[13px] font-bold uppercase tracking-[0.14em] text-brand transition-colors hover:bg-brand hover:text-ink hover:outline hover:outline-1 hover:outline-ink"
          >
            {t.common.loadMore}
          </button>
          <p className="mt-3 text-xs text-stone">
            {shown.length} / {filtered.length}
          </p>
        </div>
      )}

      <PhotoViewer photos={filtered} index={activeIndex} onClose={close} onStep={step} />
    </div>
  );
}
