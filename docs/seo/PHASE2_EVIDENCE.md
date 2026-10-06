# Mason SEO phase 2 — evidence, claims, crawler policy and measurement

Verified 6 October 2026; founder decisions applied 7 October 2026. Labels: **VERIFIED MASON FACT**, **EXTERNAL EVIDENCE**, **SEO HYPOTHESIS**,
**RECOMMENDATION**, **IMPLEMENTED** (in this PR), **CMS ACTION** (founder edits Sanity; not in this PR).

## 1. Claim and evidence audit

| Page (owner) | Current wording | Classification | Evidence | Action |
|---|---|---|---|---|
| Home hero (Sanity) | "Most falls happen in the bathroom. We make sure yours don't." | Unsupported as a general fact; "we make sure" is absolute | No source shows most falls happen in bathrooms. The Ahmedabad study found 8 of 24 fallers fell in the bathroom (small sample) | **CMS ACTION**: founder positioning decision (see §3) |
| Home stat (Sanity) | "25%: Among Indians aged 60+, 1 in 4 reported an injury and/or fall in the previous two years." | Not supported as stated | LASI Wave 1: 12.36% reported a fall and 5.57% a fall-related injury in the previous two years ([Sci Rep 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10276857/); PLOS ONE 2022 agrees, ~12%) | **CMS ACTION** (exact text in §3); registry **IMPLEMENTED** |
| Home stat (Sanity) | "81%: Bathroom injuries from falls" | Partially supported; misleading population | CDC MMWR 2011: 81.1% of **US** bathroom injuries treated in emergency departments in 2008, ages **15+**, were caused by falls | **CMS ACTION**: qualify as US data |
| Home stat (Sanity) and /evidence (code) | "66%: pooled injury rate 65.6% among those who fell" | Strongly supported, but **miscited** | Real source: [Geriatrics 2023 meta-analysis, PMC10137587](https://pmc.ncbi.nlm.nih.gov/articles/PMC10137587/) (wide CI). The registry cited PMID 41528689, an unrelated 2026 paper | Citation **IMPLEMENTED** |
| Home stat (Sanity) | "Up to 38%: home hazard interventions cut fall rates by 26–38%" | Strongly supported; needs geography | Cochrane 2023 (CD013258.pub2): RaR 0.74 overall, 0.62 for higher-risk; 22 trials, 10 countries, mostly outside India | Keep; **CMS ACTION** optional qualifier. Registry **IMPLEMENTED** (it had mapped 26% to "higher-risk") |
| Home "cost of doing nothing" (Sanity) | "Up to ₹10 lakh" | Unsupported | The only cited cost source reports **annual mean** out-of-pocket injury treatment of ₹669–₹29,747 | **CMS ACTION**: remove or replace |
| /why (code) | "A serious fall averages ₹3–10 lakh" | Unsupported | As above | Removed — **IMPLEMENTED** |
| /why (code) | "The single highest-risk moment in the house" | Unsupported absolute | No source ranks bathing as the single highest-risk moment | "One of the riskiest moments in the home" — **IMPLEMENTED** |
| /why (code) | "the hardest transfer of the day … almost always unwitnessed" | Unsupported absolutes | — | "one of the hardest transfers … usually no one else is in the room" — **IMPLEMENTED** |
| /why (code) | Grab bar "usually at the wrong height, often drilled into hollow tile that won't take the load" | Unsupported frequency claims | — | "height is guesswork and no one checks whether the wall behind the tile can hold it" — **IMPLEMENTED** |
| /why (code) | Handyman has "no medical logic, no load rating" | Unsupported comparison | — | Now "no hardware selected for safety-critical use" (founder-approved differentiation) — **IMPLEMENTED** |
| /why (code) | "Load-rated, PVD-coated hardware. Placement shaped by doctor input." | **VERIFIED MASON FACT** (founder, 7 Oct) | Founder-verified doctor input; hardware wording kept without any kg figure | Kept; placement now "informed by doctor input and how your parent actually moves" — **IMPLEMENTED** |
| /evidence (code) | "Lifetime spend proxy ₹2,97,470" and cost **Estimator** | Mason-modelled numbers presented as evidence | Annual private inpatient OOPE × 10 years is a Mason construct | Removed — **IMPLEMENTED** |
| /evidence (code) | 25% LASI "injury and/or fall" | Not supported as stated | See above | 12.36% fall / 5.57% fall-injury — **IMPLEMENTED** |
| /evidence (code) | OOPE ₹669 / ₹1,404 / ₹10,727 / ₹29,747 | Cited; not independently verified (publisher blocks automated access) | MDPI *Safety* 2024 | Kept, now labelled as annual averages, not the cost of a fall; **verify** |
| /evidence (code) | "Mumbai" regional card | Implies a Mumbai focus | — | Removed — **IMPLEMENTED** |
| Package pages (code) | "See doctor validation & evidence" → /evidence | Misleading link (no doctor validation on /evidence) | — | Re-worded — **IMPLEMENTED** |
| Doctors (Sanity) | Dr. Ashok Gupta, Dr. Rajiv Goyal, Dr. Prerna Goyal | **VERIFIED MASON FACT** (founder, 7 Oct) | Founder confirms genuine and verified | Kept; also shown on /bathroom-safety-assessment from Sanity — **IMPLEMENTED** |
| Testimonials (Sanity) | Maria Pereira, Rohan Naik, Neha Shah, Karl Fernandes | **VERIFIED MASON FACT** (founder, 7 Oct) | Founder confirms genuine and verified | Kept; shown as plain quotes on /bathroom-safety-assessment (no Review markup) — **IMPLEMENTED** |
| /about (Sanity) | "the bathroom … may be one of the most unsafe rooms" | Acceptable (hedged) | — | Keep |

## 2. AI and search crawler policy — **IMPLEMENTED** in `app/robots.ts`

| Provider | Token | Purpose (official) | Mason rule | Confidence |
|---|---|---|---|---|
| OpenAI | OAI-SearchBot | ChatGPT search results | Allow (`*`) | High — [docs](https://developers.openai.com/api/docs/bots) |
| OpenAI | GPTBot | Model training; independent of search | **Disallow** | High |
| OpenAI | ChatGPT-User | User-initiated fetches; may ignore robots.txt | n/a | High |
| Anthropic | ClaudeBot | Model training | **Disallow** | High — [support article](https://support.claude.com/en/articles/8896518) |
| Anthropic | Claude-SearchBot / Claude-User | Search quality / user fetches | Allow | High |
| Google | Googlebot | Search incl. AI Overviews | Allow | High |
| Google | Google-Extended | Gemini training **and** grounding in Gemini Apps | **Allow (deliberate)** — blocking would also cut Gemini citations | High — [docs](https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers) |
| Apple | Applebot / Applebot-Extended | Search (Siri, Spotlight, Safari) / training only | Allow / **Disallow** | High — [docs](https://support.apple.com/en-us/119829) |
| Meta | meta-webindexer / meta-externalagent | Meta AI search / "training … or improving products by indexing content directly" | Allow / **Allow** (not cleanly training-only; re-checked 7 Oct) | High — [docs](https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/) |
| Perplexity | PerplexityBot / Perplexity-User | Search indexing (not training) / user fetches | Allow | High — [docs](https://docs.perplexity.ai/guides/bots) |
| Common Crawl | CCBot | Open web dataset (used for model training) | **Disallow** | High — [docs](https://commoncrawl.org/ccbot) |
| Microsoft | Bingbot | Bing and Copilot search | Allow | High |

`llms.txt`: not added. Google states it does not use it, and no major AI system has confirmed using it.

## 3. Sanity edits for the founder (Studio → Homepage)

The code fallbacks (`lib/cms/fallback.ts`, `content/homepage.content.ts`) already carry this text.

| Field | Current | Replace with |
|---|---|---|
| Hero → Heading | Most falls happen in the bathroom. We make sure yours don't. | Many bathroom falls are preventable. We help prevent yours. *(keep highlight: falls)* |
| Evidence → Cost card label | The cost of doing nothing | The cost of a serious fall |
| Evidence → Cost card qualifier | Up to | Recovery can take |
| Evidence → Cost card figure | ₹10 lakh | months |
| Evidence → Card 1 value / kicker | 25% / Reported injury and/or fall | 12% / Reported a fall |
| Evidence → Card 1 label | Among Indians aged 60+, 1 in 4 reported an injury and/or fall in the previous two years. | Among Indians aged 60+, about 1 in 8 reported a fall in just the previous two years. |
| Evidence → Card 1 source | LASI India Executive Summary | LASI Wave 1 (Scientific Reports, 2023) |
| Evidence → Card 2 value / kicker | 81% / Bathroom injuries from falls | 97% / Bathrooms with no grab bars |
| Evidence → Card 2 label | Falls are the dominant risk around wet zones, toilets, and transfers. | In a study of 198 older adults' bathrooms in Ahmedabad, 97% had no grab bars - and every one had at least seven hazards. |
| Evidence → Card 2 source | CDC Bathroom Injuries Report | Ahmedabad bathroom-hazard study (2015) |
| Evidence → Sources line | Sources: LASI India, CDC bathroom-injury report, … | Sources: LASI Wave 1 (Scientific Reports, 2023), Ahmedabad bathroom-hazard study (2015), India falls-injury meta-analysis (Geriatrics, 2023), Cochrane home-hazard review (2023). |

## 4. Search intent → page ownership (SEO HYPOTHESIS; validate with Search Console)

| Intent cluster | Example queries | Stage | Owner page |
|---|---|---|---|
| Local service | bathroom safety assessment Goa; elderly bathroom safety Goa | Decision | `/bathroom-safety-assessment` (new) |
| Packages and price | bathroom safety package price Goa; grab bar installation Goa | Decision | `/packages`, `/packages/*`; `/compare-packages` for Standard vs Advanced |
| Parent problem | bathroom safety for elderly parents India; how to make bathroom safe for elderly | Problem-aware | `/guides/bathroom-safety-for-elderly-parents` (new) |
| Fall evidence | elderly falls India statistics; bathroom falls elderly | Research | `/evidence` |
| Brand | Mason Company; masoncompany.in | Navigational | `/`, `/about` |

SERP (indicative, from a US-based search tool): brand blogs (Jaquar, Hindware), MyGate, senior-care providers
(Antara, Samarth), hospitals and US home-care franchises. No Goa assessment provider appears. Mason's edge is
local service, an observation-first method, and Indian primary evidence.

## 5. Measurement framework (once Search Console has ~28 days of data)

- **Search Console** (per page and query; country = India; device): impressions, clicks, CTR, average position,
  indexed status, crawl or indexing issues. Compare 7-day, 28-day and 90-day windows; annotate releases with this log.
- **GA4 funnel** (unchanged events): organic `page_view` → `view_service` / `view_package` → `form_start` →
  `form_submit` → `generate_lead`, segmented by organic landing page (including the two new pages).
- **Decision rules**:
  - Consolidate `/compare-packages` into `/packages` only if both rank for the same queries with split clicks over 90 days.
  - Expand guides only where Search Console shows impressions for unserved informational queries.
