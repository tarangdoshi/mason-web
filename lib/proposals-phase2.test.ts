import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { componentSeeds, templateSeed } from "../content/proposals/seed";
import { CMO_PLACEHOLDER_PREFIX as SCHEMA_CMO_PREFIX } from "../sanity/schemaTypes/proposals";
import {
  APPROVED_DISCLAIMER, buildProposalDoc, cardBody, documentDensity, formatPrice, formatProposalDate, isProposalView, optionLine,
  pdfFilename, SHARE_TOKEN_PATTERN, variantSummary, viewFromStaffProposal, type ProposalContent, type ProposalView, type ProposalViewItem
} from "./proposals/document";
import { restoreFontSizes } from "./proposals/pdf";
import { CMO_PLACEHOLDER_PREFIX } from "./proposals/placeholders";
import { doNotTrack, eventsUrl, HEARTBEAT_MS, MAX_VIEW_MS, sendViewerEvent, startHeartbeat } from "./proposals/viewer-events";

/* Proposal Builder Phase 2 (web): the customer document, viewer events, PDF helpers. Synthetic data only. */

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const content: ProposalContent = {
  template: templateSeed,
  components: Object.fromEntries(Object.entries(componentSeeds).map(([key, seed]) => [key, { benefitLine: seed.benefitLine, photoUrl: null }]))
};
const row = (component: string, tier: "essential" | "addon", qty = 1, variant: string | null = null, complimentary = false): ProposalViewItem =>
  ({ component, state: "recommended", tier, qty, variant, complimentary });
/** Golden quote B (docs/proposals/golden-quotes.md), made-up name. */
const quoteB: ProposalView = {
  displayName: "Mrs Example",
  proposalDate: "2026-11-20",
  rooms: 1,
  status: "shared",
  totals: { essentialPaise: 1_399_900, addonPaise: 1_699_900 },
  items: [
    row("vertical-grab-bars", "essential", 1, "Short"), row("vertical-grab-bars", "essential", 1, "Long"), row("angled-grab-bar", "essential"),
    row("anti-slip-coating", "essential"), row("two-way-lock", "addon"), row("emergency-key-box", "addon"),
    { ...row("raised-toilet-seat", "essential"), state: "declined" }, { ...row("folding-bar", "essential"), state: "present" }
  ]
};

test("prices and dates are formatted the same on server and browser", () => {
  assert.equal(formatPrice(1_399_900), "₹13,999");
  assert.equal(formatPrice(12_345_678_900), "₹12,34,56,789");
  assert.equal(formatPrice(99_900), "₹999");
  assert.equal(formatProposalDate("2026-11-20"), "20 November 2026");
  assert.equal(formatProposalDate("2026-01-05"), "5 January 2026");
  assert.equal(pdfFilename("2026-11-20"), "Mason-Proposal-2026-11-20.pdf");
  assert.equal(pdfFilename("Mrs Example"), "Mason-Proposal-proposal.pdf"); // never the customer name
});

test("quote B builds the approved document: grouped variants, add-on without prices, placeholders filled", () => {
  const doc = buildProposalDoc(quoteB, content);
  assert.deepEqual(doc.essential.map(optionLine), ["Vertical grab bars × 2 (1 short, 1 long)", "L-shaped Shower grab bar", "Nanotechnology anti-slip surface treatment"]);
  assert.deepEqual(doc.addon.map((item) => item.name), ["Two-way lock", "Emergency Key box"]);
  assert.equal(doc.complimentary.length, 0);
  assert.equal(doc.essentialPrice, "₹13,999");
  assert.equal(doc.addonPrice, "₹16,999");
  assert.equal(doc.copy.optionsPage.eyebrow, "Prepared for Mrs Example");
  assert.equal(doc.copy.optionsPage.headerLabel, "Proposal · 20 November 2026");
  assert.equal(doc.copy.optionsPage.addonTitle, "Essential + Safety Add-on");
  assert.equal(cardBody(doc.essential[0]), "1 short and 1 long. Support at key standing and movement points.");
  assert.equal(doc.disclaimer, APPROVED_DISCLAIMER);
  assert.equal(documentDensity(doc), "regular");
  // Declined and already-present items never reach the customer.
  assert.ok(!JSON.stringify(doc).includes("Raised Toilet Seat"));
  assert.ok(!JSON.stringify(doc).includes("Flip-up Toilet support bar"));
  assert.ok(!/\{(customerName|date|essentialPrice|addonPrice|addonName)\}/.test(JSON.stringify(doc.copy)));
});

test("complimentary items are separated; CMO placeholders never reach the page; the disclaimer is never blank", () => {
  const view: ProposalView = { ...quoteB, items: [row("folding-bar", "essential"), row("slippers-one", "essential", 1, null, true), row("drainage-solution", "essential", 4, null, true)] };
  const doc = buildProposalDoc(view, { ...content, template: { ...templateSeed, disclaimer: "   " } });
  assert.deepEqual(doc.complimentary.map(optionLine), ["Drainage clearance × 4", "EVA non-slip Bathroom slippers"]);
  assert.equal(doc.essential[0].benefit, null); // "CMO TO WRITE: …" is dropped, not shown
  assert.ok(doc.missingBenefitLines.includes("Flip-up Toilet support bar"));
  assert.equal(doc.disclaimer, APPROVED_DISCLAIMER);
  assert.ok(!JSON.stringify(doc).includes("CMO TO WRITE"));
});

test("no add-on total means one option and no add-on page content; an unpriced proposal is refused", () => {
  const doc = buildProposalDoc({ ...quoteB, totals: { essentialPaise: 899_900, addonPaise: null } }, content);
  assert.equal(doc.addonPrice, null);
  assert.deepEqual(doc.addon, []);
  assert.throws(() => buildProposalDoc({ ...quoteB, totals: { essentialPaise: null, addonPaise: null } }, content));
});

test("variant summaries and long proposals", () => {
  assert.equal(variantSummary([{ qty: 2, variant: "Short" }, { qty: 1, variant: "Long" }]), "2 short, 1 long");
  assert.equal(variantSummary([{ qty: 1, variant: null }]), null);
  const everything = buildProposalDoc({ ...quoteB, items: componentKeys().map((key) => row(key, "essential")) }, content);
  assert.equal(documentDensity(everything), "compact");
});

function componentKeys() {
  return Object.keys(componentSeeds);
}

test("staff view mirrors the API's public view: lines pair with recommended items, override applied", () => {
  const view = viewFromStaffProposal({
    displayName: "Mrs Example",
    proposalDate: null,
    rooms: 2,
    status: "DRAFT",
    items: [
      { component: "vertical-grab-bars", state: "recommended", tier: "essential", qty: 1, variant: "Short" },
      { component: "folding-bar", state: "declined", tier: "essential", qty: 1 },
      { component: "slippers-one", state: "recommended", tier: "essential", qty: 1 }
    ],
    priceSnapshot: { lines: [{ component: "vertical-grab-bars", variant: "Short", complimentary: false }, { component: "slippers-one", variant: null, complimentary: true }] },
    essentialTotalPaise: 1_000_000,
    addonTotalPaise: 1_200_000,
    override: { essentialPaise: 900_000 }
  }, "2026-11-23");
  assert.equal(view.proposalDate, "2026-11-23");
  assert.deepEqual(view.totals, { essentialPaise: 900_000, addonPaise: 1_200_000 });
  assert.deepEqual(view.items.map((item) => item.complimentary), [false, false, true]);
  assert.equal(isProposalView(view), true);
  assert.equal(isProposalView({ displayName: "x" }), false);
});

test("the document's CMO marker is the schema's, and the client-side modules never import Sanity", () => {
  assert.equal(CMO_PLACEHOLDER_PREFIX, SCHEMA_CMO_PREFIX);
  for (const file of ["lib/proposals/placeholders.ts", "lib/proposals/content.ts", "content/proposals/seed.ts", "lib/proposals/document.ts", "lib/proposals/viewer-events.ts", "lib/proposals/pdf.ts", "components/proposals/ProposalDocument.tsx", "app/p/[token]/customer-proposal.tsx"]) {
    assert.doesNotMatch(read(file).replace(/from "\.\.\/\.\.\/sanity\/(lib\/client|env)"/g, ""), /from "[^"]*sanity[^"]*"/, file); // the server-only client is fine
  }
});

test("share tokens: 22 base64url characters only", () => {
  assert.ok(SHARE_TOKEN_PATTERN.test("GoldenQuoteB0000000000"));
  for (const bad of ["short", "GoldenQuoteB00000000000", "Golden/uoteB0000000000", "Golden uoteB0000000000"]) assert.ok(!SHARE_TOKEN_PATTERN.test(bad), bad);
});

test("viewer events go out without cookies, as text/plain JSON", () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetcher = (async (url: string, init: RequestInit) => { calls.push({ url, init }); return new Response(null); }) as unknown as typeof fetch;
  const url = eventsUrl("https://api.example.test/", "GoldenQuoteB0000000000");
  assert.equal(url, "https://api.example.test/api/v1/public/proposals/GoldenQuoteB0000000000/events");
  sendViewerEvent(url, { type: "option_chosen", option: "addon" }, fetcher);
  assert.equal(calls[0].init.credentials, "omit");
  assert.equal(calls[0].init.mode, "no-cors");
  assert.equal(calls[0].init.keepalive, true);
  assert.equal((calls[0].init.headers as Record<string, string>)["Content-Type"], "text/plain;charset=UTF-8");
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), { type: "option_chosen", option: "addon" });
  assert.doesNotThrow(() => sendViewerEvent(url, { type: "opened" }, (() => { throw new Error("offline"); }) as unknown as typeof fetch));
});

test("Do Not Track is detected from any of its sources", () => {
  assert.equal(doNotTrack({ navigator: { doNotTrack: "1" } }), true);
  assert.equal(doNotTrack({ window: { doNotTrack: "1" } }), true);
  assert.equal(doNotTrack({ navigator: { msDoNotTrack: "1" } }), true);
  assert.equal(doNotTrack({ navigator: { doNotTrack: "0" } }), false);
  assert.equal(doNotTrack({ navigator: { doNotTrack: null } }), false);
});

test("heartbeats: one 'viewed' per 15 s of visible time; hidden time never counts; partial spells flushed", () => {
  let now = 0;
  let visible = true;
  let tick: (() => void) | null = null;
  const sent: number[] = [];
  const beat = startHeartbeat({
    send: (ms) => sent.push(ms), isVisible: () => visible, now: () => now,
    setInterval: (fn) => { tick = fn; return 1; }, clearInterval: () => { tick = null; }
  });
  const advance = (ms: number) => { now += ms; };
  advance(HEARTBEAT_MS); tick!();
  advance(HEARTBEAT_MS); tick!();
  assert.deepEqual(sent, [15_000, 15_000]);
  advance(4_000); visible = false; beat.visibilityChanged(); // 4 s visible, then hidden
  assert.deepEqual(sent, [15_000, 15_000, 4_000]);
  advance(60_000); tick!(); // hidden: nothing
  assert.equal(sent.length, 3);
  visible = true; beat.visibilityChanged();
  advance(500); visible = false; beat.visibilityChanged(); // under a second: not worth an event
  assert.equal(sent.length, 3);
  visible = true; beat.visibilityChanged(); advance(MAX_VIEW_MS + 60_000); tick!();
  assert.equal(sent.at(-1), MAX_VIEW_MS); // capped to the API's limit
  advance(2_000); beat.stop();
  assert.equal(sent.at(-1), 2_000);
  assert.equal(tick, null);
});

test("PDF: html-to-image's reduced font sizes are restored to the document's whole pixels", () => {
  const svg = "data:image/svg+xml;charset=utf-8," + encodeURIComponent('<div style="font-size: 12.9px; letter-spacing: 0.9px"><p style="font-size: 39.9px">x</p></div>');
  const restored = decodeURIComponent(restoreFontSizes(svg).slice("data:image/svg+xml;charset=utf-8,".length));
  assert.ok(restored.includes("font-size: 13px"));
  assert.ok(restored.includes("font-size: 40px"));
  assert.ok(restored.includes("letter-spacing: 0.9px"));
  // The document CSS keeps whole-pixel font sizes, which is what makes the restore exact.
  const css = read("components/proposals/proposal-document.module.css");
  for (const [, size] of css.matchAll(/font-size:\s*([\d.]+)px/g)) assert.equal(Number(size) % 1, 0, `font-size ${size}px`);
});

test("customer page: flag-gated, token-checked, noindex, no customer data in title, plain 404s", () => {
  const page = read("app/p/[token]/page.tsx");
  assert.match(page, /if \(!proposalsEnabled\(\)\) notFound\(\);/);
  assert.match(page, /if \(!SHARE_TOKEN_PATTERN\.test\(token\)\) notFound\(\);/);
  assert.match(page, /if \(!view \|\| view\.totals\.essentialPaise === null\) notFound\(\);/);
  assert.match(page, /robots: \{ index: false, follow: false/);
  assert.match(page, /title: "Your proposal \| Mason Company"/);
  assert.ok(!/generateMetadata/.test(page), "metadata must stay static (no customer data in <title>)");
  const config = read("next.config.ts");
  assert.match(config, /source: "\/p\/:token\*"/);
  assert.match(config, /"X-Robots-Tag", value: "noindex, nofollow, noarchive"/);
  assert.match(config, /"Referrer-Policy", value: "no-referrer"/);
});

test("customer copy is PUBLISHED only; drafts only in staff preview; the seed source never in production", () => {
  const loader = read("lib/proposals/content.ts");
  assert.match(loader, /process\.env\.NODE_ENV !== "production" && process\.env\.PROPOSALS_CONTENT_SOURCE === "seed"/);
  assert.match(read("app/p/[token]/page.tsx"), /loadProposalContent\(\{ preview: false \}\)/);
  assert.match(read("app/(crm)/crm/proposals/actions.ts"), /loadProposalContent\(\{ preview: true \}\)/);
  // The share token reaches the browser only once the proposal is shared.
  assert.match(read("app/(crm)/crm/proposals/actions.ts"), /shareToken: shared && proposal\.shareToken \? proposal\.shareToken : null/);
});
