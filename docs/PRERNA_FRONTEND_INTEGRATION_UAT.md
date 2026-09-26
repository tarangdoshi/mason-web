# Prerna frontend integration — UAT checklist

Source: Mason UAT Google Doc `1BrkpoOgIvuNeWzX-h-nUudoLBFhAE57gS8nvDdffWQw`, including its embedded screenshots and phone-number note, checked against Prerna's current `main` at `626712d062a511d5a0c2990f1bb1628a76546196`. Base: canonical `main` at `230884975bf9147b9c807cb03dcbedda18106da0`.

`Verified` means inspected in the local production build or confirmed in code/tests. All visual details still require founder approval on the Vercel Preview. No form was submitted during visual testing.

| Requirement | Implemented | Verified | Notes |
| --- | --- | --- | --- |
| Home desktop: optimize assessment form layout | Yes | Local desktop and tablet visual | Full-width name, paired mobile/email at wider widths, location below; canonical form behavior retained. |
| Home desktop: prevent large-monitor section cropping | Yes | Local 1920×1080 visual and element bounds | Why Mason uses content-driven height and visible overflow. |
| Home desktop: update plan-card UI | Yes | Local desktop visual/code | Prerna's price order, emphasis, card treatment and Standard badge are applied around CMS plans. |
| Home desktop: Learn More links to Packages | Yes | Code/route | Links resolve to `/packages`; `view_package` tracking remains. |
| Home desktop: update CTA text | Yes | Local visual/code | Visit CTAs and free-visit copy follow the approved reference; package-selection tracking remains. |
| Home desktop: remove process-section animations | Yes | Code | Three-step process uses the current Prerna layout without the old step reveal animation. |
| Doctor cards: name, qualifications, experience | Yes | Code | Corrected canonical CMS field mapping; Prerna photo fallback added without bypassing CMS images. |
| Testimonial cards: updated presentation, no green tags, Goa | Yes | Local visual/code | CMS quotes/authors retained; visible city labels are Goa. |
| FAQ: heading sticky while questions scroll | APPROVED | Founder Preview #1 | Founder confirmed the **left heading** stays sticky and right Q&A scrolls normally. The older UAT right-side wording is superseded. |
| Home mobile: assessment heading → form → image | Yes | Local 390×844 visual | Source and visual order match; canonical lead form retained. |
| Home mobile: headings left-aligned | Yes | Local mobile visual | Updated assessment heading treatment. |
| Home mobile: reduced heading/subheading spacing | Yes | Local mobile visual | Assessment and transformation spacing tightened. |
| Transformation: heading/subheading spacing | Yes | Local mobile visual/code | Tightened. |
| Transformation: overall section spacing | Yes | Local mobile visual/code | Tightened. |
| Transformation: remove text from images | Yes | Code/visual | Captions are screen-reader-only; existing image/slider behavior remains. |
| Advanced: two-year AMC / safety check-up | Yes | Code/tests/local content | Updated package rows, cards, FAQ and comparison copy; CMS display mapping follows the founder decision. |
| About desktop: heading sticky only within its section | Yes | Code/local visual | Existing section-bounded sticky treatment preserved. |
| About desktop: reduce section-to-image spacing | Yes | Code/local visual | Gap reduced. |
| About mobile: halve heading/body spacing | Yes | Code/local visual | Prerna's mobile spacing carried over. |
| About mobile: reduce paragraph spacing by about 70% | Yes | Code/local visual | Prerna's mobile spacing carried over. |
| About mobile: halve CTA/image spacing | Yes | Code/local visual | Prerna's mobile spacing carried over. |
| Header desktop: active page visibly bold | Yes | Code/local visual | Path-based active state added; mobile focus behavior retained. |
| Footer: Why Mason points to home section | Yes | Code/route | Footer link is `/#why-mason`; no standalone destination in footer. |
| Contact: updated desktop/mobile form presentation | Yes | Local desktop/mobile visual | Canonical shared Places picker, phone, validation, API errors, submission and no Package field retained. |
| Privacy Policy: current Prerna content, 91 Ventures LLP | Yes | Local visual/code | Current Prerna text and legal layout ported; rendered placeholder grievance contacts removed. |
| Terms: current Prerna content, 91 Ventures LLP | Yes | Local visual/code | Current Prerna text and legal layout ported without adding provisions. |
| Packages page: updated text | Yes | Founder Preview #1 product decision | Canonical kit now has 13 component categories, including Raised Toilet Seat without an assumed quantity. Existing component names remain unchanged. |
| Package-card presentation on Packages page | Yes | Local visual/code | Shared card component matches the homepage presentation. |
| Form footer: “T&C apply” | Yes | Local visual/code | Applied to assessment, contact, guidance and checkout lead forms using the Terms link. |
| Goa-only launch copy | Yes | Local visual/code/tests | Visible launch, location, footer and SEO copy updated; backend market classification untouched. |
| Legal entity: 91 Ventures LLP | Yes | Local visual/code | Shared legal constants used in Privacy and Terms. |
| Founder number: 8149433383 across frontend channels | Yes for frontend | Local visual/code | Shared displayed phone, `tel:` and WhatsApp links updated. Backend notification templates and external channel configuration remain outside this frontend task. |
| Submission success must acknowledge request, not imply appointment confirmation | Yes | Code | Assessment success says the visit request was received and Mason will contact the customer; no appointment is claimed. |
| Preserve current lead/location/attribution/analytics behavior | Yes | Tests/code | Canonical form components and handlers retained; only layout/copy changed. No Preview or local form submission was made. |

## Preview review

Review at mobile, tablet, standard desktop and large desktop, especially the large-screen Why Mason crop fix, FAQ sticky behavior, About sticky stop point, mobile form order/spacing, package cards and kit text, Contact form presentation, and legal copy. Do not submit a form on Preview because that environment may reach live lead infrastructure.

## Founder Preview corrections #1 — approved product source of truth

| Decision | Current branch value |
| --- | --- |
| Launch | Goa only |
| Packages | Standard and Advanced |
| Current selling prices | Standard ₹29,999; Advanced ₹36,999 |
| Advanced cover | Two-year AMC / safety check-up |
| Shared kit | 13 component categories; Raised Toilet Seat added without an invented quantity; original 12 names retained |
| Legal entity | 91 Ventures LLP |
| Form footer | “T&C apply”, smaller helper-text size |
| FAQ layout | Left heading sticky; right Q&A scrollable |
| Homepage package CTA | “View Details” to the corresponding package detail page |
| Dedicated Packages-page CTA | “Book Free Inspection” using the existing booking flow |

The branch pins these newly approved offer and copy fields when older published Sanity data is still present. Other CMS text, image and feature mappings remain in use. The legacy `scripts/migrate-prerna-content.ts` is a historical migration for the prior 12-component, older-price offer; it is not executed by the frontend or this correction pass and must not be re-applied to current content.
