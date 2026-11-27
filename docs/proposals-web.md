# Proposal Builder v1 — web, Phases 1, 2 and 3

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

* **Details from review**: a proposal with no date (staff cleared it) renders "Proposal" with no date, and the
  PDF filename uses today's date. Customer links always use `PROPOSALS_SHARE_ORIGIN` (server env, default
  `https://www.masoncompany.in`), never the CRM's own host. The builder locks the moment Share is tapped.
  Component photos are inlined (data URLs) when a proposal is loaded, so offline PDFs keep them. Leaving into
  the back/forward cache stops reading time; returning resumes it. The wake lock is released even if the view
  closes while it is being requested.

## Phase 3 — offline, Customer accepts, Lost

Everything below is dark: it lives on flag-gated pages (404 when `NEXT_PUBLIC_PROPOSALS_ENABLED` is off), and
nothing registers the service worker unless one of those pages is open.

### Offline (installable staff screen)

* **Install**: `/crm/proposals/new` links `public/proposals.webmanifest` (scope `/crm/proposals/`, standalone,
  icons rendered from the brand mark). On an iPad: Share → Add to Home Screen.
* **Service worker** `public/proposals-sw.js`, registered twice: scope `/crm/proposals/` (staff) and `/p/`
  (customer page). Production builds only; `NEXT_PUBLIC_PROPOSALS_SW_DEV=true` enables it on a dev server
  (Playwright only). Served `no-cache` so a fix reaches tablets on the next visit. Caches:
  * `mason-proposals-shell-v1`: the builder page (stored without its query string; the lead id is read again
    in the browser), the hashed `/_next/static` files, the manifest and icons.
  * `mason-proposals-data-v1`: `GET /crm/proposals/offline-bundle` (the template and component library as staff
    preview sees them, the last good price list with the pricing rule, and the signed-in staff id; no customer
    data) and the component photos (fetched once when the bundle loads, as JPEG and WebP).
  * `mason-proposals-open-v1`: the one customer page last opened, replaced by the next.
  POSTs (server actions) are never cached.
* **Queued work** lives in IndexedDB (`mason-proposals-offline`), not the SW cache: saves, share, accept and lost,
  plus the open proposal while it has queued work (so an offline reload carries on). Saves for one proposal
  collapse into one. It syncs on the browser's `online` event, every 20 s while anything waits, and on load,
  one op at a time, in order, one sync per device (Web Locks; an IndexedDB lease where they are missing). Each
  op is removed once the API confirms it, unless it changed meanwhile: an edit made while its save was being
  sent is kept and sent next. A draft first saved offline records its server id before anything else, so a retry
  PATCHes and never creates a second draft. A refused op (e.g. a variant the price list does not have) holds back
  only the later ops of that proposal and shows "Not synced" with Try again / Discard; discarding a share,
  accept or lost undoes it on screen. If the server prices a draft differently from the tablet, a queued share
  or accept for it waits ("check the new totals with the family, then Try again"), so nothing reaches the
  customer at a price they were not shown. Attempts that keep failing while the browser is online (an
  out-of-date page after a deploy) ask staff to reload. The badge reads "Waiting for signal: N items"
  (offline) or "Syncing: N items".
* **Pricing with no signal** uses `lib/proposals/pricing.ts`, a copy of the api engine. The server stays the
  authority: the queued save is re-priced by the API on sync, and staff are told if its totals differ. With no
  price list on the tablet (always, until gap 7), no total is shown offline, but the draft is still kept and
  synced, and the server prices it when the signal returns.
* **Show family and the PDF** with no signal build the document on the tablet (`lib/proposals/offline/bundle.ts`,
  the same builder as the server's). A queued share makes the PDF straight away; the customer link appears once
  the share has synced.
* **Logout** deletes the IndexedDB database and every `mason-proposals-*` cache, and unregisters the worker; it
  warns first if anything has not synced. It runs whenever such data exists, flag on or off. A different
  staff member opening the screen on the same tablet clears the previous one's data (the worker and app
  shell stay). The default proposal date is computed on the tablet, so an offline copy from another day is
  not stale.

### Offline pricing

The local engine must give the same totals as mason-api. `lib/proposals/fixtures/pricing-cases.json` holds 16
cases (synthetic prices, including the 5 error cases) with the **api engine's own outputs**, generated from
`mason-api src/proposals/pricing.ts` at `f868496`; `lib/proposals-phase3.test.ts` checks the local engine
reproduces every one. When the api engine changes: run the api's `priceProposal` over the fixture's inputs,
write the outputs back, and make the local copy pass. The api lane is asked to add the same fixture to its tests
(gap 7), so a change on either side fails a test.

### Customer accepts

Shown after Show family (or once shared), in its own "Customer decision" panel: "Essential" / "Essential +
Add-on" → a confirmation step with the amount → share first if needed (the API accepts SHARED only) →
`POST /:id/accept {option}` → the payments case `/crm/payments/<commercialCaseId>` opens so staff can create
the Razorpay links. **Admins only for now**: mason-api accepts from admins only, so agents see "Ask an admin"
and nothing is shared on their behalf (the CTO's rule, admin-only when overridden, needs gap 9). With no
signal, share and accept are queued and the "Open the payments case" link appears after sync.

### Lost

"Mark as lost" → reason (Price, Timing, Family decision, Not needed, Other; `lib/proposals/lost.ts`, CMO to
refine the wording) and a note (required for Other; no phone numbers or emails) → confirmation → closed.
Queued when offline.

### Photos on old Safari

Photos are requested with an explicit format: a `<picture>` with a WebP source and a JPEG `<img>` fallback
(Safari before 14 has no WebP; a shared CDN cache can also serve the wrong `auto=format` variant). The PDF
always uses the JPEG. `AbortSignal.timeout` falls back to an AbortController where it is missing (Safari < 16).

## Go-live hardening

* **Signed calls** (`lib/proposals/web-signing.ts`): the customer page's server-side view fetch carries
  `x-mason-web-ts` + `x-mason-web-signature` (HMAC-SHA256 of `${ts}\n${METHOD}\n${path}` with
  `PROPOSALS_WEB_SIGNING_SECRET`, the same value as on aegis-living-api; at least 32 characters or it counts as
  unset). mason-api then limits per share token instead of per Vercel IP. A unit test pins the format to a
  vector generated from mason-api's own `signWebRequest`. Only the server signs: the browser's viewer events stay
  unsigned and the API limits them per real customer IP. With the secret unset, calls go unsigned and a warning
  is logged once.
* **Per-client-IP limit before signing** (`middleware.ts`, `lib/proposals/rate-limit.ts`): `/p/…` only, and only
  while the flag is on. 30 page loads per IP per minute (`PROPOSALS_PAGE_RATE_LIMIT`), then a plain 429 with
  `Retry-After`. The IP comes from Vercel's `x-real-ip` / `x-forwarded-for` (set by Vercel's edge; elsewhere only
  with `PROPOSALS_TRUST_PROXY_HEADERS=true`) and is hashed before use. Store: Vercel's Redis/KV integration over
  REST (`KV_REST_API_URL`, `KV_REST_API_TOKEN`) so the limit holds across instances; without it, a window per
  instance. A store error lets the request through (the API's own per-token limits and 1,200/min ceiling stay
  behind it).
* **Zoho note on share**: the share response's `zohoNote` shows as a neutral chip — "Zoho note pending",
  "Zoho note added" or "Zoho note not added yet" — never as an error (the share itself succeeded).

Env: `PROPOSALS_WEB_SIGNING_SECRET` is already set (sensitive) on aegis-living-web and aegis-living-api. A
cross-instance limit needs the Redis/KV integration connected to aegis-living-web (a Production change: founder's
yes first).

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

**Phase 3 requests** (the web is built against these and stays dark until they exist):

7. **Price list for offline pricing**: `GET /api/v1/internal/proposals/price-list` (any staff) →
   `{ data: { version, entries: [{ component, variant, unitPaise }], config: { manpower: { kind: "fixed",
   amountPaise }, roundUpStepPaise } } }`: the last good list the store serves (no sheet contents beyond prices),
   plus the pricing rule. Without it the bundle has no price list and the screen refuses to price offline
   ("Offline pricing needs the price list") rather than guess. Please also add a test that runs `priceProposal`
   over `lib/proposals/fixtures/pricing-cases.json` (copy it in), so both engines are held to the same cases.
8. **Lost**: `POST /api/v1/internal/proposals/:id/lost { reason: "price" | "timing" | "family_decision" |
   "not_needed" | "other", note: string | null }` (note required for "other", max 500), from DRAFT or SHARED,
   ADMIN or creator; writes the `LOST` event with `meta.reason`/`meta.note`; idempotent for the same reason;
   409 once ACCEPTED. Until it exists the web shows "not available on the server yet" and records nothing.
9. **Accept for agents**: the CTO's rule is "ADMIN-only if the price was overridden". mason-api refuses every
   non-admin today (403), and the web shows that refusal. Relax to ADMIN-only when `override` is set, if agreed.
10. **Idempotent create** (also covers a create whose response is lost while online, not only offline): an offline-created draft whose create succeeded but whose response was lost (the
    signal dropped mid-request) would be created again on retry. Accepting an `Idempotency-Key` header on
    `POST /internal/proposals` (the web would send the queue's local id) closes that last gap.

`proposalDate` (previous gap) is stored by the API on main; accepting `null` (the web sends it when the field
is cleared) is part of the api-proposals lane's task.

**Phase 3 web follow-ups** (not blocking the dark merge): prune old `/_next/static` entries from the shell
cache after deploys (it only grows today; bump `VERSION` in `public/proposals-sw.js` to reset it); a second
open builder tab can re-create the offline database after the first tab signs out; an IndexedDB-based create
lock across tabs is moot once gap 10 lands.

## Before turning the flag on

Publish the `proposalTemplate` v1 and the `componentLibrary` documents in Studio (the customer page 404s until
the template is published; the CMO still has 9 benefit lines to write), set `SANITY_API_READ_TOKEN` in Vercel
for staff preview, and resolve gap 3 (done on the api side: signed calls; see "Go-live hardening"). For offline use: gaps 7 (price list) and 8 (Lost); 9 if agents are to
record acceptances.

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
* `lib/proposals-phase3.test.ts`: local pricing vs the shared fixture (api engine outputs), offline price and
  document, the queue (saves collapse, order, exactly-once, signal lost mid-sync, created draft never created
  twice, refusal stops until retry/discard), Lost rules, photo formats, service worker and bundle-route guards.
* `e2e/proposals/offline.spec.ts`: with the service worker on a dev server — go offline, reload (the page comes
  from the worker), build and price a proposal, Show family, PDF, share and accept queued, back online → create,
  price, share and accept each sent exactly once, nothing again after another online event and a reload, and no
  customer data in any worker cache; server re-pricing on sync with a notice; no price list → no price; online
  accept (share + accept → payments case); the API's accept refusal; Lost with confirmation; Lost endpoint
  missing; logout clears the queue and every cache.

* `lib/proposals-golive.test.ts`: signature vs mason-api's own vector, no secret in client code, trusted client
  IP, the per-IP window (refusal, reset, other IPs, hashed keys), fail-open, the Upstash pipeline, middleware
  (429 + Retry-After, `/p/` only, inactive with the flag off), the Zoho note chip.
* `e2e/proposals/golive.spec.ts`: the customer page's view call verified as signed by the mock (as mason-api
  verifies it) while browser events are unsigned and nothing about signing reaches the page; a "pending" Zoho
  note shows as a neutral chip with no error.
