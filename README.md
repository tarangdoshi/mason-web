# Mason Company — Web (`mason-web`)

Marketing website, embedded CMS, and CRM UI for Mason Company — a trust-led, assessment-first bathroom-safety business (Mumbai & Goa).

- **Production:** https://www.masoncompany.in
- **Repo (source of truth):** https://github.com/tarangdoshi/mason-web — branch `main`
- **Deployment:** GitHub → Vercel → Production (auto-deploy on push to `main`)

## Project Overview

This repository is the Mason **web app** (`@aegis/web`): Next.js 15 (App Router) + React, Sanity CMS, styled-components, Ant Design. It is part of a pnpm monorepo; the **CRM/API service** (`@aegis/api` — Fastify + Prisma + Neon Postgres) is deployed separately and lives in its own repo. Node `20.x`, pnpm `10.16.1`.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full picture.

## Development

```bash
pnpm install     # install dependencies
pnpm dev         # next dev → http://localhost:3000
```

- Configure env in `.env.local` (Sanity `NEXT_PUBLIC_SANITY_*`, `SANITY_*`; analytics `NEXT_PUBLIC_GA_MEASUREMENT_ID`; maps `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`).
- The site degrades gracefully without optional keys (analytics no-ops; maps falls back to manual entry).
- Seed Sanity content (optional): `pnpm sanity:seed`.

## Build

```bash
pnpm install
pnpm build       # next build (production build)
```

Run a clean production build before committing app changes.

## Deployment

GitHub `main` is the **single source of truth**; Vercel deploys it automatically.

- To release: land a commit on `main` → Vercel builds and promotes to production.
- **Do not deploy manually.** Roll back via Vercel deployment promotion (never delete CMS data).
- `NEXT_PUBLIC_*` env vars are baked at build time — changing them requires a redeploy.

## Documentation

Canonical, living docs (read in this order):

1. [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md) — current state, commit, blockers, priorities (**read first**).
2. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — actual system architecture.
3. [`docs/DECISIONS.md`](docs/DECISIONS.md) — ADR-style log of accepted decisions.
4. [`docs/AI_HANDOFF.md`](docs/AI_HANDOFF.md) — rules for any AI/human agent working here.

## Repository Structure

```
app/        Next.js App Router (marketing, crm, admin, api, components)
content/    Locked content fixtures / types
lib/        analytics, location, site-content helpers
sanity/     Sanity schema + client
public/     Static assets
docs/       Canonical documentation
scripts/    Web scripts (e.g. seed-sanity)
```
