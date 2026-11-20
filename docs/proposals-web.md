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
  the Proposal row). Page copy (3-page copy with the placeholders `{customerName}`, `{date}`, `{essentialPrice}`, `{addonPrice}`, `{addonName}`; `addonName` defaults to "Safety Add-on"), payment terms (≥ 1), what-happens-next steps (≥ 1), **disclaimer (required, whitespace refused)**.

Seed copy lives in `content/proposals/seed.ts` (approved 20 Nov copy; 5 approved benefit lines, 9 marked `CMO TO WRITE:` which Studio refuses to publish; Drainage clearance and EVA slippers complimentary by default). The 15 drafts were applied to the production dataset on 21 Nov (drafts only). With a Sanity read token, the dry run reports each document as "exists, skip" or "would create draft".

## Staff screen `/crm/proposals/new`

Tablet-first (portrait iPad / Android tablet: single column with the totals stuck to the bottom;
landscape: list beside sticky totals), works on phones. All controls ≥ 44 × 44 px; inputs use 16 px text
so iOS does not zoom.

* Customer: display name (API rules mirrored: ≤ 80 chars, no phone number, no email), Zoho Lead ID
  (prefilled from `?zohoLeadId=`; fixed once saved), proposal date (display only until the API stores it),
  bathrooms 1–10.
* 14 components in the approved order: Recommended / Already present / Declined; for recommended items,
  quantity 1–20 (starting at the catalogue quantity: 3 Vertical grab bars, 4 Drainage clearance, else 1),
  optional variant, Essential / Add-on.
* Live totals: staff press **Save draft and price** once (so a half-typed Zoho Lead ID is never saved); after
  that every change (debounced 700 ms, one request at a time) PATCHes the draft and calls `POST /:id/price`.
  A failed pricing round shows the reason and a **Retry pricing** button, and clears any override shown. Shows Essential and Essential + Add-on (or "No add-ons"), the price-list version,
  and "Covers N bathroom(s). Other rooms: quoted after inspection."
* ADMIN only: override Essential and/or Add-on with a reason of ≥ 10 characters (`POST /:id/override`).
  Hidden for AGENT and refused by the server action and the API. Any later edit re-prices and clears it
  (API behaviour), and the screen says so.

No customer page in Phase 1.

## Gaps for the api lane

0. **`proposalDate`**: the web sends `proposalDate: "YYYY-MM-DD"` on create and PATCH, or `null` when the field is cleared. Add it as a nullable date to `Proposal`, `createSchema` and `updateSchema` (it must accept `null`), and record it in `docs/proposals.md`. Note that every PATCH carries `items`/`rooms`, so a date-only edit re-prices and clears an admin override, as display-name edits already do.

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
