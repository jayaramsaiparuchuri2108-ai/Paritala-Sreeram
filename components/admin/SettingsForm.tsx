"use client";

import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ApiError, useAdmin } from "@/components/admin/AdminProvider";
import { FieldRenderer, type FormValue } from "@/components/admin/fields";
import { useLang } from "@/components/shared/Providers";
import type { SettingsDef } from "@/lib/admin/resources";
import { pick } from "@/lib/i18n";

export function SettingsForm({ group }: { group: SettingsDef }) {
  const { api } = useAdmin();
  const { lang, t } = useLang();
  const [form, setForm] = useState<FormValue | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [issues, setIssues] = useState<Record<string, string>>({});

  useEffect(() => {
    api<{ value: FormValue }>(`/settings/${group.key}`)
      .then((r) => setForm(r.value))
      .catch((e) => setMessage({ ok: false, text: e instanceof ApiError ? e.message : t.admin.error }));
  }, [api, group.key, t.admin.error]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setMessage(null);
    setIssues({});
    try {
      await api(`/settings/${group.key}`, { method: "PUT", body: form });
      setMessage({ ok: true, text: t.admin.saved });
    } catch (err) {
      if (err instanceof ApiError) {
        const map: Record<string, string> = {};
        err.issues?.forEach((i) => (map[i.path.split(".")[0]] = i.message));
        setIssues(map);
        setMessage({ ok: false, text: err.message });
      } else setMessage({ ok: false, text: t.admin.error });
    } finally {
      setSaving(false);
    }
  }

  if (!form) return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <form onSubmit={save} className="max-w-3xl space-y-6">
      <p className="text-sm text-stone">{pick(group.description, lang)}</p>
      {group.fields.map((f) => (
        <FieldRenderer key={f.name} def={f} value={form[f.name]} error={issues[f.name]} onChange={(v) => setForm((s) => ({ ...(s ?? {}), [f.name]: v }))} />
      ))}
      <div className="flex items-center gap-4">
        <button disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3 font-bold text-brand disabled:opacity-60">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} {saving ? t.admin.saving : t.admin.save}
        </button>
        {message && (
          <p role="status" className={`inline-flex items-center gap-2 text-sm font-bold ${message.ok ? "text-green-800" : "text-red-800"}`}>
            {message.ok && <Check className="h-4 w-4" />} {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
