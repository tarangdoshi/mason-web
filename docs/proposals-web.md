# Proposal Builder v1 — web, Phases 1 and 2

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
  (prefilled from `?zohoLeadId=`; fixed once saved), proposal date (saved with the draft),
  bathrooms 1–10.
* 14 components in the approved order: Recommended / Already present / Declined; for recommended items,
  quantity 1–20 (starting at the catalogue quantity: 3 Vertical grab bars, 4 Drainage clearance, else 1),
  optional variant, Essential / Add-on.
* Live totals: staff press **Save draft and price** once (so a half-typed Zoho Lead ID is never saved); after
  that every change (debounced 400 ms, one request at a time) PATCHes the draft and calls `POST /:id/price`;
  totals dim while an update is pending. A failed pricing round dims the totals, shows the reason and a
  **Price not updated, tap to retry** button (no silent retry), and clears any override shown. Shows Essential and Essential + Add-on (or "No add-ons"), the price-list version,
  and "Covers N bathroom(s). Other rooms: quoted after inspection."
* ADMIN only: override Essential and/or Add-on with a reason of ≥ 10 characters (`POST /:id/override`).
  Hidden for AGENT and refused by the server action and the API. Any later edit re-prices and clears it
  (API behaviour), and the screen says so.

* Once priced: **Show family**, **Download PDF** and **Share with customer** (Phase 2, below). Sharing asks
  for confirmation, because the API locks a shared proposal; the screen then locks too.

## Phase 2 — customer page, Show family, PDF, share, viewer events

One presentational component, `components/proposals/ProposalDocument.tsx`, renders the approved 20 Nov
3-page design (A4 794×1123 per page; #84422C / #FCF9F4; Newsreader with optical sizes + Manrope). The pure
builder `lib/proposals/document.ts` turns the API's proposal view plus the Sanity copy into that document, so
the customer page, Show family and the PDF can never disagree.

* **Content**: copy from `proposalTemplate` (v1) and benefit lines/photos from `componentLibrary`. The customer
  page reads **published** documents only; staff preview (Show family, PDF, share) reads drafts over published
  (needs `SANITY_API_READ_TOKEN` server-side). A benefit line still marked `CMO TO WRITE:` is never shown (the
  name and quantity are). The disclaimer always shows; if the template's is ever blank, the approved text is used.
  Canonical names always come from `lib/proposals/components.ts`. Complimentary items carry "Complimentary";
  the add-on card lists items without prices (one package). Declined and already-present items never appear.
  Long proposals switch to a compact density (all 14 components still fit three A4 pages); a page that would
  still overflow grows rather than clipping (and gets a taller PDF page).
* **Customer page `/p/<token>`** (`app/p/[token]`): server-rendered from `GET /api/v1/public/proposals/:token`.
  404 (plain) for: flag off, malformed token, unknown/revoked/draft token (API 404), unpriced proposal, or no
  published template. Title "Your proposal | Mason Company" (static: no customer data in `<title>` or the
  URL); `noindex, nofollow` meta plus `X-Robots-Tag`, `Referrer-Policy: no-referrer` and `Cache-Control:
  private, no-store` on `/p/*` (`next.config.ts`). Responsive: A4 at full size from 834 px wide (tablets in
  landscape), A4 scaled to fit from 600 px, and stacked reflowed pages on phones.
* **Viewer events** (`lib/proposals/viewer-events.ts`) to `POST /api/v1/public/proposals/:token/events`:
  `opened` once per load; `viewed` every 15 s while the page is visible, with `durationMs` = visible time since
  the previous `viewed` (they add up to reading time; a partial spell ≥ 1 s is sent on hide; hidden time never
  counts; capped at the API's 4 h); `option_chosen` when an option card is tapped. Sent with
  `credentials: "omit"` as a `text/plain` JSON body (a CORS simple request; no API change needed). The page sets
  no cookies. Under Do Not Track no heartbeats are sent (opened and option_chosen still are).
* **Show family** (staff): full screen, wake lock held (re-taken when the tab returns), the customer document
  only, with one quiet close button (or Esc). Leaving browser full screen keeps the view open.
* **PDF** (`lib/proposals/pdf.ts`): drawn in the browser from an offscreen A4 copy of the same component
  (html-to-image → jsPDF, JPEG at 2×, ~0.8 MB). The libraries load with the staff screen and the fonts are
  captured with the first proposal load, so once a proposal has been loaded the PDF is made offline. Filename `Mason-Proposal-<YYYY-MM-DD>.pdf`;
  no customer name in the filename or PDF metadata. Measured against the page: 0.3–0.6% of pixels differ (JPEG
  and resampling only). Two traps handled: html-to-image writes font sizes as floor(size) − 0.1 px (the
  document uses whole-pixel sizes and the PDF step restores them), and the site's Newsreader and the proposal's
  Newsreader share a family name (only the proposal instance's faces are embedded).
* **Share** (staff): confirm → `POST /:id/share` (DRAFT → SHARED; the API records the `SHARED` event) → PDF →
  **Send to customer** (`navigator.share({ files: [pdf], url, text })`, a separate tap because share sheets
  need a fresh gesture). Without file sharing: **Download PDF** + **Copy link** (the link is also shown).

## Gaps for the api lane (please pick up in docs/proposals.md)

The api-proposals lane (branch `feat/proposal-builder-phase2-api`) is building token issue/revoke, private PDF
upload and the Zoho note; items 1 and 5 below are the web's expectations of those contracts.

1. **Revoke a link**: `POST /:id/revoke` (ADMIN) that invalidates `shareToken` so the public view 404s. The web
   already shows a plain 404 for any API 404; nothing else changes here.
2. **Log every share**: today only the first `POST /:id/share` writes `SHARED`. Please accept an optional
   `{ channel: "native" | "download" | "copy" }` and record a `SHARED` event (with `meta.channel`) on repeat
   shares too; the web will send the channel once it is accepted.
3. **Public view rate limit**: the customer page fetches the view server-side, so every customer arrives from
   Vercel's egress IPs and shares the 60/min/IP bucket. Options: trust a server key header from the web (e.g.
   `X-Mason-Web-Key`) with its own higher limit, or key the limit on a forwarded client IP from the web only.
4. **Event cap**: heartbeats are 4/min, so the 500-events-per-proposal soft cap is about 2 hours of reading in
   total. Fine for Phase 2; raise or exclude `VIEWED` from the cap if needed.
5. Optional, not needed for Phase 2: private PDF upload (`pdfKey`; the PDF is made in the browser and shared
   directly) and a Zoho note on share.
6. **Live totals need a saved draft** (`POST /:id/price`), so every pricing round is two writes. A stateless
   `POST /internal/proposals/quote` would avoid draft churn; fine as-is.

`proposalDate` (previous gap) is stored by the API on main; accepting `null` (the web sends it when the field
is cleared) is part of the api-proposals lane's task.

## Before turning the flag on

Publish the `proposalTemplate` v1 and the `componentLibrary` documents in Studio (the customer page 404s until
the template is published; the CMO still has 9 benefit lines to write), set `SANITY_API_READ_TOKEN` in Vercel
for staff preview, and resolve gap 3.

## Tests

* `lib/proposals.test.ts` (in `pnpm test`): names/order vs the catalogue, flag gating of route/nav/Studio/
  actions, ADMIN-only override, draft validation, item shape, override rules, seed refusal (incl. empty
  disclaimer), Sanity validators.
* `lib/proposals-phase2.test.ts`: document builder (quote B, variants, complimentary, CMO lines dropped,
  disclaimer fallback, no add-on), staff/public view parity, token pattern, viewer events (no cookies,
  text/plain), Do Not Track, heartbeat timing, PDF font-size restore, page/headers/source guards.
* `pnpm test:e2e:proposals`: Playwright against a synthetic mock API (`e2e/proposals/mock-api.mjs`) at
  iPad portrait/landscape, Galaxy Tab S4 and Pixel 7 viewports (Chromium), with the bundled approved copy
  (`PROPOSALS_CONTENT_SOURCE=seed`, ignored in production builds). Staff screen: flag-off 404, live totals, the
  items sent to the API, agent cannot see override, admin override with reason, 44 px touch targets and no
  sideways scroll. Customer page (`customer-page.spec.ts`): content, headers and title, complimentary/no-add-on,
  the longest proposal on 3 A4 pages, plain 404s, viewer events (clock-driven heartbeats, Do Not Track, no
  cookies), layout per device, Show family (full screen, nothing on top, wake lock), PDF smoke (offline, 3
  pages, filename, no name in the file), share fallback and native share.
* **Golden visual test** (`@golden`, project `a4-golden`): page 1 of the fixture quote B ("Mrs Example") vs a
  reference screenshot of the approved 20 Nov page 1 (`e2e/proposals/__screenshots__/`), rasterised from the
  approved PDF with the customer-name line painted out (#FF00FF) and masked the same way in the test. Measured
  3.3% of pixels differ, all text anti-aliasing (PDF rasteriser vs Chromium), with every text row within 1–2 px of the reference; the limit is 4% (a moved block costs far more). Never regenerate the reference from our own render (it is the approved design); if fonts or the OS change, re-measure first.
