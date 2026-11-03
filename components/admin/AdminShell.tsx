"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen,
  CalendarDays,
  Camera,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  FileImage,
  Film,
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
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAdmin } from "@/components/admin/AdminProvider";
import { cx } from "@/components/admin/ui";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useLang } from "@/components/shared/Providers";
import { useAdminT } from "@/components/admin/i18n";

interface NavItem {
  href: string;
  label: (t: ReturnType<typeof useLang>["t"]) => string;
  icon: LucideIcon;
}

const groups: { title: { en: string; te: string }; items: NavItem[] }[] = [
  {
    title: { en: "Overview", te: "సారాంశం" },
    items: [{ href: "/admin", label: (t) => t.admin.dashboard, icon: LayoutDashboard }],
  },
  {
    title: { en: "Website content", te: "వెబ్‌సైట్ కంటెంట్" },
    items: [
      { href: "/admin/home", label: (t) => t.admin.home, icon: Home },
      { href: "/admin/biography", label: (t) => t.admin.biography, icon: BookOpen },
      { href: "/admin/timeline", label: (t) => t.admin.timeline, icon: ListOrdered },
      { href: "/admin/electoral", label: (t) => t.admin.electoral, icon: Vote },
      { href: "/admin/focus", label: (t) => t.admin.focus, icon: Target },
      { href: "/admin/activities", label: (t) => t.admin.activities, icon: CalendarDays },
      { href: "/admin/updates", label: (t) => t.admin.updates, icon: Newspaper },
    ],
  },
  {
    title: { en: "Media", te: "మీడియా" },
    items: [
      { href: "/admin/gallery", label: (t) => t.admin.gallery, icon: Images },
      { href: "/admin/designer", label: (t) => t.admin.designer, icon: Palette },
      { href: "/admin/posters", label: (t) => t.admin.posters, icon: FileImage },
      { href: "/admin/categories", label: (t) => t.admin.categories, icon: Tags },
      { href: "/admin/videos", label: (t) => t.admin.videos, icon: Film },
      { href: "/admin/instagram", label: (t) => t.admin.instagram, icon: Camera },
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

const STORAGE_KEY = "ps-admin-sidebar";

function initialOf(email: string) {
  return (email.trim()[0] ?? "A").toUpperCase();
}

function SidebarContent({ collapsed, onNavigate, onToggle, showViewSite }: { collapsed: boolean; onNavigate?: () => void; onToggle?: () => void; showViewSite?: boolean }) {
  const { t, lang } = useLang();
  const a = useAdminT();
  const pathname = usePathname();
  const router = useRouter();
  const { api, email } = useAdmin();

  async function signOut() {
    await api("/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col">
      <div className={cx("flex items-center gap-3 border-b border-white/10 py-5", collapsed ? "justify-center px-2" : "px-5")}>
        <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-2 ring-brand">
          <Image src="/logos/tdp-logo.png" alt="" width={40} height={40} className="h-full w-full object-contain" />
        </span>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate font-display text-lg leading-none text-white">{t.brand.name}</p>
            <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-brand">{t.admin.title}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-3 py-5" aria-label="Admin">
        {groups.map((g) => (
          <div key={g.title.en}>
            {collapsed ? (
              <div aria-hidden className="mx-3 mb-2 h-px bg-white/10" />
            ) : (
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">{g.title[lang]}</p>
            )}
            <ul className="space-y-0.5">
              {g.items.map(({ href, label, icon: Icon }) => {
                const active = href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
                const text = label(t);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      aria-label={collapsed ? text : undefined}
                      title={collapsed ? text : undefined}
                      className={cx(
                        "group relative flex items-center gap-3 py-2.5 text-[13px] font-semibold transition-colors",
                        collapsed ? "justify-center px-0" : "px-3",
                        active ? "bg-white/[0.08] text-brand" : "text-white/70 hover:bg-white/[0.06] hover:text-white",
                      )}
                    >
                      {active && <motion.span layoutId="admin-nav-bar" className="absolute inset-y-0 left-0 w-[3px] bg-brand" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                      {!collapsed && <span className="truncate">{text}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className={cx("flex items-center gap-3 bg-white/[0.05] p-2.5", collapsed && "flex-col")}>
          <span className="grid h-9 w-9 shrink-0 place-items-center bg-brand font-display text-base text-ink" aria-hidden title={email}>
            {initialOf(email)}
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white">{a.administrator}</p>
              <p className="truncate text-[11px] text-white/55" title={email}>
                {email}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={signOut}
            title={t.admin.signOut}
            aria-label={t.admin.signOut}
            className="grid h-9 w-9 shrink-0 place-items-center text-white/70 transition-colors hover:bg-red-600 hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px]" aria-hidden />
          </button>
        </div>
        {showViewSite && (
          <Link href="/" target="_blank" className="mt-1 flex items-center gap-3 px-3 py-2 text-[13px] font-semibold text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white">
            <ExternalLink className="h-[18px] w-[18px] shrink-0" aria-hidden /> {t.admin.viewSite}
          </Link>
        )}
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? a.expandSidebar : a.collapseSidebar}
            title={collapsed ? a.expandSidebar : a.collapseSidebar}
            className={cx("mt-1 hidden w-full items-center gap-3 py-2 text-[12px] font-semibold text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white lg:flex", collapsed ? "justify-center" : "px-3")}
          >
            {collapsed ? <ChevronsRight className="h-[18px] w-[18px]" aria-hidden /> : <ChevronsLeft className="h-[18px] w-[18px]" aria-hidden />}
            {!collapsed && a.collapseSidebar}
          </button>
        )}
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useLang();
  const a = useAdminT();
  const pathname = usePathname();
  // The page title is the label of the matching navigation item, so it follows the language switcher.
  const current = groups.flatMap((g) => g.items).find(({ href }) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`)));
  const title = current && current.href !== "/admin" ? current.label(t) : undefined;
  const wide = pathname.startsWith("/admin/designer");
  const drawerClose = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  // Remember the sidebar state between visits.
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
      } catch {
        /* storage unavailable */
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, c ? "0" : "1");
      } catch {
        /* storage unavailable */
      }
      return !c;
    });
  }

  // Mobile drawer: Escape closes, page behind does not scroll, focus moves into the drawer.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerClose.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="min-h-screen bg-cream" style={{ "--admin-sidebar": collapsed ? "76px" : "272px" } as React.CSSProperties}>
      <a href="#admin-main" className="sr-only z-[200] bg-brand px-4 py-2 text-sm font-bold text-ink focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        {a.skipToContent}
      </a>
      <aside
        className={cx("on-dark fixed inset-y-0 left-0 z-30 hidden bg-ink transition-[width] duration-300 ease-out lg:block", collapsed ? "w-[76px]" : "w-[272px]")}
        aria-label="Admin sidebar"
      >
        <SidebarContent collapsed={collapsed} onToggle={toggleCollapsed} />
      </aside>

      <div className={cx("min-w-0 transition-[padding] duration-300 ease-out", collapsed ? "lg:pl-[76px]" : "lg:pl-[272px]")}>
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-ink/15 bg-white/95 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" className="grid h-10 w-10 place-items-center border border-ink/30 hover:bg-brand lg:hidden" aria-label={t.nav.menu} aria-expanded={open} onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" aria-hidden />
            </button>
            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-stone">
              <Link href="/admin" className="hover:text-ink">
                {t.admin.title}
              </Link>
              {title && (
                <>
                  <span aria-hidden>/</span>
                  <span className="truncate text-ink" aria-current="page">
                    {title}
                  </span>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" target="_blank" className="hidden items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] hover:text-stone sm:inline-flex">
              <ExternalLink className="h-4 w-4" aria-hidden /> {t.admin.viewSite}
            </Link>
            <LanguageSwitcher id="admin" />
          </div>
        </header>
        <main id="admin-main" tabIndex={-1} className={cx("mx-auto w-full p-4 outline-none md:p-6 lg:p-8", wide ? "max-w-none" : "max-w-[1400px]")}>
          {children}
        </main>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-ink/70 backdrop-blur-[2px] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={a.navigation}
              className="on-dark fixed inset-y-0 left-0 z-50 w-[86vw] max-w-[320px] bg-ink lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <button ref={drawerClose} type="button" className="absolute right-3 top-4 z-10 grid h-9 w-9 place-items-center text-white/80 hover:bg-brand hover:text-ink" aria-label={t.nav.close} onClick={() => setOpen(false)}>
                <X className="h-5 w-5" aria-hidden />
              </button>
              <SidebarContent collapsed={false} showViewSite onNavigate={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
