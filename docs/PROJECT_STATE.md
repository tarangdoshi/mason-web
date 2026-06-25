# PROJECT_STATE

> Canonical state of Mason Company. **Read this first.** Living document — keep current.
> Last updated: 2026-06-25

## Executive Dashboard

| | |
|---|---|
| **Status** | 🟡 Live with Conditions |
| **Production URL** | https://www.masoncompany.in |
| **GitHub repo** | https://github.com/tarangdoshi/mason-web |
| **Branch (source of truth)** | `main` |
| **Current production commit** | `3bfab7e` |
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
| **P2** | Node 20 engine warning | All packages pin `engines.node = "20.x"`; align the Vercel/CI Node version to silence the warning. |

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
