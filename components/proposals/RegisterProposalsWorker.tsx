"use client";

import { useEffect } from "react";

/** Registers the proposals service worker (public/proposals-sw.js) for one scope: the staff screen
    (/crm/proposals/) or the customer page (/p/). Rendered only on flag-gated pages, so it stays dark. */
export const PROPOSALS_SW_URL = "/proposals-sw.js";

export default function RegisterProposalsWorker({ scope }: { scope: "/crm/proposals/" | "/p/" }) {
  useEffect(() => {
    // Production builds only (hashed, immutable build files); NEXT_PUBLIC_PROPOSALS_SW_DEV=true enables it on a
    // dev server for the Playwright offline test. A dev server otherwise never caches its changing files.
    const enabled = process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_PROPOSALS_SW_DEV === "true";
    if (!enabled || !("serviceWorker" in navigator) || !window.isSecureContext) return;
    navigator.serviceWorker.register(PROPOSALS_SW_URL, { scope, updateViaCache: "none" }).catch(() => undefined);
  }, [scope]);
  return null;
}
