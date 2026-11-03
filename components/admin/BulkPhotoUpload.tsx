"use client";

import { CheckCircle2, CircleAlert, CopyCheck, ImagePlus, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { ApiError, useAdmin } from "@/components/admin/AdminProvider";
import type { UploadResult } from "@/components/admin/fields";
import { useLang } from "@/components/shared/Providers";
import { pick } from "@/lib/i18n";
import { GALLERY_CATEGORIES, type GalleryCategory } from "@/types";

type Status = "queued" | "uploading" | "added" | "duplicate" | "error";
interface Row {
  name: string;
  status: Status;
  message?: string;
}

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

/** "IMG_2041-public_meeting.JPG" -> "IMG 2041 public meeting" (a draft title the admin then edits). */
function draftTitle(filename: string): string {
  return filename.replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120) || "Untitled photograph";
}

/**
 * Upload many photographs at once. Each file is stored (by category, under a descriptive filename) and added to
 * the gallery as an unpublished, permission-pending draft — nothing goes public until the admin completes it.
 */
export function BulkPhotoUpload({ existingUrls, onDone }: { existingUrls: string[]; onDone: () => void }) {
  const { api } = useAdmin();
  const { lang, t } = useLang();
  const input = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<GalleryCategory>("recent");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  const labels = (c: GalleryCategory) => ({ en: t.gallery.cat[c], te: t.gallery.cat[c] });
  const patch = (i: number, p: Partial<Row>) => setRows((prev) => prev.map((r, k) => (k === i ? { ...r, ...p } : r)));

  async function run(files: File[]) {
    if (files.length === 0 || busy) return;
    setBusy(true);
    setRows(files.map((f) => ({ name: f.name, status: "queued" })));
    const seen = new Set(existingUrls);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!ALLOWED.includes(file.type)) {
        patch(i, { status: "error", message: "Only JPG, PNG or WebP" });
        continue;
      }
      if (file.size > MAX_BYTES) {
        patch(i, { status: "error", message: "Larger than 8 MB" });
        continue;
      }
      patch(i, { status: "uploading" });
      try {
        const form = new FormData();
        form.set("file", file);
        form.set("folder", "gallery");
        form.set("category", category);
        form.set("name", draftTitle(file.name));
        const up = await api<UploadResult>("/upload", { method: "POST", form });
        if (up.duplicate && seen.has(up.url)) {
          patch(i, { status: "duplicate", message: "Already in the gallery" });
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
        patch(i, { status: "added" });
      } catch (e) {
        patch(i, { status: "error", message: e instanceof ApiError ? e.message : t.admin.error });
      }
    }
    setBusy(false);
    if (input.current) input.current.value = "";
    onDone();
  }

  const done = rows.filter((r) => r.status === "added").length;

  return (
    <section aria-label="Upload photographs" className="mb-6 rounded-2xl border-2 border-dashed border-ink/40 bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-end gap-4">
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-stone">{t.gallery.category}</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as GalleryCategory)}
            disabled={busy}
            className="rounded-lg border-2 border-ink/80 bg-white px-3 py-2 text-sm outline-none focus:border-ink focus:ring-4 focus:ring-brand"
          >
            {GALLERY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {pick(labels(c), lang)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-brand disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {busy ? t.admin.uploading : "Upload several photographs"}
        </button>
        <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => run(Array.from(e.target.files ?? []))} />
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          run(Array.from(e.dataTransfer.files));
        }}
        className={`mt-4 rounded-xl border-2 border-dashed px-4 py-6 text-center text-sm transition-colors ${over ? "border-ink bg-brand" : "border-ink/25 text-stone"}`}
      >
        Drop JPG / PNG / WebP files here (up to 8 MB each). They are added as <strong>drafts awaiting permission</strong> — add the caption, date and original post link, mark them Authorised, then Publish.
      </div>

      {rows.length > 0 && (
        <ul className="mt-4 space-y-1.5 text-sm" aria-live="polite">
          {rows.map((r, i) => (
            <li key={`${r.name}-${i}`} className="flex items-center gap-2">
              {r.status === "uploading" && <Loader2 className="h-4 w-4 shrink-0 animate-spin" />}
              {r.status === "queued" && <span className="h-4 w-4 shrink-0 rounded-full border-2 border-ink/30" />}
              {r.status === "added" && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-700" />}
              {r.status === "duplicate" && <CopyCheck className="h-4 w-4 shrink-0 text-stone" />}
              {r.status === "error" && <CircleAlert className="h-4 w-4 shrink-0 text-red-700" />}
              <span className="min-w-0 flex-1 truncate">{r.name}</span>
              {r.message && <span className={`text-xs font-bold ${r.status === "error" ? "text-red-700" : "text-stone"}`}>{r.message}</span>}
            </li>
          ))}
          {!busy && <li className="pt-1 text-xs font-bold text-stone">{done} added as drafts.</li>}
        </ul>
      )}
    </section>
  );
}
