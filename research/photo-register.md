# Photograph register

This file records every photograph that ships inside the repository. Photographs added later through
**Admin → Photo gallery** are recorded in the gallery itself — each item stores its own source URL, caption,
verified date, credit, permission status, alt text (English + Telugu) and its stored filename. Treat the admin
list as the live register; update this file only for images bundled in `/public`.

Rules applied to every entry:

- Only photographs the rights holder has approved for this website are published (`permission = authorised`).
- Captions, event dates and descriptions are never invented. A field that was not supplied stays empty.
- Photographs are not taken from Instagram or Facebook by scraping, unofficial APIs, browser automation or
  login/rate-limit bypass. Platform CDN URLs are never hard-coded (they expire).

## Bundled photographs

| # | File | Category | Source post URL | Original caption | Event date | Permission | Used in |
| - | ---- | -------- | --------------- | ---------------- | ---------- | ---------- | ------- |
| 1 | `public/images/portraits/paritala-sreeram-official-portrait.webp` (1500 × 844, WebP) | Portraits | Not supplied | Not supplied | Not supplied | **Authorised** — supplied by the site owner for this website. Record the rights holder's written confirmation here: _pending_ | Home hero, home biography panel, About page, Gallery (featured), Poster designer picker |

Alt text — EN: "Paritala Sreeram in a white shirt with hands folded in a namaste greeting, against a yellow background".
TE: "పసుపు నేపథ్యంలో తెల్ల చొక్కా ధరించి చేతులు జోడించి నమస్కరిస్తున్న పరిటాల శ్రీరామ్" (needs native-reader review).

To fill the missing details for #1, open **Admin → Photo gallery → Official portrait** and add the original post URL,
caption and date once confirmed. (The seed copy lives in `data/seed.ts → seedGallery`; the admin copy takes over after
the first time the gallery is opened.)
