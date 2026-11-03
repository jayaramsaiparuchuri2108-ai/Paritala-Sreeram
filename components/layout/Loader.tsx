"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useLang } from "@/components/shared/Providers";

const KEY = "ps_intro_seen";

/** Branded loading screen, shown once per browser session. */
export function Loader() {
  const { t, lang } = useLang();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === "1";
    } catch {
      /* storage blocked - show the intro every time */
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wait = seen ? 0 : reduce ? 250 : 1500;
    const id = window.setTimeout(() => {
      setVisible(false);
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {
        /* ignore */
      }
    }, wait);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          aria-hidden
          className="fixed inset-0 z-[100] grid place-items-center bg-brand"
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.7, ease: [0.7, 0, 0.2, 1] }}
        >
          <div className="flex flex-col items-center gap-6">
            <motion.div
              className="relative h-24 w-24 overflow-hidden rounded-full bg-white ring-4 ring-ink"
              initial={{ scale: 0.4, rotate: -90, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <Image src="/logos/tdp-logo.png" alt="" width={96} height={96} priority className="h-full w-full object-contain" />
            </motion.div>
            <div className="overflow-hidden">
              <motion.p
                className="font-display text-4xl uppercase md:text-5xl"
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ delay: 0.35, duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
              >
                {t.brand.name}
              </motion.p>
            </div>
            <div className="h-[4px] w-40 overflow-hidden rounded bg-ink/15">
              <motion.div
                className="h-full bg-ink"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.2, duration: 1.1, ease: "easeInOut" }}
              />
            </div>
            <span className="sr-only">{lang === "te" ? "లోడ్ అవుతోంది" : "Loading"}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
