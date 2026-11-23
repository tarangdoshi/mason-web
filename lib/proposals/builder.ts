import { PROPOSAL_COMPONENTS, type ProposalComponentKey } from "./components";

/** Mirrors mason-api `itemSchema` (docs/proposals.md). */
export type ItemState = "recommended" | "present" | "declined";
export type ItemTier = "essential" | "addon";

export type BuilderItem = {
  component: ProposalComponentKey;
  state: ItemState;
  qty: number;
  variant: string;
  tier: ItemTier;
};

export type ApiItem = {
  component: ProposalComponentKey;
  state: ItemState;
  qty: number;
  variant: string | null;
  tier: ItemTier;
};

export type BuilderDraft = {
  zohoLeadId: string;
  displayName: string;
  proposalDate: string;
  rooms: number;
  items: BuilderItem[];
};

export const ROOMS_MIN = 1;
export const ROOMS_MAX = 10;
export const QTY_MIN = 1;
export const QTY_MAX = 20;
export const DISPLAY_NAME_MAX = 80;
export const VARIANT_MAX = 60;
export const OVERRIDE_REASON_MIN = 10;
export const OVERRIDE_REASON_MAX = 500;

export function initialItems(): BuilderItem[] {
  return PROPOSAL_COMPONENTS.map((component) => ({ component: component.key, state: "recommended", qty: component.defaultQty, variant: "", tier: "essential" }));
}

export function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function toApiItems(items: BuilderItem[]): ApiItem[] {
  return items.map((item) => ({
    component: item.component,
    state: item.state,
    qty: clampInt(item.qty, QTY_MIN, QTY_MAX),
    variant: item.variant.trim() ? item.variant.trim().slice(0, VARIANT_MAX) : null,
    tier: item.tier
  }));
}

/** Same guard as the API: the display name is the only customer-identifying text, so no phone numbers or emails. */
export function displayNameProblem(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Enter the name the customer is addressed by, e.g. Mrs Fernandes.";
  if (trimmed.length > DISPLAY_NAME_MAX) return `Keep the display name to ${DISPLAY_NAME_MAX} characters.`;
  if (/\d{6,}/.test(trimmed.replace(/[\s-]/g, ""))) return "The display name must not contain a phone number.";
  if (trimmed.includes("@")) return "The display name must not contain an email address.";
  return null;
}

export function zohoLeadIdProblem(value: string): string | null {
  return /^\d{5,30}$/.test(value.trim()) ? null : "Enter the Zoho Lead ID (digits only).";
}

/** First problem that stops the draft being saved and priced, or null when it can be. */
export function draftProblem(draft: BuilderDraft): string | null {
  const lead = zohoLeadIdProblem(draft.zohoLeadId);
  if (lead) return lead;
  const name = displayNameProblem(draft.displayName);
  if (name) return name;
  if (!Number.isInteger(draft.rooms) || draft.rooms < ROOMS_MIN || draft.rooms > ROOMS_MAX) return `Rooms must be between ${ROOMS_MIN} and ${ROOMS_MAX}.`;
  if (!draft.items.some((item) => item.state === "recommended")) return "Recommend at least one component to price the proposal.";
  return null;
}

/** ISO date (YYYY-MM-DD) or null when the input is empty or malformed. */
export function proposalDateValue(value: string): string | null {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ? value : null;
}

/** Body for create (plus zohoLeadId) and PATCH. `proposalDate` is ignored by the API until it adds the
    field (zod strips unknown keys), then saved with no web change — see docs/proposals-web.md. */
export function draftBody(draft: BuilderDraft) {
  return { displayName: draft.displayName.trim(), rooms: draft.rooms, items: toApiItems(draft.items), proposalDate: proposalDateValue(draft.proposalDate) };
}

/** Key for "has anything saved with the draft changed since the last save and price". */
export function pricingKey(draft: BuilderDraft): string {
  return JSON.stringify(draftBody(draft));
}

export function rupeesToPaise(input: string): number | null {
  const cleaned = input.replace(/[₹,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const paise = Math.round(Number(cleaned) * 100);
  return Number.isSafeInteger(paise) && paise > 0 ? paise : null;
}

export function formatRupees(paise: number | null | undefined): string {
  if (paise === null || paise === undefined) return "—";
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export type OverrideInput = { essentialRupees: string; addonRupees: string; reason: string };
export type OverridePayload = { essentialPaise?: number; addonPaise?: number; reason: string };

export function overridePayload(input: OverrideInput, hasAddon: boolean): { ok: true; payload: OverridePayload } | { ok: false; error: string } {
  const reason = input.reason.trim();
  if (reason.length < OVERRIDE_REASON_MIN) return { ok: false, error: `Give a reason of at least ${OVERRIDE_REASON_MIN} characters.` };
  if (reason.length > OVERRIDE_REASON_MAX) return { ok: false, error: `Keep the reason to ${OVERRIDE_REASON_MAX} characters.` };
  const payload: OverridePayload = { reason };
  if (input.essentialRupees.trim()) {
    const paise = rupeesToPaise(input.essentialRupees);
    if (paise === null) return { ok: false, error: "Enter a valid Essential amount in rupees." };
    payload.essentialPaise = paise;
  }
  if (input.addonRupees.trim()) {
    if (!hasAddon) return { ok: false, error: "This proposal has no Add-on option to override." };
    const paise = rupeesToPaise(input.addonRupees);
    if (paise === null) return { ok: false, error: "Enter a valid Essential + Add-on amount in rupees." };
    payload.addonPaise = paise;
  }
  if (payload.essentialPaise === undefined && payload.addonPaise === undefined) return { ok: false, error: "Enter at least one overriding amount." };
  return { ok: true, payload };
}
