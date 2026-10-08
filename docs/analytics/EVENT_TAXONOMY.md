# Mason analytics — event taxonomy

> Status: first canonical version, 8 October 2026. Read `DEFINITIONS.md` first.
>
> Implementation: `lib/analytics.ts` (allowlists and sanitisation), `lib/lead-funnel.ts` (funnel events), `app/components/launch-analytics.tsx` (page views and click delegation), `app/components/analytics-view-tracker.tsx` (view events).

## Principles

1. **One event per real thing.** Two names for one occurrence is how a funnel starts disagreeing with itself.
2. **Prefer GA4's recommended names** where the semantics genuinely match. They match an existing meaning or they do not; renaming does not make them fit.
3. **Nothing describing a person may ever be a parameter.** Events describe pages, packages and campaigns. The sanitisation chain in `lib/analytics.ts` is a hard boundary, not a guideline.
4. **No event is deleted until something proves nothing depends on it.** GA4 has no "find all references"; a removed event silently empties whatever used it.

## Decisions

### Keep — the canonical funnel

| Event | Decision | Notes |
|---|---|---|
| `page_view` | **KEEP** | Manual, SPA-aware, `send_page_view: false`, 2 s repeat guard. Correct as built. |
| `view_service` | **KEEP** | IntersectionObserver, once per item per route visit. |
| `view_package` | **KEEP** | As above, with `package_price`. |
| `select_package` | **KEEP** | Correct GA4 semantics — an explicit package choice. |
| `form_start` | **KEEP** | Field events only, latched per instance. |
| `form_submit` | **KEEP** | Every attempt, including validation-blocked clicks. |
| `generate_lead` | **KEEP — with a documented coverage gap** | See below. |
| `form_error` | **KEEP (new)** | The missing half of `form_submit`. Fixed category only. |

### `generate_lead` — identity and coverage

**Identity is now correct.** It carries two distinct parameters:

- **`enquiry_id`** — this one enquiry. Unique per accepted submission, including a repeat customer's. **Count this.**
- **`lead_id`** — the CRM record the enquiry belongs to. Shared across a repeat customer's enquiries. **Join on this, never count it.**

Before this cycle only `lead_id` was sent, under a name that invited exactly the wrong use.

**Coverage is deliberately incomplete.** Live entry points:

| Entry point | `form_start` | `form_submit` | `generate_lead` | `form_error` |
|---|---|---|---|---|
| Assessment (`assessment-lead-form.tsx`) | ✅ | ✅ | ✅ | ✅ |
| Contact (`ContactForm.tsx`) | ✅ | ✅ | ✅ | ✅ |
| Checkout (`checkout-experience.tsx`) | ✅ | ✅ | ❌ **by decision** | ✅ |

Checkout does not report `generate_lead` because `docs/DECISIONS.md` records that *"The primary conversion is **Book Free Safety Assessment**; package checkout is strictly secondary"*, and `lib/checkout-tracking.browser.test.ts` asserts that no lead conversion fires there. Changing it would change what Mason counts as its conversion — a founder decision, not an instrumentation fix.

**Consequence to state in every report: `generate_lead` is not a complete enquiry count.** It covers assessment and contact only. The authoritative count is server-side (`METRIC_DICTIONARY.md` → *successful enquiries*).

> A fourth form, `app/components/guidance-form.tsx`, fires no funnel events — and is **not imported anywhere**. Only its CSS module is used. It is unreachable code, so its instrumentation gap has no production effect. There are **three** live entry points, not four.

### `form_error` specification

| | |
|---|---|
| **Fires when** | A submission the customer made did not become an enquiry. |
| **Parameters** | `form_name`, `error_category`, plus the standard page context (`page`, `page_category`, `entry_page`, `city`, `package_name`). |
| **`error_category`** | `validation` (API rejected the values — HTTP 400) · `server` (any other non-OK status) · `network` (the request never reached Mason) |
| **Never carries** | A server message, a status code, a field name, a field value, or anything about the customer. Asserted by test. |
| **Not sent to** | Google Ads (not a conversion) and Meta. Asserted by test. |
| **Cardinality** | Three values, fixed in the type. Do not extend without revisiting this page. |

`server` and `network` are the operational signal — they should be alerted on, not just reported. `validation` is mostly customer-correctable noise.

### Deprecate — superseded by the canonical funnel

These duplicate a canonical event for the same occurrence. **Keep emitting them for now**; retire only after confirming nothing downstream reads them (GA4 custom definitions, Looker Studio, any conversion configuration).

| Event | Decision | Replaced by | Why |
|---|---|---|---|
| `assessment_form_start` | **DEPRECATE** | `form_start` + `form_name="Safety Visit Form"` | Same occurrence, second name. |
| `assessment_lead_submit_success` | **DEPRECATE** | `generate_lead` + `form_name` | Same occurrence. One assessment lead currently emits **both**, so any chart combining them double-counts. |
| `checkout_start` | **DEPRECATE** | `form_start` + `form_name="Checkout Booking Form"` | Same occurrence. |
| `checkout_lead_submit_success` | **KEEP for now** | — | Not a duplicate *today*: it is the **only** success signal on checkout, because `generate_lead` is withheld by decision. Retire only if that decision changes. |
| `guidance_form_start` | **REMOVE with the component** | — | Only reachable from unused code. |
| `lead_location_market` | **MERGE** | the `city` parameter already on every funnel event | Carries no information the funnel events do not. Assessment-form only, so it is not even consistent. |

### `guidance_lead_submit_success` — fix the collision first

**DEPRECATE, but note a defect that is live today.** It is emitted by **two different forms**:

- `app/components/guidance-form.tsx` (unused code)
- `components/ContactForm.tsx` (**live**) — which *also* emits `generate_lead`

The event name cannot distinguish them; only `cta_location` / `section` can (`"guidance-form"` vs `"contact-form"`). **Any existing count of `guidance_lead_submit_success` without a parameter filter is already wrong.** Replaced by `generate_lead` + `form_name="Contact Form"`.

### Keep — genuinely distinct signals

| Event | Decision | Why |
|---|---|---|
| `homepage_cta_click` | **KEEP** | Intent before any form exists. Nothing else captures it. |
| `package_cta_click` | **KEEP** | As above, with the package. Correctly also emits `select_package` when the package is named. |
| `phone_click` | **KEEP** | An off-site conversion with no server record at all — the only trace of a phone enquiry starting. |
| `whatsapp_click` | **KEEP** | As above. Especially valuable given the Zoho WhatsApp webhook is not currently configured. |
| `location_picker_success` | **KEEP** | Measures Google Places health, which is an operational concern, not a funnel one. |
| `location_picker_fallback` | **KEEP** | The failure half. A rise means Places is degrading and addresses are being typed manually — worth alerting on. |

## Parameter allowlist

Enforced centrally; anything absent is silently dropped.

**Text** — `page`, `package`, `cta_location`, `section`, `market`, `form_source`, `page_title`, `city`, `service_name`, `package_name`, `form_name`, `error_category`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `gclid`, `gbraid`, `wbraid`, `fbclid`
**Numeric** — `package_price`
**Shape-validated ids** (`^[A-Za-z0-9_-]{1,64}$`) — `enquiry_id`, `lead_id`
**Auto-injected** on funnel events — `page_category`, `entry_page`, `city`

### Why `utm_term` is not on it

`utm_term` is the paid-search keyword, so it is normally several words. `safeAnalyticsCampaignValue` admits **no spaces** — and that is precisely what prevents a campaign parameter carrying a street address. An existing test, *"campaign URL and event values keep safe attribution but exclude contact details"*, asserts that `123 Main Street` must not pass.

Admitting spaces to make `utm_term` useful would reopen that hole. **The privacy protection wins.** The keyword is not lost: `lib/lead-context.ts` captures it in full and the API maps it to Zoho's `UTM_Term`, where it can be read per lead.

This is a deliberate asymmetry — Zoho sees the keyword, GA4 does not — and is recorded here so it is not "fixed" later by someone loosening the regex.

### Sanitisation chain (do not weaken)

Every text parameter passes, in order:

1. `sanitizeContextValue` — strips query and hash, caps at 120 characters
2. `looksLikeContactDetail` — rejects any value containing `@` or a run of 10+ digits, checked both raw and URL-decoded
3. `safeAnalyticsCampaignValue` (campaign keys only) — `^[A-Za-z0-9._~:/=-]+$`, capped at 255

Separately, `sanitizePageLocation` rejects cross-origin URLs and rebuilds the URL keeping **only** the nine campaign parameters, discarding every other query value; `safeAnalyticsPath` replaces a path with `/` if it looks like contact detail or contains whitespace.

Each destination send is individually wrapped, preserving the invariant: *"Analytics must never affect navigation, forms, checkout, or lead creation."*

## Destinations

| Destination | Configured in Production? | Receives |
|---|---|---|
| **GA4** | Yes (`NEXT_PUBLIC_GA_MEASUREMENT_ID`) | Every allowlisted event. |
| **Google Ads** | **No** — `NEXT_PUBLIC_GOOGLE_ADS_ID` is not set | Would receive one `conversion` on `generate_lead` only. |
| **Meta Pixel** | **No** — `NEXT_PUBLIC_META_PIXEL_ID` is not set | Would receive `PageView`, `Lead`, and custom `view_package` / `select_package` / `form_start`. |

**GA4 is currently the only live destination.** This is why the changes in this cycle carry no advertising-bidding consequence — worth re-checking before assuming the same of any future change, because it stops being true the moment either id is configured.

## Retirement procedure

Before removing any **DEPRECATE** event:

1. Check GA4 custom definitions, audiences, explorations and conversion events for the name.
2. Check Looker Studio or any other report for the name.
3. Confirm the replacement has been live, and populated, for at least one full reporting period.
4. Remove the emit, remove it from `allowedEventNames`, and update this page in the same commit.

Do not batch retirements with a behavioural change.
