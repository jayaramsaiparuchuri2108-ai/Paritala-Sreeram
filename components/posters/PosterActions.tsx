"use client";

import { Download } from "lucide-react";
import { ShareButtons } from "@/components/shared/ShareButtons";
import { useLang } from "@/components/shared/Providers";

export function PosterActions({ id, title }: { id: string; title: string }) {
  const { t } = useLang();
  return (
    <div className="space-y-5">
      <a
        href={`/api/posters/${id}/download`}
        className="inline-flex items-center gap-3 bg-ink px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.14em] text-brand transition-colors hover:bg-brand hover:text-ink hover:outline hover:outline-1 hover:outline-ink"
      >
        <Download className="h-5 w-5" /> {t.common.download}
      </a>
      <div>
        <p className="eyebrow mb-3 text-stone">{t.posters.shareTitle}</p>
        <ShareButtons path={`/posters/${id}`} title={title} />
      </div>
    </div>
  );
}
