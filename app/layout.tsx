import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource/anton/400.css";
import "@fontsource/playfair-display/500.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/playfair-display/800.css";
import "@fontsource/noto-serif-telugu/600.css";
import "@fontsource/noto-serif-telugu/700.css";
import "@fontsource/noto-sans-telugu/400.css";
import "@fontsource/noto-sans-telugu/500.css";
import "@fontsource/noto-sans-telugu/700.css";
import "@fontsource/noto-sans-telugu/800.css";
import "@/styles/globals.css";
import { Providers } from "@/components/shared/Providers";
import { getSettings } from "@/lib/database/content";
import { getLang } from "@/lib/lang-server";
import { pick } from "@/lib/i18n";
import { siteUrl } from "@/lib/site-url";

export async function generateMetadata(): Promise<Metadata> {
  const [lang, settings] = await Promise.all([getLang(), getSettings()]);
  const title = pick(settings.seo.title, lang);
  const description = pick(settings.seo.description, lang);
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: `%s · ${pick(settings.site.name, lang)}` },
    description,
    keywords: settings.seo.keywords,
    applicationName: pick(settings.site.name, lang),
    openGraph: { type: "website", siteName: pick(settings.site.name, lang), locale: lang === "te" ? "te_IN" : "en_IN", title, description },
    twitter: { card: "summary_large_image", title, description },
    icons: { icon: "/logos/tdp-logo.png", apple: "/logos/tdp-logo.png" },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: "#FFD600",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} suppressHydrationWarning>
      <body>
        <Providers initialLang={lang}>{children}</Providers>
      </body>
    </html>
  );
}
