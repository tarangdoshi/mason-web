/**
 * Payment Link issuance as reported by the API's operational status. The API is authoritative;
 * the CRM only mirrors it, and anything other than an explicit `enabled: true` fails closed.
 */
export type PaymentIssuanceState = {
  enabled: boolean;
  reason: "enabled" | "disabled" | "unavailable";
  /** ADMIN-only problem codes from the API (never values). */
  problems: string[];
};

export const PAYMENT_STATUS_PATH = "/api/v1/internal/payments/status";
export const ISSUANCE_DISABLED_MESSAGE = "Payment Link issuance is not enabled in this environment. No link can be created.";
export const ISSUANCE_UNAVAILABLE_MESSAGE = "Payment Link issuance could not be confirmed with the payments service, so no link can be created right now.";

export async function readPaymentIssuance(load: () => Promise<unknown>): Promise<PaymentIssuanceState> {
  let body: unknown;
  try {
    body = await load();
  } catch {
    return { enabled: false, reason: "unavailable", problems: [] };
  }
  const data = body && typeof body === "object" ? (body as { data?: unknown }).data : undefined;
  const record = data && typeof data === "object" ? data as { issuance?: { enabled?: unknown }; problems?: unknown } : {};
  const problems = Array.isArray(record.problems) ? record.problems.filter((item): item is string => typeof item === "string") : [];
  return record.issuance?.enabled === true
    ? { enabled: true, reason: "enabled", problems }
    : { enabled: false, reason: "disabled", problems };
}

export function issuanceNotice(state: PaymentIssuanceState): string | null {
  if (state.enabled) return null;
  return state.reason === "unavailable" ? ISSUANCE_UNAVAILABLE_MESSAGE : ISSUANCE_DISABLED_MESSAGE;
}

/** Creates a link only after the API confirms issuance is enabled; otherwise never calls create. */
export async function issueIfEnabled<T>(load: () => Promise<unknown>, create: () => Promise<T>):
  Promise<{ issued: true; result: T } | { issued: false; message: string }> {
  const state = await readPaymentIssuance(load);
  if (!state.enabled) return { issued: false, message: issuanceNotice(state)! };
  return { issued: true, result: await create() };
}
