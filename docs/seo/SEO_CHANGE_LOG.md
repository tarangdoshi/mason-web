# Mason SEO change & evidence log

One row per meaningful SEO change. Fill **Result** and **Decision / learning** once Search Console
(or another reliable source) shows the effect; do not record guesses as results.

| Date | Page / system | Change | Reason | Target intent | Expected effect | Baseline | Result | Decision / learning |
|---|---|---|---|---|---|---|---|---|
| 2026-10-06 | Whole site (`app/layout.tsx`) | `metadataBase` = `https://www.masoncompany.in`; `<html lang="en-IN">` | Canonicals/OG on `(marketing)` routes had no origin; locale was generic | All | One canonical origin everywhere; clearer India locale | Canonicals missing on 4 indexable pages | Pending GSC | — |
| 2026-10-06 | `/compare-packages`, `/evidence`, `/privacy`, `/terms` | Self-canonicals (compare also accepts `?preview=`) | Duplicate/parameter URLs could be indexed separately | Package comparison; evidence | Consolidated signals per page | No canonical | Pending GSC | — |
| 2026-10-06 | `/evidence` | Own title/description; "Aegis" codename and internal framing removed; "Mumbai & Goa context" → "Regional context" | Public page used the internal codename and implied a Mumbai service; title duplicated the site default | Falls/injury evidence for families | Correct entity, no Mumbai service implication, distinct title | Title = site default; "Aegis Evidence Layer" visible | Pending | Claims review still required (see report) |
| 2026-10-06 | Home page | Organization + WebSite JSON-LD from Sanity Contact & Support | No entity markup anywhere; package Service had an unlinked provider | Brand / entity queries | Clear Mason entity for search and answer systems | No Organization markup | Pending | No address/LocalBusiness: no public premises |
| 2026-10-06 | `/checkout/*` | `noindex, follow` | Transactional request forms duplicating package pages | — | Keep package pages as the indexed commercial pages | Indexable, no canonical | Pending | — |
| 2026-10-06 | `/crm/*` (incl. login) | `noindex, nofollow` (robots.txt still disallows crawling) | Staff login was indexable if linked; robots.txt does not prevent URL-only indexing | — | Staff surfaces never shown in results | No robots meta | Pending | — |
| 2026-10-06 | `sitemap.xml` | Removed per-request `lastmod` | `lastmod` was always "now", which teaches crawlers to ignore it | — | Trustworthy sitemap | lastmod = request time | Pending | Add real lastmod only from content timestamps |
| 2026-10-06 | `scripts/migrate-prerna-content.ts` | `--apply` refused (retired) | It writes ₹30,000/₹37,000 and a 1-Year Safety Check-Up into Sanity | — | Superseded facts cannot return to the live site | Apply mode available | — | — |
| 2026-10-06 | Tests (`lib/seo-foundation.test.ts`) | Crawl surface, metadata, structured data and critical-fact regression tests | Facts are duplicated in fallback and legacy content | — | Factual drift fails CI | None | 7 tests passing | — |
