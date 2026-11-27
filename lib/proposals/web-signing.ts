import { createHmac } from "node:crypto";

/* Server-to-server identity for calls from this web app to mason-api's public proposal endpoints
   (mason-api docs/proposals.md, "Signed web calls"; verified by src/proposals/web-identity.ts). Signed calls are
   limited per share token on the API instead of per IP, because every customer page fetch leaves from Vercel's
   egress IPs. The secret never reaches the browser: only server-side calls are signed (the browser's viewer
   events stay unsigned and are limited per real customer IP by the API).

     x-mason-web-ts:        unix seconds
     x-mason-web-signature: hex HMAC-SHA256(secret, `${ts}\n${METHOD}\n${path}`), path without the query string */

export const WEB_TS_HEADER = "x-mason-web-ts";
export const WEB_SIGNATURE_HEADER = "x-mason-web-signature";
const MIN_SECRET_LENGTH = 32; // as the API: a shorter secret is treated as unset

export function webSigningSecret(value: string | undefined = process.env.PROPOSALS_WEB_SIGNING_SECRET): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length >= MIN_SECRET_LENGTH ? trimmed : undefined;
}

export function signWebRequest(secret: string, method: string, url: string, timestampSeconds: number): string {
  const path = new URL(url, "http://x").pathname;
  return createHmac("sha256", secret).update(`${timestampSeconds}\n${method.toUpperCase()}\n${path}`).digest("hex");
}

let warned = false;

/** Headers for a signed call, or {} when no usable secret is configured (the call is then limited per IP). */
export function webSignatureHeaders(method: string, url: string, now: () => number = Date.now, secret = webSigningSecret()): Record<string, string> {
  if (!secret) {
    if (!warned && process.env.NODE_ENV === "production") {
      warned = true;
      console.warn("proposalWebSignature: secret_not_configured (customer page calls will share the API's per-IP limit)");
    }
    return {};
  }
  const ts = Math.floor(now() / 1000);
  return { [WEB_TS_HEADER]: String(ts), [WEB_SIGNATURE_HEADER]: signWebRequest(secret, method, url, ts) };
}
