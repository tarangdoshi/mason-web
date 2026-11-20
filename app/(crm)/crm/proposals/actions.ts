"use server";

import { apiFetch, ApiError } from "../../../../lib/api";
import { getCrmSessionToken, getCurrentStaffUser } from "../../../../lib/crm";
import { proposalsEnabled } from "../../../../lib/proposals/flag";
import { draftProblem, overridePayload, toApiItems, type BuilderDraft, type OverrideInput } from "../../../../lib/proposals/builder";

/* Server actions for the staff Proposal Builder. They return results instead of redirecting,
   so the tablet screen can show live totals without a page reload. The API is the authority on
   access (AGENT sees only their own proposals; override is ADMIN-only) — these checks only avoid
   pointless calls. */

type ProposalRecord = {
  id: string;
  essentialTotalPaise: number | null;
  addonTotalPaise: number | null;
  priceListVersion: string | null;
  override: { essentialPaise?: number; addonPaise?: number; reason: string } | null;
};

export type PriceResult =
  | { ok: true; id: string; essentialPaise: number | null; addonPaise: number | null; priceListVersion: string | null }
  | { ok: false; id: string | null; error: string };

export type OverrideResult =
  | { ok: true; essentialPaise: number | null; addonPaise: number | null; reason: string }
  | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function session() {
  if (!proposalsEnabled()) return { error: "Proposals are not enabled." } as const;
  const user = await getCurrentStaffUser();
  const token = await getCrmSessionToken();
  if (!user || !token) return { error: "Your session has ended. Sign in again." } as const;
  return { user, token } as const;
}

function message(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return "The proposal service is not available yet.";
    if (error.status === 503) return "The price list is unavailable. Totals will appear once it loads.";
    return error.message;
  }
  return "The proposal could not be priced. Try again.";
}

/** Creates the draft on first call, otherwise updates it, then prices it with the current price list. */
export async function saveAndPriceProposal(id: string | null, draft: BuilderDraft): Promise<PriceResult> {
  const auth = await session();
  if ("error" in auth) return { ok: false, id, error: auth.error ?? "Unavailable." };
  const problem = draftProblem(draft);
  if (problem) return { ok: false, id, error: problem };
  if (id !== null && !UUID.test(id)) return { ok: false, id: null, error: "Unknown proposal." };

  const body = { displayName: draft.displayName.trim(), rooms: draft.rooms, items: toApiItems(draft.items) };
  let proposalId = id;
  try {
    if (proposalId === null) {
      const created = await apiFetch<{ data: ProposalRecord }>("/api/v1/internal/proposals", {
        method: "POST", token: auth.token, body: { zohoLeadId: draft.zohoLeadId.trim(), ...body }
      });
      proposalId = created.data.id;
    } else {
      await apiFetch(`/api/v1/internal/proposals/${proposalId}`, { method: "PATCH", token: auth.token, body });
    }
    const priced = await apiFetch<{ data: { proposal: ProposalRecord } }>(`/api/v1/internal/proposals/${proposalId}/price`, {
      method: "POST", token: auth.token
    });
    const proposal = priced.data.proposal;
    return { ok: true, id: proposal.id, essentialPaise: proposal.essentialTotalPaise, addonPaise: proposal.addonTotalPaise, priceListVersion: proposal.priceListVersion };
  } catch (error) {
    return { ok: false, id: proposalId, error: message(error) };
  }
}

export async function overrideProposal(id: string, input: OverrideInput, hasAddon: boolean): Promise<OverrideResult> {
  const auth = await session();
  if ("error" in auth) return { ok: false, error: auth.error ?? "Unavailable." };
  if (auth.user.role !== "ADMIN") return { ok: false, error: "Only an admin can override a proposal price." };
  if (!UUID.test(id)) return { ok: false, error: "Price the proposal before overriding it." };
  const parsed = overridePayload(input, hasAddon);
  if (!parsed.ok) return parsed;
  try {
    const response = await apiFetch<{ data: ProposalRecord }>(`/api/v1/internal/proposals/${id}/override`, {
      method: "POST", token: auth.token, body: parsed.payload
    });
    const override = response.data.override;
    return {
      ok: true,
      essentialPaise: override?.essentialPaise ?? response.data.essentialTotalPaise,
      addonPaise: response.data.addonTotalPaise === null ? null : (override?.addonPaise ?? response.data.addonTotalPaise),
      reason: parsed.payload.reason
    };
  } catch (error) {
    return { ok: false, error: error instanceof ApiError ? error.message : "The override could not be saved." };
  }
}
