# Proposal Builder v1 — web, Phase 1

Status: **dark**. Pairs with the mason-api design note `docs/proposals.md` (api lane, branch
`feat/proposal-builder-v1`). Nothing here is visible unless `NEXT_PUBLIC_PROPOSALS_ENABLED=true`
**and** the API has `PROPOSALS_ENABLED=true`.

## Flag

| Env | Default | Effect when not exactly `true` |
| --- | --- | --- |
| `NEXT_PUBLIC_PROPOSALS_ENABLED` | unset (off) | `/crm/proposals/new` returns 404, the CRM nav has no "New proposal" link, the Studio has no "Proposals" menu, and the server actions refuse. |

`NEXT_PUBLIC_*` is baked at build time, so turning it on needs a redeploy. No Production env value is
added by this change.

## Sanity

Two document types, registered always (harmless when unused) but listed in Studio only when the flag is on.
Studio cannot create, duplicate, delete or unpublish them; `pnpm proposals:seed` creates them as **drafts**
for founder review.

* `componentLibrary` — ID `componentLibrary-<key>`, one per approved component. `key` and `name` are
  read-only, and `name` must equal the approved name for its key exactly (`lib/proposals/components.ts`,
  tested against `docs/PRODUCT_CATALOGUE_2026-10-13.md`). Editable: benefit line (required), description,
  photos (≤ 6), icon, complimentary flag (display only — pricing follows the sheet's Complimentary column;
  api open question 3).
* `proposalTemplate` — ID `proposalTemplate-<version>`, `version` like `v1` (matches `templateVersion` on
  the Proposal row). Page copy (headline with `{name}`, intro, state labels, option titles, other-rooms
  line), payment terms (≥ 1), what-happens-next steps (≥ 1), **disclaimer (required, whitespace refused)**.

Seed copy lives in `content/proposals/seed.ts`. Until the founder's approved 20 Nov design is supplied
(with the customer name removed), it holds `PENDING_FOUNDER_COPY` markers and the seed script refuses to
run. Dry run by default; `--apply` needs `SANITY_API_WRITE_TOKEN`. It never touches photos or icons.

## Staff screen `/crm/proposals/new`

Tablet-first (portrait iPad / Android tablet: single column with the totals stuck to the bottom;
landscape: list beside sticky totals), works on phones. All controls ≥ 44 × 44 px; inputs use 16 px text
so iOS does not zoom.

* Customer: display name (API rules mirrored: ≤ 80 chars, no phone number, no email), Zoho Lead ID
  (prefilled from `?zohoLeadId=`; fixed once saved), proposal date, bathrooms 1–10.
* 14 components in the approved order: Recommended / Already present / Declined; for recommended items,
  quantity 1–20, optional variant, Essential / Add-on.
* Live totals: each change (debounced 700 ms, one request at a time) creates or PATCHes the draft and calls
  `POST /:id/price`. Shows Essential and Essential + Add-on (or "No add-ons"), the price-list version,
  and "Covers N bathroom(s). Other rooms: quoted after inspection."
* ADMIN only: override Essential and/or Add-on with a reason of ≥ 10 characters (`POST /:id/override`).
  Hidden for AGENT and refused by the server action and the API. Any later edit re-prices and clears it
  (API behaviour), and the screen says so.

No customer page in Phase 1.

## Gaps for the api lane

1. **Proposal date** has no field in the API model; the screen collects it but does not send it. Add
   `proposalDate` (date) to `Proposal`, or confirm the customer page should use `createdAt`/`sharedAt`.
2. **Live totals need a saved draft** (`POST /:id/price`), so every pricing round is two writes. A
   stateless `POST /internal/proposals/quote` would avoid draft churn; fine to keep as-is for Phase 1.

## Tests

* `lib/proposals.test.ts` (in `pnpm test`): names/order vs the catalogue, flag gating of route/nav/Studio/
  actions, ADMIN-only override, draft validation, item shape, override rules, seed refusal (incl. empty
  disclaimer), Sanity validators.
* `pnpm test:e2e:proposals`: Playwright against a synthetic mock API (`e2e/proposals/mock-api.mjs`) at
  iPad portrait/landscape, Galaxy Tab S4 and Pixel 7 viewports (Chromium). Checks flag-off 404, live
  totals, the items sent to the API, agent cannot see override, admin override with reason, 44 px touch
  targets and no sideways scroll.
