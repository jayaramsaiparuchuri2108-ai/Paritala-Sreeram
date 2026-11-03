import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getSettings } from "@/lib/database/content";
import { getDict, pick } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";

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

export async function Footer() {
  const lang = await getLang();
  const t = getDict(lang);
  const { site, social, contact } = await getSettings();

  const socials = [
    { label: t.contact.instagram, href: social.instagram },
    { label: t.contact.telegram, href: social.telegram },
    { label: t.contact.facebook, href: social.facebook },
    { label: t.contact.x, href: social.x },
    { label: t.contact.youtube, href: social.youtube },
    { label: t.contact.whatsapp, href: social.whatsapp },
  ].filter((s) => s.href);

  const address = pick(contact.address, lang);
  const hasContact = Boolean(contact.email || contact.phone || address);

  return (
    <footer className="on-dark bg-ink text-white">
      <div className="h-1 bg-brand" />
      <div className="container-x grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-5">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-white">
              <Image src="/logos/tdp-logo.png" alt="Telugu Desam Party logo" width={56} height={56} className="h-full w-full object-contain" />
            </span>
            <div>
              <p className="font-display text-2xl font-bold leading-tight md:text-3xl">{pick(site.name, lang)}</p>
              <p className="mt-1 text-[13px] text-brand">{pick(site.designation, lang)}</p>
            </div>
          </div>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-white/65">{pick(site.tagline, lang)}</p>
          <p className="mt-6 max-w-md border-l border-brand/60 pl-4 text-xs leading-relaxed text-white/55">
            <strong className="font-semibold text-white/80">{t.footer.disclaimerTitle}: </strong>
            {pick(site.disclaimer, lang)} {t.footer.logoNote}
          </p>
        </div>

        <nav aria-label="Footer" className="md:col-span-3">
          <p className="eyebrow mb-5 text-brand">{t.footer.explore}</p>
          <ul className="space-y-2.5 text-sm">
            {links.map((l) => (
              <li key={l.key}>
                <Link href={l.href} className="text-white/75 transition-colors hover:text-brand">
                  {t.nav[l.key]}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Link href="/sources" className="link-line text-white/75 transition-colors hover:text-brand">
                {t.footer.sourcesLink}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="md:col-span-4">
          {socials.length > 0 && (
            <>
              <p className="eyebrow mb-5 text-brand">{t.footer.follow}</p>
              <ul className="space-y-2.5 text-sm">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1.5 text-white/75 transition-colors hover:text-brand">
                      {s.label} <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
          {hasContact && (
            <div className={socials.length > 0 ? "mt-10" : ""}>
              <p className="eyebrow mb-5 text-brand">{t.nav.contact}</p>
              <ul className="space-y-2 text-sm text-white/75">
                {contact.email && (
                  <li>
                    <a href={`mailto:${contact.email}`} className="hover:text-brand">
                      {contact.email}
                    </a>
                  </li>
                )}
                {contact.phone && (
                  <li>
                    <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className="hover:text-brand">
                      {contact.phone}
                    </a>
                  </li>
                )}
                {address && <li className="whitespace-pre-line">{address}</li>}
              </ul>
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-5 text-xs text-white/45 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {pick(site.name, lang)}
          </p>
          <p>{t.footer.independent}</p>
        </div>
      </div>
    </footer>
  );
}
