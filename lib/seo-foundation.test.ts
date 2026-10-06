import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import { fallbackPlans, fallbackSettings } from "./cms/fallback";
import { homepageContent } from "../content/homepage.content";
import { comparePackagesContent } from "../content/compare-packages.content";
import { jsonLdScript, organizationJsonLd, ORGANIZATION_ID, SITE_URL } from "./seo/structured-data";
import { PRERNA_MIGRATION_RETIRED_MESSAGE, runMigration } from "../scripts/migrate-prerna-content";

/*
 * SEO foundation + critical-fact integrity. Sanity is the live source of truth; these tests pin the
 * repository's own copies (CMS fallback, legacy content, structured data) to the same verified facts so
 * search engines and answer systems cannot be shown contradictory Mason facts by URL or by fallback.
 */
const CANONICAL = {
  origin: "https://www.masoncompany.in",
  serviceArea: "Goa",
  standard: { code: "package-standard", priceInr: 29999, price: "₹29,999" },
  advanced: { code: "package-advanced", priceInr: 36999, price: "₹36,999", amc: "2-Year Safety AMC" },
  supportEmail: "support@masoncompany.in",
  phoneDisplay: "+91 81494 33383",
  phoneE164: "+918149433383"
};
const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");

// ---------- crawl surface ----------

test("robots: everything public is crawlable by search and answer crawlers; internal areas are not", () => {
  const previous = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "production";
  try {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    // The only other group is the AI-training opt-out (lib/seo-phase2.test.ts); search crawlers use "*".
    assert.equal(rules[0].userAgent, "*");
    assert.equal(rules[0].allow, "/");
    for (const path of ["/admin", "/api", "/crm", "/content-preview", "/communications", "/operations"]) {
      assert.ok((rules[0].disallow as string[]).includes(path), path);
    }
    for (const page of ["/", "/packages", "/packages/standard", "/why", "/about", "/contact", "/evidence", "/compare-packages"]) {
      assert.ok(!(rules[0].disallow as string[]).some((rule) => page === rule || page.startsWith(`${rule}/`)), page);
    }
    assert.equal(result.sitemap, `${CANONICAL.origin}/sitemap.xml`);
  } finally {
    if (previous === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = previous;
  }
});

test("sitemap: canonical host only, public pages only, no false lastmod", () => {
  const entries = sitemap();
  const paths = entries.map((entry) => new URL(entry.url).pathname);
  for (const entry of entries) {
    assert.ok(entry.url.startsWith(`${CANONICAL.origin}/`), entry.url);
    assert.equal(entry.lastModified, undefined, `${entry.url}: no per-request lastmod`);
  }
  assert.equal(new Set(paths).size, paths.length, "no duplicates");
  for (const page of ["/", "/about", "/why", "/packages", "/packages/standard", "/packages/advanced", "/contact", "/evidence", "/privacy", "/terms"]) {
    assert.ok(paths.includes(page), page);
  }
  assert.ok(!paths.some((path) => /^\/(crm|admin|api|checkout|content-preview|communications|operations|refund)/.test(path)));
});

test("metadata: one canonical origin, a canonical on every indexable page, noindex on transactional and staff pages", () => {
  assert.match(read("app/layout.tsx"), /metadataBase: new URL\("https:\/\/www\.masoncompany\.in"\)/);
  assert.match(read("app/layout.tsx"), /<html lang="en-IN">/);
  const canonicals: Record<string, string> = {
    "app/(public)/page.tsx": "https://www.masoncompany.in/", "app/(public)/about/page.tsx": "https://www.masoncompany.in/about",
    "app/(public)/why/page.tsx": "https://www.masoncompany.in/why", "app/(public)/packages/page.tsx": "https://www.masoncompany.in/packages",
    "app/(public)/contact/page.tsx": "https://www.masoncompany.in/contact", "app/(public)/privacy/page.tsx": "https://www.masoncompany.in/privacy",
    "app/(public)/terms/page.tsx": "https://www.masoncompany.in/terms", "app/(marketing)/compare-packages/page.tsx": "/compare-packages",
    "app/(marketing)/evidence/page.tsx": "/evidence"
  };
  for (const [file, canonical] of Object.entries(canonicals)) {
    assert.ok(read(file).includes(`canonical: "${canonical}"`), `${file} → ${canonical}`);
  }
  assert.match(read("app/(marketing)/packages/[slug]/page.tsx"), /alternates: \{ canonical: url \}|canonical: url/);
  assert.equal((read("app/(marketing)/checkout/[packageId]/page.tsx").match(/robots: \{ index: false, follow: true \}/g) ?? []).length, 2);
  assert.match(read("app/(crm)/layout.tsx"), /export const metadata: Metadata = \{ robots: \{ index: false, follow: false \} \};/);
  assert.match(read("app/(marketing)/evidence/page.tsx"), /title: "Falls, Injury Risk and Treatment-Cost Evidence for Families \| Mason Company"/);
});

// ---------- structured data ----------

test("Organization JSON-LD states only verifiable facts from Contact & Support", () => {
  const graph = organizationJsonLd(fallbackSettings.contact)["@graph"];
  const org = graph.find((node) => node["@type"] === "Organization") as Record<string, unknown>;
  const site = graph.find((node) => node["@type"] === "WebSite") as Record<string, unknown>;
  assert.deepEqual([org["@id"], org.name, org.url, org.email, org.telephone],
    [ORGANIZATION_ID, "Mason Company", CANONICAL.origin, CANONICAL.supportEmail, CANONICAL.phoneE164]);
  assert.deepEqual(org.areaServed, { "@type": "State", name: "Goa", containedInPlace: { "@type": "Country", name: "India" } });
  assert.equal(org.logo, `${SITE_URL}/apple-icon.png`);
  assert.deepEqual(site.publisher, { "@id": ORGANIZATION_ID });
  const serialised = JSON.stringify(graph);
  for (const forbidden of ["aggregateRating", "review", "address", "priceRange", "LocalBusiness", "MedicalBusiness", "award", "Bangalore", "Mumbai"]) {
    assert.ok(!serialised.includes(forbidden), forbidden);
  }
  assert.ok(!jsonLdScript({ text: "</script><script>x" }).includes("</script>"), "cannot close its own script tag");
  assert.match(read("app/(public)/page.tsx"), /organizationJsonLd\(settings\.contact\)/);
  assert.match(read("app/(marketing)/packages/[slug]/page.tsx"), /"@id": `\$\{SITE_URL\}\/#organization`/);
});

// ---------- critical business facts ----------

test("package facts agree across the CMS fallback and the legacy content used by compare/checkout", () => {
  const byCode = Object.fromEntries(fallbackPlans.map((plan) => [plan.code, plan]));
  assert.deepEqual([byCode[CANONICAL.standard.code].priceInr, byCode[CANONICAL.standard.code].price], [CANONICAL.standard.priceInr, CANONICAL.standard.price]);
  assert.deepEqual([byCode[CANONICAL.advanced.code].priceInr, byCode[CANONICAL.advanced.code].price], [CANONICAL.advanced.priceInr, CANONICAL.advanced.price]);
  assert.match(byCode[CANONICAL.advanced.code].badge ?? "", /2-Year Safety AMC/);
  assert.doesNotMatch(byCode[CANONICAL.standard.code].badge ?? "", /AMC/, "only Advanced includes the AMC");
  for (const content of [homepageContent, comparePackagesContent]) {
    const plans = Object.fromEntries(content.packagesSection.plans.map((plan) => [plan.id, plan]));
    assert.equal(plans[CANONICAL.standard.code].currentPrice, CANONICAL.standard.price);
    assert.equal(plans[CANONICAL.advanced.code].currentPrice, CANONICAL.advanced.price);
  }
  assert.deepEqual([fallbackSettings.contact.supportEmail, fallbackSettings.contact.phoneDisplay, fallbackSettings.contact.phoneHref],
    [CANONICAL.supportEmail, CANONICAL.phoneDisplay, `tel:${CANONICAL.phoneE164}`]);
});

/** Public-facing sources (pages, components, published content). Internal staff content is excluded. */
function publicSources(): string[] {
  const roots = ["app/(public)", "app/(marketing)/packages", "app/(marketing)/compare-packages", "app/(marketing)/evidence",
    "app/(marketing)/checkout", "app/components", "components", "content/homepage.content.ts", "content/compare-packages.content.ts",
    "content/evidence", "content/knowledge", "content/package-catalog.ts", "lib/cms/fallback.ts", "lib/seo"];
  const files: string[] = [];
  const walk = (path: string) => {
    const full = resolve(process.cwd(), path);
    if (statSync(full).isDirectory()) { for (const name of readdirSync(full)) walk(join(path, name)); return; }
    if (/\.(tsx?|md|json)$/.test(path) && !/\.test\.ts$/.test(path)) files.push(path);
  };
  roots.forEach(walk);
  return files;
}

test("no superseded or placeholder Mason facts in any public-facing source", () => {
  const forbidden: Array<[RegExp, string]> = [
    [/₹\s?30,000|₹\s?37,000/, "superseded package price"],
    [/1-Year Safety Check-?Up/i, "superseded Advanced proposition"],
    [/care@masoncompany\.in/i, "obsolete contact email"],
    [/98765\s?43210|98200\s?12345/, "placeholder phone number"],
    [/\bAegis\b/, "internal codename instead of the Mason brand"],
    [/(Mumbai|Bangalore|Bengaluru)\s+(and|&|&amp;)\s+Goa|Goa\s+(and|&|&amp;)\s+(Mumbai|Bangalore|Bengaluru)/i, "service area beyond Goa"]
  ];
  const sources = publicSources();
  assert.ok(sources.length > 40, `scanned ${sources.length} files`);
  for (const file of sources) {
    const text = read(file);
    for (const [pattern, why] of forbidden) assert.doesNotMatch(text, pattern, `${file}: ${why}`);
  }
});

test("the retired pre-launch content migration can no longer write its superseded facts to Sanity", async () => {
  await assert.rejects(runMigration(["--apply", "--backup-dir", "/tmp/never-used"]), { message: PRERNA_MIGRATION_RETIRED_MESSAGE });
});
