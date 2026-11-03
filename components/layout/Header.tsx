"use client";

import { AnimatePresence, motion } from "motion/react";
import { Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useLang } from "@/components/shared/Providers";
import { pick } from "@/lib/i18n";
import type { Bi } from "@/types";

const links = [
  { href: "/", key: "home" },
  { href: "/about", key: "about" },
  { href: "/activities", key: "activities" },
  { href: "/#focus", key: "issues" },
  { href: "/gallery", key: "gallery" },
  { href: "/videos", key: "videos" },
  { href: "/posters", key: "posters" },
  { href: "/contact", key: "contact" },
] as const;

export function Header({ name }: { name: Bi }) {
  const { t, lang } = useLang();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(false));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => !href.includes("#") && (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header
        className={`on-brand sticky top-0 z-50 bg-brand transition-shadow duration-300 ${scrolled || open ? "shadow-[0_1px_0_0_rgba(8,8,8,0.18)]" : ""}`}
      >
        <div className="container-x flex h-14 items-center justify-between gap-4 md:h-[60px]">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label={pick(name, lang)}>
            <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-1 ring-ink/30">
              <Image src="/logos/tdp-logo.png" alt="Telugu Desam Party logo" width={32} height={32} priority className="h-full w-full object-contain" />
            </span>
            <span className="truncate border-b-2 border-ink pb-0.5 font-display text-lg font-bold leading-none md:text-xl">{pick(name, lang)}</span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center xl:flex">
            {links.map((l) => (
              <Link
                key={l.key}
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className="relative whitespace-nowrap px-3 py-2 text-[13px] font-semibold"
              >
                {t.nav[l.key]}
                {isActive(l.href) && (
                  <motion.span layoutId="nav-underline" className="absolute inset-x-3 bottom-0.5 h-[2px] bg-ink" transition={{ type: "spring", stiffness: 500, damping: 36 }} />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <Link
              href="/admin/login"
              className="hidden items-center gap-1.5 whitespace-nowrap border border-ink/40 px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-ink hover:text-brand md:inline-flex"
            >
              <Lock className="h-3 w-3" aria-hidden /> {t.nav.admin}
            </Link>
            <LanguageSwitcher id="header" />
            <button
              type="button"
              className="relative grid h-10 w-10 place-items-center xl:hidden"
              aria-label={open ? t.nav.close : t.nav.menu}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="relative block h-3.5 w-5">
                <motion.span className="absolute left-0 h-[2px] w-5 bg-ink" animate={open ? { top: 6, rotate: 45 } : { top: 0, rotate: 0 }} />
                <motion.span className="absolute left-0 top-[6px] h-[2px] w-5 bg-ink" animate={{ opacity: open ? 0 : 1 }} />
                <motion.span className="absolute left-0 h-[2px] w-5 bg-ink" animate={open ? { top: 6, rotate: -45 } : { top: 12, rotate: 0 }} />
              </span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="on-dark fixed inset-0 z-40 flex flex-col overflow-y-auto bg-ink px-6 pb-8 pt-20 xl:hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.5, ease: [0.7, 0, 0.2, 1] }}
          >
            <nav aria-label="Mobile" className="flex flex-1 flex-col justify-center">
              {links.map((l, i) => (
                <motion.div
                  key={l.key}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.12 + i * 0.045, duration: 0.4 }}
                  className="border-b border-white/10"
                >
                  <Link
                    href={l.href}
                    className={`flex items-baseline gap-4 py-3 font-display text-3xl font-bold ${isActive(l.href) ? "text-brand" : "text-white"}`}
                  >
                    <span className="font-sans text-[11px] font-semibold tracking-[0.2em] text-brand/80">0{i + 1}</span>
                    {t.nav[l.key]}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="mt-8 flex items-center justify-between gap-4">
              <LanguageSwitcher id="mobile" tone="dark" />
              <Link href="/admin/login" className="inline-flex items-center gap-2 border border-white/30 px-4 py-2 text-sm font-semibold text-white">
                <Lock className="h-3.5 w-3.5" aria-hidden /> {t.nav.admin}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
