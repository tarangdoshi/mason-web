"use server";

import { apiFetch, ApiError } from "../../../../lib/api";
import { getCrmSessionToken, getCurrentStaffUser } from "../../../../lib/crm";
import { proposalsEnabled } from "../../../../lib/proposals/flag";
import { draftBody, draftProblem, overridePayload, type BuilderDraft, type OverrideInput } from "../../../../lib/proposals/builder";
import { loadProposalContent } from "../../../../lib/proposals/content";
import { lostProblem } from "../../../../lib/proposals/lost";
import { buildProposalDoc, viewFromStaffProposal, type ProposalDoc, type StaffProposal } from "../../../../lib/proposals/document";

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
  proposalDate?: string | null; // present once the api lane adds the field
};

export type PriceResult =
  | { ok: true; id: string; essentialPaise: number | null; addonPaise: number | null; priceListVersion: string | null; dateSaved: boolean }
  | { ok: false; id: string | null; error: string; retryable?: boolean };

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

/** A passing problem (server error, price list briefly unavailable): queued work waits and tries again. */
function retryable(error: unknown): boolean {
  // Not an ApiError: the API could not be reached at all (network) — also passing.
  return !(error instanceof ApiError) || error.status >= 500 || error.status === 429;
}

function message(error: unknown): string {
  if (error instanceof ApiError) {
    // The API's own 404 (e.g. "Proposal not found.") is shown as-is; a bare 404 means the routes are off.
    if (error.status === 404) return error.message && error.message !== "Request failed." && error.message !== "Not Found" ? error.message : "The proposal service is not available yet.";
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

  const body = draftBody(draft);
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
    return {
      ok: true, id: proposal.id, essentialPaise: proposal.essentialTotalPaise, addonPaise: proposal.addonTotalPaise,
      priceListVersion: proposal.priceListVersion, dateSaved: proposal.proposalDate !== undefined && proposal.proposalDate === body.proposalDate
    };
  } catch (error) {
    return { ok: false, id: proposalId, error: message(error), retryable: retryable(error) };
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

export type DocumentResult =
  | { ok: true; doc: ProposalDoc; shareToken: string | null; shareUrl: string | null }
  | { ok: false; error: string; retryable?: boolean };

/** Customer links always use the public site, never the host the CRM happens to be open on (preview, vercel.app). */
function shareOrigin(): string {
  return (process.env.PROPOSALS_SHARE_ORIGIN || "https://www.masoncompany.in").replace(/\/$/, "");
}

/** The customer document for a priced proposal, with DRAFT Sanity copy over published (staff preview).
    The share token is returned only once the proposal is shared. */
async function proposalDocument(token: string, id: string): Promise<DocumentResult> {
  const response = await apiFetch<{ data: StaffProposal & { shareToken?: string } }>(`/api/v1/internal/proposals/${id}`, { token });
  const proposal = response.data;
  if (proposal.essentialTotalPaise === null) return { ok: false, error: "Price the proposal first." };
  const content = await loadProposalContent({ preview: true });
  if (!content) return { ok: false, error: "The proposal template is not set up in the CMS yet." };
  const doc = buildProposalDoc(viewFromStaffProposal(proposal), content);
  const shared = proposal.status.toUpperCase() !== "DRAFT";
  const shareToken = shared && proposal.shareToken ? proposal.shareToken : null;
  return { ok: true, doc, shareToken, shareUrl: shareToken ? `${shareOrigin()}/p/${shareToken}` : null };
}

/** "Show family": the proposal exactly as the customer will see it. */
export async function loadProposalDocument(id: string): Promise<DocumentResult> {
  const auth = await session();
  if ("error" in auth) return { ok: false, error: auth.error ?? "Unavailable." };
  if (!UUID.test(id)) return { ok: false, error: "Price the proposal first." };
  try {
    return await proposalDocument(auth.token, id);
  } catch (error) {
    return { ok: false, error: error instanceof ApiError ? message(error) : "The proposal could not be loaded." };
  }
}

/** Shares the proposal (DRAFT → SHARED; the API records the SHARED event and locks the draft), then returns
    the document and share token for the PDF and link. Repeating it on a shared proposal is harmless. */
export async function shareProposal(id: string): Promise<DocumentResult> {
  const auth = await session();
  if ("error" in auth) return { ok: false, error: auth.error ?? "Unavailable." };
  if (!UUID.test(id)) return { ok: false, error: "Price the proposal first." };
  try {
    await apiFetch(`/api/v1/internal/proposals/${id}/share`, { method: "POST", token: auth.token });
    const result = await proposalDocument(auth.token, id);
    if (result.ok && !result.shareToken) return { ok: false, error: "The proposal was not shared. Try again." };
    return result;
  } catch (error) {
    return { ok: false, error: error instanceof ApiError ? message(error) : "The proposal could not be shared.", retryable: retryable(error) };
  }
}

const ACCEPT_ADMIN_ONLY = "Only an admin can record the acceptance. Ask an admin to confirm it on this screen.";

export type AcceptResult =
  | { ok: true; commercialCaseId: string; option: "essential" | "essential_addon" }
  | { ok: false; error: string; retryable?: boolean };

/** "Customer accepts": records the chosen option (mason-api Accept opens or finds the payments case and its
    revision). An overridden price may only be accepted by an admin. The proposal must be shared first. */
export async function acceptProposal(id: string, option: "essential" | "essential_addon"): Promise<AcceptResult> {
  const auth = await session();
  if ("error" in auth) return { ok: false, error: auth.error ?? "Unavailable." };
  if (!UUID.test(id)) return { ok: false, error: "Save the proposal first." };
  if (option !== "essential" && option !== "essential_addon") return { ok: false, error: "Choose an option." };
  // mason-api accepts from admins only (docs/proposals-web.md gap 9); refuse here before anything is sent.
  if (auth.user.role !== "ADMIN") return { ok: false, error: ACCEPT_ADMIN_ONLY };
  try {
    const current = await apiFetch<{ data: { override: ProposalRecord["override"] } }>(`/api/v1/internal/proposals/${id}`, { token: auth.token });
    if (current.data.override && auth.user.role !== "ADMIN") return { ok: false, error: "The price was overridden, so an admin must record the acceptance." };
    const response = await apiFetch<{ data: { commercialCaseId: string } }>(`/api/v1/internal/proposals/${id}/accept`, {
      method: "POST", token: auth.token, body: { option }
    });
    return { ok: true, commercialCaseId: response.data.commercialCaseId, option };
  } catch (error) {
    return { ok: false, error: error instanceof ApiError ? message(error) : "The acceptance could not be recorded.", retryable: retryable(error) };
  }
}

export type LostResult = { ok: true } | { ok: false; error: string; retryable?: boolean };

/** Marks the proposal lost with a reason (proposed mason-api endpoint, docs/proposals-web.md). */
export async function markProposalLost(id: string, reason: string, note: string): Promise<LostResult> {
  const auth = await session();
  if ("error" in auth) return { ok: false, error: auth.error ?? "Unavailable." };
  if (!UUID.test(id)) return { ok: false, error: "Save the proposal first." };
  const problem = lostProblem(reason, note);
  if (problem) return { ok: false, error: problem };
  try {
    await apiFetch(`/api/v1/internal/proposals/${id}/lost`, { method: "POST", token: auth.token, body: { reason, note: note.trim() || null } });
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404 && /not found|request failed/i.test(error.message) && !/proposal/i.test(error.message)) {
      return { ok: false, error: "Marking a proposal lost is not available on the server yet." };
    }
    return { ok: false, error: error instanceof ApiError ? message(error) : "The proposal could not be marked lost.", retryable: retryable(error) };
  }
}
