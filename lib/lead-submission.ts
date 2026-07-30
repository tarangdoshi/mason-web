/**
 * Submission transport for the public assessment form.
 *
 * Kept separate from the component so every branch the form has to render
 * (success, field-level validation, server error, network failure) is a plain
 * value that can be asserted in tests.
 */

export type LeadFieldErrors = Record<string, string[]>;

export type LeadSubmissionResult =
  | { ok: true; leadId: string | null; locationMarket: string | null }
  | { ok: false; kind: "validation"; message: string; fieldErrors: LeadFieldErrors }
  | { ok: false; kind: "server"; message: string }
  | { ok: false; kind: "network"; message: string };

export const GENERIC_SUBMIT_ERROR = "Something went wrong on our side. Please try again.";
export const NETWORK_SUBMIT_ERROR =
  "We couldn't reach Mason. Check your connection and try again — your details are still here.";
export const VALIDATION_SUBMIT_ERROR = "Please check the highlighted fields and try again.";

type ApiErrorBody = {
  error?: string;
  issues?: { fieldErrors?: LeadFieldErrors };
};

type ApiSuccessBody = {
  data?: { id?: string; locationMarket?: string };
};

export async function submitGuidanceLead(
  payload: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch
): Promise<LeadSubmissionResult> {
  let response: Response;
  try {
    response = await fetchImpl("/api/leads/guidance", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload)
    });
  } catch {
    return { ok: false, kind: "network", message: NETWORK_SUBMIT_ERROR };
  }

  if (response.ok) {
    const body = (await response.json().catch(() => null)) as ApiSuccessBody | null;
    return {
      ok: true,
      leadId: body?.data?.id ?? null,
      locationMarket: body?.data?.locationMarket ?? null
    };
  }

  const body = (await response.json().catch(() => null)) as ApiErrorBody | null;

  if (response.status === 400) {
    const fieldErrors = body?.issues?.fieldErrors ?? {};
    const firstFieldMessage = Object.values(fieldErrors)[0]?.[0];
    return {
      ok: false,
      kind: "validation",
      message: firstFieldMessage || body?.error || VALIDATION_SUBMIT_ERROR,
      fieldErrors
    };
  }

  return { ok: false, kind: "server", message: body?.error || GENERIC_SUBMIT_ERROR };
}

export type ValidationFeedback = {
  /** First message per field, ready to render beside each input. */
  fieldErrors: Record<string, string>;
  /** Field to focus, or null when no inline-capable field is affected. */
  focusField: string | null;
  /** Generic banner, suppressed when an inline field error is shown instead. */
  bannerMessage: string | null;
};

/**
 * Maps an API validation response onto what the form should show.
 *
 * `inlineFieldOrder` lists the fields that render their own inline error, in
 * the form's visual order — extending this to a new field is one entry here
 * plus its inline error markup, with no change to this logic.
 *
 * A field error on a field that cannot show one inline (or a validation error
 * carrying no field errors at all) keeps the generic banner, so a failure is
 * never silent.
 */
export function resolveValidationFeedback(
  result: { fieldErrors: LeadFieldErrors; message: string },
  inlineFieldOrder: readonly string[]
): ValidationFeedback {
  const fieldErrors: Record<string, string> = {};
  for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
    if (messages?.[0]) {
      fieldErrors[field] = messages[0];
    }
  }

  const focusField = inlineFieldOrder.find((field) => fieldErrors[field]) ?? null;

  return {
    fieldErrors,
    focusField,
    bannerMessage: focusField ? null : result.message
  };
}

/**
 * Guards against duplicate leads: a second submit is refused while one is in
 * flight, and permanently once a lead has been created.
 */
export function createSubmissionGate() {
  let inFlight = false;
  let completed = false;

  return {
    tryBegin(): boolean {
      if (inFlight || completed) {
        return false;
      }
      inFlight = true;
      return true;
    },
    release() {
      inFlight = false;
    },
    complete() {
      inFlight = false;
      completed = true;
    },
    get isCompleted() {
      return completed;
    }
  };
}
