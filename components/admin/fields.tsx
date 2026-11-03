"use client";

import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { ApiError, useAdmin } from "@/components/admin/AdminProvider";
import { useLang } from "@/components/shared/Providers";
import type { FieldDef } from "@/lib/admin/resources";
import { pick } from "@/lib/i18n";
import type { Bi, PosterCategory } from "@/types";

const input =
  "w-full rounded-lg border-2 border-ink/80 bg-white px-3 py-2 text-sm outline-none transition focus:border-ink focus:ring-4 focus:ring-brand";

export type FormValue = Record<string, unknown>;

export interface UploadResult {
  url: string;
  width: number;
  height: number;
  duplicate: boolean;
}

export function ImageUploader({
  value,
  onChange,
  onUploaded,
  folder = "gallery",
  category,
  name,
}: {
  value: string;
  onChange: (url: string) => void;
  /** Called with the stored file's details after a successful upload (pixel size, duplicate flag). */
  onUploaded?: (result: UploadResult) => void;
  folder?: "posters" | "gallery" | "site";
  /** Gallery category - files are stored in a per-category folder. */
  category?: string;
  /** Descriptive base name for the stored file. */
  name?: string;
}) {
  const { api } = useAdmin();
  const { t } = useLang();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  async function upload(file: File) {
    setNote("");
    setError("");
    if (file.size > 8 * 1024 * 1024) return setError("File is larger than 8 MB.");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setError("Only JPG, PNG or WebP images are allowed.");
    setBusy(true);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("folder", folder);
      if (category) form.set("category", category);
      if (name) form.set("name", name);
      const res = await api<UploadResult>("/upload", { method: "POST", form });
      onChange(res.url);
      onUploaded?.(res);
      if (res.duplicate) setNote("This photograph was already uploaded - the existing file was reused.");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t.admin.error);
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-24 w-20 rounded-lg border-2 border-ink object-cover" />
        ) : (
          <div className="grid h-24 w-20 place-items-center rounded-lg border-2 border-dashed border-ink/40 text-stone">
            <ImagePlus className="h-6 w-6" />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <button type="button" disabled={busy} onClick={() => ref.current?.click()} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-bold text-brand disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {busy ? t.admin.uploading : value ? t.admin.replace : t.admin.upload}
          </button>
          {value && (
            <button type="button" onClick={() => onChange("")} className="inline-flex items-center gap-2 text-xs font-bold text-red-700">
              <Trash2 className="h-3.5 w-3.5" /> {t.admin.remove}
            </button>
          )}
        </div>
        <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </div>
      <p className="text-xs text-stone">{t.admin.imageHelp}</p>
      {note && <p role="status" className="text-xs font-bold text-ink">{note}</p>}
      {error && <p role="alert" className="text-xs font-bold text-red-700">{error}</p>}
    </div>
  );
}

function BiInput({ value, onChange, multiline }: { value: Bi; onChange: (v: Bi) => void; multiline?: boolean }) {
  const { t } = useLang();
  const v = value ?? { en: "", te: "" };
  const Tag = multiline ? "textarea" : "input";
  const common = { className: `${input} ${multiline ? "min-h-[110px]" : ""}` };
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-stone">{t.admin.english}</span>
        <Tag {...common} lang="en" value={v.en ?? ""} onChange={(e) => onChange({ ...v, en: e.target.value })} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-stone">{t.admin.telugu}</span>
        <Tag {...common} lang="te" value={v.te ?? ""} onChange={(e) => onChange({ ...v, te: e.target.value })} />
      </label>
    </div>
  );
}

export function FieldRenderer({
  def,
  value,
  onChange,
  categories = [],
  error,
  siblings,
  onMeta,
}: {
  def: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
  categories?: PosterCategory[];
  error?: string;
  /** The whole form, so a field can use related values (e.g. the photo's category and title). */
  siblings?: FormValue;
  /** Lets a field set other form values (e.g. the pixel size recorded at upload). */
  onMeta?: (patch: FormValue) => void;
}) {
  const { lang, t } = useLang();
  const label = pick(def.label, lang);

  let control: React.ReactNode;
  switch (def.type) {
    case "bi-text":
    case "bi-textarea":
      control = <BiInput value={value as Bi} onChange={onChange} multiline={def.type === "bi-textarea"} />;
      break;
    case "textarea":
      control = <textarea className={`${input} min-h-[110px]`} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "select":
      control = (
        <select className={input} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)}>
          {def.options?.map((o) => (
            <option key={o.value} value={o.value}>{pick(o.label, lang)}</option>
          ))}
        </select>
      );
      break;
    case "poster-category":
      control = (
        <select className={input} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{pick(c.name, lang)}</option>
          ))}
        </select>
      );
      break;
    case "date":
      control = <input type="date" className={input} value={((value as string) ?? "").slice(0, 10)} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "image":
      control = (
        <ImageUploader
          value={(value as string) ?? ""}
          folder={def.folder}
          category={def.trackSize ? (siblings?.category as string | undefined) : undefined}
          name={def.trackSize ? ((siblings?.title as Bi | undefined)?.en || undefined) : undefined}
          onChange={(url) => {
            onChange(url);
            if (!url && def.trackSize) onMeta?.({ width: undefined, height: undefined });
          }}
          onUploaded={(r) => def.trackSize && onMeta?.({ width: r.width, height: r.height })}
        />
      );
      break;
    case "images": {
      const list = (value as string[]) ?? [];
      control = (
        <div className="space-y-3">
          {list.map((src, i) => (
            <div key={`${src}-${i}`} className="rounded-lg border-2 border-ink/20 p-3">
              <ImageUploader value={src} folder={def.folder} onChange={(url) => onChange(url ? list.map((s, k) => (k === i ? url : s)) : list.filter((_, k) => k !== i))} />
            </div>
          ))}
          {list.length < (def.max ?? 6) && (
            <div className="rounded-lg border-2 border-dashed border-ink/30 p-3">
              <ImageUploader value="" folder={def.folder} onChange={(url) => url && onChange([...list, url])} />
            </div>
          )}
        </div>
      );
      break;
    }
    case "sources":
    case "tags":
      control = (
        <input
          className={input}
          value={((value as string[]) ?? []).join(", ")}
          onChange={(e) => onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
        />
      );
      break;
    case "bool":
      control = (
        <label className="inline-flex cursor-pointer items-center gap-3">
          <input type="checkbox" className="peer sr-only" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          <span className="relative h-7 w-12 rounded-full border-2 border-ink bg-white transition peer-checked:bg-brand peer-focus-visible:ring-4 peer-focus-visible:ring-brand after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-ink after:transition peer-checked:after:translate-x-5" />
          <span className="text-sm font-bold">{def.boolLabels ? pick(value ? def.boolLabels.on : def.boolLabels.off, lang) : value ? t.admin.published : t.admin.draft}</span>
        </label>
      );
      break;
    default:
      control = <input className={input} type={def.type === "url" ? "url" : "text"} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-extrabold">
        {label} {def.required && <span className="text-red-700" title={t.admin.required}>*</span>}
      </p>
      {control}
      {def.help && <p className="mt-1 text-xs text-stone">{pick(def.help, lang)}</p>}
      {error && <p role="alert" className="mt-1 text-xs font-bold text-red-700">{error}</p>}
    </div>
  );
}
