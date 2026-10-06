# Mason SEO phase 3 — implementation notes and founder specs

7 October 2026. Branch `feature/seo-phase3-growth`, built from main `112a382`.

## 1. Performance (mobile Lighthouse 12, simulated throttling, median of 3 runs)

| Page | Production before (live CDN, GA4 + Maps) | Local before (main) | Local after (this branch) |
|---|---|---|---|
| `/` | 62 · LCP 10.0 s · 1,471 KB | 78 · LCP 5.7 s · 977 KB | **84 · LCP 4.4 s · 687 KB** |
| `/packages` | 91 · LCP 3.3 s | 89 · LCP 3.8 s | 85 · LCP 4.1 s (run-to-run noise: no change touches it) |
| `/bathroom-safety-assessment` | 92 · LCP 3.3 s | 89 · LCP 3.8 s | 88 · LCP 3.8 s |
| `/guides/bathroom-safety-for-elderly-parents` | 93 · LCP 3.1 s | 90 · LCP 3.6 s | 89 · LCP 3.6 s |

The local runs have no GA4 or Google Maps scripts (no keys), so they are lighter than production. Compare
local before with local after.

- **Cause of the slow homepage:** its LCP element is the hero headline. GSAP set it to `opacity: 0` on
  hydration and faded it in after a delay, so the largest text waited for all page JavaScript.
- **Fix:** the headline now paints with the HTML; the subcopy and CTAs still animate.
- **Hero images:** these were full-size JPEGs (346 KB on mobile). They are now served as resized WebP
  through Next's image optimiser (`lib/optimized-image.ts`).
- **Fonts:** the mono label font is no longer preloaded.
- **Not changed, on purpose:** Google Maps Places (~300 KB of JavaScript) loads on every page, because
  the booking form is always mounted.
  - Deferring it touches the location-verification flow, which is protected.
  - It is listed for the next sprint, with browser tests.

## 2. Google Business Profile — founder action

No Mason profile was found. Create one only with real details (Google requires verification).

| Field | Value |
|---|---|
| Business name | `Mason Company` (exactly; no keywords added) |
| Business type | Service-area business. **Hide the address.** Mason has no public premises. |
| Service area | Goa |
| Primary category | `Bathroom remodeler`. This is the closest existing category: Google has no "bathroom safety" category, and this is the one used for installing bathroom modifications. The description makes clear there is no renovation. |
| Secondary category | `Mobility equipment supplier` (grab bars, shower stools and raised toilet seats are supplied and installed) |
| Avoid | `Aged care`, `Home health care service`, `Senior citizen center`. Mason does not provide care. |
| Website | `https://www.masoncompany.in/` (or `/bathroom-safety-assessment` as the appointment link) |
| Phone | +91 81494 33383 |
| Hours | Mason's real working hours |
| Services | Bathroom safety assessment (free) · Grab bar installation · Anti-slip bathroom floor treatment · Safer bathing setup (shower stool, support) · Toilet safety (raised toilet seat, support bars) · 2-Year Safety AMC (Advanced package) |
| Photos | Genuine Mason installations and team only (see §3). No stock. |
| Reviews | Ask genuine customers after handover, using the profile's review link. No incentives and no review gating (Google policy). Do not copy reviews onto the website as rating markup. |

**Description** (under 750 characters):

> Mason Company makes bathrooms safer for ageing parents in Goa. We start with a free bathroom safety
> inspection: we watch how your parent steps in, turns, sits and stands, showers and walks back, and
> check the floor, walls, lighting and lock. Then we recommend what would help. Mason-trained
> technicians install a complete kit — grab bars placed for the person, anti-slip treatment and mats,
> a shower stool, a raised toilet seat, edge protection and more — with no renovation. Observe first.
> Recommend second. Sell last.

## 3. Photo shot list — founder action (genuine Mason work, with the household's consent)

| Page | Image | What it shows | Orientation | Avoid |
|---|---|---|---|---|
| /solutions/grab-bars | Installed grab bar beside a toilet | Bar on a real tiled wall, toilet in frame | Portrait 4:5 | Faces; brand stickers |
| /solutions/safer-bathing | Shower stool in place | Stool, nearby grab bar and mat in a real bathing area | Portrait 4:5 | People bathing |
| /solutions/anti-slip-bathroom | Treated floor, wet | Close-up of treated tile with water on it | Square | Implying measured grip |
| /solutions/toilet-safety | Raised seat with a support bar | A real installation from the user's side | Portrait 4:5 | Clinical framing |
| /bathroom-safety-assessment | Inspection in progress | A Mason technician looking at the wall or measuring | Landscape 3:2 | Customer faces without consent |
| Google Business Profile and /about | Team photo | The Mason team in uniform | Landscape | Stock-looking poses |

Upload to Sanity: the kit component images feed the solution pages automatically. New installation
photos can be added when the pages get a gallery slot.

## 4. GA4 — founder action, so the new parameters appear in reports

Funnel events (`page_view`, `view_service`, `view_package`, `select_package`, `form_start`, `form_submit`,
`generate_lead`) now carry two extra parameters:

- `entry_page`: the first page of the visit (per browser tab);
- `page_category`: `home`, `assessment`, `solution`, `guide`, `evidence`, `packages`, `why`, `about`,
  `contact`, `checkout` or `other`.

**Steps in GA4 → Admin → Custom definitions → Create custom dimension:**

1. Name `Entry page`, scope Event, event parameter `entry_page`.
2. Name `Page category`, scope Event, event parameter `page_category`.

**Report:** Explore → Free form. Use rows `Entry page`, columns `Event name` (filtered to
`view_service`, `form_start`, `form_submit`, `generate_lead`), and a filter
`Session default channel group = Organic Search`.

- This answers "which organic landing pages create assessment interest and leads".
- GA4's built-in `Landing page` dimension works for the session-level view.

No personal data is added: both values are page paths or fixed labels, and pass the existing sanitising.
