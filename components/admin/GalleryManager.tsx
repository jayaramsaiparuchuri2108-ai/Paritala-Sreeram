"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleAlert,
  CopyCheck,
  Eye,
  EyeOff,
  ExternalLink,
  GripVertical,
  ImagePlus,
  Images,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Star,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError, useAdmin } from "@/components/admin/AdminProvider";
import type { FormValue, UploadResult } from "@/components/admin/fields";
import { fill, timeAgo, useAdminT } from "@/components/admin/i18n";
import { ItemEditor, type Item } from "@/components/admin/ItemEditor";
import { Badge, Button, EmptyState, IconButton, PageHeader, Segmented, Skeleton, cx, inputCls, useUi } from "@/components/admin/ui";
import { PhotoViewer } from "@/components/gallery/PhotoViewer";
import { useLang } from "@/components/shared/Providers";
import type { ResourceDef } from "@/lib/admin/resources";
import { formatDate, pick } from "@/lib/i18n";
import { GALLERY_CATEGORIES, type GalleryCategory, type GalleryPhoto } from "@/types";

type Photo = GalleryPhoto;
type StatusFilter = "all" | "live" | "draft" | "pending";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

const isLive = (p: Photo) => p.published && p.permission === "authorised";
const isPending = (p: Photo) => p.permission !== "authorised";

/** "IMG_2041-public_meeting.JPG" -> "IMG 2041 public meeting" (a draft title the admin then edits). */
function draftTitle(filename: string): string {
  return filename.replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120) || "Untitled photograph";
}

const asItem = (p: Photo) => p as unknown as Item;

/** The body of a full-object PUT for an existing photograph (the API replaces the record, so every field is sent). */
function putBody(p: Photo, patch: Partial<Photo>) {
  const { id: _id, ...rest } = p;
  void _id;
  const { createdAt: _c, updatedAt: _u, ...clean } = rest as typeof rest & { createdAt?: string; updatedAt?: string };
  void _c;
  void _u;
  return { ...clean, ...patch };
}

/* ------------------------------------------------------------------ upload */

type QueueStatus = "queued" | "uploading" | "added" | "duplicate" | "error";
interface QueueRow {
  id: number;
  name: string;
  status: QueueStatus;
  message?: string;
  preview: string;
}

function UploadPanel({ existingUrls, onDone }: { existingUrls: string[]; onDone: () => void }) {
  const { api } = useAdmin();
  const { lang, t } = useLang();
  const a = useAdminT();
  const { toast } = useUi();
  const input = useRef<HTMLInputElement>(null);
  const files = useRef(new Map<number, File>());
  const seq = useRef(0);
  const [category, setCategory] = useState<GalleryCategory>("recent");
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  // Free the local preview URLs when the panel goes away.
  const rowsRef = useRef(rows);
  useEffect(() => {
    rowsRef.current = rows;
  });
  useEffect(() => () => rowsRef.current.forEach((r) => r.preview && URL.revokeObjectURL(r.preview)), []);

  const patch = (id: number, p: Partial<QueueRow>) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...p } : r)));

  async function process(batch: { id: number; file: File }[]) {
    setBusy(true);
    const seen = new Set(existingUrls);
    for (const { id, file } of batch) {
      if (!ALLOWED.includes(file.type)) {
        patch(id, { status: "error", message: a.badType });
        continue;
      }
      if (file.size > MAX_BYTES) {
        patch(id, { status: "error", message: a.tooLarge });
        continue;
      }
      patch(id, { status: "uploading", message: undefined });
      try {
        const form = new FormData();
        form.set("file", file);
        form.set("folder", "gallery");
        form.set("category", category);
        form.set("name", draftTitle(file.name));
        const up = await api<UploadResult>("/upload", { method: "POST", form });
        if (up.duplicate && seen.has(up.url)) {
          patch(id, { status: "duplicate", message: a.qDuplicate });
          continue;
        }
        seen.add(up.url);
        await api("/c/gallery", {
          method: "POST",
          body: {
            title: { en: draftTitle(file.name), te: "" },
            caption: { en: "", te: "" },
            category,
            image: up.url,
            width: up.width,
            height: up.height,
            alt: { en: "", te: "" },
            date: "",
            sourceUrl: "",
            credit: "",
            permission: "pending",
            allowDownload: false,
            featured: false,
            published: false,
          },
        });
        files.current.delete(id);
        patch(id, { status: "added" });
      } catch (e) {
        patch(id, { status: "error", message: e instanceof ApiError ? e.message : t.admin.error });
      }
    }
    setBusy(false);
    if (input.current) input.current.value = "";
    onDone();
  }

  function enqueue(list: File[]) {
    if (list.length === 0 || busy) return;
    const batch = list.map((file) => {
      const id = ++seq.current;
      files.current.set(id, file);
      return { id, file };
    });
    setRows((prev) => [
      ...prev.filter((r) => r.status === "error"),
      ...batch.map(({ id, file }) => ({ id, name: file.name, status: "queued" as const, preview: ALLOWED.includes(file.type) ? URL.createObjectURL(file) : "" })),
    ]);
    void process(batch).then(() => toast.info(a.qProcessed.replace("{done}", String(batch.length)).replace("{total}", String(batch.length))));
  }

  function retryFailed() {
    const failed = rows.filter((r) => r.status === "error" && files.current.has(r.id));
    if (!failed.length || busy) return;
    setRows((prev) => prev.map((r) => (failed.some((f) => f.id === r.id) ? { ...r, status: "queued", message: undefined } : r)));
    void process(failed.map((r) => ({ id: r.id, file: files.current.get(r.id)! })));
  }

  function clear() {
    rows.forEach((r) => r.preview && URL.revokeObjectURL(r.preview));
    files.current.clear();
    setRows([]);
  }

  const processed = rows.filter((r) => r.status === "added" || r.status === "duplicate" || r.status === "error").length;
  const added = rows.filter((r) => r.status === "added").length;
  const failed = rows.filter((r) => r.status === "error").length;
  const catLabel = (c: GalleryCategory) => t.gallery.cat[c];

  return (
    <section aria-label={a.uploadTitle} className="mb-8">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          enqueue(Array.from(e.dataTransfer.files));
        }}
        className={cx("border-2 border-dashed px-5 py-6 transition-colors md:px-8", over ? "border-ink bg-brand" : "border-ink/30 bg-white")}
      >
        <div className="flex flex-wrap items-center gap-5">
          <span className={cx("grid h-14 w-14 shrink-0 place-items-center border", over ? "border-ink bg-white" : "border-ink/20 bg-cream")}>
            <UploadCloud className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-[14rem] flex-1">
            <p className="font-display text-xl leading-tight">
              {a.dragHere} <span className="text-stone">{a.orChoose}</span>
            </p>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-stone">
              {a.imageRules}. {a.uploadNote}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.14em] text-stone">{a.addToCategory}</span>
              <select value={category} onChange={(e) => setCategory(e.target.value as GalleryCategory)} disabled={busy} className={cx(inputCls, "w-auto min-w-[12rem]")}>
                {GALLERY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {pick({ en: catLabel(c), te: catLabel(c) }, lang)}
                  </option>
                ))}
              </select>
            </label>
            <Button variant="primary" loading={busy} icon={<ImagePlus className="h-4 w-4" aria-hidden />} onClick={() => input.current?.click()}>
              {busy ? t.admin.uploading : a.uploadPhotos}
            </Button>
          </div>
        </div>
        <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => enqueue(Array.from(e.target.files ?? []))} />
      </div>

      {rows.length > 0 && (
        <div className="border border-t-0 border-ink/15 bg-white p-4 md:p-5" aria-live="polite">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-[12rem] flex-1">
              <p className="mb-1.5 text-xs font-bold">
                {fill(a.qProcessed, { done: processed, total: rows.length })}
                {!busy && added > 0 && <span className="ml-2 font-normal text-stone">· {fill(a.qSummary, { n: added })}</span>}
              </p>
              <div className="h-1.5 w-full overflow-hidden bg-ink/10" role="progressbar" aria-valuemin={0} aria-valuemax={rows.length} aria-valuenow={processed}>
                <div className={cx("h-full transition-[width] duration-300", failed ? "bg-red-600" : "bg-ink")} style={{ width: `${(processed / rows.length) * 100}%` }} />
              </div>
            </div>
            <div className="flex gap-2">
              {failed > 0 && !busy && (
                <Button size="sm" variant="secondary" icon={<RotateCcw className="h-3.5 w-3.5" aria-hidden />} onClick={retryFailed}>
                  {a.retryFailed}
                </Button>
              )}
              {!busy && (
                <Button size="sm" variant="ghost" onClick={clear}>
                  {a.clearList}
                </Button>
              )}
            </div>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((r) => (
              <li key={r.id} className={cx("flex items-center gap-3 border p-2", r.status === "error" ? "border-red-600/50 bg-red-50" : r.status === "added" ? "border-green-700/40 bg-green-50/60" : "border-ink/15")}>
                {r.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.preview} alt="" className="h-12 w-12 shrink-0 object-cover" />
                ) : (
                  <span className="grid h-12 w-12 shrink-0 place-items-center bg-cream text-stone">
                    <ImagePlus className="h-5 w-5" aria-hidden />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold" title={r.name}>
                    {r.name}
                  </p>
                  <p className={cx("flex items-center gap-1.5 text-[11px]", r.status === "error" ? "font-bold text-red-700" : "text-stone")}>
                    {r.status === "uploading" && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
                    {r.status === "added" && <CheckCircle2 className="h-3 w-3 text-green-700" aria-hidden />}
                    {r.status === "duplicate" && <CopyCheck className="h-3 w-3" aria-hidden />}
                    {r.status === "error" && <CircleAlert className="h-3 w-3" aria-hidden />}
                    {r.status === "queued" ? a.qWaiting : r.status === "uploading" ? a.qUploading : r.status === "added" ? a.qAdded : (r.message ?? a.qFailed)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ editor preview column */

function GalleryAside({ form, set, id }: { form: FormValue; set: (patch: FormValue) => void; id?: string }) {
  const { lang } = useLang();
  const a = useAdminT();
  const [viewing, setViewing] = useState(false);
  const title = form.title as { en: string; te: string };
  const alt = form.alt as { en: string; te: string };
  const image = (form.image as string) || "";
  const w = form.width as number | undefined;
  const h = form.height as number | undefined;
  void set;

  const checks = [
    { ok: Boolean(title?.en?.trim() || title?.te?.trim()), label: a.checkTitle },
    { ok: Boolean(alt?.en?.trim() || alt?.te?.trim()), label: a.checkAlt },
    { ok: form.permission === "authorised", label: a.checkPermission },
  ];
  const preview: Photo = {
    id: id ?? "preview",
    published: true,
    order: 0,
    title: title ?? { en: "", te: "" },
    caption: form.caption as Photo["caption"],
    category: (form.category as GalleryCategory) || "recent",
    image,
    width: w,
    height: h,
    alt: alt ?? { en: "", te: "" },
    date: (form.date as string) || undefined,
    sourceUrl: (form.sourceUrl as string) || undefined,
    credit: (form.credit as string) || "",
    permission: form.permission === "authorised" ? "authorised" : "pending",
    allowDownload: Boolean(form.allowDownload),
    featured: Boolean(form.featured),
  };

  return (
    <div className="space-y-4">
      <div className="relative flex min-h-60 items-center justify-center overflow-hidden bg-ink">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={pick(alt, lang)} className="max-h-[22rem] w-auto max-w-full object-contain" />
        ) : (
          <p className="px-6 py-16 text-center text-sm text-white/60">{a.dropImage} {a.browse}</p>
        )}
        {w && h ? <span className="absolute bottom-2 left-2 bg-ink/85 px-2 py-1 text-[11px] font-bold tracking-wider text-brand">{fill(a.pixelSize, { w, h })}</span> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="primary" icon={<Eye className="h-3.5 w-3.5" aria-hidden />} disabled={!image} onClick={() => setViewing(true)}>
          {a.previewPhoto}
        </Button>
        {image && (
          <a href={image} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-ink/30 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] hover:border-ink hover:bg-cream">
            <ExternalLink className="h-3.5 w-3.5" aria-hidden /> Original
          </a>
        )}
      </div>
      <p className="text-xs text-stone">{a.previewHint}</p>

      <div className="border border-ink/15 bg-cream p-4">
        <p className="eyebrow mb-3">{a.checklist}</p>
        <ul className="space-y-2">
          {checks.map((c) => (
            <li key={c.label} className="flex items-center gap-2.5 text-sm">
              <span className={cx("grid h-5 w-5 shrink-0 place-items-center border", c.ok ? "border-ink bg-brand" : "border-ink/30 bg-white")}>{c.ok && <Check className="h-3.5 w-3.5" aria-hidden />}</span>
              <span className={c.ok ? "font-semibold" : "text-stone"}>{c.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <PhotoViewer photos={[preview]} index={viewing ? 0 : -1} onClose={() => setViewing(false)} onStep={() => undefined} />
    </div>
  );
}

/* ------------------------------------------------------------------ tile */

function Tile({
  photo,
  selected,
  onSelect,
  onPreview,
  onEdit,
  onToggle,
  onDelete,
  busy,
  reorder,
  onMove,
  first,
  last,
  dragProps,
  dropping,
}: {
  photo: Photo;
  selected: boolean;
  onSelect: (v: boolean) => void;
  onPreview: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  busy: boolean;
  reorder: boolean;
  onMove: (d: -1 | 1) => void;
  first: boolean;
  last: boolean;
  dragProps: React.HTMLAttributes<HTMLLIElement>;
  dropping: boolean;
}) {
  const { lang, t } = useLang();
  const a = useAdminT();
  const title = pick(photo.title, lang) || "—";
  const held = photo.published && isPending(photo);
  const edited = photo.updatedAt ?? photo.createdAt;

  return (
    <li
      {...dragProps}
      className={cx(
        "group relative flex flex-col border bg-white transition-[box-shadow,border-color,opacity] duration-200",
        selected ? "border-ink shadow-[0_0_0_2px_#FFD600]" : "border-ink/15 hover:border-ink/60 hover:shadow-[0_10px_28px_-14px_rgba(0,0,0,0.45)]",
        dropping && "outline outline-2 -outline-offset-2 outline-brand",
        busy && "opacity-60",
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-cream">
        <button type="button" onClick={onPreview} className="absolute inset-0 block h-full w-full" aria-label={`${a.previewPhoto}: ${title}`}>
          <Image src={photo.image} alt="" fill sizes="(min-width: 1536px) 18vw, (min-width: 1024px) 24vw, (min-width: 640px) 33vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" draggable={false} />
        </button>
        <label className="absolute left-2 top-2 z-10 grid h-8 w-8 cursor-pointer place-items-center bg-white/90 shadow-sm">
          <input type="checkbox" checked={selected} onChange={(e) => onSelect(e.target.checked)} aria-label={title} className="h-4.5 w-4.5 cursor-pointer accent-ink" />
        </label>
        {photo.featured && (
          <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center bg-brand" title={a.badgeFeatured}>
            <Star className="h-4 w-4 fill-ink" aria-label={a.badgeFeatured} />
          </span>
        )}
        {reorder && (
          <span className="pointer-events-none absolute bottom-2 right-2 grid h-7 w-7 cursor-grab place-items-center bg-ink/80 text-white opacity-0 transition-opacity group-hover:opacity-100" aria-hidden title={a.dragReorder}>
            <GripVertical className="h-4 w-4" />
          </span>
        )}
      </div>

      <div className="flex-1 space-y-2 p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug" title={title}>
          {title}
        </p>
        <p className="truncate text-xs text-stone">
          {t.gallery.cat[photo.category]}
          {photo.date ? ` · ${formatDate(photo.date, lang)}` : ""}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {isLive(photo) ? <Badge tone="green">{a.badgeLive}</Badge> : held ? <Badge tone="red">{a.badgeHeld}</Badge> : <Badge>{a.badgeDraft}</Badge>}
          {isPending(photo) && <Badge tone="yellow">{a.badgePending}</Badge>}
          {photo.allowDownload && <Badge tone="neutral">{a.badgeDownload}</Badge>}
        </div>
        {edited && <p className="text-[11px] text-stone">{fill(a.lastEdited, { when: timeAgo(edited, lang) })}</p>}
      </div>

      <div className="flex items-center border-t border-ink/10 px-1 py-1">
        {reorder && (
          <>
            <IconButton label={a.moveEarlier} className="h-8 w-8" disabled={first} onClick={() => onMove(-1)}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </IconButton>
            <IconButton label={a.moveLater} className="h-8 w-8" disabled={last} onClick={() => onMove(1)}>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </IconButton>
          </>
        )}
        <span className="flex-1" />
        <IconButton label={photo.published ? a.unpublishItem : a.publishItem} className="h-8 w-8" disabled={busy} onClick={onToggle}>
          {photo.published ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </IconButton>
        <IconButton label={t.admin.edit} className="h-8 w-8" onClick={onEdit}>
          <Pencil className="h-4 w-4" aria-hidden />
        </IconButton>
        <IconButton label={t.admin.delete} tone="danger" className="h-8 w-8" disabled={busy} onClick={onDelete}>
          <Trash2 className="h-4 w-4" aria-hidden />
        </IconButton>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ manager */

export function GalleryManager({ resource }: { resource: ResourceDef }) {
  const { api } = useAdmin();
  const { lang, t } = useLang();
  const a = useAdminT();
  const { toast, confirm } = useUi();
  const [items, setItems] = useState<Photo[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | GalleryCategory>("all");
  const [status, setStatus] = useState<StatusFilter>(() => {
    if (typeof window === "undefined") return "all";
    const s = new URLSearchParams(window.location.search).get("status");
    return s === "live" || s === "draft" || s === "pending" ? s : "all";
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Photo | "new" | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);
  const load = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let alive = true;
    api<{ items: Photo[] }>(`/c/${resource.collection}`)
      .then((res) => {
        if (!alive) return;
        setItems(res.items);
        setError("");
      })
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : t.admin.error));
    return () => {
      alive = false;
    };
  }, [api, resource, t.admin.error, reloadKey]);

  const counts = useMemo(
    () => ({
      all: items?.length ?? 0,
      live: items?.filter(isLive).length ?? 0,
      draft: items?.filter((p) => !p.published).length ?? 0,
      pending: items?.filter(isPending).length ?? 0,
    }),
    [items],
  );

  const filtered = useMemo(() => {
    if (!items) return null;
    const q = query.trim().toLowerCase();
    return items.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (status === "live" && !isLive(p)) return false;
      if (status === "draft" && p.published) return false;
      if (status === "pending" && !isPending(p)) return false;
      if (!q) return true;
      return [p.title?.en, p.title?.te, p.caption?.en, p.caption?.te, p.credit, p.alt?.en].join(" ").toLowerCase().includes(q);
    });
  }, [items, query, category, status]);

  const filtering = query.trim() !== "" || category !== "all" || status !== "all";
  const reorderEnabled = !filtering && (items?.length ?? 0) > 1;
  const nameOf = (p: Photo) => pick(p.title, lang) || "—";
  const previewIndex = filtered && previewId ? filtered.findIndex((p) => p.id === previewId) : -1;

  async function toggle(p: Photo) {
    setBusyId(p.id);
    try {
      const res = await api<{ item: Photo }>(`/c/${resource.collection}/${p.id}`, { method: "PUT", body: putBody(p, { published: !p.published }) });
      setItems((prev) => prev?.map((i) => (i.id === p.id ? res.item : i)) ?? null);
      toast.success(p.published ? a.toastUnpublished : a.toastPublished);
    } catch (e) {
      toast.error(e instanceof ApiError ? [a.publishBlocked, e.message, ...(e.issues?.map((i) => i.message) ?? [])].join(" — ") : t.admin.error);
    } finally {
      setBusyId(null);
    }
  }

  async function removeOne(p: Photo) {
    const ok = await confirm({ title: a.deleteTitle, message: fill(a.deleteMessage, { name: nameOf(p) }), confirmLabel: a.deleteAction, tone: "danger" });
    if (!ok) return;
    setBusyId(p.id);
    try {
      await api(`/c/${resource.collection}/${p.id}`, { method: "DELETE" });
      setItems((prev) => prev?.filter((i) => i.id !== p.id) ?? null);
      setSelected((s) => {
        const n = new Set(s);
        n.delete(p.id);
        return n;
      });
      toast.success(a.toastDeleted);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t.admin.error);
    } finally {
      setBusyId(null);
    }
  }

  async function persistOrder(next: Photo[]) {
    setItems(next);
    try {
      await api(`/c/${resource.collection}/reorder`, { method: "POST", body: { ids: next.map((i) => i.id) } });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : a.toastReorderFailed);
      load();
    }
  }

  function moveBy(id: string, delta: -1 | 1) {
    if (!items) return;
    const from = items.findIndex((p) => p.id === id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= items.length) return;
    const next = [...items];
    [next[from], next[to]] = [next[to], next[from]];
    void persistOrder(next);
  }

  function dropOn(targetId: string) {
    if (!items || !dragId || dragId === targetId) return;
    const from = items.findIndex((p) => p.id === dragId);
    const to = items.findIndex((p) => p.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    void persistOrder(next);
  }

  async function bulk(kind: "publish" | "unpublish" | "delete") {
    if (!items || selected.size === 0) return;
    const chosen = items.filter((p) => selected.has(p.id));
    if (kind === "delete") {
      const ok = await confirm({ title: fill(a.deleteMany, { n: chosen.length }), message: a.deleteManyMessage, confirmLabel: a.deleteAction, tone: "danger" });
      if (!ok) return;
    }
    setBulkBusy(true);
    let okCount = 0;
    let failCount = 0;
    for (const p of chosen) {
      try {
        if (kind === "delete") await api(`/c/${resource.collection}/${p.id}`, { method: "DELETE" });
        else if (p.published === (kind === "publish")) okCount++;
        else await api(`/c/${resource.collection}/${p.id}`, { method: "PUT", body: putBody(p, { published: kind === "publish" }) });
        if (kind === "delete" || p.published !== (kind === "publish")) okCount++;
      } catch {
        failCount++;
      }
    }
    setBulkBusy(false);
    setSelected(new Set());
    load();
    if (okCount) toast.success(fill(a.bulkDone, { ok: okCount }));
    if (failCount) toast.error(fill(a.bulkSkipped, { fail: failCount }));
  }

  const toggleSelect = (id: string, on: boolean) =>
    setSelected((s) => {
      const n = new Set(s);
      if (on) n.add(id);
      else n.delete(id);
      return n;
    });

  const visibleIds = filtered?.map((p) => p.id) ?? [];
  const allShownSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  return (
    <div>
      <PageHeader
        eyebrow={t.admin.title}
        title={pick(resource.title, lang)}
        description={pick(resource.description, lang)}
        actions={
          <Button variant="secondary" icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setEditing("new")}>
            {t.admin.add}
          </Button>
        }
      />

      <UploadPanel existingUrls={(items ?? []).map((p) => p.image)} onDone={load} />

      {error && (
        <div className="mb-6">
          <EmptyState icon={<CircleAlert className="h-5 w-5" aria-hidden />} title={t.admin.error} action={<Button onClick={load}>{a.retry}</Button>}>
            {error}
          </EmptyState>
        </div>
      )}

      {items === null && !error ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5" aria-busy="true" aria-label={a.loading}>
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className="aspect-[4/5]" />
          ))}
        </div>
      ) : items && items.length === 0 ? (
        <EmptyState icon={<Images className="h-5 w-5" aria-hidden />} title={a.noPhotosTitle}>
          {a.noPhotosHelp}
        </EmptyState>
      ) : items && filtered ? (
        <>
          <div className="mb-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" aria-hidden />
                <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={a.searchPhotos} aria-label={a.searchLabel} className={cx(inputCls, "pl-9")} />
              </div>
              <select value={category} onChange={(e) => setCategory(e.target.value as "all" | GalleryCategory)} aria-label={t.gallery.category} className={cx(inputCls, "w-auto min-w-[13rem]")}>
                <option value="all">{a.allCategories}</option>
                {GALLERY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t.gallery.cat[c]}
                  </option>
                ))}
              </select>
              <span className="ml-auto text-xs text-stone">{fill(a.photosShown, { shown: filtered.length, total: items.length })}</span>
            </div>
            <Segmented<StatusFilter>
              label={a.searchLabel}
              value={status}
              onChange={setStatus}
              options={[
                { value: "all", label: a.statusAll, count: counts.all },
                { value: "live", label: a.statusLive, count: counts.live },
                { value: "draft", label: a.statusDrafts, count: counts.draft },
                { value: "pending", label: a.statusPending, count: counts.pending },
              ]}
            />
            {items.length > 1 && <p className="text-xs text-stone">{reorderEnabled ? a.reorderOn : a.reorderOff}</p>}
          </div>

          {selected.size > 0 && (
            <div className="on-dark sticky top-[4.25rem] z-10 mb-4 flex flex-wrap items-center gap-2 border border-ink bg-ink px-4 py-2.5 text-white shadow-lg" role="region" aria-label={fill(a.selectedN, { n: selected.size })}>
              <span className="mr-auto text-sm font-bold">{fill(a.selectedN, { n: selected.size })}</span>
              <Button size="sm" variant="yellow" loading={bulkBusy} onClick={() => bulk("publish")}>
                {a.bulkPublish}
              </Button>
              <Button size="sm" variant="secondary" disabled={bulkBusy} onClick={() => bulk("unpublish")}>
                {a.bulkUnpublish}
              </Button>
              <Button size="sm" variant="danger" disabled={bulkBusy} onClick={() => bulk("delete")}>
                {a.deleteAction}
              </Button>
              <button type="button" className="ml-1 grid h-8 w-8 place-items-center text-white/70 hover:bg-white/10 hover:text-white" aria-label={a.clearSelection} title={a.clearSelection} onClick={() => setSelected(new Set())}>
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          )}

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Search className="h-5 w-5" aria-hidden />}
              title={a.noMatches}
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery("");
                    setCategory("all");
                    setStatus("all");
                  }}
                >
                  {a.clearFilters}
                </Button>
              }
            >
              {a.noMatchesHelp}
            </EmptyState>
          ) : (
            <>
              <label className="mb-3 inline-flex cursor-pointer items-center gap-2 text-xs font-bold">
                <input type="checkbox" className="h-4 w-4 accent-ink" checked={allShownSelected} onChange={(e) => setSelected(e.target.checked ? new Set([...selected, ...visibleIds]) : new Set([...selected].filter((id) => !visibleIds.includes(id))))} />
                {a.selectAll}
              </label>
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                {filtered.map((p, i) => (
                  <Tile
                    key={p.id}
                    photo={p}
                    selected={selected.has(p.id)}
                    onSelect={(v) => toggleSelect(p.id, v)}
                    onPreview={() => setPreviewId(p.id)}
                    onEdit={() => setEditing(p)}
                    onToggle={() => toggle(p)}
                    onDelete={() => removeOne(p)}
                    busy={busyId === p.id}
                    reorder={reorderEnabled}
                    onMove={(d) => moveBy(p.id, d)}
                    first={i === 0}
                    last={i === filtered.length - 1}
                    dropping={overId === p.id && dragId !== p.id}
                    dragProps={
                      reorderEnabled
                        ? {
                            draggable: true,
                            onDragStart: (e) => {
                              setDragId(p.id);
                              e.dataTransfer.effectAllowed = "move";
                              e.dataTransfer.setData("text/plain", p.id);
                            },
                            onDragOver: (e) => {
                              if (!dragId) return;
                              e.preventDefault();
                              setOverId(p.id);
                            },
                            onDragLeave: () => setOverId((o) => (o === p.id ? null : o)),
                            onDrop: (e) => {
                              e.preventDefault();
                              dropOn(p.id);
                              setDragId(null);
                              setOverId(null);
                            },
                            onDragEnd: () => {
                              setDragId(null);
                              setOverId(null);
                            },
                          }
                        : {}
                    }
                  />
                ))}
              </ul>
            </>
          )}
        </>
      ) : null}

      <PhotoViewer
        photos={filtered ?? []}
        index={previewIndex}
        onClose={() => setPreviewId(null)}
        onStep={(d) => {
          if (!filtered || filtered.length === 0) return;
          setPreviewId(filtered[(previewIndex + d + filtered.length) % filtered.length].id);
        }}
      />

      {editing && (
        <ItemEditor
          key={editing === "new" ? "new" : editing.id}
          resource={resource}
          item={editing === "new" ? null : asItem(editing)}
          categories={[]}
          aside={(form, set) => <GalleryAside form={form} set={set} id={editing === "new" ? undefined : editing.id} />}
          onClose={() => setEditing(null)}
          onSaved={() => load()}
        />
      )}
    </div>
  );
}
