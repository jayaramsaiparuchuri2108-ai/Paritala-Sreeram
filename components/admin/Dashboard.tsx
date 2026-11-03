"use client";

import { Download, FileImage, Layers, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, useAdmin } from "@/components/admin/AdminProvider";
import { useLang } from "@/components/shared/Providers";
import { pick } from "@/lib/i18n";
import type { Bi } from "@/types";

interface Stats {
  counts: Record<string, { total: number; published: number }>;
  postersByCategory: { id: string; name: Bi; count: number }[];
  topPosters: { id: string; title: Bi; downloads: number }[];
  totalDownloads: number;
}

const sectionLabel: Record<string, { en: string; te: string; href: string }> = {
  posters: { en: "Posters", te: "పోస్టర్లు", href: "/admin/posters" },
  activities: { en: "Activities", te: "కార్యక్రమాలు", href: "/admin/activities" },
  timeline: { en: "Timeline", te: "కాలక్రమం", href: "/admin/timeline" },
  bio: { en: "Biography", te: "జీవిత చరిత్ర", href: "/admin/biography" },
  gallery: { en: "Photos", te: "ఫోటోలు", href: "/admin/gallery" },
  instagram: { en: "Instagram", te: "ఇన్‌స్టా", href: "/admin/instagram" },
  videos: { en: "Videos", te: "వీడియోలు", href: "/admin/videos" },
  updates: { en: "Updates", te: "సమాచారం", href: "/admin/updates" },
  electoral: { en: "Electoral", te: "ఎన్నికలు", href: "/admin/electoral" },
};

function BarChart({ data }: { data: { label: string; value: number; sub?: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const rowH = 34;
  return (
    <svg role="img" aria-label="Bar chart" viewBox={`0 0 520 ${data.length * rowH + 8}`} className="w-full">
      {data.map((d, i) => {
        const w = (d.value / max) * 330;
        const y = i * rowH + 4;
        return (
          <g key={d.label}>
            <text x="0" y={y + 19} fontSize="13" fontWeight="700" fill="#171717">{d.label}</text>
            <rect x="140" y={y + 4} width="340" height="18" rx="9" fill="#efeadb" />
            <rect x="140" y={y + 4} width={Math.max(w, d.value ? 12 : 0)} height="18" rx="9" fill="#f5d51c" stroke="#171717" strokeWidth="2" />
            <text x="490" y={y + 19} fontSize="13" fontWeight="800" fill="#171717">{d.value}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function Dashboard() {
  const { api, email, cloud } = useAdmin();
  const { lang, t } = useLang();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Stats>("/stats").then(setStats).catch((e) => setError(e instanceof ApiError ? e.message : t.admin.error));
  }, [api, t.admin.error]);

  if (error) return <p role="alert" className="rounded-lg bg-red-50 p-4 font-bold text-red-800">{error}</p>;
  if (!stats) return <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const rows = Object.keys(sectionLabel).map((k) => ({ key: k, ...sectionLabel[k], ...(stats.counts[k] ?? { total: 0, published: 0 }) }));
  const total = rows.reduce((n, r) => n + r.total, 0);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Layers, label: t.admin.totalItems, value: total },
          { icon: FileImage, label: t.admin.posters, value: stats.counts.posters?.total ?? 0 },
          { icon: Download, label: t.posters.downloads, value: stats.totalDownloads },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl border-2 border-ink bg-white p-5 shadow-[5px_5px_0_0_#f5d51c]">
            <Icon className="mb-3 h-5 w-5" />
            <p className="font-display text-5xl leading-none">{value}</p>
            <p className="mt-1 text-sm font-bold text-stone">{label}</p>
          </div>
        ))}
        <div className="rounded-2xl border-2 border-ink bg-ink p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">{t.admin.storage}</p>
          <p className="mt-2 font-extrabold">{cloud ? t.admin.storageCloud : t.admin.storageLocal}</p>
          <p className="mt-3 truncate text-xs text-white/60">{email}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border-2 border-ink bg-white p-5">
          <h2 className="mb-4 font-display text-2xl uppercase">{t.admin.itemsPerSection}</h2>
          <BarChart data={rows.map((r) => ({ label: lang === "te" ? r.te : r.en, value: r.total }))} />
          <ul className="mt-4 flex flex-wrap gap-2">
            {rows.map((r) => (
              <li key={r.key}>
                <Link href={r.href} className="inline-block rounded-full border-2 border-ink px-3 py-1 text-xs font-bold hover:bg-brand">
                  {lang === "te" ? r.te : r.en} · {r.published}/{r.total}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border-2 border-ink bg-white p-5">
            <h2 className="mb-4 font-display text-2xl uppercase">{t.admin.postersByCategory}</h2>
            {stats.postersByCategory.length === 0 ? (
              <p className="text-sm text-stone">{t.admin.noItems}</p>
            ) : (
              <BarChart data={stats.postersByCategory.map((c) => ({ label: pick(c.name, lang), value: c.count }))} />
            )}
          </section>
          <section className="rounded-2xl border-2 border-ink bg-white p-5">
            <h2 className="mb-3 font-display text-2xl uppercase">{t.admin.topPosters}</h2>
            {stats.topPosters.length === 0 ? (
              <p className="text-sm text-stone">{t.admin.noItems}</p>
            ) : (
              <ol className="divide-y-2 divide-line">
                {stats.topPosters.map((p, i) => (
                  <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="font-bold">{i + 1}. {pick(p.title, lang)}</span>
                    <span className="rounded-full bg-brand px-3 py-0.5 font-bold">↓ {p.downloads}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
