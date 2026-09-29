/**
 * Payment exception review, as reported by the API. The API is authoritative: it decides whether an
 * exception is unreviewed and records reviews. The CRM only presents that state and never treats a
 * case as reviewed unless the API says so.
 */
export type ExceptionReviewStatus = "NONE" | "UNRESOLVED" | "REVIEWED";

export type ExceptionReviewView = {
  status: ExceptionReviewStatus;
  version: string | null;
  unresolvedNote: string | null;
  reviewedNote: string | null;
  reviews: Array<{
    id: string;
    resolutionNote: string;
    createdAt: string;
    coveredNote: string;
    valid: boolean;
    reviewedByStaff?: { id: string; fullName: string } | null;
  }>;
};

export const MIN_RESOLUTION_NOTE = 5;
export const MAX_RESOLUTION_NOTE = 2000;
export const RESOLUTION_NOTE_MESSAGE = `Enter resolution notes (${MIN_RESOLUTION_NOTE}-${MAX_RESOLUTION_NOTE} characters).`;
export const REVIEW_DISCLAIMER = "This records an administrative review. It does not alter payments, collections or provider records.";

/** Falls back to "unreviewed" when an older API sends only the raw note, so the CRM never under-blocks. */
export function exceptionReviewOf(item: { exceptionNote: string | null; exceptionReview?: ExceptionReviewView | null }): ExceptionReviewView {
  if (item.exceptionReview) return item.exceptionReview;
  const note = item.exceptionNote?.trim() || null;
  return { status: note ? "UNRESOLVED" : "NONE", version: null, unresolvedNote: note, reviewedNote: null, reviews: [] };
}

export function exceptionListLabel(status: ExceptionReviewStatus): string | null {
  return status === "UNRESOLVED" ? "Exception — review required" : null;
}

export function resolutionNoteFrom(value: FormDataEntryValue | null): string {
  const note = typeof value === "string" ? value.trim() : "";
  if (note.length < MIN_RESOLUTION_NOTE || note.length > MAX_RESOLUTION_NOTE) throw new Error(RESOLUTION_NOTE_MESSAGE);
  return note;
}
