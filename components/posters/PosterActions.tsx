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
        className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-bold text-brand transition-transform hover:scale-[1.03]"
      >
        <Download className="h-5 w-5" /> {t.common.download}
      </a>
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-stone">{t.posters.shareTitle}</p>
        <ShareButtons path={`/posters/${id}`} title={title} />
      </div>
    </div>
  );
}
