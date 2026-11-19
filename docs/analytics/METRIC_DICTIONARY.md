# Mason metric dictionary

> Status: first canonical version, 8 October 2026. Read `DEFINITIONS.md` and `SOURCE_OF_TRUTH.md` first.

## Trust ratings

| Rating | Meaning |
|---|---|
| 🟢 **TRUSTWORTHY NOW** | Can be reported as-is, within its stated exclusions. |
| 🟡 **PARTIALLY TRUSTWORTHY** | Directionally useful. Has a known, named bias. Never quote as an absolute without the caveat. |
| 🔴 **NOT YET MEASURABLE** | Do not report. The data does not exist, or exists in a form that cannot be queried. |

Two biases apply to **every GA4-sourced metric** below and are not repeated each time:

- **Preview contamination (upward).** `NEXT_PUBLIC_GA_MEASUREMENT_ID` is scoped to Preview *and* Production, so every preview deployment reports into the production property. No internal-traffic exclusion exists.
- **Ad-blocker loss (downward).** All GA4 events are browser-origin. There is no server-side event stream to reconcile against.

---

## Audience

### visitors 🟡
- **Definition** — distinct browsers that loaded a Mason page.
- **Formula** — `count(distinct client_id)` over `page_view`.
- **Grain** — GA4 session / browser. **Source** — GA4. **Time basis** — event timestamp.
- **Includes** — all organic, direct, referral and campaign traffic.
- **Excludes** — nothing. **It does not exclude Mason staff or Preview traffic.**
- **Limitations** — not people; a second device is a second visitor.

### engaged visitors 🟡
- **Definition** — sessions that did something beyond landing.
- **Formula** — `count(distinct session_id)` where the session contains any of `view_service`, `view_package`, `select_package`, `homepage_cta_click`, `package_cta_click`, `phone_click`, `whatsapp_click`, `form_start`.
- **Grain** — session. **Source** — GA4. **Time basis** — first qualifying event.
- **Limitations** — **this is Mason's own definition, not GA4's `engaged_session`** (10s / 2 pageviews / conversion). The two will differ. Never mix them in one report.

---

## Lead funnel

### form starts 🟢
- **Definition** — mounted lead forms a visitor began filling.
- **Formula** — `count(form_start)`, segmentable by `form_name`.
- **Grain** — form instance. **Source** — GA4. **Time basis** — event timestamp.
- **Includes** — Safety Visit Form, Contact Form, Checkout Booking Form.
- **Excludes** — button-only focus (field events only).
- **Limitations** — latched per instance; navigating away and back can produce a second start for one person.

### submission attempts 🟢
- **Definition** — attempts to submit a lead form, successful or not.
- **Formula** — `count(form_submit)`.
- **Grain** — attempt. **Source** — GA4.
- **Includes** — attempts blocked by client-side validation (deliberately — it is still intent).
- **Limitations** — intentionally un-latched, so one person retrying three times is three attempts. That is the definition, not a defect.

### successful enquiries 🟡
- **Definition** — submissions Mason accepted. The canonical business volume metric.
- **Formula (authoritative)** — `count(distinct enquiryId)` across accepted server-side records: Zoho Leads created with `Mason_Lead_Id` **UNION** enquiry Notes carrying `Mason enquiry ref` **UNION** `LeadRecord` rows from checkout.
- **Formula (GA4 proxy)** — `count(distinct enquiry_id)` on `generate_lead`.
- **Grain** — enquiry. **Source** — server-side records. **Time basis** — server `receivedAt`.
- **Excludes** — replayed identical resubmissions (same `enquiryId` by design).
- **Limitations — this is the headline caveat of the whole document:**
  - The **GA4 proxy undercounts**: `generate_lead` does not fire on checkout (documented decision, `EVENT_TAXONOMY.md`), so GA4 counts assessment + contact only.
  - The **authoritative version requires a UNION across two systems** with no single query surface. There is no warehouse, so this is currently a manual exercise.
  - The Notes component is **free text**, so the repeat portion is not reliably extractable.
- **Why 🟡 not 🟢** — the number is well defined and every component exists; none of it is conveniently queryable yet.

### new leads 🟡
- **Definition** — customers Mason had no prior record of.
- **Formula** — `count(Zoho Leads created)` + `count(LeadRecord rows)`.
- **Grain** — customer. **Source** — Zoho CRM. **Time basis** — Zoho `Created_Time`.
- **Limitations** — **currently over-counts.** `PUBLIC_LEAD_MATCHING_ENABLED` is not set in Production, so match-before-create is off and every submission creates a Lead. Today this metric means *"Leads created"*, not *"distinct customers"*. It becomes 🟢 once matching is enabled.

### repeat enquiries 🔴
- **Definition** — later enquiries from a customer Mason already knows.
- **Formula** — would be `count(enquiry Notes)` on matched Leads.
- **Limitations** — two independent blockers: matching is **off** in Production so no repeat is detected; and when on, the record is a Zoho **Note body**, not a queryable field. Needs a founder decision on a structured field.

### assessment requests 🟡
- **Definition** — requests for the free safety visit. Mason's primary conversion.
- **Formula** — `count(distinct enquiryId)` where `metadata.intentCategory = "assessment"`.
- **Grain** — enquiry. **Source** — Zoho CRM. **Time basis** — `receivedAt`.
- **Limitations** — the discriminator lives in `Mason_Metadata_JSON`, because `Lead_Source` is `"Website - Guidance Form"` for **both** the assessment and contact forms. Separating them in Zoho reporting is not currently possible without reading the blob.
- **GA4 proxy** — `assessment_lead_submit_success`, or `generate_lead` filtered to `form_name = "Safety Visit Form"`. Prefer the latter.

### failed submissions 🟢 *(new)*
- **Definition** — submissions the customer made that did not become an enquiry.
- **Formula** — `count(form_error)`, by `error_category` ∈ {`validation`, `server`, `network`}.
- **Grain** — attempt. **Source** — GA4.
- **Limitations** — new, so there is no history before deployment. `validation` is largely customer-correctable noise; **`server` and `network` are the operational signal** and should be alerted on.
- **Why this matters** — before it existed, a Zoho outage (which fails the form outright on the `zoho_direct` path) was indistinguishable from a quiet day.

---

## Conversion rates

### enquiry → assessment conversion 🟡
- **Formula** — `assessment requests ÷ successful enquiries`.
- **Limitations** — inherits both numerator and denominator caveats; requires reading `intentCategory`.

### submission success rate 🟢 *(newly possible)*
- **Formula** — `count(generate_lead) ÷ count(form_submit)`, within one `form_name`.
- **Limitations** — **must be computed per `form_name`.** Computed across all forms it is meaningless, because checkout contributes `form_submit` but never `generate_lead`. With `form_error` now present, `form_submit ≈ generate_lead + form_error` per form, which makes the identity checkable — a useful instrumentation health test.

### commercial conversion 🟡
- **Formula** — `count(CommercialCase) ÷ count(distinct customers enquiring)`.
- **Grain** — customer. **Source** — Postgres ÷ Zoho. **Time basis** — mixed; choose and state one.
- **Limitations** — crosses two systems with no shared key available in one query. The denominator is the over-counting `new leads` today. Also note a `CommercialCase` is created **manually by staff**, so this rate measures a human process with its own latency, not a customer behaviour.

### order conversion 🟢
- **Formula** — `count(Order) ÷ count(CommercialCase)`.
- **Grain** — case. **Source** — Postgres (single system, 1:1 join). **Time basis** — `Order.createdAt`.
- **Limitations** — clean, because it never leaves Postgres. Shares the shared-database test-contamination risk.

---

## Commercial and money

### approved commercial value 🟢
- **Formula** — `sum(approvedAmountPaise)` where `CommercialRevision.status = 'APPROVED'`.
- **Grain** — case. **Source** — Postgres. **Time basis** — `approvedAt`.
- **Excludes** — `SUPERSEDED` revisions; package list prices; checkout `totalPayable`.
- **Limitations** — paise. Divide by 100 exactly once, and never float-average paise into rupees.

### orders 🟢
- **Formula** — `count(Order)`. **Time basis** — `createdAt`.
- **Excludes** — report `CANCELLED` separately rather than silently.

### payment requests 🟢
- **Formula** — `count(PaymentRequest)`, grouped by `status`.
- **Excludes** — for "currently outstanding", exclude `SUPERSEDED`, `CANCELLED`, `EXPIRED`, `ABANDONED`.
- **Limitations** — **a request is not revenue.** Keep it structurally separate from collections in every report.

### verified collections 🟢
- **Formula** — `sum(amountPaise)` where `recordType='COLLECTION'` AND `status='PAID'` AND `source != 'LEGACY'`, **minus** `sum(amountPaise)` where `recordType='REVERSAL'`.
- **Grain** — payment. **Source** — payment ledger, corroborated by `ProviderEvent`. **Time basis** — `collectedAt` else `createdAt`.
- **Excludes** — **`LEGACY` (mandatory)**; unreversed-but-pending; payment requests.
- **Limitations** — must be net of reversals. A gross `PAID` sum overstates revenue and is the most likely reporting error on this metric.

### outstanding amount 🟡
- **Formula** — `sum(approvedAmountPaise)` for live approved revisions **−** verified collections against those orders.
- **Limitations** — sensitive to which `PaymentRequest` statuses count as live, and to partial collections (supported: multiple collections against one approved balance). Define the status set explicitly in any report, because the plausible variants differ materially.

### average order value 🟡
- **Formula** — `sum(approvedAmountPaise) ÷ count(Order)` over the same cohort.
- **Limitations** — low volume at launch makes this unstable; one large case moves it. Report with n, or not at all.

### Standard vs Advanced mix 🟢
- **Formula** — `count(CommercialRevision)` grouped by `packageCode`, among `APPROVED`.
- **Limitations** — use the revision's `packageCode`, **not** the package the visitor browsed or selected on the website. Intent and agreement are different metrics; `select_package` answers the former.

---

## Attribution

### source/campaign → enquiry 🟡
- **Formula** — `count(distinct enquiryId)` grouped by Zoho `UTM_Source` / `UTM_Medium` / `UTM_Campaign`.
- **Source** — Zoho Lead discrete fields. **Time basis** — `receivedAt`.
- **Limitations** —
  - **First-touch, browser-session scoped.** `sessionStorage` dies with the tab, so a returning visitor is a new attribution session with no memory. There is no cross-session or cross-device attribution.
  - A **repeat enquiry does not update** the Lead's campaign — the Lead keeps its first one permanently.
  - `UTM_Term` reaches Zoho but **not** GA4 (a deliberate privacy trade — see `EVENT_TAXONOMY.md`).
  - **Unverified prerequisite:** `mason-api/docs/PROJECT_STATE.md` records that the `UTM_*` / `Gclid` / `Fbclid` fields *"were not visible on the layout (may be in 'Unused Items') — not yet confirmed present"*. **If they are not on the Leads layout, this metric is empty regardless of what the code sends.** Verify in Zoho before building anything on it.

### source/campaign → commercial case 🔴
- **Formula** — would require `CommercialCase` → Zoho Lead → `UTM_*`.
- **Limitations** — `CommercialCase` holds **no attribution column at all**. The join is possible in principle via `zohoLeadId`, impossible in practice without either denormalising attribution or building a warehouse. Both are founder decisions; neither was done.

### source/campaign → verified revenue 🔴
- **Formula** — as above, extended to the payment ledger.
- **Limitations** — same broken join. **This is the single highest-value missing capability** and the main reason a revenue-attribution dashboard cannot be built yet.

### landing page → enquiry 🟡
- **Formula** — `count(distinct enquiryId)` grouped by `attribution.landingPage`.
- **Limitations** — `landingPage` is **new** (added this cycle), so there is no history before deployment. It reaches Zoho only inside `Mason_Metadata_JSON`, which is not queryable and is the first field dropped if the blob overflows. GA4's `entry_page` covers sessions but cannot be joined to an enquiry.

### click id → enquiry 🟡
- **Formula** — join `gclid` / `fbclid` on `generate_lead` to the ad platform's click report.
- **Limitations** — newly possible (click ids were previously only on `page_location`). Inherits the `generate_lead` coverage gap, so checkout is absent. Google Ads and Meta are **not currently configured** on this project, so there is nothing to join to yet.

---

## Stage durations

### enquiry → commercial case duration 🟡
- **Formula** — `CommercialCase.createdAt − enquiry receivedAt`.
- **Limitations** — crosses systems; measures a manual staff step.

### case → order, order → payment request, request → collection 🟢
- **Formula** — difference of the respective timestamps.
- **Limitations** — all within Postgres, so these are the most reliable durations available. Low volume; use medians, not means.

### enquiry → installation 🔴
- **Limitations** — no installation timestamp is populated by any system.

---

## Metrics deliberately absent

| Not defined | Why |
|---|---|
| Any installation or technician metric | No field-service system is connected. |
| Any AMC or renewal metric | No AMC entity exists. |
| Lead response time | Mason never writes `Lead_Status` after `New`; first-contact time lives only in Zoho user activity. |
| Customer lifetime value | Requires repeat purchase, which requires repeat detection, which is off. |
| Cost per enquiry / ROAS | No ad spend source is connected, and Google Ads is not configured. |
| Bounce rate | GA4's definition is the inverse of its own `engaged_session`, which Mason does not use. Would contradict `engaged visitors` above. |
