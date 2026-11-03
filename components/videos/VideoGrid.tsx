"use client";

import { ExternalLink, Play } from "lucide-react";
import { useState } from "react";
import { Reveal } from "@/components/animations/Reveal";
import { EmptyState } from "@/components/shared/EmptyState";
import { useLang } from "@/components/shared/Providers";
import { pick } from "@/lib/i18n";
import type { VideoEntry } from "@/types";

function VideoCard({ video }: { video: VideoEntry }) {
  const { lang, t } = useLang();
  const [playing, setPlaying] = useState(false);
  const title = pick(video.title, lang);

  return (
    <article className="overflow-hidden rounded-2xl border-2 border-ink bg-white">
      <div className="relative aspect-video bg-ink">
        {video.youtubeId ? (
          playing ? (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
              title={title}
              allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <button type="button" onClick={() => setPlaying(true)} aria-label={`${t.common.play}: ${title}`} className="group absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100" />
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-brand text-ink shadow-lg transition-transform group-hover:scale-110">
                  <Play className="h-7 w-7 translate-x-0.5" fill="currentColor" />
                </span>
              </span>
            </button>
          )
        ) : (
          <a href={video.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 grid place-items-center text-brand">
            <ExternalLink className="h-10 w-10" />
          </a>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold leading-snug">{title}</h3>
        {video.description && pick(video.description, lang) && <p className="mt-1 text-sm text-stone">{pick(video.description, lang)}</p>}
        <a href={video.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-ink/70 hover:text-ink">
          {t.common.openOnYoutube} <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </article>
  );
}

export function VideoGrid({ videos, limit }: { videos: VideoEntry[]; limit?: number }) {
  const { t } = useLang();
  const shown = limit ? videos.slice(0, limit) : videos;
  if (shown.length === 0) return <EmptyState>{t.videos.empty}</EmptyState>;
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {shown.map((v, i) => (
        <Reveal key={v.id} delay={(i % 3) * 0.08}>
          <VideoCard video={v} />
        </Reveal>
      ))}
    </div>
  );
}
