import type { BuilderDraft } from "../builder";
import { draftBody } from "../builder";
import { buildProposalDoc, viewFromStaffProposal, type ProposalContent, type ProposalDoc } from "../document";
import { priceProposal, PricingError, type PriceList, type PricingConfig, type PricingResult } from "../pricing";

/* The offline bundle (GET /crm/proposals/offline-bundle, kept by the service worker) and what the staff screen
   computes from it with no signal: totals from the local pricing engine, and the customer document for
   Show family and the PDF. */

export type OfflineBundle = {
  staff: { id: string; role: "ADMIN" | "AGENT" };
  content: ProposalContent | null;
  priceList: PriceList | null;
  pricing: PricingConfig | null;
  fetchedAt: string;
};

export const OFFLINE_BUNDLE_PATH = "/crm/proposals/offline-bundle";

export function isOfflineBundle(value: unknown): value is OfflineBundle {
  const bundle = value as OfflineBundle | null;
  return Boolean(bundle && typeof bundle.staff?.id === "string" && (bundle.staff.role === "ADMIN" || bundle.staff.role === "AGENT") && typeof bundle.fetchedAt === "string");
}

export type LocalPrice = { ok: true; result: PricingResult } | { ok: false; error: string };

/** Totals for a draft from the cached price list, exactly as the API would compute them. */
export function priceLocally(draft: BuilderDraft, bundle: OfflineBundle | null): LocalPrice {
  if (!bundle?.priceList || !bundle.pricing) return { ok: false, error: "Offline pricing needs the price list. Connect once to download it." };
  try {
    return { ok: true, result: priceProposal(draftBody(draft).items, bundle.priceList, bundle.pricing) };
  } catch (error) {
    if (error instanceof PricingError) return { ok: false, error: error.message };
    return { ok: false, error: "The proposal could not be priced on this tablet." };
  }
}

export type LocalOverride = { essentialPaise?: number | null; addonPaise?: number | null } | null;

/** The customer document from the draft and a price (local or the last server price). */
export function localDocument(draft: BuilderDraft, priced: PricingResult, content: ProposalContent, status: string, override: LocalOverride = null): ProposalDoc {
  const body = draftBody(draft);
  return buildProposalDoc(viewFromStaffProposal({
    displayName: body.displayName,
    proposalDate: body.proposalDate,
    rooms: body.rooms,
    status,
    items: body.items,
    priceSnapshot: { lines: priced.snapshot.lines },
    essentialTotalPaise: priced.essentialTotalPaise,
    addonTotalPaise: priced.addonTotalPaise,
    override: override ? { essentialPaise: override.essentialPaise ?? undefined, addonPaise: override.addonPaise ?? undefined } : null
  }), content);
}
