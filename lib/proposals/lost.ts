/* "Lost" reasons for a proposal the customer did not take. First cut: the CMO will refine the wording and the
   list. Keys are what the API stores (POST /api/v1/internal/proposals/:id/lost, docs/proposals-web.md), so a
   label can change freely; a new key needs the API to accept it too. */

export const LOST_REASONS = [
  { key: "price", label: "Price" },
  { key: "timing", label: "Timing" },
  { key: "family_decision", label: "Family decision" },
  { key: "not_needed", label: "Not needed" },
  { key: "other", label: "Other" }
] as const;

export type LostReason = (typeof LOST_REASONS)[number]["key"];

export const LOST_NOTE_MAX = 500;
export const LOST_OTHER_NOTE_MIN = 5;

const KEYS = new Set<string>(LOST_REASONS.map((reason) => reason.key));

export function isLostReason(value: unknown): value is LostReason {
  return typeof value === "string" && KEYS.has(value);
}

export function lostReasonLabel(key: string): string {
  return LOST_REASONS.find((reason) => reason.key === key)?.label ?? key;
}

/** The note is required for "Other" and optional otherwise. Like the display name, it must not carry contact
    details: notes are for the reason, never the customer's phone or email. */
export function lostProblem(reason: string, note: string): string | null {
  if (!isLostReason(reason)) return "Choose a reason.";
  const trimmed = note.trim();
  if (reason === "other" && trimmed.length < LOST_OTHER_NOTE_MIN) return "Say briefly why (at least 5 characters).";
  if (trimmed.length > LOST_NOTE_MAX) return `Keep the note to ${LOST_NOTE_MAX} characters.`;
  if (/\d{6,}/.test(trimmed.replace(/[\s-]/g, "")) || trimmed.includes("@")) return "Leave phone numbers and emails out of the note.";
  return null;
}
