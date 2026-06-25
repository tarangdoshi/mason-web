"use client";

import { apiFetch } from "../../lib/api";

export const ADMIN_TOKEN_KEY = "mason-admin-token";

type LoginResponse = {
  data: {
    token: string;
    expiresAt: string;
    staffUser: {
      id: string;
      fullName: string;
      email: string;
      role: "ADMIN" | "AGENT";
    };
  };
};

type MeResponse = {
  data: {
    id: string;
    fullName: string;
    email: string;
    role: "ADMIN" | "AGENT";
  };
};

export function getAdminToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string) {
  window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export async function loginAdmin(email: string, password: string) {
  const response = await apiFetch<LoginResponse>("/api/v1/internal/auth/login", {
    method: "POST",
    body: { email, password }
  });

  setAdminToken(response.data.token);
  return response.data;
}

export async function fetchAdminMe(token: string) {
  const response = await apiFetch<MeResponse>("/api/v1/internal/auth/me", {
    token
  });

  return response.data;
}
