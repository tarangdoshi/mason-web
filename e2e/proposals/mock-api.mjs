// Synthetic stand-in for the mason-api proposal endpoints (docs/proposals.md), for Playwright only.
// Prices are made up: every essential line ₹1,000/unit, add-on ₹2,000/unit, fixed ₹5,250, rounded up to …999.
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

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
const roundUp999 = (paise) => Math.ceil((paise + 100) / 100_000) * 100_000 - 100;

function price(items) {
  const rec = items.filter((item) => item.state === "recommended");
  const essential = rec.filter((item) => item.tier === "essential").reduce((sum, item) => sum + item.qty * 100_000, 0) + 525_000;
  const addonLines = rec.filter((item) => item.tier === "addon").reduce((sum, item) => sum + item.qty * 200_000, 0);
  const lines = rec.map((item) => ({ component: item.component, variant: item.variant ?? null, qty: item.qty, tier: item.tier, complimentary: item.component === "slippers-one", linePaise: item.qty * (item.tier === "addon" ? 200_000 : 100_000) }));
  return { essentialTotalPaise: roundUp999(essential), addonTotalPaise: addonLines ? roundUp999(essential + addonLines) : null, priceSnapshot: { version: "synthetic01", lines } };
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
  if (url.pathname === "/__reset") { log.length = 0; proposals.clear(); failNextPrice = false; dateSupport = false; return send(res, 200, {}); }
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

  const match = url.pathname.match(/^\/api\/v1\/internal\/proposals(?:\/([0-9a-f-]{36}))?(?:\/(price|override|share))?$/);
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
    if (proposal.essentialTotalPaise === null) return send(res, 409, { error: "Price the proposal before sharing it." });
    proposal.status = "SHARED";
    return send(res, 200, { data: proposal });
  }
  if (!action && req.method === "PATCH" && proposal.status !== "DRAFT") return send(res, 409, { error: "Only a draft proposal can be changed." });
  if (!action && req.method === "PATCH") {
    Object.assign(proposal, known(body), { essentialTotalPaise: null, addonTotalPaise: null, override: null, priceSnapshot: null });
    return send(res, 200, { data: proposal });
  }
  if (action === "price" && failNextPrice) {
    failNextPrice = false;
    return send(res, 503, { error: "Price list unavailable.", code: "PRICE_LIST_UNAVAILABLE" });
  }
  if (action === "price") {
    Object.assign(proposal, price(proposal.items), { priceListVersion: "synthetic01" });
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
