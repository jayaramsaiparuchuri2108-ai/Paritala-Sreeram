"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { useLang } from "@/components/shared/Providers";

interface LightboxProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  label: string;
  onPrev?: () => void;
  onNext?: () => void;
}

export function Lightbox({ open, onClose, children, label, onPrev, onNext }: LightboxProps) {
  const { t } = useLang();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, onPrev, onNext]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={label}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/90 p-3 backdrop-blur-sm md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label={t.nav.close}
            className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-brand text-ink transition-transform hover:scale-105"
          >
            <X className="h-5 w-5" />
          </button>
          <motion.div
            className="max-h-full w-full max-w-5xl overflow-auto rounded-2xl bg-paper shadow-2xl"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
