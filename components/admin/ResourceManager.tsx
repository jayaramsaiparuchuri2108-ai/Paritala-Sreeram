"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ApiError, useAdmin } from "@/components/admin/AdminProvider";
import { BulkPhotoUpload } from "@/components/admin/BulkPhotoUpload";
import { FieldRenderer, type FormValue } from "@/components/admin/fields";
import { useLang } from "@/components/shared/Providers";
import type { FieldDef, ResourceDef } from "@/lib/admin/resources";
import { pick } from "@/lib/i18n";
import type { Bi, PosterCategory } from "@/types";

type Item = FormValue & { id: string; order: number; published: boolean };

function rowText(value: unknown, lang: "en" | "te"): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "en" in (value as Bi)) return pick(value as Bi, lang);
  return String(value);
}

function emptyValue(def: FieldDef): unknown {
  switch (def.type) {
    case "bi-text":
    case "bi-textarea":
      return { en: "", te: "" };
    case "sources":
    case "tags":
    case "images":
      return [];
    case "bool":
      return true;
    default:
      return "";
  }
}

export function ResourceManager({ resource }: { resource: ResourceDef }) {
  const { api } = useAdmin();
  const { lang, t } = useLang();
  const [items, setItems] = useState<Item[] | null>(null);
  const [categories, setCategories] = useState<PosterCategory[]>([]);
  const [editing, setEditing] = useState<Item | "new" | null>(null);
  const [error, setError] = useState("");

  const [reloadKey, setReloadKey] = useState(0);
  const load = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let alive = true;
    api<{ items: Item[] }>(`/c/${resource.collection}`)
      .then(async (res) => {
        if (!alive) return;
        setItems(res.items);
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

  async function remove(item: Item) {
    if (!window.confirm(t.admin.confirmDelete)) return;
    try {
      await api(`/c/${resource.collection}/${item.id}`, { method: "DELETE" });
      setItems((prev) => prev?.filter((i) => i.id !== item.id) ?? null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t.admin.error);
    }
  }

  async function togglePublished(item: Item) {
    const { id: _id, ...rest } = item;
    void _id;
    try {
      const res = await api<{ item: Item }>(`/c/${resource.collection}/${item.id}`, { method: "PUT", body: { ...rest, published: !item.published } });
      setItems((prev) => prev?.map((i) => (i.id === item.id ? res.item : i)) ?? null);
      setError("");
    } catch (e) {
      setError(e instanceof ApiError ? [e.message, ...(e.issues?.map((i) => i.message) ?? [])].join(" — ") : t.admin.error);
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
      setError(e instanceof ApiError ? e.message : t.admin.error);
      load();
    }
  }

  const imageField = resource.imageField;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-stone">{pick(resource.description, lang)}</p>
        <button onClick={() => setEditing("new")} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-brand">
          <Plus className="h-4 w-4" /> {t.admin.add}
        </button>
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-800">{error}</p>}
      {resource.bulkUpload && imageField && (
        <BulkPhotoUpload existingUrls={(items ?? []).map((i) => String(i[imageField] ?? "")).filter(Boolean)} onDone={load} />
      )}

      {items === null ? (
        <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-ink/30 p-10 text-center text-stone">{t.admin.noItems}</p>
      ) : (
        <ul className="divide-y-2 divide-line overflow-hidden rounded-2xl border-2 border-ink bg-white">
          {items.map((item, i) => (
            <li key={item.id} className="flex flex-wrap items-center gap-3 p-3 md:flex-nowrap md:gap-4 md:p-4">
              {resource.reorderable && (
                <div className="flex flex-col">
                  <button aria-label={t.admin.moveUp} disabled={i === 0} onClick={() => move(i, -1)} className="rounded p-1 hover:bg-brand disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                  <button aria-label={t.admin.moveDown} disabled={i === items.length - 1} onClick={() => move(i, 1)} className="rounded p-1 hover:bg-brand disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                </div>
              )}
              {imageField && typeof item[imageField] === "string" && item[imageField] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item[imageField] as string} alt="" className={`h-16 shrink-0 rounded-md border-2 border-ink object-cover ${resource.bulkUpload ? "w-24" : "w-12"}`} />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold">{rowText(item[resource.titleField], lang) || "—"}</p>
                {resource.subtitleField && <p className="truncate text-xs text-stone">{rowText(item[resource.subtitleField], lang)}</p>}
              </div>
              {resource.bulkUpload && (
                <>
                  {Boolean(item.featured) && <Star className="h-4 w-4 shrink-0 fill-brand" aria-label="Featured" />}
                  {item.permission !== "authorised" && <span className="rounded-full border-2 border-ink px-2.5 py-0.5 text-[11px] font-bold">Awaiting permission</span>}
                </>
              )}
              {typeof item.downloads === "number" && <span className="hidden text-xs font-bold text-stone md:inline">↓ {item.downloads}</span>}
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.published ? "bg-brand" : "bg-mist text-stone"}`}>
                {item.published ? t.admin.published : t.admin.draft}
              </span>
              <div className="flex gap-1">
                <button aria-label={item.published ? t.admin.draft : t.admin.published} onClick={() => togglePublished(item)} className="rounded-full p-2 hover:bg-brand">
                  {item.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button aria-label={t.admin.edit} onClick={() => setEditing(item)} className="rounded-full p-2 hover:bg-brand"><Pencil className="h-4 w-4" /></button>
                <button aria-label={t.admin.delete} onClick={() => remove(item)} className="rounded-full p-2 text-red-700 hover:bg-red-100"><Trash2 className="h-4 w-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AnimatePresence>
        {editing && (
          <EditorModal
            resource={resource}
            item={editing === "new" ? null : editing}
            categories={categories}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              setError("");
              load();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EditorModal({
  resource,
  item,
  categories,
  onClose,
  onSaved,
}: {
  resource: ResourceDef;
  item: Item | null;
  categories: PosterCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { api } = useAdmin();
  const { lang, t } = useLang();
  const [form, setForm] = useState<FormValue>(() => {
    const base: FormValue = { ...resource.defaults };
    for (const f of resource.fields) if (base[f.name] === undefined) base[f.name] = emptyValue(f);
    if (item) {
      const { id: _id, ...rest } = item;
      void _id;
      return { ...base, ...rest };
    }
    return base;
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [issues, setIssues] = useState<Record<string, string>>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setIssues({});
    try {
      if (item) await api(`/c/${resource.collection}/${item.id}`, { method: "PUT", body: form });
      else await api(`/c/${resource.collection}`, { method: "POST", body: form });
      onSaved();
    } catch (err) {
      if (err instanceof ApiError) {
        setMessage(err.message);
        const map: Record<string, string> = {};
        err.issues?.forEach((i) => (map[i.path.split(".")[0]] = i.message));
        setIssues(map);
      } else setMessage(t.admin.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-ink/70 p-3 backdrop-blur-sm md:p-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <motion.form
        onSubmit={submit}
        className="w-full max-w-3xl rounded-2xl border-[3px] border-ink bg-paper shadow-[10px_10px_0_0_#ffd600]"
        initial={{ y: 30, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="flex items-center justify-between border-b-2 border-ink bg-brand px-5 py-3">
          <h2 className="font-display text-2xl uppercase">{item ? t.admin.edit : t.admin.add} · {pick(resource.title, lang)}</h2>
          <button type="button" onClick={onClose} aria-label={t.admin.cancel} className="rounded-full p-1.5 hover:bg-ink hover:text-brand"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-5 p-5">
          {resource.bulkUpload && resource.imageField && typeof form[resource.imageField] === "string" && form[resource.imageField] ? (
            <figure className="overflow-hidden rounded-xl border-2 border-ink bg-ink">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form[resource.imageField] as string} alt="" className="mx-auto max-h-80 w-auto max-w-full object-contain" />
              <figcaption className="flex flex-wrap items-center justify-between gap-2 bg-ink px-3 py-2 text-xs font-bold text-white">
                <span>Preview — how the photograph appears in the gallery viewer</span>
                {typeof form.width === "number" && typeof form.height === "number" && <span className="text-brand">{form.width} × {form.height}px</span>}
              </figcaption>
            </figure>
          ) : null}
          {resource.fields.map((f) => (
            <FieldRenderer
              key={f.name}
              def={f}
              value={form[f.name]}
              categories={categories}
              error={issues[f.name]}
              siblings={form}
              onMeta={(patch) => setForm((s) => ({ ...s, ...patch }))}
              onChange={(v) => setForm((s) => ({ ...s, [f.name]: v }))}
            />
          ))}
          {message && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-bold text-red-800">{message}</p>}
        </div>
        <div className="flex justify-end gap-3 border-t-2 border-line p-4">
          <button type="button" onClick={onClose} className="rounded-full border-2 border-ink px-5 py-2 text-sm font-bold">{t.admin.cancel}</button>
          <button disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2 text-sm font-bold text-brand disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} {saving ? t.admin.saving : t.admin.save}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
