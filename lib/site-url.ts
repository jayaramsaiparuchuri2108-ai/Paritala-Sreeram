/** Domain-independent base URL: explicit setting, then the Vercel production/deployment host, then localhost. */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (prod) return `https://${prod}`;
  const preview = process.env.VERCEL_URL;
  if (preview) return `https://${preview}`;
  return "http://localhost:3000";
}

export function absoluteUrl(pathname = "/"): string {
  return `${siteUrl()}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
