"use client";

import { AnimatePresence, motion } from "motion/react";
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
  { href: "/posters", key: "posters" },
  { href: "/gallery", key: "gallery" },
  { href: "/videos", key: "videos" },
  { href: "/contact", key: "contact" },
] as const;

export function Header({ name }: { name: Bi }) {
  const { t, lang } = useLang();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
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

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled || open ? "border-b-2 border-ink bg-brand shadow-[0_6px_0_0_rgba(23,23,23,0.9)]" : "bg-transparent"
        }`}
      >
        <div className="container-x flex h-[68px] items-center justify-between gap-4 md:h-[76px]">
          <Link href="/" className="flex items-center gap-3" aria-label={pick(name, lang)}>
            <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-2 ring-ink">
              <Image src="/logos/tdp-logo.png" alt="Telugu Desam Party logo" width={44} height={44} priority className="h-full w-full object-contain" />
            </span>
            <span className="font-display text-xl uppercase leading-none tracking-wide md:text-2xl">{pick(name, lang)}</span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className="relative whitespace-nowrap px-3 py-2 text-sm font-bold"
              >
                {t.nav[l.key]}
                {isActive(l.href) && (
                  <motion.span layoutId="nav-underline" className="absolute inset-x-3 bottom-0 h-[3px] bg-ink" transition={{ type: "spring", stiffness: 500, damping: 36 }} />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher id="header" />
            <button
              type="button"
              className="relative grid h-11 w-11 place-items-center rounded-full border-2 border-ink bg-white lg:hidden"
              aria-label={open ? t.nav.close : t.nav.menu}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="relative block h-4 w-5">
                <motion.span className="absolute left-0 h-[2.5px] w-5 rounded bg-ink" animate={open ? { top: 7, rotate: 45 } : { top: 0, rotate: 0 }} />
                <motion.span className="absolute left-0 top-[7px] h-[2.5px] w-5 rounded bg-ink" animate={{ opacity: open ? 0 : 1 }} />
                <motion.span className="absolute left-0 h-[2.5px] w-5 rounded bg-ink" animate={open ? { top: 7, rotate: -45 } : { top: 14, rotate: 0 }} />
              </span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-40 flex flex-col bg-ink px-6 pb-10 pt-28 lg:hidden"
            initial={{ clipPath: "circle(0% at 92% 4%)" }}
            animate={{ clipPath: "circle(150% at 92% 4%)" }}
            exit={{ clipPath: "circle(0% at 92% 4%)" }}
            transition={{ duration: 0.55, ease: [0.7, 0, 0.2, 1] }}
          >
            <nav aria-label="Mobile" className="flex flex-1 flex-col justify-center gap-1">
              {links.map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.15 + i * 0.05, duration: 0.4 }}
                >
                  <Link
                    href={l.href}
                    className={`flex items-baseline gap-4 py-2 font-display text-4xl uppercase ${isActive(l.href) ? "text-brand" : "text-white"}`}
                  >
                    <span className="text-xs font-sans font-bold text-brand/70">0{i + 1}</span>
                    {t.nav[l.key]}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="flex items-center justify-between border-t border-white/20 pt-6">
              <LanguageSwitcher id="mobile" tone="dark" />
              <span className="text-sm text-white/60">{pick(name, lang)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
