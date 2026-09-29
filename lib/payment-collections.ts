/**
 * Display helpers for the server-derived collection balance. The API is the only authority for
 * amounts; these only label and format what it returns.
 */
const STATE_LABELS: Record<string, string> = {
  UNPAID: "Nothing collected",
  PARTIALLY_PAID: "Partially collected",
  PAID: "Fully collected",
  OVERPAID_EXCEPTION: "Overcollected — admin review"
};

export function paymentStateLabel(state: string | null | undefined): string {
  return state ? STATE_LABELS[state] ?? state.replaceAll("_", " ") : "Awaiting approval";
}

/** Paise to the plain rupee value used to prefill an amount input (e.g. 1699900 → "16999.00"). */
export function rupeeInputValue(paise: number): string {
  return (paise / 100).toFixed(2);
}
