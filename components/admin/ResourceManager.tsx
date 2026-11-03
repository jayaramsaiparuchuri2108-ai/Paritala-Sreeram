"use client";

import { ArrowDown, ArrowUp, CircleAlert, Eye, EyeOff, FileText, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, useAdmin } from "@/components/admin/AdminProvider";
import { useAdminT, fill, timeAgo } from "@/components/admin/i18n";
import { ItemEditor, type Item } from "@/components/admin/ItemEditor";
import { Badge, Button, Card, EmptyState, IconButton, PageHeader, Segmented, Skeleton, cx, inputCls, useUi } from "@/components/admin/ui";
import { useLang } from "@/components/shared/Providers";
import type { FieldDef, ResourceDef } from "@/lib/admin/resources";
import { formatDate, pick } from "@/lib/i18n";
import type { Bi, PosterCategory } from "@/types";

function rowText(value: unknown, lang: "en" | "te"): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "en" in (value as Bi)) return pick(value as Bi, lang);
  return String(value);
}

type StatusFilter = "all" | "published" | "draft";

export function ResourceManager({ resource }: { resource: ResourceDef }) {
  const { api } = useAdmin();
  const { lang, t } = useLang();
  const a = useAdminT();
  const { toast, confirm } = useUi();
  const [items, setItems] = useState<Item[] | null>(null);
  const [categories, setCategories] = useState<PosterCategory[]>([]);
  const [editing, setEditing] = useState<Item | "new" | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);
  const load = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let alive = true;
    api<{ items: Item[] }>(`/c/${resource.collection}`)
      .then(async (res) => {
        if (!alive) return;
        setItems(res.items);
        setError("");
        if (resource.fields.some((f) => f.type === "poster-category")) {
          const cats = await api<{ items: PosterCategory[] }>("/c/posterCategories");
          if (alive) setCategories(cats.items);
        }
      })
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : t.admin.error));
    return () => {
      alive = false;
    };
  }, [api, resource, t.admin.error, reloadKey]);

  const hasPublished = resource.fields.some((f) => f.name === "published");
  const imageField = resource.imageField;

  /** Human-readable subtitle: category names, option labels and dates instead of raw stored values. */
  const subtitle = useCallback(
    (item: Item): string => {
      const name = resource.subtitleField;
      if (!name) return "";
      const def = resource.fields.find((f: FieldDef) => f.name === name);
      const raw = item[name];
      if (def?.type === "poster-category") return rowText(categories.find((c) => c.id === raw)?.name, lang);
      if (def?.type === "select") return pick(def.options?.find((o) => o.value === raw)?.label, lang);
      if (def?.type === "date" && typeof raw === "string" && raw) return formatDate(raw, lang);
      return rowText(raw, lang);
    },
    [resource, categories, lang],
  );

  const filtered = useMemo(() => {
    if (!items) return null;
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (status === "published" && !i.published) return false;
      if (status === "draft" && i.published) return false;
      if (!q) return true;
      const t = i[resource.titleField];
      const hay = [typeof t === "object" && t ? `${(t as Bi).en} ${(t as Bi).te}` : String(t ?? ""), subtitle(i)].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [items, query, status, resource.titleField, subtitle]);

  const filtering = query.trim() !== "" || status !== "all";
  const counts = useMemo(() => ({ all: items?.length ?? 0, published: items?.filter((i) => i.published).length ?? 0, draft: items?.filter((i) => !i.published).length ?? 0 }), [items]);
  const nameOf = (item: Item) => rowText(item[resource.titleField], lang) || "—";

  async function remove(item: Item) {
    const ok = await confirm({
      title: a.deleteTitle,
      message: fill(a.deleteMessage, { name: nameOf(item) }),
      confirmLabel: a.deleteAction,
      tone: "danger",
    });
    if (!ok) return;
    setBusyId(item.id);
    try {
      await api(`/c/${resource.collection}/${item.id}`, { method: "DELETE" });
      setItems((prev) => prev?.filter((i) => i.id !== item.id) ?? null);
      toast.success(a.toastDeleted);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t.admin.error);
    } finally {
      setBusyId(null);
    }
  }

  async function togglePublished(item: Item) {
    const { id: _id, ...rest } = item;
    void _id;
    setBusyId(item.id);
    try {
      const res = await api<{ item: Item }>(`/c/${resource.collection}/${item.id}`, { method: "PUT", body: { ...rest, published: !item.published } });
      setItems((prev) => prev?.map((i) => (i.id === item.id ? res.item : i)) ?? null);
      toast.success(item.published ? a.toastUnpublished : a.toastPublished);
    } catch (e) {
      toast.error(e instanceof ApiError ? [a.publishBlocked, e.message, ...(e.issues?.map((i) => i.message) ?? [])].join(" — ") : t.admin.error);
    } finally {
      setBusyId(null);
    }
  }

  async function move(index: number, delta: -1 | 1) {
    if (!items) return;
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    try {
      await api(`/c/${resource.collection}/reorder`, { method: "POST", body: { ids: next.map((i) => i.id) } });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : a.toastReorderFailed);
      load();
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow={t.admin.title}
        title={pick(resource.title, lang)}
        description={pick(resource.description, lang)}
        actions={
          <Button variant="yellow" icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setEditing("new")}>
            {t.admin.add}
          </Button>
        }
      />

      {error && (
        <div className="mb-6">
          <EmptyState icon={<CircleAlert className="h-5 w-5" aria-hidden />} title={t.admin.error} action={<Button onClick={load}>{a.retry}</Button>}>
            {error}
          </EmptyState>
        </div>
      )}

      {items === null && !error ? (
        <Card>
          <ul className="divide-y divide-ink/10" aria-busy="true" aria-label={a.loading}>
            {Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="h-14 w-14" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-6 w-20" />
              </li>
            ))}
          </ul>
        </Card>
      ) : items && items.length === 0 ? (
        <EmptyState icon={<FileText className="h-5 w-5" aria-hidden />} title={a.emptyTitle} action={<Button variant="yellow" icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setEditing("new")}>{t.admin.add}</Button>}>
          {a.emptyHelp}
        </EmptyState>
      ) : items && filtered ? (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" aria-hidden />
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={a.searchTitles} aria-label={a.searchLabel} className={cx(inputCls, "pl-9")} />
            </div>
            {hasPublished && (
              <Segmented<StatusFilter>
                label={a.searchLabel}
                value={status}
                onChange={setStatus}
                options={[
                  { value: "all", label: a.filterAll, count: counts.all },
                  { value: "published", label: a.filterPublished, count: counts.published },
                  { value: "draft", label: a.filterDrafts, count: counts.draft },
                ]}
              />
            )}
          </div>
          {resource.reorderable && !filtering && items.length > 1 && <p className="mb-3 text-xs text-stone">{a.reorderHint}</p>}

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Search className="h-5 w-5" aria-hidden />}
              title={a.noMatches}
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery("");
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
            <Card>
              <ul className="divide-y divide-ink/10">
                {filtered.map((item, i) => {
                  const img = imageField && typeof item[imageField] === "string" ? (item[imageField] as string) : "";
                  const edited = (item.updatedAt ?? item.createdAt) as string | undefined;
                  const sub = subtitle(item);
                  return (
                    <li key={item.id} className={cx("flex flex-wrap items-center gap-3 p-3 transition-colors hover:bg-cream/70 md:flex-nowrap md:gap-4 md:p-4", busyId === item.id && "opacity-60")}>
                      {resource.reorderable && !filtering && (
                        <div className="flex flex-col">
                          <IconButton label={a.moveEarlier} className="h-7 w-7" disabled={i === 0} onClick={() => move(i, -1)}>
                            <ArrowUp className="h-4 w-4" aria-hidden />
                          </IconButton>
                          <IconButton label={a.moveLater} className="h-7 w-7" disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                            <ArrowDown className="h-4 w-4" aria-hidden />
                          </IconButton>
                        </div>
                      )}
                      {img && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt="" loading="lazy" className="h-14 w-14 shrink-0 border border-ink/15 object-cover md:h-16 md:w-16" />
                      )}
                      <button type="button" onClick={() => setEditing(item)} className="min-w-0 flex-1 text-left">
                        <span className="block truncate font-semibold hover:underline">{nameOf(item)}</span>
                        <span className="mt-0.5 block truncate text-xs text-stone">
                          {[sub, edited ? fill(a.lastEdited, { when: timeAgo(edited, lang) }) : ""].filter(Boolean).join(" · ")}
                        </span>
                      </button>
                      {typeof item.downloads === "number" && <span className="hidden text-xs font-bold text-stone md:inline">↓ {item.downloads}</span>}
                      {hasPublished && <Badge tone={item.published ? "green" : "neutral"}>{item.published ? t.admin.published : t.admin.draft}</Badge>}
                      <div className="ml-auto flex gap-0.5">
                        {hasPublished && (
                          <IconButton label={item.published ? a.unpublishItem : a.publishItem} disabled={busyId === item.id} onClick={() => togglePublished(item)}>
                            {item.published ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                          </IconButton>
                        )}
                        <IconButton label={t.admin.edit} onClick={() => setEditing(item)}>
                          <Pencil className="h-4 w-4" aria-hidden />
                        </IconButton>
                        <IconButton label={t.admin.delete} tone="danger" disabled={busyId === item.id} onClick={() => remove(item)}>
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </IconButton>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </>
      ) : null}

      {editing && (
        <ItemEditor
          key={editing === "new" ? "new" : editing.id}
          resource={resource}
          item={editing === "new" ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => load()}
        />
      )}
    </div>
  );
}
