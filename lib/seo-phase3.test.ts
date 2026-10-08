import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import sitemap from "../app/sitemap";
import { fallbackHome, fallbackPackages } from "./cms/fallback";
import { SOLUTIONS, SOLUTION_META, solutionDoc, solutionPath, type SolutionFacts, type SolutionSlug } from "../content/knowledge/solutions";
import { assessmentDoc } from "../content/knowledge/assessment";
import { guideDoc } from "../content/knowledge/guide";
import { ORGANIZATION_ID, organizationJsonLd, solutionJsonLd } from "./seo/structured-data";
import { pageOpenGraph, pageTwitter, shareImage, SHARE_IMAGE, SHARE_IMAGE_HEIGHT, SHARE_IMAGE_TYPE, SHARE_IMAGE_WIDTH } from "./seo/open-graph";
import { localSrcSet, withResponsiveSrc } from "./optimized-image";

/*
 * SEO phase 3: the four solution pages, the assessment FAQ, Goa entity signals, share previews and the
 * homepage LCP fix. These pin the decisions so a later edit cannot quietly undo them.
 */
const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");
const SLUGS = SOLUTIONS.map((solution) => solution.slug);

const sectionIds = (doc: { sections: { id: string }[] }) => doc.sections.map((section) => section.id);

function facts(overrides: Partial<SolutionFacts> = {}): SolutionFacts {
  const plan = (code: string) => fallbackPackages.plans.find((item) => item.code === code)!;
  return {
    standardPrice: plan("package-standard").price,
    advancedPrice: plan("package-advanced").price,
    componentCount: fallbackPackages.components.length,
    components: fallbackPackages.components,
    ...overrides
  };
}

test("four solution pages, each a distinct problem, in the sitemap exactly once", () => {
  assert.deepEqual(SLUGS, ["grab-bars", "anti-slip-bathroom", "safer-bathing", "toilet-safety"]);
  const paths = sitemap().map((entry) => new URL(entry.url).pathname);
  for (const slug of SLUGS) assert.equal(paths.filter((path) => path === solutionPath(slug)).length, 1, slug);
  assert.equal(paths.length, 17);
  const titles = SLUGS.map((slug) => SOLUTION_META[slug].title);
  assert.equal(new Set(titles).size, 4, "unique titles");
  for (const slug of SLUGS) {
    assert.ok(SOLUTION_META[slug].title.length <= 80, `${slug}: title length`);
    assert.ok(SOLUTION_META[slug].description.length <= 200, `${slug}: description length`);
    assert.match(SOLUTION_META[slug].description, /Goa/);
  }
});

test("solution pages: substance, Mason method, Goa, conversion path and internal links", () => {
  for (const slug of SLUGS) {
    const doc = solutionDoc(slug as SolutionSlug, facts());
    const text = JSON.stringify(doc);
    assert.equal(doc.parent?.href, "/bathroom-safety-assessment", `${slug}: breadcrumb parent`);
    assert.equal(doc.topCta, true, `${slug}: booking action under the intro`);
    // The top text link must land on a section that exists on this page.
    assert.ok(doc.topLink && sectionIds(doc).includes(doc.topLink.href.slice(1)), `${slug}: top link target exists`);
    assert.equal(doc.cta.label, "Book Free Inspection");
    assert.ok(doc.summary.length >= 4, `${slug}: answer-first summary`);
    const ids = doc.sections.map((section) => section.id);
    for (const id of ["what-families-notice", "inspection", "what-mason-provides", "related"]) assert.ok(ids.includes(id), `${slug}: ${id}`);
    assert.ok(doc.sections.length >= 6, `${slug}: not a thin page`);
    assert.ok(text.length > 4500, `${slug}: substantial content (${text.length})`);
    assert.match(text, /Goa/);
    assert.match(text, /₹29,999/, `${slug}: Standard price from CMS`);
    assert.match(text, /₹36,999 and adds a 2-Year Safety AMC/, `${slug}: Advanced price and AMC from CMS`);
    for (const href of ["/bathroom-safety-assessment", "/packages/standard", "/packages/advanced", "/guides/bathroom-safety-for-elderly-parents", "/evidence"]) {
      assert.ok(text.includes(`(${href})`) || doc.cta.secondary?.href === href, `${slug} -> ${href}`);
    }
    for (const other of SLUGS.filter((item) => item !== slug)) assert.ok(text.includes(`](${solutionPath(other)})`), `${slug} -> ${other}`);
    // Stale or unverified facts never appear.
    for (const forbidden of [/Bangalore|Bengaluru|Mumbai/, /1-Year/, /30,000|37,000/, /care@/, /guarantee(?!d? that)/i, /SS ?304|32 ?mm|\bkg\b|load rating/i, /Aegis/]) {
      assert.doesNotMatch(text, forbidden, `${slug}: ${forbidden}`);
    }
  }
  assert.doesNotMatch(read("content/knowledge/solutions.ts"), /₹\s?\d/, "prices come from Sanity");
});

test("solution photos: only genuine Mason photos from Sanity, with descriptive alt text", () => {
  // Bundled fallback images are not Mason product photos, so no figure renders from them.
  for (const slug of SLUGS) assert.doesNotMatch(JSON.stringify(solutionDoc(slug as SolutionSlug, facts())), /"figures"/, slug);
  const sanity = facts({
    components: fallbackPackages.components.map((component) => ({ ...component, image: { src: `https://cdn.sanity.io/images/x/production/${component.id}.jpg`, alt: "" } }))
  });
  const grab = JSON.stringify(solutionDoc("grab-bars", sanity));
  assert.match(grab, /"figures"/);
  assert.match(grab, /"alt":"Angled stainless-steel grab bar"/);
  const toilet = JSON.stringify(solutionDoc("toilet-safety", sanity));
  assert.match(toilet, /"alt":"White raised toilet seat with lid"/);
  for (const slug of SLUGS) assert.doesNotMatch(JSON.stringify(solutionDoc(slug as SolutionSlug, sanity)), /"alt":"[^"]*(Goa|elderly|best)[^"]*"/i, `${slug}: alt describes the image`);
});

test("solution structured data: Service in Goa by Mason, three-level breadcrumb, nothing invented", () => {
  const data = solutionJsonLd({ path: "/solutions/grab-bars", name: "Grab bars", serviceType: "Grab bar installation", description: "d" });
  const [service, crumbs] = data["@graph"] as Record<string, unknown>[];
  assert.equal(service["@type"], "Service");
  assert.equal((service.provider as { "@id": string })["@id"], ORGANIZATION_ID);
  assert.equal((service.areaServed as { name: string }).name, "Goa");
  const items = crumbs.itemListElement as { name: string; item: string }[];
  assert.deepEqual(items.map((item) => item.name), ["Home", "Bathroom safety assessment", "Grab bars"]);
  assert.equal(items[2].item, "https://www.masoncompany.in/solutions/grab-bars");
  const all = JSON.stringify(data);
  for (const forbidden of ["aggregateRating", "review", "address", "offers", "FAQPage", "LocalBusiness"]) assert.ok(!all.includes(forbidden), forbidden);
});

test("solution route: static, canonical, indexable, share preview, view_service", () => {
  const route = read("app/(public)/solutions/[slug]/page.tsx");
  assert.match(route, /export const dynamicParams = false/);
  assert.match(route, /generateStaticParams/);
  assert.match(route, /canonical: path/);
  assert.match(route, /pageOpenGraph\(/);
  assert.match(route, /viewService=\{SERVICE_NAMES\.safetyInstallation\}/);
  assert.doesNotMatch(route, /robots:\s*\{[^}]*index:\s*false/);
});

test("share previews keep the image and site name on pages that set their own Open Graph", () => {
  const og = pageOpenGraph({ title: "t", description: "d", url: "/x" }) as Record<string, unknown>;
  assert.deepEqual(og.images, [shareImage]);
  assert.equal(og.siteName, "Mason Company");
  for (const file of ["app/(public)/bathroom-safety-assessment/page.tsx", "app/(public)/guides/bathroom-safety-for-elderly-parents/page.tsx"]) {
    assert.match(read(file), /openGraph: pageOpenGraph\(/, file);
  }
});

/* The WhatsApp card. These pin the two properties WhatsApp is actually sensitive to - a declared
   1.91:1 size and a small file - plus the og:url that was missing on home and packages. */
test("share image: 1200x630, declared dimensions and type, and small enough for WhatsApp", () => {
  assert.equal(SHARE_IMAGE_WIDTH, 1200);
  assert.equal(SHARE_IMAGE_HEIGHT, 630);
  assert.equal(SHARE_IMAGE_TYPE, "image/jpeg");
  assert.deepEqual({ url: shareImage.url, width: shareImage.width, height: shareImage.height, type: shareImage.type },
    { url: SHARE_IMAGE, width: 1200, height: 630, type: "image/jpeg" });
  assert.ok(shareImage.alt.length > 0, "alt text");

  const bytes = readFileSync(resolve(process.cwd(), `public${SHARE_IMAGE}`)).length;
  assert.ok(bytes < 300_000, `share image is ${bytes} bytes; WhatsApp drops cards much over ~300KB`);

  /* JPEG SOF marker carries the real pixel size, so the declared numbers cannot drift from the file. */
  const file = readFileSync(resolve(process.cwd(), `public${SHARE_IMAGE}`));
  let i = 2;
  let dimensions: { width: number; height: number } | undefined;
  while (i < file.length - 9) {
    if (file[i] !== 0xff) { i += 1; continue; }
    const marker = file[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      dimensions = { height: file.readUInt16BE(i + 5), width: file.readUInt16BE(i + 7) };
      break;
    }
    i += 2 + file.readUInt16BE(i + 2);
  }
  assert.deepEqual(dimensions, { width: SHARE_IMAGE_WIDTH, height: SHARE_IMAGE_HEIGHT }, "file matches declared size");
});

test("every shared public page declares a card with og:url", () => {
  const og = pageOpenGraph({ title: "t", description: "d", url: "/x" }) as Record<string, unknown>;
  assert.equal(og.url, "/x");

  const twitter = pageTwitter({ title: "t", description: "d" }) as Record<string, unknown>;
  assert.equal(twitter.card, "summary_large_image");
  assert.deepEqual(twitter.images, [shareImage]);

  /* Home and packages used to fall through to the layout's generic card, which had no og:url. */
  for (const file of [
    "app/(public)/layout.tsx",
    "app/(public)/page.tsx",
    "app/(public)/packages/page.tsx",
    "app/(public)/bathroom-safety-assessment/page.tsx",
    "app/(public)/guides/bathroom-safety-for-elderly-parents/page.tsx",
    "app/(public)/solutions/[slug]/page.tsx"
  ]) {
    assert.match(read(file), /pageOpenGraph\(/, file);
  }

  /* The layout's fallback card must not claim a URL: a fixed og:url there would make every page
     without its own card (/why, /about, /contact, /privacy, /terms) resolve to the homepage. */
  const fallback = pageOpenGraph({ title: "t", description: "d" }) as Record<string, unknown>;
  assert.equal("url" in fallback, false);
  assert.doesNotMatch(read("app/(public)/layout.tsx"), /pageOpenGraph\(\{[^}]*\burl:/);

  /* No page may hand Next a bare image string again: that is what dropped the size tags. */
  for (const file of ["app/(public)/layout.tsx", "app/(public)/page.tsx", "app/(public)/packages/page.tsx"]) {
    assert.doesNotMatch(read(file), /images:\s*\["/, file);
  }
});

test("assessment page: visible FAQ (no FAQPage markup), solutions hub, accurate inspection wording", () => {
  const plan = (code: string) => fallbackPackages.plans.find((item) => item.code === code)!;
  const doc = assessmentDoc({ standardPrice: plan("package-standard").price, advancedPrice: plan("package-advanced").price,
    componentCount: fallbackPackages.components.length, processSteps: fallbackHome.process.steps });
  const text = JSON.stringify(doc);
  const faq = doc.sections.find((section) => section.id === "faq")!.blocks[0] as { faq: { q: string; a: string }[] };
  assert.ok(faq.faq.length >= 6);
  for (const question of ["What happens during a bathroom safety inspection?", "Does Mason serve all of Goa?", "Will Mason recommend something that is not part of a Mason package?"]) {
    assert.ok(faq.faq.some((item) => item.q === question), question);
  }
  assert.ok(sectionIds(doc).includes("how-it-works"), "the assessment page's default top link target exists");
  assert.match(text, /in person or by video/, "matches the published FAQ: virtual or physical inspection");
  assert.doesNotMatch(text, /in-home/);
  for (const slug of SLUGS) assert.ok(text.includes(`](${solutionPath(slug)})`), slug);
  assert.doesNotMatch(read("lib/seo/structured-data.ts"), /FAQPage/, "FAQ rich results are deprecated; no markup");
  assert.match(read("app/(public)/bathroom-safety-assessment/page.tsx"), /viewService=\{SERVICE_NAMES\.safetyAssessment\}/);
});

test("Goa entity: Organization names the service area and expertise, still no address or LocalBusiness", () => {
  const org = organizationJsonLd({ phoneHref: "tel:+918149433383", supportEmail: "support@masoncompany.in" } as Parameters<typeof organizationJsonLd>[0])["@graph"][0] as Record<string, unknown>;
  assert.equal((org.areaServed as { name: string }).name, "Goa");
  assert.equal(org.slogan, "Observe first. Recommend second. Sell last.");
  assert.ok((org.knowsAbout as string[]).includes("Grab bar placement and installation"));
  assert.ok(!JSON.stringify(org).includes("address"));
  assert.ok(!JSON.stringify(org).includes("LocalBusiness"));
});

test("internal links: guide, footer and package pages reach the solution pages", () => {
  const guide = JSON.stringify(guideDoc);
  for (const slug of SLUGS) assert.ok(guide.includes(`](${solutionPath(slug)})`), `guide -> ${slug}`);
  const footer = read("components/Footer.tsx");
  for (const slug of SLUGS) assert.ok(footer.includes(`href: "${solutionPath(slug)}"`), `footer -> ${slug}`);
  const packagePage = read("app/(marketing)/packages/[slug]/page.tsx");
  for (const slug of SLUGS) assert.ok(packagePage.includes(`href="${solutionPath(slug)}"`), `package page -> ${slug}`);
});

test("performance: the hero headline paints with the HTML, hero images are responsive WebP", () => {
  const hero = read("components/Hero.tsx");
  assert.doesNotMatch(hero, /<h1 className="hero-rise/, "the LCP headline is never hidden for the entrance animation");
  assert.match(hero, /withResponsiveSrc\(/);
  const srcSet = localSrcSet("/prerna/images/hero-install-portrait.jpg")!;
  assert.match(srcSet, /^\/_next\/image\?url=%2Fprerna%2Fimages%2Fhero-install-portrait\.jpg&w=640&q=70 640w/);
  assert.equal(srcSet.split(", ").length, 5);
  assert.equal(localSrcSet("https://cdn.sanity.io/images/a.jpg"), undefined, "Sanity images keep their own CDN srcSet");
  const sanityImage = { src: "https://cdn.sanity.io/images/a.jpg", srcSet: "a 640w", alt: "" };
  assert.equal(withResponsiveSrc(sanityImage), sanityImage);
  assert.match(read("app/(public)/layout.tsx"), /Geist_Mono\(\{[^}]*preload: false/);
});
