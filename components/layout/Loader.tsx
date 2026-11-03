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
    const wait = seen ? 0 : reduce ? 250 : 1400;
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
          className="on-dark fixed inset-0 z-[100] grid place-items-center bg-ink text-white"
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.7, ease: [0.7, 0, 0.2, 1] }}
        >
          <div className="flex flex-col items-center gap-7 px-6 text-center">
            <motion.div
              className="relative h-20 w-20 overflow-hidden rounded-full bg-white"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <Image src="/logos/tdp-logo.png" alt="" width={80} height={80} priority className="h-full w-full object-contain" />
            </motion.div>
            <div className="overflow-hidden pb-1">
              <motion.p
                className="font-display text-4xl font-bold md:text-6xl"
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ delay: 0.3, duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
              >
                {t.brand.name}
              </motion.p>
            </div>
            <div className="h-px w-44 overflow-hidden bg-white/20">
              <motion.div className="h-full bg-brand" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ delay: 0.2, duration: 1, ease: "easeInOut" }} />
            </div>
            <span className="sr-only">{lang === "te" ? "లోడ్ అవుతోంది" : "Loading"}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
