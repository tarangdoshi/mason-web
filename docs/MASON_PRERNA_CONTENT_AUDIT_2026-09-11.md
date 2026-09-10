# Mason Prerna content audit

Date: 2026-09-11
Branch: `feature/prerna-frontend-integration`
Prerna source: [`prernaa-99/Mason-company-`](https://github.com/prernaa-99/Mason-company-) at commit `670a599399d022aaedda779b20fa63cf7e556497`
Rendered reference: [mason-company.vercel.app](https://mason-company.vercel.app/)

This audit compares the integrated Mason frontend with Prerna's implementation-level copy. Prerna is the public copy baseline. The only approved deviations are the founder's package kit and quantities, package prices, Advanced's one included first-year check-up, and keeping the public Risk Quiz launch module removed. Existing backend flows and CMS publishing remain in place.

## Content diff and ownership

| Area | Current integrated/CMS baseline before this correction | Prerna baseline | Action in this branch | Ownership after integration |
| --- | --- | --- | --- | --- |
| Hero | Legacy assessment-first headline, subcopy and `Book Package` CTA | `Most falls happen here. We make sure yours don't.`; `You can't always be there - safety can. Premium, doctor-informed, expertly-installed bathroom safety.`; `Book a Safety Visit`; `See Transformations` | Restored in the fallback and migration plan. Hero accent rendering is preserved in `Hero.tsx`. | Sanity `homepage.hero`, with the checked-in content as fallback. |
| Evidence snapshot | Legacy cards included `₹3L–₹10L` and `26–38%` as the fourth card | `25%`, `81%`, `66%` and `Up to 38%`, with Prerna's evidence labels and source framing | Restored the four cards. Added the additive `prefix` field so `Up to 38%` is CMS-editable without hard-coding presentation. | Sanity `homepage.evidenceSection.cards`, with fallback content. |
| What we do / safer section | CMS description carried older assessment and refund framing | `Leave your details and a Mason advisor will call to arrange the visit. Full refund any time before installation.` | Restored the fallback and included the exact description in the read-only migration plan. Retained Mason's existing callback/lead form. | Sanity `homepage.whatWeDoSection.description`, with checked-in fallback content. |
| Transformations | CMS title/subtitle said `See what changes in one visit` and used older supporting text | `A reassurance. Not a renovation.` and `We make bathrooms safer through thoughtful additions - grip, balance, comfort, ease. Drag to see the difference.` | Restored in the migration plan; existing fallback gallery remains compatible with Prerna's presentation. | Sanity `homepage.transformationGallerySection`, with fallback content. |
| Package introduction | Package section was present but used the older CMS title/description | `The same complete kit. You choose the cover.`; `Both packages install everything, fitted by Mason-trained experts. Advanced simply keeps looking after it for a year.` | Restored the source heading and the first source sentence; the second sentence uses the founder-approved one-visit wording. The shared-kit rule and package facts remain explicit. | Sanity `homepage.packagesSection`, with fallback content. |
| Standard card | Older generic badge, outcome and assessment CTA | `The complete kit`; source best-for/outcome; `Book Standard`; Standard is the promoted card in Prerna | Restored in fallback and migration plan. | Sanity package document plus checked-in fallback. |
| Advanced card | Older generic maintenance wording | Prerna's second card, adapted only for the approved one-visit definition | Uses `The complete kit + 1-Year Safety Check-Up Included`; one technician visit within the first year; necessary corrective work/additional support found during that visit is covered. No unlimited maintenance promise. | Sanity package document plus checked-in fallback. |
| Process | Assessment-first and legacy payment framing | `From booking to a safer bathroom.`; `Six clear steps, handled by one accountable Mason team - from package booking all the way to final handover.`; the six source steps | Restored the source heading, subtitle and steps. Checkout, payment-link and callback infrastructure are unchanged; only the public copy is aligned to the latest founder direction. | Sanity `homepage.processSection`, with fallback content. |
| Why Mason | Dynamic cards all displayed the generic `Mason approach` tag and several descriptions had drifted | Prerna's six descriptions and tags: `The whole routine`, `Medically shaped`, `Skilled hands`, `Owned end to end`, `Still feels like home`, `Grounded in evidence` | Restored source descriptions and use the CMS item tag by position instead of replacing it with a generic label. | Sanity `homepage.whySection.items`, with fallback content. |
| FAQ | CMS had ten legacy items, an older section heading and assessment-first booking/payment answers | `Questions, answered`; Prerna's thirteen-question set | Restored the source heading/subtitle, added the three source questions and restored booking/payment answers. Package answers are intentionally adapted to the founder-approved kit, prices and one-visit follow-up. | Sanity `homepage.faqSection`, with locked package answers and editor-owned non-package answers preserved by `lib/site-content.ts`. |
| Testimonials | Current records used Delhi, Gurgaon and Mumbai cities | Prerna records use Bengaluru, Goa and Bengaluru | Restored the source cities in fallback content and migration plan. Names, roles, quotes and tags remain the source records; no testimonials were invented. | Sanity testimonial documents, with checked-in fallback. |
| Booking/final CTA | Legacy refund chip and assessment-first final CTA | `Book the visit. We'll handle the rest.`; `Act before a fall changes everything. Leave your number and one accountable Mason team handles the rest.`; `Request a Callback`; `Full refund before installation` | Restored source presentation copy while retaining the existing lead form, attribution and CRM request. | Component/fallback plus Sanity `homepage.finalCtaSection` for the final CTA. |
| About, Why, Contact, navigation and footer | No meaningful public copy drift found against Prerna | Prerna source copy and structure | No content rewrite required. Contact form wiring remains the Mason implementation. | Existing components/CMS where applicable. |
| Risk Quiz | The obsolete homepage module had been removed in the prior accepted correction | Not present in Prerna's approved launch frontend | Remains removed from the public launch page and public CTA/anchor. Historical quiz components, routes, session code, data models and tests remain untouched. | Historical/reusable functionality only; no launch exposure. |

## Founder-approved deviations retained

1. **Shared installation kit:** Standard and Advanced both contain the exact approved quantities: three vertical grab bars; one L/angled grab bar; one flip-up/folding support bar; one anti-slip treatment/coating; one shower anti-slip mat; one post-shower anti-slip mat; one shower seating stool; one two-way lock; one Edge & Corner Protection treatment; four drainage solutions; one pair of bathroom slippers; and one Reinforced Fixture Support upgrade. Sensor lighting, Fall Alert/SOS hardware and toilet-seat/raised-seat/commode support remain excluded.
2. **Customer-facing names:** `Reinforced Fixture Support` describes the higher-strength toilet and washbasin fixings; `Edge & Corner Protection` describes cushioning/protective tape for sharp edges. The site does not use the ambiguous operational labels `Total Support Solution` or `Corner Safety Solution`.
3. **Prices:** Standard is ₹30,000 with a ₹35,000 struck-through reference price. Advanced is ₹37,000 with a ₹44,000 struck-through reference price. The package schema has separate `referencePrice` and `currentPrice` fields; no urgency, expiry or discount claims are added.
4. **Advanced follow-up:** Advanced includes one technician safety check-up visit during the first year after installation. Mason inspects the completed work, checks for flaws or additional support needs, and covers necessary corrective work or additional support identified during that included visit. This is not unlimited maintenance, unlimited call-outs or perpetual AMC coverage.
5. **Risk Quiz:** The public launch module remains removed. Underlying quiz functionality is preserved.

## CMS mapping and safe migration

Sanity remains the publishing source of truth. The existing schemas and queries were extended only additively: `evidenceSection.cards[].prefix` is now available for the `Up to 38%` presentation. No published document was overwritten and no schema migration was run in this task.

The migration plan is [scripts/migrate-prerna-content.ts](../scripts/migrate-prerna-content.ts). It resolves the package feature references from the two existing package documents, verifies the exact approved 12-item set and document types, prints document ID/field path/current/proposed values, and exits without writes by default. It uses leaf paths, preserves unknown fields, and reports deliberate array replacements. `--apply` is explicit, requires `SANITY_API_WRITE_TOKEN` and `--backup-dir`, writes and verifies a timestamped export first, then commits only changed fields. Draft IDs, missing documents, mismatched package references, unknown feature keys and incompatible array shapes fail closed. The former `migrate-package-catalog.ts` is retired so its create-if-missing/reference-replacement behavior cannot be used accidentally.

Dry-run command:

```bash
pnpm exec tsx scripts/migrate-prerna-content.ts --dry-run
# after founder review and an external backup:
pnpm exec tsx scripts/migrate-prerna-content.ts --apply --backup-dir /tmp/mason-sanity-backup
```

No Sanity read or write command completed in this environment because the configured Sanity endpoint was unreachable. Existing published content is therefore unchanged; the apply command remains gated for founder review and a verified backup.

## Functional and legal preservation

The content changes do not alter the assessment API, ENQUIRY creation, attribution/UTM capture, Google Places/manual-address fallback, silent GOA/BANGALORE/OTHER/UNKNOWN classification, CRM/Zoho integration, checkout, refund/cancellation implementation, legal pages, accessibility behavior or responsive layout. Existing legal wording is not expanded into new promises. The public process/payment copy is restored to Prerna's approved presentation wording; the actual payment and callback paths remain the existing Mason implementation.

## Verification status

The branch is ready for local checks after the final edits. The required lint, TypeScript, web tests, production build and `git diff --check` are run as part of this change. No new Vercel deployment was made during this correction, so there is no fresh Preview URL to report yet. The existing Preview remains the visual reference; its Sanity-rendered copy will reflect the restored baseline only after the separately gated CMS migration. Production was not changed and PR #1 was not merged.
