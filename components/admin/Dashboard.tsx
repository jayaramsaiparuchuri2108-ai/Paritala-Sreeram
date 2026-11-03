"use client";

import {
  ArrowUpRight,
  CircleAlert,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Images,
  Layers,
  Palette,
  PenLine,
  ShieldCheck,
  Upload,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ApiError, useAdmin } from "@/components/admin/AdminProvider";
import { fill, timeAgo, useAdminT } from "@/components/admin/i18n";
import { Badge, Button, Card, CardHeader, EmptyState, Skeleton, cx } from "@/components/admin/ui";
import { useLang } from "@/components/shared/Providers";
import { pick } from "@/lib/i18n";
import type { Bi } from "@/types";

interface PhotoCard {
  id: string;
  title: Bi;
  image: string;
  category: string;
  published: boolean;
  permission: "authorised" | "pending";
  at: string | null;
}

interface Stats {
  counts: Record<string, { total: number; published: number }>;
  postersByCategory: { id: string; name: Bi; count: number }[];
  topPosters: { id: string; title: Bi; downloads: number }[];
  totalDownloads: number;
  gallery: {
    total: number;
    live: number;
    drafts: number;
    awaitingPermission: number;
    held: number;
    featured: number;
    recent: PhotoCard[];
    pending: PhotoCard[];
  };
  recent: { collection: string; id: string; title: unknown; published: boolean; at: string; created: boolean }[];
}

/** collection → where it is managed. Only sections that exist are listed. */
const sections: { key: string; href: string; label: (t: ReturnType<typeof useLang>["t"]) => string }[] = [
  { key: "updates", href: "/admin/updates", label: (t) => t.admin.updates },
  { key: "activities", href: "/admin/activities", label: (t) => t.admin.activities },
  { key: "timeline", href: "/admin/timeline", label: (t) => t.admin.timeline },
  { key: "bio", href: "/admin/biography", label: (t) => t.admin.biography },
  { key: "electoral", href: "/admin/electoral", label: (t) => t.admin.electoral },
  { key: "focus", href: "/admin/focus", label: (t) => t.admin.focus },
  { key: "gallery", href: "/admin/gallery", label: (t) => t.admin.gallery },
  { key: "posters", href: "/admin/posters", label: (t) => t.admin.posters },
  { key: "posterCategories", href: "/admin/categories", label: (t) => t.admin.categories },
  { key: "videos", href: "/admin/videos", label: (t) => t.admin.videos },
  { key: "instagram", href: "/admin/instagram", label: (t) => t.admin.instagram },
];

/** Best-effort readable name for a stored item of any collection. */
function itemTitle(raw: unknown, lang: "en" | "te", fallback: string): string {
  if (raw && typeof raw === "object" && "en" in raw) return pick(raw as Bi, lang) || fallback;
  if (typeof raw === "string" && raw) return raw;
  return fallback;
}

function Tile({ icon: Icon, label, value, note, dark }: { icon: LucideIcon; label: string; value: number | string; note?: string; dark?: boolean }) {
  return (
    <div className={cx("relative overflow-hidden border p-5", dark ? "border-ink bg-ink text-white" : "border-ink/15 bg-white")}>
      <span aria-hidden className={cx("absolute inset-x-0 top-0 h-1", dark ? "bg-brand" : "bg-ink")} />
      <Icon className={cx("mb-4 h-5 w-5", dark ? "text-brand" : "text-ink")} aria-hidden />
      <p className="font-display text-4xl leading-none md:text-5xl">{value}</p>
      <p className={cx("mt-2 text-[11px] font-bold uppercase tracking-[0.14em]", dark ? "text-white/65" : "text-stone")}>{label}</p>
      {note && <p className={cx("mt-1 text-xs", dark ? "text-white/50" : "text-stone")}>{note}</p>}
    </div>
  );
}

function Thumb({ photo, lang }: { photo: PhotoCard; lang: "en" | "te" }) {
  return (
    <Link href="/admin/gallery" className="group block">
      <div className="relative aspect-square overflow-hidden border border-ink/15 bg-cream">
        <Image src={photo.image} alt="" fill sizes="(max-width: 768px) 45vw, 180px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        <span className="absolute left-1.5 top-1.5">
          <Badge tone={photo.published && photo.permission === "authorised" ? "green" : photo.permission !== "authorised" ? "yellow" : "neutral"}>
            {photo.permission !== "authorised" ? "⏳" : photo.published ? "●" : "○"}
          </Badge>
        </span>
      </div>
      <p className="mt-1.5 truncate text-xs font-semibold group-hover:underline">{pick(photo.title, lang) || "—"}</p>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true">
      <Skeleton className="h-40 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

export function Dashboard() {
  const { api, email, cloud } = useAdmin();
  const { lang, t } = useLang();
  const a = useAdminT();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  const [reloadKey, setReloadKey] = useState(0);
  const load = useCallback(() => {
    setError("");
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let alive = true;
    api<Stats>("/stats")
      .then((s) => alive && setStats(s))
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : t.admin.error));
    return () => {
      alive = false;
    };
  }, [api, t.admin.error, reloadKey]);

  if (error)
    return (
      <EmptyState icon={<CircleAlert className="h-5 w-5" aria-hidden />} title={a.loadFailed} action={<Button onClick={load}>{a.retry}</Button>}>
        {error}
      </EmptyState>
    );
  if (!stats) return <DashboardSkeleton />;

  const rows = sections.map((s) => ({ ...s, ...(stats.counts[s.key] ?? { total: 0, published: 0 }) }));
  const total = rows.reduce((n, r) => n + r.total, 0);
  const published = rows.reduce((n, r) => n + r.published, 0);
  const g = stats.gallery;
  const today = new Date().toLocaleDateString(lang === "te" ? "te-IN" : "en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const name = email.split("@")[0];

  const actions: { href: string; icon: LucideIcon; title: string; hint: string; external?: boolean }[] = [
    { href: "/admin/gallery", icon: Upload, title: a.uploadPhotos, hint: a.uploadPhotosHint },
    { href: "/admin/updates", icon: PenLine, title: a.createContent, hint: a.createContentHint },
    { href: "/admin/designer", icon: Palette, title: a.designPoster, hint: a.designPosterHint },
    { href: "/", icon: ExternalLink, title: a.openWebsite, hint: a.openWebsiteHint, external: true },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <section className="on-dark relative overflow-hidden bg-ink text-white">
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-brand" />
        <div className="flex flex-wrap items-end justify-between gap-6 px-6 py-8 md:px-10 md:py-10">
          <div className="max-w-2xl">
            <p className="eyebrow mb-3 text-brand">{today}</p>
            <h1 className="font-display text-3xl leading-tight md:text-5xl">
              {a.welcomeBack}, <span className="text-brand">{name}</span>
            </h1>
            <p className="mt-3 text-sm text-white/70 md:text-base">{a.dashboardIntro}</p>
          </div>
          <div className="flex items-center gap-3 border border-white/15 bg-white/[0.06] p-3 pr-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center bg-brand font-display text-xl text-ink" aria-hidden>
              {(email[0] ?? "A").toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">{a.administrator}</p>
              <p className="max-w-[16rem] truncate text-sm font-semibold" title={email}>
                {email}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/55">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> {cloud ? t.admin.storageCloud : t.admin.storageLocal}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section aria-labelledby="qa">
        <h2 id="qa" className="eyebrow mb-3 text-stone">
          {a.quickActions}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {actions.map(({ href, icon: Icon, title, hint, external }, i) => (
            <Link
              key={href}
              href={href}
              target={external ? "_blank" : undefined}
              className={cx(
                "group flex items-center gap-4 border p-4 transition-colors",
                i === 0 ? "border-ink bg-brand text-ink hover:bg-ink hover:text-brand" : "border-ink/15 bg-white hover:border-ink hover:bg-brand",
              )}
            >
              <span className={cx("grid h-11 w-11 shrink-0 place-items-center border", i === 0 ? "border-ink/40" : "border-ink/20 bg-cream group-hover:border-ink")}>
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">{title}</span>
                <span className="block truncate text-xs opacity-70">{hint}</span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 opacity-50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden />
            </Link>
          ))}
        </div>
      </section>

      {/* Numbers */}
      <section aria-label={a.overview} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Tile icon={Layers} label={a.totalContent} value={total} />
        <Tile icon={FileText} label={a.livePublished} value={published} />
        <Tile icon={PenLine} label={a.drafts} value={total - published} />
        <Tile icon={Images} label={a.photosLive} value={g.live} note={fill(a.photoCount, { n: g.total })} />
        <Tile icon={Download} label={a.posterDownloads} value={stats.totalDownloads} dark />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Recent photographs */}
          <Card>
            <CardHeader title={a.recentPhotos} action={<Link href="/admin/gallery" className="link-line text-xs font-bold uppercase tracking-[0.12em]">{a.seeAll}</Link>} />
            <div className="p-5">
              {g.recent.length === 0 ? (
                <EmptyState icon={<Images className="h-5 w-5" aria-hidden />} title={a.recentPhotosEmpty} action={<Link href="/admin/gallery" className="inline-block"><Button variant="yellow" icon={<Upload className="h-4 w-4" aria-hidden />}>{a.uploadPhotos}</Button></Link>}>
                  {a.recentPhotosHelp}
                </EmptyState>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {g.recent.map((p) => (
                    <Thumb key={p.id} photo={p} lang={lang} />
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Recent activity */}
          <Card>
            <CardHeader title={a.recentActivity} />
            {stats.recent.length === 0 ? (
              <div className="p-5">
                <EmptyState icon={<Clock className="h-5 w-5" aria-hidden />} title={a.recentActivityEmpty}>
                  {a.recentActivityHelp}
                </EmptyState>
              </div>
            ) : (
              <ul className="divide-y divide-ink/10">
                {stats.recent.map((r) => {
                  const section = sections.find((s) => s.key === r.collection);
                  return (
                    <li key={`${r.collection}-${r.id}`}>
                      <Link href={section?.href ?? "/admin"} className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-brand/20">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{itemTitle(r.title, lang, section ? section.label(t) : r.collection)}</span>
                          <span className="block text-xs text-stone">
                            {section?.label(t)} · {r.created ? a.created : a.updated} {timeAgo(r.at, lang)}
                          </span>
                        </span>
                        <Badge tone={r.published ? "green" : "neutral"}>{r.published ? t.admin.published : t.admin.draft}</Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {/* Pending approvals */}
          <Card>
            <CardHeader
              title={a.pendingApprovals}
              action={g.awaitingPermission > 0 ? <Badge tone="yellow">{g.awaitingPermission}</Badge> : undefined}
            />
            <div className="p-5">
              {g.pending.length === 0 ? (
                <EmptyState icon={<ShieldCheck className="h-5 w-5" aria-hidden />} title={a.pendingEmpty}>
                  {a.pendingHelp}
                </EmptyState>
              ) : (
                <>
                  <ul className="space-y-3">
                    {g.pending.slice(0, 5).map((p) => (
                      <li key={p.id}>
                        <Link href="/admin/gallery" className="flex items-center gap-3 hover:underline">
                          <span className="relative h-12 w-12 shrink-0 overflow-hidden border border-ink/15 bg-cream">
                            <Image src={p.image} alt="" fill sizes="48px" className="object-cover" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">{pick(p.title, lang) || "—"}</span>
                            <span className="block text-xs text-stone">{a.awaitingPermission}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link href="/admin/gallery" className="mt-4 inline-block text-xs font-bold uppercase tracking-[0.12em]">
                    <span className="link-line">{a.reviewAll}</span>
                  </Link>
                </>
              )}
              {g.held > 0 && <p className="mt-4 border-t border-ink/10 pt-3 text-xs leading-relaxed text-stone">{fill(a.heldBackHelp, { n: g.held })}</p>}
            </div>
          </Card>

          {/* Draft vs published */}
          <Card>
            <CardHeader title={a.contentStatus} />
            <ul className="space-y-3 p-5">
              {rows.map((r) => (
                <li key={r.key}>
                  <Link href={r.href} className="group block">
                    <span className="mb-1 flex items-baseline justify-between text-xs">
                      <span className="font-bold group-hover:underline">{r.label(t)}</span>
                      <span className="text-stone">
                        {r.published}/{r.total}
                      </span>
                    </span>
                    <span className="flex h-2.5 w-full overflow-hidden border border-ink/25 bg-cream" role="img" aria-label={`${r.published} ${t.admin.published}, ${r.total - r.published} ${t.admin.draft}`}>
                      <span className="h-full bg-brand" style={{ width: r.total ? `${(r.published / r.total) * 100}%` : 0 }} />
                      <span className="h-full bg-ink/30" style={{ width: r.total ? `${((r.total - r.published) / r.total) * 100}%` : 0 }} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* Posters — shown only when there is something real to chart */}
      {(stats.counts.posters?.total ?? 0) > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title={a.postersByCategory} />
            <ul className="space-y-3 p-5">
              {(() => {
                const max = Math.max(1, ...stats.postersByCategory.map((c) => c.count));
                return stats.postersByCategory.map((c) => (
                  <li key={c.id}>
                    <span className="mb-1 flex justify-between text-xs">
                      <span className="font-bold">{pick(c.name, lang)}</span>
                      <span className="text-stone">{c.count}</span>
                    </span>
                    <span className="block h-2.5 border border-ink/25 bg-cream">
                      <span className="block h-full bg-brand" style={{ width: `${(c.count / max) * 100}%` }} />
                    </span>
                  </li>
                ));
              })()}
            </ul>
          </Card>
          {stats.totalDownloads > 0 && (
            <Card>
              <CardHeader title={a.mostDownloaded} />
              <ol className="divide-y divide-ink/10">
                {stats.topPosters
                  .filter((p) => p.downloads > 0)
                  .map((p, i) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                      <span className="min-w-0 truncate font-semibold">
                        <span className="mr-2 font-display text-stone">{i + 1}</span>
                        {pick(p.title, lang)}
                      </span>
                      <Badge tone="yellow">
                        <Download className="h-3 w-3" aria-hidden /> {p.downloads}
                      </Badge>
                    </li>
                  ))}
              </ol>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
