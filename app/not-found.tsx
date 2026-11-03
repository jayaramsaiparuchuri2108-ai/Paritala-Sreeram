import Link from "next/link";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";

export default async function NotFound() {
  const t = getDict(await getLang());
  return (
    <main className="grid min-h-screen place-items-center bg-cream px-6 text-center">
      <div>
        <p className="font-display text-8xl text-brand-deep">404</p>
        <h1 className="mt-2 font-display text-4xl uppercase">{t.notFound.title}</h1>
        <p className="mt-3 text-stone">{t.notFound.body}</p>
        <Link href="/" className="mt-8 inline-block rounded-full bg-ink px-7 py-3 font-bold text-brand">
          {t.notFound.home}
        </Link>
      </div>
    </main>
  );
}
