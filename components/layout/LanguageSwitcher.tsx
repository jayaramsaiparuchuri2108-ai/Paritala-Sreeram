"use client";

import { motion } from "motion/react";
import { useLang } from "@/components/shared/Providers";
import type { Lang } from "@/types";

const options: { code: Lang; label: string; aria: string }[] = [
  { code: "en", label: "EN", aria: "English" },
  { code: "te", label: "తె", aria: "తెలుగు" },
];

export function LanguageSwitcher({ id = "lang", tone = "light" }: { id?: string; tone?: "light" | "dark" }) {
  const { lang, setLang, t } = useLang();
  return (
    <div
      role="group"
      aria-label={t.nav.language}
      className={`relative inline-flex border p-0.5 ${tone === "dark" ? "border-white/40" : "border-ink/60"}`}
    >
      {options.map((o) => {
        const active = lang === o.code;
        return (
          <button
            key={o.code}
            type="button"
            onClick={() => !active && setLang(o.code)}
            aria-pressed={active}
            aria-label={o.aria}
            lang={o.code}
            className={`relative z-10 min-w-[2.25rem] px-2.5 py-1 text-[12px] font-bold transition-colors ${
              active ? (tone === "dark" ? "text-ink" : "text-brand") : tone === "dark" ? "text-white" : "text-ink/70 hover:text-ink"
            }`}
          >
            {active && (
              <motion.span
                layoutId={`${id}-pill`}
                className={`absolute inset-0 -z-10 ${tone === "dark" ? "bg-brand" : "bg-ink"}`}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
