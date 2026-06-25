import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "./api";

export const CRM_SESSION_COOKIE = "mason-crm-session";

export type StaffUser = {
  id: string;
  fullName: string;
  email: string;
  role: "ADMIN" | "AGENT";
};

export async function getCrmSessionToken() {
  const store = await cookies();
  return store.get(CRM_SESSION_COOKIE)?.value ?? null;
}

export async function setCrmSessionToken(token: string, expiresAt: string | Date) {
  const store = await cookies();
  store.set(CRM_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt)
  });
}

export async function clearCrmSessionToken() {
  const store = await cookies();
  store.delete(CRM_SESSION_COOKIE);
}

export async function getCurrentStaffUser(): Promise<StaffUser | null> {
  const token = await getCrmSessionToken();
  if (!token) {
    return null;
  }

  try {
    const response = await apiFetch<{ data: StaffUser }>("/api/v1/internal/auth/me", {
      token
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await clearCrmSessionToken();
      return null;
    }
    throw error;
  }
}

export async function requireCrmUser() {
  const user = await getCurrentStaffUser();
  if (!user) {
    redirect("/crm/login");
  }

  return user;
}

export async function requireAdminCrmUser() {
  const user = await requireCrmUser();
  if (user.role !== "ADMIN") {
    redirect("/crm");
  }

  return user;
}
