"use client";

import { PosterEditor } from "@/components/posters/PosterEditor";
import { useLang } from "@/components/shared/Providers";

export function PosterDesignerPage() {
  const { t } = useLang();
  return (
    <div>
      <p className="mb-6 max-w-3xl text-sm text-stone">{t.editor.lead}</p>
      <PosterEditor />
    </div>
  );
}
