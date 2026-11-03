const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

/** Image/asset URLs must point to our own storage or bundled assets - never arbitrary hosts. */
export function isAllowedAssetUrl(value: string): boolean {
  if (value.startsWith("/api/dev-uploads/") || value.startsWith("/logos/") || value.startsWith("/images/")) {
    return !value.includes("..");
  }
  try {
    const u = new URL(value);
    return u.protocol === "https:" && u.hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

const IG_RE = /^https:\/\/(www\.)?instagram\.com\/(?:[A-Za-z0-9._]+\/)?(p|reel|reels|tv)\/([A-Za-z0-9_-]+)\/?$/;

/** Returns the canonical permalink for a public Instagram post/reel URL, or null. */
export function normalizeInstagramUrl(input: string): string | null {
  try {
    const u = new URL(input.trim());
    const clean = `${u.protocol}//${u.hostname}${u.pathname}`.replace(/\/?$/, "/");
    const m = IG_RE.exec(clean);
    if (!m) return null;
    const kind = m[2] === "reels" ? "reel" : m[2];
    return `https://www.instagram.com/${kind}/${m[3]}/`;
  } catch {
    return null;
  }
}

export function parseYoutubeId(input: string): string | null {
  try {
    const u = new URL(input.trim());
    if (u.protocol !== "https:") return null;
    const host = u.hostname.replace(/^www\./, "").replace(/^m\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0];
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (u.pathname === "/watch") id = u.searchParams.get("v");
      else {
        const m = /^\/(embed|shorts|live)\/([^/]+)/.exec(u.pathname);
        if (m) id = m[2];
      }
    }
    return id && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
