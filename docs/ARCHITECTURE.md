# ARCHITECTURE

> The actual architecture, inferred from the current repository (`mason-web`). Keep in sync with the code.
> Last updated: 2026-06-25

## Overview

This repository (`mason-web`) is the **Mason Company web app** — `@aegis/web`, a Next.js 15 (App Router) site that also hosts the embedded Sanity Studio and the CRM UI.

It is one half of a pnpm monorepo (`pnpm@10.16.1`, Node `20.x`). The companion **CRM/API service** (`@aegis/api` — Fastify + Prisma + Neon Postgres) is deployed separately as its own Vercel project and is **not** part of this repository; the web app talks to it over HTTP.

## Next.js Structure (`app/`)

Route groups under the App Router:

- `(marketing)/` — public site: `about`, `checkout`, `communications`, `compare-packages`, `evidence`, `operations`, `packages`, `privacy`, `terms`.
  - `packages/[slug]/` → static `/packages/standard`, `/packages/advanced` (`generateStaticParams`, `dynamicParams = false`).
  - `checkout/[packageId]/` → checkout experience.
- `(crm)/crm/` — staff CRM UI (session-gated).
- `admin/` — legacy admin screens (`doctors`, `gallery`, `homepage`, `media`, `packages`, `testimonials`, `login`).
- `api/` — Next route handlers: `draft-mode/` (Sanity preview), `leads/` (public lead intake → CRM API).
- `components/`, plus `app/robots.ts` and `app/sitemap.ts`.
- `lib/` — `analytics.ts`, `location.ts`, `site-content.ts`.

## Folder Layout (this repo)

```
app/        Next.js App Router (marketing, crm, admin, api, components)
content/    Locked content fixtures / types
lib/        analytics, location, site-content helpers
sanity/     Sanity schema + client (sanity.config.ts, sanity.cli.ts)
public/     Static assets
docs/       Canonical documentation (this directory)
scripts/    Web scripts (e.g. seed-sanity)
next.config.ts · vercel.json · package.json · tsconfig.json
```

## Deployment Pipeline

- **GitHub → Vercel → Production.** Push to `main` triggers an automatic Vercel build and release. `main` is the source of truth.
- This repository **is** the Vercel deployment root for the web project.
- Environment changes require a new deployment before Production picks them up.
- **Rollback:** use Vercel deployment rollback/promotion; do not delete CMS data.

## Analytics

- GA4. Client wiring in `lib/analytics.ts` + `app/components/launch-analytics.tsx`.
- Gated on `NEXT_PUBLIC_GA_MEASUREMENT_ID` (no ID → analytics no-op).
- Tracks pageviews and assessment-funnel interactions via `data-analytics-*` attributes.

## Google Maps

- `lib/location.ts` + `app/components/location-autocomplete-field.tsx`.
- **Progressive enhancement:** Google Places autocomplete loads only when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is present; otherwise the field falls back to manual entry + free reverse-geocoding (OpenStreetMap/Nominatim) for "Use my location".
- Service-area detection restricted to Mumbai/Goa; serviceability confirmed on callback.

## Checkout

- `app/(marketing)/checkout/[packageId]/page.tsx` + `checkout/components/checkout-experience.tsx`.
- Two packages only: `package-standard`, `package-advanced`.
- Secondary conversion; the primary CTA everywhere is **Book Free Safety Assessment**.
- No in-app payment gateway — payment is cash/UPI or **Razorpay Payment Links** (manual reconciliation). Checkout produces a `BOOKING_REQUEST` lead.

## CMS (Sanity)

- `next-sanity` + `@sanity/client` + `@sanity/image-url` + `@sanity/preview-url-secret`.
- Project `0m8qa2h8`, dataset `production`. Studio is embedded behind the CRM route (`/crm/content`).
- Draft Mode via `/api/draft-mode/enable|disable` (requires `SANITY_PREVIEW_SECRET`; reads use a Viewer-scoped `SANITY_API_READ_TOKEN`).
- Locked code fixtures keep public pages available if Sanity is unavailable.

## CRM

- Mason CRM is the **system of record** — a separate Fastify + Prisma service over **Neon Postgres** (own repo/Vercel project).
- This web app submits leads to it (`app/api/leads`) and gates `/crm` on a Mason staff session.
- Lead model: `LeadStatus` (NEW → CONTACTED → QUALIFIED → BOOKED → RESOLVED / LOST), `LeadType` (ENQUIRY / BOOKING_REQUEST / SUPPORT). Zoho integration is **outbound-only and OFF (dark)** at launch (see `DECISIONS.md`).

## Environment Variables

**Browser-safe (`NEXT_PUBLIC_*`):** `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

**Server-only:** `SANITY_API_READ_TOKEN`, `SANITY_PREVIEW_SECRET`, `SANITY_API_WRITE_TOKEN` (seed/import only). **Never** prefix a secret with `NEXT_PUBLIC_`. `NEXT_PUBLIC_*` values are baked at build → require a redeploy to change.

## Build Process

```bash
pnpm install      # install dependencies
pnpm build        # next build (production build)
```

Run a clean production build before committing changes that touch the app.
