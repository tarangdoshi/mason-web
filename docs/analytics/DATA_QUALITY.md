# Mason analytics — data quality and test contamination

> Status: first canonical version, 8 October 2026. Environment scopes read from Vercel on 7 October 2026 (**names and target scopes only — no secret value was read or recorded**).
>
> **Nothing in this document was deleted, altered or tagged.** It is a survey.

## Findings, ranked

### 🔴 CRITICAL — Preview deployments report into the production GA4 property

**Verified.** `NEXT_PUBLIC_GA_MEASUREMENT_ID` on `aegis-living-web` is scoped to **`Preview, Production`**. A second branch-scoped Preview entry exists for `feature/v1-payments-ui`.

`lib/analytics.ts` never checks `VERCEL_ENV`, so there is no code-side gate either. **Every preview deployment, and every click a developer or reviewer makes on one, sends real hits into the production GA4 property.**

- Affects all GA4 metrics, most visibly `page_view`, `view_*` and CTA clicks.
- Does **not** affect `generate_lead`: Preview has no `NEXT_PUBLIC_API_URL`, so `lib/api.ts` throws a 503 and no submission can succeed. Funnel-start and funnel-attempt events *are* affected.
- **Historical data is already contaminated** and cannot be separated retroactively — preview hits carry no distinguishing dimension.
- Fix requires a **Vercel Production environment change**, which is outside the authorisation for this cycle. Raised as a founder decision.

### 🔴 CRITICAL — no internal or staff traffic exclusion

**Verified.** No IP filter hook, no debug-property switch, no internal-traffic dimension, no `VERCEL_ENV` gate. Mason's own team browsing the live site is counted as customer traffic. At launch volumes this is proportionally large.

### 🟠 HIGH — `generate_lead` is not a complete enquiry count

**Verified, and partly by decision.** Checkout never emits it (`docs/DECISIONS.md`; see `EVENT_TAXONOMY.md`). Any GA4-only "leads" figure undercounts by the whole checkout channel.

### 🟠 HIGH — repeat enquiries are not detectable in Production

**Verified by absence.** `PUBLIC_LEAD_MATCHING_ENABLED` is **not present** in the `aegis-living-api` environment at all. It parses through `optionalBool`, so it is `false`.

Consequences, both current:

- Match-before-create is **off**, so every submission creates a Zoho Lead. `new leads` currently means *"Leads created"*, not *"distinct customers"*.
- The repeat-enquiry machinery shipped in PR #17 is live code but **inactive**. The earlier handoff treated repeat-reuse as active behaviour; it is latent.

When it is enabled, the enquiry record for a repeat becomes a Zoho **Note body** — durable but not queryable.

### 🟠 HIGH — the attribution-to-revenue join does not exist

**Verified.** `CommercialCase` holds no campaign, click-id, referrer or landing-page column, and is created manually by staff. Campaign → verified revenue cannot be answered in any system today.

### 🟡 MEDIUM — one Neon database serves Production

**Verified, with an important correction to the earlier handoff.** General Preview on `aegis-living-api` is pointed at a `DATABASE_URL` that is a visibly non-functional placeholder, not the production connection string, and `ZOHO_SYNC_ENABLED` is plainly **`false`** on general Preview.

So the earlier claim — *"any Preview deployment on any branch now pushes real leads into the live Zoho org"*, taken from `mason-api/docs/PROJECT_STATE.md` (dated 2026-09-23) — **is no longer true.** It has since been scoped back. That repo doc is stale on this point.

Residual risk: the branch-scoped `feature/v1-payments` Preview carries real-looking encrypted `DATABASE_URL`, `ZOHO_*`, `RAZORPAY_*` and `NOTIFICATIONS_ENABLED` values. Any deployment on **that** branch may reach live systems.

### 🟡 MEDIUM — test, UAT and internal records cannot be reliably identified

**Verified.** No `environment`, `isTest` or `source_system` field exists on `LeadRecord`, `CommercialCase`, `Order`, `PaymentRequest`, `Payment` or in the Zoho mapping. Historical test records — and there is documented evidence of at least one real production lead created by `curl` during the 2026-09-23 deploy verification — are indistinguishable from customer records.

### 🟡 MEDIUM — migrations are not applied by deployment

**Verified.** `vercel.json`'s build command is `pnpm exec prisma generate && pnpm build`. There is no `prisma migrate deploy`. Whether all seven migrations are applied to the production database is **unverified** — it needs a database connection, which was deliberately not opened.

### 🟡 MEDIUM — the public lead rate limit can suppress genuine enquiries

**Verified.** `PUBLIC_LEAD_RATE_LIMIT_MAX` defaults to 5 per `PUBLIC_LEAD_RATE_LIMIT_WINDOW` (1 minute) per IP. Both are set in Production (values not read). A shared NAT or office IP could be throttled, and a throttled submission is a `form_error` of category `server`, not a visible outage.

### 🟢 LOW — `page_view` under-counts fast re-entry

**Verified.** The 2 s repeat guard is time-based, so a genuine return to the same URL within 2 s is dropped. Direction is *under*-count. Not worth changing.

### 🟢 LOW — `city` is absent from early-session events

**Verified, and by design.** `city` is only attached once a market resolves, so early `page_view`s lack it (*"omitted while unknown rather than guessed"*). Session-scoped `city` segmentation is systematically incomplete for early-funnel events.

### 🟢 LOW — `guidance_lead_submit_success` conflates two forms

**Verified.** Emitted by both the unused `guidance-form.tsx` and the live `ContactForm.tsx`. Any count of it without a parameter filter is already wrong.

---

## Verified environment scopes

Names and target scopes only. **No secret value is recorded here.** Absence is itself a finding.

### `aegis-living-web`

| Variable | Scopes | Note |
|---|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | **Preview, Production** | 🔴 the contamination source |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` | **absent** | Google Ads is not configured |
| `NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION_LABEL` | **absent** | |
| `NEXT_PUBLIC_META_PIXEL_ID` | **absent** | Meta Pixel is not configured |
| `NEXT_PUBLIC_API_URL` | Production, Development, + one branch Preview | general Preview fails closed by design |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Production, Preview | |
| `GOOGLE_MAPS_API_KEY` | Production, Preview | server-side |
| `NEXT_PUBLIC_SANITY_*`, `SANITY_*` | Production, Preview, Development | |

**GA4 is the only live analytics destination.** This is why this cycle's changes carry no advertising-bidding consequence — and why that must be re-checked the moment either ad id is configured.

### `aegis-living-api`

| Variable | Scopes | Note |
|---|---|---|
| `PUBLIC_LEAD_CAPTURE_MODE` | Preview, Production | explicitly set |
| `PUBLIC_LEAD_MATCHING_ENABLED` | **absent** | 🟠 so repeat matching is off |
| `ZOHO_LEAD_EVENT_SECRET` | **absent** | the Zoho→Slack webhook refuses every call, so WhatsApp/phone lead alerts are not live |
| `ZOHO_SYNC_ENABLED` | Production; **`false`** on general Preview; branch Preview | corrects the stale repo doc |
| `DATABASE_URL` | Production; **placeholder** on general Preview; branch Preview | general Preview has no real database |
| `ZOHO_CLIENT_ID` / `_SECRET` / `_REFRESH_TOKEN` | Production, + branch Preview | |
| `ZOHO_AREA_LOCALITY_FIELD_API_NAME` | **absent** | so `Area_Locality` stays dormant, as the code expects |
| `NOTIFICATIONS_ENABLED`, `SLACK_LEAD_WEBHOOK_URL` | Production | Slack lead alerts appear live |
| `CUSTOMER_COMMUNICATIONS_ENABLED`, `RESEND_API_KEY` | Production | acknowledgement email appears live |
| `CUSTOMER_WHATSAPP_ENABLED`, `TWILIO_*` | **absent** | customer WhatsApp is off |
| `RAZORPAY_PAYMENTS_ENABLED`, `RAZORPAY_LINK_ISSUANCE_ENABLED` | Production, **`true`** | ⚠️ payments are **live** |
| `RAZORPAY_KEY_ID` / `_SECRET` / `_WEBHOOK_SECRET` | Production, + branch Preview | |
| `CAPTCHA_ENABLED` | Production | value not read |
| `PUBLIC_LEAD_RATE_LIMIT_MAX` / `_WINDOW` | Production | values not read |
| `redis_REDIS_URL` / `REDIS_URL` + KV set | Production, + branch Preview | required in production by config |
| `OUTBOX_DRAIN_SECRET`, `OUTBOX_*` | Production | |

Because `RAZORPAY_*_ENABLED` are `true` in Production, **no test payment request or transaction may be generated for measurement purposes under any circumstances.**

---

## Proposed record classification policy

**Not implemented.** Implementing it would mean a Prisma migration and/or a new Zoho field, both outside this cycle's authorisation. Recorded so the decision can be taken deliberately.

| Class | Meaning |
|---|---|
| `REAL` | A genuine customer interaction. |
| `UAT` | Created during a deliberate acceptance test by a known operator. |
| `INTERNAL` | Created by Mason staff exercising the product, not a customer. |
| `DEVELOPMENT` | Created from a development or Preview environment. |
| `SYNTHETIC` | Created by an automated script, seed or load test. |
| `UNKNOWN` | Provenance not determinable — **the correct value for every record that exists today.** |

Design constraints, if it is ever adopted:

1. **Never rewrite history.** Every existing record becomes `UNKNOWN`. Back-filling a guess would destroy the only honest signal — that provenance was not captured.
2. **Default `UNKNOWN`, not `REAL`.** A nullable column defaulting to `REAL` would silently assert something untrue about every historical row.
3. **Derive at write time from the environment**, never from a client-supplied field, or it becomes spoofable.
4. **Additive only** — a new nullable column plus an index. No existing query changes meaning.
5. **GA4 cannot be retrofitted.** A new dimension applies only to future hits; historical contamination stays. The real fix there is removing the Preview scope.

## Recommended order of remediation

1. **Remove `NEXT_PUBLIC_GA_MEASUREMENT_ID` from the Preview scope** (or point Preview at a separate GA4 property). Highest value, smallest change — but it is a Vercel Production environment change and therefore a founder action.
2. **Verify the `UTM_*` / `Gclid` / `Fbclid` fields are actually on the Zoho Leads layout.** Cheap, read-only, and if they are not present then the whole attribution story is empty regardless of what the code sends.
3. **Decide on `PUBLIC_LEAD_MATCHING_ENABLED`.** It changes what `new leads` means, so decide before anyone builds a chart on it.
4. **Confirm migration state against the production database.**
5. **Then** decide on record classification and the attribution-to-revenue join.
