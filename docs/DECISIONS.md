# DECISIONS

> ADR-style log of major **accepted** decisions. Append new decisions; do not rewrite history.
> Each entry: Date · Decision · Reason · Impact · Status.

---

## ADR-001 — GitHub is the single source of truth
- **Date:** 2026-06-25
- **Decision:** `github.com/tarangdoshi/mason-web`, branch `main`, is canonical. The repo is the truth; working copies follow it.
- **Reason:** One authoritative history; predictable releases; clean AI/human collaboration.
- **Impact:** All changes land on `main`. Never edit production out-of-band.
- **Status:** ✅ Accepted

## ADR-002 — Git-backed production deployment
- **Date:** 2026-06-25
- **Decision:** Vercel auto-deploys from GitHub `main` (GitHub → Vercel → Production). No manual `vercel deploy --prod`.
- **Reason:** Every release is traceable to a commit; removes manual-deploy drift.
- **Impact:** Push to `main` to release. Roll back via Vercel deployment promotion.
- **Status:** ✅ Accepted (supersedes the manual `vercel deploy` flow noted in `docs/architecture/security-and-deployment.md`)

## ADR-003 — Assessment-first funnel
- **Date:** 2026-06
- **Decision:** The primary conversion is **Book Free Safety Assessment**; package checkout is strictly secondary.
- **Reason:** Trust-led, advisory model; the honest assessment is the brand's credibility engine.
- **Impact:** Every surface leads with the assessment CTA; checkout never styled as primary. Assessment leads = `ENQUIRY`; checkout leads = `BOOKING_REQUEST`.
- **Status:** ✅ Accepted

## ADR-004 — Sanity as CMS
- **Date:** 2026-06
- **Decision:** Sanity (project `0m8qa2h8`, dataset `production`), Studio embedded behind the CRM route; published content with locked code fixtures as fallback.
- **Reason:** Editorial control without redeploys; resilient public pages.
- **Impact:** Content is CMS-owned; secrets/customer data never go in Sanity (public dataset). Draft Mode gated by `SANITY_PREVIEW_SECRET`.
- **Status:** ✅ Accepted

## ADR-005 — Mason CRM is the system of record; Zoho is a future operator workspace
- **Date:** 2026-06
- **Decision:** Mason CRM (`apps/api` + Neon Postgres) is canonical. Zoho integration is **outbound-only and OFF (dark)** at launch; Zoho becomes an operator workspace later, with Mason remaining authoritative.
- **Reason:** Operational simplicity at launch; avoid premature two-system complexity.
- **Impact:** Launch runs on Mason CRM alone. Zoho cutover is phased and reversible (mirror → writeback → full), Mason wins conflicts.
- **Status:** ✅ Accepted (Zoho sync remains OFF)

## ADR-006 — pnpm monorepo (web + api)
- **Date:** 2026 (pre-migration)
- **Decision:** Single repo, `apps/web` (`@aegis/web`) and `apps/api` (`@aegis/api`), pnpm workspaces, Node `20.x`.
- **Reason:** Shared tooling and coordinated releases for the site and its API.
- **Impact:** `pnpm install` / `pnpm build` at root; web deploys with `apps/web` as the Vercel root.
- **Status:** ✅ Accepted

## ADR-007 — Two cities only (Mumbai, Goa) and agent = installer
- **Date:** 2026-06
- **Decision:** Serviceable areas limited to Mumbai and Goa; the field agent is also the installer (carries inventory, can install immediately after assessment).
- **Reason:** Focused launch footprint; fastest path from assessment to installed outcome.
- **Impact:** Serviceability checks gate intake; operations modelled around same-visit install.
- **Status:** ✅ Accepted

## ADR-008 — Payments via cash/UPI or Razorpay Payment Links (no in-app gateway)
- **Date:** 2026-06
- **Decision:** No embedded payment gateway. Present payer → cash/UPI to the agent; remote payer → Razorpay Payment Link, manual reconciliation. `BOOKED` only when payment is confirmed.
- **Reason:** Launch simplicity; supports a remote payer (e.g. an adult child in another city).
- **Impact:** Payment tracked in CRM notes; reconciliation is manual until a webhook is added.
- **Status:** ✅ Accepted
