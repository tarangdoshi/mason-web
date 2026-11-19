# Mason analytics — canonical definitions

> Status: first canonical version, 8 October 2026. Derived from code at `mason-web` `df11772` and `mason-api` `024b31b`, both of which were the live Production commits at the time of writing.
>
> This document defines **what a thing is**. `SOURCE_OF_TRUTH.md` defines **which system is right when two disagree**. `METRIC_DICTIONARY.md` defines **how it is counted**. `EVENT_TAXONOMY.md` defines **which events may be emitted**.

## Why this exists

These six things are currently used interchangeably and are not equivalent:

enquiry · Zoho Lead · Postgres `LeadRecord` · form submission · `generate_lead` event · repeat enquiry

Until each has one meaning, every number built on them is ambiguous rather than wrong — which is harder to notice and harder to fix. No dashboard should be built before this page is agreed.

## The rule that drives everything else

**One successful customer enquiry = one durable enquiry id.**

This holds regardless of whether the enquiry creates a new Zoho Lead, matches an existing one, or arrives from any entry point. It is satisfied today by `enquiryId`, returned by both public lead endpoints (see **Successful enquiry** below). It is *not* satisfied by the Zoho Lead id, which a repeat customer shares across enquiries.

---

## Stage definitions

### VISITOR

| | |
|---|---|
| **Business meaning** | A person who loaded a Mason page at least once. |
| **Grain** | One browser, scoped to a GA4 session. |
| **Canonical identifier** | GA4 `client_id`. |
| **Source of truth** | GA4. |
| **Entry condition** | A `page_view` event is accepted. |
| **Timestamp** | GA4 event timestamp. |
| **Relationship to adjacent** | Precedes everything. Cannot be joined to any Mason record. |
| **Duplicate semantics** | A cleared cookie, a second device or a second browser is a second visitor. There is no person-level identity. |
| **Test/UAT treatment** | **Not separable.** Preview deployments report into the same GA4 property (see [DATA_QUALITY.md](DATA_QUALITY.md)). Internal and staff traffic is not excluded. |
| **Measurable today** | Yes, with a known upward bias from internal and Preview traffic, and a downward bias from ad blockers. |

### ENGAGED VISITOR

| | |
|---|---|
| **Business meaning** | A visitor who did something beyond landing — read a service or package, clicked a CTA, or began a form. |
| **Grain** | One GA4 session. |
| **Canonical identifier** | GA4 `session_id`. |
| **Source of truth** | GA4. |
| **Entry condition** | The session contains at least one of `view_service`, `view_package`, `select_package`, `homepage_cta_click`, `package_cta_click`, `phone_click`, `whatsapp_click`, `form_start`. |
| **Timestamp** | First qualifying event. |
| **Relationship to adjacent** | Subset of VISITOR; superset of FORM START. |
| **Duplicate semantics** | Once per session, however many qualifying events occur. |
| **Test/UAT treatment** | As VISITOR. |
| **Measurable today** | Yes, but as a **derived** definition — Mason does not use GA4's own `engaged_session`, whose 10-second/2-pageview rule means something different. Pick one and never mix them in a report. |

### FORM START

| | |
|---|---|
| **Business meaning** | A visitor began entering details into a lead form. |
| **Grain** | One mounted form instance. |
| **Canonical identifier** | None. Behavioural only. |
| **Source of truth** | GA4 `form_start`, with `form_name`. |
| **Entry condition** | First focus or change on a form **field** — buttons do not count (`isFormFieldEvent`). |
| **Timestamp** | GA4 event timestamp. |
| **Relationship to adjacent** | Precedes SUBMISSION ATTEMPT. |
| **Duplicate semantics** | **Once per form instance**, latched. Remounting the component (navigating away and back) starts a new instance and can report a second `form_start` for the same person. |
| **Test/UAT treatment** | As VISITOR. |
| **Measurable today** | Yes, for the three live forms. |

### SUBMISSION ATTEMPT

| | |
|---|---|
| **Business meaning** | A visitor tried to submit a lead form. Intent, not success. |
| **Grain** | One attempt. |
| **Canonical identifier** | None. |
| **Source of truth** | GA4 `form_submit`. |
| **Entry condition** | A submit event, **or** a submit-button click that native validation blocked (`createSubmitAttemptTracker`) — deliberately, so an attempt stopped by a client-side error still counts as intent. |
| **Timestamp** | GA4 event timestamp. |
| **Relationship to adjacent** | Follows FORM START; resolves to exactly one of SUCCESSFUL ENQUIRY or a `form_error`. |
| **Duplicate semantics** | **Every attempt counts.** Not latched. A person who fails validation three times then succeeds produces four attempts and one enquiry — this is correct and intended. |
| **Test/UAT treatment** | As VISITOR. |
| **Measurable today** | Yes. |

### SUCCESSFUL ENQUIRY

> The most important definition on this page, and the one most often got wrong.

| | |
|---|---|
| **Business meaning** | A customer asked Mason for something and Mason accepted it. |
| **Grain** | One accepted submission. |
| **Canonical identifier** | **`enquiryId`** — returned as `data.enquiryId` by both public lead endpoints. A server-generated uuid, minted per accepted submission. |
| **Source of truth** | The **server-side accepted operational record**, never GA4. For the guidance path, the Zoho Lead or its enquiry Note; for checkout, the `LeadRecord` row. |
| **Entry condition** | The API returned `201`. On the `zoho_direct` path that means Zoho confirmed the Lead (created or matched); on checkout it means the row committed. |
| **Timestamp** | `receivedAt` server-side (`data.createdAt` in the response). Not the GA4 event time, which is the browser's clock. |
| **Relationship to adjacent** | Exactly one SUBMISSION ATTEMPT resolves into it. Belongs to exactly one NEW LEAD **or** one REPEAT ENQUIRY. |
| **Duplicate semantics** | An identical resubmission inside the 10-minute replay window returns the **same** `enquiryId` — one enquiry, not two. A genuinely new submission is always a new enquiry even if it matches an existing Lead. |
| **Test/UAT treatment** | Not separably marked. Preview cannot reach the API (`NEXT_PUBLIC_API_URL` is unscoped on Preview, so the proxy fails closed), so website-originated test enquiries are unlikely — but a direct call to the API host would be indistinguishable from a real one. |
| **Measurable today** | **Server-side: yes.** In GA4: **partially** — `generate_lead` covers the assessment and contact forms only. See `METRIC_DICTIONARY.md`. |

**A successful enquiry is NOT:**

- a newly created Zoho Lead — a repeat customer's enquiry reuses their existing Lead;
- a `generate_lead` event — that is a browser signal, lossy to ad blockers, and does not cover every entry point;
- a `form_submit` — that is an attempt;
- identified by `lead_id` — that is the CRM record, shared across a customer's enquiries.

### NEW LEAD

| | |
|---|---|
| **Business meaning** | A customer Mason had no record of before. |
| **Grain** | One customer. |
| **Canonical identifier** | Zoho Lead id (guidance path) or `LeadRecord.id` (checkout). |
| **Source of truth** | Zoho CRM. |
| **Entry condition** | A SUCCESSFUL ENQUIRY whose capture returned `kind: "NEW"` — no confident phone match existed. |
| **Timestamp** | Zoho `Created_Time`. |
| **Relationship to adjacent** | One NEW LEAD has exactly one first enquiry and zero or more later REPEAT ENQUIRYs. |
| **Duplicate semantics** | **Currently over-counts.** `PUBLIC_LEAD_MATCHING_ENABLED` is **not set in Production**, so match-before-create is off and every submission creates a Lead. Two enquiries from one customer are therefore two "new leads" today. |
| **Test/UAT treatment** | As SUCCESSFUL ENQUIRY. |
| **Measurable today** | **Partially.** Countable, but the count is "Leads created", not "distinct customers", until matching is enabled. |

### REPEAT ENQUIRY

| | |
|---|---|
| **Business meaning** | A later enquiry from a customer Mason already knows. |
| **Grain** | One accepted submission. |
| **Canonical identifier** | Its own `enquiryId`; the shared customer is the Zoho Lead id. |
| **Source of truth** | Zoho CRM — the enquiry **Note** on the matched Lead (`Mason enquiry ref: <enquiryId>`). |
| **Entry condition** | Capture returned `kind: "REPEAT"`: exactly one Lead matched by phone and no Contact. |
| **Timestamp** | `receivedAt`; the Note title also carries an IST label. |
| **Relationship to adjacent** | Belongs to an existing NEW LEAD. Does **not** create a Lead and does **not** change its `Lead_Source`, so the customer keeps their original origin. |
| **Duplicate semantics** | Each repeat enquiry is distinct. Its attribution does **not** overwrite the Lead's — the Lead permanently keeps its first campaign. |
| **Test/UAT treatment** | As SUCCESSFUL ENQUIRY. |
| **Measurable today** | **No.** Two reasons: matching is off in Production, so repeats are not detected; and when it is on, the record is Note free text, which is not queryable or reportable. See `FOUNDER_DECISIONS` in the report. |

### ASSESSMENT REQUEST

| | |
|---|---|
| **Business meaning** | A customer asked for the free bathroom-safety visit. Mason's primary conversion. |
| **Grain** | One accepted submission. |
| **Canonical identifier** | `enquiryId`. |
| **Source of truth** | Zoho CRM. |
| **Entry condition** | A SUCCESSFUL ENQUIRY with `metadata.intentCategory === "assessment"`. |
| **Timestamp** | `receivedAt`. |
| **Relationship to adjacent** | A subset of SUCCESSFUL ENQUIRY. Also the only intent that triggers a customer acknowledgement email. |
| **Duplicate semantics** | As SUCCESSFUL ENQUIRY. |
| **Test/UAT treatment** | As SUCCESSFUL ENQUIRY. |
| **Measurable today** | **Server-side yes** (`intentCategory`). In Zoho, **only via `Mason_Metadata_JSON`** — `Lead_Source` is `"Website - Guidance Form"` for the assessment *and* contact forms, so it cannot tell them apart. |

### COMMERCIAL CASE

| | |
|---|---|
| **Business meaning** | Mason decided to quote this customer. The first commercial commitment. |
| **Grain** | One customer engagement. |
| **Canonical identifier** | `CommercialCase.id` (uuid). |
| **Source of truth** | Neon Postgres. |
| **Entry condition** | **A staff member created it.** `createdByStaffId` is required and the schema states it is *"created only at the commercial stage, never by public lead capture"*. |
| **Timestamp** | `createdAt`; separately `locationVerifiedAt`. |
| **Relationship to adjacent** | Links back by `zohoLeadId` **XOR** `leadRecordId` (a DB CHECK enforces exactly one; `origin` records which). Forward: zero or more `CommercialRevision`, at most one `Order`. |
| **Duplicate semantics** | Both link columns are unique, so one lead yields at most one case. |
| **Test/UAT treatment** | **Unprotected.** Production and Preview-with-overrides share one Neon database; test cases would sit in the same table as real ones with nothing to distinguish them. |
| **Measurable today** | Yes as a count. **Not attributable** — the table holds no campaign, click id, referrer or landing page. |

### APPROVED COMMERCIAL REVISION

| | |
|---|---|
| **Business meaning** | The agreed scope and price. The authoritative commercial number. |
| **Grain** | One approved version of one case. |
| **Canonical identifier** | `CommercialRevision.id`; business key `(commercialCaseId, revisionNumber)`. |
| **Source of truth** | Neon Postgres. |
| **Entry condition** | `status === "APPROVED"`. A SQL partial unique index permits only one approved revision per case. |
| **Timestamp** | `approvedAt`. |
| **Relationship to adjacent** | Belongs to a COMMERCIAL CASE. Superseded revisions become `SUPERSEDED` and must be excluded from value totals. |
| **Duplicate semantics** | Exactly one live approved revision per case, enforced in SQL. |
| **Test/UAT treatment** | As COMMERCIAL CASE. |
| **Measurable today** | Yes. `approvedAmountPaise` is the only trustworthy commercial value — **never** a package list price. |

### ORDER

| | |
|---|---|
| **Business meaning** | Confirmed work Mason intends to deliver. |
| **Grain** | One job. |
| **Canonical identifier** | `Order.id`; human key `orderNumber` (unique). |
| **Source of truth** | Neon Postgres. |
| **Entry condition** | Row exists. `status` tracks lifecycle (`PLACED` → … → `COMPLETED` / `CANCELLED`). |
| **Timestamp** | `createdAt`; `checkinOtpVerifiedAt`, `completionOtpVerifiedAt` where populated. |
| **Relationship to adjacent** | 1:1 with COMMERCIAL CASE (`commercialCaseId` unique); points at the live revision via `currentRevisionId`. |
| **Duplicate semantics** | One order per case. |
| **Test/UAT treatment** | As COMMERCIAL CASE. |
| **Measurable today** | Yes. |

### PAYMENT REQUEST

| | |
|---|---|
| **Business meaning** | Mason asked the customer to pay — normally a Razorpay link. **Not** money received. |
| **Grain** | One request. |
| **Canonical identifier** | `PaymentRequest.id`; `referenceId` and `providerLinkId` unique. |
| **Source of truth** | Neon Postgres, reconciled against Razorpay. |
| **Entry condition** | Row exists. `status` spans `PREPARING`, `ACTIVE`, `PAID`, `CANCELLED`, `EXPIRED`, `SUPERSEDED`, `CANCEL_PENDING`, `EXCEPTION`, `ABANDONED`. |
| **Timestamp** | `createdAt`; `expiresAt`, `cancelledAt`. |
| **Relationship to adjacent** | Belongs to an ORDER and an approved revision. A SQL partial unique index permits one live request per order. |
| **Duplicate semantics** | Superseded and abandoned requests exist by design and must be excluded from "requests outstanding". |
| **Test/UAT treatment** | **Highest risk.** Razorpay is live in Production. Never generate a payment request to test measurement. |
| **Measurable today** | Yes. |

### VERIFIED COLLECTION

| | |
|---|---|
| **Business meaning** | Money Mason actually received, with provenance. |
| **Grain** | One payment record. |
| **Canonical identifier** | `Payment.id`; `providerPaymentId` and `idempotencyKey` unique. |
| **Source of truth** | The payment ledger, corroborated by `ProviderEvent` for Razorpay. |
| **Entry condition** | `recordType === "COLLECTION"`, `status === "PAID"`, **and `source !== "LEGACY"`**. |
| **Timestamp** | `collectedAt` where present, else `createdAt`. |
| **Relationship to adjacent** | Belongs to an ORDER and usually a PAYMENT REQUEST. |
| **Duplicate semantics** | Append-only, guarded by DB triggers; `providerPaymentId` unique prevents double-recording. |
| **Test/UAT treatment** | As PAYMENT REQUEST. |
| **Measurable today** | Yes — **provided `LEGACY` is excluded**. The enum comment is explicit: pre-V1 rows have no verified provenance and *"never count as V1 money received"*. |

### REVERSAL / REFUND

| | |
|---|---|
| **Business meaning** | Money given back or a collection cancelled out. |
| **Grain** | One reversal record. |
| **Canonical identifier** | `Payment.id` with `recordType === "REVERSAL"`. |
| **Source of truth** | Payment ledger. |
| **Entry condition** | A `REVERSAL` row, linked by `reversesPaymentId` (unique). |
| **Timestamp** | `createdAt`. |
| **Relationship to adjacent** | Points at the collection it reverses. |
| **Duplicate semantics** | One reversal per collection (`reversesPaymentId` unique). |
| **Test/UAT treatment** | As PAYMENT REQUEST. |
| **Measurable today** | Yes. **Net collected must subtract reversals** — a gross sum of `PAID` collections overstates revenue. |

### INSTALLATION

| | |
|---|---|
| **Business meaning** | The work happened at the customer's home. |
| **Grain** | One visit. |
| **Canonical identifier** | None. |
| **Source of truth** | **None — no system is connected.** |
| **Entry condition** | Undefined. |
| **Timestamp** | `Order.completionOtpVerifiedAt` exists as a column but nothing populates it from a field-service system. |
| **Relationship to adjacent** | Would follow ORDER. |
| **Duplicate semantics** | n/a |
| **Test/UAT treatment** | n/a |
| **Measurable today** | **No.** `Order.status` has `ASSIGNED` / `TECH_EN_ROUTE` / `IN_PROGRESS` / `COMPLETED` and Zoho FSM is referenced nowhere in either repository. The model anticipates field service; nothing feeds it. |

### AMC / POST-INSTALLATION

| | |
|---|---|
| **Business meaning** | Ongoing maintenance cover after installation. |
| **Grain** | Undefined. |
| **Canonical identifier** | None. |
| **Source of truth** | **None.** |
| **Entry condition** | Undefined. |
| **Timestamp** | n/a |
| **Relationship to adjacent** | Would follow INSTALLATION. |
| **Duplicate semantics** | n/a |
| **Test/UAT treatment** | n/a |
| **Measurable today** | **No.** `amcSelected` is captured on the checkout payload and the Advanced package mentions annual visits in copy, but there is no AMC entity, no renewal date and no lifecycle. Lifecycle message *copy* exists at `content/communications/` and is wired to no sender. |

---

## Identifier and join model

```
GA4 session ──(no join key)── ✗ ── Mason records
   │
   │  generate_lead carries enquiry_id and lead_id, so a GA4 event can be
   │  matched to a specific enquiry — but only for the entry points that
   │  emit it, and only when the browser event arrived at all.
   ▼
SUCCESSFUL ENQUIRY ── enquiryId ──┐
                                  ├─ guidance path → Zoho Lead.Mason_Lead_Id (new)
                                  │                  or enquiry Note text (repeat)
                                  └─ checkout path → LeadRecord.id
   │
   ▼
Zoho Lead id  /  LeadRecord.id
   │
   │  CommercialCase.zohoLeadId XOR CommercialCase.leadRecordId   (DB CHECK)
   ▼
CommercialCase.id
   │  ← attribution chain ENDS HERE: no campaign column exists
   ▼
CommercialRevision (commercialCaseId, revisionNumber) ── status APPROVED
   ▼
Order.id  (commercialCaseId unique → 1:1)
   ▼
PaymentRequest.id ── referenceId / providerLinkId
   ▼
Payment.id ── providerPaymentId ── ProviderEvent.eventId
   ▼
✗ INSTALLATION — no system
```

**The one broken join.** Campaign → revenue requires `CommercialCase.zohoLeadId` → Zoho Lead → read `UTM_*` / `Gclid`. That crosses a system boundary, exists in no warehouse, and cannot be done inside GA4 at all. Options are set out in the report under founder decisions; nothing was changed.

**Mason's own `sessionId`** (`mason-crm-session-id`) reaches the API and Zoho's metadata blob but is deliberately **never sent to GA4**, so there is no deterministic GA4↔CRM session join. Adding one would mean putting a Mason identifier into analytics and is not proposed here.
