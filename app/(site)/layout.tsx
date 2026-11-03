import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Loader } from "@/components/layout/Loader";
import { getSettings } from "@/lib/database/content";
import { getLang } from "@/lib/lang-server";
import { getDict } from "@/lib/i18n";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, lang] = await Promise.all([getSettings(), getLang()]);
  const t = getDict(lang);
  return (
    <>
      <Loader />
      <a href="#main" className="sr-only z-[120] bg-ink px-4 py-2 font-bold text-brand focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        {t.nav.skip}
      </a>
      <Header name={settings.site.name} />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
