import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { componentSeeds, templateSeed } from "../content/proposals/seed";
import { initialItems, type BuilderDraft } from "./proposals/builder";
import type { ProposalContent } from "./proposals/document";
import { isLostReason, LOST_REASONS, lostProblem, lostReasonLabel } from "./proposals/lost";
import { isOfflineBundle, localDocument, priceLocally, type OfflineBundle } from "./proposals/offline/bundle";
import { enqueue, isLocalRef, memoryStore, newLocalRef, PRICE_CHANGED, syncQueue, type Executors, type OpResult } from "./proposals/offline/queue";
import { photoSources, timeoutSignal } from "./proposals/photos";
import { DEFAULT_PRICING_CONFIG, isPriceList, isPricingConfig, priceProposal, PricingError, type PriceList, type PricingConfig, type PricingItem } from "./proposals/pricing";

/* Proposal Builder Phase 3 (web): offline pricing, the offline queue, Lost, photo formats, the service worker.
   Synthetic data only. */

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

type FixtureCase = { name: string; items: PricingItem[]; config: PricingConfig | null; expected?: unknown; error?: string };
const fixture = JSON.parse(read("lib/proposals/fixtures/pricing-cases.json")) as { source: string; priceList: PriceList; cases: FixtureCase[] };

test("local pricing engine reproduces every case of the shared fixture (outputs of the mason-api engine)", () => {
  assert.match(fixture.source, /mason-api src\/proposals\/pricing\.ts @ [0-9a-f]{7}/);
  assert.ok(fixture.cases.length >= 15);
  assert.ok(fixture.cases.some((item) => item.error) && fixture.cases.some((item) => item.expected));
  for (const item of fixture.cases) {
    const run = () => priceProposal(item.items, fixture.priceList, item.config ?? DEFAULT_PRICING_CONFIG);
    if (item.error) {
      assert.throws(run, (error: unknown) => error instanceof PricingError && error.code === item.error, item.name);
    } else {
      assert.deepEqual(JSON.parse(JSON.stringify(run())), item.expected, item.name);
    }
  }
});

test("price list and config shape checks", () => {
  assert.equal(isPriceList(fixture.priceList), true);
  assert.equal(isPriceList({ version: "x", entries: [{ component: "a", variant: null, unitPaise: -1 }] }), false);
  assert.equal(isPriceList({ version: "x", entries: [{ component: "a", variant: null, unitPaise: 1.5 }] }), false);
  assert.equal(isPricingConfig(DEFAULT_PRICING_CONFIG), true);
  assert.equal(isPricingConfig({ manpower: { kind: "percent", amountPaise: 1 }, roundUpStepPaise: 100_000 }), false);
});

const content: ProposalContent = {
  template: templateSeed,
  components: Object.fromEntries(Object.entries(componentSeeds).map(([key, seed]) => [key, { benefitLine: seed.benefitLine, photoUrl: null }]))
};
const bundle: OfflineBundle = { staff: { id: "s1", role: "AGENT" }, content, priceList: fixture.priceList, pricing: DEFAULT_PRICING_CONFIG, fetchedAt: "2026-11-24T10:00:00.000Z" };
const draft = (patch: Partial<BuilderDraft> = {}): BuilderDraft => ({
  zohoLeadId: "1234567", displayName: "Mrs Example", proposalDate: "2026-11-24", rooms: 1,
  items: initialItems().map((item) => ({ ...item, state: "declined" as const })).map((item) =>
    item.component === "anti-slip-coating" ? { ...item, state: "recommended" as const }
      : item.component === "two-way-lock" ? { ...item, state: "recommended" as const, tier: "addon" as const } : item),
  ...patch
});

test("offline: priced on the tablet exactly as the engine prices the API body; the document matches", () => {
  const priced = priceLocally(draft(), bundle);
  assert.equal(priced.ok, true);
  if (!priced.ok) return;
  const direct = priceProposal([{ component: "anti-slip-coating", state: "recommended", qty: 1, variant: null, tier: "essential" }, { component: "two-way-lock", state: "recommended", qty: 1, variant: null, tier: "addon" }], fixture.priceList);
  assert.equal(priced.result.essentialTotalPaise, direct.essentialTotalPaise);
  assert.equal(priced.result.addonTotalPaise, direct.addonTotalPaise);
  const doc = localDocument(draft(), priced.result, content, "draft");
  assert.equal(doc.customerName, "Mrs Example");
  assert.deepEqual(doc.essential.map((item) => item.key), ["anti-slip-coating"]);
  assert.deepEqual(doc.addon.map((item) => item.key), ["two-way-lock"]);
  assert.match(doc.essentialPrice, /^₹\d/);
  // An override replaces the totals on the document, as on the server.
  const overridden = localDocument(draft(), priced.result, content, "draft", { essentialPaise: 1_234_500 });
  assert.equal(overridden.essentialPrice, "₹12,345");
});

test("offline: no price list, or a variant the list does not have, is a clear refusal (never a guess)", () => {
  assert.deepEqual(priceLocally(draft(), { ...bundle, priceList: null }), { ok: false, error: "Offline pricing needs the price list. Connect once to download it." });
  const unknown = priceLocally(draft({ items: draft().items.map((item) => (item.component === "anti-slip-coating" ? { ...item, variant: "Gold" } : item)) }), bundle);
  assert.equal(unknown.ok, false);
  assert.equal(isOfflineBundle(bundle), true);
  assert.equal(isOfflineBundle({ staff: { id: "s1", role: "OWNER" }, fetchedAt: "x" }), false);
});

function recorder(script: Partial<Record<string, OpResult[]>> = {}) {
  const calls: string[] = [];
  const next = (kind: string, fallback: OpResult) => script[kind]?.shift() ?? fallback;
  const executors: Executors = {
    async save(id, d) { calls.push(`save:${id ?? "new"}:${d.rooms}`); return next("save", { status: "done", id: id ?? "srv-1", data: { ok: true } }); },
    async share(id) { calls.push(`share:${id}`); return next("share", { status: "done", data: { shareUrl: "https://example.test/p/x" } }); },
    async accept(id, option) { calls.push(`accept:${id}:${option}`); return next("accept", { status: "done", data: { commercialCaseId: "case-1" } }); },
    async lost(id, reason) { calls.push(`lost:${id}:${reason}`); return next("lost", { status: "done" }); }
  };
  return { calls, executors };
}

test("queue: offline saves coalesce into one; share and accept follow in order; each syncs exactly once", async () => {
  const store = memoryStore();
  const ref = newLocalRef(() => "abc");
  assert.equal(isLocalRef(ref), true);
  for (const rooms of [1, 2, 3]) await enqueue(store, { kind: "save", ref, draft: draft({ rooms }) });
  await enqueue(store, { kind: "share", ref });
  await enqueue(store, { kind: "accept", ref, option: "essential_addon" });
  assert.equal((await store.ops()).length, 3);
  const { calls, executors } = recorder();
  const events: string[] = [];
  const outcome = await syncQueue(store, executors, { onDone: (event) => events.push(`${event.op.kind}:${event.serverId}`) });
  assert.deepEqual(outcome, { state: "idle", done: 3, remaining: 0 });
  assert.deepEqual(calls, ["save:new:3", "share:srv-1", "accept:srv-1:essential_addon"]);
  assert.deepEqual(events, ["save:srv-1", "share:srv-1", "accept:srv-1"]);
  // A second sync (another online event, another tab) sends nothing again.
  assert.deepEqual(await syncQueue(store, executors), { state: "idle", done: 0, remaining: 0 });
  assert.equal(calls.length, 3);
});

test("queue: a save queued after a share is kept separate (never merged across a later op)", async () => {
  const store = memoryStore();
  await enqueue(store, { kind: "save", ref: "local:a", draft: draft({ rooms: 1 }) });
  await enqueue(store, { kind: "share", ref: "local:a" });
  await enqueue(store, { kind: "save", ref: "local:a", draft: draft({ rooms: 2 }) });
  assert.deepEqual((await store.ops()).map((op) => op.kind), ["save", "share", "save"]);
});

test("queue: losing the signal mid-sync keeps the rest; a create that went through is never repeated", async () => {
  const store = memoryStore();
  await enqueue(store, { kind: "save", ref: "local:a", draft: draft() });
  await enqueue(store, { kind: "share", ref: "local:a" });
  // The create succeeded but the price step hit a passing server error: the id comes back with "offline".
  const first = recorder({ save: [{ status: "offline", id: "srv-9" }] });
  assert.deepEqual(await syncQueue(store, first.executors), { state: "offline", done: 0, remaining: 2 });
  assert.equal(await store.serverId("local:a"), "srv-9");
  const second = recorder({ save: [{ status: "done", id: "srv-9" }], share: [{ status: "offline" }] });
  assert.deepEqual(await syncQueue(store, second.executors), { state: "offline", done: 1, remaining: 1 });
  assert.deepEqual(second.calls, ["save:srv-9:1", "share:srv-9"]); // PATCH the existing draft, no second create
  const third = recorder();
  assert.deepEqual(await syncQueue(store, third.executors), { state: "idle", done: 1, remaining: 0 });
  assert.deepEqual(third.calls, ["share:srv-9"]);
});

test("queue: a network exception counts as offline; a refusal stops the queue until retried or discarded", async () => {
  const store = memoryStore();
  await enqueue(store, { kind: "save", ref: "srv-2", draft: draft() });
  await enqueue(store, { kind: "lost", ref: "srv-2", reason: "price", note: "" });
  const throwing: Executors = { ...recorder().executors, save: async () => { throw new TypeError("Failed to fetch"); } };
  assert.equal((await syncQueue(store, throwing)).state, "offline");
  const refused = recorder({ save: [{ status: "failed", error: "Choose a variant for vertical-grab-bars." }] });
  assert.deepEqual(await syncQueue(store, refused.executors), { state: "failed", done: 0, remaining: 2, error: "Choose a variant for vertical-grab-bars." });
  // Without a retry the refused op is not sent again.
  const idle = recorder();
  assert.equal((await syncQueue(store, idle.executors)).state, "failed");
  assert.deepEqual(idle.calls, []);
  assert.deepEqual(await syncQueue(store, idle.executors, { retryFailed: true }), { state: "idle", done: 2, remaining: 0 });
  assert.deepEqual(idle.calls, ["save:srv-2:1", "lost:srv-2:price"]);
});

test("queue: share/accept for a proposal that was never saved are refused, not sent", async () => {
  const store = memoryStore();
  await enqueue(store, { kind: "share", ref: "local:never" });
  const { calls, executors } = recorder();
  assert.equal((await syncQueue(store, executors)).state, "failed");
  assert.deepEqual(calls, []);
});

test("queue: an edit made while its save is being sent is kept and sent next, never lost (review finding 1)", async () => {
  const store = memoryStore();
  await enqueue(store, { kind: "save", ref: "local:a", draft: draft({ rooms: 1 }) });
  await enqueue(store, { kind: "share", ref: "local:a" });
  const sent: number[] = [];
  const executors: Executors = {
    ...recorder().executors,
    async save(id, d) {
      sent.push(d.rooms);
      // Staff edit while the first save is on the wire: the queued save takes the newer draft.
      if (sent.length === 1) await enqueue(store, { kind: "save", ref: "local:a", draft: draft({ rooms: 2 }) });
      return { status: "done", id: id ?? "srv-1", data: { ok: true } };
    }
  };
  // A share is queued behind the save, so the edit is appended after the share rather than merged: still sent.
  const outcome = await syncQueue(store, executors);
  assert.equal(outcome.state, "idle");
  assert.deepEqual(sent, [1, 2]);
  assert.deepEqual(await store.ops(), []);
});

test("queue: an edit merged into the save in flight is sent again before anything else of that proposal", async () => {
  const store = memoryStore();
  await enqueue(store, { kind: "save", ref: "local:b", draft: draft({ rooms: 1 }) });
  const order: string[] = [];
  const base = recorder().executors;
  const executors: Executors = {
    ...base,
    async save(id, d) {
      order.push(`save:${id ?? "new"}:${d.rooms}`);
      if (order.length === 1) {
        await enqueue(store, { kind: "save", ref: "local:b", draft: draft({ rooms: 3 }) }); // merges (same op, new version)
        assert.equal((await store.ops()).length, 1);
      }
      return { status: "done", id: id ?? "srv-2", data: { ok: true } };
    }
  };
  assert.equal((await syncQueue(store, executors)).state, "idle");
  assert.deepEqual(order, ["save:new:1", "save:srv-2:3"]); // second time a PATCH of the newer draft, no second create
});

test("queue: a refusal holds back only that proposal; other proposals still sync (review finding 6)", async () => {
  const store = memoryStore();
  await enqueue(store, { kind: "lost", ref: "srv-a", reason: "price", note: "" });
  await enqueue(store, { kind: "save", ref: "srv-a", draft: draft({ rooms: 2 }) });
  await enqueue(store, { kind: "save", ref: "srv-b", draft: draft({ rooms: 4 }) });
  const { calls, executors } = recorder({ lost: [{ status: "failed", error: "Marking a proposal lost is not available on the server yet." }] });
  const outcome = await syncQueue(store, executors);
  assert.equal(outcome.state, "failed");
  assert.deepEqual(calls, ["lost:srv-a:price", "save:srv-b:4"]);
  assert.deepEqual((await store.ops()).map((op) => `${op.kind}:${op.ref}`), ["lost:srv-a", "save:srv-a"]);
});

test("queue: when the server prices differently from the tablet, the queued share and accept wait (review finding 3)", async () => {
  const store = memoryStore();
  await enqueue(store, { kind: "save", ref: "local:c", draft: draft(), expected: { essentialPaise: 1_399_900, addonPaise: null } });
  await enqueue(store, { kind: "share", ref: "local:c" });
  await enqueue(store, { kind: "accept", ref: "local:c", option: "essential" });
  const { calls, executors } = recorder({ save: [{ status: "done", id: "srv-c", totals: { essentialPaise: 1_499_900, addonPaise: null } }] });
  assert.deepEqual(await syncQueue(store, executors), { state: "failed", done: 1, remaining: 2, error: PRICE_CHANGED });
  assert.deepEqual(calls, ["save:new:1"]); // nothing shared at a price the family did not see
  // Staff checked the new price with the family and tap Try again: share and accept go.
  assert.equal((await syncQueue(store, executors, { retryFailed: true })).state, "idle");
  assert.deepEqual(calls, ["save:new:1", "share:srv-c", "accept:srv-c:essential"]);
});

test("queue: same totals on the server → share and accept go straight through", async () => {
  const store = memoryStore();
  await enqueue(store, { kind: "save", ref: "local:d", draft: draft(), expected: { essentialPaise: 1_399_900, addonPaise: null } });
  await enqueue(store, { kind: "share", ref: "local:d" });
  const { calls, executors } = recorder({ save: [{ status: "done", id: "srv-d", totals: { essentialPaise: 1_399_900, addonPaise: null } }] });
  assert.equal((await syncQueue(store, executors)).state, "idle");
  assert.deepEqual(calls, ["save:new:1", "share:srv-d"]);
});

test("queue: a throw is reported as such (an out-of-date page after a deploy), a server 'retry later' is not", async () => {
  const store = memoryStore();
  await enqueue(store, { kind: "save", ref: "srv-e", draft: draft() });
  const throwing: Executors = { ...recorder().executors, save: async () => { throw new Error("Failed to find Server Action"); } };
  assert.deepEqual(await syncQueue(store, throwing), { state: "offline", done: 0, remaining: 1, thrown: true });
  const later = recorder({ save: [{ status: "offline" }] });
  assert.deepEqual(await syncQueue(store, later.executors), { state: "offline", done: 0, remaining: 1 });
});

test("accept is refused for non-admins before anything is sent; network failures are passing (review findings 2, 6)", () => {
  const actions = read("app/(crm)/crm/proposals/actions.ts");
  assert.match(actions, /if \(auth\.user\.role !== "ADMIN"\) return \{ ok: false, error: ACCEPT_ADMIN_ONLY \};/);
  assert.match(actions, /return !\(error instanceof ApiError\) \|\| error\.status >= 500 \|\| error\.status === 429;/);
  const builder = read("app/(crm)/crm/proposals/new/proposal-builder.tsx");
  assert.match(builder, /if \(!isAdmin\) return ACCEPT_ADMIN_ONLY;\n\s+setDeciding\(true\);/, "checked before the share");
  assert.match(builder, /blockedReason=\{!isAdmin \? ACCEPT_ADMIN_ONLY : null\}/);
});

test("lost: picklist (CMO to refine) and note rules", () => {
  assert.deepEqual(LOST_REASONS.map((reason) => reason.key), ["price", "timing", "family_decision", "not_needed", "other"]);
  assert.equal(isLostReason("price"), true);
  assert.equal(isLostReason("cheaper"), false);
  assert.equal(lostReasonLabel("family_decision"), "Family decision");
  assert.equal(lostProblem("price", ""), null);
  assert.equal(lostProblem("other", ""), "Say briefly why (at least 5 characters).");
  assert.equal(lostProblem("other", "Moved house"), null);
  assert.equal(lostProblem("", "x"), "Choose a reason.");
  assert.equal(lostProblem("timing", "call 98765 43210"), "Leave phone numbers and emails out of the note.");
  assert.equal(lostProblem("timing", "x".repeat(501)), "Keep the note to 500 characters.");
});

test("photos: explicit WebP source and a JPEG fallback for Sanity images; others unchanged", () => {
  const sanity = "https://cdn.sanity.io/images/p/production/abc-320x320.png?w=320&h=320&fit=crop&auto=format";
  const sources = photoSources(sanity);
  assert.match(sources.jpeg, /fm=jpg/);
  assert.doesNotMatch(sources.jpeg, /auto=format/);
  assert.match(sources.webp ?? "", /fm=webp/);
  assert.deepEqual(photoSources("/apple-icon.png"), { webp: null, jpeg: "/apple-icon.png" });
  assert.deepEqual(photoSources("data:image/png;base64,AAAA"), { webp: null, jpeg: "data:image/png;base64,AAAA" });
  assert.equal(timeoutSignal(1_000).aborted, false);
  assert.doesNotMatch(read("lib/proposals/content.ts"), /auto=format/);
  assert.match(read("lib/proposals/pdf.ts"), /photoSources\(url\)\.jpeg/);
  assert.doesNotMatch(read("lib/proposals/pdf.ts"), /AbortSignal\.timeout/);
});

test("service worker: two narrow scopes, caches named for logout, one customer page at most", () => {
  const sw = read("public/proposals-sw.js");
  const register = read("components/proposals/RegisterProposalsWorker.tsx");
  assert.match(register, /scope: "\/crm\/proposals\/" \| "\/p\/"/);
  assert.match(read("app/(crm)/crm/proposals/new/page.tsx"), /<RegisterProposalsWorker scope="\/crm\/proposals\/" \/>/);
  assert.match(read("app/p/[token]/page.tsx"), /<RegisterProposalsWorker scope="\/p\/" \/>/);
  for (const name of sw.match(/`mason-proposals-[a-z]+-\$\{VERSION\}`/g) ?? []) assert.match(name, /^`mason-proposals-/);
  assert.match(sw, /await caches\.delete\(OPEN\)/); // replaced, never accumulated
  assert.match(sw, /request\.method !== "GET"/); // server actions (POST) are never cached
  assert.match(sw, /type === "clear"/);
  assert.match(read("lib/proposals/offline/idb.ts"), /SW_CACHE_PREFIX = "mason-proposals-"/);
  assert.match(read("app/(crm)/crm/crm-shell.tsx"), /clearOfflineData/);
  assert.match(read("app/(crm)/crm/crm-shell.tsx"), /if \(!\(await hasOfflineData\(\)\)\)/, "cleared on sign-out flag on or off");
  assert.match(sw, /ignoreVary: true/);
  const manifest = JSON.parse(read("public/proposals.webmanifest")) as { scope: string; start_url: string; icons: { sizes: string }[] };
  assert.equal(manifest.scope, "/crm/proposals/");
  assert.equal(manifest.start_url, "/crm/proposals/new");
  assert.deepEqual(manifest.icons.map((icon) => icon.sizes), ["192x192", "512x512"]);
});

test("offline bundle route: flag-gated, signed-in only, no customer data", () => {
  const route = read("app/(crm)/crm/proposals/offline-bundle/route.ts");
  assert.match(route, /if \(!proposalsEnabled\(\)\) return new NextResponse\(null, \{ status: 404 \}\)/);
  assert.match(route, /status: 401/);
  assert.match(route, /private, no-store/);
  assert.doesNotMatch(route, /displayName|zohoLeadId|email|fullName/);
});
