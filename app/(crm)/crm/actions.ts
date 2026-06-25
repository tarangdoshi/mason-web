"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "../../../lib/api";
import { clearCrmSessionToken, getCrmSessionToken, requireCrmUser, setCrmSessionToken } from "../../../lib/crm";

export type LoginActionState = {
  error?: string;
};

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(formData: FormData, key: string) {
  const value = getRequiredString(formData, key);
  return value || undefined;
}

async function getRequiredToken() {
  const token = await getCrmSessionToken();
  if (!token) {
    redirect("/crm/login");
  }
  return token;
}

export async function loginAction(_: LoginActionState, formData: FormData): Promise<LoginActionState> {
  const email = getRequiredString(formData, "email").toLowerCase();
  const password = getRequiredString(formData, "password");

  if (!email || !password) {
    return { error: "Enter both email and password." };
  }

  try {
    const response = await apiFetch<{
      data: {
        token: string;
        expiresAt: string;
      };
    }>("/api/v1/internal/auth/login", {
      method: "POST",
      body: { email, password }
    });

    await setCrmSessionToken(response.data.token, response.data.expiresAt);
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    return { error: "Unable to sign in right now." };
  }

  redirect("/crm");
}

export async function logoutAction() {
  const token = await getCrmSessionToken();
  if (token) {
    try {
      await apiFetch<void>("/api/v1/internal/auth/logout", {
        method: "POST",
        token
      });
    } catch {
      // Ignore logout failures and clear the local cookie regardless.
    }
  }

  await clearCrmSessionToken();
  redirect("/crm/login");
}

export async function createLeadAction(formData: FormData) {
  const user = await requireCrmUser();
  const token = await getRequiredToken();

  const body = {
    type: getRequiredString(formData, "type"),
    channel: getRequiredString(formData, "channel"),
    priority: getRequiredString(formData, "priority"),
    customerName: getRequiredString(formData, "customerName"),
    phone: getRequiredString(formData, "phone"),
    city: getOptionalString(formData, "city"),
    locationText: getRequiredString(formData, "locationText"),
    packageCode: getOptionalString(formData, "packageCode"),
    assignedStaffId: user.role === "ADMIN" ? getOptionalString(formData, "assignedStaffId") ?? null : undefined,
    preferredCallbackAt: getOptionalString(formData, "preferredCallbackAt") ?? null,
    notesSummary: getOptionalString(formData, "notesSummary") ?? null,
    metadata: {
      source: "crm-manual"
    }
  };

  await apiFetch("/api/v1/internal/leads", {
    method: "POST",
    token,
    body
  });

  revalidatePath("/crm");
  redirect("/crm");
}

export async function updateLeadAction(formData: FormData) {
  await requireCrmUser();
  const token = await getRequiredToken();

  const leadId = getRequiredString(formData, "leadId");
  const redirectTo = getRequiredString(formData, "redirectTo") || `/crm/leads/${leadId}`;
  const rawStatus = getOptionalString(formData, "status");
  const rawPriority = getOptionalString(formData, "priority");
  const rawAssignedStaffId = formData.has("assignedStaffId") ? getRequiredString(formData, "assignedStaffId") : undefined;
  const rawNotesSummary = formData.has("notesSummary") ? getRequiredString(formData, "notesSummary") : undefined;

  const body: Record<string, string | null> = {};
  if (rawStatus) {
    body.status = rawStatus;
  }
  if (rawPriority) {
    body.priority = rawPriority;
  }
  if (rawAssignedStaffId !== undefined) {
    body.assignedStaffId = rawAssignedStaffId || null;
  }
  if (rawNotesSummary !== undefined) {
    body.notesSummary = rawNotesSummary || null;
  }

  await apiFetch(`/api/v1/internal/leads/${leadId}`, {
    method: "PATCH",
    token,
    body
  });

  revalidatePath("/crm");
  revalidatePath(`/crm/leads/${leadId}`);
  redirect(redirectTo);
}

export async function addLeadActivityAction(formData: FormData) {
  await requireCrmUser();
  const token = await getRequiredToken();

  const leadId = getRequiredString(formData, "leadId");
  const activityType = getRequiredString(formData, "activityType");
  const body = getRequiredString(formData, "body");

  await apiFetch(`/api/v1/internal/leads/${leadId}/activities`, {
    method: "POST",
    token,
    body: {
      activityType,
      body
    }
  });

  revalidatePath("/crm");
  revalidatePath(`/crm/leads/${leadId}`);
  redirect(`/crm/leads/${leadId}`);
}
