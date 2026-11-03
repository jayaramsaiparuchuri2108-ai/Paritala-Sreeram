import { Send } from "lucide-react";
import Image from "next/image";
import { InstagramIcon } from "@/components/shared/Icons";
import Link from "next/link";
import { getSettings } from "@/lib/database/content";
import { getDict, pick } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";

const links = [
  { href: "/", key: "home" },
  { href: "/about", key: "about" },
  { href: "/activities", key: "activities" },
  { href: "/posters", key: "posters" },
  { href: "/gallery", key: "gallery" },
  { href: "/videos", key: "videos" },
  { href: "/contact", key: "contact" },
] as const;

export async function Footer() {
  const lang = await getLang();
  const t = getDict(lang);
  const { site, social } = await getSettings();

  return (
    <footer className="mt-24 bg-ink text-white">
      <div className="h-3 [background-image:repeating-linear-gradient(-45deg,#171717_0_8px,#f5d51c_8px_20px)]" />
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-white">
              <Image src="/logos/tdp-logo.png" alt="Telugu Desam Party logo" width={56} height={56} className="h-full w-full object-contain" />
            </span>
            <div>
              <p className="font-display text-2xl uppercase">{pick(site.name, lang)}</p>
              <p className="text-sm text-brand">{pick(site.designation, lang)}</p>
            </div>
          </div>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-white/70">
            <strong className="text-white">{t.footer.disclaimerTitle}: </strong>
            {pick(site.disclaimer, lang)} {t.footer.logoNote}
          </p>
        </div>

        <nav aria-label="Footer">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-brand">{t.footer.explore}</p>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-white/80 transition-colors hover:text-brand">
                  {t.nav[l.key]}
                </Link>
              </li>
            ))}
            <li className="col-span-2 mt-2">
              <Link href="/sources" className="text-white/80 underline decoration-brand decoration-2 underline-offset-4 hover:text-brand">
                {t.footer.sourcesLink}
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-brand">{t.footer.follow}</p>
          <div className="flex gap-3">
            {social.instagram && (
              <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid h-11 w-11 place-items-center rounded-full border-2 border-white/30 transition-colors hover:border-brand hover:bg-brand hover:text-ink">
                <InstagramIcon className="h-5 w-5" />
              </a>
            )}
            {social.telegram && (
              <a href={social.telegram} target="_blank" rel="noopener noreferrer" aria-label="Telegram" className="grid h-11 w-11 place-items-center rounded-full border-2 border-white/30 transition-colors hover:border-brand hover:bg-brand hover:text-ink">
                <Send className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {pick(site.name, lang)}
      </div>
    </footer>
  );
}
