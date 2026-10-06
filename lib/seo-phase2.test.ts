import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import robots, { AI_TRAINING_CRAWLERS } from "../app/robots";
import sitemap from "../app/sitemap";
import { fallbackHome, fallbackPackages } from "./cms/fallback";
import { homepageContent } from "../content/homepage.content";
import { assessmentDoc } from "../content/knowledge/assessment";
import { guideDoc, guideSources } from "../content/knowledge/guide";
import { evidenceClaims, evidenceMetrics, evidenceSources, regionalEvidenceNotes } from "../content/evidence/evidence.content";
import { validateEvidenceMappings } from "../content/evidence/evidence.logic";
import { assessmentJsonLd, guideJsonLd, ORGANIZATION_ID } from "./seo/structured-data";

/*
 * SEO phase 2: AI-training crawler opt-out (search kept), the assessment service page, the India guide,
 * and the evidence/claim corrections. These pin the decisions so a later edit cannot quietly undo them.
 */
const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");

function productionRobots() {
  const previous = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "production";
  try {
    const result = robots();
    return Array.isArray(result.rules) ? result.rules : [result.rules];
  } finally {
    if (previous === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = previous;
  }
}

test("robots: documented AI-training crawlers are opted out; search and answer crawlers are not", () => {
  const groups = productionRobots();
  assert.equal(groups.length, 2);
  const training = groups.find((group) => group.userAgent !== "*")!;
  assert.deepEqual(training.userAgent, ["GPTBot", "ClaudeBot", "Applebot-Extended", "CCBot"]);
  assert.deepEqual(AI_TRAINING_CRAWLERS, training.userAgent);
  assert.equal(training.disallow, "/");
  assert.equal(training.allow, undefined);
  // Discovery/citation crawlers must never be listed (they fall under the "*" allow group).
  for (const searchBot of ["Googlebot", "Bingbot", "OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot",
    "Applebot", "meta-webindexer", "meta-externalagent", "Google-Extended", "*"]) {
    assert.ok(!AI_TRAINING_CRAWLERS.includes(searchBot), searchBot);
  }
  const wildcard = groups.find((group) => group.userAgent === "*")!;
  assert.equal(wildcard.allow, "/");
  for (const page of ["/bathroom-safety-assessment", "/guides/bathroom-safety-for-elderly-parents"]) {
    assert.ok(!(wildcard.disallow as string[]).some((rule) => page.startsWith(rule)), page);
  }
});

test("sitemap includes the two new pages exactly once", () => {
  const paths = sitemap().map((entry) => new URL(entry.url).pathname);
  for (const page of ["/bathroom-safety-assessment", "/guides/bathroom-safety-for-elderly-parents"]) {
    assert.equal(paths.filter((path) => path === page).length, 1, page);
  }
  assert.equal(paths.length, 17); // 13 after phase 2, plus the four phase-3 solution pages
});

test("new pages: canonical, title, description, one H1, server-rendered content and structured data", () => {
  const assessment = read("app/(public)/bathroom-safety-assessment/page.tsx");
  assert.match(assessment, /canonical: "\/bathroom-safety-assessment"/);
  assert.match(assessment, /title: "Bathroom Safety Assessment in Goa \| Free Inspection \| Mason Company"/);
  assert.match(assessment, /home\.process\.steps/, "process steps come from Sanity");
  assert.match(assessment, /packages\.plans/, "prices come from Sanity");
  const guide = read("app/(public)/guides/bathroom-safety-for-elderly-parents/page.tsx");
  assert.match(guide, /canonical: PATH/);
  assert.match(guide, /title: "Bathroom Safety for Elderly Parents in India: What to Check \| Mason Company"/);
  const renderer = read("components/KnowledgePage.tsx");
  assert.ok(!renderer.startsWith('"use client"'), "rendered on the server: facts are in the HTML");
  assert.equal((renderer.match(/<h1/g) ?? []).length, 1);
  assert.match(renderer, /aria-label="Breadcrumb"/);
});

test("assessment page: Mason facts only, CMS values interpolated, no hardcoded prices", () => {
  const plan = (code: string) => fallbackPackages.plans.find((item) => item.code === code)!;
  const doc = assessmentDoc({ standardPrice: plan("package-standard").price, advancedPrice: plan("package-advanced").price,
    componentCount: fallbackPackages.components.length, processSteps: fallbackHome.process.steps, components: fallbackPackages.components,
    doctors: [{ quote: "Doctor quote", name: "Dr. Example", meta: "Specialty" }], testimonials: [{ quote: "Family quote", name: "A Family" }] });
  const text = JSON.stringify(doc);
  assert.match(text, /Observe first\. Recommend second\. Sell last\./);
  assert.match(text, /₹29,999/);
  assert.match(text, /₹36,999, with a 2-Year Safety AMC/);
  assert.match(text, /Goa/);
  assert.match(text, /full refund any time before installation/);
  assert.match(text, /not a medical one/);
  assert.equal(doc.sections.find((section) => section.id === "how-it-works")!.blocks.length, 1);
  for (const file of ["content/knowledge/assessment.ts", "content/knowledge/guide.ts"]) {
    assert.doesNotMatch(read(file), /₹\s?\d/, `${file}: prices must come from Sanity`);
  }
  for (const href of ["/why", "/packages", "/packages/standard", "/packages/advanced", "/evidence", "/guides/bathroom-safety-for-elderly-parents"]) {
    assert.ok(text.includes(`](${href})`), href);
  }
  // Conversion: the booking action sits under the intro as well as at the end.
  assert.equal(doc.topCta, true);
  assert.equal(doc.cta.label, "Book Free Inspection");
  // Founder-verified doctor input and family testimonials come from Sanity and render as plain quotes.
  const ids = doc.sections.map((section) => section.id);
  for (const id of ["why-individual-assessment", "what-we-install", "doctor-input", "families"]) assert.ok(ids.includes(id), id);
  assert.match(text, /Placement is informed by doctor input/);
  for (const component of fallbackPackages.components) assert.ok(text.includes(component.title), component.title);
  // Without CMS voices the sections are omitted rather than left empty.
  const bare = assessmentDoc({ standardPrice: "x", advancedPrice: "y", componentCount: 1, processSteps: [] });
  assert.ok(!bare.sections.some((section) => ["doctor-input", "families", "what-we-install"].includes(section.id)));
});

test("structured data: Service (free, Goa) and Article (Mason as author/publisher) with no invented credentials", () => {
  const service = assessmentJsonLd("d")["@graph"][0] as Record<string, unknown>;
  assert.deepEqual([service["@type"], (service.provider as { "@id": string })["@id"], (service.areaServed as { name: string }).name],
    ["Service", ORGANIZATION_ID, "Goa"]);
  assert.deepEqual(service.offers, { "@type": "Offer", price: 0, priceCurrency: "INR", description: "Free bathroom inspection" });
  const article = guideJsonLd({ path: "/guides/x", headline: "h", description: "d", published: "2026-10-06", citations: ["https://a"] })["@graph"][0] as Record<string, unknown>;
  assert.deepEqual([article["@type"], (article.author as { "@id": string })["@id"], (article.publisher as { "@id": string })["@id"]],
    ["Article", ORGANIZATION_ID, ORGANIZATION_ID]);
  const all = JSON.stringify([assessmentJsonLd("d"), article]);
  for (const forbidden of ["aggregateRating", "review", "address", "Person", "MedicalBusiness", "award"]) assert.ok(!all.includes(forbidden), forbidden);
});

test("guide: every cited source is a primary or peer-reviewed reference that the registry also uses", () => {
  const registry = new Set(evidenceSources.map((source) => source.url));
  for (const source of guideSources) assert.ok(registry.has(source.href), source.href);
  const text = JSON.stringify(guideDoc);
  assert.doesNotMatch(text, /Most falls happen in the bathroom|1 in 4|lakh/i);
  assert.match(text, /no single right height/);
  const headings = guideDoc.sections.map((section) => section.heading).join(" | ");
  for (const phrase of [/bathroom safety/i, /elderly parents/i, /Grab bars/, /Anti-slip/, /safe bathing/, /toilet support/, /fall prevention/, /Goa/, /modifications/]) {
    assert.match(headings, phrase);
  }
  for (const href of ["/bathroom-safety-assessment", "/packages/standard", "/packages/advanced", "/why", "/evidence"]) assert.ok(text.includes(`](${href})`), href);
});

test("evidence registry: corrected citations and figures, no Mason-modelled numbers", () => {
  const byId = Object.fromEntries(evidenceMetrics.map((metric) => [metric.id, metric]));
  const sourceUrl = (id: string) => evidenceSources.find((source) => source.id === id)!.url;
  assert.equal(byId["india-older-adults-fall-2y"].value, 12.36);
  assert.equal(sourceUrl(byId["india-older-adults-fall-2y"].sourceId), "https://pmc.ncbi.nlm.nih.gov/articles/PMC10276857/");
  assert.equal(byId["india-pooled-injury-after-fall-prevalence"].value, 65.63);
  assert.equal(sourceUrl(byId["india-pooled-injury-after-fall-prevalence"].sourceId), "https://pmc.ncbi.nlm.nih.gov/articles/PMC10137587/");
  assert.deepEqual([byId["global-home-hazard-reduction-overall"].value, byId["global-home-hazard-reduction-higher-risk"].value], [26, 38]);
  assert.equal(sourceUrl("cochrane-home-hazards-2023"), "https://doi.org/10.1002/14651858.CD013258.pub2");
  assert.ok(!evidenceSources.some((source) => source.url.includes("41528689")), "the mismatched PubMed citation is gone");
  assert.ok(!evidenceMetrics.some((metric) => /proxy|modeled|modelled/i.test(`${metric.id} ${metric.label}`)));
  assert.ok(!regionalEvidenceNotes.some((note) => /Mumbai|Bangalore/.test(note.region)));
  assert.ok(evidenceClaims.every((claim) => claim.metricIds.every((id) => byId[id])));
  const validation = validateEvidenceMappings();
  for (const [key, value] of Object.entries(validation)) if (Array.isArray(value)) assert.deepEqual(value, [], key);
  const page = read("app/(marketing)/evidence/page.tsx");
  assert.doesNotMatch(page, /EvidenceEstimator|297470|Lifetime spend proxy/);
  assert.match(page, /href="\/bathroom-safety-assessment"/);
});

test("code-owned public copy carries no unsupported absolute claims", () => {
  const why = read("components/WhyContent.tsx");
  for (const claim of [/₹3–10 lakh/, /single highest-risk/, /the hardest transfer of the day/, /almost always unwitnessed/, /no load rating/, /no medical logic/,
    /usually at the wrong height/]) {
    assert.doesNotMatch(why, claim, String(claim));
  }
  // Founder-verified differentiation is kept: doctor-informed placement and the hardware wording.
  assert.match(why, /Placement informed by doctor input and how your parent actually moves/);
  assert.match(why, /Load-rated,\s+PVD-coated hardware/);
  assert.match(why, /hardware selected for safety-critical use/);
  assert.match(why, /href="\/bathroom-safety-assessment"/);
  assert.match(why, /href="\/evidence"/);
  assert.doesNotMatch(read("app/(marketing)/packages/[slug]/page.tsx"), /doctor validation/);
});

test("homepage fallback copy matches the corrected Sanity text (no unsupported claims to fall back to)", () => {
  const all = JSON.stringify([fallbackHome.hero, fallbackHome.stats, homepageContent.hero, homepageContent.evidenceSection]);
  for (const stale of [/Most falls happen in the bathroom/, /make sure yours don't/, /1 in 4/, /10 lakh/, /"25%"/, /"81%"/, /CDC/]) assert.doesNotMatch(all, stale, String(stale));
  assert.equal(fallbackHome.hero.heading.text, "Many bathroom falls are preventable. We help prevent yours.");
  assert.deepEqual(fallbackHome.stats.cards.map((card) => card.value), ["12%", "97%", "66%", "38%"]);
  assert.deepEqual([fallbackHome.stats.costPrefix, fallbackHome.stats.costFigure], ["Recovery can take", "months"]);
  const registry = new Set(evidenceSources.map((source) => source.id));
  for (const card of homepageContent.evidenceSection.cards) assert.ok(registry.has(card.sourceId), card.sourceId);
});

test("internal links: footer and package pages reach the new pages and the evidence", () => {
  const footer = read("components/Footer.tsx");
  for (const href of ["/bathroom-safety-assessment", "/guides/bathroom-safety-for-elderly-parents", "/evidence"]) assert.ok(footer.includes(`href: "${href}"`), href);
  const packagePage = read("app/(marketing)/packages/[slug]/page.tsx");
  for (const href of ["/bathroom-safety-assessment", "/guides/bathroom-safety-for-elderly-parents", "/evidence"]) assert.ok(packagePage.includes(`href="${href}"`), href);
  const compare = read("app/(marketing)/compare-packages/compare-packages-view.tsx");
  for (const href of ["/bathroom-safety-assessment", "/guides/bathroom-safety-for-elderly-parents", "/evidence"]) assert.ok(compare.includes(`href="${href}"`), href);
  assert.match(read("components/Stats.tsx"), /href="\/evidence"/);
  assert.match(read("components/Process.tsx"), /href="\/bathroom-safety-assessment"/);
});
