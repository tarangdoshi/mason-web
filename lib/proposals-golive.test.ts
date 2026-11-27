import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { NextRequest } from "next/server";
import { clientIp, hashIp, limitPageView, memoryWindowStore, pageLimit, PAGE_LIMIT_DEFAULT, upstashWindowStore } from "./proposals/rate-limit";
import { signWebRequest, webSignatureHeaders, webSigningSecret, WEB_SIGNATURE_HEADER, WEB_TS_HEADER } from "./proposals/web-signing";

/* Proposal go-live hardening (web): signed public calls, the per-client-IP limit, the Zoho note chip.
   Synthetic values only; the signing secret below is a test vector, not a real secret. */

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const SECRET = "test-vector-secret-not-real-0123456789abcdef";

test("signature matches mason-api's signWebRequest (vector generated from src/proposals/web-identity.ts @ d8cd277)", () => {
  // signWebRequest(SECRET, "GET", "/api/v1/public/proposals/GoldenQuoteB0000000000?x=1", 1_795_000_000) on the API.
  const expected = "0b7594cd98d961a746fa75b645a57a5a396bd040348210ca8ca8e90a50ddd6fd";
  assert.equal(signWebRequest(SECRET, "get", "https://api.example.test/api/v1/public/proposals/GoldenQuoteB0000000000?x=1", 1_795_000_000), expected);
  assert.equal(signWebRequest(SECRET, "GET", "/api/v1/public/proposals/GoldenQuoteB0000000000", 1_795_000_000), expected);
});

test("signed headers: unix-seconds timestamp + hex signature; none without a usable secret", () => {
  const headers = webSignatureHeaders("GET", "https://api.example.test/api/v1/public/proposals/AbcAbcAbcAbcAbcAbcAbc1", () => 1_795_000_000_999, SECRET);
  assert.equal(headers[WEB_TS_HEADER], "1795000000");
  assert.match(headers[WEB_SIGNATURE_HEADER], /^[0-9a-f]{64}$/);
  assert.deepEqual(webSignatureHeaders("GET", "/x", Date.now, undefined), {});
  assert.equal(webSigningSecret("short"), undefined); // under 32 characters is treated as unset, as on the API
  assert.equal(webSigningSecret(`  ${SECRET}  `), SECRET);
});

test("only the server signs: the secret is never in client code or a NEXT_PUBLIC variable", () => {
  assert.match(read("lib/proposals/public.ts"), /\.\.\.webSignatureHeaders\("GET", url\)/);
  for (const file of ["lib/proposals/viewer-events.ts", "app/p/[token]/customer-proposal.tsx"]) assert.doesNotMatch(read(file), /SIGNING_SECRET|web-signing/);
  assert.doesNotMatch(read("lib/proposals/web-signing.ts"), /NEXT_PUBLIC/);
  assert.match(read("lib/proposals/web-signing.ts"), /^import \{ createHmac \} from "node:crypto";/); // node-only: cannot be bundled for the browser
});

test("client IP: only from proxy headers that are trusted (Vercel, or explicitly configured)", () => {
  const headers = new Headers({ "x-forwarded-for": "198.51.100.7, 10.0.0.1", "x-real-ip": "203.0.113.5" });
  assert.equal(clientIp(headers, false), null);
  assert.equal(clientIp(headers, true), "203.0.113.5");
  assert.equal(clientIp(new Headers({ "x-forwarded-for": "198.51.100.7, 10.0.0.1" }), true), "198.51.100.7");
  assert.equal(clientIp(new Headers(), true), null);
});

test("per-IP window: the limit+1st load in a minute is refused; next minute it resets; IPs are hashed", async () => {
  let now = 1_800_000_000_000;
  const store = memoryWindowStore(() => now);
  const results = [];
  for (let i = 0; i < 4; i += 1) results.push(await limitPageView("203.0.113.5", { store, limit: 3, now: () => now }));
  assert.deepEqual(results.map((result) => result.ok), [true, true, true, false]);
  assert.ok(results[3].retryAfterSeconds >= 1 && results[3].retryAfterSeconds <= 60);
  assert.equal((await limitPageView("198.51.100.9", { store, limit: 3, now: () => now })).ok, true); // other IPs unaffected
  now += 60_000;
  assert.equal((await limitPageView("203.0.113.5", { store, limit: 3, now: () => now })).ok, true);
  const hashed = await hashIp("203.0.113.5");
  assert.match(hashed, /^[0-9a-f]{32}$/);
  assert.equal(hashed.includes("203"), false);
  assert.equal(pageLimit(undefined), PAGE_LIMIT_DEFAULT);
  assert.equal(pageLimit("120"), 120);
  assert.equal(pageLimit("-1"), PAGE_LIMIT_DEFAULT);
});

test("store failure fails open (customers still see their proposal; the API's limits stay behind)", async () => {
  const broken = { increment: async () => { throw new Error("down"); } };
  assert.equal((await limitPageView("203.0.113.5", { store: broken, limit: 1 })).ok, true);
});

test("Upstash store: INCR then PEXPIRE NX in one pipeline, bearer token, key without the raw IP", async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetcher = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify([{ result: 2 }, { result: 1 }]), { status: 200 });
  }) as unknown as typeof fetch;
  const store = upstashWindowStore("https://kv.example.test/", "token-for-test", fetcher);
  const result = await limitPageView("203.0.113.5", { store, limit: 5, now: () => 1_800_000_000_000 });
  assert.equal(result.count, 2);
  assert.equal(calls[0].url, "https://kv.example.test/pipeline");
  assert.equal((calls[0].init.headers as Record<string, string>).authorization, "Bearer token-for-test");
  const body = JSON.parse(String(calls[0].init.body)) as string[][];
  assert.equal(body[0][0], "INCR");
  assert.deepEqual(body[1].slice(0, 1).concat(body[1].slice(2)), ["PEXPIRE", "60000", "NX"]);
  assert.doesNotMatch(String(calls[0].init.body), /203\.0\.113\.5/);
});

test("middleware: 429 with Retry-After once one IP passes the limit; only /p/; nothing while the flag is off", async () => {
  const saved = { flag: process.env.NEXT_PUBLIC_PROPOSALS_ENABLED, trust: process.env.PROPOSALS_TRUST_PROXY_HEADERS, limit: process.env.PROPOSALS_PAGE_RATE_LIMIT, kv: process.env.KV_REST_API_URL };
  try {
    process.env.PROPOSALS_TRUST_PROXY_HEADERS = "true";
    process.env.PROPOSALS_PAGE_RATE_LIMIT = "2";
    delete process.env.KV_REST_API_URL;
    const { middleware, config } = await import("../middleware");
    assert.deepEqual(config.matcher, ["/p/:path*"]);
    const request = (ip: string) => new NextRequest("https://www.example.test/p/AbcAbcAbcAbcAbcAbcAbc1", { headers: { "x-real-ip": ip } });
    process.env.NEXT_PUBLIC_PROPOSALS_ENABLED = "false";
    for (let i = 0; i < 4; i += 1) assert.notEqual((await middleware(request("192.0.2.50"))).status, 429);
    process.env.NEXT_PUBLIC_PROPOSALS_ENABLED = "true";
    const statuses = [];
    for (let i = 0; i < 3; i += 1) statuses.push((await middleware(request("192.0.2.77"))).status);
    assert.deepEqual(statuses.map((status) => status === 429), [false, false, true]);
    const refused = await middleware(request("192.0.2.77"));
    assert.equal(refused.status, 429);
    assert.match(refused.headers.get("retry-after") ?? "", /^\d+$/);
    assert.equal(refused.headers.get("cache-control"), "no-store");
    assert.equal((await middleware(request("192.0.2.78"))).status === 429, false);
  } finally {
    for (const [key, value] of Object.entries({ NEXT_PUBLIC_PROPOSALS_ENABLED: saved.flag, PROPOSALS_TRUST_PROXY_HEADERS: saved.trust, PROPOSALS_PAGE_RATE_LIMIT: saved.limit, KV_REST_API_URL: saved.kv })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("Zoho note: 'pending' is a neutral chip, never an error", () => {
  const source = read("app/(crm)/crm/proposals/new/customer-actions.tsx");
  assert.match(source, /note === "pending"\) return <span className=\{styles\.noteChip\}[^>]*>Zoho note pending<\/span>/);
  assert.doesNotMatch(source, /zohoNote[^\n]*setError/);
  assert.match(read("app/(crm)/crm/proposals/actions.ts"), /export type ZohoNote = "added" \| "failed" \| "skipped" \| "unchanged" \| "pending";/);
});
