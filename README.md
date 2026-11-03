# Paritala Sreeram — public profile website

Bilingual (English / తెలుగు) public-profile site for **Paritala Sreeram**, Telugu Desam Party in-charge for Dharmavaram, with a secure admin panel, poster library and poster designer.

> This is an informational site. It is not an official party website and does not imply endorsement by the Telugu Desam Party. See `/sources` on the running site for the attribution page.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Motion + GSAP · Lucide · Upstash Redis · Vercel Blob · Vercel.

## What is in the box

| Area | Routes |
| --- | --- |
| Public | `/`, `/about`, `/activities`, `/posters`, `/posters/[id]`, `/gallery`, `/videos`, `/contact`, `/sources` |
| SEO | `sitemap.xml`, `robots.txt`, per-page metadata + canonical + Open Graph, JSON-LD (Person), generated OG image |
| Admin | `/admin` (dashboard), content CRUD for every section, poster designer (`/admin/designer`), gallery + Instagram manager, SEO / social / contact / site settings |
| API | `/api/admin/*` (session-protected), `/api/posters/[id]/download` (public) |

Language is a cookie (`ps_lang`); switching never changes the URL or scroll position. All content is stored as `{ en, te }` pairs.

## Local development

```bash
npm install
cp .env.example .env.local      # then set ADMIN_SESSION_SECRET (see below)
npm run dev
```

With **no** Upstash / Blob variables set, the app uses a local file store (`.data/db.json`) and local uploads (`.data/uploads`). This fallback is disabled in production.

Create an admin user (there is no public registration):

```bash
npm run admin:create
```

It prompts for an e-mail and a password (min 12 characters, upper + lower + digit). In CI you can pass `ADMIN_EMAIL` and `ADMIN_PASSWORD` as environment variables instead. Passwords are stored as scrypt hashes.

### Checks

```bash
npm run typecheck
npm run lint
npm test            # unit tests always run; API tests need a running server + admin credentials
npm run build
```

API integration tests run against `http://localhost:3100` (override with `TEST_BASE_URL`) and need `TEST_ADMIN_EMAIL` / `TEST_ADMIN_PASSWORD`; without them the authenticated tests are skipped.

## Configuration you must provide

| Variable | Where to get it | Required |
| --- | --- | --- |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | console.upstash.com → create Redis DB → REST API tab (or Vercel Marketplace → Upstash Redis) | Production |
| `BLOB_READ_WRITE_TOKEN` | Vercel project → Storage → Create Blob store (Public) → connect | Production |
| `ADMIN_SESSION_SECRET` | `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` (≥ 32 chars) | Always |
| `NEXT_PUBLIC_SITE_URL` | Your domain, once bought. Falls back to the Vercel URL, then localhost | Optional |

Never commit `.env*` files (they are git-ignored).

## Deploying to Vercel

1. Push this repo to GitHub (already wired to `origin`).
2. In Vercel: **Add New → Project →** import the repo. Framework preset: Next.js (auto-detected).
3. Add the environment variables above (Settings → Environment Variables) for Production (and Preview if wanted).
4. Deploy.
5. Create the first admin against the production database. From your machine, put the production `UPSTASH_REDIS_REST_*` values in `.env.local` temporarily, run `npm run admin:create`, then remove them.
6. Open `/admin/login`, sign in, and review every section. The first time a section is opened in the admin, the bundled content is copied into the database so it can be edited.
7. Custom domain: not purchased. When you have one, add it in Vercel → Domains and set `NEXT_PUBLIC_SITE_URL`.

Without Upstash configured in production, public pages still render from the bundled content and the admin fails closed (HTTP 503).

## Security summary

- scrypt password hashing; unknown e-mails are verified against a dummy hash (no user enumeration).
- Session cookie `ps_admin`: HttpOnly, SameSite=Strict, Secure in production, HMAC-signed, backed by a server-side session record (logout invalidates it).
- CSRF: every state-changing admin request requires a same-origin `Origin` header and an `x-csrf-token` bound to the session.
- Rate limiting (Redis): login per IP and per account, admin reads/writes, uploads, downloads.
- Input validation with Zod on every write; Instagram / YouTube URLs are normalised and host-checked; image URLs must come from the project's own Blob host or bundled assets.
- Uploads: JPG / PNG / WebP only, 8 MB max, magic-byte sniffing (a renamed file is rejected), SVG rejected, folder names restricted.
- Security headers in `next.config.ts`; `/admin` and `/api/` are `noindex` and disallowed in `robots.txt`.

## Content accuracy and open items for the site owner

Everything on the site comes from `research/source-registry.json` (sources and dated facts) and is explained in `research/research-report.md`. Nothing was invented. Items that need the owner:

1. **Telugu copy** was written by the build and needs review by a native reader.
2. **Photographs and videos**: none were published without authorisation. Upload authorised photos (Admin → Gallery, Home → hero image) and videos (Admin → Videos). Instagram posts are shown with Instagram's official embed.
3. **Trust / community activities**: the owner should supply verified items (Admin → Activities).
4. **Election row 2026**: shown as "Candidate — result awaited"; update when confirmed.
5. **Affidavit / personal details** (fact F16) are deliberately not shown — decide whether to disclose.
6. **TDP logo**: used as the party's identifier; confirm permission with the party office.
7. **Contact details**: none invented. Add the official ones in Admin → Contact.
8. **Domain**: not purchased.
