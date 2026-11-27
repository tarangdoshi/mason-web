import { NextResponse, type NextRequest } from "next/server";
import { proposalsEnabled } from "./lib/proposals/flag";
import { clientIp, limitPageView } from "./lib/proposals/rate-limit";

/* Runs only for the customer proposal page (/p/…): a per-client-IP limit before the page renders and makes its
   signed call to mason-api (lib/proposals/rate-limit.ts). Does nothing while the Proposal Builder flag is off. */

export const config = { matcher: ["/p/:path*"] };

export async function middleware(request: NextRequest) {
  if (!proposalsEnabled() || (request.method !== "GET" && request.method !== "HEAD")) return NextResponse.next();
  const ip = clientIp(request.headers);
  if (!ip) return NextResponse.next(); // no trusted client IP (local dev without a proxy): nothing to key on
  const result = await limitPageView(ip);
  if (result.ok) return NextResponse.next();
  return new NextResponse("Too many requests. Please wait a minute and open the link again.", {
    status: 429,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "retry-after": String(result.retryAfterSeconds),
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
      "referrer-policy": "no-referrer"
    }
  });
}
