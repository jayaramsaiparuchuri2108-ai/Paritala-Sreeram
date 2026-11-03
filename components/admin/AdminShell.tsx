"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen,
  CalendarDays,
  Film,
  Globe,
  Home,
  Images,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Mail,
  Menu,
  Newspaper,
  Palette,
  Search,
  Settings,
  Share2,
  Tags,
  Target,
  Vote,
  X,
  FileImage,
  Camera,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdmin } from "@/components/admin/AdminProvider";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useLang } from "@/components/shared/Providers";

interface NavItem { href: string; label: (t: ReturnType<typeof useLang>["t"]) => string; icon: LucideIcon }

const groups: { title: { en: string; te: string }; items: NavItem[] }[] = [
  {
    title: { en: "Overview", te: "సారాంశం" },
    items: [{ href: "/admin", label: (t) => t.admin.dashboard, icon: LayoutDashboard }],
  },
  {
    title: { en: "Content", te: "కంటెంట్" },
    items: [
      { href: "/admin/home", label: (t) => t.admin.home, icon: Home },
      { href: "/admin/biography", label: (t) => t.admin.biography, icon: BookOpen },
      { href: "/admin/timeline", label: (t) => t.admin.timeline, icon: ListOrdered },
      { href: "/admin/electoral", label: (t) => t.admin.electoral, icon: Vote },
      { href: "/admin/focus", label: (t) => t.admin.focus, icon: Target },
      { href: "/admin/updates", label: (t) => t.admin.updates, icon: Newspaper },
      { href: "/admin/activities", label: (t) => t.admin.activities, icon: CalendarDays },
    ],
  },
  {
    title: { en: "Media", te: "మీడియా" },
    items: [
      { href: "/admin/posters", label: (t) => t.admin.posters, icon: FileImage },
      { href: "/admin/designer", label: (t) => t.admin.designer, icon: Palette },
      { href: "/admin/categories", label: (t) => t.admin.categories, icon: Tags },
      { href: "/admin/gallery", label: (t) => t.admin.gallery, icon: Images },
      { href: "/admin/instagram", label: (t) => t.admin.instagram, icon: Camera },
      { href: "/admin/videos", label: (t) => t.admin.videos, icon: Film },
    ],
  },
  {
    title: { en: "Settings", te: "సెట్టింగ్స్" },
    items: [
      { href: "/admin/site", label: (t) => t.admin.site, icon: Settings },
      { href: "/admin/seo", label: (t) => t.admin.seo, icon: Search },
      { href: "/admin/social", label: (t) => t.admin.social, icon: Share2 },
      { href: "/admin/contact", label: (t) => t.admin.contact, icon: Mail },
    ],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t, lang } = useLang();
  const pathname = usePathname();
  const router = useRouter();
  const { api } = useAdmin();

  async function signOut() {
    await api("/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b-2 border-ink/20 p-5">
        <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-white ring-2 ring-brand">
          <Image src="/logos/tdp-logo.png" alt="" width={40} height={40} className="h-full w-full object-contain" />
        </span>
        <div>
          <p className="font-display text-lg uppercase leading-none text-white">{t.brand.name}</p>
          <p className="text-xs text-brand">{t.admin.title}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto p-4" aria-label="Admin">
        {groups.map((g) => (
          <div key={g.title.en}>
            <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">{g.title[lang]}</p>
            <ul className="space-y-1">
              {g.items.map(({ href, label, icon: Icon }) => {
                const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${active ? "bg-brand text-ink" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
                    >
                      <Icon className="h-4 w-4" /> {label(t)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="space-y-3 border-t-2 border-white/10 p-4">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold text-white/80 hover:bg-white/10">
          <Globe className="h-4 w-4" /> {t.admin.viewSite}
        </Link>
        <button onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold text-white/80 hover:bg-red-600 hover:text-white">
          <LogOut className="h-4 w-4" /> {t.admin.signOut}
        </button>
      </div>
    </div>
  );
}

export function AdminShell({ title, children }: { title?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { t } = useLang();
  const pathname = usePathname();
  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(false));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-cream lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="sticky top-0 hidden h-screen bg-ink lg:block">
        <SidebarContent />
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b-2 border-ink bg-brand px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <button className="rounded-lg border-2 border-ink bg-white p-2 lg:hidden" aria-label={t.nav.menu} onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-display text-2xl uppercase">{title}</h1>
          </div>
          <LanguageSwitcher id="admin" />
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-ink/60 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside className="fixed inset-y-0 left-0 z-50 w-72 bg-ink lg:hidden" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "tween", duration: 0.28 }}>
              <button className="absolute right-3 top-3 rounded-full bg-white/10 p-2 text-white" aria-label={t.nav.close} onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </button>
              <SidebarContent onNavigate={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
