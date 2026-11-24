import { getPublicApiBaseUrl } from "../api";
import { isProposalView, SHARE_TOKEN_PATTERN, type ProposalView } from "./document";

/** The customer view for a share token, or null for an unknown, revoked or draft token (the API's 404). */
export async function fetchPublicView(token: string): Promise<ProposalView | null> {
  if (!SHARE_TOKEN_PATTERN.test(token)) return null;
  const response = await fetch(`${getPublicApiBaseUrl()}/api/v1/public/proposals/${token}`, {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Proposal view failed (${response.status}).`);
  const payload = (await response.json()) as { data?: unknown };
  if (!isProposalView(payload.data)) throw new Error("Proposal view has an unexpected shape.");
  return payload.data;
}
