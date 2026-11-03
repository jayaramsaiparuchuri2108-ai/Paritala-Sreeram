"use client";

import { motion } from "motion/react";
import { useMemo } from "react";
import { useLang } from "@/components/shared/Providers";

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
}

/**
 * Masked reveal. English is split per character; Telugu per word so that
 * conjunct glyph clusters are never broken apart.
 */
export function SplitText({ text, className, delay = 0 }: SplitTextProps) {
  const { lang } = useLang();
  const parts = useMemo(() => {
    if (lang === "te") return text.split(/(\s+)/).filter((p) => p.length > 0);
    return Array.from(text);
  }, [text, lang]);

  return (
    <span className={className} aria-label={text}>
      {parts.map((part, i) => {
        if (part.trim() === "") return <span key={i}>{part === "\n" ? <br /> : " "}</span>;
        return (
          <span key={`${part}-${i}`} aria-hidden className="inline-block overflow-hidden align-bottom">
            <motion.span
              className="inline-block"
              initial={{ y: "110%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, delay: delay + i * (lang === "te" ? 0.09 : 0.035), ease: [0.2, 0.7, 0.2, 1] }}
            >
              {part}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}
