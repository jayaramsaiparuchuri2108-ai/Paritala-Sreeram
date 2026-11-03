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
| Admin | `/admin` (dashboard), content CRUD for every section, poster designer (`/admin/designer`), photo gallery manager (+ legacy Instagram list), SEO / social / contact / site settings |
| API | `/api/admin/*` (session-protected), `/api/posters/[id]/download` (public) |

Language is a cookie (`ps_lang`); switching never changes the URL or scroll position. All content is stored as `{ en, te }` pairs.

## Visual design

The front end follows an editorial, premium-political look: yellow `#FFD600` / black `#080808` / white, serif display headings (Playfair), small letter-spaced uppercase labels, clean sans body, Noto Sans Telugu for Telugu, square corners and thin borders. Colours and fonts are tokens in `styles/globals.css` (`@theme`), so a palette change is a one-file edit. Animation is restrained and respects `prefers-reduced-motion`.

Home page order: black hero → editorial intro → alternating image/text splits (biography, journey, responsibilities, community) → newspaper-style activities and updates → numbered **Areas of Focus** → dark recent-activity photo strip → yellow "Explore Posters" band → black footer. The community split and videos band only appear when matching content exists.

**Areas of Focus** (Admin → Areas of focus) are neutral informational categories with an optional description. Add a description only once it is approved; do not use them for promises or claims of completed work.

## Admin panel

The admin shares the public site's visual identity (black / white / political yellow, Playfair headings, square corners, thin borders) and is built from one small kit in `components/admin/ui.tsx` (buttons, cards, badges, skeletons, empty states, accessible modal, toasts and a promise-based confirm dialog).

- **Shell** — collapsible sidebar (state remembered in the browser), grouped navigation that lists only sections that exist (Overview · Website content · Media · Settings), administrator card with sign-out, slide-out drawer on mobile, skip link, breadcrumb title that follows the language switcher. The shell lives in `app/admin/(panel)/layout.tsx`, so the sidebar persists between pages.
- **Dashboard** — welcome and administrator card, quick actions, content / published / draft counts, latest photographs, pending gallery approvals (permission not yet authorised), recent website activity and a draft-vs-published bar per section. Everything comes from `/api/admin/stats`; nothing is sample data, and empty sections show instructions instead. Items created or edited from now on carry server-stamped `createdAt` / `updatedAt`, which is what feeds *Recent activity*; older items simply have no time shown.
- **Content editors** — one editor (`ItemEditor`) for every section: fields grouped into Content / Images / Details and sources / Publishing, EN + TE side by side or one language at a time, drag-and-drop image upload, labels with helper text, inline validation, **Save draft / Publish / Update / Cancel**, an unsaved-changes guard and confirmation before every delete. Lists have search, a published/draft filter, reorder arrows and loading skeletons.
- **Photo gallery** — `GalleryManager`: drag-and-drop multi-upload with per-file progress and retry, large thumbnail grid, search, category and status filters (Live / Drafts / Awaiting permission), bulk select with publish / unpublish / delete, drag-to-reorder (when no filter is active), an edit modal with a live "ready to go live?" checklist, and a preview that uses the public viewer.
- **Poster designer** — three-column workspace (templates, background and layers on the left, large canvas with add-tools in the middle, properties and save on the right), photos chosen from authorised gallery photographs, keyboard nudging on the canvas.

The redesign changed no API route, schema, storage or authentication behaviour. The only server additions are the `createdAt` / `updatedAt` stamps and extra fields on `/api/admin/stats` (the existing fields are unchanged).

## Photo gallery

The Gallery page is a real photo archive (no Instagram embeds): masonry grid, category chips with counts, search, lazy-loaded responsive images, and the site's own lightbox with previous/next (buttons, arrow keys, swipe), caption, verified event date, credit, an optional small "Original post" link, share buttons and — only when the admin allows it — a download button. Shared links like `/gallery?photo=<id>` open the photograph directly.

**Admin → Photo gallery** can: upload many photographs at once (drag and drop, stored as unpublished drafts awaiting permission), edit EN/TE title, caption and alt text, set category, verified date, original post URL and credit, mark permission (*Pending* / *Authorised*), allow downloads, feature a photograph, reorder, publish/unpublish, preview, edit and delete. A photograph is public only when it is **Published, Authorised and has alt text** — the server enforces this.

**Storage.** Uploads go to Vercel Blob in production (`gallery/<category>/<descriptive-name>-<hash>.<ext>`) and to `.data/uploads` locally. The original file is stored untouched; Next.js serves optimised AVIF/WebP at the right size. Identical bytes are detected by content hash and reused instead of stored twice; a stored file is deleted only when no record uses it any more. Uploads are checked by magic bytes, limited to JPG/PNG/WebP, 8 MB and 12 000 px, and the pixel size is recorded so layouts never shift.

**Slots fill themselves.** Home panels take their own uploaded image if one is set; otherwise they use a photograph from the matching gallery category (Portraits → hero and biography, Political & party activities → journey, Public meetings → roles, Public visits & community → community). The About page uses the first Portraits photograph. The poster designer's photo layer can pick any authorised gallery photograph. Areas with no photograph show a plain typographic panel — never a stand-in image.

**What is still needed.** See `research/photo-collection-checklist.md` (exact photographs and details to supply) and `research/photo-register.md` (what is bundled and its permission status).

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
2. **Photographs and videos**: one official portrait (supplied by the site owner) is bundled; its original post URL, caption, date and written rights confirmation are not recorded yet. All other photographs must be supplied — see `research/photo-collection-checklist.md`. Photographs are never scraped from Instagram/Facebook. Videos: Admin → Videos.
3. **Trust / community activities**: the owner should supply verified items (Admin → Activities).
4. **Election row 2026**: shown as "Candidate — result awaited"; update when confirmed.
5. **Affidavit / personal details** (fact F16) are deliberately not shown — decide whether to disclose.
6. **TDP logo**: used as the party's identifier; confirm permission with the party office.
7. **Contact details**: none invented. Add the official ones in Admin → Contact.
8. **Domain**: not purchased.
9. **Areas of Focus descriptions**: shipped empty; add approved wording in Admin → Areas of focus.
10. **Page loader**: a brief branded loader shows on full page loads (not on language switch); remove `<Loader />` from `app/(site)/layout.tsx` if undesired.
