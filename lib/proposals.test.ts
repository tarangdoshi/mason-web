import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PROPOSAL_COMPONENTS } from "./proposals/components";
import { proposalsEnabled } from "./proposals/flag";
import {
  draftProblem, displayNameProblem, formatRupees, initialItems, overridePayload, pricingKey, rupeesToPaise, toApiItems, type BuilderDraft
} from "./proposals/builder";
import { componentSeeds, PENDING, seedProblems, templateSeed, type TemplateSeed } from "../content/proposals/seed";
import { componentLibrary, proposalTemplate } from "../sanity/schemaTypes/proposals";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("the 14 proposal components match the founder-approved catalogue names and order exactly", () => {
  const catalogue = read("docs/PRODUCT_CATALOGUE_2026-10-13.md");
  const rows = [...catalogue.matchAll(/^\| `([a-z0-9-]+)` \| ([^|]+?) \| \d+ \|$/gm)].map(([, key, name]) => ({ key, name }));
  assert.equal(rows.length, 14);
  assert.deepEqual(PROPOSAL_COMPONENTS.map((item) => ({ ...item })), rows);
});

test("the flag is off unless exactly 'true'", () => {
  assert.equal(proposalsEnabled(undefined), false);
  assert.equal(proposalsEnabled("false"), false);
  assert.equal(proposalsEnabled("TRUE"), false);
  assert.equal(proposalsEnabled("1"), false);
  assert.equal(proposalsEnabled("true"), true);
});

test("the staff route, nav link and Studio menu are all gated by the flag", () => {
  assert.match(read("app/(crm)/crm/proposals/new/page.tsx"), /if \(!proposalsEnabled\(\)\) notFound\(\);\n  const user = await requireCrmUser\(\);/);
  assert.match(read("app/(crm)/crm/crm-shell.tsx"), /\.\.\.\(proposalsEnabled\(\)\n\s+\? \[\{ key: "proposals"/);
  assert.match(read("sanity.config.ts"), /\.\.\.\(proposalsEnabled\(\)\n\s+\? \[\n\s+S\.divider\(\),\n\s+S\.listItem\(\)\n\s+\.title\("Proposals"\)/);
  assert.match(read("app/(crm)/crm/proposals/actions.ts"), /if \(!proposalsEnabled\(\)\) return \{ error: "Proposals are not enabled\." \}/);
});

test("override is ADMIN-only on the server action, not just hidden in the UI", () => {
  const actions = read("app/(crm)/crm/proposals/actions.ts");
  assert.match(actions, /if \(auth\.user\.role !== "ADMIN"\) return \{ ok: false, error: "Only an admin can override a proposal price\." \};/);
  assert.match(read("app/(crm)/crm/proposals/new/proposal-builder.tsx"), /\{isAdmin && <AdminOverride /);
});

const draft = (patch: Partial<BuilderDraft> = {}): BuilderDraft => ({
  zohoLeadId: "1234567890", displayName: "Mrs Example", proposalDate: "2026-11-21", rooms: 1, items: initialItems(), ...patch
});

test("draft validation mirrors the API: lead ID digits, no contact data in the name, rooms 1..10, one recommended item", () => {
  assert.equal(draftProblem(draft()), null);
  assert.match(draftProblem(draft({ zohoLeadId: "12a" }))!, /Zoho Lead ID/);
  assert.match(displayNameProblem("Call 98765 43210")!, /phone/);
  assert.match(displayNameProblem("a@b.in")!, /email/);
  assert.match(displayNameProblem("  ")!, /Enter/);
  assert.match(draftProblem(draft({ rooms: 11 }))!, /Rooms/);
  assert.match(draftProblem(draft({ items: initialItems().map((item) => ({ ...item, state: "declined" as const })) }))!, /Recommend/);
});

test("items go to the API in the canonical shape with blank variants as null and quantities clamped", () => {
  const items = initialItems();
  items[0] = { ...items[0], qty: 99, variant: "  60 cm " };
  const api = toApiItems(items);
  assert.equal(api.length, 14);
  assert.deepEqual(api[0], { component: "vertical-grab-bars", state: "recommended", qty: 20, variant: "60 cm", tier: "essential" });
  assert.equal(api[1].variant, null);
  assert.notEqual(pricingKey(draft()), pricingKey(draft({ rooms: 2 })));
  assert.equal(pricingKey(draft()), pricingKey(draft({ proposalDate: "2026-12-01", zohoLeadId: "99999" })));
});

test("override needs a reason of 10+ characters and at least one valid amount", () => {
  assert.deepEqual(overridePayload({ essentialRupees: "12,999", addonRupees: "", reason: "Founder discount for referral" }, true),
    { ok: true, payload: { reason: "Founder discount for referral", essentialPaise: 1_299_900 } });
  assert.equal(overridePayload({ essentialRupees: "12999", addonRupees: "", reason: "short" }, true).ok, false);
  assert.equal(overridePayload({ essentialRupees: "", addonRupees: "", reason: "A long enough reason" }, true).ok, false);
  assert.equal(overridePayload({ essentialRupees: "", addonRupees: "20000", reason: "A long enough reason" }, false).ok, false);
  assert.equal(overridePayload({ essentialRupees: "-5", addonRupees: "", reason: "A long enough reason" }, true).ok, false);
  assert.equal(rupeesToPaise("₹13,999"), 1_399_900);
  assert.equal(rupeesToPaise("0"), null);
  assert.equal(formatRupees(1_399_900), "₹13,999");
  assert.equal(formatRupees(null), "—");
});

test("the seed refuses placeholder or empty copy, including an empty disclaimer", () => {
  assert.ok(seedProblems(componentSeeds, templateSeed).length > 0, "placeholder seed must not be writable");
  const filled = Object.fromEntries(PROPOSAL_COMPONENTS.map(({ key }) => [key, { benefitLine: "Benefit", complimentary: false }]));
  const template: TemplateSeed = {
    ...templateSeed,
    pageCopy: { ...templateSeed.pageCopy, headline: "Your bathroom safety plan", intro: "Intro" },
    paymentTerms: ["Pay on completion"], whatHappensNext: [{ title: "We confirm a date" }], disclaimer: "Disclaimer text"
  };
  assert.deepEqual(seedProblems(filled, template), []);
  assert.ok(seedProblems(filled, { ...template, disclaimer: "   " }).includes("disclaimer is empty"));
  assert.ok(seedProblems(filled, { ...template, disclaimer: PENDING }).some((problem) => problem.startsWith("disclaimer")));
  assert.ok(seedProblems({ ...filled, extra: { benefitLine: "x", complimentary: false } }, template).includes("unknown component extra"));
});

type Rule = { required: () => Rule; custom: (fn: (value: unknown, ctx: { document?: Record<string, unknown> }) => unknown) => Rule; [key: string]: unknown };
function customValidators(schema: { fields?: unknown[] }, path: string[]): ((value: unknown, ctx: { document?: Record<string, unknown> }) => unknown)[] {
  let fields = schema.fields as { name: string; fields?: unknown[]; validation?: (rule: Rule) => unknown }[];
  let field: (typeof fields)[number] | undefined;
  for (const name of path) {
    field = fields.find((candidate) => candidate.name === name);
    fields = (field?.fields ?? []) as typeof fields;
  }
  const found: ((value: unknown, ctx: { document?: Record<string, unknown> }) => unknown)[] = [];
  const rule: Rule = new Proxy({} as Rule, {
    get: (_target, prop) => (prop === "custom" ? (fn: (typeof found)[number]) => { found.push(fn); return rule; } : () => rule)
  });
  field?.validation?.(rule);
  return found;
}

test("Sanity: the disclaimer cannot be blank and component names must be the approved name for their key", () => {
  const [disclaimer] = customValidators(proposalTemplate, ["disclaimer"]);
  assert.equal(disclaimer("   ", {}), "Disclaimer is required and cannot be empty.");
  assert.equal(disclaimer("Real text", {}), true);
  const [name] = customValidators(componentLibrary, ["name"]);
  assert.equal(name("Raised Toilet Seat", { document: { key: "raised-toilet-seat" } }), true);
  assert.match(String(name("Raised toilet seat", { document: { key: "raised-toilet-seat" } })), /exactly/);
  assert.equal(name("X", { document: { key: "nope" } }), "Unknown component ID.");
});
