# Mason corrected Preview acceptance and CMS gate

Date: 2026-09-11  
Branch: `feature/prerna-frontend-integration`  
Local integration commit before this acceptance pass: `c8e5a6e`  
Corrected Preview supplied by founder: https://aegis-living-e00upca04-tarangdoshi5-2978s-projects.vercel.app/

## Current decision

The branch contains the corrected package, pricing, CMS mapping, copy, and Google Places fallback work. Production was not changed. The Sanity migration was not run. PR #1 was not merged.

The Preview URL returned HTTP 200 during an earlier header check, but the host subsequently denied browser automation and began returning intermittent DNS failures. Vercel deployment ID, live commit, browser console, visual, and end-to-end lead checks therefore remain unverified in this pass. The local branch is the source of the implementation evidence below.

## Integration audit

### Existing Mason routes and functionality

The canonical web app retains the public routes `/`, `/about`, `/contact`, `/packages`, `/why`, `/privacy`, `/terms`, `/refund`; the package request route `/checkout/[packageId]`; comparison, evidence, communications, content preview, and technician-readiness routes; CRM routes under `/crm`; legacy `/admin` routes; draft-mode routes; and lead endpoints `/api/leads/guidance` and `/api/leads/checkout`. The API remains in `/Users/tarang/Documents/Documents/Aegis/apps/api` and was not changed.

The existing lead flow keeps enquiry creation, attribution and UTM capture, quiz context, contact metadata, CRM forwarding, Google Places/geolocation metadata, silent market classification, and checkout request payloads. Assessment location remains non-blocking.

### Prerna source routes and components

Prerna's source (`/private/tmp/mason-prerna-frontend`, commit `670a599399d022aaedda779b20fa63cf7e556497`) supplies `/`, `/about`, `/contact`, `/packages`, `/why`, `/privacy`, `/refund`, `/terms`, and the visual component set: navigation, hero, stats, assessment CTA, transformations, package cards, process, doctor cards, testimonials, FAQ, booking, footer, motion/reveal helpers, and location field. Its live Preview remains the visual reference at https://mason-company.vercel.app/.

### What would be lost by deploying Prerna directly

Direct deployment would omit Mason's real lead/API routes, CRM and internal content tools, Sanity/draft preview, attribution and quiz persistence, package request/checkout integration, market metadata, legal and evidence routes, sitemap/robots behavior, and existing analytics instrumentation. The integration keeps those surfaces and places the Prerna presentation over them.

### Framework and dependency differences

Prerna uses Next 16.2.11 and React 19.2.4. Mason remains on Next 15.5.12 and React 19.1.1. The integration adds the Prerna runtime dependencies `@gsap/react`, `gsap`, `lenis`, Tailwind v4/PostCSS support, and ESLint/TypeScript scripts while retaining Mason's Sanity, Ant Design, API, and CRM dependencies. No API dependency changed.

### Integration points

Public assessment forms post to `/api/leads/guidance`; package requests post to `/api/leads/checkout`. `lib/lead-context.ts` carries UTM, campaign, CTA, quiz, and contact context. `lib/location.ts` classifies locations as GOA, BANGALORE, OTHER, or UNKNOWN through the existing serviceability helpers. `lib/site-content.ts` reads Sanity and applies the locked package safety guard before the Prerna components render. No mock API or Production endpoint was added.

### Assets, fonts, and styles

The Prerna images and logos live under `public/prerna/`. Public layout loads Archivo, Fraunces, Geist, and Geist Mono through `next/font`; the visual styles remain in `app/(public)/public.css` and Tailwind classes. The two acceptance regressions previously identified (dialog focus outline and unintended button shadows) are addressed in the public stylesheet.

### SEO, metadata, and environment

Public metadata, canonical URLs, Open Graph/Twitter images, sitemap, robots, favicon, and route metadata remain in the canonical app. Required runtime configuration includes the existing API base/lead settings, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (optional enhancement; manual entry works without it), and the existing Sanity project/dataset/API-version variables. Draft preview additionally needs the existing `SANITY_API_READ_TOKEN`. No write token is present in the worktree `.env.local`.

### Deployment risks

The old `mason-api-preview` environment remains intentionally out of scope. The supplied corrected Preview is the frontend verification target, but browser automation and Vercel/GitHub inspection were blocked by the host usage limit during this pass. The canonical web workspace also has a pre-existing monorepo lockfile mismatch caused by `apps/api-preview-worktree/package.json`; it is unrelated to this branch's web dependency graph.

## Locked package presentation

Both packages use the same 12 component rows and exact quantities:

| Customer-facing name | Quantity |
| --- | ---: |
| Vertical grab bars | 3 |
| L / angled grab bar | 1 |
| Flip-up / folding support bar | 1 |
| Anti-slip surface treatment | 1 |
| Shower anti-slip mat | 1 |
| Post-shower anti-slip mat | 1 |
| Shower seating stool | 1 |
| Two-way lock | 1 |
| Edge & corner protection | 1 |
| Drainage support | 4 |
| Bathroom slippers | 1 |
| Reinforced fixture support | 1 |

Sensor lighting, Fall Alert/SOS hardware, and toilet-seat/raised-seat/commode support are excluded. “Reinforced fixture support” is limited to higher-strength fixings for toilets and washbasins. “Edge & corner protection” is protective cushioning/tape for sharp edges; neither implies structural bathroom reinforcement.

Standard is ₹30,000 with a struck-through reference price of ₹35,000. Advanced is ₹37,000 with a struck-through reference price of ₹44,000. The values are represented as separate Sanity `referencePrice` and `currentPrice` fields and rendered with current price emphasis. Advanced's only package difference is **“1-Year Safety Check-Up Included”**: one technician visit during the first year to inspect the completed work, identify flaws or additional support needs, and cover necessary corrective work or additional support identified during that included visit. No unlimited maintenance or perpetual AMC promise is shown.

## Sanity audit and migration gate

Existing schemas, queries, published content, draft perspective, image projections, SEO settings, and CRM content tooling were audited. The existing `homepage`, `siteSettings`, `package`, `packageFeature`, `testimonial`, `doctor`, and `galleryItem` documents remain in place. The change is additive: package schemas now support `referencePrice`, `currentPrice`, and `followUpLabel`; package features support `publicLabel`, `publicDescription`, and `quantity`; the query projects those fields; and the public content mapper uses them when present.

The public homepage now reads the Sanity homepage payload for the hero, evidence cards, what-we-do copy, transformations heading, process steps, doctors, testimonials, FAQ, final CTA, and package data, with Prerna's visual components and static assets as presentation fallbacks. Locked package safeguards prevent an older published package document from resurfacing retired sensor/commode/AMC inclusions before its CMS fields are corrected.

The migration script is `scripts/migrate-package-catalog.ts`. It targets project `NEXT_PUBLIC_SANITY_PROJECT_ID` and dataset `NEXT_PUBLIC_SANITY_DATASET || production`; it requires `SANITY_API_WRITE_TOKEN`. It preflights both package documents and all existing feature documents, may create only `packageFeature-anti-slip-mat-post-shower`, sets public labels/descriptions/quantities, sets the two locked package reference/current prices and shared feature references, clears package add-on references, and sets the Advanced follow-up label. It performs no deletes or unsets and Sanity commits the transaction atomically. A `--dry-run` path prints the preflight/plan without writing.

The migration has **not** been run. It is not yet safe to authorize against a live dataset without an exported Sanity backup and founder approval because it changes the current published `includedFeatures`/`availableAddOns` arrays and package price fields. Before authorization: export the target documents, review the diff, run the dry run, record the project/dataset, then run once with the write token. Rollback is restoring the exported documents through Sanity; the transaction itself cannot partially commit.

## Google Places graceful fallback

`loadGooglePlaces` now handles script errors, timeouts, missing Places, Google authorization failures (`gm_authFailure`), and runtime construction failures. The location field listens for the unavailable event and remounts as a normal editable input, observes Google mutations that set `disabled`/`readonly`, preserves manual text, and emits UNKNOWN/manual metadata. Manual entry remains editable and submit remains available; location classification never gates an ENQUIRY.

## Content and journey reconciliation

The compare and checkout surfaces no longer offer optional AMC, 15% AMC pricing, or unlimited care language. Existing API compatibility fields remain `amcSelected:false` and `amcAmount:0`. Payment copy now describes a post-confirmation Razorpay link or payment on installation; the website does not claim to collect payment on the request screen. Refund copy remains limited to cancellation before technician arrival or implementation. Testimonials retain the approved Delhi/Gurgaon/Mumbai/Goa city data in the Prerna presentation. No testimonial, doctor, evidence statistic, warranty, or legal promise was fabricated.

## Verification status

`git diff --check` passes, the graph was updated with `graphify update .`, and the locked package test file `lib/package-offer.test.ts` was added. Required install/lint/TypeScript/web-test/build commands could not complete after the host's package install removed the worktree's linked modules and registry DNS became unavailable: `CI=1 pnpm install --frozen-lockfile --ignore-workspace` reached the lockfile and download phase, then failed with `ENOTFOUND`; `pnpm test` consequently failed because `tsx` was unavailable. No source failure was established by those environment failures.

API tests were not rerun because the API is unchanged and its dependencies were unavailable in the same host state; earlier baseline API tests were 64/64 and web tests 42/42 before this correction pass. Browser desktop/390px, navigation, Google failure, form submission, API request, console, broken-link, and missing-asset checks remain backend/browser-dependent and are pending a usable Preview browser session.

## Files changed in this pass

`app/(public)/page.tsx`, `app/(public)/packages/page.tsx`, `app/(marketing)/compare-packages/compare-packages-view.tsx`, `app/(marketing)/compare-packages/compare-packages.module.css`, `app/(marketing)/checkout/components/checkout-experience.tsx`, `components/Booking.tsx`, `components/Doctors.tsx`, `components/FAQ.tsx`, `components/Hero.tsx`, `components/Process.tsx`, `components/Safer.tsx`, `components/Stats.tsx`, `components/Testimonials.tsx`, `components/Transformations.tsx`, `components/WhyMason.tsx`, `components/kit.ts`, `content/compare-packages.content.ts`, `content/homepage.content.ts`, `content/types.ts`, `lib/site-content.ts`, `lib/package-offer.test.ts`, `sanity/schemaTypes/package.ts`, and `scripts/migrate-package-catalog.ts`.

## Merge and Production decision

PR #1 is not merge-ready until the supplied Preview can be opened in a browser, the corrected commit/deployment identity is confirmed, the package/Google/attribution checks are completed, and install/lint/TypeScript/tests/build pass in a networked workspace. Do not merge or deploy Production from this state.

When accepted, the cutover is: verify Preview → approve PR #1 → merge `feature/prerna-frontend-integration` into the canonical default branch → let the existing Vercel Production integration deploy → smoke-test public routes and lead capture. Rollback is a Vercel revert to the last known-good Production deployment or a revert of the merge commit; do not alter API, database, Redis, or Sanity infrastructure as part of rollback.

## Founder correction: remove the public launch quiz

The public `/packages` launch page no longer imports or renders `PackageAdvisor`, so the Risk Quiz / “Quick safety fit check” / “Start the 30-second quiz” module is removed from the launch journey. The page now transitions directly from the package cards to the existing “See what gets installed” cue and kit section, following the approved Prerna structure.

The reusable quiz implementation and data remain intact: `components/PackageAdvisor.tsx`, `app/components/risk-quiz.tsx`, the Risk Quiz Sanity schema/query/content, quiz session context, lead payload fields, tests, and the historical `/compare-packages` route were not deleted or changed. The obsolete homepage hash redirect was removed from `components/ScrollRestoration.tsx` so public navigation cannot redirect visitors into a removed launch section. No current public launch navigation or CTA directly targets the obsolete `#risk-quiz` journey; historical comparison links continue to target the comparison package section.

Files changed for this correction: `app/(public)/packages/page.tsx`, `components/ScrollRestoration.tsx`, and this report. No backend, Sanity schema, CMS content, quiz data, or quiz tests were changed. Removing the launch module does not require test updates; existing quiz persistence and lead-context tests remain applicable to the preserved functionality.

Verification after this correction passes locally: `pnpm lint` exits 0 with five pre-existing `no-html-link-for-pages` warnings, `pnpm typecheck` exits 0, `pnpm test` passes all 44 web tests, `pnpm build` exits 0, and `git diff --check` passes. The API is unchanged, so no API source or API test was changed. PR #1 remains unmerged and Production remains untouched.
