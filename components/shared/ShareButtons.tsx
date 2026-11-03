"use client";

import { Check, Link2, Send, Share2 } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { useLang } from "@/components/shared/Providers";

interface Props {
  /** Site-relative path to share, e.g. /posters/abc */
  path: string;
  title: string;
  compact?: boolean;
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.9L2 22l5.27-1.5A9.9 9.9 0 1 0 12.04 2Zm5.8 14.1c-.25.7-1.45 1.33-2 1.4-.52.08-1.17.1-1.9-.12a17 17 0 0 1-1.72-.64c-3.03-1.3-5-4.37-5.15-4.57-.15-.2-1.23-1.63-1.23-3.1s.78-2.2 1.05-2.5c.27-.3.6-.37.8-.37h.58c.18 0 .43-.07.67.52.25.6.85 2.07.92 2.22.08.15.13.32.03.52-.1.2-.15.32-.3.5-.15.17-.32.38-.45.51-.15.15-.3.31-.13.6.17.3.77 1.27 1.65 2.06 1.13 1 2.08 1.32 2.38 1.47.3.15.47.12.65-.07.17-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.72.8 2.02.96.3.15.5.22.57.35.07.12.07.72-.18 1.42Z" />
    </svg>
  );
}

export function ShareButtons({ path, title, compact }: Props) {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);
  const canShare = useSyncExternalStore(
    () => () => undefined,
    () => "share" in navigator,
    () => false,
  );

  const fullUrl = () => `${window.location.origin}${path}`;
  const open = (href: string) => window.open(href, "_blank", "noopener,noreferrer");

  const base = "inline-flex items-center gap-2 border border-ink px-4 py-2 text-[13px] font-semibold transition-colors hover:bg-ink hover:text-brand";

  async function nativeShare() {
    try {
      await navigator.share({ title, url: fullUrl() });
    } catch {
      /* user dismissed */
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(fullUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="inline-flex items-center gap-2 bg-[#25D366] px-4 py-2 text-[13px] font-semibold text-ink transition-opacity hover:opacity-85"
        onClick={() => open(`https://wa.me/?text=${encodeURIComponent(`${title} ${fullUrl()}`)}`)}
      >
        <WhatsAppIcon /> {compact ? "WhatsApp" : t.common.shareWhatsapp}
      </button>
      <button type="button" className={base} onClick={() => open(`https://t.me/share/url?url=${encodeURIComponent(fullUrl())}&text=${encodeURIComponent(title)}`)}>
        <Send className="h-4 w-4" /> Telegram
      </button>
      <button type="button" className={base} onClick={() => open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl())}&text=${encodeURIComponent(title)}`)}>
        X
      </button>
      <button type="button" className={base} onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl())}`)}>
        Facebook
      </button>
      <button type="button" className={base} onClick={copy}>
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />} {copied ? t.common.linkCopied : t.common.copyLink}
      </button>
      {canShare && (
        <button type="button" className={base} onClick={nativeShare}>
          <Share2 className="h-4 w-4" /> {t.common.share}
        </button>
      )}
    </div>
  );
}
