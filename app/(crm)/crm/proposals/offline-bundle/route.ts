import { NextResponse } from "next/server";
import { apiFetch, ApiError } from "../../../../../lib/api";
import { getCrmSessionToken, getCurrentStaffUser } from "../../../../../lib/crm";
import { proposalsEnabled } from "../../../../../lib/proposals/flag";
import { loadProposalContent } from "../../../../../lib/proposals/content";
import { isPriceList, isPricingConfig, type PriceList, type PricingConfig } from "../../../../../lib/proposals/pricing";
import type { OfflineBundle } from "../../../../../lib/proposals/offline/bundle";

/* What the staff screen needs to work with no signal: the proposal copy and component library (staff preview:
   drafts over published, like "Show family"), the last good price list with the pricing rule, and who is
   signed in (a different staff member on the tablet clears the offline data). No customer data. The service
   worker keeps the last good copy (network first). */

export const dynamic = "force-dynamic";

const headers = { "cache-control": "private, no-store", "x-robots-tag": "noindex, nofollow" };

export async function GET() {
  if (!proposalsEnabled()) return new NextResponse(null, { status: 404 });
  const user = await getCurrentStaffUser();
  const token = await getCrmSessionToken();
  if (!user || !token) return NextResponse.json({ error: "Sign in again." }, { status: 401, headers });

  let priceList: PriceList | null = null;
  let pricing: PricingConfig | null = null;
  try {
    // Proposed mason-api endpoint (docs/proposals-web.md, "Offline pricing"). Until it exists, offline pricing is off.
    const response = await apiFetch<{ data: PriceList & { config?: PricingConfig } }>("/api/v1/internal/proposals/price-list", { token });
    const { config, ...list } = response.data;
    if (isPriceList(list) && isPricingConfig(config)) {
      priceList = { version: list.version, entries: list.entries };
      pricing = config;
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return NextResponse.json({ error: "Sign in again." }, { status: 401, headers });
  }

  let content = null;
  try {
    content = await loadProposalContent({ preview: true });
  } catch {
    content = null;
  }
  const bundle: OfflineBundle = { staff: { id: user.id, role: user.role }, content, priceList, pricing, fetchedAt: new Date().toISOString() };
  return NextResponse.json(bundle, { headers });
}
