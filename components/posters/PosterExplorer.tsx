"use client";

import { AnimatePresence, motion } from "motion/react";
import { Download, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PosterActions } from "@/components/posters/PosterActions";
import { EmptyState } from "@/components/shared/EmptyState";
import { Lightbox } from "@/components/shared/Lightbox";
import { useLang } from "@/components/shared/Providers";
import { formatDate, pick } from "@/lib/i18n";
import type { Poster, PosterCategory } from "@/types";

export function PosterCard({ poster, onOpen, priority }: { poster: Poster; onOpen?: () => void; priority?: boolean }) {
  const { lang, t } = useLang();
  const title = pick(poster.title, lang);
  const inner = (
    <>
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image
          src={poster.image}
          alt={pick(poster.alt, lang) || title}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover"
        />
        <span className="absolute inset-0 flex items-end bg-gradient-to-t from-ink/80 via-transparent to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-brand">
            <Download className="h-4 w-4" /> {t.common.viewPoster}
          </span>
        </span>
      </div>
      <div className="border-t-2 border-ink p-3">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug">{title}</h3>
      </div>
    </>
  );
  const cls = "zoom-img group block w-full overflow-hidden rounded-xl border-2 border-ink bg-white text-left transition-shadow hover:shadow-[6px_6px_0_0_#171717]";
  return onOpen ? (
    <button type="button" onClick={onOpen} className={cls}>
      {inner}
    </button>
  ) : (
    <Link href={`/posters/${poster.id}`} className={cls}>
      {inner}
    </Link>
  );
}

export function PosterExplorer({ posters, categories }: { posters: Poster[]; categories: PosterCategory[] }) {
  const { lang, t } = useLang();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const usedCategories = useMemo(() => categories.filter((c) => posters.some((p) => p.category === c.id)), [categories, posters]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posters.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!q) return true;
      const cat = categories.find((c) => c.id === p.category);
      const hay = [p.title.en, p.title.te, ...p.tags, cat?.name.en, cat?.name.te].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [posters, categories, query, category]);

  const latest = useMemo(() => [...posters].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4), [posters]);
  const open = posters.find((p) => p.id === openId) ?? null;
  const idx = open ? filtered.findIndex((p) => p.id === open.id) : -1;
  const step = (d: number) => {
    if (filtered.length === 0 || idx < 0) return;
    setOpenId(filtered[(idx + d + filtered.length) % filtered.length].id);
  };

  if (posters.length === 0) return <EmptyState>{t.posters.empty}</EmptyState>;

  return (
    <div>
      {latest.length > 0 && !query && category === "all" && (
        <section className="mb-14" aria-labelledby="latest-posters">
          <h2 id="latest-posters" className="mb-5 font-display text-3xl uppercase">{t.posters.latest}</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {latest.map((p, i) => (
              <PosterCard key={p.id} poster={p} priority={i < 2} onOpen={() => setOpenId(p.id)} />
            ))}
          </div>
        </section>
      )}

      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t.posters.category}>
          {[{ id: "all", name: { en: t.common.all, te: t.common.all } }, ...usedCategories].map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={category === c.id}
              onClick={() => setCategory(c.id)}
              className="relative rounded-full border-2 border-ink px-4 py-2 text-sm font-bold"
            >
              {category === c.id && <motion.span layoutId="poster-chip" className="absolute inset-0 -z-10 rounded-full bg-brand" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <span className="relative">{pick(c.name, lang)}</span>
            </button>
          ))}
        </div>
        <label className="relative block w-full md:w-72">
          <span className="sr-only">{t.common.search}</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.posters.searchPlaceholder}
            className="w-full rounded-full border-2 border-ink bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-4 focus:ring-brand"
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState>{t.common.noResults}</EmptyState>
      ) : (
        <motion.ul layout className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((p, i) => (
              <motion.li
                key={p.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: Math.min(i, 8) * 0.04 }}
              >
                <PosterCard poster={p} onOpen={() => setOpenId(p.id)} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      <Lightbox open={open !== null} onClose={() => setOpenId(null)} label={open ? pick(open.title, lang) : ""} onPrev={() => step(-1)} onNext={() => step(1)}>
        {open && (
          <div className="grid md:grid-cols-[minmax(0,1fr)_340px]">
            <div className="relative aspect-[4/5] bg-ink md:aspect-auto md:min-h-[70vh]">
              <Image src={open.image} alt={pick(open.alt, lang) || pick(open.title, lang)} fill sizes="(max-width: 768px) 100vw, 640px" className="object-contain" />
            </div>
            <div className="flex flex-col gap-5 p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone">
                  {pick(categories.find((c) => c.id === open.category)?.name, lang)}
                </p>
                <h2 className="mt-2 font-display text-3xl uppercase leading-tight">{pick(open.title, lang)}</h2>
                <p className="mt-2 text-xs text-stone">
                  {t.posters.created}: {formatDate(open.createdAt, lang)} · {open.downloads} {t.posters.downloads}
                </p>
              </div>
              <PosterActions id={open.id} title={pick(open.title, lang)} />
              <Link href={`/posters/${open.id}`} className="text-sm font-bold underline decoration-brand decoration-2 underline-offset-4">
                {t.common.readMore}
              </Link>
            </div>
          </div>
        )}
      </Lightbox>
      {query && (
        <button onClick={() => setQuery("")} className="mt-6 inline-flex items-center gap-2 text-sm font-bold">
          <X className="h-4 w-4" /> {t.common.all}
        </button>
      )}
    </div>
  );
}
