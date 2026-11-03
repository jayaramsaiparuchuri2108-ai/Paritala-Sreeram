"use client";

import { MotionConfig } from "motion/react";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState, useTransition, type ReactNode } from "react";
import { getDict, LANG_COOKIE } from "@/lib/i18n";
import type { Dict } from "@/data/translations/en";
import type { Lang } from "@/types";

interface LangContextValue {
  lang: Lang;
  t: Dict;
  setLang: (lang: Lang) => void;
  switching: boolean;
}

const LangContext = createContext<LangContextValue | null>(null);

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <Providers>");
  return ctx;
}

export function Providers({ initialLang, children }: { initialLang: Lang; children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const router = useRouter();
  const [switching, startTransition] = useTransition();

  const setLang = useCallback(
    (next: Lang) => {
      setLangState(next);
      document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = next;
      // Re-render server components in the new language without leaving the page or losing scroll position.
      startTransition(() => router.refresh());
    },
    [router],
  );

  const value = useMemo(() => ({ lang, t: getDict(lang), setLang, switching }), [lang, setLang, switching]);

  return (
    <LangContext.Provider value={value}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LangContext.Provider>
  );
}
