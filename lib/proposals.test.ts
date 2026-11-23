import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PROPOSAL_COMPONENTS } from "./proposals/components";
import { proposalsEnabled } from "./proposals/flag";
import {
  draftBody, draftProblem, displayNameProblem, proposalDateValue, formatRupees, initialItems, overridePayload, pricingKey, rupeesToPaise, toApiItems, type BuilderDraft
} from "./proposals/builder";
import { cmoPendingComponents, cmoPlaceholder, componentSeeds, PENDING, seedProblems, templateSeed } from "../content/proposals/seed";
import { plannedDocuments } from "../scripts/seed-proposals";
import { componentLibrary, proposalTemplate } from "../sanity/schemaTypes/proposals";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("the 14 proposal components match the founder-approved catalogue names, order and quantities exactly", () => {
  const catalogue = read("docs/PRODUCT_CATALOGUE_2026-10-13.md");
  const rows = [...catalogue.matchAll(/^\| `([a-z0-9-]+)` \| ([^|]+?) \| (\d+) \|$/gm)].map(([, key, name, qty]) => ({ key, name, defaultQty: Number(qty) }));
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

test("the first save is explicit (no half-typed lead ID) and the seed never overwrites existing documents", () => {
  assert.match(read("app/(crm)/crm/proposals/new/proposal-builder.tsx"), /if \(proposalId === null \|\| problem \|\| inFlight\.current\) return;/);
  const seed = read("scripts/seed-proposals.ts");
  assert.match(seed, /filter\(\(doc\) => !existing\.has/);
  assert.doesNotMatch(seed, /\.patch\(/);
});

test("a failed price is never retried silently, and live totals debounce at about 400 ms", () => {
  const source = read("app/(crm)/crm/proposals/new/proposal-builder.tsx");
  assert.match(source, /export const PRICE_DEBOUNCE_MS = 400;/);
  assert.match(source, /failedKey\.current = key;/);
  assert.match(source, /lastPricedKey\.current = null; \/\/ no priced state remains to restore/);
  assert.match(source, /Price not updated, tap to retry/);
  assert.match(source, /if \(key === failedKey\.current\) \{\n\s+setStatus\(\(current\) => \(current\.kind === "waiting" \? \{ kind: "error"/, "undo after a failure restores the retry state");
  assert.doesNotMatch(source, /void runPricing\(\);\n  \}, \[\]\);/, "no immediate re-run at the end of a round");
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
  assert.equal(api.find((item) => item.component === "drainage-solution")!.qty, 4, "catalogue default quantity");
  assert.equal(initialItems()[0].qty, 3, "catalogue default quantity");
  assert.notEqual(pricingKey(draft()), pricingKey(draft({ rooms: 2 })));
  assert.equal(pricingKey(draft()), pricingKey(draft({ zohoLeadId: "99999" })), "lead ID is fixed after create");
  assert.notEqual(pricingKey(draft()), pricingKey(draft({ proposalDate: "2026-12-01" })), "a date change is saved");
  assert.equal(draftBody(draft()).proposalDate, "2026-11-21");
  assert.equal(draftBody(draft({ proposalDate: "" })).proposalDate, null);
  assert.equal(proposalDateValue("2026-13-45"), null);
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

test("the seed holds the approved copy: 5 benefit lines, 9 CMO placeholders, Safety Add-on, full disclaimer", () => {
  assert.deepEqual(seedProblems(componentSeeds, templateSeed), []);
  assert.deepEqual(cmoPendingComponents(componentSeeds).sort(), PROPOSAL_COMPONENTS.map(({ key }) => key)
    .filter((key) => !["vertical-grab-bars", "angled-grab-bar", "anti-slip-coating", "two-way-lock", "emergency-key-box"].includes(key)).sort());
  assert.equal(componentSeeds["two-way-lock"].benefitLine, "Privacy from inside, with a door family can open from outside if needed.");
  assert.equal(templateSeed.addonName, "Safety Add-on");
  assert.deepEqual(Object.entries(componentSeeds).filter(([, seed]) => seed.complimentary).map(([key]) => key).sort(), ["drainage-solution", "slippers-one"]);
  assert.match(templateSeed.disclaimer, /^Mason Company bathroom safety upgrades are preventive support measures\./);
  assert.equal(templateSeed.whatHappensNext.length, 3);
  // The copy source must stay free of customer data: only the template placeholders appear in braces.
  assert.doesNotMatch(JSON.stringify(templateSeed), /Mrs |Mr |\+91|\d{10}|@/);
});

test("the seed refuses missing copy, an empty disclaimer, unknown placeholders and CMO markers outside benefit lines", () => {
  assert.ok(seedProblems(componentSeeds, { ...templateSeed, disclaimer: "   " }).includes("disclaimer is empty"));
  assert.ok(seedProblems(componentSeeds, { ...templateSeed, disclaimer: PENDING }).some((problem) => problem.startsWith("disclaimer")));
  assert.ok(seedProblems(componentSeeds, { ...templateSeed, addonName: "" }).includes("addonName is empty"));
  assert.ok(seedProblems(componentSeeds, { ...templateSeed, optionsPage: { ...templateSeed.optionsPage, eyebrow: "Prepared for {name}" } })
    .includes("optionsPage.eyebrow uses unknown placeholder {name}"));
  assert.ok(seedProblems(componentSeeds, { ...templateSeed, signoff: cmoPlaceholder("x") }).some((problem) => problem.startsWith("signoff holds a CMO placeholder")));
  assert.ok(seedProblems({ ...componentSeeds, extra: { benefitLine: "x", complimentary: false } }, templateSeed).includes("unknown component extra"));
});

test("planned seed documents are drafts only, with keyed arrays", () => {
  const docs = plannedDocuments();
  assert.equal(docs.length, 15);
  assert.ok(docs.every((doc) => doc._id.startsWith("drafts.")));
  const template = docs.find((doc) => doc._type === "proposalTemplate") as unknown as { _id: string; whatHappensNext: { _key: string }[] };
  assert.equal(template._id, "drafts.proposalTemplate-v1");
  assert.deepEqual(template.whatHappensNext.map((step) => step._key), ["step-1", "step-2", "step-3"]);
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

test("Sanity: the disclaimer cannot be blank, CMO placeholders cannot be published, names must be exact", () => {
  const [, cmo] = customValidators(componentLibrary, ["benefitLine"]);
  assert.match(String(cmo(cmoPlaceholder("Soft Corner Guards"), {})), /CMO/);
  assert.equal(cmo("Real benefit.", {}), true);
  const [, placeholder] = customValidators(proposalTemplate, ["optionsPage", "eyebrow"]);
  assert.match(String(placeholder("Prepared for {name}", {})), /Unknown placeholder \{name\}/);
  assert.equal(placeholder("Prepared for {customerName}", {}), true);
  const [disclaimer] = customValidators(proposalTemplate, ["disclaimer"]);
  assert.equal(disclaimer("   ", {}), "Disclaimer is required and cannot be empty.");
  assert.equal(disclaimer("Real text", {}), true);
  const [name] = customValidators(componentLibrary, ["name"]);
  assert.equal(name("Raised Toilet Seat", { document: { key: "raised-toilet-seat" } }), true);
  assert.match(String(name("Raised toilet seat", { document: { key: "raised-toilet-seat" } })), /exactly/);
  assert.equal(name("X", { document: { key: "nope" } }), "Unknown component ID.");
});
