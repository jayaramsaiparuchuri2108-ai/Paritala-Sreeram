"use client";

import { ChevronLeft, ChevronRight, Download, ExternalLink } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import { Lightbox } from "@/components/shared/Lightbox";
import { useLang } from "@/components/shared/Providers";
import { ShareButtons } from "@/components/shared/ShareButtons";
import { formatDate, pick } from "@/lib/i18n";
import type { GalleryPhoto } from "@/types";

interface Props {
  photos: GalleryPhoto[];
  /** Index into `photos`, or -1 when closed. */
  index: number;
  onClose: () => void;
  onStep: (delta: number) => void;
}

/** The website's own lightbox: large photograph on the left, caption and details on the right. */
export function PhotoViewer({ photos, index, onClose, onStep }: Props) {
  const { lang, t } = useLang();
  const photo = index >= 0 ? photos[index] : null;
  const swipe = useRef<{ x: number; y: number } | null>(null);

  return (
    <Lightbox
      open={photo !== null}
      onClose={onClose}
      label={photo ? pick(photo.title, lang) : ""}
      onPrev={() => onStep(-1)}
      onNext={() => onStep(1)}
      wide
    >
      {photo && (
        <article className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
          <div
            className="relative flex min-h-[40svh] items-center justify-center bg-ink lg:min-h-[70svh]"
            onPointerDown={(e) => (swipe.current = { x: e.clientX, y: e.clientY })}
            onPointerUp={(e) => {
              const s = swipe.current;
              swipe.current = null;
              if (!s) return;
              const dx = e.clientX - s.x;
              if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(e.clientY - s.y) * 1.5) onStep(dx < 0 ? 1 : -1);
            }}
          >
            <Image
              key={photo.id}
              src={photo.image}
              alt={pick(photo.alt, lang) || pick(photo.title, lang)}
              width={photo.width ?? 1600}
              height={photo.height ?? 1200}
              loading="eager"
              sizes="(max-width: 1023px) 100vw, 900px"
              className="h-auto max-h-[62svh] w-auto max-w-full object-contain lg:max-h-[82svh]"
              draggable={false}
            />
            {photos.length > 1 && (
              <>
                <button type="button" onClick={() => onStep(-1)} aria-label={t.common.previous} className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center bg-brand text-ink transition-colors hover:bg-white">
                  <ChevronLeft aria-hidden />
                </button>
                <button type="button" onClick={() => onStep(1)} aria-label={t.common.next} className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center bg-brand text-ink transition-colors hover:bg-white">
                  <ChevronRight aria-hidden />
                </button>
              </>
            )}
            <span className="absolute bottom-3 left-3 bg-ink/80 px-2.5 py-1 text-[11px] font-bold tracking-[0.14em] text-white">
              {index + 1} / {photos.length}
            </span>
          </div>

          <div className="flex flex-col gap-5 border-t-4 border-brand p-5 md:p-7 lg:border-l lg:border-t-0 lg:border-l-ink/10">
            <div>
              <p className="eyebrow mb-3 text-stone">{t.gallery.cat[photo.category]}</p>
              <h2 className="font-display text-2xl font-bold leading-tight md:text-3xl">{pick(photo.title, lang)}</h2>
            </div>
            {photo.caption && pick(photo.caption, lang) && <p className="text-[15px] leading-relaxed text-ink/80">{pick(photo.caption, lang)}</p>}

            <dl className="space-y-3 border-t border-ink/15 pt-4 text-sm">
              {photo.date && (
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone">{t.gallery.eventDate}</dt>
                  <dd className="mt-0.5 font-semibold">{formatDate(photo.date, lang)}</dd>
                </div>
              )}
              {photo.credit && (
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone">{t.gallery.credit}</dt>
                  <dd className="mt-0.5 font-semibold">{photo.credit}</dd>
                </div>
              )}
            </dl>

            <div className="mt-auto space-y-4">
              {photo.sourceUrl && (
                <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-semibold">
                  <span className="link-line">{t.gallery.originalPost}</span>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              )}
              {photo.allowDownload && (
                <a
                  href={`/api/gallery/${encodeURIComponent(photo.id)}/download`}
                  download
                  className="inline-flex items-center gap-2 bg-ink px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.12em] text-brand transition-colors hover:bg-brand hover:text-ink hover:outline hover:outline-1 hover:outline-ink"
                >
                  <Download className="h-4 w-4" aria-hidden /> {t.gallery.download}
                </a>
              )}
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-stone">{t.gallery.sharePhoto}</p>
                <ShareButtons path={`/gallery?photo=${encodeURIComponent(photo.id)}`} title={pick(photo.title, lang)} compact />
              </div>
            </div>
          </div>
        </article>
      )}
    </Lightbox>
  );
}
