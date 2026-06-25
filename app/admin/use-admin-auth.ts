"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAdminToken, fetchAdminMe, getAdminToken } from "./auth";

export function useAdminAuth() {
  const router = useRouter();
  const [state, setState] = useState<{
    loading: boolean;
    token: string | null;
    user: { id: string; fullName: string; email: string; role: "ADMIN" | "AGENT" } | null;
    error: string | null;
  }>({
    loading: true,
    token: null,
    user: null,
    error: null
  });

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.replace("/admin/login");
      setState({ loading: false, token: null, user: null, error: null });
      return;
    }

    fetchAdminMe(token)
      .then((user) => {
        if (user.role !== "ADMIN") {
          clearAdminToken();
          router.replace("/admin/login");
          setState({ loading: false, token: null, user: null, error: "Admin access required." });
          return;
        }
        setState({ loading: false, token, user, error: null });
      })
      .catch((error: Error) => {
        clearAdminToken();
        router.replace("/admin/login");
        setState({ loading: false, token: null, user: null, error: error.message });
      });
  }, [router]);

  return state;
}
