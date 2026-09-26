import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

/* Access rules for the CRM and the embedded Sanity Studio:
   - /crm and its sub-pages: Mason CRM sign-in (unchanged).
   - /crm/content: Sanity Studio, protected by Sanity's own sign-in and project
     permissions — never by Mason CRM sign-in, never by a token in the page. */

const root = process.cwd();
const read = (file: string) => readFileSync(path.join(root, file), "utf8");
const studioDir = "app/(studio)/crm/content/[[...index]]";

function filesUnder(dir: string): string[] {
  const full = path.join(root, dir);
  return readdirSync(full).flatMap((name) => {
    const child = path.join(dir, name);
    return statSync(path.join(root, child)).isDirectory() ? filesUnder(child) : [child];
  });
}

test("/crm pages still require Mason CRM sign-in", () => {
  assert.match(read("app/(crm)/crm/page.tsx"), /await requireCrmUser\(\)/);
  assert.match(read("app/(crm)/crm/leads/[id]/page.tsx"), /await requireCrmUser\(\)/);
  const guard = read("lib/crm.ts");
  assert.match(guard, /export async function requireCrmUser\(\) \{\s*const user = await getCurrentStaffUser\(\);\s*if \(!user\) \{\s*redirect\("\/crm\/login"\);/);
});

test("/crm/content is served by Sanity Studio, outside the CRM sign-in", () => {
  // Exactly one route renders /crm/content, and it is the Studio route.
  const crmContentPages = filesUnder("app/(crm)/crm/content").filter((file) => /(^|\/)page\.tsx$/.test(file));
  assert.deepEqual(crmContentPages, [], "no CRM-guarded page may resolve to /crm/content");
  assert.ok(existsSync(path.join(root, studioDir, "page.tsx")));

  const page = read(`${studioDir}/page.tsx`);
  assert.doesNotMatch(page, /requireCrmUser|requireAdminCrmUser|lib\/crm|getCrmSessionToken/);
  const client = read(`${studioDir}/studio-client.tsx`);
  assert.match(client, /import \{ NextStudio \} from "next-sanity\/studio";/);
  assert.match(client, /<NextStudio config=\{config\} \/>/);
  assert.match(page, /export \{ metadata, viewport \} from "next-sanity\/studio";/, "official Studio metadata (noindex)");
  // The Studio group has no layout of its own and never imports the CRM provider.
  assert.equal(existsSync(path.join(root, "app/(studio)/layout.tsx")), false);
});

test("the Studio bundle carries no server secrets — people sign in with their own Sanity account", () => {
  for (const file of ["sanity.config.ts", "sanity/env.ts", `${studioDir}/page.tsx`, `${studioDir}/studio-client.tsx`]) {
    const source = read(file);
    assert.doesNotMatch(source, /SANITY_API_(READ|WRITE)_TOKEN|SANITY_PREVIEW_SECRET|token\s*:/, file);
    const envVars = [...source.matchAll(/process\.env\.([A-Z0-9_]+)/g)].map((match) => match[1]);
    assert.ok(envVars.every((name) => name.startsWith("NEXT_PUBLIC_SANITY_")), `${file} reads only public Sanity settings: ${envVars}`);
  }
  const config = read("sanity.config.ts");
  assert.match(config, /basePath: "\/crm\/content"/);
});

test("preview still requires a validated Sanity preview secret (unchanged)", () => {
  const route = read("app/api/draft-mode/enable/route.ts");
  assert.match(route, /defineEnableDraftMode\(/);
  assert.match(route, /status: 401/);
});
