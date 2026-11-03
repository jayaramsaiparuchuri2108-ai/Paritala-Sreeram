import { cookies } from "next/headers";
import { DEFAULT_LANG, LANG_COOKIE, getDict, isLang } from "@/lib/i18n";
import type { Lang } from "@/types";

/** Reads the visitor's language from the cookie (English by default). Server-only. */
export async function getLang(): Promise<Lang> {
  const store = await cookies();
  const value = store.get(LANG_COOKIE)?.value;
  return isLang(value) ? value : DEFAULT_LANG;
}

export async function getServerT() {
  const lang = await getLang();
  return { lang, t: getDict(lang) };
}
