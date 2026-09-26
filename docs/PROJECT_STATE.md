# PROJECT_STATE

> Canonical state of Mason Company. **Read this first.** Living document — keep current.
> Last updated: 2026-09-25

## Executive Dashboard

| | |
|---|---|
| **Status** | 🟡 Live with Conditions |
| **Production URL** | https://www.masoncompany.in |
| **GitHub repo** | https://github.com/tarangdoshi/mason-web |
| **Branch (source of truth)** | `main` |
| **Current production commit** | `ad17756` |
| **Deployment** | GitHub → Vercel → Production (auto-deploy on push to `main`) |

## Deployment Pipeline

```
GitHub (main)  →  Vercel (auto build)  →  Production (www.masoncompany.in)
```

GitHub `main` is the single source of truth. Vercel deploys automatically from `main`.
**Do not deploy manually.** Push to `main`; let Vercel build and release.

## Current Sprint

Launch hardening — clearing go-live conditions and stabilising the Git-backed deployment.

## Current Priorities

1. Clear the P0 launch blocker (Google Maps key).
2. Verify analytics (GA4) is recording in production.
3. Resolve the Node engine warning.

## Launch Blockers

| Priority | Blocker | Notes |
|---|---|---|
| **P0** | Google Maps `InvalidKeyMapError` | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` invalid/unauthorised; Places autocomplete degrades to manual entry until fixed. |
| **P1** | Verify GA4 DebugView | Confirm `NEXT_PUBLIC_GA_MEASUREMENT_ID` fires pageview + assessment events in GA4 Realtime/DebugView. |
| **P2** | Node 20 deprecation | Vercel fails Node 20.x builds created on or after 2026-10-01. `@aegis/web` moves to `engines.node = "24.x"` (branch `chore/node-24-engines`); `@aegis/api` still pins `"20.x"` in its own repo and needs the same change. |

## Recently Completed

- ✓ GitHub migration
- ✓ Git-backed deployment (GitHub → Vercel)
- ✓ Homepage redesign
- ✓ Gallery
- ✓ Package detail pages (`/packages/standard`, `/packages/advanced`)
- ✓ Assessment-first funnel
- ✓ Pricing remediation
- ✓ `robots.txt`
- ✓ `sitemap.xml`

## Next Priorities

1. **P0** — Fix Google Maps API key + referrer restrictions; confirm Places autocomplete + "Use my location".
2. **P1** — Verify GA4 events end-to-end in DebugView.
3. **P2** — Resolve the Node 20 engine warning.
4. Standardise shared UI components against Mason Design System v1.
5. Begin Zoho operator-workspace Phase 1 (mirror, sync still OFF) when launch conditions clear.

## Frontend integration — 10 September 2026 (Preview only)

- Feature branch: `feature/prerna-frontend-integration`, based on canonical `main` `b84f056`.
- Visual source: `prernaa-99/Mason-company-` `670a599`, deployed reference `https://mason-company.vercel.app`.
- Public design integrated into canonical Next 15 app; existing API, CRM, package checkout and database contracts retained.
- Production remains unchanged. See `FRONTEND_INTEGRATION_AUDIT.md` and `FRONTEND_HANDOFF.md` for scope, checks and remaining review gates.
- Founder direction: do not repair the legacy staging API or create database/Redis infrastructure. Backend-dependent verification is recorded separately. Preview with no configured API returns an explicit unavailable response; no fake success and no Production test leads.

## Marketing tracking — 25 September 2026 (branch `feature/marketing-tracking`, not deployed)

- Implements the website events of Events Requirement.xlsx through the existing `lib/analytics.ts` abstraction: `page_view`, `view_service`, `view_package`, `select_package`, `form_start`, `form_submit`, `generate_lead`. Existing custom events are kept.
- `generate_lead` fires only after the Mason API confirms the lead (`lib/lead-funnel.ts`); `form_submit` is every attempt. `lead_id` is the id returned by the API (the Zoho lead id on the zoho_direct path).
- Attribution (`lib/lead-context.ts`): utm_source/medium/campaign/term/content, gclid, gbraid, wbraid, fbclid, captured from the landing URL, kept for the browser session in sessionStorage as one set (first campaign landing wins, never mixed), sent with every lead in `metadata.attribution`.
- Destinations, each off until its variable is set: GA4 `NEXT_PUBLIC_GA_MEASUREMENT_ID` (existing); Google Ads lead conversion `NEXT_PUBLIC_GOOGLE_ADS_ID` + `NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION_LABEL`; Meta Pixel `NEXT_PUBLIC_META_PIXEL_ID`.
- No contact details are sent to analytics; values that look like an email or phone number are dropped.
- Downstream funnel events (lead_contacted … installation_completed) are not implemented: their states live in Zoho or do not exist yet.

## Contact form location parity — 25 September 2026 (merged to `main`, live in Production)

- The `/contact` page form (`components/ContactForm.tsx`) now matches the home page "Book a Safety Visit" assessment form field-for-field: Name, Email, Mobile, Location. The Package selector previously unique to the contact form has been removed — see ADR-012 in `DECISIONS.md`.
- Location capture (Google Places autocomplete + "Use my location") is shared between both forms via a new hook, `lib/use-location-autocomplete.ts`, consumed by `app/components/location-autocomplete-field.tsx` (home page, CSS-module styling) and the new `components/LocationField.tsx` (contact page, Tailwind styling). No behaviour change to the home page form.
- Server-side validation field errors now map onto the right contact-form input with auto-focus, matching the assessment form's `resolveValidationFeedback` flow, instead of the previous generic-banner-only handling.
- PR: `https://github.com/tarangdoshi/mason-web/pull/3`, branch `feature/contact-form-location-parity` (merged as `ad17756`). Verified: `tsc --noEmit`, `next lint`, `npm test` (89/89) all clean before merge.
- Preview-only backend-submission block (`lib/api.ts`, `VERCEL_ENV === "preview"` without `NEXT_PUBLIC_API_URL`) is pre-existing and unrelated to this change; Production is unaffected and was smoke-tested live post-merge.
