"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ApiError, useAdmin } from "@/components/admin/AdminProvider";
import { FieldRenderer, type FormValue, type LangMode } from "@/components/admin/fields";
import { useAdminT } from "@/components/admin/i18n";
import { Badge, Button, Modal, Segmented, WarnNote, cx, useUi } from "@/components/admin/ui";
import { useLang } from "@/components/shared/Providers";
import { FIELD_GROUPS, fieldGroup, type FieldDef, type ResourceDef } from "@/lib/admin/resources";
import { pick } from "@/lib/i18n";
import type { Bi, PosterCategory } from "@/types";

export type Item = FormValue & { id: string; order: number; published: boolean };

export function emptyValue(def: FieldDef): unknown {
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

function isEmpty(def: FieldDef, v: unknown): boolean {
  if (def.type === "bool") return false;
  if (def.type === "bi-text" || def.type === "bi-textarea") {
    const b = (v ?? {}) as Partial<Bi>;
    return !(b.en ?? "").trim() && !(b.te ?? "").trim();
  }
  if (Array.isArray(v)) return v.length === 0;
  return !String(v ?? "").trim();
}

/**
 * The editor used by every content section. Fields are grouped (content / images / details / publishing), bilingual
 * fields can be edited in both languages or one at a time, and the footer carries the publishing actions.
 * `aside` adds a live preview column (used by the gallery).
 */
export function ItemEditor({
  resource,
  item,
  categories,
  aside,
  onClose,
  onSaved,
}: {
  resource: ResourceDef;
  item: Item | null;
  categories: PosterCategory[];
  aside?: (form: FormValue, set: (patch: FormValue) => void) => React.ReactNode;
  onClose: () => void;
  onSaved: (saved: Item, kind: "created" | "updated") => void;
}) {
  const { api } = useAdmin();
  const { lang, t } = useLang();
  const a = useAdminT();
  const { toast, confirm } = useUi();
  const formId = useId();
  const root = useRef<HTMLDivElement>(null);

  const [initial] = useState<FormValue>(() => {
    const base: FormValue = { ...resource.defaults };
    for (const f of resource.fields) if (base[f.name] === undefined) base[f.name] = emptyValue(f);
    if (item) {
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = item as Item & { createdAt?: unknown; updatedAt?: unknown };
      void _id;
      void _c;
      void _u;
      return { ...base, ...rest };
    }
    // A brand-new item starts as a draft; the footer decides whether it goes live.
    return { ...base, published: false };
  });
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  const [form, setForm] = useState<FormValue>(initial);
  const [open, setOpen] = useState(true);
  const [saving, setSaving] = useState<null | "draft" | "publish">(null);
  const [message, setMessage] = useState("");
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<LangMode>("both");

  const dirty = JSON.stringify(form) !== baseline;
  const hasPublished = resource.fields.some((f) => f.name === "published");
  const isNew = item === null;
  const wasPublished = Boolean(item?.published);
  const hasBilingual = resource.fields.some((f) => f.type === "bi-text" || f.type === "bi-textarea");

  const groups = FIELD_GROUPS.map((g) => ({
    key: g,
    fields: resource.fields.filter((f) => f.name !== "published" && fieldGroup(f) === g),
  })).filter((g) => g.fields.length > 0);
  const groupLabel = { content: a.groupContent, media: a.groupMedia, details: a.groupDetails, publishing: a.groupPublishing } as const;

  const set = (patch: FormValue) => setForm((s) => ({ ...s, ...patch }));

  // Leave the browser's own "unsaved changes" prompt in place for accidental tab closes while editing.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function close() {
    setOpen(false);
    window.setTimeout(onClose, 260);
  }

  async function requestClose() {
    if (saving) return;
    if (dirty) {
      const discard = await confirm({ title: a.discardTitle, message: a.discardMessage, confirmLabel: a.discard, cancelLabel: a.keepEditing, tone: "danger" });
      if (!discard) return;
    }
    close();
  }

  function focusFirstError(names: string[]) {
    window.setTimeout(() => {
      const el = names.map((n) => root.current?.querySelector<HTMLElement>(`[data-field="${n}"]`)).find(Boolean);
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      el?.querySelector<HTMLElement>("input,textarea,select,button")?.focus({ preventScroll: true });
    }, 30);
  }

  async function save(publish: boolean | "keep") {
    const target = publish === "keep" ? Boolean(form.published) : publish;
    setMessage("");
    const problems: Record<string, string> = {};
    for (const f of resource.fields) if (f.required && isEmpty(f, form[f.name])) problems[f.name] = a.requiredField;
    if (Object.keys(problems).length) {
      setIssues(problems);
      setMessage(a.fixErrors);
      focusFirstError(Object.keys(problems));
      return;
    }
    setIssues({});
    setSaving(target ? "publish" : "draft");
    try {
      const body = hasPublished ? { ...form, published: target } : form;
      const res = item
        ? await api<{ item: Item }>(`/c/${resource.collection}/${item.id}`, { method: "PUT", body })
        : await api<{ item: Item }>(`/c/${resource.collection}`, { method: "POST", body });
      toast.success(!hasPublished ? t.admin.saved : target ? (wasPublished ? a.toastUpdated : a.toastPublished) : wasPublished ? a.toastUnpublished : a.toastDraftSaved);
      setBaseline(JSON.stringify(form));
      onSaved(res.item, isNew ? "created" : "updated");
      close();
    } catch (err) {
      if (err instanceof ApiError) {
        const map: Record<string, string> = {};
        const loose: string[] = [];
        err.issues?.forEach((i) => {
          const key = i.path.split(".")[0];
          if (key && resource.fields.some((f) => f.name === key)) map[key] = i.message;
          else loose.push(i.message);
        });
        setIssues(map);
        setMessage([target ? a.publishBlocked : "", err.message, ...loose].filter(Boolean).join(" — "));
        focusFirstError(Object.keys(map));
      } else setMessage(t.admin.error);
    } finally {
      setSaving(null);
    }
  }

  const renderFields = (fields: FieldDef[]) => (
    <div className="space-y-5">
      {fields.map((f) => (
        <FieldRenderer
          key={f.name}
          def={f}
          value={form[f.name]}
          categories={categories}
          error={issues[f.name]}
          siblings={form}
          mode={mode}
          onMeta={set}
          onChange={(v) => {
            setForm((s) => ({ ...s, [f.name]: v }));
            if (issues[f.name]) setIssues((s) => ({ ...s, [f.name]: "" }));
          }}
        />
      ))}
    </div>
  );

  const body = (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {hasPublished && <Badge tone={isNew ? "neutral" : wasPublished ? "green" : "neutral"}>{isNew ? t.admin.draft : wasPublished ? t.admin.published : t.admin.draft}</Badge>}
          {dirty && <Badge tone="yellow">{a.unsaved}</Badge>}
        </div>
        {hasBilingual && <Segmented<LangMode> label={a.langMode} value={mode} onChange={setMode} options={[{ value: "both", label: a.langBoth }, { value: "en", label: t.admin.english }, { value: "te", label: t.admin.telugu }]} />}
      </div>

      {message && (
        <div role="alert">
          <WarnNote>{message}</WarnNote>
        </div>
      )}

      {groups.map((g, i) => (
        <section key={g.key} aria-labelledby={`${formId}-${g.key}`}>
          <h3 id={`${formId}-${g.key}`} className="mb-4 flex items-baseline gap-3 border-b border-ink/15 pb-2">
            <span className="font-display text-sm text-stone">{String(i + 1).padStart(2, "0")}</span>
            <span className="font-display text-lg">{groupLabel[g.key]}</span>
          </h3>
          {renderFields(g.fields)}
        </section>
      ))}
    </div>
  );

  const primaryIsUpdate = !isNew && wasPublished;

  return (
    <Modal
      open={open}
      onClose={requestClose}
      size={aside ? "xl" : "lg"}
      eyebrow={pick(resource.title, lang)}
      title={isNew ? a.addItem : a.editItem}
      footer={
        <>
          <Button variant="ghost" onClick={requestClose} disabled={saving !== null}>
            {t.admin.cancel}
          </Button>
          {hasPublished ? (
            <>
              <Button variant="secondary" loading={saving === "draft"} disabled={saving !== null} onClick={() => save(false)}>
                {primaryIsUpdate ? a.saveAsDraft : a.saveDraft}
              </Button>
              <Button variant="yellow" loading={saving === "publish"} disabled={saving !== null} onClick={() => save(true)}>
                {primaryIsUpdate ? a.updateNow : a.publishNow}
              </Button>
            </>
          ) : (
            <Button variant="yellow" loading={saving !== null} onClick={() => save("keep")}>
              {saving ? t.admin.saving : t.admin.save}
            </Button>
          )}
        </>
      }
    >
      <div ref={root} className="p-5 md:p-6">
        <form
          id={formId}
          onSubmit={(e) => {
            e.preventDefault();
            // Enter never publishes by accident: it saves as a draft, or updates what is already live.
            void save(primaryIsUpdate ? true : hasPublished ? false : "keep");
          }}
          noValidate
        >
          {aside ? (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <div className={cx("lg:sticky lg:top-0 lg:self-start")}>{aside(form, set)}</div>
              {body}
            </div>
          ) : (
            body
          )}
        </form>
      </div>
    </Modal>
  );
}
