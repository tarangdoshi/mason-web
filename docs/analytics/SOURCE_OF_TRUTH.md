# Mason analytics — source-of-truth matrix

> Status: first canonical version, 8 October 2026. Read `DEFINITIONS.md` first.

## How to use this page

When two systems disagree, the **Authority** column wins. Not "the newer number", not "the bigger number", not "the one in the dashboard". If a report contradicts the authority, the report is wrong.

## Matrix

| Domain | Authority | Also holds it (non-authoritative) | Precedence rule when they disagree |
|---|---|---|---|
| **Website behaviour** — visitors, sessions, pages, CTAs, scroll-depth views | **GA4** | — | GA4 is the only record. Nothing else observes browsing. Treat as a **lower bound**: ad blockers remove events, and Preview traffic inflates it. |
| **Successful enquiry** — did a customer ask, and did Mason accept | **The accepted server-side record** — Zoho Lead (or its enquiry Note) for guidance; `LeadRecord` for checkout | GA4 `generate_lead` | **The server record always wins.** GA4 is a browser signal: it is lossy, it does not cover every entry point, and it can fire where no record was written if a response is misread. Never report "enquiries" from GA4 alone. |
| **Enquiry identity** — is this one enquiry or two | **`enquiryId`** | Zoho Lead id; GA4 `lead_id` | `enquiryId` wins. A Zoho Lead id is the *customer's record*, not the enquiry, and a repeat customer shares it. |
| **CRM lead / customer identity** — who the customer is, their status and ownership | **Zoho CRM** | Postgres `LeadRecord` (checkout only) | Zoho wins for anything customer-facing: name, phone, email, `Lead_Status`, owner, `Lead_Source`. Mason's own `/crm` UI and `LeadRecord` are retained code, not the operating system of record — a founder decision recorded in `mason-api/docs/PROJECT_STATE.md`. |
| **Lead origin / channel** | **Zoho `Lead_Source`** | `metadata.source` inside `Mason_Metadata_JSON` | `Lead_Source` wins for channel (Website / WhatsApp / Phone), but **cannot distinguish the three web forms** — all map to `"Website - Guidance Form"`. For *which form*, `metadata.source` is the only answer, and it is not queryable. |
| **Repeat vs new** | **Zoho CRM** (match outcome) | — | Zoho's phone match is authoritative when `PUBLIC_LEAD_MATCHING_ENABLED` is on. **It is off in Production today**, so no repeat is currently detected and every enquiry presents as new. |
| **Enquiry history for a known customer** | **Zoho Notes** on the Lead | `LeadActivity` (checkout leads only) | Zoho Notes win for guidance-path customers. Note that the two stores are not interchangeable: `LeadActivity` is structured and queryable, Notes are free text. Neither covers all enquiries. |
| **Assessment / CRM pipeline state** | **Zoho CRM** `Lead_Status` | — | Zoho wins. Mason pushes `New` on create and never writes status afterwards, so any later state is Zoho's alone. |
| **Serviceability / market** | **Server-verified Google Geocoding** result | Client-side Places classification; Zoho `Service_Area`; GA4 `city` | The server verdict wins. A client-supplied market is never evidence — the mapper only accepts geography when `source === "GOOGLE_GEOCODING"`. GA4 `city` is a convenience copy and is **absent from early-session events** by design. |
| **Recommendation / quiz** | **The submitted `metadata.quiz`** | Zoho `Quiz_Band`, `Quiz_Score` | Zoho's two fields are the reportable summary; per-question answers exist only in `Mason_Metadata_JSON`. |
| **Commercial case existence** | **Neon Postgres** `CommercialCase` | — | Postgres only. Created by staff, never by lead capture. |
| **Commercial amount** | **The `APPROVED` `CommercialRevision`** (`approvedAmountPaise`) | Package list price in Sanity; `totalPayable` on the checkout payload | The approved revision wins, always. A list price is marketing copy and a checkout `totalPayable` is a customer-facing estimate; neither is what Mason agreed. Exclude `SUPERSEDED` revisions. |
| **Order existence and lifecycle** | **Neon Postgres** `Order` | — | Postgres only. |
| **Money requested** | **Neon Postgres** `PaymentRequest`, reconciled to Razorpay | Razorpay dashboard | Postgres wins as the record; Razorpay wins on provider status. A request is **not** revenue. |
| **Money received** | **The payment ledger** — `Payment` with `recordType=COLLECTION`, `status=PAID`, `source != LEGACY` | `ProviderEvent`; Razorpay dashboard | The ledger wins, corroborated by `ProviderEvent`. **`LEGACY` rows are excluded** — no verified provenance, and *"never count as V1 money received"*. Net of `REVERSAL` rows. |
| **Reversals / refunds** | **Payment ledger** (`recordType=REVERSAL`) | Razorpay | Ledger wins. Any revenue figure must be net. |
| **Marketing content, packages, SEO copy, images** | **Sanity** | Hard-coded fallbacks in `content/` and `lib/cms/fallback.ts` | Sanity wins when a document exists; the fallback is what renders when it does not, so a reported "package price" can come from either. Check which before trusting a price in a report. |
| **Campaign attribution for an enquiry** | **Zoho Lead** custom fields (`UTM_Source/Medium/Campaign/Term/Content`, `Gclid`, `Fbclid`, `Entry_Point`) | GA4 session attribution; `Mason_Metadata_JSON.attribution` | Zoho's discrete fields win per enquiry, **but only for a new Lead** — a repeat enquiry does not overwrite them, so the Lead keeps its *first* campaign forever. GA4's own model answers session-level questions and will not agree; that is expected, not a bug. |
| **Landing page / referrer** | **`Mason_Metadata_JSON.attribution`** | GA4 `entry_page` | Neither is strong. There is no discrete Zoho field for either, so both live in a blob that is the **first thing truncated** when it overflows. GA4 `entry_page` is session-scoped and path-only. |
| **Customer communications sent** | **The communications outbox** (`src/customer-communications`) | Resend dashboard | Outbox wins for "did Mason try"; Resend wins for delivery. |
| **Internal lead alerts** | **Notification outbox** → Slack | Slack channel history | Outbox wins. Keyed per enquiry, so it is the closest thing Mason has to a durable enquiry log in Postgres — but only when `NOTIFICATIONS_ENABLED` is on. |
| **Field service / installation** | **UNKNOWN — no system connected** | `Order.status` values; `content/communications/` copy | **No authority exists.** `Order.status` can hold `TECH_EN_ROUTE` etc. but nothing writes it from a field-service system, and Zoho FSM appears nowhere in either repository. Do not report installation metrics until a real system is connected. |
| **AMC / post-installation** | **UNKNOWN — no system connected** | `amcSelected` on a checkout payload | No authority. No AMC entity, no renewal date, no lifecycle. |
| **Deployed code → behaviour** | **The Vercel production deployment's git SHA** | `main` HEAD; local checkouts | The deployment wins. Local working trees were stale and dirty during this work, and `mason-api`'s GitHub *default branch* is a feature branch, so neither is evidence of what is live. |

## Two standing contradictions to expect

**1. GA4 enquiries will be lower than Zoho enquiries.** Three causes, all structural: ad blockers drop browser events; `generate_lead` does not fire on checkout (a documented decision — see `EVENT_TAXONOMY.md`); and a browser can close before the event flushes. Track the gap as a data-quality signal rather than trying to reconcile it to zero.

**2. GA4 campaign attribution will not match Zoho's.** GA4 applies its own session-scoped, last-non-direct model to `page_location`. Mason stores strict first-touch per browser session. These answer different questions and should never be put in the same column of a report.
