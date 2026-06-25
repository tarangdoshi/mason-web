# AI_HANDOFF

> Instructions for **any** AI agent (Claude, ChatGPT, Codex, Graphify, etc.) working on this repository.
> Read this and `PROJECT_STATE.md` before doing anything.

## Start here, every time

1. **Read `docs/PROJECT_STATE.md` first** — it is the canonical state (status, commit, blockers, priorities).
2. Read `docs/ARCHITECTURE.md` for how the system actually works.
3. Read `docs/DECISIONS.md` before proposing anything that changes architecture or product behaviour.
4. If `graphify-out/graph.json` exists, **query Graphify before grepping raw files** (`graphify query "<question>"`).

## Hard rules

- **GitHub `main` is the single source of truth.** Work against it; never edit production out-of-band.
- **Never deploy manually.** Vercel auto-deploys from `main`. To release, land a commit on `main`.
- **Do not change product behaviour or UI unless explicitly requested.**
- **Do not change architecture without approval** — propose it as a new ADR in `DECISIONS.md` first.
- **Never remove accepted behaviour or decisions** (see `DECISIONS.md`).
- **Run a production build before committing** app changes: `pnpm install && pnpm build`.
- **Keep documentation updated** — these four docs are living. Update `PROJECT_STATE.md` when state changes; append (don't rewrite) `DECISIONS.md`.
- **Secrets:** never prefix a secret with `NEXT_PUBLIC_`; never print tokens, keys, or secret-bearing URLs into output or commits.

## Working agreement

- Keep changes scoped and minimal; match surrounding code style.
- Prefer reusing existing patterns/components over inventing new ones.
- After modifying code, run `graphify update .` to keep the knowledge graph current (AST-only, no API cost).
- Report outcomes faithfully — if a build fails or a step is skipped, say so.

## Definition of done for a change

- [ ] Aligned with `DECISIONS.md` (no silent architecture/behaviour change)
- [ ] `pnpm build` passes
- [ ] Relevant docs updated (`PROJECT_STATE.md`, and `DECISIONS.md` if a decision was made)
- [ ] Graphify updated (`graphify update .`)
- [ ] Committed to a branch / `main` per the repo's workflow — **no manual production deploy**
