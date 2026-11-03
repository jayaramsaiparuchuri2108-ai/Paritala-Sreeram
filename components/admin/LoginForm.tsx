"use client";

import { Loader2, Lock } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useLang } from "@/components/shared/Providers";

export function LoginForm() {
  const { t } = useLang();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
        credentials: "same-origin",
      });
      if (res.ok) {
        router.replace("/admin");
        router.refresh();
        return;
      }
      setError(res.status === 429 ? t.admin.tooMany : t.admin.loginFailed);
    } catch {
      setError(t.admin.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-brand p-4">
      <div className="w-full max-w-md rounded-3xl border-[3px] border-ink bg-white p-8 shadow-[12px_12px_0_0_#080808]">
        <div className="mb-6 flex items-center justify-between">
          <span className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-white ring-2 ring-ink">
            <Image src="/logos/tdp-logo.png" alt="" width={56} height={56} className="h-full w-full object-contain" />
          </span>
          <LanguageSwitcher id="login" />
        </div>
        <h1 className="font-display text-4xl uppercase">{t.admin.title}</h1>
        <p className="mb-6 text-sm text-stone">{t.brand.name}</p>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <label className="block">
            <span className="mb-1 block text-sm font-bold">{t.admin.email}</span>
            <input name="email" type="email" required autoComplete="username" className="w-full rounded-lg border-2 border-ink px-3 py-2.5 outline-none focus:ring-4 focus:ring-brand" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-bold">{t.admin.password}</span>
            <input name="password" type="password" required autoComplete="current-password" className="w-full rounded-lg border-2 border-ink px-3 py-2.5 outline-none focus:ring-4 focus:ring-brand" />
          </label>
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-bold text-red-800">{error}</p>}
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3 font-bold text-brand disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} {busy ? t.admin.signingIn : t.admin.signIn}
          </button>
        </form>
      </div>
    </main>
  );
}
