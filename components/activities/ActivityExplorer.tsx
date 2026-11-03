"use client";

import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, ExternalLink, MapPin } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/EmptyState";
import { useLang } from "@/components/shared/Providers";
import { ACTIVITY_CATEGORIES, type Activity } from "@/types";
import { formatDate, pick } from "@/lib/i18n";

export function ActivityCard({ activity }: { activity: Activity }) {
  const { lang, t } = useLang();
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border-2 border-ink bg-white transition-shadow hover:shadow-[8px_8px_0_0_#171717]">
      {activity.image ? (
        <div className="zoom-img relative aspect-[16/10] overflow-hidden border-b-2 border-ink">
          <Image src={activity.image} alt={pick(activity.imageAlt, lang) || pick(activity.title, lang)} fill loading="lazy" sizes="(max-width: 768px) 100vw, 400px" className="object-cover" />
        </div>
      ) : (
        <div className="h-3 border-b-2 border-ink [background-image:repeating-linear-gradient(-45deg,#171717_0_8px,#f5d51c_8px_20px)]" />
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <span className="self-start rounded-full bg-brand px-3 py-1 text-xs font-bold">{t.activities.cat[activity.category]}</span>
        <h3 className="text-xl font-extrabold leading-snug">{pick(activity.title, lang)}</h3>
        <p className="text-sm text-ink/75">{pick(activity.description, lang)}</p>
        <div className="mt-auto flex flex-col gap-1.5 pt-2 text-xs text-stone">
          {activity.date && (
            <span className="inline-flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" />{formatDate(activity.date, lang)}</span>
          )}
          {activity.location && pick(activity.location, lang) && (
            <span className="inline-flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{pick(activity.location, lang)}</span>
          )}
          {activity.sourceUrl && (
            <a href={activity.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-bold text-ink hover:underline">
              <ExternalLink className="h-3.5 w-3.5" />
              {t.common.source}: {activity.sourceName ?? new URL(activity.sourceUrl).hostname}
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
            className="relative rounded-full border-2 border-ink px-4 py-2 text-sm font-bold"
          >
            {category === c && <motion.span layoutId="activity-chip" className="absolute inset-0 -z-10 rounded-full bg-brand" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
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
