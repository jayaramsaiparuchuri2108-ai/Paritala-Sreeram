"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, MapPin } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/EmptyState";
import { useLang } from "@/components/shared/Providers";
import { ACTIVITY_CATEGORIES, type Activity } from "@/types";
import { formatDate, pick } from "@/lib/i18n";

/** Newspaper-style card: photograph (or a typographic date block when none is available), kicker, headline, summary. */
export function ActivityCard({ activity }: { activity: Activity }) {
  const { lang, t } = useLang();
  const title = pick(activity.title, lang);
  const date = activity.date ? new Date(activity.date) : null;
  const validDate = date && !Number.isNaN(date.getTime()) ? date : null;
  const location = activity.location ? pick(activity.location, lang) : "";

  return (
    <article className="group flex h-full flex-col border border-ink/15 bg-white transition-colors duration-300 hover:border-ink">
      <div className="zoom-img relative aspect-[16/10] overflow-hidden bg-ink">
        {activity.image ? (
          <Image src={activity.image} alt={pick(activity.imageAlt, lang) || title} fill loading="lazy" sizes="(max-width: 768px) 100vw, 420px" className="object-cover" />
        ) : (
          <div aria-hidden className="absolute inset-0 flex items-end justify-between bg-ink p-6 text-white">
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-brand" />
            <div className="absolute inset-3 border border-white/15" />
            <div className="relative">
              <p className="font-display text-6xl font-bold leading-none text-brand md:text-7xl">{validDate ? validDate.getUTCDate() : "·"}</p>
              {validDate && <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">{formatDate(activity.date!, lang).replace(/^\d+\s*/, "")}</p>}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold uppercase tracking-[0.18em]">
          <span className="bg-brand px-2 py-1 text-ink">{t.activities.cat[activity.category]}</span>
          {activity.date && <span className="text-stone">{formatDate(activity.date, lang)}</span>}
        </p>
        <h3 className="font-display text-xl font-bold leading-snug md:text-2xl">{title}</h3>
        <p className="text-sm leading-relaxed text-stone">{pick(activity.description, lang)}</p>
        <div className="mt-auto flex flex-col gap-2 pt-3 text-xs text-stone">
          {location && (
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {location}
            </span>
          )}
          {activity.sourceUrl && (
            <a href={activity.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink">
              <span className="link-line">{t.common.readMore}</span>
              <span className="text-stone">· {activity.sourceName ?? new URL(activity.sourceUrl).hostname}</span>
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export function ActivityExplorer({ activities }: { activities: Activity[] }) {
  const { t } = useLang();
  const [category, setCategory] = useState<string>("all");
  const filtered = useMemo(() => activities.filter((a) => category === "all" || a.category === category), [activities, category]);

  return (
    <div>
      <div className="mb-10 flex flex-wrap gap-2" role="tablist" aria-label={t.posters.category}>
        {["all", ...ACTIVITY_CATEGORIES].map((c) => (
          <button
            key={c}
            role="tab"
            aria-selected={category === c}
            onClick={() => setCategory(c)}
            className={`relative border border-ink px-4 py-2 text-[13px] font-semibold transition-colors ${category === c ? "text-brand" : "hover:bg-ink/5"}`}
          >
            {category === c && <motion.span layoutId="activity-chip" className="absolute inset-0 -z-10 bg-ink" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <span className="relative">{c === "all" ? t.common.all : t.activities.cat[c as keyof typeof t.activities.cat]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState>{category === "all" ? t.common.comingSoon : t.activities.emptyCategory}</EmptyState>
      ) : (
        <motion.ul layout className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((a, i) => (
              <motion.li key={a.id} layout initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4, delay: Math.min(i, 6) * 0.05 }}>
                <ActivityCard activity={a} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}
