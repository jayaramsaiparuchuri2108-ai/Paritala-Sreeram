"use client";

import { CircleAlert, Save, Undo2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ApiError, useAdmin } from "@/components/admin/AdminProvider";
import { FieldRenderer, type FormValue, type LangMode } from "@/components/admin/fields";
import { useAdminT } from "@/components/admin/i18n";
import { Badge, Button, Card, EmptyState, PageHeader, Segmented, Skeleton, WarnNote, useUi } from "@/components/admin/ui";
import { useLang } from "@/components/shared/Providers";
import { FIELD_GROUPS, fieldGroup, type SettingsDef } from "@/lib/admin/resources";
import { pick } from "@/lib/i18n";

export function SettingsForm({ group }: { group: SettingsDef }) {
  const { api } = useAdmin();
  const { lang, t } = useLang();
  const a = useAdminT();
  const { toast } = useUi();
  const [form, setForm] = useState<FormValue | null>(null);
  const [saved, setSaved] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<LangMode>("both");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    api<{ value: FormValue }>(`/settings/${group.key}`)
      .then((r) => {
        if (!alive) return;
        setForm(r.value);
        setSaved(JSON.stringify(r.value));
        setLoadError("");
      })
      .catch((e) => alive && setLoadError(e instanceof ApiError ? e.message : t.admin.error));
    return () => {
      alive = false;
    };
  }, [api, group.key, t.admin.error, reloadKey]);

  const dirty = form !== null && JSON.stringify(form) !== saved;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!form) return;
      setSaving(true);
      setMessage("");
      setIssues({});
      try {
        await api(`/settings/${group.key}`, { method: "PUT", body: form });
        setSaved(JSON.stringify(form));
        toast.success(a.settingsSaved);
      } catch (err) {
        if (err instanceof ApiError) {
          const map: Record<string, string> = {};
          err.issues?.forEach((i) => (map[i.path.split(".")[0]] = i.message));
          setIssues(map);
          setMessage([a.fixErrors, err.message].join(" — "));
        } else setMessage(t.admin.error);
      } finally {
        setSaving(false);
      }
    },
    [api, form, group.key, toast, a.settingsSaved, a.fixErrors, t.admin.error],
  );

  const hasBilingual = group.fields.some((f) => f.type === "bi-text" || f.type === "bi-textarea");
  const blocks = FIELD_GROUPS.map((g) => ({ key: g, fields: group.fields.filter((f) => fieldGroup(f) === g) })).filter((b) => b.fields.length);
  const label = { content: a.groupContent, media: a.groupMedia, details: a.groupDetails, publishing: a.groupPublishing } as const;

  return (
    <div>
      <PageHeader eyebrow={t.admin.title} title={pick(group.title, lang)} description={pick(group.description, lang)} />

      {loadError ? (
        <EmptyState icon={<CircleAlert className="h-5 w-5" aria-hidden />} title={t.admin.error} action={<Button onClick={() => setReloadKey((k) => k + 1)}>{a.retry}</Button>}>
          {loadError}
        </EmptyState>
      ) : !form ? (
        <Card>
          <div className="space-y-6 p-6" aria-busy="true" aria-label={a.loading}>
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <form onSubmit={save} noValidate className="pb-24">
          {hasBilingual && (
            <div className="mb-4 flex justify-end">
              <Segmented<LangMode> label={a.langMode} value={mode} onChange={setMode} options={[{ value: "both", label: a.langBoth }, { value: "en", label: t.admin.english }, { value: "te", label: t.admin.telugu }]} />
            </div>
          )}
          {message && (
            <div role="alert" className="mb-4">
              <WarnNote>{message}</WarnNote>
            </div>
          )}
          <div className="space-y-6">
            {blocks.map((b, i) => (
              <Card key={b.key}>
                {blocks.length > 1 && (
                  <h2 className="flex items-baseline gap-3 border-b border-ink/10 px-6 py-4">
                    <span className="font-display text-sm text-stone">{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-display text-xl">{label[b.key]}</span>
                  </h2>
                )}
                <div className="max-w-4xl space-y-6 p-6">
                  {b.fields.map((f) => (
                    <FieldRenderer
                      key={f.name}
                      def={f}
                      value={form[f.name]}
                      error={issues[f.name]}
                      mode={mode}
                      onChange={(v) => {
                        setForm((s) => ({ ...(s ?? {}), [f.name]: v }));
                        if (issues[f.name]) setIssues((s) => ({ ...s, [f.name]: "" }));
                      }}
                    />
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/20 bg-white/95 backdrop-blur lg:left-[var(--admin-sidebar,272px)]">
            <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6 lg:px-8">
              <p className="flex items-center gap-2 text-sm" role="status">
                {dirty ? <Badge tone="yellow">{a.unsavedSettings}</Badge> : <span className="text-stone">{a.noChanges}</span>}
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" icon={<Undo2 className="h-4 w-4" aria-hidden />} disabled={!dirty || saving} onClick={() => setForm(JSON.parse(saved) as FormValue)}>
                  {a.discard}
                </Button>
                <Button type="submit" variant="yellow" loading={saving} disabled={!dirty} icon={<Save className="h-4 w-4" aria-hidden />}>
                  {saving ? t.admin.saving : t.admin.save}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
