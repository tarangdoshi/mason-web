# Sanity core CMS — ownership audit

Baseline: `main` @ `326733a` (Prerna release). Sanity project `0m8qa2h8`, dataset `production`, API `2026-06-16`.
Rule applied throughout: **content → Sanity, functionality → code.**

## 1. Existing Sanity document types

| Type | Kind | Used by public site today |
| --- | --- | --- |
| `homepage` | singleton | Partly (see §4) |
| `siteSettings` | singleton | Brand name / service line / trust badges only; phone + WhatsApp overridden in code |
| `riskQuiz` | singleton | Not on any public route (only the unrouted `PackageAdvisor`) |
| `package` | 2 docs (`package-package-standard`, `package-package-advanced`) | Structure only; every copy field is read *after* the local fallback |
| `packageFeature` | 18 docs (13 approved, 5 retired/unreferenced) | Ignored: mapper requires `publicLabel`, which no doc has |
| `testimonial` | 4 docs | Quote/relation/photo; names 1, 2, 4 and every city overridden in code |
| `doctor` | 3 docs | Yes |
| `galleryItem` | docs | Mapped, but the homepage `Transformations` component renders hard-coded images |

## 2. Existing Studio structure

Embedded Studio at `/crm/content` (guarded by `requireAdminCrmUser()`). Navigation: *Homepage, Site settings, Risk quiz*, then raw type lists (*Package, Package feature, Testimonial, Doctor, Gallery item*). Presentation tool configured, but see §6 — it cannot work today.

## 3. Existing CMS-controlled fields (actually reaching the page)

Homepage: hero subcopy / secondary CTA, what-we-do description, evidence cards (Stats), why items (title/description), transformation title/subtitle, packages title, process step descriptions (matched by title), testimonials, doctors, FAQ title/subtitle and non-locked answers, final CTA title/subtitle. Package: structure, reference price (CMS-first), savings, CTA label, visual. Everything else is code.

## 4. Code overrides currently defeating Sanity (`lib/site-content.ts`)

- `hero.heading`, `hero.primaryCta` forced to local values.
- FAQ answers for 5 "locked" questions forced to local values; local question order forced.
- `packagesSection.subtitle`, `processSection.primaryCta`, `finalCtaSection.primaryCta`, `finalCtaSection.secondaryLabel` forced.
- `applySanityPackages`: price, currentPrice, bestFor, outcome, summary, badge, titleDescriptor, visualHighlights, isFeatured all prefer **local** over CMS; features only used if `publicLabel` set; Raised Toilet Seat forced to local.
- `applyFounderPackageOffer`: price and included components forced to local.
- `applyFounderTestimonialNames`: names 1, 2, 4 and every city forced; `Testimonials.tsx` forces `city: "Goa"` again.
- Compare view forces `packagesSection.subtitle`.
- `Hero.tsx`: accent styling only appears when the heading equals one exact hard-coded string.
- `Testimonials.tsx`, `FAQ.tsx`, `Doctors.tsx` each hold full hard-coded fallback lists.

## 5. Hard-coded customer-facing content (not CMS at all)

- Homepage: Safer title and images; Stats section headings + source line; Why Mason heading/subtitle and item tags; Transformations images/labels; Packages eyebrow + footnote; package card rows ("13 safety upgrades installed", …, "2-Year Safety AMC Included", "Most popular"); Process heading/subtitle ("Three clear steps…") and the 3 visible steps; Doctors heading/subtitle/disclaimer; Testimonials heading/subtitle; Booking badges; Footer tagline.
- `/about`: all copy (`components/about-data.ts` + page) and photo slots.
- `/packages`: hero heading/subcopy, kit section copy, kit list (`components/kit.ts`).
- `/contact`: headings and copy.
- `/why`: all copy (`WhyContent.tsx`).
- `/privacy`, `/terms`: provisions in `components/legal-data.ts`; contact details from `components/contact-details.ts`.
- Package detail + checkout pages: page copy (plan data flows from the loader).
- SEO: static `metadata` exports per route; `siteSettings.homepageSeo`/`comparePackagesSeo` exist but are unused.

## 6. Duplicate content sources

The same facts live in several places: package copy/prices in `content/homepage.content.ts`, `components/packages-data.ts`, `components/kit.ts`, `components/FAQ.tsx`, `sanity/schemaTypes/package.ts` (validation pins prices) and Sanity; contact details in `contact-details.ts`, Sanity `siteSettings`, legal data; FAQ in `FAQ.tsx`, `homepage.content.ts`, Sanity; testimonials in `Testimonials.tsx`, `homepage.content.ts`, Sanity.

Preview: `/?preview=draft` redirects to `/content-preview`, which renders the **legacy pre-Prerna homepage**; the public homepage never requests drafts; `/api/draft-mode/enable` accepts only a static secret, while the Presentation tool sends a generated `@sanity/preview-url-secret`. Draft preview therefore does not work for the live design.

Publishing: `/` renders per request (Sanity CDN) — publishes appear within seconds. `/packages`, `/packages/standard|advanced`, `/about`, `/contact`, `/why`, `/privacy`, `/terms` are **static at build time**: a publish never reaches them without a redeploy.

## 7–9. Ownership classification

**A — CMS-owned:** all homepage section copy and images, About copy and photos, Packages page copy, package editorial fields, component labels/quantities/descriptions, highlight chips, AMC copy, FAQ (add/edit/reorder/hide), testimonials (add/edit/reorder/hide, photo, name, location), doctors, gallery, support email/phone/WhatsApp/hours, SEO per page, CTA **labels**.

**B — System-owned:** form fields/validation/payloads/endpoints, phone normalisation, Google Places + manual fallback + classification, Zoho mapping and `PUBLIC_LEAD_CAPTURE_MODE`, analytics event names and semantics, attribution, CRM auth/roles, Sanity tokens and secrets, routes and canonical URLs, package codes/slugs, feature keys, checkout/payment behaviour, legal provisions.

**C — Hybrid (guarded):**

| Value | Decision |
| --- | --- |
| Package price / reference price | CMS-owned **numbers**, validated, resolved once (§10) |
| CTA destination | Code-owned enum (`BOOK_INSPECTION`, `VIEW_PACKAGES`, `PACKAGE_DETAILS`, `CONTACT`); only labels are CMS |
| Package slug / code, feature keys | Code-owned identifiers; CMS edits content attached to them |
| Contact phone / WhatsApp | CMS value, validated (Indian mobile) before building `tel:` / `wa.me` links |
| Service geography ("Goa") | Code — it is coupled to server-side serviceability classification |
| Legal entity + registered office | Code — legal identity; contact details inside legal pages come from CMS |
| Structured data | Code template; names come from CMS (no prices in JSON-LD today) |

## 10. Price dependency map

| Consumer | Today | Target |
| --- | --- | --- |
| Package cards (home, /packages) | `packages-data.ts` / loader (local wins) | resolver |
| Compare page, detail pages | loader `plan.price` / `currentPrice` | resolver |
| Checkout display + `basePrice` + `totalPayable` | `parsePriceAmount(plan.price)` | resolver (unchanged code path) |
| Checkout lead payload → `/api/leads/checkout` → mason-api | client-computed `totalPayable`, stored as submitted; staff confirm price; Razorpay link sent manually | unchanged — no payment is taken on the site, and mason-api already trusts the client value (pre-existing) |
| Analytics `view_package` / `select_package` `package_price` | parsed from the display string | resolver string → same parse |
| FAQ answers | literal "₹29,999 / ₹36,999" in text | `{standard_price}` / `{advanced_price}` tokens substituted from the resolver |
| Structured data | no price | n/a |
| Sanity schema | validation pins exact strings | numeric fields with range validation |
| mason-api `Package.pricePaise` / Order / Payment | separate CRM catalogue (legacy codes) | untouched |

Operational/payment authority stays with staff confirmation in CRM and the Razorpay link; the website price is a quoted price.

## 11. Contact/support dependency map

`contact-details.ts` constants → Footer (email), Nav (phone), `/contact` (email, phone, WhatsApp, hours), legal pages (email, phone, hours via `legal-data.ts` built at module load), final CTA "Call …" label, brand phone/WhatsApp in the loader. Target: one `siteSettings` ("Contact & Support") document read on the server and passed down; constants remain the fallback.

## 12. Legal-content dependency map

Provisions: `components/legal-data.ts` (code). Company identity: `components/company.ts` (code). Contact details: `contact-details.ts` → target CMS. Studio is admin-only, but Sanity has no per-field legal approval workflow, so provisions stay in code (reviewed via PR).

## 13. SEO dependency map

Static `metadata` in each public route; canonical URLs in code; `app/sitemap.ts` in code. Target: `seo` singleton with per-page title/description/social title/social description/social image, read in `generateMetadata`; canonicals stay in code.

## 14. Images/media dependency map

CMS images already supported (with hotspot/crop and responsive URLs) for hero before/after, what-we-do, process steps, package visuals, testimonials, doctors, gallery. Hard-coded: Safer photos, Transformations before/after, About photo slots, /packages hero photo, kit thumbnails. Decorative/UI assets stay in code.

## 15. Target schema (summary)

Founder-facing Studio: **Homepage** (grouped by section) · **About** · **Packages** (Standard, Advanced, Packages page copy) · **Package Components** · **FAQs** · **Testimonials** · **Doctors & Experts** · **Gallery** · **Contact & Support** · **SEO** — with technical types (risk quiz, retired components) out of the main path.

## 16. Migration requirements

Additive only, backed up, revision-aware: new singletons (`faqs`, `aboutPage`, `packagesPage`, `seo`), new fields (numeric prices, visibility toggles, accent words, section copy currently hard-coded, support email/hours). Values written = what production renders today, so switching to CMS-first renders identically. No deletions; retired features stay unreferenced.

## 17. Risks

Visual regression from wiring hard-coded copy to CMS (mitigated by rendered-text diff against production); founder-editable prices drifting from free-text copy (mitigated by FAQ price tokens and validation); ISR staleness (mitigated by short revalidation); draft leakage (draft reads only when Next draft mode is on, which requires a validated preview secret).

## 18. Implementation plan

1. Schema: founder-friendly structure, groups, new singletons/fields, validation.
2. Loader: CMS-first resolution with fallbacks; remove founder locks; one price resolver; contact settings loader.
3. Components/pages: render CMS fields (generic accent words), keep all interactions.
4. Preview: Presentation-tool secret validation, drafts on the real pages, no legacy redirect.
5. Publishing: ISR (60 s) on the formerly static routes + optional signed webhook route.
6. Migration: backup → additive write of currently-rendered values → verify production unchanged.
7. Tests, visual/text regression, founder acceptance on Preview drafts, founder guide.
