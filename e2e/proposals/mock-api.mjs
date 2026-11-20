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
const roundUp999 = (paise) => Math.ceil((paise + 100) / 100_000) * 100_000 - 100;

function price(items) {
  const rec = items.filter((item) => item.state === "recommended");
  const essential = rec.filter((item) => item.tier === "essential").reduce((sum, item) => sum + item.qty * 100_000, 0) + 525_000;
  const addonLines = rec.filter((item) => item.tier === "addon").reduce((sum, item) => sum + item.qty * 200_000, 0);
  return { essentialTotalPaise: roundUp999(essential), addonTotalPaise: addonLines ? roundUp999(essential + addonLines) : null };
}

const send = (res, status, body) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };

createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : undefined;
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/__log") return send(res, 200, { data: log });
  if (url.pathname === "/__reset") { log.length = 0; proposals.clear(); return send(res, 200, {}); }
  const user = staff[(req.headers.authorization || "").replace("Bearer ", "")];
  if (!user) return send(res, 401, { error: "Unauthorized" });
  log.push({ method: req.method, path: url.pathname, role: user.role, body });
  if (url.pathname === "/api/v1/internal/auth/me") return send(res, 200, { data: user });

  const match = url.pathname.match(/^\/api\/v1\/internal\/proposals(?:\/([0-9a-f-]{36}))?(?:\/(price|override))?$/);
  if (!match) return send(res, 404, { error: "Not found" });
  const [, id, action] = match;
  if (!id && req.method === "POST") {
    const proposal = { id: randomUUID(), ...body, essentialTotalPaise: null, addonTotalPaise: null, priceListVersion: null, override: null };
    proposals.set(proposal.id, proposal);
    return send(res, 201, { data: proposal });
  }
  const proposal = proposals.get(id);
  if (!proposal) return send(res, 404, { error: "Proposal not found." });
  if (!action && req.method === "PATCH") {
    Object.assign(proposal, body, { essentialTotalPaise: null, addonTotalPaise: null, override: null });
    return send(res, 200, { data: proposal });
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
