// Synthetic stand-in for the mason-api proposal endpoints (docs/proposals.md), for Playwright only.
// Run with `node --import tsx` so it prices with the same engine as the staff screen's offline copy
// (lib/proposals/pricing.ts, itself checked against the API engine's own outputs). Prices are made up:
// every component ₹1,000 a unit, manpower & shipping ₹5,250, totals rounded up to …999.
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { priceProposal, DEFAULT_PRICING_CONFIG } from "../../lib/proposals/pricing.ts";
import { PROPOSAL_COMPONENT_KEYS } from "../../lib/proposals/components.ts";

const port = Number(process.env.MOCK_API_PORT || 4410);
const staff = {
  "e2e-admin": { id: "00000000-0000-4000-8000-000000000001", fullName: "Test Admin", email: "admin@example.test", role: "ADMIN" },
  "e2e-agent": { id: "00000000-0000-4000-8000-000000000002", fullName: "Test Agent", email: "agent@example.test", role: "AGENT" }
};
const proposals = new Map();
const log = [];
let failNextPrice = false; // POST /__fail-next-price → the next price call answers 503
let dateSupport = false; // POST /__date-support → behave as if the API stores proposalDate
// Like zod's default object parsing in mason-api: unknown keys are dropped.
const known = (body) => {
  const { proposalDate, ...rest } = body ?? {};
  return dateSupport ? { ...rest, proposalDate } : rest;
};
const priceList = {
  version: "synthetic01",
  entries: [
    ...PROPOSAL_COMPONENT_KEYS.map((component) => ({ component, variant: null, unitPaise: 100_000 })),
    { component: "angled-grab-bar", variant: "Left hand", unitPaise: 100_000 },
    { component: "vertical-grab-bars", variant: "Short", unitPaise: 100_000 },
    { component: "vertical-grab-bars", variant: "Long", unitPaise: 100_000 }
  ]
};
let priceListAvailable = true; // POST /__no-price-list → the price-list read answers 404 (endpoint not built yet)
let priceDelta = 0; // POST /__price-delta {paise} → the server list differs from the tablet's (re-priced on sync)
let failNextPatch = false; // POST /__fail-next-patch → the next PATCH answers 500 (a passing server error)
let lostSupport = true; // POST /__no-lost → POST /:id/lost answers a bare 404 (endpoint not built yet)

class PricingRefusal extends Error {}
function price(items) {
  try {
    const list = priceDelta ? { ...priceList, version: "synthetic02", entries: priceList.entries.map((entry) => ({ ...entry, unitPaise: entry.unitPaise + priceDelta })) } : priceList;
    const result = priceProposal(items, list, DEFAULT_PRICING_CONFIG);
    return { essentialTotalPaise: result.essentialTotalPaise, addonTotalPaise: result.addonTotalPaise, priceListVersion: list.version, priceSnapshot: result.snapshot };
  } catch (error) {
    throw new PricingRefusal(error.message);
  }
}

// Customer views (GET /api/v1/public/proposals/:token), made-up names only. Quote B is the 20 Nov golden quote.
const view = (displayName, items, essentialPaise, addonPaise) => ({ displayName, proposalDate: "2026-11-20", rooms: 1, status: "shared", templateVersion: "v1", totals: { essentialPaise, addonPaise }, items, createdAt: "2026-11-20T10:00:00.000Z" });
const row = (component, tier, qty = 1, variant = null, complimentary = false) => ({ component, state: "recommended", tier, qty, variant, complimentary });
const publicViews = {
  GoldenQuoteB0000000000: view("Mrs Example", [
    row("vertical-grab-bars", "essential", 1, "Short"), row("vertical-grab-bars", "essential", 1, "Long"),
    row("angled-grab-bar", "essential"), row("anti-slip-coating", "essential"),
    row("two-way-lock", "addon"), row("emergency-key-box", "addon"),
    { component: "raised-toilet-seat", state: "declined", tier: "essential", qty: 1, variant: null, complimentary: false }
  ], 1_399_900, 1_699_900),
  QuoteAExample000000000: view("Mr Example", [
    row("vertical-grab-bars", "essential", 2, "Short"), row("vertical-grab-bars", "essential", 1, "Long"),
    row("folding-bar", "essential"), row("drainage-solution", "essential", 4, null, true), row("slippers-one", "essential", 1, null, true),
    row("shower-stool", "addon"), row("two-way-lock", "addon")
  ], 2_299_900, 2_999_900),
  NoAddonExample00000000: view("Ms Example", [row("anti-slip-coating", "essential")], 899_900, null),
  NoDateExample000000000: { ...view("Mx Example", [row("anti-slip-coating", "essential")], 899_900, null), proposalDate: null },
  // Every component recommended: the longest proposal staff can build.
  AllItemsExample0000000: view("Dr Example", [
    row("vertical-grab-bars", "essential", 2, "Short"), row("vertical-grab-bars", "essential", 1, "Long"), row("angled-grab-bar", "essential"),
    row("folding-bar", "essential"), row("anti-slip-coating", "essential"), row("anti-slip-mat-shower", "essential"),
    row("anti-slip-mat-post-shower", "essential"), row("raised-toilet-seat", "essential"), row("corner-safety", "essential"),
    row("total-support-solution", "essential"), row("drainage-solution", "essential", 4, null, true), row("slippers-one", "essential", 1, null, true),
    row("shower-stool", "addon"), row("two-way-lock", "addon"), row("emergency-key-box", "addon")
  ], 3_499_900, 4_199_900)
};

const send = (res, status, body) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };

createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : undefined;
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/__log") return send(res, 200, { data: log });
  if (url.pathname === "/__reset") {
    log.length = 0; proposals.clear(); failNextPrice = false; dateSupport = false; priceListAvailable = true; priceDelta = 0; failNextPatch = false; lostSupport = true;
    return send(res, 200, {});
  }
  if (url.pathname === "/__no-price-list") { priceListAvailable = false; return send(res, 200, {}); }
  if (url.pathname === "/__price-delta") { priceDelta = Number(body?.paise ?? 0); return send(res, 200, {}); }
  if (url.pathname === "/__fail-next-patch") { failNextPatch = true; return send(res, 200, {}); }
  if (url.pathname === "/__no-lost") { lostSupport = false; return send(res, 200, {}); }
  if (url.pathname === "/__fail-next-price") { failNextPrice = true; return send(res, 200, {}); }
  if (url.pathname === "/__date-support") { dateSupport = true; return send(res, 200, {}); }
  const pub = url.pathname.match(/^\/api\/v1\/public\/proposals\/([^/]+)(\/events)?$/);
  if (pub) {
    const [, token, events] = pub;
    const found = publicViews[token] ?? [...proposals.values()].find((item) => item.shareToken === token && item.status === "SHARED");
    log.push({ method: req.method, path: events ? "/api/v1/public/proposals/:token/events" : "/api/v1/public/proposals/:token", token, body, cookie: req.headers.cookie ?? null, contentType: req.headers["content-type"] ?? null });
    if (!found) return send(res, 404, { error: "Proposal not found." });
    if (events) return send(res, 202, { data: { recorded: true } });
    if (publicViews[token]) return send(res, 200, { data: found });
    return send(res, 200, { data: { displayName: found.displayName, proposalDate: found.proposalDate ?? "2026-11-20", rooms: found.rooms, status: "shared", templateVersion: "v1", totals: { essentialPaise: found.essentialTotalPaise, addonPaise: found.addonTotalPaise }, items: found.items.map((item) => ({ ...item, complimentary: item.component === "slippers-one" })) } });
  }
  const user = staff[(req.headers.authorization || "").replace("Bearer ", "")];
  if (!user) return send(res, 401, { error: "Unauthorized" });
  log.push({ method: req.method, path: url.pathname, role: user.role, body });
  if (url.pathname === "/api/v1/internal/auth/me") return send(res, 200, { data: user });

  if (url.pathname === "/api/v1/internal/proposals/price-list" && req.method === "GET") {
    if (!priceListAvailable) return send(res, 404, { error: "Not Found" });
    return send(res, 200, { data: { ...priceList, config: DEFAULT_PRICING_CONFIG } });
  }
  const match = url.pathname.match(/^\/api\/v1\/internal\/proposals(?:\/([0-9a-f-]{36}))?(?:\/(price|override|share|accept|lost))?$/);
  if (!match) return send(res, 404, { error: "Not found" });
  const [, id, action] = match;
  if (!id && req.method === "POST") {
    const proposal = { id: randomUUID(), status: "DRAFT", shareToken: randomUUID().replace(/-/g, "").slice(0, 22), ...known(body), essentialTotalPaise: null, addonTotalPaise: null, priceListVersion: null, override: null };
    proposals.set(proposal.id, proposal);
    return send(res, 201, { data: proposal });
  }
  const proposal = proposals.get(id);
  if (!proposal) return send(res, 404, { error: "Proposal not found." });
  if (!action && req.method === "GET") return send(res, 200, { data: proposal });
  if (action === "share") {
    if (proposal.status === "LOST") return send(res, 409, { error: "A lost proposal cannot be shared.", code: "PROPOSAL_LOST" });
    if (proposal.essentialTotalPaise === null) return send(res, 409, { error: "Price the proposal before sharing it." });
    if (proposal.status === "DRAFT") proposal.status = "SHARED";
    return send(res, 200, { data: proposal });
  }
  if (action === "accept") {
    // As mason-api today: ADMIN only, SHARED only, idempotent for the same option.
    if (user.role !== "ADMIN") return send(res, 403, { error: "Only an admin can accept a proposal.", code: "FORBIDDEN" });
    const option = body?.option;
    if (option !== "essential" && option !== "essential_addon") return send(res, 400, { error: "Invalid proposal input." });
    if (proposal.status === "ACCEPTED") {
      if (proposal.acceptedOption !== option) return send(res, 409, { error: "This proposal is already accepted with the other option.", code: "ALREADY_ACCEPTED" });
      return send(res, 200, { data: { proposal, commercialCaseId: proposal.commercialCaseId } });
    }
    if (proposal.status !== "SHARED") return send(res, 409, { error: "Only a shared proposal can be accepted.", code: "NOT_SHARED" });
    if (option === "essential_addon" && proposal.addonTotalPaise === null) return send(res, 422, { error: "This proposal has no Add-on option.", code: "NO_ADDON" });
    Object.assign(proposal, { status: "ACCEPTED", acceptedOption: option, commercialCaseId: randomUUID() });
    return send(res, 200, { data: { proposal, commercialCaseId: proposal.commercialCaseId } });
  }
  if (action === "lost") {
    if (!lostSupport) return send(res, 404, { error: "Not Found" });
    const reasons = ["price", "timing", "family_decision", "not_needed", "other"];
    if (!reasons.includes(body?.reason) || (body.reason === "other" && !(body.note ?? "").trim())) return send(res, 400, { error: "Invalid proposal input." });
    if (proposal.status === "ACCEPTED") return send(res, 409, { error: "An accepted proposal cannot be marked lost.", code: "ALREADY_ACCEPTED" });
    Object.assign(proposal, { status: "LOST", lost: { reason: body.reason, note: body.note ?? null } });
    return send(res, 200, { data: proposal });
  }
  if (!action && req.method === "PATCH" && proposal.status !== "DRAFT") return send(res, 409, { error: "Only a draft proposal can be changed." });
  if (!action && req.method === "PATCH" && failNextPatch) {
    failNextPatch = false;
    return send(res, 500, { error: "Proposal request could not be completed." });
  }
  if (!action && req.method === "PATCH") {
    Object.assign(proposal, known(body), { essentialTotalPaise: null, addonTotalPaise: null, override: null, priceSnapshot: null });
    return send(res, 200, { data: proposal });
  }
  if (action === "price" && failNextPrice) {
    failNextPrice = false;
    return send(res, 503, { error: "Price list unavailable.", code: "PRICE_LIST_UNAVAILABLE" });
  }
  if (action === "price") {
    if (proposal.status !== "DRAFT") return send(res, 409, { error: "Only a draft proposal can be priced.", code: "NOT_DRAFT" });
    try {
      Object.assign(proposal, price(proposal.items));
    } catch (error) {
      return send(res, 422, { error: error.message, code: "UNKNOWN_PRICE" });
    }
    return send(res, 200, { data: { proposal, essentialRawPaise: 0, addonRawPaise: null } });
  }
  if (action === "override") {
    if (user.role !== "ADMIN") return send(res, 403, { error: "Only an admin can override a proposal price." });
    if (!body?.reason || body.reason.trim().length < 10) return send(res, 400, { error: "Invalid proposal input." });
    proposal.override = { ...body, byStaffId: user.id, at: new Date().toISOString() };
    return send(res, 200, { data: proposal });
  }
  return send(res, 405, { error: "Method not allowed" });
}).listen(port, "127.0.0.1", () => console.log(`mock proposals api on ${port}`));
