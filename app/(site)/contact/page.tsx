import { Mail, MapPin, Phone, Send } from "lucide-react";
import { Reveal } from "@/components/animations/Reveal";
import { InstagramIcon } from "@/components/shared/Icons";
import { PageHero } from "@/components/shared/PageHero";
import { getSettings } from "@/lib/database/content";
import { getDict, pick } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return pageMetadata({ path: "/contact", navKey: "contact" });
}

export default async function ContactPage() {
  const lang = await getLang();
  const t = getDict(lang);
  const { contact, social } = await getSettings();

  const channels = [
    { href: social.instagram, label: t.contact.instagram, Icon: InstagramIcon },
    { href: social.telegram, label: t.contact.telegram, Icon: Send },
    { href: social.facebook, label: t.contact.facebook, Icon: null },
    { href: social.x, label: t.contact.x, Icon: null },
    { href: social.youtube, label: t.contact.youtube, Icon: null },
    { href: social.whatsapp, label: t.contact.whatsapp, Icon: null },
  ].filter((c) => c.href);

  const direct = [
    contact.email && { Icon: Mail, label: t.contact.email, value: contact.email, href: `mailto:${contact.email}` },
    contact.phone && { Icon: Phone, label: t.contact.phone, value: contact.phone, href: `tel:${contact.phone.replace(/\s/g, "")}` },
    pick(contact.address, lang) && { Icon: MapPin, label: t.contact.address, value: pick(contact.address, lang), href: undefined },
  ].filter(Boolean) as { Icon: typeof Mail; label: string; value: string; href?: string }[];

  return (
    <>
      <PageHero title={t.contact.title} lead={t.contact.lead} />
      <section className="container-x grid gap-10 py-16 md:py-24 lg:grid-cols-2">
        <Reveal>
          <h2 className="mb-6 font-display text-3xl uppercase">{t.contact.follow}</h2>
          <ul className="space-y-4">
            {channels.map(({ href, label, Icon }) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between rounded-2xl border-2 border-ink bg-white p-5 transition-all hover:-translate-y-0.5 hover:bg-brand hover:shadow-[6px_6px_0_0_#171717]">
                  <span className="flex items-center gap-4 text-lg font-extrabold">
                    {Icon ? <Icon className="h-6 w-6" /> : <span className="h-6 w-6" />} {label}
                  </span>
                  <span className="max-w-[55%] truncate text-sm text-stone group-hover:text-ink">{href.replace(/^https?:\/\//, "")}</span>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="h-full rounded-2xl border-[3px] border-ink bg-cream p-6 md:p-8">
            {direct.length === 0 ? (
              <p className="text-ink/80">{t.contact.noDirect}</p>
            ) : (
              <ul className="space-y-5">
                {direct.map(({ Icon, label, value, href }) => (
                  <li key={label} className="flex items-start gap-4">
                    <Icon className="mt-1 h-5 w-5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-stone">{label}</p>
                      {href ? <a href={href} className="font-bold underline decoration-brand decoration-2 underline-offset-4">{value}</a> : <p className="font-bold">{value}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {pick(contact.note, lang) && <p className="mt-6 border-t-2 border-line pt-5 text-sm text-ink/75">{pick(contact.note, lang)}</p>}
          </div>
        </Reveal>
      </section>
    </>
  );
}
