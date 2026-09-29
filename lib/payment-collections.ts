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

type Cause = { kind: "PAYMENT"; paymentId: string } | { kind: "REVISION"; revisionNumber: number };
type LedgerPayment = { id: string; amountPaise: number; source: string; recordType: string; method: string | null };

const formatRupees = (paise: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paise / 100);

/** Names the ledger entry that started or ended an overcollection period, e.g. "Reversal of cash ₹1,000.00". */
export function ledgerCauseLabel(cause: Cause, payments: LedgerPayment[]): string {
  if (cause.kind === "REVISION") return `Revision ${cause.revisionNumber}`;
  const payment = payments.find((row) => row.id === cause.paymentId);
  if (!payment) return "Ledger entry";
  const via = payment.source === "RAZORPAY" ? "Razorpay" : (payment.method ?? "offline").toLowerCase();
  return `${payment.recordType === "REVERSAL" ? "Reversal of" : "Collection by"} ${via} ${formatRupees(payment.amountPaise)}`;
}

/** Paise to the plain rupee value used to prefill an amount input (e.g. 1699900 → "16999.00"). */
export function rupeeInputValue(paise: number): string {
  return (paise / 100).toFixed(2);
}
