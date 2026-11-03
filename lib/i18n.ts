import en from "@/data/translations/en";
import te from "@/data/translations/te";
import type { Dict } from "@/data/translations/en";
import type { Bi, Lang } from "@/types";

export const LANG_COOKIE = "ps_lang";
export const DEFAULT_LANG: Lang = "en";

const dictionaries: Record<Lang, Dict> = { en, te };

export function getDict(lang: Lang): Dict {
  return dictionaries[lang];
}

export function isLang(value: unknown): value is Lang {
  return value === "en" || value === "te";
}

/** Pick the requested language from a bilingual value, falling back to the other language if empty. */
export function pick(value: Bi | undefined | null, lang: Lang): string {
  if (!value) return "";
  const primary = value[lang]?.trim();
  if (primary) return primary;
  return (lang === "en" ? value.te : value.en) ?? "";
}

export function formatDate(iso: string | undefined, lang: Lang): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(lang === "te" ? "te-IN" : "en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(d);
}
