# Mason launch readiness — 11 September 2026

Status: BLOCKED for unconditional Production approval. Frontend corrections are implemented; the remaining P0 is an unverified live lead-persistence gate, not a demonstrated backend defect. No Production writes or deployment were performed.

## Priorities

| Priority | Finding | Status / action |
|---|---|---|
| P0 release gate | Preview has no NEXT_PUBLIC_API_URL. A valid assessment request returns the intentional 503; real persistence/outbox creation cannot be certified. | Obtain a safe existing API target, or explicitly approve one controlled Production smoke test. Do not provision infrastructure as part of this audit. |
| P1 | Legacy CMS package descriptions imply different Advanced hardware. | Fixed in public mapping; CMS prices remain read from separate referencePrice/currentPrice fields. No CMS writes. |
| P1 | Unsupported free-visit claims on footer, packages, contact and preserved package routes. | Fixed in affected public templates; refund wording aligned on packages. |
| P1 | Legacy /compare-packages exposed the retired quiz. | Public section removed; reusable quiz/backend/history remain. |
| P1 | Slider lacked keyboard controls; mobile menu could keep content inert after desktop resize. | Fixed and exercised locally. |
| P1 configuration | Production Maps browser key absent; Preview key gets RefererNotAllowedMapError. | Manual fallback works. Successful Places selection not verified. Configure appropriate restricted key separately if Places is a launch requirement. |
| P1 configuration | Production GA measurement ID absent. | Attribution payload remains; GA reporting is not configured. Founder decision/configuration before launch if required. |
| P1 verification | Authenticated CRM and genuine success-state browser verification cannot be completed without an existing safe backend/session. | Public CRM login surface responds; do not claim authenticated list/detail verified. |
| P2 | PackageFeature normalization, CMS editor ergonomics, final imagery, image optimization, broader SEO, existing lint warnings. | Deferred. |
| P2 | /refund redirects to terms, which does not repeat the homepage refund promise. | Existing behavior preserved; legal wording requires separate founder review, not an invented promise. |

## Route audit

Read-only checks on the existing Preview: all following routes returned 200 (including followed redirects), except the deliberately unknown URL returned 404. 59 unique referenced local image/script assets returned 200. All internal links found among these routes resolved to an audited route; anchor IDs resolved (44 unique hrefs overall).

| Classification | Routes |
|---|---|
| Launch critical | /, /packages, /contact, /privacy, /terms, /refund (redirect), inline/modal assessment form |
| Secondary public | /about, /why, /evidence |
| Legacy/preserved public | /compare-packages, /packages/standard, /packages/advanced, /checkout/package-standard, /checkout/package-advanced, /communications |
| Internal/admin | /crm, /crm/login, /crm/leads/[id], /crm/content/[[...index]], /admin and its login/homepage/packages/testimonials/doctors/gallery/media pages, /content-preview, /operations/technician-readiness |
| Metadata / system | /robots.txt, /sitemap.xml, favicon/icon; /mason-audit-not-found returned 404 |
| API endpoints (not public pages) | /api/leads/guidance, /api/leads/checkout, draft-mode and CRM API routes |

The static build enumerates all page routes. Internal detail/authentication endpoints were code-reviewed, not exercised with credentials. A successful HTTP response alone is not authenticated CRM verification.

## Visual and responsive checks

Prerna source reference: /private/tmp/mason-prerna-frontend; live reference: https://mason-company.vercel.app/ . CSS matches the source with narrow legacy isolation/form overrides. Mobile hero compared visually against reference; desktop hero and mobile transformations/packages inspected. Section-by-section classifications below combine source comparison and targeted browser inspection; they are not a pixel-diff certification.

| Section | Result |
|---|---|
| Header/Nav | PASS; responsive resize interaction corrected |
| Hero | PASS; reference typography, image crop and CTA arrangement retained |
| Stats | PASS; approved CMS cards and reference structure |
| Transformations | PASS; reference images/layout, keyboard enhancement added |
| Why Mason | PASS by source/content inspection; same component structure |
| Process | PASS by source/content inspection; founder request-first text intentional |
| Packages | MINOR DRIFT intentional: founder prices and check-up content; legacy hardware copy corrected |
| Testimonials | MINOR DRIFT intentional: approved factual identities retained in reference presentation |
| FAQ | PASS by source/content inspection; founder product/refund copy intentional |
| Booking | MINOR DRIFT intentional: canonical functional form inside reference design |
| Footer | PASS; unsupported free claim corrected without redesign |

Homepage document overflow checked at actual 375, 390, 768, 1024, 1280, 1536px widths: no horizontal overflow. 1024px navigation bounds fit. Corrected local packages page checked at 390 and 1280px: no overflow; prices readable. Mobile menu opens/closes with Escape; corrected desktop resize unlocks body/content. Before/after slider ArrowRight changed aria-valuenow from 52 to 57. Touch-pan-y and pointer capture remain; physical-device touch drag was not separately exercised. No claim of exhaustive all-route/all-width coverage.

## Forms and backend evidence

Public form fields remain Full name, Mobile number, Email address, Location; CTA Request my visit. Required field validation exercised in Preview. A formatted +91 phone paste passed validation. A manually entered Mumbai address was submitted to the Preview proxy and received its expected backend-unavailable error, without geography rejection. Google produced RefererNotAllowedMapError; editable manual input and fallback hint remained available. No real lead was created by this check.

CODE VERIFIED: phone normalization (10 digits, 0, +91/91, separators, valid 6–9 prefixes, legitimate 91-starting national numbers); email; duplicate submission gate; loading/success/failure transport handling; UTM/session/quiz attribution; GOA/BANGALORE/OTHER/UNKNOWN behavior. API guidance route sets ENQUIRY, WEBSITE_FORM, NEW, phoneE164 and locationText, preserves metadata, creates CREATED and SOURCE_CAPTURED activities, then schedules Zoho outbox best-effort when enabled. Real transaction/outbox persistence remains unverified in this run. Canonical API tests use isolated test dependencies; they do not constitute a Production DB test.

PREVIEW VERIFIED: validation, manual non-service-market entry, actual Google authorization failure fallback, safe failed submission. Successful Google selection, successful live persistence and authenticated CRM detail access remain pending.

PRODUCTION VERIFIED HISTORICALLY: the founder reports the existing backend works; this audit does not independently certify historical transactions.

## Package and checkout journey

Homepage/package cards request a visit via BookingDialog and preserve package attribution. Both show the same 12-item kit and founder prices. Advanced public distinction is 1-Year Safety Check-Up Included; underlying coverage remains exactly one included first-year visit with necessary corrective support. Legacy package CMS descriptions are temporarily subordinated to approved launch copy; pricing remains CMS-backed. This is documented debt, not a CMS migration.

Legacy comparison/detail routes can still reach /checkout/package-*. Checkout explicitly records a package request/payment preference and says no online payment is collected. It is not the primary Prerna CTA journey. Its API contract remains unchanged; no Razorpay payment or automatic link is fabricated. No real checkout request was submitted.

## SEO, runtime and Production configuration

Titles, descriptions, homepage/packages canonicals, favicon, Open Graph and sitemap exist. Public layout has the Production metadata base. Preview intentionally uses noindex/disallow; Production path permits indexing. Corrected stale Mumbai market text in inherited root description. Secondary/legacy pages retain their existing design and metadata. No broad SEO rewrite.

No hydration/render-loop failure observed. Google authorization error is known; manual fallback handles it. Public homepage first-load JS was approximately 188kB in the prior build, with the full Sanity Studio isolated on the internal route. No new dependencies were added.

Read-only Production web env audit (presence only): NEXT_PUBLIC_API_URL PRESENT (HTTPS, non-localhost), NEXT_PUBLIC_SANITY_PROJECT_ID PRESENT, NEXT_PUBLIC_SANITY_DATASET PRESENT, NEXT_PUBLIC_SANITY_API_VERSION PRESENT, NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ABSENT, GOOGLE_MAPS_API_KEY ABSENT, NEXT_PUBLIC_GA_MEASUREMENT_ID ABSENT. No configuration changed. Preview API variable is absent. Direct published CMS reads do not need a token; no write token should be added to public client code.

## Launch and rollback sequence

1. Review this feature-branch diff/PR #1 and its fresh Preview. Keep PR unmerged until gates close.
2. Resolve the P0 persistence verification using an existing safe API target, or explicit founder approval for one controlled Production smoke test. Verify lead ID, ENQUIRY, WEBSITE_FORM, metadata, activities and expected outbox event; no replay/drain.
3. Decide/configure restricted Maps and analytics identifiers as needed. Verify the success journey and authenticated CRM with appropriate access. Retest changed Preview pages.
4. Record current Production deployment again immediately before cutover; confirm no concurrent release changed it.
5. Founder approves merge of PR #1. Merge through GitHub into canonical main; allow its normal Vercel Production pipeline. Do not deploy a local branch to Production.
6. Verify Production navigation, form success, lead persistence and console, with explicitly authorized test data.
7. If regression occurs, use Vercel Instant Rollback to the recorded deployment. Current verified target: dpl_HiHLHcSHp9RK4ssye7bCmNdJSsLY, https://aegis-living-t0iceirhz-tarangdoshi5-2978s-projects.vercel.app/ (main commit b84f05619408a8726f1ed535e07cc43b5837ce21). Dashboard: aegis-living-web → Deployments → target deployment → Instant Rollback. CLI equivalent when authorized: vercel rollback aegis-living-t0iceirhz-tarangdoshi5-2978s-projects.vercel.app --scope tarangdoshi5-2978s-projects.
8. Deployment rollback does not revert shared Sanity content. The approved homepage backup remains /tmp/mason-sanity-homepage-backup/mason-sanity-backup-2026-09-10T22-25-37-505Z.json. Do not restore it automatically. Preserve it outside temporary storage before any future content rollback plan.

## Verification results

Lint: passed, five pre-existing warnings. TypeScript: passed. Web: 57/57 passed. Canonical API: 73/73 passed (workspace filter also ran 30/30 legacy-preview-worktree tests). Production build: passed, including the final label correction, after using network permission for existing Google Fonts. git diff --check: passed. No Sanity migration rerun, database writes, Redis changes or Zoho replay.
