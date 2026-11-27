/* Per-client-IP limit for the customer page /p/[token], applied in middleware.ts BEFORE the page renders and
   signs its call to mason-api. A signed call is trusted to be this web app, not a particular customer, so
   without this one abuser could use up the API's global ceiling for signed calls (1,200 a minute) and leave
   every other customer with errors. Edge-runtime safe (Web Crypto, fetch only).

   Store: Upstash Redis over REST when KV_REST_API_URL + KV_REST_API_TOKEN are set (Vercel's Redis/KV
   integration), so the limit holds across all instances; otherwise an in-memory window per instance (still
   bounds one abuser per instance). IPs are hashed before they are used as keys. A store error fails OPEN:
   customers must still see their proposal, and the API's own limits stay behind this one. */

export const PAGE_LIMIT_DEFAULT = 30; // page loads per IP per minute: far above a family reading, far below abuse
export const WINDOW_MS = 60_000;

export type LimitResult = { ok: boolean; count: number; limit: number; retryAfterSeconds: number };

export function pageLimit(value: string | undefined = process.env.PROPOSALS_PAGE_RATE_LIMIT): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : PAGE_LIMIT_DEFAULT;
}

/**
 * The real client IP. Only from headers a trusted proxy sets: on Vercel, `x-real-ip` and `x-forwarded-for` are
 * written by Vercel's edge (a client cannot forge them). Elsewhere these headers are client-controlled, so they
 * are used only when PROPOSALS_TRUST_PROXY_HEADERS=true (tests, or a self-hosted proxy that overwrites them).
 */
export function clientIp(headers: Headers, trusted: boolean = process.env.VERCEL === "1" || process.env.PROPOSALS_TRUST_PROXY_HEADERS === "true"): string | null {
  if (!trusted) return null;
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || null;
}

/** IPv6 is keyed on its /64 (one host usually holds a whole /64 and could rotate through it); IPv4 as is. */
export function ipKey(ip: string): string {
  const address = ip.replace(/^\[|\]$/g, "").split("%")[0];
  if (!address.includes(":")) return address;
  if (/^::ffff:\d+\.\d+\.\d+\.\d+$/i.test(address)) return address.slice(7); // IPv4-mapped
  const [head, tail = ""] = address.toLowerCase().split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const groups = address.includes("::") ? [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill("0"), ...right] : left;
  return `${groups.slice(0, 4).map((group) => group.replace(/^0+(?=.)/, "")).join(":")}::/64`;
}

/** Keyed hash of the client IP: an HMAC with the server's signing secret when set (a plain hash of an IPv4
    address could be reversed by trying all 2^32), so stored keys never reveal IPs. */
export async function hashIp(ip: string, secret: string | undefined = process.env.PROPOSALS_WEB_SIGNING_SECRET): Promise<string> {
  const data = new TextEncoder().encode(`mason-proposals-page:${ipKey(ip)}`);
  let digest: ArrayBuffer;
  if (secret && secret.trim().length >= 32) {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret.trim()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    digest = await crypto.subtle.sign("HMAC", key, data);
  } else {
    digest = await crypto.subtle.digest("SHA-256", data);
  }
  return Array.from(new Uint8Array(digest).slice(0, 16), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export interface WindowStore {
  /** Increments the counter for `key` (expiring after `windowMs`) and returns the new count. */
  increment(key: string, windowMs: number): Promise<number>;
}

export function memoryWindowStore(now: () => number = Date.now): WindowStore & { size: () => number } {
  const counters = new Map<string, { count: number; resetAt: number }>();
  return {
    async increment(key, windowMs) {
      const at = now();
      if (counters.size > 10_000) for (const [stored, value] of counters) if (value.resetAt <= at) counters.delete(stored);
      const current = counters.get(key);
      if (!current || current.resetAt <= at) {
        counters.set(key, { count: 1, resetAt: at + windowMs });
        return 1;
      }
      current.count += 1;
      return current.count;
    },
    size: () => counters.size
  };
}

/** Upstash REST pipeline: INCR, then PEXPIRE. The window number is part of the key, so a plain PEXPIRE (twice
    the window, no NX: works on any Redis) only has to make the key go away; an error on either command fails. */
export function upstashWindowStore(url: string, token: string, fetcher: typeof fetch = fetch): WindowStore {
  return {
    async increment(key, windowMs) {
      const response = await fetcher(`${url.replace(/\/$/, "")}/pipeline`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify([["INCR", key], ["PEXPIRE", key, String(windowMs * 2)]]),
        cache: "no-store",
        signal: AbortSignal.timeout(1_500)
      });
      if (!response.ok) throw new Error(`rate store ${response.status}`);
      const [incr, expire] = (await response.json()) as ({ result?: number; error?: string } | undefined)[];
      if (typeof incr?.result !== "number" || incr.error || expire?.error) throw new Error("rate store reply");
      return incr.result;
    }
  };
}

let fallback: ReturnType<typeof memoryWindowStore> | null = null;

export function defaultWindowStore(): WindowStore {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (url && token) return upstashWindowStore(url, token);
  if (!fallback) {
    fallback = memoryWindowStore();
    // Edge instances are many and short-lived: without the shared store the limit barely holds on Vercel.
    if (process.env.VERCEL === "1") console.warn("proposalPageLimit: no KV store configured; per-instance limit only");
  }
  return fallback;
}

/** Fixed one-minute window per hashed IP. Fails open on store errors. */
export async function limitPageView(ip: string, options: { store?: WindowStore; limit?: number; now?: () => number } = {}): Promise<LimitResult> {
  const limit = options.limit ?? pageLimit();
  const at = (options.now ?? Date.now)();
  const window = Math.floor(at / WINDOW_MS);
  const retryAfterSeconds = Math.max(1, Math.ceil(((window + 1) * WINDOW_MS - at) / 1000));
  try {
    const count = await (options.store ?? defaultWindowStore()).increment(`mason-web:p:${await hashIp(ip)}:${window}`, WINDOW_MS);
    return { ok: count <= limit, count, limit, retryAfterSeconds };
  } catch {
    return { ok: true, count: 0, limit, retryAfterSeconds };
  }
}
