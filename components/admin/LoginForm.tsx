"use client";

import { ArrowLeft, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminT } from "@/components/admin/i18n";
import { inputCls } from "@/components/admin/ui";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useLang } from "@/components/shared/Providers";

export function LoginForm() {
  const { t } = useLang();
  const a = useAdminT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reveal, setReveal] = useState(false);

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
    <main className="grid min-h-screen bg-ink lg:grid-cols-[1.05fr_1fr]">
      <section className="on-dark relative flex flex-col justify-between overflow-hidden px-6 py-8 text-white md:px-12 md:py-12">
        <span aria-hidden className="absolute inset-y-0 right-0 hidden w-1 bg-brand lg:block" />
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-white ring-2 ring-brand">
            <Image src="/logos/tdp-logo.png" alt="" width={48} height={48} className="h-full w-full object-contain" />
          </span>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand">{t.brand.name}</p>
        </div>
        <div className="my-14 max-w-xl lg:my-0">
          <p className="eyebrow mb-4 text-brand">{t.admin.title}</p>
          <h1 className="font-display text-5xl leading-[1.05] md:text-7xl">{t.brand.name}</h1>
          <p className="mt-6 max-w-md text-base text-white/65">{a.signInIntro}</p>
        </div>
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/70 hover:text-brand">
          <ArrowLeft className="h-4 w-4" aria-hidden /> {a.backToSite}
        </Link>
      </section>

      <section className="flex flex-col justify-center bg-white px-6 py-10 md:px-14">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="font-display text-3xl">{t.admin.signIn}</h2>
            <LanguageSwitcher id="login" />
          </div>
          <form onSubmit={submit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="admin-email" className="mb-1.5 block text-[13px] font-bold">
                {t.admin.email}
              </label>
              <input id="admin-email" name="email" type="email" required autoComplete="username" autoFocus className={inputCls} />
            </div>
            <div>
              <label htmlFor="admin-password" className="mb-1.5 block text-[13px] font-bold">
                {t.admin.password}
              </label>
              <div className="relative">
                <input id="admin-password" name="password" type={reveal ? "text" : "password"} required autoComplete="current-password" className={`${inputCls} pr-11`} />
                <button type="button" onClick={() => setReveal((v) => !v)} aria-label={reveal ? a.hidePassword : a.showPassword} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-stone hover:text-ink">
                  {reveal ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                </button>
              </div>
            </div>
            {error && (
              <p role="alert" className="border-l-4 border-red-600 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-800">
                {error}
              </p>
            )}
            <button
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 border border-ink bg-ink py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-brand transition-colors hover:bg-brand hover:text-ink disabled:pointer-events-none disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Lock className="h-4 w-4" aria-hidden />} {busy ? t.admin.signingIn : t.admin.signIn}
            </button>
          </form>
          <p className="mt-8 flex items-center gap-2 text-xs text-stone">
            <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden /> {a.securedNote}
          </p>
        </div>
      </section>
    </main>
  );
}
