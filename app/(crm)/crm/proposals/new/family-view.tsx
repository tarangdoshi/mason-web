"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import ProposalDocument from "../../../../../components/proposals/ProposalDocument";
import type { ProposalDoc } from "../../../../../lib/proposals/document";
import styles from "./family.module.css";

type WakeLockSentinelLike = { release: () => Promise<void> };
type WakeLockNavigator = Navigator & { wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> } };

/** Full-screen "Show family": the customer document only, no staff controls, screen kept awake.
    The small close button or Esc ends it. Leaving browser full screen (e.g. a system gesture) keeps the view
    open, so a stray swipe never drops the family back into the staff screen. */
export default function FamilyView({ doc, onClose }: { doc: ProposalDoc; onClose: () => void }) {
  const lock = useRef<WakeLockSentinelLike | null>(null);

  useEffect(() => {
    let active = true;
    const nav = navigator as WakeLockNavigator;
    const acquire = async () => {
      if (!active || document.visibilityState !== "visible" || !nav.wakeLock) return;
      try {
        await lock.current?.release().catch(() => undefined); // never hold two
        lock.current = await nav.wakeLock.request("screen");
      } catch {
        lock.current = null; // battery saver or unsupported: the view still works
      }
    };
    void acquire();
    // The browser drops the wake lock when the tab is hidden; take it again on return.
    const onVisibility = () => void acquire();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      void lock.current?.release().catch(() => undefined);
      lock.current = null;
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    };
  }, [onClose]);

  // Portalled to <body>: inside the sticky totals panel it would sit under the CRM header (stacking context).
  return createPortal(
    <div className={styles.family} role="dialog" aria-modal="true" aria-label="Proposal" data-testid="family-view">
      <button type="button" className={styles.close} onClick={onClose} aria-label="Close" data-testid="family-close">
        ×
      </button>
      <ProposalDocument doc={doc} idPrefix="family" />
    </div>,
    document.body
  );
}
