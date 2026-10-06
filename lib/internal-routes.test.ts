import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import robots from "../app/robots";
import sitemap from "../app/sitemap";

// Staff-only pages (campaign/communications pack, field SOP and technician readiness) must not be
// public: CRM login required, noindex, out of the sitemap and disallowed for crawlers. /evidence is
// customer-facing education (linked from the homepage and package pages) and stays public.
const INTERNAL_PAGES = {
  "/communications": "app/(marketing)/communications/page.tsx",
  "/operations/technician-readiness": "app/(marketing)/operations/technician-readiness/page.tsx"
};
const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");

test("internal pages require a CRM staff session before rendering and are never indexed", () => {
  for (const [route, file] of Object.entries(INTERNAL_PAGES)) {
    const source = read(file);
    assert.match(source, /import \{ requireCrmUser \} from "(\.\.\/)+lib\/crm";/, route);
    assert.match(source, /export default async function \w+\(\) \{\n  await requireCrmUser\(\);/, `${route}: guard is the first statement`);
    assert.match(source, /export const metadata: Metadata = \{ robots: \{ index: false, follow: false \} \};/, route);
  }
});

test("sitemap lists public pages only, including /evidence", () => {
  const urls = sitemap().map((entry) => new URL(entry.url).pathname);
  for (const route of Object.keys(INTERNAL_PAGES)) assert.ok(!urls.some((url) => url.startsWith(route)), route);
  assert.ok(!urls.some((url) => url.startsWith("/operations") || url.startsWith("/crm") || url.startsWith("/admin")));
  for (const route of ["/", "/packages", "/packages/standard", "/packages/advanced", "/evidence", "/contact", "/privacy", "/terms"]) {
    assert.ok(urls.includes(route), route);
  }
});

test("robots disallows internal areas in Production and keeps public pages crawlable", () => {
  const previous = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "production";
  try {
    const all = robots().rules;
    const rules = (Array.isArray(all) ? all : [all]).find((group) => group.userAgent === "*") as { allow: string; disallow: string[] };
    assert.equal(rules.allow, "/");
    for (const path of ["/admin", "/api", "/crm", "/content-preview", "/communications", "/operations"]) assert.ok(rules.disallow.includes(path), path);
    assert.ok(!rules.disallow.some((path) => "/evidence".startsWith(path) || "/packages".startsWith(path)));
  } finally {
    if (previous === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = previous;
  }
});

test("/evidence stays a public page with no staff guard", () => {
  const source = read("app/(marketing)/evidence/page.tsx");
  assert.doesNotMatch(source, /requireCrmUser|index: false/);
});
