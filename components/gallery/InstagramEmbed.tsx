"use client";

import { ExternalLink, ImageOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/components/shared/Providers";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: (el?: Element) => void } };
  }
}

let scriptPromise: Promise<void> | null = null;
function loadEmbedScript(): Promise<void> {
  if (window.instgrm) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://www.instagram.com/embed.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("Instagram embed script failed to load"));
    };
    document.body.appendChild(s);
  });
  return scriptPromise;
}

type State = "idle" | "loading" | "ready" | "unavailable";

/**
 * Official Instagram embed (blockquote + embed.js). Loads only when scrolled near the viewport.
 * Shows a skeleton while loading and a link card if the embed cannot be displayed.
 */
export function InstagramEmbed({ url }: { url: string }) {
  const { t } = useLang();
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>("idle");

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    let timeout: number | undefined;
    let observer: MutationObserver | undefined;

    const start = async () => {
      setState("loading");
      node.replaceChildren();
      const bq = document.createElement("blockquote");
      bq.className = "instagram-media";
      bq.setAttribute("data-instgrm-permalink", url);
      bq.setAttribute("data-instgrm-version", "14");
      bq.style.cssText = "background:#FFF;border:0;border-radius:12px;margin:0;max-width:540px;min-width:280px;padding:0;width:100%";
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = url;
      bq.appendChild(a);
      node.appendChild(bq);

      observer = new MutationObserver(() => {
        if (node.querySelector("iframe")) {
          setState("ready");
          observer?.disconnect();
          if (timeout) window.clearTimeout(timeout);
        }
      });
      observer.observe(node, { childList: true, subtree: true });
      timeout = window.setTimeout(() => {
        if (!node.querySelector("iframe")) setState("unavailable");
      }, 14000);

      try {
        await loadEmbedScript();
        window.instgrm?.Embeds.process(node);
      } catch {
        setState("unavailable");
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          void start();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(node);

    return () => {
      io.disconnect();
      observer?.disconnect();
      if (timeout) window.clearTimeout(timeout);
    };
  }, [url]);

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-ink bg-white">
      <div ref={host} className={state === "unavailable" ? "hidden" : ""} />
      {(state === "idle" || state === "loading") && (
        <div aria-busy className="skeleton absolute inset-0 grid place-items-center">
          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold">{t.common.loading}</span>
        </div>
      )}
      {(state === "idle" || state === "loading") && <div className="aspect-[4/5]" aria-hidden />}
      {state === "unavailable" && (
        <div className="flex aspect-[4/5] flex-col items-center justify-center gap-4 bg-cream p-6 text-center">
          <ImageOff className="h-8 w-8 text-stone" />
          <p className="text-sm text-stone">{t.common.unavailable}</p>
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-bold text-brand">
            {t.common.openOnInstagram} <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  );
}
