"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "../../../../lib/api";
import { getCrmSessionToken, requireAdminCrmUser, requireCrmUser } from "../../../../lib/crm";
import { issueIfEnabled, PAYMENT_STATUS_PATH } from "../../../../lib/payment-issuance";
import { RESOLUTION_NOTE_MESSAGE, resolutionNoteFrom } from "../../../../lib/payment-exception-review";

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function amountPaise(formData: FormData): number {
  const rupees = Number(field(formData, "amountRupees"));
  if (!Number.isFinite(rupees) || rupees <= 0 || !Number.isSafeInteger(Math.round(rupees * 100))) {
    throw new Error("Enter a valid positive amount.");
  }
  return Math.round(rupees * 100);
}

async function token() {
  await requireCrmUser();
  const value = await getCrmSessionToken();
  if (!value) redirect("/crm/login");
  return value;
}

function errorMessage(error: unknown): string {
  return error instanceof ApiError || error instanceof Error ? error.message : "Payment action failed.";
}

function detailUrl(caseId: string, error?: string, message?: string) {
  const query = new URLSearchParams();
  if (error) query.set("error", error);
  if (message) query.set("message", message);
  return `/crm/payments/${encodeURIComponent(caseId)}${query.size ? `?${query}` : ""}`;
}

export async function startCommercialCaseAction(formData: FormData) {
  const authToken = await token();
  const origin = field(formData, "origin");
  try {
    const response = await apiFetch<{ data: { id: string } }>("/api/v1/internal/commercial-cases", {
      method: "POST", token: authToken,
      body: origin === "ZOHO_LEAD"
        ? { origin, zohoLeadId: field(formData, "zohoLeadId"), assignedStaffId: field(formData, "assignedStaffId") || null }
        : { origin: "MASON_LEAD", leadRecordId: field(formData, "leadRecordId") }
    });
    revalidatePath("/crm/payments");
    redirect(detailUrl(response.data.id));
  } catch (error) {
    if (error instanceof ApiError) redirect(`/crm/payments?error=${encodeURIComponent(errorMessage(error))}`);
    throw error;
  }
}

export async function verifyLocationAction(formData: FormData) {
  await requireAdminCrmUser();
  const authToken = await token();
  const caseId = field(formData, "caseId");
  const placeId = field(formData, "placeId");
  let market: string | null;
  try {
    const response = await apiFetch<{ data: { verifiedLocationMarket: string | null } }>(
      `/api/v1/internal/commercial-cases/${caseId}/location-verification`,
      { method: "POST", token: authToken, body: placeId ? { placeId } : {} });
    market = response.data.verifiedLocationMarket;
  } catch (error) {
    if (error instanceof ApiError) redirect(detailUrl(caseId, errorMessage(error)));
    throw error;
  }
  revalidatePath(detailUrl(caseId));
  redirect(market === "GOA"
    ? detailUrl(caseId, undefined, "Goa service address verified from Google location evidence.")
    : detailUrl(caseId, `Google places this address outside Goa (${market ?? "unknown"}). Payment Links stay unavailable.`));
}

export async function approveRevisionAction(formData: FormData) {
  await requireAdminCrmUser();
  const authToken = await token();
  const caseId = field(formData, "caseId");
  let pendingCancellationRequestIds: string[];
  try {
    const response = await apiFetch<{ pendingCancellationRequestIds: string[] }>(`/api/v1/internal/commercial-cases/${caseId}/revisions`, {
      method: "POST", token: authToken,
      body: { packageCode: field(formData, "packageCode"), bathroomsCount: Number(field(formData, "bathroomsCount")),
        approvedAmountPaise: amountPaise(formData), reason: field(formData, "reason") || undefined }
    });
    pendingCancellationRequestIds = response.pendingCancellationRequestIds;
  } catch (error) {
    if (error instanceof ApiError || (error instanceof Error && error.message === "Enter a valid positive amount.")) {
      redirect(detailUrl(caseId, errorMessage(error)));
    }
    throw error;
  }
  revalidatePath(detailUrl(caseId));
  redirect(detailUrl(caseId, undefined, pendingCancellationRequestIds.length
    ? "Revision approved. An old link still needs cancellation or reconciliation before a replacement can be issued."
    : "Commercial revision approved."));
}

export async function createPaymentLinkAction(formData: FormData) {
  const authToken = await token();
  const caseId = field(formData, "caseId");
  try {
    // An ADMIN may enter a partial amount; without one the API requests the full outstanding balance.
    // The API validates the amount (0 < amount <= outstanding) and who may choose it.
    const body = field(formData, "amountRupees") ? { amountPaise: amountPaise(formData) } : undefined;
    // The API's issuance switch is authoritative; the CRM also refuses to send the request while it is off.
    const outcome = await issueIfEnabled(() => apiFetch(PAYMENT_STATUS_PATH, { token: authToken }),
      () => apiFetch(`/api/v1/internal/commercial-cases/${caseId}/payment-links`, { method: "POST", token: authToken, body }));
    if (!outcome.issued) redirect(detailUrl(caseId, outcome.message));
    revalidatePath(detailUrl(caseId));
    redirect(detailUrl(caseId, undefined, "Payment Link created. It is a request for payment, not money received; review the amount before sharing."));
  } catch (error) {
    if (error instanceof ApiError || (error instanceof Error && error.message === "Enter a valid positive amount.")) {
      redirect(detailUrl(caseId, errorMessage(error)));
    }
    throw error;
  }
}

export async function cancelPaymentLinkAction(formData: FormData) {
  await requireAdminCrmUser();
  const authToken = await token();
  const caseId = field(formData, "caseId");
  try {
    await apiFetch(`/api/v1/internal/payment-links/${field(formData, "requestId")}/cancel`, { method: "POST", token: authToken });
    revalidatePath(detailUrl(caseId));
    redirect(detailUrl(caseId, undefined, "Razorpay cancellation verified."));
  } catch (error) {
    if (error instanceof ApiError) redirect(detailUrl(caseId, errorMessage(error)));
    throw error;
  }
}

export async function reconcilePaymentLinkAction(formData: FormData) {
  await requireAdminCrmUser();
  const authToken = await token();
  const caseId = field(formData, "caseId");
  try {
    await apiFetch(`/api/v1/internal/payment-links/${field(formData, "requestId")}/reconcile`, { method: "POST", token: authToken });
    revalidatePath(detailUrl(caseId));
    redirect(detailUrl(caseId, undefined, "Razorpay status reconciled. Review the updated balance and exceptions."));
  } catch (error) {
    if (error instanceof ApiError) redirect(detailUrl(caseId, errorMessage(error)));
    throw error;
  }
}

export async function recordOfflineCollectionAction(formData: FormData) {
  await requireAdminCrmUser();
  const authToken = await token();
  const caseId = field(formData, "caseId");
  let pendingCancellationRequestIds: string[];
  try {
    const response = await apiFetch<{ pendingCancellationRequestIds: string[] }>(`/api/v1/internal/commercial-cases/${caseId}/offline-collections`, {
      method: "POST", token: authToken,
      body: { idempotencyKey: field(formData, "idempotencyKey"), amountPaise: amountPaise(formData),
        method: field(formData, "method"), collectedAt: new Date().toISOString(),
        externalReference: field(formData, "externalReference") || undefined,
        note: field(formData, "note") || undefined }
    });
    pendingCancellationRequestIds = response.pendingCancellationRequestIds;
  } catch (error) {
    if (error instanceof ApiError || (error instanceof Error && error.message === "Enter a valid positive amount.")) {
      redirect(detailUrl(caseId, errorMessage(error)));
    }
    throw error;
  }
  revalidatePath(detailUrl(caseId));
  redirect(detailUrl(caseId, undefined, pendingCancellationRequestIds.length
    ? "Collection recorded. A Payment Link still needs cancellation or reconciliation."
    : "Offline collection recorded."));
}

/** Records an ADMIN review of the exception state shown on the page; the API refuses it if that state changed. */
export async function reviewPaymentExceptionAction(formData: FormData) {
  await requireAdminCrmUser();
  const authToken = await token();
  const caseId = field(formData, "caseId");
  try {
    await apiFetch(`/api/v1/internal/commercial-cases/${caseId}/exception-reviews`, {
      method: "POST", token: authToken,
      body: { resolutionNote: resolutionNoteFrom(formData.get("resolutionNote")), exceptionVersion: field(formData, "exceptionVersion") }
    });
  } catch (error) {
    if (error instanceof ApiError || (error instanceof Error && error.message === RESOLUTION_NOTE_MESSAGE)) {
      redirect(detailUrl(caseId, errorMessage(error)));
    }
    throw error;
  }
  revalidatePath(detailUrl(caseId));
  redirect(detailUrl(caseId, undefined, "Exception review recorded. Payments, collections and provider records are unchanged."));
}

export async function reverseOfflineCollectionAction(formData: FormData) {
  await requireAdminCrmUser();
  const authToken = await token();
  const caseId = field(formData, "caseId");
  let correctionMayBeNeeded = false;
  try {
    const response = await apiFetch<{ data: { acknowledgement?: { correctionMayBeNeeded?: boolean } } }>(
      `/api/v1/internal/offline-collections/${field(formData, "paymentId")}/reverse`, {
        method: "POST", token: authToken, body: { reason: field(formData, "reason") }
      });
    correctionMayBeNeeded = response.data.acknowledgement?.correctionMayBeNeeded === true;
  } catch (error) {
    if (error instanceof ApiError) redirect(detailUrl(caseId, errorMessage(error)));
    throw error;
  }
  revalidatePath(detailUrl(caseId));
  redirect(detailUrl(caseId, undefined, correctionMayBeNeeded
    ? "Offline correction recorded. A payment acknowledgement for this entry had already been sent or was being sent; the customer may need a correction message."
    : "Offline correction recorded without changing payment history. Any unsent acknowledgement was withdrawn."));
}
