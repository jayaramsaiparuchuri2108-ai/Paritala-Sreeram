"use client";

import { PageHeader } from "@/components/admin/ui";
import { PosterEditor } from "@/components/posters/PosterEditor";
import { useLang } from "@/components/shared/Providers";

export function PosterDesignerPage() {
  const { t } = useLang();
  return (
    <div>
      <PageHeader eyebrow={t.admin.title} title={t.admin.designer} description={t.editor.lead} />
      <PosterEditor />
    </div>
  );
}
