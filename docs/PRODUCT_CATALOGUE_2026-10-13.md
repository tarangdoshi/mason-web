# Mason bathroom safety kit — founder approval, 13 October 2026

The founder approved **14 component types** for the comprehensive bathroom safety solution and the customer-facing line **“14 Components. One Comprehensive Bathroom Safety Solution.”** This records a product decision; published Sanity documents remain the public content source of truth. Standard and Advanced share the same physical kit. Standard remains ₹29,999 (reference ₹35,000); Advanced remains ₹36,999 (reference ₹44,000) with the existing 2-Year Safety AMC.

## Canonical terminology (founder-approved, 14 October 2026)

The names in the table below are the **exact** customer-facing component names. They supersede all earlier component terminology (for example "L / angled grab bar", "Flip-up / folding support bar", "Anti-slip surface treatment", "Shower seating stool", "Edge & corner protection", "Drainage support", "Bathroom slippers"). Preserve spelling, capitalisation and hyphenation exactly; do not reword them. Apply them to Sanity component labels, component image alt text, package and FAQ copy, and the web fallback catalogue.

- Stable keys and document IDs (`angled-grab-bar`, `packageFeature-<key>`, …) are internal identifiers and must not change.
- Descriptive prose that is not a component label (knowledge guides, solution-page option lists, photo descriptions) may describe items in ordinary language.
- Unreferenced legacy Sanity documents and historical scripts such as `scripts/migrate-prerna-content.ts` keep their original wording.

| Stable component key | Approved customer-facing name | Existing included quantity per package |
| --- | --- | ---: |
| `vertical-grab-bars` | Vertical grab bars | 3 |
| `angled-grab-bar` | L-shaped Shower grab bar | 1 |
| `folding-bar` | Flip-up Toilet support bar | 1 |
| `anti-slip-coating` | Nanotechnology anti-slip surface treatment | 1 |
| `anti-slip-mat-shower` | Shower anti-slip mat | 1 |
| `anti-slip-mat-post-shower` | Post-shower anti-slip mat | 1 |
| `raised-toilet-seat` | Raised Toilet Seat | 1 |
| `shower-stool` | Adjustable Shower seating stool | 1 |
| `two-way-lock` | Two-way lock | 1 |
| `corner-safety` | Soft Corner Guards | 1 |
| `drainage-solution` | Drainage clearance | 4 |
| `slippers-one` | EVA non-slip Bathroom slippers | 1 |
| `total-support-solution` | Reinforced fixture support | 1 |
| `emergency-key-box` | Emergency Key box | 1 |

The quantities above describe installed units, not component types. No existing type is removed. The founder confirmed one Emergency Key box per package. Its physical specification, placement, installation method and usage guidance were not supplied; do not infer these from its name. (Its image was approved on 14 October 2026; see Publication status.)

## Publication status — 14 October 2026

The CMS publication below has been applied. Published Sanity holds all 14 components; `package-package-standard` and `package-package-advanced` each strongly reference the same 14 keys in the approved order, with unchanged quantities and prices; the homepage heading and FAQ answers use the approved wording. The founder approved the existing cropped Sanity asset as the Emergency Key box image. Its technical specification, placement and installation method are **not** approved and must not be published or inferred. The `image.alt` text of the seven renamed components was corrected to the canonical names on the same date (alt-only change; images, crops, references, quantities and prices untouched).

## CMS publication packet — historical (applied 14 October 2026)

The published `package-package-standard` and `package-package-advanced` documents currently each reference the same 13 `packageFeature-<key>` documents. Their prices and other presentation fields are unchanged. A reviewed CMS publication should:

| Published document / field | Current value → approved value |
| --- | --- |
| `packageFeature-angled-grab-bar.label` | L / angled grab bar → L-shaped Shower grab bar |
| `packageFeature-folding-bar.label` | Flip-up / folding support bar → Flip-up Toilet support bar |
| `packageFeature-anti-slip-coating.label` | Anti-slip surface treatment → Nanotechnology anti-slip surface treatment |
| `packageFeature-shower-stool.label` | Shower seating stool → Adjustable Shower seating stool |
| `packageFeature-corner-safety.label` | Edge & corner protection → Soft Corner Guards |
| `packageFeature-drainage-solution.label` | Drainage support → Drainage clearance |
| `packageFeature-slippers-one.label` | Bathroom slippers → EVA non-slip Bathroom slippers |
| `packageFeature-emergency-key-box` | New document; key `emergency-key-box`, label `Emergency Key box`, quantity 1; photo pending |
| `package-package-standard.includedFeatures` | Existing 13 references → same 13 in approved display order plus new Emergency Key box reference |
| `package-package-advanced.includedFeatures` | Existing 13 references → same 13 in approved display order plus new Emergency Key box reference |
| `homepage.packagesSection.heading` | The same complete kit. You choose the cover. → 14 Components. One Comprehensive Bathroom Safety Solution. |
| `faqs.items` | Update “What does Mason Company do?”, Standard and Advanced inclusion answers only; preserve the other items |
| `homepage.faqSection.items` | Update corresponding legacy answers for consistency; the current public FAQ reads `faqs` |

The other six existing component names are already approved and need no label patch. Five unreferenced legacy component documents (`amc-recheck`, `anti-slip-mats`, `commode-support`, `sensor-lighting`, `slippers-two`) must remain untouched. The current kit has published uploaded images for 11 of 13 existing types; `anti-slip-coating` and `drainage-solution` currently use bundled fallbacks. There is no published Emergency Key box image.

1. Patch only the `label` field on the existing component documents whose name changed. Keep each document ID, key, quantity, description, image asset, crop, hotspot and any custom fields.
2. Create exactly one new `packageFeature` document for `emergency-key-box`, after checking that no published or draft document already has that key. Set only approved fields, including quantity 1; leave image and operational description unset until supplied.
3. Add a reference to that same new document to the `includedFeatures` array of **both** published package documents. Keep all 13 existing references and `_key`s, move the existing Raised Toilet Seat reference to position 7 to match the founder-approved display order, then put Emergency Key box at position 14. Preserve every other package field. Standard and Advanced must resolve to the same 14 keys.

   In draft Preview, the new component has no published counterpart, so each draft package uses a weak reference to it. Before publication, publish the component first, then change the package references to strong references and verify both packages again. Do not publish the draft packages while the references remain weak.
4. Update `homepage.packagesSection.heading`, the relevant `faqs.items` answers, and any corresponding legacy `homepage.faqSection.items` answers. The live public FAQ resolver reads the separate `faqs` document. Preserve unrelated FAQ items and custom fields by `_key`.
5. Verify both packages' prices, AMC wording, dynamic card/kit counts, public pages, and the approved image set before publication. Capture a backup of every document that will change. Do not run old broad migrations such as `migrate-prerna-content.ts` for this change.

No Sanity publication, database migration, or operational catalogue mutation is authorized by this packet. A web code Preview connected to the published Production dataset will still show the published 13-item kit until a reviewed CMS change is available to its draft/preview read path.

## Operational catalogue boundary

The separate `mason-api` Prisma `Package` and `PackageFeature` rows are operational records, not the website's Sanity package documents. `GOA-STANDARD` and `GOA-ADVANCED` are the active Goa offers in the migration on API `main`. Before changing active operational rows, inspect their current feature records and any orders that reference them. Add the new component only through a separately approved, non-retroactive catalogue operation; leave historical Orders and CommercialRevisions intact. The API schema does not contain a per-feature quantity field, so this document must not be treated as a database migration specification.
