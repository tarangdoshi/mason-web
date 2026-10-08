# Mason analytics documentation

The canonical reference for what Mason measures, what each number means, and which system is right when two disagree.

Written 8 October 2026 against the live Production commits `mason-web df11772` and `mason-api 024b31b`.

## Read in this order

| | Page | Answers |
|---|---|---|
| 1 | **[DEFINITIONS.md](DEFINITIONS.md)** | What is a visitor, an enquiry, a lead, a repeat enquiry, a verified collection? What identifies each, and does it exist yet? Includes the identifier and join model. |
| 2 | **[SOURCE_OF_TRUTH.md](SOURCE_OF_TRUTH.md)** | When GA4 and Zoho disagree, which is right? Precedence per domain. |
| 3 | **[METRIC_DICTIONARY.md](METRIC_DICTIONARY.md)** | How is each metric computed, and how far can it be trusted today? |
| 4 | **[EVENT_TAXONOMY.md](EVENT_TAXONOMY.md)** | Which events may be emitted, with what parameters, and which are deprecated. |
| 5 | **[DATA_QUALITY.md](DATA_QUALITY.md)** | What is wrong with the data, ranked, plus verified environment scopes. |

## The three things to know before reading anything else

**1. These are not the same thing.** *enquiry* · *Zoho Lead* · *Postgres `LeadRecord`* · *form submission* · *`generate_lead` event* · *repeat enquiry*. They were being used interchangeably. `DEFINITIONS.md` separates them.

**2. One successful enquiry = one durable enquiry id.** That id is `enquiryId`, returned by both public lead endpoints. The Zoho Lead id is *not* an enquiry id — a repeat customer shares it across enquiries. Count `enquiryId`; join on `lead_id`.

**3. No dashboard yet.** Two blockers, both named in `DATA_QUALITY.md`: Preview deployments report into the production GA4 property, and campaign cannot be joined to revenue because `CommercialCase` carries no attribution. Build the definitions first.

## Scope of these documents

They describe **what is**, not what should be. Where something cannot be measured, that is stated rather than estimated. Where a limitation is a deliberate trade — Mason has a few, and they are good ones — the reasoning is recorded so it is not undone by accident later.

Two in particular:

- `utm_term` reaches Zoho but **not** GA4, because admitting multi-word campaign values would also admit street addresses. See `EVENT_TAXONOMY.md`.
- `generate_lead` does not fire on checkout, because `docs/DECISIONS.md` makes the assessment the primary conversion. See `EVENT_TAXONOMY.md`.

## Keeping them current

Change the code and this documentation in the same commit. A metric definition that drifts from the implementation is worse than no definition, because it is trusted.
