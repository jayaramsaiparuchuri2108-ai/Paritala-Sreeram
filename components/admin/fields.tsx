"use client";

import { Loader2, Replace, Trash2, UploadCloud, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { ApiError, useAdmin } from "@/components/admin/AdminProvider";
import { useAdminT } from "@/components/admin/i18n";
import { cx, inputCls, useUi } from "@/components/admin/ui";
import { useLang } from "@/components/shared/Providers";
import type { FieldDef } from "@/lib/admin/resources";
import { pick } from "@/lib/i18n";
import type { Bi, PosterCategory } from "@/types";

export type FormValue = Record<string, unknown>;
export type LangMode = "both" | "en" | "te";

export interface UploadResult {
  url: string;
  width: number;
  height: number;
  duplicate: boolean;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

/** Drop-zone image field: drag a file in or browse. Shows what is stored, with replace / remove. */
export function ImageUploader({
  value,
  onChange,
  onUploaded,
  folder = "gallery",
  category,
  name,
  compact,
  id,
  invalid,
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
  compact?: boolean;
  id?: string;
  invalid?: boolean;
}) {
  const { api } = useAdmin();
  const { t } = useLang();
  const a = useAdminT();
  const { toast } = useUi();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [over, setOver] = useState(false);

  async function upload(file: File) {
    setNote("");
    setError("");
    if (file.size > MAX_BYTES) return setError(a.tooLarge);
    if (!ALLOWED_TYPES.includes(file.type)) return setError(a.badType);
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
      if (res.duplicate) setNote(a.duplicateReused);
      else toast.success(a.imageUploaded);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t.admin.error);
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  const box = compact ? "h-36" : "min-h-52";

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void upload(file);
        }}
        className={cx(
          "relative overflow-hidden border-2 border-dashed transition-colors",
          box,
          over ? "border-ink bg-brand/60" : invalid ? "border-red-600 bg-red-50/40" : value ? "border-ink/20 bg-cream" : "border-ink/30 bg-white hover:border-ink/60",
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className={cx("mx-auto w-auto max-w-full object-contain", compact ? "h-36" : "max-h-72")} />
        ) : (
          <div className={cx("flex flex-col items-center justify-center gap-2 px-4 text-center", box)}>
            <UploadCloud className="h-7 w-7 text-stone" aria-hidden />
            <p className="text-sm text-ink">
              {a.dropImage}{" "}
              <button id={id} type="button" onClick={() => ref.current?.click()} className="font-bold underline underline-offset-4 hover:bg-brand">
                {a.browse}
              </button>
            </p>
            <p className="text-xs text-stone">{a.imageRules}</p>
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-white/85" role="status">
            <div className="w-2/3 max-w-xs text-center">
              <p className="mb-2 flex items-center justify-center gap-2 text-sm font-bold">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {t.admin.uploading}
              </p>
              <div className="h-1.5 overflow-hidden bg-ink/10">
                <div className="h-full w-1/3 animate-[ps-slide_1.1s_ease-in-out_infinite] bg-ink" />
              </div>
            </div>
          </div>
        )}
      </div>
      {value && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => ref.current?.click()}
            className="inline-flex items-center gap-2 border border-ink/30 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] hover:border-ink hover:bg-brand disabled:opacity-50"
          >
            <Replace className="h-3.5 w-3.5" aria-hidden /> {a.replaceImage}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onChange("")}
            className="inline-flex items-center gap-2 border border-transparent px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden /> {a.removeImage}
          </button>
        </div>
      )}
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])} />
      {note && (
        <p role="status" className="text-xs font-bold text-ink">
          {note}
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs font-bold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function BiInput({
  id,
  value,
  onChange,
  multiline,
  mode,
  invalid,
  describedBy,
}: {
  id: string;
  value: Bi;
  onChange: (v: Bi) => void;
  multiline?: boolean;
  mode: LangMode;
  invalid?: boolean;
  describedBy?: string;
}) {
  const { t } = useLang();
  const v = value ?? { en: "", te: "" };
  const Tag = multiline ? "textarea" : "input";
  const cls = cx(inputCls, multiline && "min-h-[120px] resize-y leading-relaxed", invalid && "border-red-600");
  const shown = (["en", "te"] as const).filter((l) => mode === "both" || mode === l);
  return (
    <div className={cx("grid gap-3", shown.length === 2 && "md:grid-cols-2")}>
      {shown.map((l) => (
        <div key={l}>
          <label htmlFor={`${id}-${l}`} className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-stone">
            <span className="grid h-4 min-w-6 place-items-center bg-ink px-1 text-[9px] text-brand">{l.toUpperCase()}</span>
            {l === "en" ? t.admin.english : t.admin.telugu}
          </label>
          <Tag
            id={`${id}-${l}`}
            className={cls}
            lang={l}
            value={v[l] ?? ""}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            onChange={(e) => onChange({ ...v, [l]: e.target.value })}
          />
        </div>
      ))}
    </div>
  );
}

function TagInput({ id, value, onChange, invalid }: { id: string; value: string[]; onChange: (v: string[]) => void; invalid?: boolean }) {
  const [draft, setDraft] = useState("");
  const commit = () => {
    const parts = draft.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) onChange([...new Set([...value, ...parts])]);
    setDraft("");
  };
  return (
    <div className={cx("flex flex-wrap items-center gap-1.5 border border-ink/30 bg-white p-1.5 focus-within:border-ink focus-within:ring-4 focus-within:ring-brand/70", invalid && "border-red-600")}>
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 border border-ink bg-brand px-2 py-0.5 text-xs font-bold">
          {tag}
          <button type="button" aria-label={`Remove ${tag}`} onClick={() => onChange(value.filter((x) => x !== tag))} className="hover:text-red-700">
            <X className="h-3 w-3" aria-hidden />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit();
          } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
        }}
        className="min-w-[8rem] flex-1 bg-transparent px-1.5 py-1 text-sm outline-none"
        placeholder={value.length ? "" : "Type and press Enter"}
      />
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
  mode = "both",
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
  /** Which language column(s) bilingual fields show. */
  mode?: LangMode;
}) {
  const { lang, t } = useLang();
  const id = useId();
  const label = pick(def.label, lang);
  const helpId = `${id}-help`;
  const errId = `${id}-err`;
  const describedBy = [def.help ? helpId : "", error ? errId : ""].filter(Boolean).join(" ") || undefined;
  const invalid = Boolean(error);

  let control: React.ReactNode;
  let composite = false;
  switch (def.type) {
    case "bi-text":
    case "bi-textarea":
      composite = true;
      control = <BiInput id={id} value={value as Bi} onChange={onChange} multiline={def.type === "bi-textarea"} mode={mode} invalid={invalid} describedBy={describedBy} />;
      break;
    case "textarea":
      control = <textarea id={id} className={cx(inputCls, "min-h-[120px] resize-y leading-relaxed", invalid && "border-red-600")} value={(value as string) ?? ""} aria-invalid={invalid || undefined} aria-describedby={describedBy} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "select":
      control = (
        <select id={id} className={cx(inputCls, invalid && "border-red-600")} value={(value as string) ?? ""} aria-invalid={invalid || undefined} aria-describedby={describedBy} onChange={(e) => onChange(e.target.value)}>
          {def.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {pick(o.label, lang)}
            </option>
          ))}
        </select>
      );
      break;
    case "poster-category":
      control = (
        <select id={id} className={cx(inputCls, invalid && "border-red-600")} value={(value as string) ?? ""} aria-invalid={invalid || undefined} aria-describedby={describedBy} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {pick(c.name, lang)}
            </option>
          ))}
        </select>
      );
      break;
    case "date":
      control = <input id={id} type="date" className={cx(inputCls, "max-w-[14rem]", invalid && "border-red-600")} value={((value as string) ?? "").slice(0, 10)} aria-invalid={invalid || undefined} aria-describedby={describedBy} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "image":
      composite = true;
      control = (
        <ImageUploader
          id={id}
          invalid={invalid}
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
      composite = true;
      const list = (value as string[]) ?? [];
      control = (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((src, i) => (
            <ImageUploader key={`${src}-${i}`} compact value={src} folder={def.folder} onChange={(url) => onChange(url ? list.map((s, k) => (k === i ? url : s)) : list.filter((_, k) => k !== i))} />
          ))}
          {list.length < (def.max ?? 6) && <ImageUploader compact value="" folder={def.folder} onChange={(url) => url && onChange([...list, url])} />}
        </div>
      );
      break;
    }
    case "sources":
    case "tags":
      control = <TagInput id={id} value={(value as string[]) ?? []} onChange={onChange} invalid={invalid} />;
      break;
    case "bool":
      composite = true;
      control = (
        <label className="inline-flex cursor-pointer items-center gap-3">
          <input id={id} type="checkbox" className="peer sr-only" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} aria-describedby={describedBy} />
          <span className="relative h-6 w-11 shrink-0 border border-ink bg-white transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:bg-ink after:transition-transform peer-checked:bg-brand peer-checked:after:translate-x-5 peer-focus-visible:ring-4 peer-focus-visible:ring-brand/70" />
          <span className="text-sm font-semibold">{def.boolLabels ? pick(value ? def.boolLabels.on : def.boolLabels.off, lang) : value ? t.admin.published : t.admin.draft}</span>
        </label>
      );
      break;
    default:
      control = <input id={id} className={cx(inputCls, invalid && "border-red-600")} type={def.type === "url" ? "url" : "text"} inputMode={def.type === "url" ? "url" : undefined} value={(value as string) ?? ""} aria-invalid={invalid || undefined} aria-describedby={describedBy} onChange={(e) => onChange(e.target.value)} />;
  }

  const labelEl = (
    <>
      {label} {def.required && <span className="text-red-700" title={t.admin.required} aria-label={t.admin.required}>*</span>}
    </>
  );

  return (
    <div data-field={def.name}>
      {composite && def.type !== "bool" ? (
        <p className="mb-1.5 text-[13px] font-bold">{labelEl}</p>
      ) : def.type === "bool" ? (
        <p className="mb-1.5 text-[13px] font-bold">{labelEl}</p>
      ) : (
        <label htmlFor={id} className="mb-1.5 block text-[13px] font-bold">
          {labelEl}
        </label>
      )}
      {control}
      {def.help && (
        <p id={helpId} className="mt-1.5 text-xs leading-relaxed text-stone">
          {pick(def.help, lang)}
        </p>
      )}
      {error && (
        <p id={errId} role="alert" className="mt-1.5 text-xs font-bold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
