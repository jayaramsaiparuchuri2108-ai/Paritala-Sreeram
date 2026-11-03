import Link from "next/link";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";

export default async function NotFound() {
  const t = getDict(await getLang());
  return (
    <main className="on-dark grid min-h-screen place-items-center bg-ink px-6 text-center text-white">
      <div>
        <p className="font-display text-9xl font-bold text-brand">404</p>
        <div className="mx-auto my-6 h-1 w-16 bg-brand" />
        <h1 className="font-display text-4xl font-bold">{t.notFound.title}</h1>
        <p className="mt-3 text-white/65">{t.notFound.body}</p>
        <Link href="/" className="mt-9 inline-block bg-brand px-7 py-3.5 text-[13px] font-bold uppercase tracking-[0.14em] text-ink transition-colors hover:bg-white">
          {t.notFound.home}
        </Link>
      </div>
    </main>
  );
}
